create extension if not exists "pgcrypto";


-- ── assessments ───────────────────────────────────────────────────────────────

create table if not exists public.assessments (
  id                    uuid        primary key default gen_random_uuid(),
  created_at            timestamptz not null    default now(),
  updated_at            timestamptz not null    default now(),
  user_id               uuid        references auth.users(id) on delete set null,
  status                text        not null    default 'pending'
                          check (status in ('pending','in_progress','completed','abandoned')),
  assessment_version    text        not null    default '1.0',
  profile_model_version text        not null    default '1.0',
  prompt_version        text        not null    default '1.0',
  started_at            timestamptz not null    default now(),
  completed_at          timestamptz
);

create index if not exists assessments_user_id_idx
  on public.assessments (user_id)
  where user_id is not null;

create index if not exists assessments_status_idx
  on public.assessments (status);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists assessments_set_updated_at on public.assessments;
create trigger assessments_set_updated_at
  before update on public.assessments
  for each row execute function public.set_updated_at();

alter table public.assessments enable row level security;

create policy "assessments_select"
  on public.assessments for select
  using (auth.uid() = user_id or user_id is null);

create policy "assessments_insert"
  on public.assessments for insert
  with check (true);

create policy "assessments_update"
  on public.assessments for update
  using (auth.uid() = user_id or user_id is null);


-- ── assessment_answers ────────────────────────────────────────────────────────

create table if not exists public.assessment_answers (
  id             uuid        primary key default gen_random_uuid(),
  created_at     timestamptz not null    default now(),
  assessment_id  uuid        not null    references public.assessments(id) on delete cascade,
  question_id    text        not null,
  question_type  text        not null    default 'likert'
                   check (question_type in ('likert','narrative','select','audio_transcript')),
  dimension      text,
  answer_numeric smallint    check (answer_numeric between 1 and 5),
  answer_text    text,
  reverse_scored boolean     not null    default false,
  metadata       jsonb       not null    default '{}'::jsonb
);

create index if not exists answers_assessment_id_idx
  on public.assessment_answers (assessment_id);

create index if not exists answers_dimension_idx
  on public.assessment_answers (dimension)
  where dimension is not null;

alter table public.assessment_answers enable row level security;

create policy "answers_select"
  on public.assessment_answers for select
  using (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_id
        and (a.user_id = auth.uid() or a.user_id is null)
    )
  );

create policy "answers_insert"
  on public.assessment_answers for insert
  with check (true);


-- ── profile_states ────────────────────────────────────────────────────────────

create table if not exists public.profile_states (
  id                     uuid        primary key default gen_random_uuid(),
  created_at             timestamptz not null    default now(),
  user_id                uuid        references auth.users(id) on delete set null,
  assessment_id          uuid        references public.assessments(id) on delete set null,
  assessment_version     text        not null    default '1.0',
  profile_model_version  text        not null    default '1.0',
  prompt_version         text        not null    default '1.0',

  aether_score           smallint    not null    check (aether_score    between 0 and 100),
  fire_score             smallint    not null    check (fire_score      between 0 and 100),
  air_score              smallint    not null    check (air_score       between 0 and 100),
  water_score            smallint    not null    check (water_score     between 0 and 100),
  earth_score            smallint    not null    check (earth_score     between 0 and 100),
  overall_score          smallint    not null    check (overall_score   between 0 and 100),
  coherence_score        smallint    not null    check (coherence_score between 0 and 100),

  evolution_state        text        not null
                           check (evolution_state in
                             ('fragmented','emerging','integrated','advanced','unified')),

  dominant_dimension     text        check (dominant_dimension  in ('aether','fire','air','water','earth')),
  deficient_dimension    text        check (deficient_dimension in ('aether','fire','air','water','earth')),

  dimensional_buckets    jsonb       not null    default '{}'::jsonb,
  archetype_blend        jsonb       not null    default '{}'::jsonb,
  archetype_distribution jsonb       not null    default '[]'::jsonb,
  evolution_pathway      jsonb       not null    default '{}'::jsonb,
  pathway_options        jsonb       not null    default '[]'::jsonb,
  practices              jsonb       not null    default '[]'::jsonb,

  narrative_life_phase   text,
  narrative_challenges   text,
  narrative_direction    text,

  metadata               jsonb       not null    default '{}'::jsonb
);

