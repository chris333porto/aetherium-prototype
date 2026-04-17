-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 007: Daily check-ins table
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Lightweight daily pulse — one row per user per day.
-- Feeds weekly synthesis and trend tracking.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS daily_checkins (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- One check-in per user per day
  checkin_date      date NOT NULL DEFAULT CURRENT_DATE,

  -- Overall self-rated score for the day
  score             smallint NOT NULL CHECK (score >= 1 AND score <= 5),

  -- Optional brief note
  note              text,

  -- Which dimension was the focus/practice today (nullable)
  growth_dimension  text,

  -- Flow condition self-ratings (optional, nullable)
  -- Shape: {activation: 1-5, alignment: 1-5, attunement: 1-5, attentiveness: 1-5}
  flow_ratings      jsonb,

  -- Prevent duplicate check-ins for same day
  UNIQUE (user_id, checkin_date)
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS daily_checkins_user_id_idx
  ON daily_checkins (user_id);

CREATE INDEX IF NOT EXISTS daily_checkins_date_idx
  ON daily_checkins (checkin_date DESC);

CREATE INDEX IF NOT EXISTS daily_checkins_user_date_idx
  ON daily_checkins (user_id, checkin_date DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own check-ins"
  ON daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own check-ins"
  ON daily_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own check-ins"
  ON daily_checkins FOR UPDATE
  USING (auth.uid() = user_id);
