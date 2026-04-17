/**
 * shadow.ts
 *
 * CANONICAL SHADOW LOGIC — LOCKED
 *
 * Canon rule: "Shadow should not be guessed from the second-closest match.
 * It should be derived from the lowest dimension and the specific shadow
 * trigger rules in the table."
 *
 * The 7 Shadow-category archetypes each have a specific trigger pattern
 * mapped to dimension deficiencies. This module matches the user's weakest
 * dimension(s) to the appropriate shadow archetype.
 */

import { SHADOW_ARCHETYPES, type Archetype } from './definitions'
import { normalizeScores } from './matcher'
import type { DimensionScores } from '../scoring/engine'
import type { Dimension } from '../assessment/questions'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ShadowResult {
  archetype:       Archetype
  trigger:         string     // The shadow trigger from the canon
  integrationPath: string     // What the user needs to develop
}

// ── Shadow trigger mapping ───────────────────────────────────────────────────
//
// Each shadow archetype activates based on specific dimensional patterns.
// Derived from the canon vectors and shadow trigger descriptions.
//
// Overthinker: Air dominant, everything else collapsed → fear of wrong move
// Drifter:     All low except slight Water → avoidance, no direction
// Controller:  Fire+Earth high, Water crushed → fear of uncertainty
// Avoider:     Everything passive/low → discomfort avoidance
// People-Pleaser: Water dominant, Aether/Fire crushed → rejection fear
// Perfectionist:  Air dominant, Water low → fear of imperfection
// Burnout:     All dimensions near zero → system collapse

const DIMS: Dimension[] = ['aether', 'fire', 'air', 'water', 'earth']

/**
 * Derive the shadow archetype from the user's scores.
 *
 * Algorithm:
 *   1. Normalize to 0–5 scale
 *   2. Check for Burnout (all dimensions ≤ 1.0)
 *   3. Find weakest dimension
 *   4. Match weakest dimension to shadow archetype trigger pattern
 *   5. Use dimensional profile to disambiguate when multiple shadows
 *      could apply to the same weak dimension
 */
export function deriveShadow(scores: DimensionScores): ShadowResult {
  const normalized = normalizeScores(scores)

  // Check for Burnout: all dimensions ≤ 1.0 on the 0–5 scale
  const allCollapsed = DIMS.every(d => normalized[d] <= 1.0)
  if (allCollapsed) {
    const burnout = SHADOW_ARCHETYPES.find(a => a.id === 'burnout')!
    return {
      archetype: burnout,
      trigger: burnout.shadowTrigger,
      integrationPath: burnout.rebalancingPath,
    }
  }

  // Find weakest and strongest dimensions
  let weakestVal = Infinity
  let strongestVal = -Infinity
  let strongest: Dimension = 'aether'

  for (const dim of DIMS) {
    if (normalized[dim] < weakestVal) weakestVal = normalized[dim]
    if (normalized[dim] > strongestVal) { strongestVal = normalized[dim]; strongest = dim }
  }

  // Collect ALL dimensions tied for weakest (within 0.1 tolerance)
  const weakDims = DIMS.filter(d => normalized[d] <= weakestVal + 0.1)

  // Check for Drifter pattern: many dimensions collapsed, only 1-2 elevated
  // When 3+ dimensions are at the floor, the dominant pattern is diffusion/drift
  const collapsedCount = DIMS.filter(d => normalized[d] <= 1.5).length
  if (collapsedCount >= 3) {
    // If strongest is Water with everything else low → Drifter (diffuse, no direction)
    // Unless Fire+Earth are both strong → Controller
    if (normalized.fire >= 3.5 && normalized.earth >= 3.5) {
      return {
        archetype: SHADOW_ARCHETYPES.find(a => a.id === 'controller')!,
        trigger: 'Fear of uncertainty',
        integrationPath: 'Increase Water (Emotion); soften Fire (Volition).',
      }
    }
    // If only Air is high → Overthinker
    if (strongest === 'air' && normalized.air >= 3.5) {
      const overthinker = SHADOW_ARCHETYPES.find(a => a.id === 'overthinker')!
      return {
        archetype: overthinker,
        trigger: overthinker.shadowTrigger,
        integrationPath: overthinker.rebalancingPath,
      }
    }
    // Water dominant with Aether collapsed → People-Pleaser (connection without purpose)
    if (strongest === 'water' && normalized.water >= 4.0 && normalized.aether <= 1.5) {
      const pp = SHADOW_ARCHETYPES.find(a => a.id === 'people-pleaser')!
      return {
        archetype: pp,
        trigger: pp.shadowTrigger,
        integrationPath: pp.rebalancingPath,
      }
    }
    // General collapse with slight/moderate Water → Drifter
    if (strongest === 'water' || collapsedCount >= 4) {
      const drifter = SHADOW_ARCHETYPES.find(a => a.id === 'drifter')!
      return {
        archetype: drifter,
        trigger: drifter.shadowTrigger,
        integrationPath: drifter.rebalancingPath,
      }
    }
  }

  // For single-weakest scenarios, use the standard matching
  // Pick the most meaningful weakest: prefer fire (can't act), then water (can't feel),
  // then aether (no direction), then earth (can't execute), then air
  const weakPriority: Dimension[] = ['fire', 'water', 'aether', 'earth', 'air']
  const weakest = weakDims.length === 1
    ? weakDims[0]
    : weakPriority.find(d => weakDims.includes(d)) ?? weakDims[0]

  // Match based on weakest dimension + dominant dimension pattern
  const shadow = matchShadowArchetype(weakest, strongest, normalized)

  return {
    archetype: shadow,
    trigger: shadow.shadowTrigger,
    integrationPath: shadow.rebalancingPath,
  }
}

