// AETHERIUM SYSTEM INDEX
// Central export surface for the full intelligence engine

export * from "./schema";
export * from "./constants";
export * from "./scoring";
export * from "./visuals";
export * from "./archetypes";
export * from "./pathways";
export * from "./practices";
export * from "./fusion";

// ─── Re-import everything needed for buildUserState + AETHERIUM_ROSETTA ───────

import type { DimensionKey, UserState, CoherenceResult } from "./schema";
import { DIMENSIONS, DIMENSION_MAP }                     from "./constants";
import { buildDimensionScores, computeCoherence,
         getStrongestDimension, getWeakestDimension }    from "./scoring";
import { ARCHETYPES, matchArchetypes,
         getPrimaryArchetype, getSecondaryArchetype,
         getShadowArchetype }                            from "./archetypes";
import { derivePathwayStage }                            from "./pathways";
import { PRACTICES, recommendPractices }                 from "./practices";
import { buildMandalaVisualState }                       from "./visuals";

// ─── buildUserState ───────────────────────────────────────────────────────────
// Single entry-point: takes raw 0–100 dimension scores, returns full UserState.
//
//   import { buildUserState } from '@/lib/aetherium/system'
//   const state = buildUserState({ aether: 72, fire: 44, air: 63, water: 38, earth: 55 })

export function buildUserState(
  rawScores: Record<DimensionKey, number>
): UserState {
  // 1. Scored dimensions (clamped + bucketed + stated)
  const dimensions = buildDimensionScores(rawScores)

  // 2. Coherence
  const { score: coherenceRaw, variance } = computeCoherence(dimensions)
  const strongestDimension = getStrongestDimension(dimensions)
  const weakestDimension   = getWeakestDimension(dimensions)
  const stage              = derivePathwayStage(coherenceRaw)

  const coherence: CoherenceResult = {
    score:             Math.round(coherenceRaw),
    stage,
    strongestDimension,
    weakestDimension,
    variance,
  }

  // 3. Archetypes
  const topMatches       = matchArchetypes(dimensions)
  const primaryArchetype = getPrimaryArchetype(topMatches)
  const secondaryArchetype = getSecondaryArchetype(topMatches)
  const shadowArchetype  = getShadowArchetype(topMatches)

  // 4. Practices for the weakest dimension
  const recommendedPractices = recommendPractices(
    weakestDimension,
    stage,
    primaryArchetype?.archetypeKey
  )

  return {
    dimensions,
    coherence,
    primaryArchetype,
    secondaryArchetype,
    shadowArchetype,
    topMatches,
    recommendedPractices,
  }
}

// ─── AETHERIUM_ROSETTA ────────────────────────────────────────────────────────
// The canonical descriptor of the entire system.
// Exposes all static data + the primary builder so any consumer can understand
// and use the full engine without importing individual sub-modules.
//
//   import { AETHERIUM_ROSETTA } from '@/lib/aetherium/system'
//   AETHERIUM_ROSETTA.build({ aether: 72, fire: 44, air: 63, water: 38, earth: 55 })

export const AETHERIUM_ROSETTA = {
  // ── System identity ───────────────────────────────────────────────────────
  version:     '1.0.0',
  description: 'Five-dimensional human intelligence system mapping Intention, Volition, Cognition, Emotion, and Action into an integrated identity profile.',

  // ── Ontology ──────────────────────────────────────────────────────────────
  dimensions:   DIMENSIONS,
  dimensionMap: DIMENSION_MAP,
  archetypes:   ARCHETYPES,
  practices:    PRACTICES,

  // ── Scale ─────────────────────────────────────────────────────────────────
  scoring: {
    min:    0,
    max:    100,
    buckets: { low: [0, 33], medium: [34, 66], high: [67, 100] } as const,
    states:  { blocked: [0, 20], underactive: [21, 40], balanced: [41, 60], strong: [61, 80], dominant: [81, 100] } as const,
  },

  // ── Pathway stages ────────────────────────────────────────────────────────
  stages: ['fragmented', 'emerging', 'integrated', 'advanced', 'unified'] as const,

  // ── Visual helpers ────────────────────────────────────────────────────────
  buildMandala: buildMandalaVisualState,

  // ── Primary entry-point ───────────────────────────────────────────────────
  // buildUserState(rawScores) → UserState
  build: buildUserState,
} as const
