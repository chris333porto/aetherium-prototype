export type Dimension = 'aether' | 'fire' | 'air' | 'water' | 'earth'

// ─── Category types per dimension ─────────────────────────────────────────────
// Each dimension has three sub-facets measured by ~3 questions each.
// Categories are informational — not used for scoring, useful for AI prompts
// and derivation panels.

export type AetherCategory  = 'purpose'    | 'alignment'  | 'meaning'
export type FireCategory    = 'initiative' | 'commitment' | 'drive'
export type AirCategory     = 'clarity'    | 'analysis'   | 'communication'
export type WaterCategory   = 'awareness'  | 'connection' | 'regulation'
export type EarthCategory   = 'execution'  | 'consistency'| 'grounding'

export type QuestionCategory =
  | AetherCategory
  | FireCategory
  | AirCategory
  | WaterCategory
  | EarthCategory

// ─── Question ─────────────────────────────────────────────────────────────────

export interface Question {
  id:            string
  dimension:     Dimension
  category:      QuestionCategory
  text:          string
  reverseScored: boolean
  /** Relative weight for this question inside its dimension (default: 1). */
  weight?:       number
}

export interface NarrativeField {
  id:          string
  label:       string
  placeholder: string
}

// ─── Question bank (50 questions, 10 per dimension) ───────────────────────────

