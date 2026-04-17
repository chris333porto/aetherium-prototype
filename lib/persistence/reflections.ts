/**
 * lib/persistence/reflections.ts
 *
 * Persistence helpers for the reflection engine tables:
 *   reflections · framework_readings · guidance_outputs
 *
 * Every function accepts an authenticated SupabaseClient so the caller
 * controls the auth context (and RLS fires correctly).
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ── Row types ─────────────────────────────────────────────────────────────────

export type ReflectionRow = {
  id:          string
  created_at:  string
  user_id:     string
  content:     string
  source_type: 'daily' | 'prompted' | 'spontaneous'
  mood:        string | null
  tags:        string[]
}

export type DimensionAssessment = {
  level:   'low' | 'moderate' | 'high'
  quality: 'healthy' | 'compromised'
  note:    string
}

export type StateJson = {
  intention: DimensionAssessment
  volition:  DimensionAssessment
  cognition: DimensionAssessment
  emotion:   DimensionAssessment
  action:    DimensionAssessment
}

export type FrameworkReadingRow = {
  id:               string
  created_at:       string
  user_id:          string
  reflection_id:    string | null
  rite:             string
  rite_confidence:  'low' | 'medium' | 'high'
  stage:            string
  stage_confidence: 'low' | 'medium' | 'high'
  state_json:       StateJson
  reasoning_summary: string | null
  // Canon-aligned columns (migration 006)
  life_chapter?:            string | null
  life_chapter_confidence?: string | null
  meaning_level?:           string | null
  meaning_level_confidence?: string | null
  flow_snapshot?:           Record<string, number> | null
  calling_snapshot?:        Record<string, number> | null
  canon_version?:           string | null
}

export type GuidanceOutputRow = {
  id:                   string
  created_at:           string
  user_id:              string
  framework_reading_id: string
  what_is_happening:    string | null
  what_is_being_asked:  string | null
  next_steps_json:      string[]
  reflection_prompt:    string | null
}

// Combined shape returned to callers that need both tables at once
export type FullReading = FrameworkReadingRow & {
  guidance: GuidanceOutputRow | null
}

// ── reflections ───────────────────────────────────────────────────────────────

export async function saveReflection(
  client:  SupabaseClient,
  userId:  string,
  content: string,
  opts?: { mood?: string; tags?: string[]; source_type?: ReflectionRow['source_type'] }
): Promise<ReflectionRow> {
  const { data, error } = await client
    .from('reflections')
    .insert({
      user_id:     userId,
      content,
      source_type: opts?.source_type ?? 'daily',
      mood:        opts?.mood        ?? null,
      tags:        opts?.tags        ?? [],
    })
    .select()
    .single()

  if (error) throw new Error(`saveReflection: ${error.message}`)
  return data as ReflectionRow
}

export async function getRecentReflections(
  client: SupabaseClient,
  userId: string,
  limit  = 5
): Promise<ReflectionRow[]> {
  const { data, error } = await client
    .from('reflections')
    .select('id, created_at, user_id, content, source_type, mood, tags')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getRecentReflections: ${error.message}`)
  return (data ?? []) as ReflectionRow[]
}

// ── framework_readings ────────────────────────────────────────────────────────

type SaveFrameworkReadingInput = {
  userId:           string
  reflectionId:     string | null
  rite:             string
  riteConfidence:   'low' | 'medium' | 'high'
  stage:            string
  stageConfidence:  'low' | 'medium' | 'high'
  stateJson:        StateJson
  reasoningSummary: string | null
  // Canon-aligned fields (migration 006)
  lifeChapter?:            string | null
  lifeChapterConfidence?:  string | null
  meaningLevel?:           string | null
  meaningLevelConfidence?: string | null
  flowSnapshot?:           Record<string, number> | null
  callingSnapshot?:        Record<string, number> | null
}

export async function saveFrameworkReading(
  client: SupabaseClient,
  input:  SaveFrameworkReadingInput
): Promise<FrameworkReadingRow> {
  const { data, error } = await client
    .from('framework_readings')
    .insert({
      user_id:           input.userId,
      reflection_id:     input.reflectionId,
      // Legacy columns (backward compat)
      rite:              input.rite,
      rite_confidence:   input.riteConfidence,
      stage:             input.stage,
      stage_confidence:  input.stageConfidence,
      state_json:        input.stateJson,
      reasoning_summary: input.reasoningSummary,
      // Canon-aligned columns (migration 006)
      life_chapter:            input.lifeChapter ?? null,
      life_chapter_confidence: input.lifeChapterConfidence ?? null,
      meaning_level:           input.meaningLevel ?? null,
      meaning_level_confidence: input.meaningLevelConfidence ?? null,
      flow_snapshot:           input.flowSnapshot ?? null,
      calling_snapshot:        input.callingSnapshot ?? null,
      canon_version:           '1.0',
    })
    .select()
    .single()

  if (error) throw new Error(`saveFrameworkReading: ${error.message}`)
  return data as FrameworkReadingRow
}

// ── guidance_outputs ──────────────────────────────────────────────────────────

type SaveGuidanceOutputInput = {
  userId:             string
  frameworkReadingId: string
  whatIsHappening:    string | null
  whatIsBeingAsked:   string | null
  nextSteps:          string[]
  reflectionPrompt:   string | null
}

export async function saveGuidanceOutput(
  client: SupabaseClient,
  input:  SaveGuidanceOutputInput
): Promise<GuidanceOutputRow> {
  const { data, error } = await client
    .from('guidance_outputs')
    .insert({
      user_id:              input.userId,
      framework_reading_id: input.frameworkReadingId,
      what_is_happening:    input.whatIsHappening,
      what_is_being_asked:  input.whatIsBeingAsked,
      next_steps_json:      input.nextSteps,
      reflection_prompt:    input.reflectionPrompt,
    })
    .select()
    .single()

  if (error) throw new Error(`saveGuidanceOutput: ${error.message}`)
  return data as GuidanceOutputRow
}

// ── read helpers ──────────────────────────────────────────────────────────────

export async function getLatestFullReading(
  client: SupabaseClient,
  userId: string
): Promise<FullReading | null> {
  const { data, error } = await client
    .from('framework_readings')
    .select(`
      id, created_at, user_id, reflection_id,
      rite, rite_confidence, stage, stage_confidence,
      state_json, reasoning_summary,
      life_chapter, life_chapter_confidence,
      meaning_level, meaning_level_confidence,
      flow_snapshot, calling_snapshot, canon_version,
      guidance_outputs (
        id, created_at, user_id, framework_reading_id,
        what_is_happening, what_is_being_asked,
        next_steps_json, reflection_prompt
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`getLatestFullReading: ${error.message}`)
  if (!data)  return null

  // Supabase returns the nested relation as an array; unwrap to single row
  const raw = data as FrameworkReadingRow & { guidance_outputs: GuidanceOutputRow[] }
  const guidance = raw.guidance_outputs?.[0] ?? null

  return { ...raw, guidance } as FullReading
}
