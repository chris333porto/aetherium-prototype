-- ============================================================
-- Aetherium — Migration 003: Current alignment
-- 2026-03-27
--
-- Closes two gaps between the current frontend intake and the
-- live Supabase schema:
--
--   1. profiles table — permanent user identity storage.
--      Collected on /assessment/identity but had no home in DB.
--      Fields: email, first_name, last_name, birth_date,
--              city, region, country, timezone.
--
--   2. profile_id FK — links assessments and profile_states
--      to a profile row once the user saves their profile.
--
--   3. narrative_context jsonb — extends profile_states to
--      carry all 9 narrative fields. Without this column,
--      fetchAndReconstructPayload() can only recover 3 of 9
--      fields when rebuilding results from Supabase.
--
-- Additive only. Nothing is dropped or renamed.
-- Safe to run against a live database.
-- ============================================================


-- ── 1. profiles ───────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id           uuid        primary key default gen_random_uuid(),
  created_at   timestamptz not null    default now(),
  updated_at   timestamptz not null    default now(),

  -- Optional auth link. Null for anonymous profile saves.
  -- Populated once the user creates an account.
  user_id      uuid        unique references auth.users(id) on delete set null,

  -- Identity fields from /assessment/identity
  email        text        unique not null,
  first_name   text        not null,
  last_name    text        not null,
  birth_date   date,
  city         text,
  region       text,
  country      text,
  timezone     text,          -- IANA timezone string, auto-detected in browser

  metadata     jsonb       not null    default '{}'::jsonb
  -- metadata reserved for: phone, avatar_url, and future identity fields
);

comment on table public.profiles is
  'Permanent user identity record. One row per person. Created when the user '
  'saves their profile after completing the assessment. Stable across reassessments.';

comment on column public.profiles.user_id    is 'Links to auth.users once account is created. Null for anonymous saves.';
comment on column public.profiles.birth_date is 'ISO 8601 date. Stored as date type (no time component).';
comment on column public.profiles.timezone   is 'IANA timezone string, auto-detected via Intl.DateTimeFormat in browser.';
comment on column public.profiles.metadata   is 'Extensible JSON for future fields: phone, avatar_url, etc.';

-- updated_at trigger (reuses the function created in 002)
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index if not exists profiles_user_id_idx
  on public.profiles (user_id)
  where user_id is not null;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;

-- Users read their own profile; null user_id = anonymous guest save
create policy "profiles_select"
  on public.profiles for select
  using (auth.uid() = user_id or user_id is null);

-- Anyone can create a profile (anonymous saves allowed)
create policy "profiles_insert"
  on public.profiles for insert
  with check (true);

-- Users update only their own profile
create policy "profiles_update"
  on public.profiles for update
  using (auth.uid() = user_id or user_id is null);


-- ── 2. Profile FK on assessments and profile_states ──────────────────────────
-- Nullable: existing anonymous rows are unaffected.
-- Populated when the user saves their profile post-results.

alter table public.assessments
  add column if not exists profile_id uuid
    references public.profiles(id) on delete set null;

alter table public.profile_states
  add column if not exists profile_id uuid
    references public.profiles(id) on delete set null;

create index if not exists assessments_profile_id_idx
  on public.assessments (profile_id)
  where profile_id is not null;

create index if not exists profile_states_profile_id_idx
  on public.profile_states (profile_id)
  where profile_id is not null;


-- ── 3. Extended narrative context on profile_states ───────────────────────────
-- The 6 new narrative fields added in the 9-prompt intake expansion are stored
-- in assessment_answers as individual rows (audit log). But profile_states
-- needs them directly so fetchAndReconstructPayload() can return the full
-- narrative context without a secondary join.
--
-- Stored as jsonb rather than 6 individual columns because:
--   a) The intake model is still evolving — new fields shouldn't require migrations
--   b) These fields are context for AI interpretation, not individual query targets
--   c) One column handles current and future narrative expansion cleanly
--
-- Expected shape:
-- {
--   "environment":       "...",
--   "recurring_pattern": "...",
--   "avoidance":         "...",
--   "deeper_pull":       "...",
--   "energy_state":      "Focused",
--   "energy_sources":    "..."
-- }
--
-- Historical rows that predate this migration will have narrative_context = '{}'
-- and the original 3 named columns for whatever data was captured.

alter table public.profile_states
  add column if not exists narrative_context jsonb not null default '{}'::jsonb;

comment on column public.profile_states.narrative_context is
  'Extended narrative fields beyond the original 3 named columns. '
  'Keys: environment, recurring_pattern, avoidance, deeper_pull, energy_state, energy_sources. '
  'Empty object for profile_states created before migration 003.';
