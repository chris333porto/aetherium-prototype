/**
 * shadow.ts
 * Shadow archetype logic — the suppressed or unintegrated self.
 *
 * The shadow is not the "worst" archetype. It is the one within the user's
 * current state that they are most divergent from — representing the qualities
 * they are avoiding, projecting, or refusing to embody.
 */

import { ARCHETYPES, type Archetype } from './definitions'
import type { DimensionScores, EvolutionState } from '../scoring/engine'

export interface ShadowAnalysis {
  archetype: Archetype
  /** The raw shadow text from the archetype definition */
  shadowText: string
  /** A dynamic integration prompt based on what's suppressed */
  integrationPath: string
  /** Which dimensions most reveal the shadow dynamic */
  shadowDimensions: string[]
}

/**
 * Find the shadow archetype: the archetype in the user's current state
 * that is the LEAST similar to the user's profile.
 *
 * Requires the full ranked match list (all archetypes, sorted by similarity desc).
 */
export function getShadowArchetype(
  rankedMatches: Array<{ archetype: Archetype; similarity: number }>,
  primaryState: EvolutionState
): Archetype {
  // Filter to same state as primary, take the least similar
  const sameState = rankedMatches.filter(m => m.archetype.state === primaryState)

  if (sameState.length > 0) {
    return sameState[sameState.length - 1].archetype
  }

  // Fallback: global least similar
  return rankedMatches[rankedMatches.length - 1].archetype
}

/**
 * Build a full shadow analysis from the shadow archetype and the user's scores.
 */
export function buildShadowAnalysis(
  shadow: Archetype,
  userScores: DimensionScores
): ShadowAnalysis {
  // Find dimensions where shadow profile diverges most from user
  const dimensions = ['aether', 'fire', 'air', 'water', 'earth'] as const
  const divergences = dimensions.map(dim => ({
    dim,
    delta: shadow.profile[dim] - userScores[dim],
  }))

  // Shadow dimensions = where the archetype scores MUCH higher than the user
  // (these are the suppressed/projected qualities)
  const shadowDimensions = divergences
    .filter(d => d.delta > 20)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 2)
    .map(d => d.dim)

  const integrationPath = buildIntegrationPath(shadow, shadowDimensions)

  return {
    archetype: shadow,
    shadowText: shadow.shadow,
    integrationPath,
    shadowDimensions,
  }
}

function buildIntegrationPath(shadow: Archetype, shadowDims: string[]): string {
  if (shadowDims.length === 0) {
    return `The path to integrating your ${shadow.name} shadow begins with honest acknowledgment — the qualities you see in others that you haven't yet claimed in yourself.`
  }

  const dimLabels: Record<string, string> = {
    aether: 'intention',
    fire:   'volition',
    air:    'clarity',
    water:  'feeling',
    earth:  'grounded action',
  }

  const labelList = shadowDims.map(d => dimLabels[d] ?? d).join(' and ')

  return `Your ${shadow.name} shadow asks you to develop ${labelList}. Not to become this archetype — but to stop projecting or suppressing what it represents.`
}

/**
 * Quick lookup: get shadow archetype for a set of user scores + state.
 * Convenience wrapper that doesn't require pre-ranked matches.
 */
export function computeShadow(
  userScores: DimensionScores,
  state: EvolutionState
): ShadowAnalysis {
  const stateArchetypes = ARCHETYPES.filter(a => a.state === state)

  if (stateArchetypes.length === 0) {
    // Fallback to full set
    const fallback = ARCHETYPES[ARCHETYPES.length - 1]
    return buildShadowAnalysis(fallback, userScores)
  }

  // Find least similar in state via euclidean distance (highest = most divergent)
  let shadow = stateArchetypes[0]
  let maxDist = -Infinity

  for (const archetype of stateArchetypes) {
    const dist = Math.sqrt(
      Math.pow(userScores.aether - archetype.profile.aether, 2) +
      Math.pow(userScores.fire   - archetype.profile.fire,   2) +
      Math.pow(userScores.air    - archetype.profile.air,    2) +
      Math.pow(userScores.water  - archetype.profile.water,  2) +
      Math.pow(userScores.earth  - archetype.profile.earth,  2)
    )
    if (dist > maxDist) {
      maxDist = dist
      shadow = archetype
    }
  }

  return buildShadowAnalysis(shadow, userScores)
}
