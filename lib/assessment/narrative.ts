/**
 * narrative.ts
 * Utilities for the qualitative narrative context fields.
 * These are collected before the Likert assessment and provide
 * life-context for the deterministic profile output.
 */

export interface NarrativeAnswers {
  life_phase: string
  recent_challenges: string
  desired_direction: string
}

export const EMPTY_NARRATIVE: NarrativeAnswers = {
  life_phase: '',
  recent_challenges: '',
  desired_direction: '',
}

/**
 * Parse a loose key-value map (e.g. from localStorage JSON) into a
 * typed NarrativeAnswers object with safe defaults.
 */
export function parseNarrativeAnswers(
  raw: Record<string, string> | null | undefined
): NarrativeAnswers {
  if (!raw) return { ...EMPTY_NARRATIVE }
  return {
    life_phase:          (raw.life_phase          ?? '').trim(),
    recent_challenges:   (raw.recent_challenges   ?? '').trim(),
    desired_direction:   (raw.desired_direction   ?? '').trim(),
  }
}

/**
 * Returns true if the user supplied any narrative content.
 */
export function hasNarrativeContent(answers: NarrativeAnswers): boolean {
  return (
    answers.life_phase.length > 0 ||
    answers.recent_challenges.length > 0 ||
    answers.desired_direction.length > 0
  )
}

/**
 * Return a flat string summary of narrative answers for display or logging.
 */
export function narrativeSummary(answers: NarrativeAnswers): string {
  const parts: string[] = []
  if (answers.life_phase)        parts.push(`Phase: ${answers.life_phase}`)
  if (answers.recent_challenges) parts.push(`Challenges: ${answers.recent_challenges}`)
  if (answers.desired_direction) parts.push(`Direction: ${answers.desired_direction}`)
  return parts.join(' | ')
}

// Re-export NARRATIVE_FIELDS from questions for convenience
export { NARRATIVE_FIELDS } from './questions'
export type { NarrativeField } from './questions'