export const QUESTIONS: Question[] = [

  // ── AETHER: Intention / Purpose / Alignment ──────────────────────────────
  // purpose (3): what the person is here to do and what they truly want
  { id: 'ae01', dimension: 'aether', category: 'purpose',   reverseScored: false, text: 'I have a clear sense of what I am here to do.' },
  { id: 'ae05', dimension: 'aether', category: 'purpose',   reverseScored: false, text: 'I know what I truly want, beyond what others expect of me.' },
  { id: 'ae09', dimension: 'aether', category: 'purpose',   reverseScored: false, text: 'I have a sense of purpose that guides my decisions.' },
  // alignment (4): living in accordance with values and principles
  { id: 'ae02', dimension: 'aether', category: 'alignment', reverseScored: false, text: 'My daily actions feel aligned with my deeper values.' },
  { id: 'ae06', dimension: 'aether', category: 'alignment', reverseScored: true,  text: 'I feel scattered between competing priorities and values.' },
  { id: 'ae07', dimension: 'aether', category: 'alignment', reverseScored: false, text: 'I am living in accordance with my own principles.' },
  { id: 'ae10', dimension: 'aether', category: 'alignment', reverseScored: false, text: 'I feel at peace with the direction my life is taking.' },
  // meaning (3): connection to something larger; questioning whether it matters
  { id: 'ae03', dimension: 'aether', category: 'meaning',   reverseScored: true,  text: 'I often feel that my life lacks direction or meaning.' },
  { id: 'ae04', dimension: 'aether', category: 'meaning',   reverseScored: false, text: 'I feel connected to something larger than myself.' },
  { id: 'ae08', dimension: 'aether', category: 'meaning',   reverseScored: true,  text: 'I frequently question whether what I am doing matters.' },

  // ── FIRE: Volition / Action / Drive ──────────────────────────────────────
  // initiative (3): starting, deciding, leading rather than waiting
  { id: 'fi01', dimension: 'fire', category: 'initiative',  reverseScored: false, text: 'I take decisive action even when conditions are uncertain.' },
  { id: 'fi03', dimension: 'fire', category: 'initiative',  reverseScored: true,  text: 'I often procrastinate or avoid starting important tasks.' },
  { id: 'fi06', dimension: 'fire', category: 'initiative',  reverseScored: false, text: 'I initiate things rather than waiting for others to lead.' },
  // commitment (4): sustaining effort; following through under pressure
  { id: 'fi02', dimension: 'fire', category: 'commitment',  reverseScored: false, text: 'I follow through on my commitments consistently.' },
  { id: 'fi05', dimension: 'fire', category: 'commitment',  reverseScored: true,  text: 'I struggle to maintain momentum on long-term projects.' },
  { id: 'fi08', dimension: 'fire', category: 'commitment',  reverseScored: true,  text: 'I give up too easily when faced with obstacles.' },
  { id: 'fi10', dimension: 'fire', category: 'commitment',  reverseScored: false, text: 'I complete what I start with discipline and focus.' },
  // drive (3): inner motivation, energy, ownership of outcomes
  { id: 'fi04', dimension: 'fire', category: 'drive',       reverseScored: false, text: 'I feel energized and motivated to pursue my goals.' },
  { id: 'fi07', dimension: 'fire', category: 'drive',       reverseScored: false, text: 'I feel driven by an inner force to create and achieve.' },
  { id: 'fi09', dimension: 'fire', category: 'drive',       reverseScored: false, text: 'I take full responsibility for the outcomes in my life.' },

  // ── AIR: Cognition / Thinking / Clarity ──────────────────────────────────
  // clarity (4): clear thinking under pressure; decisive, uncluttered
  { id: 'ai02', dimension: 'air', category: 'clarity',      reverseScored: false, text: 'I think clearly under pressure.' },
  { id: 'ai03', dimension: 'air', category: 'clarity',      reverseScored: true,  text: 'I tend to overthink and struggle to reach clear decisions.' },
  { id: 'ai05', dimension: 'air', category: 'clarity',      reverseScored: true,  text: 'My mind often feels cluttered or overwhelmed with thoughts.' },
  { id: 'ai07', dimension: 'air', category: 'clarity',      reverseScored: false, text: 'I trust my intellectual judgment and insights.' },
  { id: 'ai08', dimension: 'air', category: 'clarity',      reverseScored: true,  text: 'I get confused or paralyzed when situations are ambiguous.' },
  // analysis (3): pattern recognition; depth; multi-perspective thinking
  { id: 'ai01', dimension: 'air', category: 'analysis',     reverseScored: false, text: 'I can see multiple perspectives before forming an opinion.' },
  { id: 'ai06', dimension: 'air', category: 'analysis',     reverseScored: false, text: 'I learn and adapt quickly in new situations.' },
  { id: 'ai09', dimension: 'air', category: 'analysis',     reverseScored: false, text: 'I seek to understand things deeply rather than superficially.' },
  { id: 'ai10', dimension: 'air', category: 'analysis',     reverseScored: false, text: 'I can separate my feelings from my analysis when needed.' },
  // communication (1): translating insight into clear expression
  { id: 'ai04', dimension: 'air', category: 'communication',reverseScored: false, text: 'I can communicate complex ideas in simple, clear ways.' },

  // ── WATER: Emotion / Connection / Feeling ────────────────────────────────
  // awareness (3): in touch with one's own emotional states and signals
  { id: 'wa01', dimension: 'water', category: 'awareness',  reverseScored: false, text: 'I am in touch with my emotional states and what drives them.' },
  { id: 'wa03', dimension: 'water', category: 'awareness',  reverseScored: true,  text: 'I suppress or avoid difficult emotions rather than feeling them.' },
  { id: 'wa06', dimension: 'water', category: 'awareness',  reverseScored: false, text: 'I trust my emotional intuition and use it as guidance.' },
  { id: 'wa10', dimension: 'water', category: 'awareness',  reverseScored: false, text: 'My emotional life feels rich, nuanced, and integrated.' },
  // connection (3): relational depth; empathy; feeling understood
  { id: 'wa02', dimension: 'water', category: 'connection', reverseScored: false, text: 'I can empathize deeply with the experiences of others.' },
  { id: 'wa04', dimension: 'water', category: 'connection', reverseScored: false, text: 'I feel genuinely connected to the people in my life.' },
  { id: 'wa05', dimension: 'water', category: 'connection', reverseScored: true,  text: 'I struggle to express what I feel to others.' },
  { id: 'wa08', dimension: 'water', category: 'connection', reverseScored: true,  text: 'I feel emotionally isolated or misunderstood by others.' },
  // regulation (2): resilience; capacity for joy; staying present through change
  { id: 'wa07', dimension: 'water', category: 'regulation', reverseScored: false, text: 'I feel emotionally resilient when faced with loss or change.' },
  { id: 'wa09', dimension: 'water', category: 'regulation', reverseScored: false, text: 'I allow myself to feel joy, beauty, and wonder regularly.' },

  // ── EARTH: Physicality / Execution / Grounding ───────────────────────────
  // execution (3): delivering real results; building things that last
  { id: 'ea01', dimension: 'earth', category: 'execution',  reverseScored: false, text: 'I follow through with concrete actions on my plans.' },
  { id: 'ea04', dimension: 'earth', category: 'execution',  reverseScored: false, text: 'I can execute and deliver real results in the world.' },
  { id: 'ea07', dimension: 'earth', category: 'execution',  reverseScored: false, text: 'I build things that last and endure over time.' },
  // consistency (3): habits, routines, time and resource management
  { id: 'ea02', dimension: 'earth', category: 'consistency',reverseScored: false, text: 'I take care of my body with consistent habits.' },
  { id: 'ea05', dimension: 'earth', category: 'consistency',reverseScored: true,  text: 'I struggle to maintain routines or physical discipline.' },
  { id: 'ea09', dimension: 'earth', category: 'consistency',reverseScored: false, text: 'I manage my time and resources with practical wisdom.' },
  // grounding (4): physical presence; body connection; settled in environment
  { id: 'ea03', dimension: 'earth', category: 'grounding',  reverseScored: true,  text: 'I feel ungrounded or disconnected from the physical world.' },
  { id: 'ea06', dimension: 'earth', category: 'grounding',  reverseScored: false, text: 'I feel at home and settled in my physical environment.' },
  { id: 'ea08', dimension: 'earth', category: 'grounding',  reverseScored: true,  text: 'I tend to stay in my head rather than taking grounded action.' },
  { id: 'ea10', dimension: 'earth', category: 'grounding',  reverseScored: false, text: 'I feel physically vital and fully present in my body.' },
]

