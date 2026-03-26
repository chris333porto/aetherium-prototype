/**
 * persistence/assessments.ts
 * Save assessment sessions and individual answers to Supabase.
 *
 * Flow:
 *   1. createAssessment()         → get assessment_id
 *   2. saveAssessmentAnswers()    → bulk-insert all 50 answers
 *   3. markAssessmentComplete()   → set status=completed, completed_at=now
 */

import { supabase } from '../supabase'
import { QUESTIONS } from '../assessment/questions'
import type { RawAnswers } from '../scoring/engine'
import type { NarrativeAnswers } from '../assessment/narrative'
import { ASSESSMENT_VERSION, PROFILE_MODEL_VERSION } from '../types/results'

export interface SavedAssessment {
  id:         string
  status:     string
  created_at: string
}

// ── Create ───────────────────────────────────────────────────────────────────

/**
 * Open a new assessment session. Call this when the user submits their last answer.
 * userId is null for anonymous (guest) sessions.
 */
export async function createAssessment(
  userId?: string | null
): Promise<SavedAssessment> {
  const { data, error } = await supabase
    .from('assessments')
    .insert({
      user_id:               userId ?? null,
      status:                'pending',
      assessment_version:    ASSESSMENT_VERSION,
      profile_model_version: PROFILE_MODEL_VERSION,
      prompt_version:        '1.0',
      started_at:            new Date().toISOString(),
    })
    .select('id, status, created_at')
    .single()

  if (error) throw error
  return data as SavedAssessment
}

// ── Answers ──────────────────────────────────────────────────────────────────

/**
 * Bulk-insert all 50 Likert answers for an assessment.
 * Enriches each row with dimension, reverse_scored flags from the question bank.
 */
export async function saveAssessmentAnswers(
  assessmentId: string,
  answers: RawAnswers
): Promise<void> {
  const questionMap = Object.fromEntries(QUESTIONS.map(q => [q.id, q]))

  const rows = Object.entries(answers).map(([questionId, value]) => {
    const question = questionMap[questionId]
    return {
      assessment_id:  assessmentId,
      question_id:    questionId,
      question_type:  'likert',
      dimension:      question?.dimension ?? null,
      answer_numeric: value,
      reverse_scored: question?.reverseScored ?? false,
      metadata:       {},
    }
  })

  const { error } = await supabase
    .from('assessment_answers')
    .insert(rows)

  if (error) throw error
}

/**
 * Save narrative answers. Each non-empty field is stored as a separate row
 * with question_type='narrative'. The three original fields (life_phase,
 * recent_challenges, desired_direction) map to named Supabase columns
 * upstream; the six additional fields are stored as generic answer rows.
 */
export async function saveNarrativeAnswers(
  assessmentId: string,
  narrative: NarrativeAnswers
): Promise<void> {
  const rows = Object.entries(narrative)
    .filter(([, v]) => v && v.trim().length > 0)
    .map(([fieldId, text]) => ({
      assessment_id:  assessmentId,
      question_id:    fieldId,
      question_type:  'narrative',
      dimension:      null,
      answer_text:    text.trim(),
      reverse_scored: false,
      metadata:       {},
    }))

  if (rows.length === 0) return

  const { error } = await supabase
    .from('assessment_answers')
    .insert(rows)

  if (error) throw error
}

// ── Complete ─────────────────────────────────────────────────────────────────

/**
 * Mark an assessment as completed. Call after scoring is done.
 */
export async function markAssessmentComplete(assessmentId: string): Promise<void> {
  const { error } = await supabase
    .from('assessments')
    .update({
      status:       'completed',
      completed_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    })
    .eq('id', assessmentId)

  if (error) throw error
}
