/**
 * narrative.ts
 * Types and utilities for the qualitative context layer.
 *
 * Collected on /assessment/context — stored in localStorage as `ae_narrative_answers`.
 * The 3 original fields are preserved exactly; 6 new fields are added alongside them.
 *
 * Supabase columns (unchanged): narrative_life_phase, narrative_challenges, narrative_direction
 * The 6 new fields are available for AI payload generation but are not yet written
 * to named Supabase columns (future schema extension).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type EnergyState = 'Scattered' | 'Stuck' | 'Stable' | 'Focused' | 'Driven'

export interface NarrativeAnswers {
  // ── CONTEXT — external reality ──────────────────────────────────────────────
  /** Original field — preserved exactly. */
  life_phase:        string
  environment:       string

  // ── FRICTION — where energy is stuck or leaking ─────────────────────────────
  /** Original field — preserved exactly. */
  recent_challenges: string
  recurring_pattern: string
  avoidance:         string

  // ── DIRECTION — internal pull toward what's next ─────────────────────────────
  /** Original field — preserved exactly. */
  desired_direction: string
  deeper_pull:       string

  // ── ENERGY — current state and vitality ─────────────────────────────────────
  /** One of: Scattered | Stuck | Stable | Focused | Driven */
  energy_state:      string
  energy_sources:    string
}

export const EMPTY_NARRATIVE: NarrativeAnswers = {
  life_phase:        '',
  environment:       '',
  recent_challenges: '',
  recurring_pattern: '',
  avoidance:         '',
  desired_direction: '',
  deeper_pull:       '',
  energy_state:      '',
  energy_sources:    '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse a loose key-value map (e.g. from localStorage JSON) into a typed
 * NarrativeAnswers with safe empty-string defaults.
 * Backward-compatible: missing new fields default to ''.
 */
export function parseNarrativeAnswers(
  raw: Record<string, string> | null | undefined
): NarrativeAnswers {
  if (!raw) return { ...EMPTY_NARRATIVE }
  const s = (k: string) => (raw[k] ?? '').trim()
  return {
    life_phase:        s('life_phase'),
    environment:       s('environment'),
    recent_challenges: s('recent_challenges'),
    recurring_pattern: s('recurring_pattern'),
    avoidance:         s('avoidance'),
    desired_direction: s('desired_direction'),
    deeper_pull:       s('deeper_pull'),
    energy_state:      s('energy_state'),
    energy_sources:    s('energy_sources'),
  }
}

/** Returns true if the user supplied any narrative content. */
export function hasNarrativeContent(answers: NarrativeAnswers): boolean {
  return Object.values(answers).some(v => v.length > 0)
}

/**
 * Flat string summary of the three Supabase-persisted fields.
 * (Used by generating/page.tsx before Supabase save.)
 */
export function narrativeSummary(answers: NarrativeAnswers): string {
  const parts: string[] = []
  if (answers.life_phase)        parts.push(`Phase: ${answers.life_phase}`)
  if (answers.recent_challenges) parts.push(`Challenges: ${answers.recent_challenges}`)
  if (answers.desired_direction) parts.push(`Direction: ${answers.desired_direction}`)
  return parts.join(' | ')
}

// Re-export for convenience
export { NARRATIVE_FIELDS } from './questions'
export type { NarrativeField } from './questions'
