/**
 * lib/intelligence/index.ts
 *
 * Pure intelligence layer — derives actionable insights, alignment schedules,
 * practice enrichments, and score-history utilities from a ResultPayload.
 *
 * All exports are pure functions or static data. No side effects. No UI.
 */

import type { ResultPayload } from '@/lib/types/results'
import { DIMENSION_META }     from '@/lib/assessment/questions'
import type { Dimension }     from '@/lib/assessment/questions'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AlignmentAction {
  slot:      'Morning' | 'Focus Block' | 'Evening'
  action:    string
  dimension: Dimension
  priority:  'critical' | 'important' | 'maintain'
}

export interface ImbalanceInsight {
  headline:     string   // e.g. "AETHER is outrunning WATER by 34 points"
  gap:          number   // raw point spread
  body:         string   // what the spread means
  behavioral:   string   // how it shows up day-to-day
  intervention: string   // the single highest-leverage action
}

export interface PracticeEnrichment {
  why:       string    // rationale for the practice
  dimension: Dimension // which dimension it primarily serves
  impact:    string    // what changes if you do it
  timeframe: string    // e.g. "2–3 weeks"
}

export interface ScoreSnapshot {
  date:           string                      // ISO timestamp
  dimensions:     Record<Dimension, number>   // 0–100 per dimension
  coherenceScore: number
  overallScore:   number
  archetypeName:  string
}

// ─── Tension statements ───────────────────────────────────────────────────────
// Maps (dominant, growth edge) → a precise mirror statement.

const TENSION_MAP: Partial<Record<Dimension, Partial<Record<Dimension, string>>>> = {
  aether: {
    fire:  'Vision is clear — but it is not yet moving through your hands into the world.',
    air:   'You orient toward meaning — but precision of thought has not yet learned to serve that purpose.',
    water: 'You generate vision and meaning with ease — but what you feel is not yet fully integrated into how you live.',
    earth: 'The intention is present. What is missing is the sustained discipline to make it real.',
  },
  fire: {
    aether: 'You act — but not always in the direction that is truly yours.',
    air:    'Drive without discernment. The will is strong; the direction still needs sharpening.',
    water:  'You move fast. The parts of you that need to be felt are being left behind.',
    earth:  'Energy fires well — but the follow-through, the steady grind, is where it breaks.',
  },
  air: {
    aether: 'You think clearly — but have not yet decided what is worth thinking about.',
    fire:   'The mind is sharp. The will to act on what it knows has not yet arrived.',
    water:  'You can see everything — except what you feel.',
    earth:  'Clarity without execution is still just thought.',
  },
  water: {
    aether: 'You feel deeply — but the question of what you are truly here to do remains open.',
    fire:   'Rich in feeling, low in motion. The next move is to let emotion become direction.',
    air:    'Emotion is present and alive. The thinking to channel it has not caught up.',
    earth:  'What you feel is real — it just has not yet landed in the physical world.',
  },
  earth: {
    aether: 'You build well — but have not yet asked: what is this truly for?',
    fire:   'Results come. But they arrive through habit, not hunger.',
    air:    'Grounded in action — but the mind could serve the hands better.',
    water:  'Execution is strong. The emotional intelligence to sustain it is still forming.',
  },
}

export function getTension(dominant: Dimension, growth: Dimension): string {
  if (dominant === growth) {
    return 'All five dimensions are seeking balance. The system is asking for integration across the board.'
  }
  return (
    TENSION_MAP[dominant]?.[growth] ??
    `Your ${DIMENSION_META[dominant].label.toLowerCase()} is well-developed. The work now is deepening ${DIMENSION_META[growth].label.toLowerCase()}.`
  )
}

// ─── Today's alignment ────────────────────────────────────────────────────────
// One targeted action per time slot, derived from growth edge + secondary weak.

const MORNING_ACTIONS: Record<Dimension, string> = {
  aether: 'Before opening your phone — write one sentence about what matters most to you today.',
  fire:   'Name the one important action you have been avoiding. Start it before anything else.',
  air:    'Write three clear, structured thoughts on one decision you have been deferring.',
  water:  'Name how you actually feel this morning. Not "fine" — the precise word.',
  earth:  'Set one physical intention: one thing that will tangibly exist when you sleep tonight.',
}

