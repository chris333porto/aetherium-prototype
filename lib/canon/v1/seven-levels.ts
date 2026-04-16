/**
 * AETHERIUM CORE CANON v1.0
 * THE SEVEN LEVELS OF MEANING
 *
 * Status: LOCKED
 * Source: AETHERIUM - Core Canon - v1 - Seven Levels of Meaning.docx
 *
 * The Seven Levels describe the dominant framework through which a person
 * interprets life, organizes priorities, and determines what matters.
 * These are not fixed identities. They are living centers of gravity.
 */

export type MeaningLevelId =
  | 'survival'
  | 'desire'
  | 'belonging'
  | 'achievement'
  | 'awakening'
  | 'integration'
  | 'transcendence'

export interface MeaningLevel {
  id:               MeaningLevelId
  level:            number         // 1–7
  name:             string
  coreOrientation:  string
  primaryValues:    string[]
  coreFear:         string
  growthEdge:       string
  essence:          string
  identityLogic:    string         // "I am what I..."
  successMeans:     string
  shadowExpression: string
  guidanceQuestion: string
}

export const SEVEN_LEVELS: MeaningLevel[] = [
  {
    id: 'survival',
    level: 1,
    name: 'Survival',
    coreOrientation: 'Safety',
    primaryValues: ['safety', 'shelter', 'health', 'predictability', 'financial stability'],
    coreFear: 'danger',
    growthEdge: 'Build stability, then reclaim agency.',
    essence: 'Life is interpreted primarily through security and protection.',
    identityLogic: 'I need to stay safe.',
    successMeans: 'I made it through.',
    shadowExpression: 'Scarcity mindset, chronic anxiety, shutdown.',
    guidanceQuestion: 'What would help me feel safe enough to move?',
  },
  {
    id: 'desire',
    level: 2,
    name: 'Desire',
    coreOrientation: 'Pleasure / Identity',
    primaryValues: ['excitement', 'stimulation', 'beauty', 'status', 'freedom', 'sensuality'],
    coreFear: 'deprivation',
    growthEdge: 'Discipline desire into devotion.',
    essence: 'Life is interpreted through wanting, identity formation, pleasure, passion, and appetite.',
    identityLogic: 'I am what I pursue.',
    successMeans: 'I got what I wanted.',
    shadowExpression: 'Addiction, vanity, impulsivity, endless craving.',
    guidanceQuestion: 'What do I truly want beneath impulse?',
  },
  {
    id: 'belonging',
    level: 3,
    name: 'Belonging',
    coreOrientation: 'Relationship',
    primaryValues: ['love', 'loyalty', 'inclusion', 'family', 'harmony', 'community'],
    coreFear: 'rejection',
    growthEdge: 'Tell the truth without losing the heart.',
    essence: 'Life is interpreted through relationship, tribe, family, and acceptance.',
    identityLogic: 'I am loved, therefore I am.',
    successMeans: 'I am connected.',
    shadowExpression: 'People-pleasing, conformity, dependency.',
    guidanceQuestion: 'Where am I betraying myself to belong?',
  },
  {
    id: 'achievement',
    level: 4,
    name: 'Achievement',
    coreOrientation: 'Mastery / Results',
    primaryValues: ['mastery', 'excellence', 'growth', 'recognition', 'productivity', 'capability'],
    coreFear: 'failure',
    growthEdge: 'Discover worth beyond performance.',
    essence: 'Life is interpreted through competence, accomplishment, and measurable progress.',
    identityLogic: 'I am what I accomplish.',
    successMeans: 'I produced meaningful results.',
    shadowExpression: 'Burnout, comparison, ego attachment, emptiness.',
    guidanceQuestion: 'Who am I when I am not producing?',
  },
  {
    id: 'awakening',
    level: 5,
    name: 'Awakening',
    coreOrientation: 'Truth / Awareness',
    primaryValues: ['awareness', 'honesty', 'authenticity', 'freedom', 'insight', 'awakening'],
    coreFear: 'illusion',
    growthEdge: 'Embody insight in ordinary reality.',
    essence: 'Life is interpreted through truth, consciousness, authenticity, and inner liberation.',
    identityLogic: 'I seek what is true.',
    successMeans: 'I am living in truth.',
    shadowExpression: 'Spiritual bypassing, superiority, detachment from practical life.',
    guidanceQuestion: 'What truth must now be lived?',
  },
  {
    id: 'integration',
    level: 6,
    name: 'Integration',
    coreOrientation: 'Wholeness / Systems',
    primaryValues: ['harmony', 'coherence', 'complexity', 'interdependence', 'design', 'maturity'],
    coreFear: 'fragmentation',
    growthEdge: 'Return complexity into elegant action.',
    essence: 'Life is interpreted through systems, synthesis, and wholeness.',
    identityLogic: 'I seek to make the whole work.',
    successMeans: 'The system is healthier and more whole.',
    shadowExpression: 'Over-analysis, paralysis, abstraction, over-complexity.',
    guidanceQuestion: 'What is the simplest move that honors the whole?',
  },
  {
    id: 'transcendence',
    level: 7,
    name: 'Transcendence',
    coreOrientation: 'Service / Devotion',
    primaryValues: ['compassion', 'stewardship', 'sacrifice', 'devotion', 'contribution', 'sacred responsibility'],
    coreFear: 'meaninglessness',
    growthEdge: 'Serve the whole without abandoning the self.',
    essence: 'Life is interpreted through service, devotion, and contribution beyond self-interest.',
    identityLogic: 'I am here to serve something larger.',
    successMeans: 'Life benefited through my presence.',
    shadowExpression: 'Martyrdom, self-erasure, neglect of personal needs.',
    guidanceQuestion: 'What is life asking of me now?',
  },
]

// ── Canon rules codified ─────────────────────────────────────────────────────

export const MEANING_RULES = {
  nonLinear: 'Different domains may operate from different levels simultaneously.',
  stressRegression: 'Under threat, humans often temporarily contract downward.',
  inclusion: 'Higher development includes and honors earlier needs.',
  noMoralSuperiority: 'No level makes someone better. The question is fitness for present reality.',
} as const

// ── Lookup ───────────────────────────────────────────────────────────────────

export function getMeaningLevel(id: MeaningLevelId): MeaningLevel {
  return SEVEN_LEVELS.find(l => l.id === id)!
}
