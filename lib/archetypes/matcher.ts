/**
 * matcher.ts
 *
 * CANONICAL ARCHETYPE MATCHING — LOCKED
 *
 * Implements the matching algorithm from the Master Canon:
 *   1. Normalize user 0–100 scores to 0–5 scale
 *   2. Weighted Euclidean distance (deficient 1.25×, dominant 1.10×, neutral 1.00×)
 *   3. Similarity = 1 / (1 + weighted_distance)
 *   4. Match against ALL 32 archetypes (no category filtering)
 *   5. Top match = Primary, second = Secondary, third = Tertiary
 *
 * Shadow is handled separately in shadow.ts per canon rules.
 */

import { ARCHETYPES, type Archetype, type ArchetypeVector } from './definitions'
import { deriveShadow } from './shadow'
import type { DimensionScores } from '../scoring/engine'
import type { Dimension } from '../assessment/questions'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ArchetypeMatch {
  archetype:  Archetype
  similarity: number   // 0–1 (higher = closer match)
  percentage: number   // 0–100 (normalized across top matches)
}

export interface ArchetypeBlend {
  primary:    ArchetypeMatch
  secondary:  ArchetypeMatch
  tertiary:   ArchetypeMatch
  shadow:     Archetype
  blendTitle: string
}

// ── Normalization: 0–100 → 0–5 (canon requirement) ──────────────────────────

export function normalizeToCanonScale(score100: number): number {
  return Math.round(((score100 / 100) * 5) * 100) / 100  // round to 2 decimals
}

export function normalizeScores(scores: DimensionScores): ArchetypeVector {
  return {
    aether: normalizeToCanonScale(scores.aether),
    fire:   normalizeToCanonScale(scores.fire),
    air:    normalizeToCanonScale(scores.air),
    water:  normalizeToCanonScale(scores.water),
    earth:  normalizeToCanonScale(scores.earth),
  }
}

// ── Weighted Euclidean distance (canon formula) ──────────────────────────────

const DIMS: Dimension[] = ['aether', 'fire', 'air', 'water', 'earth']

/**
 * Canon weights:
 *   - Deficient dimensions (user's lowest) get 1.25× weight
 *   - Dominant dimensions (user's highest) get 1.10× weight
 *   - All others get 1.00×
 */
function getDimensionWeights(userVector: ArchetypeVector): Record<Dimension, number> {
  let minVal = Infinity
  let maxVal = -Infinity
  let minDim: Dimension = 'aether'
  let maxDim: Dimension = 'aether'

  for (const dim of DIMS) {
    const val = userVector[dim]
    if (val < minVal) { minVal = val; minDim = dim }
    if (val > maxVal) { maxVal = val; maxDim = dim }
  }

  const weights: Record<string, number> = {}
  for (const dim of DIMS) {
    if (dim === minDim) weights[dim] = 1.25
    else if (dim === maxDim) weights[dim] = 1.10
    else weights[dim] = 1.00
  }

  return weights as Record<Dimension, number>
}

function weightedEuclideanDistance(
  user: ArchetypeVector,
  archetype: ArchetypeVector,
  weights: Record<Dimension, number>,
): number {
  let sumSq = 0
  for (const dim of DIMS) {
    const diff = user[dim] - archetype[dim]
    sumSq += weights[dim] * diff * diff
  }
  return Math.sqrt(sumSq)
}

// ── Core matching ────────────────────────────────────────────────────────────

/**
 * Rank ALL 32 archetypes by similarity to user's normalized vector.
 * No category filtering — canon requirement.
 */
export function matchArchetypes(scores: DimensionScores): ArchetypeMatch[] {
  const userVector = normalizeScores(scores)
  const weights = getDimensionWeights(userVector)

  const matches = ARCHETYPES.map(archetype => {
    const distance = weightedEuclideanDistance(userVector, archetype.vector, weights)
    const similarity = 1 / (1 + distance)
    return { archetype, similarity, percentage: 0 }
  })

  matches.sort((a, b) => b.similarity - a.similarity)
  return matches
}