const FOCUS_ACTIONS: Record<Dimension, string> = {
  aether: 'Remove one commitment from today that does not serve your stated direction.',
  fire:   'Block 90 minutes of uninterrupted time for the work that matters most. Protect it.',
  air:    'Write one clear, well-reasoned paragraph on a complex question you have been sitting with.',
  water:  'Have a real conversation — not a transactional one. Actually listen to someone today.',
  earth:  'Finish one thing you started and left incomplete. Take it all the way to done.',
}

const EVENING_ACTIONS: Record<Dimension, string> = {
  aether: 'Ask yourself: did today serve who I am becoming? Be honest.',
  fire:   'Measure follow-through. What did you commit to this morning — did you do it?',
  air:    'Write one paragraph of honest reflection. Do not edit yourself.',
  water:  'Tell someone close to you something you genuinely appreciated about them today.',
  earth:  'Set tomorrow up now. The most important action should be unavoidable when you wake.',
}

export function deriveTodayAlignment(data: ResultPayload): AlignmentAction[] {
  const dims    = data.scoring.dimensions
  const edgeDim = data.growthProfile.growthEdge.dimension
  const domDim  = data.dominantDimension

  const sorted = (Object.keys(dims) as Dimension[])
    .map(d => ({ dim: d, score: dims[d] }))
    .sort((a, b) => a.score - b.score)

  // Second weakest (skipping the primary growth edge)
  const secondWeakest = sorted.find(s => s.dim !== edgeDim)?.dim ?? edgeDim

  return [
    { slot: 'Morning',     action: MORNING_ACTIONS[edgeDim],       dimension: edgeDim,       priority: 'critical'  },
    { slot: 'Focus Block', action: FOCUS_ACTIONS[secondWeakest],   dimension: secondWeakest,  priority: 'important' },
    { slot: 'Evening',     action: EVENING_ACTIONS[domDim],        dimension: domDim,         priority: 'maintain'  },
  ]
}

// ─── System imbalance insight ─────────────────────────────────────────────────
// Generates a precise behavioral analysis of the dominant ↔ growth-edge gap.

const BEHAVIORAL_PATTERNS: Partial<Record<Dimension, Partial<Record<Dimension, string>>>> = {
  aether: {
    fire:  'Starting with high inspiration but not completing. Clear vision, absent execution.',
    air:   'Orienting toward meaning without the mental precision to structure or act on it.',
    water: 'Knowing your purpose intellectually while remaining emotionally disconnected from what sustains it.',
    earth: 'The map is drawn. The territory has not been traversed. Vision without incarnation.',
  },
  fire: {
    aether: 'High effort aimed at unclear or inherited goals. Moving fast in the wrong direction.',
    air:    'Acting before thinking. Decisive movement without discernment to aim it well.',
    water:  'Driving over emotional terrain without reading it. Relational cost behind the momentum.',
    earth:  'Strong energy that doesn\'t fully land. Surges of effort, incomplete follow-through.',
  },
  air: {
    aether: 'Thinking sharply without a purpose worth serving. Precision in service of nothing in particular.',
    fire:   'Seeing clearly what needs to happen, but not moving. Analysis in place of action.',
    water:  'Understanding everything intellectually while cut off from your own emotional experience.',
    earth:  'Excellent map, reluctant territory. Consistent gap between what is thought and what is built.',
  },
  water: {
    aether: 'Deep feeling without a container or direction. Emotional richness without clarity on why.',
    fire:   'High inner experience, low outer movement. Feeling everything, acting on little.',
    air:    'Intuition and feeling without the structured thinking to use them reliably.',
    earth:  'Highly developed inner world; underdeveloped outer one. Experience without consistent form.',
  },
  earth: {
    aether: 'Building reliably without fully knowing what it\'s for. Execution in service of unclear purpose.',
    fire:   'Consistent output without hunger. Discipline as default — not as chosen direction.',
    air:    'Working hard without strategic clarity. Excellent execution aimed at the wrong things.',
    water:  'Producing results while losing connection to people. Building things, eroding relationships.',
  },
}

