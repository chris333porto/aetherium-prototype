/**
 * AETHERIUM CORE CANON v1.0
 * THE NINE PRINCIPLES OF COMMUNITY
 *
 * Status: LOCKED
 * Source: AETHERIUM - Core Canon - v1 - Nine Principles for Community.docx
 *
 * Community is not built once.
 * It is continuously created through behavior.
 */

export type CommunityPrincipleId =
  | 'trust'
  | 'respect'
  | 'belonging'
  | 'autonomy'
  | 'communion'
  | 'stewardship'
  | 'diversity'
  | 'dynamism'
  | 'growth'

export type CommunityLayer = 'foundations' | 'integration' | 'vitality'

export interface CommunityPrinciple {
  id:                   CommunityPrincipleId
  layer:                CommunityLayer
  name:                 string
  essence:              string
  coreQuestion:         string
  expression:           string[]
  distortionMissing:    string[]
  distortionOverused?:  string[]
  growthPath:           string
}

export const NINE_PRINCIPLES: CommunityPrinciple[] = [
  // ── FOUNDATIONS ─────────────────────────────────────────────────────────
  {
    id: 'trust',
    layer: 'foundations',
    name: 'Trust',
    essence: 'Reliability, honesty, psychological safety.',
    coreQuestion: 'Can I relax here and rely on others?',
    expression: ['Truthfulness', 'Keeping commitments', 'Emotional safety', 'Consistency', 'Integrity'],
    distortionMissing: ['Suspicion', 'Guardedness', 'Gossip', 'Politics', 'Anxiety'],
    growthPath: 'Move from caution → toward earned confidence.',
  },
  {
    id: 'respect',
    layer: 'foundations',
    name: 'Respect',
    essence: 'Dignity, boundaries, mutual regard.',
    coreQuestion: 'Am I treated as a human being of value here?',
    expression: ['Listening', 'Consideration', 'Boundaries honored', 'Fairness', 'Courtesy'],
    distortionMissing: ['Disrespect', 'Dominance', 'Dismissal', 'Contempt', 'Dehumanization'],
    growthPath: 'Move from egoic reaction → toward dignified relating.',
  },
  {
    id: 'belonging',
    layer: 'foundations',
    name: 'Belonging',
    essence: 'Inclusion, welcome, felt membership.',
    coreQuestion: 'Do I feel that I matter here?',
    expression: ['Warmth', 'Invitation', 'Recognition', 'Shared identity', 'Feeling seen'],
    distortionMissing: ['Alienation', 'Exclusion', 'Invisibility', 'Social anxiety', 'Withdrawal'],
    growthPath: 'Move from mere access → toward genuine inclusion.',
  },

  // ── INTEGRATION ────────────────────────────────────────────────────────
  {
    id: 'autonomy',
    layer: 'integration',
    name: 'Autonomy',
    essence: 'Agency, sovereignty, freedom of thought, authentic individuality.',
    coreQuestion: 'Can I be fully myself here?',
    expression: ['Voice', 'Choice', 'Creativity of perspective', 'Independent thought', 'Personal responsibility'],
    distortionMissing: ['Conformity', 'Suppression', 'Fear of speaking', 'Dependency', 'Groupthink'],
    distortionOverused: ['Self-centeredness', 'Fragmentation', 'Isolation'],
    growthPath: 'Move from rebellion or compliance → toward mature sovereignty.',
  },
  {
    id: 'communion',
    layer: 'integration',
    name: 'Communion',
    essence: 'Bonding, care, mutuality, shared humanity.',
    coreQuestion: 'Are we truly connected here?',
    expression: ['Friendship', 'Care', 'Shared rituals', 'Mutual support', 'Emotional warmth'],
    distortionMissing: ['Coldness', 'Transactional relating', 'Loneliness in groups'],
    distortionOverused: ['Enmeshment', 'Cliques', 'Emotional dependency'],
    growthPath: 'Move from social contact → toward living connection.',
  },
  {
    id: 'stewardship',
    layer: 'integration',
    name: 'Stewardship',
    essence: 'Acting for the sake of the whole.',
    coreQuestion: 'Do people take responsibility for what we are building together?',
    expression: ['Service', 'Ownership', 'Maintenance', 'Protecting culture', 'Caring for shared resources'],
    distortionMissing: ['Entitlement', 'Neglect', 'Free-riding', 'Decay'],
    distortionOverused: ['Control', 'Self-righteous sacrifice', 'Burnout'],
    growthPath: 'Move from consumption → toward contribution.',
  },

  // ── VITALITY ───────────────────────────────────────────────────────────
  {
    id: 'diversity',
    layer: 'vitality',
    name: 'Diversity',
    essence: 'Different gifts, backgrounds, perspectives, energies.',
    coreQuestion: 'Is there enough difference here to create richness?',
    expression: ['Varied people', 'Multiple intelligences', 'Broad perspective', 'Creative tension'],
    distortionMissing: ['Echo chambers', 'Blind spots', 'Sameness', 'Cultural stagnation'],
    growthPath: 'Move from sameness → toward richness.',
  },
  {
    id: 'dynamism',
    layer: 'vitality',
    name: 'Dynamism',
    essence: 'Energy, movement, responsiveness, renewal.',
    coreQuestion: 'Does this community feel alive?',
    expression: ['Momentum', 'Freshness', 'Adaptability', 'Excitement', 'Creative movement'],
    distortionMissing: ['Stagnation', 'Bureaucracy', 'Predictable deadness', 'Low morale'],
    distortionOverused: ['Chaos', 'Burnout', 'No stability'],
    growthPath: 'Move from inertia → toward living momentum.',
  },
  {
    id: 'growth',
    layer: 'vitality',
    name: 'Growth',
    essence: 'Members evolve through participation.',
    coreQuestion: 'Do people become more here?',
    expression: ['Learning', 'Maturity', 'Expanded capacity', 'Transformation', 'Challenge with support'],
    distortionMissing: ['Plateau', 'Repetition', 'Low aspiration', 'Comfort culture'],
    distortionOverused: ['Constant pressure', 'Never enough', 'Spiritualized striving'],
    growthPath: 'Move from static identity → toward unfolding potential.',
  },
]

