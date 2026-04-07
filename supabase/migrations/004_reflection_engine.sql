-- ============================================================
-- Aetherium — Migration 004: Reflection Engine
-- 2026-04-06
--
-- Adds three tables that power the daily reflection flow:
--
--   1. reflections          — user-submitted daily reflections
--   2. framework_readings   — Rite / State / Stage analysis per reflection
--   3. guidance_outputs     — Guidance section linked to each reading
--
-- Additive only. Nothing is dropped or renamed.
-- Safe to run against a live database.
-- ============================================================


-- ── 1. reflections ────────────────────────────────────────────────────────────

create table if not exists public.reflections (
  id           uuid        primary key default gen_random_uuid(),
  created_at   timestamptz not null    default now(),

  user_id      uuid        not null references auth.users(id) on delete cascade,

  content      text        not null,
  source_type  text        not null default 'daily'
                 check (source_type in ('daily', 'prompted', 'spontaneous')),
  mood         text,
  tags         text[]      not null default '{}'
);

comment on table public.reflections is
  'User-submitted daily reflections. One row per submission. '
  'Used as the primary input to the framework analysis engine.';

comment on column public.reflections.source_type is
  'daily = unprompted daily entry | prompted = written in response to a reflection_prompt | spontaneous = written outside the normal flow';
comment on column public.reflections.mood        is 'Optional free-text mood label self-reported by the user.';
comment on column public.reflections.tags        is 'Optional tags for future filtering and pattern detection.';

create index if not exists reflections_user_id_idx
  on public.reflections (user_id);

create index if not exists reflections_created_at_idx
  on public.reflections (created_at desc);

alter table public.reflections enable row level security;

create policy "reflections_select"
  on public.reflections for select
  using (auth.uid() = user_id);

create policy "reflections_insert"
  on public.reflections for insert
  with check (auth.uid() = user_id);


-- ── 2. framework_readings ─────────────────────────────────────────────────────

create table if not exists public.framework_readings (
  id               uuid        primary key default gen_random_uuid(),
  created_at       timestamptz not null    default now(),

  user_id          uuid        not null references auth.users(id) on delete cascade,

  -- Source reflection that triggered this reading (nullable: readings can be
  -- generated without a new reflection, e.g. from a re-analysis of existing data)
  reflection_id    uuid        references public.reflections(id) on delete set null,

  -- Rite (context)
  rite             text        not null
                     check (rite in (
                       'ORIGIN','AWAKENING','INITIATION','CROSSING',
                       'ORDEAL','SURRENDER','ILLUMINATION','OFFERING','EMBODIMENT'
                     )),
  rite_confidence  text        not null default 'medium'
                     check (rite_confidence in ('low','medium','high')),

  -- Stage (developmental level)
  stage            text        not null
                     check (stage in (
                       'REACTIVE','CONFORMING','AWAKENING','BUILDING',
                       'AUTHORING','INTEGRATING','TRANSCENDING'
                     )),
  stage_confidence text        not null default 'low'
                     check (stage_confidence in ('low','medium','high')),

  -- State (Five Dimensions, stored as JSONB)
  -- Shape: { intention, volition, cognition, emotion, action }
  -- Each key: { level: low|moderate|high, quality: healthy|compromised, note: string }
  state_json       jsonb       not null default '{}'::jsonb,

  -- One-paragraph summary of the reasoning (for debugging and display)
  reasoning_summary text
);

comment on table public.framework_readings is
  'One framework reading per reflection submission. Stores Rite, State, and Stage '
  'analysis produced by the framework engine. Append-only — never overwrite.';

comment on column public.framework_readings.reflection_id is
  'The reflection that triggered this reading. Null for re-analyses or initial reads without a new entry.';
comment on column public.framework_readings.state_json is
  'Five Dimensions state object. Keys: intention, volition, cognition, emotion, action. '
  'Each value: { level: low|moderate|high, quality: healthy|compromised, note: string }';

create index if not exists framework_readings_user_id_idx
  on public.framework_readings (user_id);

create index if not exists framework_readings_created_at_idx
  on public.framework_readings (created_at desc);

alter table public.framework_readings enable row level security;

create policy "framework_readings_select"
  on public.framework_readings for select
  using (auth.uid() = user_id);

create policy "framework_readings_insert"
  on public.framework_readings for insert
  with check (auth.uid() = user_id);


-- ── 3. guidance_outputs ───────────────────────────────────────────────────────

create table if not exists public.guidance_outputs (
  id                   uuid        primary key default gen_random_uuid(),
  created_at           timestamptz not null    default now(),

  user_id              uuid        not null references auth.users(id) on delete cascade,

  -- Every guidance output belongs to exactly one framework reading
  framework_reading_id uuid        not null
                         references public.framework_readings(id) on delete cascade,

  -- Guidance fields (from Step 4 of the framework)
  what_is_happening    text,        -- short paragraph
  what_is_being_asked  text,        -- short paragraph
  next_steps_json      jsonb       not null default '[]'::jsonb,  -- string[]
  reflection_prompt    text         -- one useful question to leave the user with
);

comment on table public.guidance_outputs is
  'Guidance section generated by the framework engine, linked one-to-one with a '
  'framework_readings row. Stores the "what is happening", "what is asked", '
  'next steps, and reflection prompt.';

comment on column public.guidance_outputs.next_steps_json is
  'JSON array of 1–3 concrete next action strings.';
comment on column public.guidance_outputs.reflection_prompt is
  'A single question intended to surface what the user most needs to sit with.';

create index if not exists guidance_outputs_user_id_idx
  on public.guidance_outputs (user_id);

create index if not exists guidance_outputs_framework_reading_id_idx
  on public.guidance_outputs (framework_reading_id);

create index if not exists guidance_outputs_created_at_idx
  on public.guidance_outputs (created_at desc);

alter table public.guidance_outputs enable row level security;

create policy "guidance_outputs_select"
  on public.guidance_outputs for select
  using (auth.uid() = user_id);

create policy "guidance_outputs_insert"
  on public.guidance_outputs for insert
  with check (auth.uid() = user_id);