const EDGE_INTERVENTIONS: Record<Dimension, string> = {
  aether: 'Write your purpose statement in one sentence. Revise it weekly until it feels undeniably true.',
  fire:   'Name one important action you have been avoiding and complete it within the next 24 hours.',
  air:    'Introduce a weekly review: what did you think, decide, and learn this week?',
  water:  'Journal your actual emotional experience daily — not events, but what you genuinely felt.',
  earth:  'Establish one morning practice and hold it for 21 days without exception.',
}

export function deriveImbalanceInsight(data: ResultPayload): ImbalanceInsight {
  const { dominantDimension, scoring }  = data
  const edgeDim   = data.growthProfile.growthEdge.dimension
  const domScore  = scoring.dimensions[dominantDimension]
  const edgeScore = scoring.dimensions[edgeDim]
  const gap       = domScore - edgeScore

  const domLabel  = DIMENSION_META[dominantDimension].label
  const edgeLabel = DIMENSION_META[edgeDim].label

  const behavioral =
    BEHAVIORAL_PATTERNS[dominantDimension]?.[edgeDim] ??
    `High ${domLabel.toLowerCase()} with underdeveloped ${edgeLabel.toLowerCase()} creates structural tension between what is expressed and what is needed.`

  return {
    headline:     `${domLabel} is outrunning ${edgeLabel} by ${gap} points`,
    gap,
    body:         `This ${gap}-point spread is the primary imbalance in your system. Your ${domLabel.toLowerCase()} is well-developed — but without corresponding ${edgeLabel.toLowerCase()}, it cannot fully land.`,
    behavioral,
    intervention: EDGE_INTERVENTIONS[edgeDim],
  }
}

// ─── Practice enrichment ──────────────────────────────────────────────────────
// Index-matched to the GROWTH_PRACTICES array in lib/pathways/growth.ts.
// practices[dim][0..2] maps to PRACTICE_META[dim][0..2].

