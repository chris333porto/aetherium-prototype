-- ═══════════════════════════════════════════════════════════════════════════════
-- 012_founding_members.sql
--
-- Reuses the existing `discovery_emails` soft-guestbook table for founding-member
-- capture (e.g. the festival QR → homepage signup). Adds two additive, nullable
-- columns so founding-member leads are distinguishable from discovery-flow
-- guestbook entries without a separate table or any change to existing rows/flows.
--
--   source — where the signup came from (e.g. 'founding-member', 'festival-2026-06').
--   note   — optional free-text the person left (what they're seeking, etc.).
--
-- Both are `add column if not exists` → safe to run repeatedly, and the
-- founding-member capture code falls back to the base columns if this hasn't
-- been applied yet (capture must never fail at a live event).
-- ═══════════════════════════════════════════════════════════════════════════════

alter table public.discovery_emails
  add column if not exists source text;

alter table public.discovery_emails
  add column if not exists note text;

comment on column public.discovery_emails.source is
  'Origin of the capture. NULL/''discovery'' = discovery-flow guestbook; ''founding-member'' (and festival tags) = homepage founding-member signup.';

create index if not exists discovery_emails_source_idx on public.discovery_emails (source)
  where source is not null;

-- RLS already enabled on discovery_emails (migration 011) with an anon INSERT
-- policy (with check true) and no SELECT policy. The new columns inherit that;
-- no policy change is required.
