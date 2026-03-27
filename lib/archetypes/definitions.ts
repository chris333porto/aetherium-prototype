import type { EvolutionState } from '../scoring/engine'
import type { Dimension } from '../assessment/questions'
import type { RoleId } from '../types/canon'

export interface ArchetypeProfile {
  // Representative ideal scores [0-100] for [aether, fire, air, water, earth]
  aether: number
  fire: number
  air: number
  water: number
  earth: number
}

export interface Archetype {
  id: string
  name: string
  state: EvolutionState
  profile: ArchetypeProfile
  dominantDimensions: Dimension[]
  deficientDimensions: Dimension[]
  tagline: string
  description: string
  expression: string
  shadow: string
  /**
   * Maps this score-derived archetype to its canonical role from Aetherium Canon v1.
   * Use this to surface canon-consistent language in product copy and AI prompts:
   *   import { getRole } from '@/lib/canon'
   *   const role = getRole(archetype.canonicalRoleId)
   *   // "Your dominant role right now is [role.name]."
   */
  canonicalRoleId: RoleId
}

export const ARCHETYPES: Archetype[] = [
  // ── FRAGMENTED ────────────────────────────────────────────────────────────
  {
    id: 'the-drifter',
    name: 'The Drifter',
    state: 'fragmented',
    profile: { aether: 20, fire: 20, air: 30, water: 30, earth: 20 },
    dominantDimensions: [],
    deficientDimensions: ['aether', 'fire', 'earth'],
    tagline: 'Movement without destination.',
    description: 'Scattered across many paths, yet committed to none. Living reactively in the space between choices.',
    expression: 'Perpetual starting-over. Difficulty sustaining anything. A sense of floating rather than being.',
    shadow: 'Avoidance disguised as freedom.',
    canonicalRoleId: 'explorer',   // exploration without commitment = Explorer's shadow form
  },
  {
    id: 'the-ghost',
    name: 'The Ghost',
    state: 'fragmented',
    profile: { aether: 60, fire: 15, air: 30, water: 40, earth: 15 },
    dominantDimensions: ['aether'],
    deficientDimensions: ['fire', 'earth'],
    tagline: 'A soul untethered from its body.',
    description: 'Sensitive to meaning and depth, yet unable to act on what is perceived. Vision without incarnation.',
    expression: 'Rich inner life, minimal outer movement. Others sense depth but rarely witness it in action.',
    shadow: 'Using spirituality or insight as a reason not to engage with life.',
    canonicalRoleId: 'visionary',  // vision without incarnation = Visionary's shadow form
  },
  {
    id: 'the-reactor',
    name: 'The Reactor',
    state: 'fragmented',
    profile: { aether: 20, fire: 65, air: 30, water: 70, earth: 30 },
    dominantDimensions: ['fire', 'water'],
    deficientDimensions: ['aether', 'air'],
    tagline: 'Energy without direction.',
    description: 'Emotionally volatile and impulsive. High feeling and high drive that cancel each other out without clarity.',
    expression: 'Intense, unpredictable, passionate. Can move mountains and then disappear. Others feel the heat.',
    shadow: 'Mistaking intensity for depth.',
    canonicalRoleId: 'warrior',    // force without direction = Warrior's shadow form
  },
  {
    id: 'the-recluse',
    name: 'The Recluse',
    state: 'fragmented',
    profile: { aether: 30, fire: 15, air: 70, water: 25, earth: 20 },
    dominantDimensions: ['air'],
    deficientDimensions: ['fire', 'water', 'earth'],
    tagline: 'Thinking as a substitute for living.',
    description: 'Brilliant in analysis but withdrawn from life. The mind as refuge. Knows much, experiences little.',
    expression: 'Precise, observant, private. Struggles to translate thought into feeling, action, or connection.',
    shadow: 'Intelligence used to stay safe from the risk of living.',
    canonicalRoleId: 'analyst',    // analysis as refuge = Analyst's shadow form
  },
  {
    id: 'the-soldier',
    name: 'The Soldier',
    state: 'fragmented',
    profile: { aether: 20, fire: 70, air: 25, water: 20, earth: 75 },
    dominantDimensions: ['fire', 'earth'],
    deficientDimensions: ['aether', 'air', 'water'],
    tagline: 'Discipline without wisdom.',
    description: 'Capable of execution, but serving an unclear or inherited cause. Power without self-direction.',
    expression: 'Reliable, hard-working, capable. Often in service to structures they did not choose for themselves.',
    shadow: 'Confusing obedience with virtue.',
    canonicalRoleId: 'operator',   // execution without purpose = Operator's shadow form
  },

  // ── EMERGING ──────────────────────────────────────────────────────────────
  {
    id: 'the-seeker',
    name: 'The Seeker',
    state: 'emerging',
    profile: { aether: 65, fire: 30, air: 40, water: 50, earth: 30 },
    dominantDimensions: ['aether'],
    deficientDimensions: ['fire', 'earth'],
    tagline: 'Searching for the truer life.',
    description: 'Beginning to find their purpose. Drawn toward depth, meaning, and becoming — but not yet grounded in action.',
    expression: 'Curious, restless, questioning. Reads, travels, explores. Has not yet committed fully to a path.',
    shadow: 'Endless seeking as a way to postpone arriving.',
    canonicalRoleId: 'explorer',
  },
  {
    id: 'the-builder',
    name: 'The Builder',
    state: 'emerging',
    profile: { aether: 35, fire: 65, air: 40, water: 40, earth: 70 },
    dominantDimensions: ['earth', 'fire'],
    deficientDimensions: ['aether'],
    tagline: 'Building toward an unclear destination.',
    description: 'Capable and driven, constructing real things in the world. The vision that would give it meaning has not yet fully arrived.',
    expression: 'Productive, dependable, concrete. Works hard and shows results. Asks "what?" more than "why?"',
    shadow: 'Busyness as a substitute for meaning.',
    canonicalRoleId: 'builder',
  },
  {
    id: 'the-empath',
    name: 'The Empath',
    state: 'emerging',
    profile: { aether: 40, fire: 25, air: 40, water: 75, earth: 35 },
    dominantDimensions: ['water'],
    deficientDimensions: ['fire', 'earth'],
    tagline: 'Feeling everything, holding it all.',
    description: 'Deeply sensitive, compassionate, and attuned to others. Still learning to hold their own boundaries while remaining open.',
    expression: 'Warm, perceptive, other-focused. May absorb too much. Gives abundantly but struggles to receive or act on their own needs.',
    shadow: 'Compassion as an avoidance of self.',
    canonicalRoleId: 'healer',
  },
  {
    id: 'the-analyst',
    name: 'The Analyst',
    state: 'emerging',
    profile: { aether: 40, fire: 30, air: 75, water: 30, earth: 35 },
    dominantDimensions: ['air'],
    deficientDimensions: ['water', 'earth'],
    tagline: 'Sharp mind, waking heart.',
    description: 'Intellectually acute, beginning to recognize that cognition alone is incomplete. The emotional and physical dimensions are opening.',
    expression: 'Systematic, precise, questioning. Highly competent in conceptual domains. Relationships and embodiment are frontier terrain.',
    shadow: 'Analyzing feeling as a substitute for having it.',
    canonicalRoleId: 'analyst',
  },
  {
    id: 'the-warrior',
    name: 'The Warrior',
    state: 'emerging',
    profile: { aether: 30, fire: 75, air: 35, water: 30, earth: 70 },
    dominantDimensions: ['fire', 'earth'],
    deficientDimensions: ['aether', 'air'],
    tagline: 'Force seeking a cause.',
    description: 'Disciplined, relentless, and embodied. Beginning to question who and what they are fighting for.',
    expression: 'Intense, direct, capable. Gets things done. The integration of wisdom and emotion is the next horizon.',
    shadow: 'Mistaking willpower for wisdom.',
    canonicalRoleId: 'warrior',
  },
  {
    id: 'the-dreamer',
    name: 'The Dreamer',
    state: 'emerging',
    profile: { aether: 70, fire: 35, air: 65, water: 50, earth: 25 },
    dominantDimensions: ['aether', 'air'],
    deficientDimensions: ['earth', 'fire'],
    tagline: 'Vision without ground.',
    description: 'Visionary, inspired, and imaginative — struggling to land the vision in material reality. Lives more in possibility than in presence.',
    expression: 'Idealistic, creative, future-oriented. Beautiful ideas, inconsistent follow-through. Others are moved by what could be.',
    shadow: 'Living in the future to escape the present.',
    canonicalRoleId: 'visionary',
  },
  {
    id: 'the-helper',
    name: 'The Helper',
    state: 'emerging',
    profile: { aether: 45, fire: 35, air: 40, water: 70, earth: 65 },
    dominantDimensions: ['water', 'earth'],
    deficientDimensions: ['aether', 'fire'],
    tagline: 'Service without self.',
    description: 'Devoted to others and capable of grounded support. Beginning to understand that their own path and desires deserve attention.',
    expression: 'Reliable, warm, practical. Known for what they give. The emergence of personal direction is the growing edge.',
    shadow: 'Serving others to avoid being seen.',
    canonicalRoleId: 'guide',
  },

  // ── INTEGRATED ────────────────────────────────────────────────────────────
  {
    id: 'the-philosopher',
    name: 'The Philosopher',
    state: 'integrated',
    profile: { aether: 70, fire: 40, air: 75, water: 65, earth: 35 },
    dominantDimensions: ['aether', 'air', 'water'],
    deficientDimensions: ['earth'],
    tagline: 'Insight crystallizing into wisdom.',
    description: 'Deep thinker with emotional intelligence and clear purpose. Integrates meaning, mind, and feeling. Action in the world is the remaining frontier.',
    expression: 'Reflective, nuanced, capable of holding complexity. Others seek their counsel. Rarely rushes toward conclusions.',
    shadow: 'Knowing the right path and not walking it.',
    canonicalRoleId: 'advisor',
  },
  {
    id: 'the-guardian',
    name: 'The Guardian',
    state: 'integrated',
    profile: { aether: 50, fire: 65, air: 45, water: 70, earth: 75 },
    dominantDimensions: ['earth', 'water', 'fire'],
    deficientDimensions: [],
    tagline: 'Steady presence, fierce protection.',
    description: 'Protective, reliable, and emotionally present. Holds space for others while grounded in consistent action. Still developing their own vision.',
    expression: 'Calm under pressure, emotionally attuned, physically present. Others feel safe around them.',
    shadow: 'Caring for everyone except themselves.',
    canonicalRoleId: 'anchor',
  },
  {
    id: 'the-catalyst',
    name: 'The Catalyst',
    state: 'integrated',
    profile: { aether: 70, fire: 75, air: 65, water: 40, earth: 55 },
    dominantDimensions: ['fire', 'aether', 'air'],
    deficientDimensions: ['water'],
    tagline: 'Purposeful disruption.',
    description: 'Drives change with intention and strategic clarity. Moves fast, thinks well, and acts with purpose. Emotional depth is the growing edge.',
    expression: 'Energized, decisive, forward-moving. Initiates things others won\'t. Can move past feelings in pursuit of the goal.',
    shadow: 'Speed used to avoid depth.',
    canonicalRoleId: 'catalyst',
  },
  {
    id: 'the-connector',
    name: 'The Connector',
    state: 'integrated',
    profile: { aether: 70, fire: 40, air: 65, water: 75, earth: 40 },
    dominantDimensions: ['water', 'aether', 'air'],
    deficientDimensions: ['fire', 'earth'],
    tagline: 'Bridge between worlds.',
    description: 'Masterful with relationships and guided by clear values. Emotionally intelligent and purposeful. Developing the capacity to execute and ground.',
    expression: 'Warm, perceptive, principled. Builds communities and trust. Others feel understood in their presence.',
    shadow: 'Prioritizing harmony over necessary confrontation.',
    canonicalRoleId: 'connector',
  },
  {
    id: 'the-craftsman',
    name: 'The Craftsman',
    state: 'integrated',
    profile: { aether: 45, fire: 65, air: 75, water: 40, earth: 75 },
    dominantDimensions: ['earth', 'air', 'fire'],
    deficientDimensions: ['aether', 'water'],
    tagline: 'Precision in service of quality.',
    description: 'Skilled at building with care and detail. Integrates thinking and doing with consistency. Developing purpose and emotional intelligence.',
    expression: 'Methodical, skilled, results-oriented. Known for quality. Takes pride in the work itself.',
    shadow: 'Perfecting craft as an avoidance of meaning.',
    canonicalRoleId: 'maker',
  },
  {
    id: 'the-leader',
    name: 'The Leader',
    state: 'integrated',
    profile: { aether: 65, fire: 75, air: 50, water: 50, earth: 70 },
    dominantDimensions: ['fire', 'earth', 'aether'],
    deficientDimensions: [],
    tagline: 'Direction given, movement created.',
    description: 'Motivated, grounded, and purposeful. Moves people and projects forward. Deepening wisdom and empathy is the path ahead.',
    expression: 'Decisive, visible, effective. Creates momentum. Others look to them when direction is needed.',
    shadow: 'Leading from position rather than from being.',
    canonicalRoleId: 'leader',
  },
  {
    id: 'the-healer',
    name: 'The Healer',
    state: 'integrated',
    profile: { aether: 65, fire: 40, air: 50, water: 75, earth: 70 },
    dominantDimensions: ['water', 'earth', 'aether'],
    deficientDimensions: ['fire', 'air'],
    tagline: 'Restoration through presence.',
    description: 'Compassionate, grounded, and purposeful. Holds space for transformation in others. Developing activation and sharper discernment.',
    expression: 'Gentle, stable, attuned. Others are drawn to heal in their presence. Rarely asks for help themselves.',
    shadow: 'Healing others to avoid one\'s own wounds.',
    canonicalRoleId: 'healer',
  },
  {
    id: 'the-creator',
    name: 'The Creator',
    state: 'integrated',
    profile: { aether: 75, fire: 70, air: 70, water: 45, earth: 45 },
    dominantDimensions: ['aether', 'fire', 'air'],
    deficientDimensions: ['earth', 'water'],
    tagline: 'Inspired force, making real.',
    description: 'Inspired, driven, and clear-minded. Generates ideas and brings them to form. Learning to ground and feel more deeply.',
    expression: 'Original, energized, generative. Produces work that others find meaningful. Can burn bright and short.',
    shadow: 'Creating to be seen rather than to express truth.',
    canonicalRoleId: 'creator',
  },

  // ── ADVANCED ──────────────────────────────────────────────────────────────
  {
    id: 'the-visionary',
    name: 'The Visionary',
    state: 'advanced',
    profile: { aether: 80, fire: 70, air: 75, water: 70, earth: 45 },
    dominantDimensions: ['aether', 'air', 'fire', 'water'],
    deficientDimensions: ['earth'],
    tagline: 'Seeing what others cannot yet see.',
    description: 'Sees far, feels deeply, thinks clearly, and acts boldly. Grounding the vision in sustained reality is the final integration.',
    expression: 'Compelling, future-oriented, synthesizing. Articulates possibilities that shift how others see. Embodied presence is the growing edge.',
    shadow: 'Vision as a way to live above ordinary life.',
    canonicalRoleId: 'visionary',
  },
  {
    id: 'the-sage',
    name: 'The Sage',
    state: 'advanced',
    profile: { aether: 80, fire: 50, air: 80, water: 75, earth: 55 },
    dominantDimensions: ['aether', 'air', 'water'],
    deficientDimensions: [],
    tagline: 'Wisdom expressed without performance.',
    description: 'Wisdom crystallized into insight. Integrates knowing, feeling, and purpose. Speaks rarely but precisely. Creates clarity in others.',
    expression: 'Measured, deep, unshakeable. Trusted by those who value truth over comfort. Their presence changes the quality of a room.',
    shadow: 'Withholding wisdom out of detachment or pride.',
    canonicalRoleId: 'advisor',
  },
  {
    id: 'the-architect',
    name: 'The Architect',
    state: 'advanced',
    profile: { aether: 70, fire: 70, air: 80, water: 45, earth: 80 },
    dominantDimensions: ['air', 'earth', 'fire', 'aether'],
    deficientDimensions: ['water'],
    tagline: 'Systems that hold reality together.',
    description: 'Master builder of structures that endure. Merges intelligence, execution, and purpose. Developing emotional mastery.',
    expression: 'Strategic, disciplined, far-thinking. Builds things designed to last. Others trust their blueprints.',
    shadow: 'Using structure to avoid intimacy and vulnerability.',
    canonicalRoleId: 'architect',
  },
  {
    id: 'the-oracle',
    name: 'The Oracle',
    state: 'advanced',
    profile: { aether: 80, fire: 40, air: 75, water: 80, earth: 40 },
    dominantDimensions: ['aether', 'water', 'air'],
    deficientDimensions: ['fire', 'earth'],
    tagline: 'Piercing through illusion.',
    description: 'Pierces the surface of things with intuition and knowing. Deep insight into people, systems, and timing. Developing grounded action.',
    expression: 'Perceptive, precise, often unsettling in their clarity. Knows before understanding why. Developing the will to act on what is seen.',
    shadow: 'Seeing clearly and refusing to act.',
    canonicalRoleId: 'researcher',  // investigates deeply, grounds insight in evidence
  },
  {
    id: 'the-warrior-sage',
    name: 'The Warrior-Sage',
    state: 'advanced',
    profile: { aether: 75, fire: 80, air: 70, water: 50, earth: 75 },
    dominantDimensions: ['fire', 'aether', 'air', 'earth'],
    deficientDimensions: ['water'],
    tagline: 'Strategic force, guided by truth.',
    description: 'Combines the force of the warrior with the clarity of the sage. Purpose-driven, disciplined, and intelligent. Emotional mastery is the frontier.',
    expression: 'Formidable, precise, principled. Acts without hesitation when the moment is clear. Commands respect without demanding it.',
    shadow: 'Cutting away feeling in the name of clarity.',
    canonicalRoleId: 'strategist',  // sees patterns, positions well, force + clarity
  },
  {
    id: 'the-alchemist',
    name: 'The Alchemist',
    state: 'advanced',
    profile: { aether: 75, fire: 70, air: 70, water: 70, earth: 70 },
    dominantDimensions: ['aether', 'fire', 'water', 'air', 'earth'],
    deficientDimensions: [],
    tagline: 'Transformation as a way of life.',
    description: 'Transforms everything they touch — ideas, people, situations. High across all dimensions, integrating and transmuting.',
    expression: 'Uncommon. Leaves things fundamentally different than they found them. Their presence catalyzes change in others.',
    shadow: 'Compulsive transformation as avoidance of acceptance.',
    canonicalRoleId: 'alchemist',
  },

  // ── UNIFIED ───────────────────────────────────────────────────────────────
  {
    id: 'the-sovereign',
    name: 'The Sovereign',
    state: 'unified',
    profile: { aether: 85, fire: 80, air: 75, water: 75, earth: 85 },
    dominantDimensions: ['aether', 'fire', 'earth', 'air', 'water'],
    deficientDimensions: [],
    tagline: 'Power in service of all.',
    description: 'Embodies authority through wholeness. Power is held not through force but through integration. Acts from complete self-possession.',
    expression: 'Rare authority. Not performed — lived. Others feel both the gravity and the freedom in their presence.',
    shadow: 'The residue of ego dressed as wisdom.',
    canonicalRoleId: 'leader',     // authority through wholeness; highest expression of Leader
  },
  {
    id: 'the-mystic',
    name: 'The Mystic',
    state: 'unified',
    profile: { aether: 90, fire: 50, air: 80, water: 85, earth: 60 },
    dominantDimensions: ['aether', 'water', 'air'],
    deficientDimensions: [],
    tagline: 'Dwelling at the threshold.',
    description: 'Lives at the intersection of the visible and invisible. Unified in being rather than doing. Presence is the offering.',
    expression: 'Still, vast, attuned. The ordinary becomes extraordinary in their company. Does not explain what they know — they inhabit it.',
    shadow: 'Transcendence used to avoid the mess of incarnation.',
    canonicalRoleId: 'alchemist',  // transforms raw experience into higher-order value
  },
  {
    id: 'the-master',
    name: 'The Master',
    state: 'unified',
    profile: { aether: 85, fire: 85, air: 85, water: 85, earth: 85 },
    dominantDimensions: ['aether', 'fire', 'air', 'water', 'earth'],
    deficientDimensions: [],
    tagline: 'Excellence without effort.',
    description: 'Complete mastery of self across all dimensions. Excellence flows naturally — not as performance but as expression.',
    expression: 'Rare and unmistakable. What they do and who they are is one thing. Mastery shows in the quality of attention.',
    shadow: 'The illusion that there is nothing left to learn.',
    canonicalRoleId: 'orchestrator', // brings many moving parts into coherence; highest expression
  },
  {
    id: 'the-beacon',
    name: 'The Beacon',
    state: 'unified',
    profile: { aether: 85, fire: 75, air: 70, water: 80, earth: 65 },
    dominantDimensions: ['aether', 'fire', 'water'],
    deficientDimensions: [],
    tagline: 'Illuminated purpose, lived aloud.',
    description: 'Illuminated purpose expressed through action and deep connection. Lights the way for others simply by walking their own.',
    expression: 'Radiant without trying. Inspires without performing. Others feel called toward their own truth in proximity to them.',
    shadow: 'The burden of being a light others depend on.',
    canonicalRoleId: 'catalyst',   // accelerates transformation in others
  },
  {
    id: 'the-weaver',
    name: 'The Weaver',
    state: 'unified',
    profile: { aether: 80, fire: 60, air: 80, water: 85, earth: 80 },
    dominantDimensions: ['water', 'air', 'aether', 'earth'],
    deficientDimensions: [],
    tagline: 'Integration made visible.',
    description: 'Integrates all disparate parts into a coherent whole. Holds paradox without collapse. Brings together what others cannot reconcile.',
    expression: 'Integrating, bridging, holding. Others feel met, not just heard. Creates coherence in complex systems.',
    shadow: 'Taking responsibility for others\' integration at the expense of rest.',
    canonicalRoleId: 'connector',  // links people, ideas, and domains into new coherence
  },
  {
    id: 'the-pilgrim',
    name: 'The Pilgrim',
    state: 'unified',
    profile: { aether: 90, fire: 65, air: 75, water: 75, earth: 70 },
    dominantDimensions: ['aether'],
    deficientDimensions: [],
    tagline: 'The journey has become the destination.',
    description: 'Perfect alignment with one\'s path. Neither arriving nor departing — simply walking. The deepest expression of Aether.',
    expression: 'Unhurried, unattached, fully present. Their path is unmistakably their own. Equanimity is not a practice — it is their nature.',
    shadow: 'Detachment mistaken for freedom.',
    canonicalRoleId: 'explorer',   // enters the unknown; the journey has become its own destination
  },
]

export function getArchetypeById(id: string): Archetype | undefined {
  return ARCHETYPES.find(a => a.id === id)
}

export function getArchetypesByState(state: EvolutionState): Archetype[] {
  return ARCHETYPES.filter(a => a.state === state)
}
