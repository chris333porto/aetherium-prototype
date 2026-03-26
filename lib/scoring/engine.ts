import { QUESTIONS, type Dimension } from '../assessment/questions'

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Raw Likert answers keyed by question ID.
 * Values are integers 1–5 as returned by the assessment UI.
 */
export interface RawAnswers {
  [questionId: string]: number // 1–5
}

export interface NarrativeAnswers {
  life_phase:         string
  recent_challenges:  string
  desired_direction:  string
}

/**
 * Deterministic 0–100 scores for each dimension.
 *
 * ## Where this is produced
 * Call `computeDimensionScores(rawAnswers)` immediately after the user
 * completes all assessment steps (client-side, no network required).
 *
 * ## How to pass to /api/generate-results
 * ```ts
 * const dimensionScores = computeDimensionScores(rawAnswers)
 *
 * await fetch('/api/generate-results', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     userId,           // string | undefined
 *     dimensionScores,  // ← this object, directly
 *     past,
 *     present,
 *     future,
 *   }),
 * })
 * ```
 *
 * The API route passes `dimensionScores` unchanged into
 * `generateAetheriumResults()`, which forwards it to the model as context.
 * No further transformation is needed.
 */
export interface DimensionScores {
  aether: number  // 0–100
  fire:   number  // 0–100
  air:    number  // 0–100
  water:  number  // 0–100
  earth:  number  // 0–100
}

export type DimensionBalance = 'low' | 'medium' | 'high'

export interface DimensionProfile {
  score:      number          // 0–100
  balance:    DimensionBalance
  rawAverage: number          // 1–5 weighted mean before normalization
}

export interface ScoringResult {
  dimensions:    DimensionScores
  profiles:      Record<Dimension, DimensionProfile>
  coherenceScore: number // 0–100
  overallScore:   number // 0–100
}

// ─── Internal constants ───────────────────────────────────────────────────────

const DIMENSIONS: Dimension[] = ['aether', 'fire', 'air', 'water', 'earth']

/** Likert scale boundaries used for normalization. */
const SCALE_MIN = 1
const SCALE_MAX = 5

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Hard-clamp a number to [0, 100]. */
function clamp(n: number): number {
  return Math.max(0, Math.min(100, n))
}

function getBalance(score: number): DimensionBalance {
  if (score < 34) return 'low'
  if (score < 67) return 'medium'
  return 'high'
}

/**
 * Per-dimension internal coherence score (0–100).
 * Higher = more internally consistent answers within that dimension.
 * Computed as the inverse of answer variance; max variance on a 1–5
 * scale is 4 (all answers alternating between 1 and 5).
 */
function computeDimensionCoherence(adjustedValues: number[]): number {
  const mean     = adjustedValues.reduce((a, b) => a + b, 0) / adjustedValues.length
  const variance = adjustedValues.reduce((acc, v) => acc + (v - mean) ** 2, 0) / adjustedValues.length
  return clamp(Math.round((1 - variance / 4) * 100))
}

/**
 * Compute the weighted average score for one dimension's questions,
 * then normalize from [SCALE_MIN, SCALE_MAX] to [0, 100].
 *
 * Algorithm:
 *   1. For each question:
 *        adjusted = reverseScored ? (SCALE_MAX + 1 - raw) : raw
 *        contribution = adjusted × weight
 *   2. weighted_avg = Σ(contribution) / Σ(weight)
 *   3. normalized = round(((weighted_avg - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) × 100)
 *   4. clamp(normalized, 0, 100)
 *
 * Missing answers default to the scale midpoint (3) so partial submissions
 * degrade gracefully rather than crashing.
 */
