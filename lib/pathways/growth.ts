/**
 * growth.ts
 *
 * Growth profile derivation — CANONICAL
 *
 * Canon rule: "Use the table's Growth Edge as the directional instruction
 * for the archetype." Growth edge comes from the MATCHED archetype, not
 * from the lowest dimension score.
 *
 * Evolution pathway uses archetype categories (Core → Expansion → Transcendent)
 * as progression direction, not the old 5-state linear ladder.
 */

import type { DimensionScores, EvolutionState } from '../scoring/engine'
import {
  getWeakestDimension,
  getStrongestDimension,
  getEvolutionState,
  getNextState,
  STATE_ORDER,
} from '../scoring/engine'
import {
  ARCHETYPES,
  type Archetype,
  type ArchetypeCategory,
} from '../archetypes/definitions'
import { DIMENSION_META, type Dimension } from '../assessment/questions'

// ── Types ────────────────────────────────────────────────────────────────────

export interface GrowthEdge {
  dimension:   Dimension | null  // null for Burnout (restore), Embodied Self (sustain), Unified Being (evolve)
  label:       string
  score:       number
  description: string
  practices:   string[]
}

export interface EvolutionStep {
  label:       string
  state:       EvolutionState   // kept for backward compat with results page
  archetype:   Archetype | null
  description: string
}

export interface EvolutionPathway {
  current: EvolutionStep
  next:    EvolutionStep
  future:  EvolutionStep
}

export interface PathwayOption {
  id:                    string
  title:                 string
  targetArchetype:       Archetype
  growthDimension:       Dimension | null
  description:           string
  transitionDescription: string
}

export interface GrowthProfile {
  growthEdge:        GrowthEdge
  currentState:      EvolutionState
  pathwayOptions:    PathwayOption[]
  evolutionPathway:  EvolutionPathway
  practices:         string[]
}

// ── Growth descriptions & practices (per dimension) ──────────────────────────

const GROWTH_EDGE_DESCRIPTIONS: Record<Dimension, string> = {
  aether: 'Your growth edge is Intention. The work is clarifying what you are truly here to do and aligning your life around that signal — not the noise of others\' expectations.',
  fire:   'Your growth edge is Volition. The work is developing the will to begin, the discipline to continue, and the resilience to finish. Action is the teacher now.',
  air:    'Your growth edge is Cognition. The work is clearing the mental fog — learning to think with precision, hold complexity without collapse, and communicate your inner world.',
  water:  'Your growth edge is Emotion. The work is feeling more fully — not as indulgence, but as intelligence. The unacknowledged emotional life is holding you back.',
  earth:  'Your growth edge is Grounding. The work is incarnation — bringing what you know, feel, and intend into consistent physical reality. Results are the currency of Earth.',
}

const GROWTH_PRACTICES: Record<Dimension, string[]> = {
  aether: [
    'Write your purpose statement — one sentence, revised weekly until it feels undeniably true.',
    'Spend 10 minutes daily in silence, asking: what do I actually want?',
    'Audit your commitments — remove anything that doesn\'t align with your stated direction.',
  ],
  fire: [
    'Identify one important action you have been avoiding — do it within 24 hours.',
    'Set a single daily focus: one meaningful task completed before anything else.',
    'Track your follow-through for 30 days. The data will show you where the break happens.',
  ],
  air: [
    'Introduce a weekly review: what did you think, decide, and learn this week?',
    'Practice writing one clear, well-reasoned paragraph per day on a complex topic.',
    'When you feel mentally foggy, stop and name 5 things that are factually true right now.',
  ],
  water: [
    'Journal your emotional experience daily — not events, but what you actually felt.',
    'Name one feeling per day that you normally skip past. Sit with it for five minutes.',
    'Tell someone close to you something true that you normally keep private.',
  ],
  earth: [
    'Establish one morning routine and hold it for 21 days without exception.',
    'Complete one physical project — something you can touch and point to.',
    'Spend time in your body daily: walk, train, cook, build, create with your hands.',
  ],
}

// ── Main builder ─────────────────────────────────────────────────────────────

/**
 * Build growth profile using the MATCHED archetype's canonical growth edge,
 * not the raw lowest dimension score.
 *
 * @param scores - User's 0–100 dimension scores
 * @param primaryArchetype - The matched primary archetype from the canon matcher
 */
export function buildGrowthProfile(
  scores: DimensionScores,
  primaryArchetype?: Archetype,
): GrowthProfile {
  const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / 5
  const currentState = getEvolutionState(overallScore)

  // Growth edge: from archetype if available, else from lowest dimension
  const growthDimension = primaryArchetype?.growthDimension ?? getWeakestDimension(scores)
  const weakest = getWeakestDimension(scores)

  const growthEdge: GrowthEdge = growthDimension
    ? {
        dimension: growthDimension,
        label: DIMENSION_META[growthDimension].label,
        score: scores[growthDimension],
        description: primaryArchetype
          ? `${primaryArchetype.growthEdge}. ${GROWTH_EDGE_DESCRIPTIONS[growthDimension]}`
          : GROWTH_EDGE_DESCRIPTIONS[growthDimension],
        practices: GROWTH_PRACTICES[growthDimension],
      }
    : {
        // Special cases: Burnout (restore), Embodied Self (sustain), Unified Being (evolve)
        dimension: null,
        label: primaryArchetype?.growthEdge ?? 'Restore',
        score: overallScore,
        description: primaryArchetype?.rebalancingPath ?? 'Restore balance across all dimensions.',
        practices: primaryArchetype?.practiceOrientation
          ? [primaryArchetype.practiceOrientation]
          : GROWTH_PRACTICES[weakest],
      }

  // Pathway options: archetypes that develop the growth dimension
  const pathwayOptions = buildPathwayOptions(scores, growthDimension ?? weakest, primaryArchetype)

  // Evolution pathway (kept for UI compatibility)
  const evolutionPathway = buildEvolutionPathway(scores, currentState)

  return {
    growthEdge,
    currentState,
    pathwayOptions,
    evolutionPathway,
    practices: growthDimension ? GROWTH_PRACTICES[growthDimension] : GROWTH_PRACTICES[weakest],
  }
}