// ── The Healthy Community Formula ────────────────────────────────────────────

export const COMMUNITY_FORMULA = {
  trust:       'allows people to soften',
  respect:     'allows people to stay',
  belonging:   'allows people to open',
  autonomy:    'allows people to breathe',
  communion:   'allows people to bond',
  stewardship: 'allows people to build',
  diversity:   'allows richness',
  dynamism:    'allows aliveness',
  growth:      'allows evolution',
} as const

// ── Common Community Patterns ────────────────────────────────────────────────

export const COMMUNITY_PATTERNS = [
  { pattern: 'High Trust + Low Diversity',       meaning: 'Warm but insular.' },
  { pattern: 'High Diversity + Low Belonging',   meaning: 'Mixed but disconnected.' },
  { pattern: 'High Communion + Low Autonomy',    meaning: 'Loving but suffocating.' },
  { pattern: 'High Autonomy + Low Communion',    meaning: 'Free but lonely.' },
  { pattern: 'High Dynamism + Low Stewardship',  meaning: 'Exciting but unstable.' },
  { pattern: 'High Growth + Low Respect',        meaning: 'Ambitious but harsh.' },
  { pattern: 'High Foundations + Low Vitality',   meaning: 'Safe but stale.' },
] as const

// ── Lookup ───────────────────────────────────────────────────────────────────

export function getCommunityPrinciple(id: CommunityPrincipleId): CommunityPrinciple {
  return NINE_PRINCIPLES.find(p => p.id === id)!
}

export function getPrinciplesByLayer(layer: CommunityLayer): CommunityPrinciple[] {
  return NINE_PRINCIPLES.filter(p => p.layer === layer)
}
