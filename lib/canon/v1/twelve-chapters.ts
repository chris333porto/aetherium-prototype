/**
 * AETHERIUM CORE CANON v1.0
 * THE TWELVE CHAPTERS OF THE HUMAN JOURNEY
 *
 * Status: LOCKED
 * Source: AETHERIUM - Core Canon - v1 - Twelve Chapters.docx
 *
 * Life Chapters are not rigid stages. They are recurring terrains
 * of human experience. A person may revisit many chapters multiple
 * times across life.
 */

export type ChapterId =
  | 'initiation'
  | 'expansion'
  | 'stability'
  | 'plateau'
  | 'transition'
  | 'disruption'
  | 'contraction'
  | 'reconstruction'
  | 'integration'
  | 'emergence'
  | 'overload'
  | 'renewal'

export interface LifeChapter {
  id:               ChapterId
  name:             string
  essence:          string
  typicalSigns:     string[]
  coreRisk:         string
  growthInvitation: string
  guidanceQuestion: string
}

export const TWELVE_CHAPTERS: LifeChapter[] = [
  {
    id: 'initiation',
    name: 'Initiation',
    essence: 'The beginning of a new path, identity, relationship, mission, season, or awakening.',
    typicalSigns: ['uncertainty', 'excitement', 'openness', 'insecurity', 'searching energy'],
    coreRisk: 'Waiting for certainty before beginning.',
    growthInvitation: 'Take first steps through courage and experimentation.',
    guidanceQuestion: 'What wants to begin through me?',
  },
  {
    id: 'expansion',
    name: 'Expansion',
    essence: 'Life force increasing. Momentum, growth, opportunity, visibility, capacity.',
    typicalSigns: ['many doors opening', 'progress increasing', 'optimism', 'growing responsibility'],
    coreRisk: 'Overextension, scattered growth, ego inflation.',
    growthInvitation: 'Choose what truly matters and focus energy there.',
    guidanceQuestion: 'What deserves amplification?',
  },
  {
    id: 'stability',
    name: 'Stability',
    essence: 'Maintaining healthy systems, rhythms, responsibilities, and consistency.',
    typicalSigns: ['predictable routines', 'competence', 'steady performance', 'dependable structures'],
    coreRisk: 'Comfort becoming stagnation.',
    growthInvitation: 'Refine, deepen, optimize.',
    guidanceQuestion: 'What can be improved quietly and steadily?',
  },
  {
    id: 'plateau',
    name: 'Plateau',
    essence: 'No visible progress despite effort. Flatness. Hidden incubation.',
    typicalSigns: ['boredom', 'frustration', 'slow movement', 'temptation to quit'],
    coreRisk: 'Mistaking invisibility for failure.',
    growthInvitation: 'Patience, recalibration, trust the unseen process.',
    guidanceQuestion: 'What is maturing beneath appearances?',
  },
  {
    id: 'transition',
    name: 'Transition',
    essence: 'Between chapters. Old identity fading, new one not yet solid.',
    typicalSigns: ['liminality', 'uncertainty', 'mixed grief + excitement', 'unstable self-image'],
    coreRisk: 'Forcing premature certainty.',
    growthInvitation: 'Navigate experimentally. Trust emergence.',
    guidanceQuestion: 'What no longer fits — and what is trying to form?',
  },
  {
    id: 'disruption',
    name: 'Disruption',
    essence: 'Shock to the system through loss, crisis, breakup, illness, collapse, upheaval.',
    typicalSigns: ['chaos', 'confusion', 'nervous system stress', 'survival mode'],
    coreRisk: 'Rigid resistance to reality.',
    growthInvitation: 'Adapt quickly. Simplify. Stabilize essentials.',
    guidanceQuestion: 'What is reality demanding now?',
  },
  {
    id: 'contraction',
    name: 'Contraction',
    essence: 'Energy withdrawing inward for grief, protection, healing, simplification, gestation.',
    typicalSigns: ['solitude', 'sadness', 'reduced ambition', 'introspection', 'low outward energy'],
    coreRisk: 'Believing this season is permanent.',
    growthInvitation: 'Honor inwardness while preserving vitality.',
    guidanceQuestion: 'What needs tenderness and time?',
  },
  {
    id: 'reconstruction',
    name: 'Reconstruction',
    essence: 'Rebuilding life after collapse, loss, error, addiction, burnout, or disruption.',
    typicalSigns: ['fragile discipline', 'small wins', 'humility', 'practical rebuilding'],
    coreRisk: 'Trying to rebuild too fast.',
    growthInvitation: 'Structure before scale.',
    guidanceQuestion: 'What foundation must be rebuilt first?',
  },
  {
    id: 'integration',
    name: 'Integration',
    essence: 'Assimilating lessons, reconciling contradictions, creating inner coherence.',
    typicalSigns: ['reflection', 'journaling', 'insight', 'healing narratives', 'clearer self-understanding'],
    coreRisk: 'Endless processing without embodiment.',
    growthInvitation: 'Translate wisdom into living practice.',
    guidanceQuestion: 'What truth must now be lived?',
  },
  {
    id: 'emergence',
    name: 'Emergence',
    essence: 'A new identity, talent, mission, relationship mode, or life pattern coming online.',
    typicalSigns: ['freshness', 'momentum', 'subtle confidence', 'new desires', 'new standards'],
    coreRisk: 'Protecting the old self.',
    growthInvitation: 'Embody the new pattern consistently.',
    guidanceQuestion: 'Who am I becoming now?',
  },
  {
    id: 'overload',
    name: 'Overload',
    essence: 'Too many inputs, demands, obligations, stimuli, commitments.',
    typicalSigns: ['stress', 'fragmented attention', 'irritability', 'exhaustion', 'inability to prioritize'],
    coreRisk: 'Burnout and unconscious living.',
    growthInvitation: 'Subtract aggressively. Return to essentials.',
    guidanceQuestion: 'What can be released immediately?',
  },
  {
    id: 'renewal',
    name: 'Renewal',
    essence: 'Recovery, restoration, vitality returning after depletion or difficulty.',
    typicalSigns: ['better sleep', 'energy returning', 'hope rising', 'appetite for life'],
    coreRisk: 'Staying passive too long.',
    growthInvitation: 'Re-enter life gradually but deliberately.',
    guidanceQuestion: 'What deserves fresh energy now?',
  },
]

// ── Lookup ───────────────────────────────────────────────────────────────────

export function getChapter(id: ChapterId): LifeChapter {
  return TWELVE_CHAPTERS.find(c => c.id === id)!
}