/**
 * Shadow matching rules derived from canon:
 *
 * Weakest = Fire (can't act):
 *   - If Air is strongest → Overthinker (thinking replaces acting)
 *   - If Water is strongest → Drifter (feeling without direction)
 *   - Otherwise → Avoider (general inaction)
 *
 * Weakest = Water (can't feel/trust):
 *   - If Fire+Earth are strong → Controller (force without flow)
 *   - If Air is strongest → Perfectionist (precision without heart)
 *   - Otherwise → Controller (default when Water is crushed)
 *
 * Weakest = Aether (no direction):
 *   - If Water is strongest → People-Pleaser (others' needs replace own purpose)
 *   - If Fire is strongest → Rebel with no cause → maps to Drifter
 *   - Otherwise → Drifter (movement without direction)
 *
 * Weakest = Earth (can't execute):
 *   - If Air is strongest → Overthinker or Perfectionist
 *   - If Aether is strongest → Drifter (vision without grounding)
 *   - Otherwise → Avoider (avoidance of tangible output)
 *
 * Weakest = Air (can't think clearly):
 *   - If Water is strongest → People-Pleaser (feeling overrides thinking)
 *   - If Fire is strongest → Controller (force without discernment)
 *   - Otherwise → Avoider
 */
function matchShadowArchetype(
  weakest: Dimension,
  strongest: Dimension,
  normalized: { aether: number; fire: number; air: number; water: number; earth: number },
): Archetype {
  const find = (id: string) => SHADOW_ARCHETYPES.find(a => a.id === id)!

  switch (weakest) {
    case 'fire': {
      if (strongest === 'air') return find('overthinker')
      // Water dominant + Fire crushed: self-erasure pattern, not drift
      // High Water (≥4) with no Fire = losing self in others' needs
      if (strongest === 'water' && normalized.water >= 4.0) return find('people-pleaser')
      if (strongest === 'water') return find('drifter')
      return find('avoider')
    }
    case 'water': {
      if (normalized.fire >= 3.5 && normalized.earth >= 3.5) return find('controller')
      if (strongest === 'air') return find('perfectionist')
      return find('controller')
    }
    case 'aether': {
      if (strongest === 'water') return find('people-pleaser')
      return find('drifter')
    }
    case 'earth': {
      if (strongest === 'air' && normalized.air >= 4) return find('perfectionist')
      if (strongest === 'air') return find('overthinker')
      if (strongest === 'aether') return find('drifter')
      return find('avoider')
    }
    case 'air': {
      if (strongest === 'water') return find('people-pleaser')
      // Fire dominant + Air weak: force without discernment = Controller pattern
      // The Controller uses power without clarity, regardless of Earth level
      if (strongest === 'fire' && normalized.fire >= 3.5) return find('controller')
      if (strongest === 'fire') return find('controller')
      return find('avoider')
    }
    default:
      return find('avoider')
  }
}

/**
 * Build a human-readable shadow integration description.
 */
export function buildShadowIntegration(shadow: Archetype, userScores: DimensionScores): string {
  if (shadow.growthDimension) {
    const dimLabels: Record<Dimension, string> = {
      aether: 'intention and purpose',
      fire:   'will and action',
      air:    'clarity and discernment',
      water:  'feeling and trust',
      earth:  'grounding and execution',
    }
    return `Your shadow pattern asks you to develop ${dimLabels[shadow.growthDimension]}. ${shadow.practiceOrientation}`
  }
  // Burnout / special cases
  return shadow.rebalancingPath
}
