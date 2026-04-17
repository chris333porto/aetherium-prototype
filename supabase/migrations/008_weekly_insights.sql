-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 008: Weekly insights table
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- AI-generated weekly synthesis. One row per user per week.
-- Aggregates reflections + check-ins into a pattern observation.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS weekly_insights (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Week boundary (Monday of the week)
  week_start        date NOT NULL,

  -- Aggregation inputs
  reflection_count  integer NOT NULL DEFAULT 0,
  checkin_count     integer NOT NULL DEFAULT 0,
  checkin_average   numeric(3,1),          -- average daily score for the week

  -- Canon-aligned detections for the week
  life_chapter      text,                  -- dominant chapter detected
  meaning_level     text,                  -- dominant meaning level
  flow_snapshot     jsonb,                 -- averaged flow conditions
  calling_snapshot  jsonb,                 -- calling aim orientation

  -- AI-generated content
  summary           text,                  -- 2-3 sentence week summary
  key_pattern       text,                  -- one-line pattern observation
  recommendation    text,                  -- single practice recommendation
  growth_dimension  text,                  -- which dimension showed most movement

  -- Dimensional movement (delta from previous week or baseline)
  dimension_deltas  jsonb,                 -- {aether: +3, fire: -1, ...} (nullable)

  -- Metadata
  canon_version     text DEFAULT '1.0',
  model_id          text,                  -- which AI model generated this

  -- One insight per user per week
  UNIQUE (user_id, week_start)
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS weekly_insights_user_id_idx
  ON weekly_insights (user_id);

CREATE INDEX IF NOT EXISTS weekly_insights_week_idx
  ON weekly_insights (week_start DESC);

CREATE INDEX IF NOT EXISTS weekly_insights_user_week_idx
  ON weekly_insights (user_id, week_start DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE weekly_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own insights"
  ON weekly_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own insights"
  ON weekly_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own insights"
  ON weekly_insights FOR UPDATE
  USING (auth.uid() = user_id);
