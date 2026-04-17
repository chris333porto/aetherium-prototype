/**
 * signal.ts
 *
 * SIGNAL QUALITY LAYER — CANONICAL
 *
 * Canon rules:
 *   1. Balanced system: if all dimensions within ±0.5 on 0–5 scale,
 *      classify as Balanced System before forcing an imbalance narrative.
 *   2. Variance check: if answer variance is below threshold, flag low signal.
 *   3. Inflation bias: if >75% of answers are maximum-value (5), reduce confidence.
 *   4. Flat profile: if normalized dimensions are nearly equal, describe as
 *      balanced or low-resolution rather than forcing a tension claim.
 *
 * Confidence levels:
 *   'high'     — clear signal, full archetype assignment
 *   'moderate' — some noise, archetype assigned with caveat
 *   'low'      — weak signal, invite refinement instead of committing
 */

import type { DimensionScores, RawAnswers } from './engine'
import { normalizeScores } from '../archetypes/matcher'
import type { Dimension } from '../assessment/questions'

// ── Types ────────────────────────────────────────────────────────────────────

export type SignalConfidence = 'high' | 'moderate' | 'low'

export interface SignalQuality {
  confidence:       SignalConfidence
  isBalancedSystem: boolean
  isFlatProfile:    boolean
  hasInflationBias: boolean
  hasLowVariance:   boolean
  flags:            string[]   // human-readable explanations
}

// ── Constants ────────────────────────────────────────────────────────────────

/** Canon: ±0.5 on the 0–5 scale = balanced system */
const BALANCED_THRESHOLD = 0.5

/** If per-question variance across all answers is below this, signal is too uniform */
const LOW_VARIANCE_THRESHOLD = 0.4

/** Canon: if >75% of answers are the maximum value */
const INFLATION_BIAS_RATIO = 0.75

/** If the range of normalized dimensions (0–5) is below this, profile is flat */
const FLAT_PROFILE_RANGE = 0.8

const DIMS: Dimension[] = ['aether', 'fire', 'air', 'water', 'earth']

// ── Core analysis ────────────────────────────────────────────────────────────

/**
 * Analyze signal quality from raw answers and computed dimension scores.
 */
export function analyzeSignalQuality(
  rawAnswers: RawAnswers,
  dimensionScores: DimensionScores,
): SignalQuality {
  const flags: string[] = []

  // 1. Balanced system check (canon rule)
  const normalized = normalizeScores(dimensionScores)
  const normValues = DIMS.map(d => normalized[d])
  const normMean = normValues.reduce((a, b) => a + b, 0) / normValues.length
  const maxDeviation = Math.max(...normValues.map(v => Math.abs(v - normMean)))
  const isBalancedSystem = maxDeviation <= BALANCED_THRESHOLD

  if (isBalancedSystem) {
    flags.push('Your system is balanced across all five dimensions. No forced imbalance narrative.')
  }

  // 2. Variance check
  const answerValues = Object.values(rawAnswers)
  const answerMean = answerValues.reduce((a, b) => a + b, 0) / answerValues.length
  const answerVariance = answerValues.reduce(
    (acc, v) => acc + Math.pow(v - answerMean, 2), 0
  ) / answerValues.length
  const hasLowVariance = answerVariance < LOW_VARIANCE_THRESHOLD

  if (hasLowVariance) {
    flags.push('Your answers show very little variation. The profile may be low-resolution.')
  }

  // 3. Inflation bias check (canon rule: >75% max answers)
  const maxAnswers = answerValues.filter(v => v === 5).length
  const inflationRatio = maxAnswers / answerValues.length
  const hasInflationBias = inflationRatio > INFLATION_BIAS_RATIO

  if (hasInflationBias) {
    flags.push('Most answers are at the maximum value. Confidence is reduced.')
  }

  // 4. Flat profile check
  const normRange = Math.max(...normValues) - Math.min(...normValues)
  const isFlatProfile = normRange < FLAT_PROFILE_RANGE

  if (isFlatProfile && !isBalancedSystem) {
    flags.push('Your dimensional profile shows very little differentiation. Results may be approximate.')
  }

  // Determine overall confidence
  let confidence: SignalConfidence = 'high'
  const issueCount = [hasLowVariance, hasInflationBias, isFlatProfile].filter(Boolean).length

  if (issueCount >= 2 || hasInflationBias) {
    confidence = 'low'
  } else if (issueCount === 1 || isBalancedSystem) {
    confidence = 'moderate'
  }

  return {
    confidence,
    isBalancedSystem,
    isFlatProfile,
    hasInflationBias,
    hasLowVariance,
    flags,
  }
}

/**
 * Should the system suppress imbalance-based narratives?
 * True when the system is balanced OR the profile is too flat to make claims.
 */
export function shouldSuppressImbalance(signal: SignalQuality): boolean {
  return signal.isBalancedSystem || (signal.isFlatProfile && signal.confidence === 'low')
}