// ─── Narrative fields ─────────────────────────────────────────────────────────

export const NARRATIVE_FIELDS: NarrativeField[] = [
  {
    id:          'life_phase',
    label:       'Current Life Phase',
    placeholder: 'Describe where you are in life right now — a transition, a plateau, a peak, a question...',
  },
  {
    id:          'recent_challenges',
    label:       'Recent Challenges',
    placeholder: 'What has been most difficult or unresolved for you lately?',
  },
  {
    id:          'desired_direction',
    label:       'Desired Direction',
    placeholder: 'If you could move toward anything — what would it be?',
  },
]

// ─── Dimension metadata ───────────────────────────────────────────────────────

export const DIMENSION_META: Record<Dimension, {
  label:       string
  subtitle:    string
  color:       string
  description: string
}> = {
  aether: {
    label:       'AETHER',
    subtitle:    'Intention · Purpose · Alignment',
    color:       '#9590ec',
    description: 'The quality of your relationship with meaning, direction, and inner alignment.',
  },
  fire: {
    label:       'FIRE',
    subtitle:    'Volition · Action · Drive',
    color:       '#e05a3a',
    description: 'Your capacity to initiate, sustain, and follow through with force of will.',
  },
  air: {
    label:       'AIR',
    subtitle:    'Cognition · Thinking · Clarity',
    color:       '#d4853a',
    description: 'The sharpness and flexibility of your mind — how you process, discern, and communicate.',
  },
  water: {
    label:       'WATER',
    subtitle:    'Emotion · Connection · Feeling',
    color:       '#4a9fd4',
    description: 'Your emotional intelligence, relational depth, and capacity to feel fully.',
  },
  earth: {
    label:       'EARTH',
    subtitle:    'Physicality · Execution · Grounding',
    color:       '#2db885',
    description: 'Your ability to ground vision in reality — through your body, habits, and results.',
  },
}

// Earth → Water → Air → Fire → Aether
// Rationale: begin with observable reality, move through emotion and cognition,
// end with purpose when the user is most open and self-aware.
export const DIMENSIONS_ORDER: Dimension[] = ['earth', 'water', 'air', 'fire', 'aether']

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getQuestionsForDimension(dimension: Dimension): Question[] {
  return QUESTIONS.filter(q => q.dimension === dimension)
}

export function getQuestionsForCategory(
  dimension: Dimension,
  category: QuestionCategory
): Question[] {
  return QUESTIONS.filter(q => q.dimension === dimension && q.category === category)
}
