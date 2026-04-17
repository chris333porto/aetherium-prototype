-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 009: Voice notes table
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Audio reflection storage. Linked to a reflection record (optional).
-- Audio files stored in Supabase Storage; this table tracks metadata.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS voice_notes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Optional link to a text reflection (voice may stand alone)
  reflection_id     uuid REFERENCES reflections(id) ON DELETE SET NULL,

  -- Supabase Storage path (bucket/path format)
  storage_path      text NOT NULL,

  -- Audio metadata
  duration_seconds  integer,
  file_size_bytes   integer,
  mime_type         text DEFAULT 'audio/webm',

  -- Transcript (filled after speech-to-text processing)
  transcript        text,

  -- Processing status
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'transcribing', 'transcribed', 'failed')),

  error_message     text
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS voice_notes_user_id_idx
  ON voice_notes (user_id);

CREATE INDEX IF NOT EXISTS voice_notes_created_at_idx
  ON voice_notes (created_at DESC);

CREATE INDEX IF NOT EXISTS voice_notes_reflection_id_idx
  ON voice_notes (reflection_id)
  WHERE reflection_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS voice_notes_status_idx
  ON voice_notes (status)
  WHERE status != 'transcribed';

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE voice_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own voice notes"
  ON voice_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own voice notes"
  ON voice_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own voice notes"
  ON voice_notes FOR UPDATE
  USING (auth.uid() = user_id);