// ── Pathway options ──────────────────────────────────────────────────────────

/**
 * Category progression order for pathway selection.
 * Shadow → Core → Expansion → Transcendent
 */
const CATEGORY_ORDER: ArchetypeCategory[] = ['shadow', 'core', 'expansion', 'transcendent']

function getNextCategory(current: ArchetypeCategory): ArchetypeCategory {
  const idx = CATEGORY_ORDER.indexOf(current)
  return CATEGORY_ORDER[Math.min(idx + 1, CATEGORY_ORDER.length - 1)]
}

function buildPathwayOptions(
  scores: DimensionScores,
  growthDimension: Dimension,
  primaryArchetype?: Archetype,
): PathwayOption[] {
  const currentCategory = primaryArchetype?.category ?? 'core'
  const nextCategory = getNextCategory(currentCategory)

  // Find archetypes that have the growth dimension as a high vector value
  const candidates = ARCHETYPES.filter(a => {
    // Prefer archetypes in the next category or same category
    const inRange = a.category === nextCategory || a.category === currentCategory
    // Must have meaningful expression of the growth dimension
    const hasGrowthStrength = a.vector[growthDimension] >= 3
    return inRange && hasGrowthStrength
  })

  // Sort by vector strength in the growth dimension
  candidates.sort((a, b) => b.vector[growthDimension] - a.vector[growthDimension])

  return candidates.slice(0, 3).map(archetype => ({
    id: archetype.id,
    title: `Toward ${archetype.name}`,
    targetArchetype: archetype,
    growthDimension,
    description: archetype.corePattern,
    transitionDescription: `By developing ${DIMENSION_META[growthDimension].label}, you begin to embody qualities of ${archetype.name}.`,
  }))
}

// ── Evolution pathway (backward-compatible) ──────────────────────────────────

function buildEvolutionPathway(
  scores: DimensionScores,
  currentState: EvolutionState,
): EvolutionPathway {
  const currentStateIdx = STATE_ORDER.indexOf(currentState)

  const currentArchetype = findClosestArchetype(scores, ARCHETYPES)
  const nextState = STATE_ORDER[Math.min(currentStateIdx + 1, STATE_ORDER.length - 1)]
  const futureState = STATE_ORDER[Math.min(currentStateIdx + 2, STATE_ORDER.length - 1)]

  const stateDescriptions: Record<EvolutionState, string> = {
    fragmented: 'Scattered and searching. The pieces have not yet found their pattern.',
    emerging:   'Awakening into potential. Direction is forming, capacity is growing.',
    integrated: 'The dimensions are working together. A coherent self is present.',
    advanced:   'Mastery is visible. The inner and outer are increasingly aligned.',
    unified:    'All dimensions serve the whole. Expression is effortless and complete.',
  }

  return {
    current: {
      label: 'WHERE YOU ARE',
      state: currentState,
      archetype: currentArchetype,
      description: stateDescriptions[currentState],
    },
    next: {
      label: 'NEXT HORIZON',
      state: nextState,
      archetype: null,
      description: stateDescriptions[nextState],
    },
    future: {
      label: 'FUTURE STATE',
      state: futureState,
      archetype: null,
      description: stateDescriptions[futureState],
    },
  }
}

function findClosestArchetype(scores: DimensionScores, pool: Archetype[]): Archetype | null {
  if (pool.length === 0) return null

  // Compare on 0–5 scale to match archetype vectors
  const norm = {
    aether: (scores.aether / 100) * 5,
    fire:   (scores.fire   / 100) * 5,
    air:    (scores.air    / 100) * 5,
    water:  (scores.water  / 100) * 5,
    earth:  (scores.earth  / 100) * 5,
  }

  let closest = pool[0]
  let minDist = Infinity

  for (const archetype of pool) {
    const dist = Math.sqrt(
      Math.pow(norm.aether - archetype.vector.aether, 2) +
      Math.pow(norm.fire   - archetype.vector.fire,   2) +
      Math.pow(norm.air    - archetype.vector.air,    2) +
      Math.pow(norm.water  - archetype.vector.water,  2) +
      Math.pow(norm.earth  - archetype.vector.earth,  2)
    )
    if (dist < minDist) {
      minDist = dist
      closest = archetype
    }
  }

  return closest
}

// ── Exports for backward compat ──────────────────────────────────────────────

export const STATE_LABELS: Record<EvolutionState, string> = {
  fragmented: 'Fragmented',
  emerging:   'Emerging',
  integrated: 'Integrated',
  advanced:   'Advanced',
  unified:    'Unified',
}
