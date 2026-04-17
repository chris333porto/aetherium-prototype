import { createClient } from '@supabase/supabase-js'
import type { DimensionScores, EvolutionState } from './scoring/engine'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── DB row types (mirror schema v2) ─────────────────────────────────────────

export type Assessment = {
  id:                     string
  user_id:                string | null
  profile_id:             string | null   // migration 003 — nullable until profile is saved
  status:                 'pending' | 'in_progress' | 'completed' | 'abandoned'
  assessment_version:     string
  profile_model_version:  string
  prompt_version:         string
  started_at:             string | null
  completed_at:           string | null
  updated_at:             string | null
  created_at:             string
  // Legacy column kept for backward compat
  version:                number
}

export type AssessmentAnswer = {
  id:             string
  assessment_id:  string
  question_id:    string
  question_type:  'likert' | 'narrative' | 'select'
  dimension:      string | null
  answer:         number | null     // legacy column
  answer_numeric: number | null     // v2 canonical
  answer_text:    string | null
  reverse_scored: boolean | null
  metadata:       Record<string, unknown>
  created_at:     string
}

export type ProfileState = {
  id:                     string
  user_id:                string | null
  assessment_id:          string | null
  assessment_version:     string
  profile_model_version:  string
  prompt_version:         string
  created_at:             string

  aether_score:     number
  fire_score:       number
  air_score:        number
  water_score:      number
  earth_score:      number
  overall_score:    number
  coherence_score:  number

  evolution_state:     EvolutionState
  dominant_dimension:  string | null
  deficient_dimension: string | null

  dimensional_buckets:    Record<string, unknown>
  archetype_blend:        ArchetypeBlendRecord
  archetype_distribution: Record<string, unknown>
  evolution_pathway:      EvolutionPathwayRecord
  pathway_options:        unknown[]
  practices:              string[]

  narrative_life_phase:  string | null
  narrative_challenges:  string | null
  narrative_direction:   string | null

  // Extended narrative fields (migration 003)
  // Keys: environment, recurring_pattern, avoidance, deeper_pull, energy_state, energy_sources
  narrative_context:     Record<string, string>

  // Profile link (migration 003) — nullable until user saves their profile
  profile_id:            string | null

  metadata: Record<string, unknown>
  // Legacy column kept for backward compat
  version:  number

  // Canon-aligned columns (migration 005)
  archetype_category?:   string | null
  signal_quality?:       Record<string, unknown>
  life_chapter?:         string | null
  meaning_level?:        string | null
  flow_state?:           Record<string, number> | null
  calling_orientation?:  Record<string, number> | null
  shadow_trigger?:       string | null
  growth_edge_label?:    string | null
  growth_dimension?:     string | null
  canon_version?:        string | null
}

export type ArchetypeBlendRecord = {
  primary_id:    string
  primary_name:  string
  primary_pct:   number
  secondary_id:  string
  secondary_name: string
  secondary_pct: number
  tertiary_id:   string
  tertiary_name: string
  tertiary_pct:  number
  shadow_id:     string
  shadow_name:   string
  blend_title:   string
}

export type EvolutionPathwayRecord = {
  current_state:    EvolutionState
  next_state:       EvolutionState
  future_state:     EvolutionState
  growth_dimension: string
  growth_score:     number
}

export type ArchetypeResult = {
  id:                      string
  created_at:              string
  profile_state_id:        string
  primary_archetype_id:    string
  primary_archetype_name:  string
  primary_percentage:      number
  secondary_archetype_id:  string
  secondary_archetype_name: string
  secondary_percentage:    number
  tertiary_archetype_id:   string
  tertiary_archetype_name: string
  tertiary_percentage:     number
  shadow_archetype_id:     string
  shadow_archetype_name:   string
  blend_title:             string
  summary:                 string | null
}

export type AiGeneration = {
  id:               string
  created_at:       string
  profile_state_id: string | null
  assessment_id:    string | null
  generation_type:  string
  prompt_version:   string
  model_id:         string | null
  prompt_tokens:    number | null
  output_tokens:    number | null
  latency_ms:       number | null
  input_context:    Record<string, unknown>
  output_text:      string | null
  parsed_output:    Record<string, unknown>
  status:           'pending' | 'complete' | 'failed'
  error_message:    string | null
  metadata:         Record<string, unknown>
}

// ── Legacy convenience functions (kept for backward compat) ──────────────────
// Prefer lib/persistence/assessments.ts and lib/persistence/profiles.ts
// for new code.

export async function saveProfileStateLegacy(
  data: Omit<ProfileState, 'id' | 'created_at'>
) {
  const { data: result, error } = await supabase
    .from('profile_states')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return result as ProfileState
}

export async function saveAssessmentLegacy(answers: Record<string, number>) {
  const { data: assessment, error: aErr } = await supabase
    .from('assessments')
    .insert({ version: 1, status: 'pending' })
    .select()
    .single()

  if (aErr) throw aErr

  const rows = Object.entries(answers).map(([question_id, answer]) => ({
    assessment_id: assessment.id,
    question_id,
    answer,
  }))

  const { error: ansErr } = await supabase
    .from('assessment_answers')
    .insert(rows)

  if (ansErr) throw ansErr
  return assessment as Assessment
}

// ── Profile ──────────────────────────────────────────────────────────────────
// Permanent user identity record. Created when a user saves their profile
// after completing the assessment. Migration: 003_current_alignment.sql

export type Profile = {
  id:          string
  created_at:  string
  updated_at:  string
  user_id:     string | null   // links to auth.users once account is created
  email:       string
  first_name:  string
  last_name:   string
  birth_date:  string | null   // ISO date string 'YYYY-MM-DD'
  city:        string | null
  region:      string | null
  country:     string | null
  timezone:    string | null
  metadata:    Record<string, unknown>
}