function scoreDimension(
  dim: Dimension,
  answers: RawAnswers
): { score: number; rawAverage: number; adjustedValues: number[] } {
  const questions = QUESTIONS.filter(q => q.dimension === dim)

  let weightedSum = 0
  let totalWeight = 0
  const adjustedValues: number[] = []

  for (const q of questions) {
    const raw      = answers[q.id] ?? 3                            // midpoint fallback
    const adjusted = q.reverseScored ? (SCALE_MAX + 1 - raw) : raw // flip if reversed
    const w        = q.weight ?? 1

    adjustedValues.push(adjusted)
    weightedSum += adjusted * w
    totalWeight += w
  }

  const weightedAvg  = weightedSum / totalWeight
  const normalized   = clamp(
    Math.round(((weightedAvg - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100)
  )

  return {
    score:          normalized,
    rawAverage:     Math.round(weightedAvg * 10) / 10,
    adjustedValues,
  }
}

// ─── Primary export ───────────────────────────────────────────────────────────

/**
 * **computeDimensionScores** — deterministic, LLM-free scoring entry point.
 *
 * Takes the raw Likert answers from the assessment UI and returns a clean
 * `DimensionScores` object suitable for passing directly to
 * `POST /api/generate-results` as the `dimensionScores` field.
 *
 * Handles:
 * - reverse-scored questions  (via `question.reverseScored`)
 * - per-question weighting    (via `question.weight`, defaults to 1)
 * - missing answers           (default to scale midpoint 3)
 * - output clamping           (values are guaranteed to be integers in [0, 100])
 *
 * @example
 * ```ts
 * // After the user completes all steps:
 * const dimensionScores = computeDimensionScores(rawAnswers)
 * // → { aether: 72, fire: 44, air: 63, water: 38, earth: 55 }
 *
 * // Pass to the API route:
 * await fetch('/api/generate-results', {
 *   method: 'POST',
 *   body: JSON.stringify({ userId, dimensionScores, past, present, future }),
 * })
 * ```
 */
export function computeDimensionScores(answers: RawAnswers): DimensionScores {
  return {
    aether: scoreDimension('aether', answers).score,
    fire:   scoreDimension('fire',   answers).score,
    air:    scoreDimension('air',    answers).score,
    water:  scoreDimension('water',  answers).score,
    earth:  scoreDimension('earth',  answers).score,
  }
}

// ─── Full scoring pipeline (used by results page) ─────────────────────────────

/**
 * Full scoring pipeline — extends `computeDimensionScores` with per-dimension
 * profiles, coherence, and an overall score. Used by the results page and
 * Supabase persistence layer. The `dimensions` field is identical to what
 * `computeDimensionScores` returns.
 */
export function scoreAssessment(answers: RawAnswers): ScoringResult {
  const dimensionScores = {} as DimensionScores
  const profiles        = {} as Record<Dimension, DimensionProfile>
  let coherenceSum      = 0

  for (const dim of DIMENSIONS) {
    const { score, rawAverage, adjustedValues } = scoreDimension(dim, answers)

    dimensionScores[dim] = score

    const coherence = computeDimensionCoherence(adjustedValues)
    coherenceSum   += coherence

    profiles[dim] = { score, balance: getBalance(score), rawAverage }
  }

  const overallScore   = clamp(Math.round(
    Object.values(dimensionScores).reduce((a, b) => a + b, 0) / DIMENSIONS.length
  ))
  const coherenceScore = Math.round(coherenceSum / DIMENSIONS.length)

  return { dimensions: dimensionScores, profiles, coherenceScore, overallScore }
}

export function getWeakestDimension(scores: DimensionScores): Dimension {
  let min: Dimension = 'aether'
  let minVal = Infinity
  for (const [key, val] of Object.entries(scores) as [Dimension, number][]) {
    if (val < minVal) {
      minVal = val
      min = key
    }
  }
  return min
}

export function getStrongestDimension(scores: DimensionScores): Dimension {
  let max: Dimension = 'aether'
  let maxVal = -Infinity
  for (const [key, val] of Object.entries(scores) as [Dimension, number][]) {
    if (val > maxVal) {
      maxVal = val
      max = key
    }
  }
  return max
}

export type EvolutionState =
  | 'fragmented'
  | 'emerging'
  | 'integrated'
  | 'advanced'
  | 'unified'

export function getEvolutionState(overallScore: number): EvolutionState {
  if (overallScore < 25) return 'fragmented'
  if (overallScore < 45) return 'emerging'
  if (overallScore < 63) return 'integrated'
  if (overallScore < 80) return 'advanced'
  return 'unified'
}

export const STATE_ORDER: EvolutionState[] = [
  'fragmented',
  'emerging',
  'integrated',
  'advanced',
  'unified',
]

export function getNextState(current: EvolutionState): EvolutionState | null {
  const idx = STATE_ORDER.indexOf(current)
  if (idx === -1 || idx === STATE_ORDER.length - 1) return null
  return STATE_ORDER[idx + 1]
}

export function getDimensionInterpretation(dimension: Dimension, score: number): string {
  const balance = getBalance(score)

  const interpretations: Record<Dimension, Record<DimensionBalance, string>> = {
    aether: {
      low:    'Your sense of purpose feels distant or unclear. You may be living by others\' scripts rather than your own.',
      medium: 'You have some connection to your direction, though it shifts. The signal is there — it needs strengthening.',
      high:   'You operate from a clear inner compass. Purpose is not something you search for — it moves through you.',
    },
    fire: {
      low:    'Your drive to act is suppressed or inconsistent. Energy is present but not yet channeled into momentum.',
      medium: 'You can move when needed, but sustaining force over time is the challenge. The spark needs oxygen.',
      high:   'You are a natural initiator. Willpower, follow-through, and the capacity to begin again define you.',
    },
    air: {
      low:    'Mental clarity is blocked — by noise, emotion, or habit. Your thinking needs space to unfold.',
      medium: 'You think well in familiar territory but can get lost when complexity increases. Discernment is developing.',
      high:   'Your mind moves cleanly through complexity. You see patterns, hold nuance, and communicate with precision.',
    },
    water: {
      low:    'Emotional life is compressed or avoided. You may feel disconnected from yourself or others around you.',
      medium: 'You feel, but not always freely. There are places you go, and places you don\'t. Integration is the work.',
      high:   'You are emotionally fluent — able to feel deeply, empathize precisely, and use emotion as intelligence.',
    },
    earth: {
      low:    'Grounding is weak. Ideas and intentions exist, but crossing the threshold into physical reality is difficult.',
      medium: 'You can execute, but consistency and embodied discipline remain unsteady. The ground is there — trust it.',
      high:   'You build. Your word and your body are aligned. What you intend, you enact. Results follow you.',
    },
  }

  return interpretations[dimension][balance]
}