create index if not exists profile_states_user_id_idx
  on public.profile_states (user_id)
  where user_id is not null;

create index if not exists profile_states_assessment_id_idx
  on public.profile_states (assessment_id)
  where assessment_id is not null;

create index if not exists profile_states_evolution_state_idx
  on public.profile_states (evolution_state);

create index if not exists profile_states_created_at_idx
  on public.profile_states (created_at desc);

alter table public.profile_states enable row level security;

create policy "profile_states_select"
  on public.profile_states for select
  using (auth.uid() = user_id or user_id is null);

create policy "profile_states_insert"
  on public.profile_states for insert
  with check (true);


-- ── archetype_results ─────────────────────────────────────────────────────────

create table if not exists public.archetype_results (
  id                       uuid        primary key default gen_random_uuid(),
  created_at               timestamptz not null    default now(),
  profile_state_id         uuid        not null    references public.profile_states(id) on delete cascade,

  primary_archetype_id     text        not null,
  primary_archetype_name   text        not null,
  primary_percentage       smallint    not null    check (primary_percentage   between 0 and 100),

  secondary_archetype_id   text        not null,
  secondary_archetype_name text        not null,
  secondary_percentage     smallint    not null    check (secondary_percentage between 0 and 100),

  tertiary_archetype_id    text        not null,
  tertiary_archetype_name  text        not null,
  tertiary_percentage      smallint    not null    check (tertiary_percentage  between 0 and 100),

  shadow_archetype_id      text        not null,
  shadow_archetype_name    text        not null,

  blend_title              text        not null,
  summary                  text
);

create index if not exists archetype_results_profile_state_id_idx
  on public.archetype_results (profile_state_id);

alter table public.archetype_results enable row level security;

create policy "archetype_results_select"
  on public.archetype_results for select
  using (
    exists (
      select 1 from public.profile_states ps
      where ps.id = profile_state_id
        and (ps.user_id = auth.uid() or ps.user_id is null)
    )
  );

create policy "archetype_results_insert"
  on public.archetype_results for insert
  with check (true);


-- ── ai_generations (stub) ─────────────────────────────────────────────────────

create table if not exists public.ai_generations (
  id               uuid        primary key default gen_random_uuid(),
  created_at       timestamptz not null    default now(),
  profile_state_id uuid        references public.profile_states(id) on delete set null,
  assessment_id    uuid        references public.assessments(id)    on delete set null,
  generation_type  text        not null,
  prompt_version   text        not null    default '1.0',
  model_id         text,
  prompt_tokens    integer,
  output_tokens    integer,
  latency_ms       integer,
  input_context    jsonb       not null    default '{}'::jsonb,
  output_text      text,
  parsed_output    jsonb                   default '{}'::jsonb,
  status           text        not null    default 'pending'
                     check (status in ('pending','complete','failed')),
  error_message    text,
  metadata         jsonb       not null    default '{}'::jsonb
);

create index if not exists ai_generations_profile_state_id_idx
  on public.ai_generations (profile_state_id)
  where profile_state_id is not null;

create index if not exists ai_generations_status_idx
  on public.ai_generations (status);

alter table public.ai_generations enable row level security;

create policy "ai_generations_select"
  on public.ai_generations for select
  using (
    profile_state_id is not null
    and exists (
      select 1 from public.profile_states ps
      where ps.id = profile_state_id
        and (ps.user_id = auth.uid() or ps.user_id is null)
    )
  );

create policy "ai_generations_insert"
  on public.ai_generations for insert
  with check (true);
