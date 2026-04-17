-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 005: Canon alignment for profile_states
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Adds canon-aligned columns to profile_states. All nullable/defaulted
-- so existing rows are unaffected. New assessments populate these fields;
-- old rows retain nulls.
--
-- Does NOT drop evolution_state or any existing column.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Archetype category from canon (core/expansion/shadow/transcendent)
-- Stored alongside evolution_state for backward compat
ALTER TABLE profile_states
  ADD COLUMN IF NOT EXISTS archetype_category text;

-- Signal quality from the scoring engine
-- Shape: {confidence: 'high'|'moderate'|'low', isBalancedSystem: bool, isFlatProfile: bool, hasInflationBias: bool, hasLowVariance: bool, flags: string[]}
ALTER TABLE profile_states
  ADD COLUMN IF NOT EXISTS signal_quality jsonb DEFAULT '{}';

-- Life chapter detected from assessment context or reflection
-- Values from canon: initiation, expansion, stability, plateau, transition,
-- disruption, contraction, reconstruction, integration, emergence, overload, renewal
ALTER TABLE profile_states
  ADD COLUMN IF NOT EXISTS life_chapter text;

-- Dominant meaning level detected
-- Values from canon: survival, desire, belonging, achievement, awakening, integration, transcendence
ALTER TABLE profile_states
  ADD COLUMN IF NOT EXISTS meaning_level text;

-- Flow state snapshot at time of assessment
-- Shape: {activation: 0-10, alignment: 0-10, attunement: 0-10, attentiveness: 0-10}
ALTER TABLE profile_states
  ADD COLUMN IF NOT EXISTS flow_state jsonb;

-- Calling orientation at time of assessment
-- Shape: {connection: 0-10, contribution: 0-10, creativity: 0-10, capability: 0-10}
ALTER TABLE profile_states
  ADD COLUMN IF NOT EXISTS calling_orientation jsonb;

-- Shadow trigger from canon archetype (short text, e.g. "Overthinking", "Avoidance")
ALTER TABLE profile_states
  ADD COLUMN IF NOT EXISTS shadow_trigger text;

-- Growth edge label from canon archetype (e.g. "Act (Earth)", "Trust (Water)")
ALTER TABLE profile_states
  ADD COLUMN IF NOT EXISTS growth_edge_label text;

-- Growth dimension from canon archetype (the specific dimension to develop)
ALTER TABLE profile_states
  ADD COLUMN IF NOT EXISTS growth_dimension text;

-- Canon version that produced this row — for future versioned migrations
ALTER TABLE profile_states
  ADD COLUMN IF NOT EXISTS canon_version text DEFAULT '1.0';

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS profile_states_archetype_category_idx
  ON profile_states (archetype_category)
  WHERE archetype_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS profile_states_life_chapter_idx
  ON profile_states (life_chapter)
  WHERE life_chapter IS NOT NULL;

CREATE INDEX IF NOT EXISTS profile_states_canon_version_idx
  ON profile_states (canon_version);

-- ═══════════════════════════════════════════════════════════════════════════════
-- No RLS changes needed — profile_states RLS already covers all columns
-- via the existing user_id-based SELECT/INSERT policies.
-- ═══════════════════════════════════════════════════════════════════════════════
