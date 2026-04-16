/**
 * AETHERIUM MASTER INTELLIGENCE SYSTEM v1.0
 *
 * Six interlocking canonical frameworks that form the complete
 * Aetherium ontology for understanding human beings.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  LAYER              │  PURPOSE           │  QUESTION    │
 * ├─────────────────────┼────────────────────┼──────────────┤
 * │  Five Elements      │  Structure of self │  What am I?  │
 * │  Four Conditions    │  Operating state   │  How am I?   │
 * │  Twelve Chapters    │  Life context      │  Where am I? │
 * │  Seven Levels       │  Meaning lens      │  Why?        │
 * │  Four Aims          │  Energy direction  │  Toward what?│
 * │  Nine Principles    │  Collective health │  With whom?  │
 * └─────────────────────────────────────────────────────────┘
 *
 * These layers are independent but interconnected.
 * Each can be assessed, tracked, and developed.
 * Together they form a complete map of the human experience.
 *
 * Status: ALL LOCKED as v1.0
 */

// ── Re-export all canonical frameworks ───────────────────────────────────────

export {
  // Five Elements — Structure of Self
  FIVE_ELEMENTS,
  ACTION_SEQUENCE,
  ALIGNMENT_ROLES,
  DIAGNOSTIC_PATTERNS,
  getElement,
  getElementByDimension,
  type ElementId,
  type ElementDefinition,
} from './five-elements'

export {
  // Twelve Chapters — Life Context
  TWELVE_CHAPTERS,
  getChapter,
  type ChapterId,
  type LifeChapter,
} from './twelve-chapters'

export {
  // Seven Levels of Meaning — Interpretation Lens
  SEVEN_LEVELS,
  MEANING_RULES,
  getMeaningLevel,
  type MeaningLevelId,
  type MeaningLevel,
} from './seven-levels'

export {
  // Four Conditions for Flow — Operating State
  FOUR_CONDITIONS,
  FLOW_PATTERNS,
  FLOW_GUIDANCE,
  FLOW_APHORISM,
  getFlowCondition,
  type FlowConditionId,
  type FlowCondition,
} from './four-conditions'

export {
  // Four Aims of Personal Calling — Energy Direction
  FOUR_AIMS,
  CALLING_ROLES,
  CALLING_PATTERNS,
  CHAPTER_CALLING_EMPHASIS,
  CALLING_REFLECTIONS,
  getCallingAim,
  type CallingAimId,
  type CallingAim,
} from './four-aims'

export {
  // Nine Principles of Community — Collective Health
  NINE_PRINCIPLES,
  COMMUNITY_FORMULA,
  COMMUNITY_PATTERNS,
  getCommunityPrinciple,
  getPrinciplesByLayer,
  type CommunityPrincipleId,
  type CommunityPrinciple,
  type CommunityLayer,
} from './nine-principles'

// ── Master system metadata ───────────────────────────────────────────────────

export const AETHERIUM_SYSTEM = {
  version: '1.0',
  status: 'locked',
  layers: [
    { id: 'five-elements',     name: 'Five Elements',              purpose: 'Structure of self',   question: 'What am I?' },
    { id: 'four-conditions',   name: 'Four Conditions for Flow',   purpose: 'Operating state',     question: 'How am I moving?' },
    { id: 'twelve-chapters',   name: 'Twelve Chapters',            purpose: 'Life context',        question: 'Where am I?' },
    { id: 'seven-levels',      name: 'Seven Levels of Meaning',    purpose: 'Interpretation lens', question: 'Why does this matter?' },
    { id: 'four-aims',         name: 'Four Aims of Calling',       purpose: 'Energy direction',    question: 'Toward what?' },
    { id: 'nine-principles',   name: 'Nine Principles of Community', purpose: 'Collective health', question: 'With whom?' },
  ],
  coreInsight: 'A person is not broken. A person is often simply misaligned, underdeveloped in one dimension, overidentified with another, disconnected from their deeper orientation, or lacking integrated practice.',
  ultimatePurpose: [
    'Understand themselves',
    'Activate their capacities',
    'Align their system',
    'Move in flow',
    'Serve the greater good',
  ],
} as const
