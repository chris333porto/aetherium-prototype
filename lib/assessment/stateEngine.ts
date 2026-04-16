/**
 * stateEngine.ts
 *
 * Converts raw dimension scores (0–100) into a structured UserProfile that
 * powers the mandala, archetype display, and insight layers.
 *
 * Updated for canonical 32-archetype system:
 *   - Uses archetype.vector (0–5 scale) for matching
 *   - No category-constrained matching — all 32 compete
 *   - Category is descriptive (core/expansion/shadow/transcendent), not a progression stage
 */

import type { Dimension } from '../assessment/questions'
import type { DimensionScores, EvolutionState } from '../scoring/engine'
import { getEvolutionState } from '../scoring/engine'
import { ARCHETYPES, type Archetype, type ArchetypeCategory } from '../archetypes/definitions'

// ─────────────────────────────────────────────────────────────────────────────
// 1. Activation Classification
// ─────────────────────────────────────────────────────────────────────────────

export type DimensionActivation = 'balanced' | 'overactive' | 'underactive' | 'blocked'

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
  score:      number
  activation: DimensionActivation
}

export interface UserProfile {
  dimensions:        Record<Dimension, DimensionState>
  archetype:         string
  archetypeId:       string
  archetypeTagline:  string
  archetypeCategory: ArchetypeCategory
  stage:             EvolutionState     // backward compat (derived from overall score)
  coherence:         number
  overallScore:      number
  growthEdge:        Dimension
  shadowDimension:   Dimension
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Archetype Similarity Matching (uses 0–5 canonical vectors)
// ─────────────────────────────────────────────────────────────────────────────

const DIMS: Dimension[] = ['aether', 'fire', 'air', 'water', 'earth']

function scoreArchetypeSimilarity(
  userScores: DimensionScores,
  archetype: Archetype,
): number {
  // Normalize user scores to 0–5 scale to match canon vectors
  const sumSq = DIMS.reduce((acc, d) => {
    const userNorm = (userScores[d] / 100) * 5
    const diff = userNorm - archetype.vector[d]
    return acc + diff * diff
  }, 0)
  const distance = Math.sqrt(sumSq)
  // Canon similarity formula
  return 1 / (1 + distance)
}

function deriveArchetype(scores: DimensionScores): Archetype {
  // Match against ALL 32 archetypes — no category filtering (canon requirement)
  const ranked = ARCHETYPES
    .map(a => ({ archetype: a, similarity: scoreArchetypeSimilarity(scores, a) }))
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
  const coherence = avg - stdDev * 0.8
  return Math.round(Math.max(0, Math.min(100, coherence)))
}

function deriveShadowDimension(
  scores: DimensionScores,
  growthEdge: Dimension
): Dimension {
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

  const archetype = deriveArchetype(scores)

  return {
    dimensions,
    archetype:         archetype.name,
    archetypeId:       archetype.id,
    archetypeTagline:  archetype.aiOutput,  // Use canonical AI output
    archetypeCategory: archetype.category,
    stage,
    coherence,
    overallScore,
    growthEdge,
    shadowDimension,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Evolution Stage Metadata (kept for UI backward compat)
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
  strokeOpacity:   (normalised: number) => number
  strokeWidthScale: (normalised: number) => number
  fillOpacity:     (normalised: number) => number
  dashArray:       (circumference: number) => string | undefined
  animClass:       string
}

export const ACTIVATION_VISUALS: Record<DimensionActivation, ActivationVisual> = {
  balanced: {
    strokeOpacity:    n => 0.28 + n * 0.42,
    strokeWidthScale: n => 0.50 + n * 0.75,
    fillOpacity:      n => 0.02 + n * 0.06,
    dashArray:        ()  => undefined,
    animClass:        'dm-balanced',
  },
  overactive: {
    strokeOpacity:    n => 0.55 + n * 0.35,
    strokeWidthScale: n => 0.85 + n * 0.50,
    fillOpacity:      n => 0.06 + n * 0.10,
    dashArray:        ()  => undefined,
    animClass:        'dm-overactive',
  },
  underactive: {
    strokeOpacity:    n => 0.10 + n * 0.18,
    strokeWidthScale: n => 0.25 + n * 0.50,
    fillOpacity:      n => 0.01 + n * 0.02,
    dashArray:        ()  => undefined,
    animClass:        'dm-underactive',
  },
  blocked: {
    strokeOpacity:    n => 0.06 + n * 0.10,
    strokeWidthScale: n => 0.15 + n * 0.28,
    fillOpacity:      ()  => 0,
    dashArray: c => {
      const seg = c / 14
      return `${(seg * 0.68).toFixed(1)} ${(seg * 0.32).toFixed(1)}`
    },
    animClass: 'dm-blocked',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Demo / Default State
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_SCORES: DimensionScores = {
  aether: 72,
  fire:   44,
  air:    63,
  water:  38,
  earth:  55,
}

export const DEMO_PROFILE: UserProfile = computeUserProfile(DEMO_SCORES)
