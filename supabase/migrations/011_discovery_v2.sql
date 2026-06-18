-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 011: Discovery v2 parallel flow support
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Two tiny additions to support the parallel /discovery flow without touching
-- any existing tables' semantics:
--
--   1. `assessments.source` — nullable text tag so we can distinguish rows
--      produced by /discovery ('discovery_v2') from the legacy flow (NULL).
--      No existing rows are updated; no reads are affected.
--
--   2. `discovery_emails` — soft guestbook for pre-auth email capture.
--      The existing profiles table requires first_name NOT NULL, so a plain
--      email can't land there. This table exists purely for "left their
--      email, haven't signed up yet" records.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. assessments.source ──────────────────────────────────────────────────────

alter table public.assessments
  add column if not exists source text;

comment on column public.assessments.source is
  'Flow version tag. Values: ''discovery_v2'' for the parallel flow at /discovery, NULL for legacy /assessment flow.';

create index if not exists assessments_source_idx on public.assessments (source)
  where source is not null;

-- ── 2. discovery_emails (soft guestbook) ───────────────────────────────────────

create table if not exists public.discovery_emails (
  id           uuid        primary key default gen_random_uuid(),
  created_at   timestamptz not null    default now(),
  name         text,                                  -- optional; some sign without
  email        text        not null,
  archetype_id text,
  locale       text
);

create index if not exists discovery_emails_email_idx on public.discovery_emails (email);
create index if not exists discovery_emails_created_at_idx on public.discovery_emails (created_at desc);

-- RLS: anon can insert guestbook entries (pre-auth flow), but the list is opaque.
alter table public.discovery_emails enable row level security;

create policy "anon can sign the guestbook"
  on public.discovery_emails
  for insert
  to anon, authenticated
  with check (true);

-- No SELECT policy → list is only readable via service role (admin exports).
