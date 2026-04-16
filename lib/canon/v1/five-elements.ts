/**
 * AETHERIUM CORE CANON v1.0
 * THE FIVE ELEMENTS — Foundational Ontology of the Five Dimensions of Self
 *
 * Status: LOCKED
 * Source: AETHERIUM - Core Canon - v1 - Five Elements.docx
 *
 * This is the core grammar of the Aetherium system.
 * All higher layers must remain consistent with this map.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type ElementId = 'aether' | 'fire' | 'air' | 'water' | 'earth'

export interface ElementDefinition {
  id:                ElementId
  ring:              number       // 1=innermost, 5=outermost
  element:           string       // Aether, Fire, Air, Water, Earth
  dimension:         string       // Spirit, Soul, Mind, Heart, Body
  coreFaculty:       string       // Orientation, Choice, Understanding, Feeling, Embodiment
  function:          string       // Intention, Volition, Cognition, Emotion, Execution
  discipline:        string       // Clarifying Intention, Making Decisions, etc.
  essentialQuestion: string       // What am I truly aiming at?, etc.
  color:             string

  // Detailed expressions
  essence:           string
  healthyExpression: string[]
  weakExpression:    string[]
  excessExpression:  string[]
  growthPrompt:      string
}

export interface DiagnosticPattern {
  pattern:  string
  meaning:  string
}

// ── The Canonical Five Rings Map ─────────────────────────────────────────────

export const FIVE_ELEMENTS: ElementDefinition[] = [
  {
    id: 'aether',
    ring: 1,
    element: 'Aether',
    dimension: 'Spirit',
    coreFaculty: 'Orientation',
    function: 'Intention',
    discipline: 'Clarifying Intention',
    essentialQuestion: 'What am I truly aiming at?',
    color: '#9590ec',
    essence: 'The faculty of orientation toward meaning, truth, purpose, direction, and higher order coherence.',
    healthyExpression: ['Purpose', 'Meaning', 'Vision', 'Integrity', 'Direction', 'Coherence'],
    weakExpression: ['Aimlessness', 'Drift', 'Meaninglessness', 'Confusion', 'Fragmented goals', 'Lack of direction'],
    excessExpression: ['Grandiosity', 'Fantasy identity', 'Spiritual bypassing', 'Abstract ideals without embodiment', 'Inflated mission language'],
    growthPrompt: 'What truly matters now?',
  },
  {
    id: 'fire',
    ring: 2,
    element: 'Fire',
    dimension: 'Soul',
    coreFaculty: 'Choice',
    function: 'Volition',
    discipline: 'Making Decisions',
    essentialQuestion: 'What will I choose and commit to?',
    color: '#e05a3a',
    essence: 'The faculty of choosing, willing, committing, initiating, and moving energy.',
    healthyExpression: ['Courage', 'Decisiveness', 'Commitment', 'Momentum', 'Agency', 'Resolve'],
    weakExpression: ['Hesitation', 'Avoidance', 'Passivity', 'Chronic indecision', 'Learned helplessness'],
    excessExpression: ['Control', 'Aggression', 'Impulsiveness', 'Domination', 'Forcing outcomes'],
    growthPrompt: 'What must be chosen now?',
  },
  {
    id: 'air',
    ring: 3,
    element: 'Air',
    dimension: 'Mind',
    coreFaculty: 'Understanding',
    function: 'Cognition',
    discipline: 'Taking Perspective',
    essentialQuestion: 'How do I see clearly?',
    color: '#d4853a',
    essence: 'The faculty of perception, interpretation, thinking, reasoning, pattern recognition, and perspective.',
    healthyExpression: ['Clarity', 'Discernment', 'Perspective', 'Wisdom', 'Strategic thought', 'Learning capacity'],
    weakExpression: ['Confusion', 'Tunnel vision', 'Poor judgment', 'Reactivity', 'Lack of reflection'],
    excessExpression: ['Overthinking', 'Analysis paralysis', 'Intellectual detachment', 'Endless theorizing', 'Cynicism'],
    growthPrompt: 'What is actually true here?',
  },
  {
    id: 'water',
    ring: 4,
    element: 'Water',
    dimension: 'Heart',
    coreFaculty: 'Feeling',
    function: 'Emotion',
    discipline: 'Feeling Sensations',
    essentialQuestion: 'What am I truly feeling?',
    color: '#4a9fd4',
    essence: 'The faculty of feeling, sensitivity, connection, empathy, intimacy, and relational intelligence.',
    healthyExpression: ['Emotional honesty', 'Compassion', 'Warmth', 'Attunement', 'Love', 'Connection'],
    weakExpression: ['Numbness', 'Repression', 'Isolation', 'Disconnection', 'Emotional shutdown'],
    excessExpression: ['Flooding', 'Reactivity', 'Enmeshment', 'Mood domination', 'Loss of boundaries'],
    growthPrompt: 'What am I truly feeling now?',
  },
  {
    id: 'earth',
    ring: 5,
    element: 'Earth',
    dimension: 'Body',
    coreFaculty: 'Embodiment',
    function: 'Execution',
    discipline: 'Taking Action',
    essentialQuestion: 'What am I actually doing?',
    color: '#2db885',
    essence: 'The faculty of embodiment, groundedness, consistency, discipline, labor, and manifested action.',
    healthyExpression: ['Follow-through', 'Reliability', 'Stability', 'Health', 'Discipline', 'Completion'],
    weakExpression: ['Procrastination', 'Chaos', 'Non-completion', 'Weak routines', 'Lack of discipline'],
    excessExpression: ['Overwork', 'Mechanical living', 'Productivity addiction', 'Rigidity', 'Joyless grind'],
    growthPrompt: 'What concrete action matters now?',
  },
]

// ── Sequential Logic of Human Action ─────────────────────────────────────────
// The healthy system tends to move in this order:

export const ACTION_SEQUENCE = [
  { element: 'Aether', action: 'Spirit intends' },
  { element: 'Fire',   action: 'Soul chooses' },
  { element: 'Air',    action: 'Mind understands' },
  { element: 'Water',  action: 'Heart feels' },
  { element: 'Earth',  action: 'Body acts' },
] as const

// ── Integrated System Logic ──────────────────────────────────────────────────

export const ALIGNMENT_ROLES = {
  aether: 'gives direction',
  fire:   'gives movement',
  air:    'gives clarity',
  water:  'gives humanity',
  earth:  'gives reality',
} as const

// ── Diagnostic Interpretation Patterns ───────────────────────────────────────

export const DIAGNOSTIC_PATTERNS: DiagnosticPattern[] = [
  { pattern: 'High Aether + Low Earth',  meaning: 'Vision without embodiment' },
  { pattern: 'High Fire + Low Water',    meaning: 'Drive without sensitivity' },
  { pattern: 'High Air + Low Fire',      meaning: 'Understanding without movement' },
  { pattern: 'High Water + Low Air',     meaning: 'Feeling without perspective' },
  { pattern: 'High Earth + Low Aether',  meaning: 'Action without meaning' },
  { pattern: 'High Fire + Low Earth',    meaning: 'Strong starts, weak completion' },
  { pattern: 'High Water + Low Fire',    meaning: 'Deep feeling, weak agency' },
  { pattern: 'Balanced Five',            meaning: 'Coherent integrated system' },
]

// ── Lookup helpers ───────────────────────────────────────────────────────────

export function getElement(id: ElementId): ElementDefinition {
  return FIVE_ELEMENTS.find(e => e.id === id)!
}

export function getElementByDimension(dimension: string): ElementDefinition | undefined {
  return FIVE_ELEMENTS.find(e => e.dimension.toLowerCase() === dimension.toLowerCase())
}
