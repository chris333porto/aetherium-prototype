-- ============================================================
-- Aetherium — Schema v2
-- Additive migration — never drops or renames existing columns
-- Run in Supabase SQL Editor after 001_initial_schema.sql
-- ============================================================


-- ── assessments: add versioning + timestamps ─────────────────

alter table public.assessments
  add column if not exists assessment_version      text not null default '1.0',
  add column if not exists profile_model_version   text not null default '1.0',
  add column if not exists prompt_version          text not null default '1.0',
  add column if not exists started_at              timestamptz,
  add column if not exists completed_at            timestamptz,
  add column if not exists updated_at              timestamptz default now();

comment on column public.assessments.assessment_version    is 'Version of the question bank used.';
comment on column public.assessments.profile_model_version is 'Version of the scoring/archetype model.';
comment on column public.assessments.prompt_version        is 'Version of any AI prompt templates used (future).';
comment on column public.assessments.started_at            is 'When the user began the assessment.';
comment on column public.assessments.completed_at          is 'When scoring was completed.';
comment on column public.assessments.updated_at            is 'Last modification timestamp.';

-- Auto-update trigger for updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists assessments_updated_at on public.assessments;
create trigger assessments_updated_at
  before update on public.assessments
  for each row execute function public.set_updated_at();


-- ── assessment_answers: add richness columns ─────────────────

alter table public.assessment_answers
  add column if not exists question_type   text        not null default 'likert',
  add column if not exists dimension       text,
  add column if not exists answer_numeric  smallint    check (answer_numeric between 1 and 5),
  add column if not exists answer_text     text,
  add column if not exists reverse_scored  boolean,
  add column if not exists metadata        jsonb       not null default '{}';

comment on column public.assessment_answers.question_type  is 'likert | narrative | select';
comment on column public.assessment_answers.dimension      is 'aether | fire | air | water | earth | null for narrative';
comment on column public.assessment_answers.answer_numeric is 'Numeric Likert value 1–5 (mirrors legacy answer column).';
comment on column public.assessment_answers.answer_text    is 'Free-text narrative answer.';
comment on column public.assessment_answers.reverse_scored is 'Whether the question was reverse-scored before normalization.';
comment on column public.assessment_answers.metadata       is 'Extensible JSON for future answer metadata.';

create index if not exists assessment_answers_dimension_idx
  on public.assessment_answers(dimension)
  where dimension is not null;


-- ── profile_states: add full computed payload columns ────────

alter table public.profile_states
  add column if not exists assessment_version      text not null default '1.0',
  add column if not exists profile_model_version   text not null default '1.0',
  add column if not exists prompt_version          text not null default '1.0',
  add column if not exists dominant_dimension      text,
  add column if not exists deficient_dimension     text,
  add column if not exists dimensional_buckets     jsonb not null default '{}',
  add column if not exists archetype_distribution  jsonb not null default '{}',
  add column if not exists pathway_options         jsonb not null default '[]',
  add column if not exists practices               jsonb not null default '[]',
  add column if not exists metadata                jsonb not null default '{}';

comment on column public.profile_states.dominant_dimension     is 'Highest-scoring dimension key.';
comment on column public.profile_states.deficient_dimension    is 'Lowest-scoring dimension key.';
comment on column public.profile_states.dimensional_buckets    is 'JSON: {aether:{score,balance,rawAverage},...}';
comment on column public.profile_states.archetype_distribution is 'JSON: {primary,secondary,tertiary,shadow}';
comment on column public.profile_states.pathway_options        is 'JSON array of pathway options generated.';
comment on column public.profile_states.practices              is 'JSON array of practice strings.';
comment on column public.profile_states.metadata               is 'Extensible JSON for future metadata.';

create index if not exists profile_states_evolution_state_idx
  on public.profile_states(evolution_state);

create index if not exists profile_states_assessment_id_idx
  on public.profile_states(assessment_id)
  where assessment_id is not null;


-- ── archetype_results ─────────────────────────────────────────
-- Structured top-line archetype output, linked to a profile state

create table if not exists public.archetype_results (
  id                      uuid primary key default gen_random_uuid(),
  created_at              timestamptz not null default now(),
  profile_state_id        uuid not null references public.profile_states(id) on delete cascade,

  primary_archetype_id    text not null,
  primary_archetype_name  text not null,
  primary_percentage      smallint not null check (primary_percentage between 0 and 100),

  secondary_archetype_id   text not null,
  secondary_archetype_name text not null,
  secondary_percentage     smallint not null check (secondary_percentage between 0 and 100),

  tertiary_archetype_id    text not null,
  tertiary_archetype_name  text not null,
  tertiary_percentage      smallint not null check (tertiary_percentage between 0 and 100),

  shadow_archetype_id      text not null,
  shadow_archetype_name    text not null,

  blend_title              text not null,
  summary                  text
);

comment on table public.archetype_results is
  'Structured archetype blend output per profile state. One record per completed profile.';

create index if not exists archetype_results_profile_state_id_idx
  on public.archetype_results(profile_state_id);

alter table public.archetype_results enable row level security;

create policy "Users can read own archetype results"
  on public.archetype_results for select
  using (
    exists (
      select 1 from public.profile_states ps
      where ps.id = profile_state_id
        and (ps.user_id = auth.uid() or ps.user_id is null)
    )
  );

create policy "Anyone can insert archetype results"
  on public.archetype_results for insert
  with check (true);


-- ── ai_generations (stub) ────────────────────────────────────
-- Future home for AI-generated narrative interpretations

create table if not exists public.ai_generations (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  profile_state_id uuid references public.profile_states(id) on delete set null,
  assessment_id    uuid references public.assessments(id) on delete set null,

  generation_type  text not null,           -- 'narrative' | 'insight' | 'letter' | etc.
  prompt_version   text not null default '1.0',
  model_id         text,                    -- e.g. 'claude-sonnet-4-6'
  prompt_tokens    integer,
  output_tokens    integer,
  latency_ms       integer,

  input_context    jsonb not null default '{}',  -- sanitized input sent to model
  output_text      text,                          -- raw generation output
  parsed_output    jsonb default '{}',            -- structured parsed result
  status           text not null default 'pending'
    check (status in ('pending', 'complete', 'failed')),
  error_message    text,
  metadata         jsonb not null default '{}'
);

comment on table public.ai_generations is
  'Stub table for AI interpretation layer. Not yet called in MVP. Structure prepared for future use.';

create index if not exists ai_generations_profile_state_id_idx
  on public.ai_generations(profile_state_id)
  where profile_state_id is not null;

create index if not exists ai_generations_status_idx
  on public.ai_generations(status);

alter table public.ai_generations enable row level security;

create policy "Users can read own ai generations"
  on public.ai_generations for select
  using (
    exists (
      select 1 from public.profile_states ps
      where ps.id = profile_state_id
        and (ps.user_id = auth.uid() or ps.user_id is null)
    )
    or profile_state_id is null
  );

create policy "Service role can insert ai generations"
  on public.ai_generations for insert
  with check (true);
