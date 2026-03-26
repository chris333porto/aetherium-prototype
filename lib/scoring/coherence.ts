/**
 * coherence.ts
 * Coherence scoring — measures internal consistency of responses.
 *
 * Two layers:
 *  1. Per-dimension coherence: are the 10 answers for one dimension consistent?
 *  2. Global coherence: are the five dimension scores balanced or wildly spread?
 *
 * Both return 0–100 scores where 100 = perfectly coherent.
 */

/**
 * Compute coherence for a single dimension.
 * Input: array of scored values (after reverse-scoring), each in [1–5].
 * Higher coherence = answers cluster tightly around the mean.
 *
 * Max variance on a 1–5 scale: ~4 (alternating 1 and 5).
 */
export function computeDimensionCoherence(scoredValues: number[]): number {
  if (scoredValues.length === 0) return 0
  const mean = scoredValues.reduce((a, b) => a + b, 0) / scoredValues.length
  const variance = scoredValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / scoredValues.length
  const normalized = 1 - variance / 4
  return Math.round(Math.max(0, Math.min(1, normalized)) * 100)
}

/**
 * Compute global coherence from per-dimension coherences + normalized scores.
 *
 * Formula:
 *   base = average of per-dimension coherence scores
 *   spread_penalty = up to 15 points if dimension scores are very unbalanced
 *   global = base - spread_penalty
 *
 * A profile where one dimension is 95 and another is 5 is less coherent overall
 * than one where all dimensions sit near the same value.
 */
export function computeGlobalCoherence(
  dimensionCoherences: number[],  // one per dimension, 0–100
  dimensionScores: number[]       // normalized 0–100 per dimension
): number {
  if (dimensionCoherences.length === 0) return 0

  const baseCoherence =
    dimensionCoherences.reduce((a, b) => a + b, 0) / dimensionCoherences.length

  // Spread = standard deviation of dimension scores
  const scoreMean = dimensionScores.reduce((a, b) => a + b, 0) / dimensionScores.length
  const scoreVariance =
    dimensionScores.reduce((acc, v) => acc + Math.pow(v - scoreMean, 2), 0) / dimensionScores.length
  const stdDev = Math.sqrt(scoreVariance)

  // stdDev of ~28 = max realistic spread for a 0–100 range (all at extremes)
  const spreadPenalty = Math.min(15, (stdDev / 28) * 15)

  return Math.round(Math.max(0, baseCoherence - spreadPenalty))
}

/**
 * Classify a coherence score into a descriptive tier.
 */
export type CoherenceTier = 'fragmented' | 'inconsistent' | 'moderate' | 'consistent' | 'integrated'

export function getCoherenceTier(coherenceScore: number): CoherenceTier {
  if (coherenceScore < 40) return 'fragmented'
  if (coherenceScore < 55) return 'inconsistent'
  if (coherenceScore < 70) return 'moderate'
  if (coherenceScore < 85) return 'consistent'
  return 'integrated'
}

export function getCoherenceDescription(tier: CoherenceTier): string {
  const descriptions: Record<CoherenceTier, string> = {
    fragmented:   'Your responses show significant internal contradiction. This may reflect genuine turbulence, or ambivalence in self-perception.',
    inconsistent: 'Some inconsistency in how you answered. Your self-understanding is forming — not yet crystallized.',
    moderate:     'Reasonable internal consistency. You have a coherent self-image with some unresolved areas.',
    consistent:   'Your responses are internally consistent. Your self-model is stable and clearly held.',
    integrated:   'Exceptionally coherent responses. You have a precise and integrated understanding of yourself.',
  }
  return descriptions[tier]
}