// ── Build complete blend ─────────────────────────────────────────────────────

export function buildArchetypeBlend(scores: DimensionScores): ArchetypeBlend {
  const all = matchArchetypes(scores)
  const top3 = all.slice(0, 3)

  // Normalize top 3 similarities to percentages summing to 100
  const totalSim = top3.reduce((sum, m) => sum + m.similarity, 0)
  const normalized = top3.map(m => ({
    ...m,
    percentage: Math.round((m.similarity / totalSim) * 100),
  }))

  // Fix rounding to ensure sum = 100 (distribute to largest, not always first)
  const sum = normalized.reduce((s, m) => s + m.percentage, 0)
  if (sum !== 100) {
    // Find the match with the largest similarity to absorb the rounding error
    const maxIdx = normalized.reduce(
      (best, m, i) => m.similarity > normalized[best].similarity ? i : best, 0
    )
    normalized[maxIdx].percentage += 100 - sum
  }

  // Shadow: derived from canon shadow rules (weakest dimension + shadow archetypes)
  const shadow = deriveShadow(scores)

  const blendTitle = buildBlendTitle(normalized[0].archetype, normalized[1].archetype)

  return {
    primary:   normalized[0],
    secondary: normalized[1],
    tertiary:  normalized[2],
    shadow:    shadow.archetype,
    blendTitle,
  }
}

// ── Blend title generation ───────────────────────────────────────────────────

function buildBlendTitle(primary: Archetype, secondary: Archetype): string {
  // Primary archetype name is always the anchor
  // Secondary modifies the expression
  const key = `${primary.id}+${secondary.id}`
  return BLEND_TITLES[key] ?? `${primary.name}`
}

/**
 * Blend title lookup: "primary+secondary" → custom blend name.
 * Only populated for common/meaningful pairings.
 * Falls back to primary name for unlisted combinations.
 */
