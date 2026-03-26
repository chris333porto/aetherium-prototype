import type { DimensionScores, EvolutionState } from '../scoring/engine'
import {
  getWeakestDimension,
  getStrongestDimension,
  getEvolutionState,
  getNextState,
  STATE_ORDER,
} from '../scoring/engine'
import { ARCHETYPES, type Archetype } from '../archetypes/definitions'
import { DIMENSION_META, type Dimension } from '../assessment/questions'

export interface GrowthEdge {
  dimension: Dimension
  label: string
  score: number
  description: string
  practices: string[]
}

export interface EvolutionStep {
  label: string
  state: EvolutionState
  archetype: Archetype | null
  description: string
}

export interface EvolutionPathway {
  current: EvolutionStep
  next: EvolutionStep
  future: EvolutionStep
}

export interface PathwayOption {
  id: string
  title: string
  targetArchetype: Archetype
  growthDimension: Dimension
  description: string
  transitionDescription: string
}

export interface GrowthProfile {
  growthEdge: GrowthEdge
  currentState: EvolutionState
  pathwayOptions: PathwayOption[]
  evolutionPathway: EvolutionPathway
  practices: string[]
}

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

export function buildGrowthProfile(scores: DimensionScores): GrowthProfile {
  const weakest = getWeakestDimension(scores)
  const strongest = getStrongestDimension(scores)
  const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / 5
  const currentState = getEvolutionState(overallScore)
  const nextState = getNextState(currentState)

  // Growth edge
  const growthEdge: GrowthEdge = {
    dimension: weakest,
    label: DIMENSION_META[weakest].label,
    score: scores[weakest],
    description: GROWTH_EDGE_DESCRIPTIONS[weakest],
    practices: GROWTH_PRACTICES[weakest],
  }

  // Build pathway options: archetypes in the next state that have high expression
  // of the weakest dimension (above 55)
  const targetArchetypes = nextState
    ? ARCHETYPES.filter(a => {
        if (a.state !== nextState) return false
        const weakScore = a.profile[weakest]
        return weakScore >= 55
      })
    : ARCHETYPES.filter(a => {
        if (a.state !== currentState) return false
        return a.profile[weakest] >= 65
      })

  // Sort by how well they express the growth dimension
  targetArchetypes.sort((a, b) => b.profile[weakest] - a.profile[weakest])

  // Take up to 3 pathway options
  const pathwayOptions: PathwayOption[] = targetArchetypes.slice(0, 3).map(archetype => ({
    id: archetype.id,
    title: `Toward ${archetype.name}`,
    targetArchetype: archetype,
    growthDimension: weakest,
    description: archetype.description,
    transitionDescription: buildTransitionDescription(currentState, archetype, weakest),
  }))

  // If no options found (e.g. at unified), use current state archetypes
  if (pathwayOptions.length === 0) {
    const currentStateOptions = ARCHETYPES
      .filter(a => a.state === currentState && a.profile[weakest] >= 60)
      .slice(0, 2)
    pathwayOptions.push(...currentStateOptions.map(archetype => ({
      id: archetype.id,
      title: `Deepen into ${archetype.name}`,
      targetArchetype: archetype,
      growthDimension: weakest,
      description: archetype.description,
      transitionDescription: buildTransitionDescription(currentState, archetype, weakest),
    })))
  }

  // Evolution pathway: YOU → NEXT → FUTURE
  const evolution = buildEvolutionPathway(scores, currentState)

  return {
    growthEdge,
    currentState,
    pathwayOptions: pathwayOptions.slice(0, 3),
    evolutionPathway: evolution,
    practices: GROWTH_PRACTICES[weakest],
  }
}

function buildTransitionDescription(
  from: EvolutionState,
  to: Archetype,
  growthDimension: Dimension
): string {
  const dimLabel = DIMENSION_META[growthDimension].label
  return `By developing ${dimLabel}, you begin to embody qualities of ${to.name} — ${to.tagline.toLowerCase()}`
}

function buildEvolutionPathway(
  scores: DimensionScores,
  currentState: EvolutionState
): EvolutionPathway {
  const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / 5
  const currentStateIdx = STATE_ORDER.indexOf(currentState)

  // Current step — find closest matching archetype in current state
  const currentStateArchetypes = ARCHETYPES.filter(a => a.state === currentState)
  const currentArchetype = findClosestArchetype(scores, currentStateArchetypes)

  // Next step
  const nextState = STATE_ORDER[Math.min(currentStateIdx + 1, STATE_ORDER.length - 1)]
  const nextStateArchetypes = ARCHETYPES.filter(a => a.state === nextState)
  const nextArchetype = findClosestArchetype(scores, nextStateArchetypes)

  // Future step (2 levels up)
  const futureState = STATE_ORDER[Math.min(currentStateIdx + 2, STATE_ORDER.length - 1)]
  const futureStateArchetypes = ARCHETYPES.filter(a => a.state === futureState)
  const futureArchetype = findClosestArchetype(scores, futureStateArchetypes)

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
      archetype: nextArchetype,
      description: stateDescriptions[nextState],
    },
    future: {
      label: 'FUTURE STATE',
      state: futureState,
      archetype: futureArchetype,
      description: stateDescriptions[futureState],
    },
  }
}

function findClosestArchetype(scores: DimensionScores, pool: Archetype[]): Archetype | null {
  if (pool.length === 0) return null

  let closest = pool[0]
  let minDist = Infinity

  for (const archetype of pool) {
    const dist = Math.sqrt(
      Math.pow(scores.aether - archetype.profile.aether, 2) +
      Math.pow(scores.fire   - archetype.profile.fire,   2) +
      Math.pow(scores.air    - archetype.profile.air,    2) +
      Math.pow(scores.water  - archetype.profile.water,  2) +
      Math.pow(scores.earth  - archetype.profile.earth,  2)
    )
    if (dist < minDist) {
      minDist = dist
      closest = archetype
    }
  }

  return closest
}

export const STATE_LABELS: Record<EvolutionState, string> = {
  fragmented: 'Fragmented',
  emerging:   'Emerging',
  integrated: 'Integrated',
  advanced:   'Advanced',
  unified:    'Unified',
}
