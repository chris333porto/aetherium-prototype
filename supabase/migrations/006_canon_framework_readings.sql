-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 006: Canon alignment for framework_readings
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Adds canon-aligned columns alongside the existing rite/stage system.
-- Old columns remain functional. New reflections write to both systems
-- during transition. Old rite/stage columns are NOT dropped.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Life chapter detected from this reflection
-- Values from canon: initiation, expansion, stability, plateau, transition,
-- disruption, contraction, reconstruction, integration, emergence, overload, renewal
ALTER TABLE framework_readings
  ADD COLUMN IF NOT EXISTS life_chapter text;

ALTER TABLE framework_readings
  ADD COLUMN IF NOT EXISTS life_chapter_confidence text DEFAULT 'low';

-- Meaning level detected from this reflection
-- Values from canon: survival, desire, belonging, achievement, awakening, integration, transcendence
ALTER TABLE framework_readings
  ADD COLUMN IF NOT EXISTS meaning_level text;

ALTER TABLE framework_readings
  ADD COLUMN IF NOT EXISTS meaning_level_confidence text DEFAULT 'low';

-- Flow condition snapshot at time of reflection
-- Shape: {activation: 0-10, alignment: 0-10, attunement: 0-10, attentiveness: 0-10}
ALTER TABLE framework_readings
  ADD COLUMN IF NOT EXISTS flow_snapshot jsonb;

-- Calling aim emphasis detected in this reflection
-- Shape: {connection: 0-10, contribution: 0-10, creativity: 0-10, capability: 0-10}
ALTER TABLE framework_readings
  ADD COLUMN IF NOT EXISTS calling_snapshot jsonb;

-- Canon version that produced this reading
ALTER TABLE framework_readings
  ADD COLUMN IF NOT EXISTS canon_version text DEFAULT '1.0';

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS framework_readings_life_chapter_idx
  ON framework_readings (life_chapter)
  WHERE life_chapter IS NOT NULL;

CREATE INDEX IF NOT EXISTS framework_readings_meaning_level_idx
  ON framework_readings (meaning_level)
  WHERE meaning_level IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- No RLS changes needed — framework_readings RLS already enforces
-- auth.uid() = user_id on SELECT and INSERT.
-- ═══════════════════════════════════════════════════════════════════════════════
