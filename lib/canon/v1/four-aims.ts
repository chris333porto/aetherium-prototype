/**
 * AETHERIUM CORE CANON v1.0
 * THE FOUR AIMS OF PERSONAL CALLING
 *
 * Status: LOCKED
 * Source: AETHERIUM - Core Canon - v1 - Four Aims of Personal Calling.docx
 *
 * Calling is not found once.
 * Calling is clarified repeatedly through life.
 * It evolves with chapter, consciousness, responsibility, and courage.
 */

import type { ChapterId } from './twelve-chapters'

export type CallingAimId = 'connection' | 'contribution' | 'creativity' | 'capability'

export interface CallingAim {
  id:                    CallingAimId
  name:                 string
  essence:              string
  coreQuestion:         string
  expression:           string[]
  distortionNeglected:  string[]
  distortionOverused:   string[]
  growthPath:           string
}

export const FOUR_AIMS: CallingAim[] = [
  {
    id: 'connection',
    name: 'Connection',
    essence: 'Relationship, resonance, love, belonging, human aliveness.',
    coreQuestion: 'What feels alive and real to me now?',
    expression: ['Deep relationships', 'Friendship', 'Intimacy', 'Community', 'Presence with others', 'Emotional honesty', 'Shared experience'],
    distortionNeglected: ['Isolation', 'Numbness', 'Loneliness', 'Transactional living', 'Success without warmth'],
    distortionOverused: ['People-pleasing', 'Dependency', 'Fear of solitude', 'Losing self in others'],
    growthPath: 'Move from needing approval → toward genuine resonance.',
  },
  {
    id: 'contribution',
    name: 'Contribution',
    essence: 'Service, usefulness, generosity, impact beyond self.',
    coreQuestion: 'What can I give that truly matters?',
    expression: ['Helping others', 'Solving real problems', 'Building value', 'Teaching', 'Protecting', 'Serving a cause', 'Leaving things better than found'],
    distortionNeglected: ['Self-absorption', 'Meaninglessness', 'Cynicism', 'Wasted gifts'],
    distortionOverused: ['Martyrdom', 'Burnout', 'Saving others while neglecting self'],
    growthPath: 'Move from proving worth → toward sincere service.',
  },
  {
    id: 'creativity',
    name: 'Creativity',
    essence: 'Expression, originality, imagination, bringing forth what does not yet exist.',
    coreQuestion: 'What wants to come through me?',
    expression: ['Art', 'Writing', 'Design', 'Entrepreneurship', 'Innovation', 'Beauty', 'New systems and ideas'],
    distortionNeglected: ['Stagnation', 'Deadness', 'Suppressed energy', 'Conforming to lifeless paths'],
    distortionOverused: ['Chaos', 'Endless ideas without embodiment', 'Escapism through fantasy'],
    growthPath: 'Move from self-expression alone → toward meaningful creation.',
  },
  {
    id: 'capability',
    name: 'Capability',
    essence: 'Mastery, competence, strength, discipline, earned confidence.',
    coreQuestion: 'What am I capable of becoming?',
    expression: ['Skill-building', 'Leadership', 'Craftsmanship', 'Discipline', 'Courage', 'Reliability', 'Excellence'],
    distortionNeglected: ['Underdevelopment', 'Helplessness', 'Low confidence', 'Dependency on others'],
    distortionOverused: ['Achievement addiction', 'Identity tied to performance', 'Cold ambition', 'Never enough'],
    growthPath: 'Move from proving superiority → toward embodied excellence.',
  },
]

// ── The Balanced Calling ─────────────────────────────────────────────────────

export const CALLING_ROLES = {
  connection:   'gives warmth',
  contribution: 'gives meaning',
  creativity:   'gives vitality',
  capability:   'gives power',
} as const

// ── Common Calling Patterns ──────────────────────────────────────────────────

export const CALLING_PATTERNS = [
  { pattern: 'High Capability + Low Connection',                    meaning: 'Successful but lonely.' },
  { pattern: 'High Creativity + Low Capability',                    meaning: 'Inspired but inconsistent.' },
  { pattern: 'High Contribution + Low Self-Care',                   meaning: 'Helpful but depleted.' },
  { pattern: 'High Connection + Low Direction',                     meaning: 'Loved but drifting.' },
  { pattern: 'High Creativity + High Contribution',                 meaning: 'Gifted channel for real impact.' },
  { pattern: 'High Capability + High Contribution + Low Joy',       meaning: 'Respected but joyless.' },
] as const

// ── Chapter × Calling emphasis ───────────────────────────────────────────────

export const CHAPTER_CALLING_EMPHASIS: Partial<Record<ChapterId, CallingAimId[]>> = {
  initiation:    ['creativity', 'capability'],
  expansion:     ['capability', 'contribution'],
  stability:     ['connection', 'contribution'],
  transition:    ['creativity', 'connection'],
  contraction:   ['connection', 'contribution'],
  renewal:       ['creativity', 'connection'],
  emergence:     ['capability', 'creativity'],
}

// ── Reflection Prompts ───────────────────────────────────────────────────────

export const CALLING_REFLECTIONS = [
  'Which aim is strongest in me right now?',
  'Which aim have I neglected?',
  'Where am I succeeding in ways that are not truly mine?',
  'What would a more balanced calling look like this chapter?',
  'What wants expression now?',
  'How can I serve without abandoning myself?',
] as const

// ── Lookup ───────────────────────────────────────────────────────────────────

export function getCallingAim(id: CallingAimId): CallingAim {
  return FOUR_AIMS.find(a => a.id === id)!
}
