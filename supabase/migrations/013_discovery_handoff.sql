-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 013: Discovery → Trial handoff
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- The gateway computes a full discovery result (archetype + 5 dimension scores)
-- entirely client-side; only name/email/archetype_id land in discovery_emails
-- (migration 011). To populate the practice app's Profile when a user crosses
-- from /discovery into the seven-day trial, we need a token-addressable copy of
-- the FULL result that the (separate, auth-less) practice app can fetch.
--
-- Design:
--   · `discovery_results` — one row per completed discovery, keyed by an opaque
--     token (the gateway generates a UUID, hands it to the practice app via the
--     ?t= query param on the trial link).
--   · anon may INSERT (the gateway writes pre-auth, like the guestbook).
--   · NO anon SELECT policy — a public SELECT would let anyone enumerate every
--     practitioner's PII (name/email). Instead reads go through a SECURITY
--     DEFINER RPC that returns exactly ONE row for a known token, so possession
--     of the token (not table-wide access) is the capability.
--   · the RPC returns the practice-app-relevant fields only (no email) — the
--     practice app needs name + archetype + scores to render the Profile, not
--     the email address.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. discovery_results ───────────────────────────────────────────────────────

create table if not exists public.discovery_results (
  token              text        primary key,
  created_at         timestamptz not null default now(),
  name               text,
  email              text,
  archetype_id       text        not null,
  archetype_name     text,
  dimension_scores   jsonb       not null,   -- { aether, fire, air, water, earth }
  dominant_dimension text        not null
);

create index if not exists discovery_results_created_at_idx
  on public.discovery_results (created_at desc);

-- RLS: anon can insert a result (pre-auth handoff write), but cannot list/read
-- the table directly. Reads happen only through get_discovery_result() below.
alter table public.discovery_results enable row level security;

create policy "anon can write a discovery result"
  on public.discovery_results
  for insert
  to anon, authenticated
  with check (true);

-- No SELECT policy → direct table reads are denied to anon/authenticated.

-- ── 2. get_discovery_result(token) — token-scoped read ──────────────────────────
--
-- SECURITY DEFINER bypasses RLS for this single-row, token-addressed lookup.
-- Deliberately omits `email` from the projection: the practice app renders the
-- Profile from name + archetype + scores and has no need for the address.

create or replace function public.get_discovery_result(p_token text)
returns table (
  name               text,
  archetype_id       text,
  archetype_name     text,
  dimension_scores   jsonb,
  dominant_dimension text,
  created_at         timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    name,
    archetype_id,
    archetype_name,
    dimension_scores,
    dominant_dimension,
    created_at
  from public.discovery_results
  where token = p_token
  limit 1;
$$;

grant execute on function public.get_discovery_result(text) to anon, authenticated;
