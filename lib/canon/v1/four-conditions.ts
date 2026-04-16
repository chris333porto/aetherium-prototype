/**
 * AETHERIUM CORE CANON v1.0
 * THE FOUR CONDITIONS FOR FLOW — The Flow Compass
 *
 * Status: LOCKED
 * Source: AETHERIUM - Core Canon - v1 - Four Conditions for Flow.docx
 *
 * Flow is not something permanently achieved.
 * Flow is continuously navigated.
 */

import type { ElementId } from './five-elements'

export type FlowConditionId = 'activation' | 'alignment' | 'attunement' | 'attentiveness'

export interface FlowCondition {
  id:                  FlowConditionId
  name:                string
  symbol:              string
  vector:              string
  definition:          string
  whenPresent:         string[]
  whenDeficient:       string[]
  diagnosticQuestion:  string
  restorationPractices: string[]
  relatedElements:     ElementId[]
}

export const FOUR_CONDITIONS: FlowCondition[] = [
  {
    id: 'activation',
    name: 'Activation',
    symbol: '🔥',
    vector: 'Forward propulsion',
    definition: 'The ignition of life-force into motion. The willingness to begin now. Energy converted into action.',
    whenPresent: ['Momentum begins easily', 'Resistance lowers', 'Courage rises', 'Motivation follows movement', 'Progress compounds'],
    whenDeficient: ['Stagnation', 'Delay', 'Avoidance', 'Heavy inertia', 'Endless preparation'],
    diagnosticQuestion: 'What wants to begin now?',
    restorationPractices: ['Move body immediately', 'Shrink first step', 'Count down and launch', 'Start before ready', 'Change environment'],
    relatedElements: ['fire', 'earth'],
  },
  {
    id: 'alignment',
    name: 'Alignment',
    symbol: '➡️',
    vector: 'Forward orientation',
    definition: 'Congruence between values, priorities, choices, and direction. When what you do matches what matters.',
    whenPresent: ['Simplicity', 'Integrity', 'Peace', 'Consistent progress', 'Meaningful effort'],
    whenDeficient: ['Inner conflict', 'Self-betrayal', 'Success without fulfillment', 'Chronic distraction', 'Split loyalties'],
    diagnosticQuestion: 'Is my life pointed where I truly mean to go?',
    restorationPractices: ['Clarify values', 'Remove false obligations', 'Choose one real priority', 'Tell the truth internally', 'Simplify commitments'],
    relatedElements: ['aether', 'fire', 'earth'],
  },
  {
    id: 'attunement',
    name: 'Attunement',
    symbol: '↔️',
    vector: 'Side-to-side awareness',
    definition: 'Sensitive connection to reality, timing, self, others, and environment. The ability to feel what is true now.',
    whenPresent: ['Good timing', 'Emotional intelligence', 'Relational ease', 'Wise adaptation', 'Strong intuition'],
    whenDeficient: ['Forcing outcomes', 'Social friction', 'Poor timing', 'Misreading signals', 'Emotional blindness'],
    diagnosticQuestion: 'What is reality asking of me right now?',
    restorationPractices: ['Slow down', 'Listen deeply', 'Feel body signals', 'Observe patterns', 'Respect timing'],
    relatedElements: ['water', 'air', 'earth'],
  },
  {
    id: 'attentiveness',
    name: 'Attentiveness',
    symbol: '⬤',
    vector: 'Present-moment grounded awareness',
    definition: 'Stable conscious presence directed toward what matters. The ability to place and sustain awareness intentionally.',
    whenPresent: ['Focus', 'Calm clarity', 'Better decisions', 'Less reactivity', 'Strong presence'],
    whenDeficient: ['Scattered attention', 'Compulsion', 'Reactivity', 'Chronic noise', 'Forgotten priorities'],
    diagnosticQuestion: 'Where is my attention leaking?',
    restorationPractices: ['Remove distractions', 'Single-task', 'Breathe consciously', 'Pause before reacting', 'Protect attention like currency'],
    relatedElements: ['air', 'aether'],
  },
]

// ── Common Flow Failure Patterns ─────────────────────────────────────────────

export const FLOW_PATTERNS = [
  { pattern: 'Low Activation + High Alignment',                  meaning: 'You know what matters but do not move.' },
  { pattern: 'High Activation + Low Alignment',                  meaning: 'Busy, productive, misdirected.' },
  { pattern: 'High Attunement + Low Activation',                 meaning: 'You sense deeply but hesitate.' },
  { pattern: 'High Attentiveness + Low Attunement',              meaning: 'Focused but disconnected.' },
  { pattern: 'High Activation + High Attentiveness + Low Alignment', meaning: 'Efficient burnout.' },
  { pattern: 'Balanced All Four',                                meaning: 'Sustainable flow.' },
] as const

// ── AI Guidance Templates ────────────────────────────────────────────────────

export const FLOW_GUIDANCE: Record<FlowConditionId, string> = {
  activation:    'You do not need more motivation. You need ignition.',
  alignment:     'Your fatigue may be coming from misdirection.',
  attunement:    'Slow down. Reality is speaking quietly.',
  attentiveness: 'Your life-force is leaking through attention fragmentation.',
}

// ── Summary aphorism ─────────────────────────────────────────────────────────

export const FLOW_APHORISM = [
  'Activation — Begin.',
  'Alignment — Aim true.',
  'Attunement — Sense reality.',
  'Attentiveness — Stay present.',
] as const

// ── Lookup ───────────────────────────────────────────────────────────────────

export function getFlowCondition(id: FlowConditionId): FlowCondition {
  return FOUR_CONDITIONS.find(c => c.id === id)!
}