export const PRACTICE_META: Record<Dimension, PracticeEnrichment[]> = {
  aether: [
    {
      why:       'Most people mistake accumulated information for internal clarity. Writing forces the authentic signal to surface through noise.',
      dimension: 'aether',
      impact:    'Separates your real values from adopted ones. Reduces decision fatigue by establishing a stable reference point.',
      timeframe: '2–4 weeks for initial clarity',
    },
    {
      why:       'Silence has a clarifying function that input cannot replicate. The nervous system answers "what do I actually want?" — the rational mind cannot.',
      dimension: 'aether',
      impact:    'Reduces external noise as the primary driver of decisions. Builds a stronger signal-to-noise ratio in internal guidance.',
      timeframe: '1–3 weeks to notice the difference',
    },
    {
      why:       'Fragmented commitments are the structural source of purpose-drift. Each misaligned commitment is a slow leak in the energy system.',
      dimension: 'aether',
      impact:    'Frees significant cognitive bandwidth. Increases clarity by removing what creates internal contradiction.',
      timeframe: 'Immediate relief; cumulative gain over 30 days',
    },
  ],
  fire: [
    {
      why:       'Avoidance compounds. Each deferred action creates a low-grade anxiety that accumulates and consumes energy. Breaking it early resets the system.',
      dimension: 'fire',
      impact:    'Interrupts the avoidance loop neurologically. Builds the habit that not-starting is not the default response.',
      timeframe: '3–7 days to shift the default response',
    },
    {
      why:       'Diffuse attention is the enemy of meaningful output. A single daily focus creates a forcing function that overrides the tendency to be busy without being productive.',
      dimension: 'fire',
      impact:    'Produces one completed meaningful action per day. Over 30 days, this creates a different relationship with follow-through.',
      timeframe: '2 weeks to form; 30 days for identity shift',
    },
    {
      why:       'Most patterns of incomplete follow-through are invisible to the person inside them. Tracking creates the data that interrupts the self-deception loop.',
      dimension: 'fire',
      impact:    'Reveals the exact point where the break happens — which determines the precise intervention required.',
      timeframe: '30 days of data to identify the pattern clearly',
    },
  ],
  air: [
    {
      why:       'Mental fog is often the result of carrying unprocessed decisions. A weekly review externalizes cognitive load and creates space for clear thinking.',
      dimension: 'air',
      impact:    'Reduces decision backlog. Distinguishes between what needs thinking and what is already resolved.',
      timeframe: '2–3 weeks to feel the clarity benefit',
    },
    {
      why:       'Writing a well-structured paragraph forces thinking that reading or conversation does not. The blank page exposes fuzzy reasoning immediately.',
      dimension: 'air',
      impact:    'Develops capacity to hold and communicate complex positions. Builds intellectual confidence and precision over time.',
      timeframe: '3–4 weeks of daily practice for improvement',
    },
    {
      why:       'Mental fog is almost always accompanied by abstraction and catastrophizing. Grounding in concrete facts interrupts the loop at the source.',
      dimension: 'air',
      impact:    'Creates a reliable interrupt for overthinking. Trains the mind to separate what is real from what is projected.',
      timeframe: 'Immediate in-moment effect; habitual within 2 weeks',
    },
  ],
  water: [
    {
      why:       'Emotional experience that is not named is experienced as undifferentiated pressure. Naming creates separation between you and the emotion — the foundation of emotional intelligence.',
      dimension: 'water',
      impact:    'Expands emotional vocabulary. Reduces acting-out patterns. Builds the self-trust that enables relational depth.',
      timeframe: '2–3 weeks of daily practice for a noticeable shift',
    },
    {
      why:       'Emotions are signal. Most people skip the signal because it is uncomfortable. Deliberately sitting with it is where the learning is.',
      dimension: 'water',
      impact:    'Builds capacity to receive emotional information without acting on it or suppressing it. Foundational to integration.',
      timeframe: '1–2 weeks to change the default from skipping to sitting',
    },
    {
      why:       'Vulnerability is not a soft skill — it is the mechanism by which emotional intelligence becomes relational intelligence.',
      dimension: 'water',
      impact:    'Deepens trust in key relationships. Interrupts emotional isolation. Builds the connection infrastructure that sustains everything else.',
      timeframe: '1–2 meaningful exchanges per week for 30 days',
    },
  ],
  earth: [
    {
      why:       'Routines reduce the activation energy required to start. Held consistently, a morning practice establishes the neurological pathway that consistency is possible for you.',
      dimension: 'earth',
      impact:    'Creates a grounding anchor for the day. Reduces scattered starts that consume energy before the important work begins.',
      timeframe: '21 days to form; 60 days for identity shift',
    },
    {
      why:       'Completing something physical creates a tangible signal to the nervous system that you are a person who finishes things. This is the experiential counterpart to belief.',
      dimension: 'earth',
      impact:    'Builds the identity of completion. Creates reference experiences that override abstract self-doubt.',
      timeframe: 'One project completed; self-perception shift is immediate',
    },
    {
      why:       'The body is the earth dimension made physical. Regular embodied engagement develops the grounding intelligence all other dimensions depend on.',
      dimension: 'earth',
      impact:    'Reduces mental abstraction. Improves sleep, regulation, and presence. Creates consistent energy across the day.',
      timeframe: '2–3 weeks of daily practice to feel the difference',
    },
  ],
}

// ─── Score history ────────────────────────────────────────────────────────────

export function loadScoreHistory(): ScoreSnapshot[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('ae_score_history')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveScoreSnapshot(data: ResultPayload): void {
  if (typeof window === 'undefined') return
  try {
    const existing = loadScoreHistory()
    const snapshot: ScoreSnapshot = {
      date:           data.generatedAt,
      dimensions:     { ...data.scoring.dimensions },
      coherenceScore: data.scoring.coherenceScore,
      overallScore:   data.scoring.overallScore,
      archetypeName:  data.archetypeBlend.primary.archetype.name,
    }
    if (existing.some(s => s.date === snapshot.date)) return
    localStorage.setItem(
      'ae_score_history',
      JSON.stringify([...existing, snapshot].slice(-10))
    )
  } catch { /* storage unavailable — degrade silently */ }
}
