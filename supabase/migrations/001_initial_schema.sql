-- ============================================================
-- Aetherium — Initial Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "pgcrypto";


-- ── assessments ──────────────────────────────────────────────
-- One record per assessment session
create table if not exists public.assessments (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  user_id     uuid references auth.users(id) on delete set null,
  version     integer not null default 1,
  status      text not null default 'pending' check (status in ('pending', 'completed'))
);

comment on table public.assessments is
  'One record per assessment attempt. Supports versioning for reassessment tracking.';


-- ── assessment_answers ───────────────────────────────────────
-- Individual question responses (1–5 Likert)
create table if not exists public.assessment_answers (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  assessment_id  uuid not null references public.assessments(id) on delete cascade,
  question_id    text not null,   -- e.g. 'ae01', 'fi07'
  answer         smallint not null check (answer between 1 and 5)
);

comment on table public.assessment_answers is
  'Individual Likert responses keyed to a question ID and assessment session.';

create index if not exists assessment_answers_assessment_id_idx
  on public.assessment_answers(assessment_id);


-- ── profile_states ───────────────────────────────────────────
-- Computed profile output. Never overwritten — append-only.
create table if not exists public.profile_states (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  user_id               uuid references auth.users(id) on delete set null,
  assessment_id         uuid references public.assessments(id) on delete set null,
  version               integer not null default 1,

  -- Dimension scores (0–100)
  aether_score          smallint not null check (aether_score between 0 and 100),
  fire_score            smallint not null check (fire_score between 0 and 100),
  air_score             smallint not null check (air_score between 0 and 100),
  water_score           smallint not null check (water_score between 0 and 100),
  earth_score           smallint not null check (earth_score between 0 and 100),
  overall_score         smallint not null check (overall_score between 0 and 100),
  coherence_score       smallint not null check (coherence_score between 0 and 100),

  -- State
  evolution_state       text not null check (
    evolution_state in ('fragmented', 'emerging', 'integrated', 'advanced', 'unified')
  ),

  -- Structured JSON blobs
  archetype_blend       jsonb not null default '{}',
  evolution_pathway     jsonb not null default '{}',

  -- Narrative (optional)
  narrative_life_phase  text,
  narrative_challenges  text,
  narrative_direction   text
);

comment on table public.profile_states is
  'Computed identity profile. Append-only — never overwrite past records. Supports full evolution history.';

create index if not exists profile_states_user_id_idx
  on public.profile_states(user_id);

create index if not exists profile_states_created_at_idx
  on public.profile_states(created_at desc);


-- ── Row Level Security ───────────────────────────────────────

alter table public.assessments       enable row level security;
alter table public.assessment_answers enable row level security;
alter table public.profile_states    enable row level security;

-- assessments: users own their rows; anon can insert (guest sessions)
create policy "Users can read own assessments"
  on public.assessments for select
  using (auth.uid() = user_id or user_id is null);

create policy "Anyone can insert assessments"
  on public.assessments for insert
  with check (true);

create policy "Users can update own assessments"
  on public.assessments for update
  using (auth.uid() = user_id or user_id is null);

-- assessment_answers: inherit access via assessment
create policy "Users can read own answers"
  on public.assessment_answers for select
  using (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_id
        and (a.user_id = auth.uid() or a.user_id is null)
    )
  );

create policy "Anyone can insert answers"
  on public.assessment_answers for insert
  with check (true);

-- profile_states: users own their rows
create policy "Users can read own profiles"
  on public.profile_states for select
  using (auth.uid() = user_id or user_id is null);

create policy "Anyone can insert profile states"
  on public.profile_states for insert
  with check (true);
