/**
 * normalize.ts
 * Pure normalization utilities — no side effects, no imports.
 * Used by the scoring engine and any future scoring variants.
 */

export type DimensionBalance = 'low' | 'medium' | 'high'

/**
 * Normalize a raw Likert average [1–5] to a 0–100 score.
 */
export function normalizeScore(rawAverage: number): number {
  return Math.round(((rawAverage - 1) / 4) * 100)
}

/**
 * Map a 0–100 score to a three-tier balance bucket.
 *   0–33  = low
 *   34–66 = medium
 *   67–100 = high
 */
export function getBalance(score: number): DimensionBalance {
  if (score < 34) return 'low'
  if (score < 67) return 'medium'
  return 'high'
}

/**
 * Return a human-readable label for a balance bucket.
 */
export function balanceLabel(balance: DimensionBalance): string {
  return balance.charAt(0).toUpperCase() + balance.slice(1)
}

/**
 * Clamp a number to [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
