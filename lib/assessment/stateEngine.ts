/**
 * stateEngine.ts
 *
 * Converts raw dimension scores (0–100) into a structured UserProfile that
 * powers the mandala, archetype display, and insight layers.
 *
 * Sits downstream of scoring/engine.ts — takes its DimensionScores output
 * and adds activation classification, visual state, and profile derivation.
 *
 * Output shape (mirrors the requested format, adapted to existing naming):
 * {
 *   dimensions: {
 *     aether: { score: 72, activation: "balanced" },
 *     fire:   { score: 44, activation: "balanced" },
 *     ...
 *   },
 *   archetype: "The Philosopher",
 *   stage: "integrated"
 * }
 */

import type { Dimension } from '../assessment/questions'
import type { DimensionScores, EvolutionState } from '../scoring/engine'
import { getEvolutionState } from '../scoring/engine'
import { ARCHETYPES } from '../archetypes/definitions'

// ─────────────────────────────────────────────────────────────────────────────
// 1. Activation Classification
// ─────────────────────────────────────────────────────────────────────────────

export type DimensionActivation = 'balanced' | 'overactive' | 'underactive' | 'blocked'

/**
 * Thresholds (on 0–100 scale):
 *   blocked     → < 20   (severely constrained, fragmented)
 *   underactive → 20–39  (present but suppressed)
 *   balanced    → 40–75  (healthy operating range)
 *   overactive  → 76–100 (dominant, can cause imbalance)
 */
export function classifyActivation(score: number): DimensionActivation {
  if (score < 20) return 'blocked'
  if (score < 40) return 'underactive'
  if (score < 76) return 'balanced'
  return 'overactive'
}