const BLEND_TITLES: Record<string, string> = {
  // ── CORE PRIMARY ──────────────────────────────────────────────────────────
  // Strategist
  'strategist+visionary':    'The Strategic Visionary',
  'strategist+builder':      'The Master Planner',
  'strategist+integrator':   'The Systems Architect',
  'strategist+refiner':      'The Precision Strategist',
  'strategist+alchemist':    'The Transforming Strategist',
  'strategist+sage':         'The Wise Strategist',
  'strategist+analyst':      'The Deep Strategist',

  // Builder
  'builder+operator':        'The Infrastructure Builder',
  'builder+catalyst':        'The Driven Builder',
  'builder+leader':          'The Building Leader',
  'builder+strategist':      'The Strategic Builder',
  'builder+guardian':        'The Steady Builder',
  'builder+refiner':         'The Precision Builder',

  // Seeker
  'seeker+creator':          'The Seeking Creator',
  'seeker+explorer':         'The Deep Explorer',
  'seeker+visionary':        'The Visionary Seeker',
  'seeker+healer':           'The Seeking Healer',
  'seeker+alchemist':        'The Transforming Seeker',
  'seeker+sage':             'The Wise Seeker',

  // Guardian
  'guardian+connector':      'The Protecting Connector',
  'guardian+healer':         'The Guardian Healer',
  'guardian+builder':        'The Steady Guardian',
  'guardian+operator':       'The Grounded Guardian',
  'guardian+harmonizer':     'The Harmonizing Guardian',

  // Catalyst
  'catalyst+leader':         'The Catalytic Leader',
  'catalyst+rebel':          'The Activating Force',
  'catalyst+performer':      'The Electric Catalyst',
  'catalyst+builder':        'The Grounding Catalyst',
  'catalyst+visionary':      'The Visionary Catalyst',

  // Creator
  'creator+seeker':          'The Inspired Seeker',
  'creator+visionary':       'The Visionary Creator',
  'creator+explorer':        'The Exploring Creator',
  'creator+healer':          'The Restoring Creator',
  'creator+harmonizer':      'The Harmonizing Creator',
  'creator+alchemist':       'The Alchemical Creator',

  // Integrator
  'integrator+strategist':   'The Synthesizing Strategist',
  'integrator+teacher':      'The Integrating Teacher',
  'integrator+alchemist':    'The Weaving Integrator',
  'integrator+sage':         'The Integrating Sage',
  'integrator+refiner':      'The Refining Integrator',

  // Visionary
  'visionary+seeker':        'The Prophetic Seeker',
  'visionary+creator':       'The Inspired Visionary',
  'visionary+alchemist':     'The Transformative Visionary',
  'visionary+magician':      'The Visionary Magician',
  'visionary+strategist':    'The Strategic Visionary',
  'visionary+sage':          'The Prophetic Sage',

  // Refiner
  'refiner+strategist':      'The Strategic Refiner',
  'refiner+analyst':         'The Analytical Refiner',
  'refiner+integrator':      'The Integrating Refiner',
  'refiner+perfectionist':   'The Exacting Refiner',
  'refiner+builder':         'The Precision Builder',

  // Connector
  'connector+healer':        'The Connecting Healer',
  'connector+guardian':      'The Nurturing Connector',
  'connector+harmonizer':    'The Harmonizing Connector',
  'connector+creator':       'The Creative Connector',
  'connector+explorer':      'The Bridging Explorer',

  // ── EXPANSION PRIMARY ─────────────────────────────────────────────────────
  // Leader
  'leader+catalyst':         'The Leading Catalyst',
  'leader+orchestrator':     'The Directing Orchestrator',
  'leader+builder':          'The Leading Builder',
  'leader+strategist':       'The Strategic Leader',
  'leader+visionary':        'The Visionary Leader',

  // Operator
  'operator+builder':        'The Operating Builder',
  'operator+refiner':        'The Precision Operator',
  'operator+strategist':     'The Strategic Operator',
  'operator+controller':     'The Controlled Operator',

  // Explorer
  'explorer+seeker':         'The Exploring Seeker',
  'explorer+creator':        'The Exploring Creator',
  'explorer+healer':         'The Wandering Healer',
  'explorer+connector':      'The Bridging Explorer',

  // Healer
  'healer+connector':        'The Healing Connector',
  'healer+guardian':         'The Healing Guardian',
  'healer+harmonizer':       'The Restoring Harmonizer',
  'healer+creator':          'The Creative Healer',
  'healer+seeker':           'The Seeking Healer',

  // Teacher
  'teacher+sage':            'The Teaching Sage',
  'teacher+integrator':      'The Teaching Integrator',
  'teacher+strategist':      'The Strategic Teacher',
  'teacher+harmonizer':      'The Harmonizing Teacher',
  'teacher+alchemist':       'The Alchemical Teacher',

  // Performer
  'performer+catalyst':      'The Performing Catalyst',
  'performer+leader':        'The Performing Leader',
  'performer+creator':       'The Expressive Creator',
  'performer+rebel':         'The Rebellious Performer',
  'performer+operator':      'The Performing Operator',

  // Analyst
  'analyst+strategist':      'The Analytical Strategist',
  'analyst+refiner':         'The Precision Analyst',
  'analyst+integrator':      'The Analytical Integrator',
  'analyst+overthinker':     'The Deep Analyst',
  'analyst+sage':            'The Observing Sage',

  // Rebel
  'rebel+catalyst':          'The Rebellious Catalyst',
  'rebel+performer':         'The Rebellious Performer',
  'rebel+leader':            'The Disruptive Leader',
  'rebel+visionary':         'The Revolutionary Visionary',

  // ── SHADOW PRIMARY (when matched as primary — compassion context) ─────────
  // Overthinker
  'overthinker+avoider':     'The Frozen Mind',
  'overthinker+analyst':     'The Spiraling Analyst',
  'overthinker+perfectionist':'The Paralyzed Perfectionist',
  'overthinker+strategist':  'The Stalled Strategist',
  'overthinker+drifter':     'The Lost Thinker',

  // Drifter
  'drifter+avoider':         'The Unmoored Self',
  'drifter+people-pleaser':  'The Dissolving Self',
  'drifter+explorer':        'The Wandering Soul',
  'drifter+seeker':          'The Untethered Seeker',

  // Controller
  'controller+builder':      'The Iron Builder',
  'controller+operator':     'The Rigid Operator',
  'controller+leader':       'The Overholding Leader',
  'controller+catalyst':     'The Forced Catalyst',

  // Avoider
  'avoider+drifter':         'The Withdrawn Self',
  'avoider+overthinker':     'The Frozen Self',
  'avoider+people-pleaser':  'The Disappeared Self',
  'avoider+harmonizer':      'The Silent Harmonizer',

  // People-Pleaser
  'people-pleaser+connector':'The Self-Erasing Connector',
  'people-pleaser+healer':   'The Depleted Healer',
  'people-pleaser+guardian':  'The Overgiving Guardian',
  'people-pleaser+avoider':  'The Invisible Self',

  // Perfectionist
  'perfectionist+refiner':   'The Endless Refiner',
  'perfectionist+analyst':   'The Paralyzed Analyst',
  'perfectionist+overthinker':'The Spiraling Perfectionist',
  'perfectionist+strategist': 'The Stalled Strategist',

  // Burnout
  'burnout+avoider':         'The Collapsed Self',
  'burnout+drifter':         'The Depleted Drifter',
  'burnout+people-pleaser':  'The Emptied Giver',

  // ── TRANSCENDENT PRIMARY ──────────────────────────────────────────────────
  // Alchemist
  'alchemist+sage':          'The Alchemical Sage',
  'alchemist+magician':      'The Transforming Magician',
  'alchemist+visionary':     'The Alchemical Visionary',
  'alchemist+integrator':    'The Weaving Alchemist',
  'alchemist+strategist':    'The Strategic Alchemist',

  // Sage
  'sage+alchemist':          'The Sage Alchemist',
  'sage+teacher':            'The Teaching Sage',
  'sage+integrator':         'The Integrating Sage',
  'sage+visionary':          'The Prophetic Sage',
  'sage+strategist':         'The Strategic Sage',

  // Orchestrator
  'orchestrator+leader':     'The Orchestrating Leader',
  'orchestrator+magician':   'The Orchestrating Magician',
  'orchestrator+builder':    'The Master Orchestrator',
  'orchestrator+strategist': 'The Strategic Orchestrator',

  // Harmonizer
  'harmonizer+healer':       'The Harmonizing Healer',
  'harmonizer+connector':    'The Harmonizing Connector',
  'harmonizer+creator':      'The Harmonizing Creator',
  'harmonizer+guardian':     'The Peaceful Guardian',
  'harmonizer+teacher':      'The Harmonizing Teacher',
  'harmonizer+avoider':      'The Quiet Harmonizer',

  // Magician
  'magician+alchemist':      'The Magical Alchemist',
  'magician+orchestrator':   'The Magical Orchestrator',
  'magician+visionary':      'The Magical Visionary',
  'magician+leader':         'The Magical Leader',
  'magician+creator':        'The Magical Creator',

  // Embodied Self
  'embodied-self+harmonizer':'The Grounded Harmonizer',
  'embodied-self+builder':   'The Integrated Builder',
  'embodied-self+guardian':  'The Integrated Guardian',

  // Unified Being
  'unified-being+orchestrator':'The Unified Orchestrator',
  'unified-being+magician':    'The Complete Magician',
}
