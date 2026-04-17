-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 010: Memory Vault + Persistent Missions
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Memory Vault: stores stories, beliefs, teachings, insights, life chapters
-- as tagged, searchable entries. The foundation for creation engine and
-- legacy platform.
--
-- Missions: persistent daily tasks with completion tracking.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Memory Vault ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  content         text NOT NULL,
  title           text,                    -- optional title / subject

  -- Classification
  memory_type     text NOT NULL DEFAULT 'reflection'
                  CHECK (memory_type IN (
                    'reflection',          -- daily journal entry
                    'story',               -- personal narrative / experience
                    'belief',              -- core belief or value statement
                    'teaching',            -- wisdom received or generated
                    'insight',             -- AI-generated or self-generated insight
                    'dream',               -- dream record
                    'gratitude',           -- gratitude entry
                    'letter',              -- letter to self or others
                    'voice_transcript'     -- transcribed voice note
                  )),

  -- Source
  source          text NOT NULL DEFAULT 'text'
                  CHECK (source IN ('text', 'voice', 'ai_generated', 'imported')),

  -- Tagging
  tags            text[] DEFAULT '{}',
  dimension       text,                    -- optional: which dimension this relates to
  life_chapter    text,                    -- optional: which life chapter context

  -- AI enrichment (filled after processing)
  ai_summary      text,                    -- one-line summary
  ai_themes       text[],                  -- extracted themes
  ai_dimension    text,                    -- AI-detected dimension relevance

  -- Linkage
  reflection_id   uuid REFERENCES reflections(id) ON DELETE SET NULL,
  voice_note_id   uuid REFERENCES voice_notes(id) ON DELETE SET NULL,

  -- Visibility
  is_starred      boolean DEFAULT false,
  is_archived     boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS memories_user_id_idx ON memories (user_id);
CREATE INDEX IF NOT EXISTS memories_created_at_idx ON memories (created_at DESC);
CREATE INDEX IF NOT EXISTS memories_type_idx ON memories (memory_type);
CREATE INDEX IF NOT EXISTS memories_user_type_idx ON memories (user_id, memory_type);
CREATE INDEX IF NOT EXISTS memories_starred_idx ON memories (user_id, is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS memories_tags_idx ON memories USING gin (tags);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own memories" ON memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own memories" ON memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own memories" ON memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own memories" ON memories FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at_memories()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memories_set_updated_at
  BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_memories();

-- ── Persistent Missions ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS missions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  title           text NOT NULL,
  notes           text,

  -- Date tracking
  target_date     date NOT NULL DEFAULT CURRENT_DATE,

  -- Status
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'completed', 'deferred', 'dropped')),
  completed_at    timestamptz,

  -- Classification
  dimension       text,                    -- which dimension this serves
  priority        text DEFAULT 'normal'
                  CHECK (priority IN ('critical', 'normal', 'someday')),

  -- Recurrence
  is_recurring    boolean DEFAULT false,
  recurrence      text                     -- 'daily', 'weekly', etc.
);

CREATE INDEX IF NOT EXISTS missions_user_id_idx ON missions (user_id);
CREATE INDEX IF NOT EXISTS missions_date_idx ON missions (target_date DESC);
CREATE INDEX IF NOT EXISTS missions_user_date_idx ON missions (user_id, target_date DESC);
CREATE INDEX IF NOT EXISTS missions_status_idx ON missions (status) WHERE status = 'active';

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own missions" ON missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own missions" ON missions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own missions" ON missions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own missions" ON missions FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER missions_set_updated_at
  BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_memories();
