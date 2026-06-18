-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 014: Durable Trinity store  (7-day-trial build · Phase 1 — Identity)
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- The practice app's Trinity is currently STATELESS across days: it is told it
-- remembers, but is given nothing to remember from. This migration lays the
-- per-user durable store that Phase 3 (memory injection) reads before each LLM
-- turn and that the daily reflection pass writes after each session.
--
-- IDENTITY MODEL (v1 — free trial, low friction):
--   token-as-identity. The discovery handoff token (migration 013) IS the user
--   key. No password/sign-in for v1. Trade-off: identity is device-bound to the
--   token in localStorage — losing storage loses the evolving map. Phase 1.5 adds
--   magic-link (Supabase Auth) so a practitioner can return on a new device; the
--   `email` column here is the reconciliation anchor for that upgrade.
--
-- Mirrors the 013 capability pattern: anon may INSERT; NO direct SELECT; all
-- reads/writes go through SECURITY DEFINER RPCs scoped to a single token, so
-- possession of the token (not table-wide access) is the capability.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. trinity_state — one evolving row per practitioner ────────────────────────

create table if not exists public.trinity_state (
  token              text        primary key,   -- = discovery_results.token (identity)
  email              text,                       -- reconciliation anchor for Phase 1.5 auth (never exposed via RPC)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Trial clock
  trial_started_at   timestamptz,
  day_in_journey     int         not null default 0,   -- 0 = not started; 1–7 across the trial

  -- The Durable Trinity (Role / Context / Direction) — the spine Trinity refines
  role               text,
  context            text,
  direction          text,

  -- Accumulating cartography: themes, illuminated coordinates, per-day deltas,
  -- what's mapped vs still-unmapped. Shape stays flexible while the design settles.
  consciousness_map  jsonb       not null default '{}'::jsonb,

  -- Rolling summary the next session injects as "what I remember about you"
  last_session_summary text
);

-- ── 2. trinity_sessions — append-only per-day conversation record ───────────────

create table if not exists public.trinity_sessions (
  id                 uuid        primary key default gen_random_uuid(),
  token              text        not null,        -- the practitioner (trinity_state.token)
  day                int,                          -- day_in_journey at time of session
  started_at         timestamptz not null default now(),
  ended_at           timestamptz,
  transcript         jsonb,                        -- [{ role, text, ts }, …]
  summary            text,                         -- post-session reflection-pass summary
  extracted_deltas   jsonb       not null default '{}'::jsonb  -- what this session changed in the map
);

create index if not exists trinity_sessions_token_started_idx
  on public.trinity_sessions (token, started_at desc);

-- ── 3. RLS — anon may write, no direct reads (capability via RPCs below) ────────

alter table public.trinity_state    enable row level security;
alter table public.trinity_sessions enable row level security;

create policy "anon can insert trinity_state"
  on public.trinity_state    for insert to anon, authenticated with check (true);

create policy "anon can insert trinity_sessions"
  on public.trinity_sessions for insert to anon, authenticated with check (true);

-- No SELECT/UPDATE policies → direct reads/updates denied; use the RPCs.

-- ── 4. RPCs — all token-scoped, SECURITY DEFINER ───────────────────────────────

-- 4a. Read the durable state for memory injection (omits email per 013's stance).
create or replace function public.get_trinity_state(p_token text)
returns table (
  trial_started_at     timestamptz,
  day_in_journey       int,
  role                 text,
  context              text,
  direction            text,
  consciousness_map    jsonb,
  last_session_summary text,
  updated_at           timestamptz
)
language sql security definer set search_path = public as $$
  select trial_started_at, day_in_journey, role, context, direction,
         consciousness_map, last_session_summary, updated_at
  from public.trinity_state where token = p_token limit 1;
$$;

-- 4b. Upsert the durable state (the daily reflection pass writes deltas here).
--     Null args leave existing values unchanged on update.
create or replace function public.upsert_trinity_state(
  p_token text,
  p_email text default null,
  p_role text default null,
  p_context text default null,
  p_direction text default null,
  p_consciousness_map jsonb default null,
  p_last_session_summary text default null,
  p_day_in_journey int default null,
  p_start_trial boolean default false
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.trinity_state as t (
    token, email, role, context, direction, consciousness_map,
    last_session_summary, day_in_journey, trial_started_at
  ) values (
    p_token, p_email, p_role, p_context, p_direction,
    coalesce(p_consciousness_map, '{}'::jsonb),
    p_last_session_summary, coalesce(p_day_in_journey, 0),
    case when p_start_trial then now() else null end
  )
  on conflict (token) do update set
    email                = coalesce(p_email, t.email),
    role                 = coalesce(p_role, t.role),
    context              = coalesce(p_context, t.context),
    direction            = coalesce(p_direction, t.direction),
    consciousness_map    = coalesce(p_consciousness_map, t.consciousness_map),
    last_session_summary = coalesce(p_last_session_summary, t.last_session_summary),
    day_in_journey       = coalesce(p_day_in_journey, t.day_in_journey),
    trial_started_at     = case
                             when p_start_trial and t.trial_started_at is null then now()
                             else t.trial_started_at
                           end,
    updated_at           = now();
end;
$$;

-- 4c. Recent sessions for the "what we talked about lately" recap injection.
create or replace function public.recent_trinity_sessions(p_token text, p_limit int default 3)
returns table (day int, started_at timestamptz, summary text, extracted_deltas jsonb)
language sql security definer set search_path = public as $$
  select day, started_at, summary, extracted_deltas
  from public.trinity_sessions
  where token = p_token and summary is not null
  order by started_at desc
  limit greatest(1, least(p_limit, 14));
$$;

grant execute on function public.get_trinity_state(text)                                   to anon, authenticated;
grant execute on function public.upsert_trinity_state(text,text,text,text,text,jsonb,text,int,boolean) to anon, authenticated;
grant execute on function public.recent_trinity_sessions(text,int)                          to anon, authenticated;