export const ACTIVATION_THRESHOLDS = {
  blocked:     [0,  20] as [number, number],
  underactive: [20, 40] as [number, number],
  balanced:    [40, 76] as [number, number],
  overactive:  [76, 100] as [number, number],
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. UserProfile Shape
// ─────────────────────────────────────────────────────────────────────────────

export interface DimensionState {
  score:      number               // 0–100 (from scoring engine)
  activation: DimensionActivation
}

export interface UserProfile {
  dimensions:      Record<Dimension, DimensionState>
  archetype:       string           // e.g. "The Philosopher"
  archetypeId:     string           // e.g. "the-philosopher"
  archetypeTagline: string
  stage:           EvolutionState   // fragmented | emerging | integrated | advanced | unified
  coherence:       number           // 0–100: balance quality across all dimensions
  overallScore:    number           // 0–100: mean of all 5 scores
  growthEdge:      Dimension        // lowest-scoring dimension (most limiting)
  shadowDimension: Dimension        // most overactive OR most divergent dimension
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Archetype Similarity Matching
// ─────────────────────────────────────────────────────────────────────────────

const DIMS: Dimension[] = ['aether', 'fire', 'air', 'water', 'earth']

function scoreArchetypeSimilarity(
  userScores: DimensionScores,
  profile: { aether: number; fire: number; air: number; water: number; earth: number }
): number {
  // Euclidean distance, lower = better match
  const sumSq = DIMS.reduce((acc, d) => {
    const diff = userScores[d] - profile[d]
    return acc + diff * diff
  }, 0)
  // Convert to similarity (0–1): max possible distance ≈ 223 (sqrt of 5*100²)
  return 1 - Math.sqrt(sumSq) / 223
}

function deriveArchetype(scores: DimensionScores, stage: EvolutionState) {
  const stageOrder: EvolutionState[] = ['fragmented', 'emerging', 'integrated', 'advanced', 'unified']
  const stageIdx = stageOrder.indexOf(stage)

  // Consider own stage + one adjacent stage on each side
  const candidates = ARCHETYPES.filter(a => {
    const aIdx = stageOrder.indexOf(a.state)
    return Math.abs(aIdx - stageIdx) <= 1
  })

  const ranked = candidates
    .map(a => ({ archetype: a, similarity: scoreArchetypeSimilarity(scores, a.profile) }))
    .sort((a, b) => b.similarity - a.similarity)

  return ranked[0].archetype
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Coherence & Balance Metrics
// ─────────────────────────────────────────────────────────────────────────────

function computeCoherence(scores: DimensionScores): number {
  const vals = DIMS.map(d => scores[d])
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  const variance = vals.reduce((acc, v) => acc + (v - avg) ** 2, 0) / vals.length
  const stdDev = Math.sqrt(variance)
  // Coherence = average quality penalised by spread; max spread on 0-100 ≈ 50
  const coherence = avg - stdDev * 0.8
  return Math.round(Math.max(0, Math.min(100, coherence)))
}

function deriveShadowDimension(
  scores: DimensionScores,
  growthEdge: Dimension
): Dimension {
  // Shadow = most overactive dimension, or — if none overactive —
  // the dimension most divergent from the mean (excluding growthEdge)
  const overactive = DIMS.filter(d => d !== growthEdge && scores[d] >= 76)
  if (overactive.length > 0) {
    return overactive.reduce((a, b) => scores[a] > scores[b] ? a : b)
  }
  const avg = DIMS.reduce((acc, d) => acc + scores[d], 0) / DIMS.length
  return DIMS
    .filter(d => d !== growthEdge)
    .reduce((a, b) => Math.abs(scores[a] - avg) > Math.abs(scores[b] - avg) ? a : b)
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Main Engine
// ─────────────────────────────────────────────────────────────────────────────

export function computeUserProfile(scores: DimensionScores): UserProfile {
  const dimensions = Object.fromEntries(
    DIMS.map(d => [d, { score: scores[d], activation: classifyActivation(scores[d]) }])
  ) as Record<Dimension, DimensionState>

  const vals = DIMS.map(d => scores[d])
  const overallScore = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  const stage = getEvolutionState(overallScore)
  const coherence = computeCoherence(scores)

  const growthEdge = DIMS.reduce((a, b) => scores[a] < scores[b] ? a : b)
  const shadowDimension = deriveShadowDimension(scores, growthEdge)

  const archetype = deriveArchetype(scores, stage)

  return {
    dimensions,
    archetype:        archetype.name,
    archetypeId:      archetype.id,
    archetypeTagline: archetype.tagline,
    stage,
    coherence,
    overallScore,
    growthEdge,
    shadowDimension,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Evolution Stage Metadata
// ─────────────────────────────────────────────────────────────────────────────

export const STAGE_META: Record<EvolutionState, { label: string; description: string; color: string }> = {
  fragmented:  { label: 'Fragmented',  color: '#e05a3a', description: 'Highly imbalanced. Energy is present but lacks coherent direction.' },
  emerging:    { label: 'Emerging',    color: '#d4853a', description: 'Partial alignment forming. One or two dimensions are leading.' },
  integrated:  { label: 'Integrated',  color: '#9590ec', description: 'Most dimensions balanced. The system is beginning to work together.' },
  advanced:    { label: 'Advanced',    color: '#4a9fd4', description: 'Strong alignment and consistency across all dimensions.' },
  unified:     { label: 'Unified',     color: '#2db885', description: 'High coherence. All dimensions expressed with clarity and integration.' },
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Activation Visual Properties (used by DimensionMandala)
// ─────────────────────────────────────────────────────────────────────────────

export interface ActivationVisual {
  strokeOpacity:   (normalised: number) => number  // 0–1 input
  strokeWidthScale: (normalised: number) => number  // multiplier on baseStrokeWidth
  fillOpacity:     (normalised: number) => number
  dashArray:       (circumference: number) => string | undefined
  animClass:       string
}

export const ACTIVATION_VISUALS: Record<DimensionActivation, ActivationVisual> = {
  balanced: {
    strokeOpacity:    n => 0.28 + n * 0.42,          // 0.28–0.70
    strokeWidthScale: n => 0.50 + n * 0.75,          // 50%–125% of base
    fillOpacity:      n => 0.02 + n * 0.06,          // 0.02–0.08
    dashArray:        ()  => undefined,
    animClass:        'dm-balanced',
  },
  overactive: {
    strokeOpacity:    n => 0.55 + n * 0.35,          // 0.55–0.90
    strokeWidthScale: n => 0.85 + n * 0.50,          // 85%–135% of base
    fillOpacity:      n => 0.06 + n * 0.10,          // 0.06–0.16
    dashArray:        ()  => undefined,
    animClass:        'dm-overactive',
  },
  underactive: {
    strokeOpacity:    n => 0.10 + n * 0.18,          // 0.10–0.28
    strokeWidthScale: n => 0.25 + n * 0.50,          // 25%–75% of base
    fillOpacity:      n => 0.01 + n * 0.02,          // 0.01–0.03
    dashArray:        ()  => undefined,
    animClass:        'dm-underactive',
  },
  blocked: {
    strokeOpacity:    n => 0.06 + n * 0.10,          // 0.06–0.16
    strokeWidthScale: n => 0.15 + n * 0.28,          // 15%–43% of base
    fillOpacity:      ()  => 0,
    // Fragmented segments proportional to circumference (~11 visible arcs)
    dashArray: c => {
      const seg = c / 14
      return `${(seg * 0.68).toFixed(1)} ${(seg * 0.32).toFixed(1)}`
    },
    animClass: 'dm-blocked',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Demo / Default State  (used on homepage before assessment is taken)
// ─────────────────────────────────────────────────────────────────────────────

/** Representative "Emerging → Integrated" profile for homepage demo */
export const DEMO_SCORES: DimensionScores = {
  aether: 72,
  fire:   44,
  air:    63,
  water:  38,
  earth:  55,
}

export const DEMO_PROFILE: UserProfile = computeUserProfile(DEMO_SCORES)
