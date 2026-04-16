/**
 * definitions.ts
 *
 * CANONICAL 32-ARCHETYPE SYSTEM — LOCKED
 *
 * Source of truth:
 *   - Aetherium_Locked_Master_Canon - SACRED MATH.docx
 *   - Aetherium_Locked_Archetype_Breakdown - INTERPRETATION.docx
 *
 * Vectors are on a 0–5 scale in the order [Aether, Fire, Air, Water, Earth].
 * Categories: Core (10), Expansion (8), Shadow (7), Transcendent (7).
 *
 * DO NOT modify vectors, categories, growth edges, or shadow triggers
 * without a versioned canon update.
 */

import type { Dimension } from '../assessment/questions'

// ── Category system (replaces EvolutionState for archetypes) ─────────────────

export type ArchetypeCategory = 'core' | 'expansion' | 'shadow' | 'transcendent'

// ── Archetype vector (0–5 scale, matching canon) ─────────────────────────────

export interface ArchetypeVector {
  aether: number  // 0–5
  fire:   number  // 0–5
  air:    number  // 0–5
  water:  number  // 0–5
  earth:  number  // 0–5
}

// ── Dominant force (some archetypes have compound or special dominants) ───────

export type DominantForce =
  | Dimension
  | 'fire/earth'
  | 'aether/air'
  | 'passive'
  | 'collapse'
  | 'integrated'
  | 'balanced'
  | 'total'

// ── Full archetype definition ────────────────────────────────────────────────

export interface Archetype {
  id:                  string
  name:                string
  category:            ArchetypeCategory
  vector:              ArchetypeVector
  dominantForce:       DominantForce
  growthEdge:          string          // e.g. "Act (Earth)"
  growthDimension:     Dimension | null // the primary dimension to develop (null for Burnout restore, Unified evolve, Embodied sustain)
  shadowTrigger:       string          // e.g. "Overthinking"

  // ── Interpretation copy (from locked breakdown doc) ──────────────────────
  corePattern:         string
  coreTension:         string
  primaryBlock:        string
  whenAligned:         string
  whenMisaligned:      string
  rebalancingPath:     string
  practiceOrientation: string
  aiOutput:            string          // The canonical mirror statement

  // ── Compassion register (Shadow-category only) ──────────────────────────
  // When a Shadow archetype is the PRIMARY match (not just shadow slot),
  // use this softer framing that leads with recognition before diagnosis.
  // Undefined for non-Shadow archetypes.
  whenPrimary?:        string
}

// ─── THE CANONICAL 32 ────────────────────────────────────────────────────────

export const ARCHETYPES: Archetype[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // CORE (10)
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'strategist',
    name: 'The Strategist',
    category: 'core',
    vector: { aether: 4, fire: 2, air: 5, water: 1, earth: 1 },
    dominantForce: 'air',
    growthEdge: 'Act (Earth)',
    growthDimension: 'earth',
    shadowTrigger: 'Overthinking',
    corePattern: 'Orients toward understanding systems and positioning for long-term advantage.',
    coreTension: 'Clarity vs execution',
    primaryBlock: 'Fear of making the wrong move.',
    whenAligned: 'Moves with clarity and foresight, making precise decisions that compound over time.',
    whenMisaligned: 'Overthinks, delays action, and becomes trapped in analysis loops.',
    rebalancingPath: 'Increase Earth (Action); stabilize Water (Emotion).',
    practiceOrientation: 'Make one irreversible decision daily. Set time-bound thinking windows. Prioritize execution over optimization.',
    aiOutput: 'You are currently operating as The Strategist. You see clearly—but you are not moving. Your next step is not more thinking. It is action.',
  },
  {
    id: 'builder',
    name: 'The Builder',
    category: 'core',
    vector: { aether: 2, fire: 4, air: 2, water: 1, earth: 5 },
    dominantForce: 'earth',
    growthEdge: 'Purpose (Aether)',
    growthDimension: 'aether',
    shadowTrigger: 'Misaligned work',
    corePattern: 'Orients toward creating tangible structure and bringing ideas into reality through consistent action.',
    coreTension: 'Action vs alignment',
    primaryBlock: 'Operating without a clear why.',
    whenAligned: 'Executes with discipline and creates real-world results that others can rely on.',
    whenMisaligned: 'Becomes reactive, overworks, and builds without clear direction or purpose.',
    rebalancingPath: 'Clarify Aether (Intention); refine Air (Cognition).',
    practiceOrientation: 'Define the purpose behind current efforts. Eliminate low-leverage work. Align daily actions with a larger direction.',
    aiOutput: 'You are currently operating as The Builder. You are moving—but not all of it is aligned. Clarify what actually matters, then build toward that.',
  },
  {
    id: 'seeker',
    name: 'The Seeker',
    category: 'core',
    vector: { aether: 5, fire: 1, air: 2, water: 4, earth: 1 },
    dominantForce: 'aether',
    growthEdge: 'Commit (Fire)',
    growthDimension: 'fire',
    shadowTrigger: 'Drifting',
    corePattern: 'Orients toward discovery, meaning, and the exploration of deeper truth.',
    coreTension: 'Exploration vs commitment',
    primaryBlock: 'Fear of choosing a path and closing others.',
    whenAligned: 'Explores with openness and depth, uncovering meaningful insights about self and life.',
    whenMisaligned: 'Drifts without direction, constantly searching without committing or acting.',
    rebalancingPath: 'Increase Fire (Volition); increase Earth (Execution).',
    practiceOrientation: 'Choose one direction and commit for a defined period. Turn insight into action. Reduce endless exploration loops.',
    aiOutput: 'You are currently operating as The Seeker. You are discovering—but not committing. Your next step is to choose a direction and move.',
  },
  {
    id: 'guardian',
    name: 'The Guardian',
    category: 'core',
    vector: { aether: 2, fire: 2, air: 1, water: 5, earth: 4 },
    dominantForce: 'water',
    growthEdge: 'Adapt (Air)',
    growthDimension: 'air',
    shadowTrigger: 'Resistance',
    corePattern: 'Orients toward protecting stability, maintaining order, and preserving what matters.',
    coreTension: 'Stability vs change',
    primaryBlock: 'Fear of disruption or loss.',
    whenAligned: 'Provides emotional grounding, loyalty, and stability for self and others.',
    whenMisaligned: 'Resists change, becomes overly protective, and avoids necessary evolution.',
    rebalancingPath: 'Expand Air (Cognition); clarify Aether (Intention).',
    practiceOrientation: 'Question existing patterns. Allow controlled change. Re-evaluate what is being protected.',
    aiOutput: 'You are currently operating as The Guardian. You are holding things together—but resisting change. Growth requires allowing movement, not just preserving stability.',
  },
  {
    id: 'catalyst',
    name: 'The Catalyst',
    category: 'core',
    vector: { aether: 2, fire: 5, air: 1, water: 2, earth: 2 },
    dominantForce: 'fire',
    growthEdge: 'Direct (Air)',
    growthDimension: 'air',
    shadowTrigger: 'Chaos',
    corePattern: 'Orients toward initiating change, activating movement, and disrupting stagnation.',
    coreTension: 'Momentum vs direction',
    primaryBlock: 'Acting before understanding.',
    whenAligned: 'Initiates powerful movement and brings energy that activates transformation.',
    whenMisaligned: 'Acts impulsively, creates chaos, and lacks direction or follow-through.',
    rebalancingPath: 'Strengthen Air (Cognition); stabilize Earth (Execution).',
    practiceOrientation: 'Pause before initiating. Define direction before acting. Follow through on what is started.',
    aiOutput: 'You are currently operating as The Catalyst. You create movement—but not always direction. Channel your energy with clarity before acting.',
  },
  {
    id: 'creator',
    name: 'The Creator',
    category: 'core',
    vector: { aether: 4, fire: 3, air: 2, water: 5, earth: 1 },
    dominantForce: 'water',
    growthEdge: 'Finish (Earth)',
    growthDimension: 'earth',
    shadowTrigger: 'Scattered',
    corePattern: 'Orients toward expressing inner vision into form, bringing something new into existence.',
    coreTension: 'Inspiration vs execution',
    primaryBlock: 'Avoidance of structure and follow-through.',
    whenAligned: 'Channels inspiration into meaningful expression that resonates with others.',
    whenMisaligned: 'Starts many things but struggles to complete them or bring them into reality.',
    rebalancingPath: 'Increase Earth (Execution); stabilize Fire (Volition).',
    practiceOrientation: 'Finish one creation before starting another. Introduce simple structure into creative flow. Ship imperfect work.',
    aiOutput: 'You are currently operating as The Creator. You are inspired—but not completing. Your next step is to bring one thing fully into form.',
  },
  {
    id: 'integrator',
    name: 'The Integrator',
    category: 'core',
    vector: { aether: 3, fire: 1, air: 5, water: 3, earth: 3 },
    dominantForce: 'air',
    growthEdge: 'Decide (Fire)',
    growthDimension: 'fire',
    shadowTrigger: 'Stagnation',
    corePattern: 'Orients toward synthesizing different perspectives into coherent understanding.',
    coreTension: 'Understanding vs movement',
    primaryBlock: 'Hesitation to commit to a single direction.',
    whenAligned: 'Sees connections others miss and brings clarity across complexity.',
    whenMisaligned: 'Remains in synthesis mode without taking action or forming direction.',
    rebalancingPath: 'Increase Fire (Volition); clarify Aether (Intention).',
    practiceOrientation: 'Translate insight into decision. Commit to one integrated path. Move from mapping to action.',
    aiOutput: 'You are currently operating as The Integrator. You understand deeply—but you are not deciding. Your next step is to choose and move.',
  },
  {
    id: 'visionary',
    name: 'The Visionary',
    category: 'core',
    vector: { aether: 5, fire: 3, air: 3, water: 3, earth: 1 },
    dominantForce: 'aether',
    growthEdge: 'Ground (Earth)',
    growthDimension: 'earth',
    shadowTrigger: 'Fantasy loop',
    corePattern: 'Orients toward seeing future possibilities and what could emerge.',
    coreTension: 'Possibility vs realization',
    primaryBlock: 'Avoidance of constraints and execution.',
    whenAligned: 'Articulates powerful future states and inspires movement toward them.',
    whenMisaligned: 'Lives in possibility without grounding ideas into reality.',
    rebalancingPath: 'Increase Earth (Execution); strengthen Fire (Volition).',
    practiceOrientation: 'Define one vision to execute. Translate ideas into concrete steps. Ground imagination in reality.',
    aiOutput: 'You are currently operating as The Visionary. You see what is possible—but it is not yet real. Your next step is to ground vision into action.',
  },
  {
    id: 'refiner',
    name: 'The Refiner',
    category: 'core',
    vector: { aether: 2, fire: 3, air: 5, water: 1, earth: 3 },
    dominantForce: 'air',
    growthEdge: 'Complete (Earth)',
    growthDimension: 'earth',
    shadowTrigger: 'Perfectionism',
    corePattern: 'Orients toward improving, optimizing, and bringing things into greater precision.',
    coreTension: 'Precision vs completion',
    primaryBlock: 'Fear of imperfection.',
    whenAligned: 'Brings clarity, quality, and refinement to systems and outputs.',
    whenMisaligned: 'Becomes overly critical, perfectionistic, and unable to complete.',
    rebalancingPath: 'Stabilize Water (Emotion); increase Earth (Execution).',
    practiceOrientation: 'Ship before perfect. Accept imperfection. Focus on completion over optimization.',
    aiOutput: 'You are currently operating as The Refiner. You are improving—but not completing. Your next step is to finish, not perfect.',
  },
  {
    id: 'connector',
    name: 'The Connector',
    category: 'core',
    vector: { aether: 2, fire: 2, air: 1, water: 5, earth: 3 },
    dominantForce: 'water',
    growthEdge: 'Clarify (Air)',
    growthDimension: 'air',
    shadowTrigger: 'People-pleasing',
    corePattern: 'Orients toward building relationships, creating connection, and aligning people.',
    coreTension: 'Connection vs clarity',
    primaryBlock: 'Fear of disconnection.',
    whenAligned: 'Creates meaningful relationships and brings people into alignment.',
    whenMisaligned: 'Avoids conflict, over-adapts, and loses clarity in relationships.',
    rebalancingPath: 'Strengthen Air (Cognition); clarify Aether (Intention).',
    practiceOrientation: 'Speak truth even when uncomfortable. Set clear boundaries. Balance empathy with clarity.',
    aiOutput: 'You are currently operating as The Connector. You are relating—but not always clearly. Your next step is to bring clarity into your connections.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EXPANSION (8)
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'leader',
    name: 'The Leader',
    category: 'expansion',
    vector: { aether: 4, fire: 5, air: 3, water: 3, earth: 3 },
    dominantForce: 'fire',
    growthEdge: 'Soften (Water)',
    growthDimension: 'water',
    shadowTrigger: 'Control',
    corePattern: 'Orients toward directing energy, making decisions, and mobilizing others.',
    coreTension: 'Direction vs domination',
    primaryBlock: 'Over-reliance on control instead of trust.',
    whenAligned: 'Creates direction, clarity, and momentum for others.',
    whenMisaligned: 'Becomes controlling, forceful, or overly dominant.',
    rebalancingPath: 'Stabilize Water (Emotion); balance Air (Cognition).',
    practiceOrientation: 'Listen before directing. Empower others vs command. Lead with clarity, not force.',
    aiOutput: 'You are operating as The Leader. You are moving energy—but may be overpowering. Your next step is to lead through alignment, not force.',
  },
  {
    id: 'operator',
    name: 'The Operator',
    category: 'expansion',
    vector: { aether: 1, fire: 3, air: 3, water: 1, earth: 5 },
    dominantForce: 'earth',
    growthEdge: 'Meaning (Aether)',
    growthDimension: 'aether',
    shadowTrigger: 'Mechanical',
    corePattern: 'Orients toward execution, systems, and getting things done efficiently.',
    coreTension: 'Efficiency vs meaning',
    primaryBlock: 'Lack of connection to purpose.',
    whenAligned: 'Executes with precision and reliability.',
    whenMisaligned: 'Becomes mechanical, uninspired, or stuck in routine.',
    rebalancingPath: 'Increase Aether (Intention); reconnect Water (Emotion).',
    practiceOrientation: 'Connect tasks to purpose. Reintroduce creativity into systems. Step back and reassess direction.',
    aiOutput: 'You are operating as The Operator. You are executing—but may lack direction. Your next step is to reconnect with purpose.',
  },
  {
    id: 'explorer',
    name: 'The Explorer',
    category: 'expansion',
    vector: { aether: 3, fire: 2, air: 1, water: 5, earth: 1 },
    dominantForce: 'water',
    growthEdge: 'Ground (Earth)',
    growthDimension: 'earth',
    shadowTrigger: 'Scattered',
    corePattern: 'Orients toward novelty, experience, and discovery.',
    coreTension: 'Freedom vs grounding',
    primaryBlock: 'Avoidance of commitment.',
    whenAligned: 'Engages life fully and expands through experience.',
    whenMisaligned: 'Becomes scattered, ungrounded, and directionless.',
    rebalancingPath: 'Increase Earth (Execution); stabilize Aether (Intention).',
    practiceOrientation: 'Anchor exploration in a path. Commit to a direction for a period. Balance novelty with structure.',
    aiOutput: 'You are operating as The Explorer. You are expanding—but not anchoring. Your next step is to choose a direction and commit.',
  },
  {
    id: 'healer',
    name: 'The Healer',
    category: 'expansion',
    vector: { aether: 3, fire: 1, air: 2, water: 5, earth: 3 },
    dominantForce: 'water',
    growthEdge: 'Boundaries (Fire)',
    growthDimension: 'fire',
    shadowTrigger: 'Overgiving',
    corePattern: 'Orients toward restoring balance, supporting others, and emotional repair.',
    coreTension: 'Care for others vs self-preservation',
    primaryBlock: 'Difficulty setting boundaries.',
    whenAligned: 'Creates safety, restoration, and emotional depth.',
    whenMisaligned: 'Overextends, absorbs others\' energy, or neglects self.',
    rebalancingPath: 'Increase Fire (Volition); strengthen Aether (Intention).',
    practiceOrientation: 'Set clear energetic boundaries. Prioritize self-restoration. Choose where to give energy.',
    aiOutput: 'You are operating as The Healer. You are giving—but may be depleting. Your next step is to restore yourself.',
  },
  {
    id: 'teacher',
    name: 'The Teacher',
    category: 'expansion',
    vector: { aether: 3, fire: 3, air: 5, water: 3, earth: 3 },
    dominantForce: 'air',
    growthEdge: 'Embody (Earth)',
    growthDimension: 'earth',
    shadowTrigger: 'Preaching',
    corePattern: 'Orients toward sharing knowledge, guiding understanding, and transmitting insight.',
    coreTension: 'Knowledge vs embodiment',
    primaryBlock: 'Over-intellectualization.',
    whenAligned: 'Clarifies complex ideas and elevates others\' understanding.',
    whenMisaligned: 'Becomes preachy, rigid, or disconnected from real application.',
    rebalancingPath: 'Increase Earth (Execution); deepen Water (Emotion).',
    practiceOrientation: 'Teach from lived experience. Ground insights in application. Stay connected to audience.',
    aiOutput: 'You are operating as The Teacher. You are explaining—but not always embodying. Your next step is to ground your knowledge.',
  },
  {
    id: 'performer',
    name: 'The Performer',
    category: 'expansion',
    vector: { aether: 2, fire: 5, air: 1, water: 3, earth: 3 },
    dominantForce: 'fire',
    growthEdge: 'Authenticity (Aether)',
    growthDimension: 'aether',
    shadowTrigger: 'Validation seeking',
    corePattern: 'Orients toward expression, visibility, and impact through presence.',
    coreTension: 'Expression vs approval',
    primaryBlock: 'Dependence on external validation.',
    whenAligned: 'Captivates, energizes, and inspires through expression.',
    whenMisaligned: 'Seeks validation, over-performs, or loses authenticity.',
    rebalancingPath: 'Strengthen Air (Cognition); anchor Aether (Intention).',
    practiceOrientation: 'Express without needing approval. Clarify message before delivery. Return to authentic signal.',
    aiOutput: 'You are operating as The Performer. You are expressing—but may be seeking validation. Your next step is to anchor in authenticity.',
  },
  {
    id: 'analyst',
    name: 'The Analyst',
    category: 'expansion',
    vector: { aether: 1, fire: 1, air: 5, water: 1, earth: 3 },
    dominantForce: 'air',
    growthEdge: 'Act (Fire)',
    growthDimension: 'fire',
    shadowTrigger: 'Paralysis',
    corePattern: 'Orients toward understanding systems, patterns, and underlying logic.',
    coreTension: 'Insight vs action',
    primaryBlock: 'Paralysis through analysis.',
    whenAligned: 'Sees truth, patterns, and structure with clarity.',
    whenMisaligned: 'Becomes detached, overly analytical, and inactive.',
    rebalancingPath: 'Increase Fire (Volition); reconnect Water (Emotion).',
    practiceOrientation: 'Act on insight quickly. Balance logic with intuition. Move before full certainty.',
    aiOutput: 'You are operating as The Analyst. You see clearly—but are not moving. Your next step is to act.',
  },
  {
    id: 'rebel',
    name: 'The Rebel',
    category: 'expansion',
    vector: { aether: 2, fire: 5, air: 3, water: 1, earth: 1 },
    dominantForce: 'fire',
    growthEdge: 'Build (Earth)',
    growthDimension: 'earth',
    shadowTrigger: 'Destruction',
    corePattern: 'Orients toward disruption, challenging norms, and breaking constraints.',
    coreTension: 'Disruption vs creation',
    primaryBlock: 'Lack of constructive direction.',
    whenAligned: 'Breaks outdated systems and creates space for new possibilities.',
    whenMisaligned: 'Destroys without direction or rebels without purpose.',
    rebalancingPath: 'Increase Earth (Execution); clarify Aether (Intention).',
    practiceOrientation: 'Channel disruption into creation. Build what you believe should exist. Ground rebellion in purpose.',
    aiOutput: 'You are operating as The Rebel. You are breaking—but not yet building. Your next step is to create what replaces what you disrupt.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SHADOW (7)
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'overthinker',
    name: 'The Overthinker',
    category: 'shadow',
    vector: { aether: 1, fire: 1, air: 5, water: 1, earth: 1 },
    dominantForce: 'air',
    growthEdge: 'Act (Fire)',
    growthDimension: 'fire',
    shadowTrigger: 'Fear of wrong move',
    corePattern: 'Excess cognition without action or emotional grounding.',
    coreTension: 'Clarity vs paralysis',
    primaryBlock: 'Fear of being wrong.',
    whenAligned: 'When integrated, becomes the Analyst or Strategist in balance.',
    whenMisaligned: 'Loops endlessly in thought without movement.',
    rebalancingPath: 'Increase Fire (Volition); ground Earth (Execution); reconnect Water (Emotion).',
    practiceOrientation: 'Make decisions with incomplete data. Take immediate small action. Feel before thinking further.',
    aiOutput: 'You are operating as The Overthinker. You are processing—but not moving. Your next step is to act before certainty.',
    whenPrimary: 'Your mind is one of your greatest strengths — it sees deeply, holds complexity, and works tirelessly to understand. Right now, that strength has become a loop. The thinking is not the problem. The absence of action alongside it is. You do not need to think less. You need to move before the thinking finishes. One small, imperfect action will teach you more than another week of analysis.',
  },
  {
    id: 'drifter',
    name: 'The Drifter',
    category: 'shadow',
    vector: { aether: 1, fire: 1, air: 1, water: 3, earth: 1 },
    dominantForce: 'water',
    growthEdge: 'Direction (Aether)',
    growthDimension: 'aether',
    shadowTrigger: 'Avoidance',
    corePattern: 'Lack of direction, intention, and grounding.',
    coreTension: 'Freedom vs direction',
    primaryBlock: 'Avoidance of responsibility.',
    whenAligned: 'When integrated, becomes the Explorer with direction.',
    whenMisaligned: 'Moves aimlessly without commitment or clarity.',
    rebalancingPath: 'Increase Aether (Intention); ground Earth (Execution).',
    practiceOrientation: 'Define a clear intention. Commit to a path for a set time. Reduce passive consumption.',
    aiOutput: 'You are operating as The Drifter. You are moving—but without direction. Your next step is to choose a path.',
    whenPrimary: 'There is nothing broken about where you are. Seasons of drift often follow seasons of intensity — the system is recalibrating, not failing. But drift becomes dangerous when it lasts too long. The antidote is not a grand plan. It is one honest answer to one honest question: what do I actually want right now? Not forever. Just right now. Start there.',
  },
  {
    id: 'controller',
    name: 'The Controller',
    category: 'shadow',
    vector: { aether: 3, fire: 5, air: 3, water: 1, earth: 5 },
    dominantForce: 'fire/earth',
    growthEdge: 'Trust (Water)',
    growthDimension: 'water',
    shadowTrigger: 'Fear of uncertainty',
    corePattern: 'Excess control, rigidity, and force over outcomes.',
    coreTension: 'Control vs trust',
    primaryBlock: 'Fear of uncertainty.',
    whenAligned: 'When integrated, becomes the Leader with emotional intelligence.',
    whenMisaligned: 'Forces outcomes, resists flow, and creates tension.',
    rebalancingPath: 'Increase Water (Emotion); soften Fire (Volition).',
    practiceOrientation: 'Release need for control. Trust process and others. Allow variability.',
    aiOutput: 'You are operating as The Controller. You are forcing—but not flowing. Your next step is to trust.',
    whenPrimary: 'Your ability to hold things together is real — people depend on it, and you have earned the competence that makes control feel necessary. But control is also a fortress. And fortresses keep things out as much as they keep things in. The part of you that needs to feel, to trust, to let others carry weight — that part is not weakness. It is the next frontier of your strength. Soften one degree. See what arrives.',
  },
  {
    id: 'avoider',
    name: 'The Avoider',
    category: 'shadow',
    vector: { aether: 1, fire: 1, air: 3, water: 3, earth: 1 },
    dominantForce: 'passive',
    growthEdge: 'Act (Fire)',
    growthDimension: 'fire',
    shadowTrigger: 'Discomfort',
    corePattern: 'Avoidance of action, discomfort, and responsibility.',
    coreTension: 'Comfort vs growth',
    primaryBlock: 'Fear of discomfort.',
    whenAligned: 'When integrated, becomes the Builder or Operator in motion.',
    whenMisaligned: 'Delays, distracts, and escapes from necessary action.',
    rebalancingPath: 'Increase Fire (Volition); ground Earth (Execution).',
    practiceOrientation: 'Take one uncomfortable action daily. Reduce avoidance loops. Move before motivation.',
    aiOutput: 'You are operating as The Avoider. You are delaying what matters. Your next step is to act now.',
    whenPrimary: 'You are not lazy. You are not broken. Avoidance is a protection strategy — and at some point, it made sense. But the things you are protecting yourself from have likely changed, while the avoidance has not. The discomfort you are avoiding is smaller than you think. And on the other side of one uncomfortable action is proof that you can move. You do not need to overhaul your life. You need to do one hard thing today.',
  },
  {
    id: 'people-pleaser',
    name: 'The People-Pleaser',
    category: 'shadow',
    vector: { aether: 1, fire: 1, air: 1, water: 5, earth: 3 },
    dominantForce: 'water',
    growthEdge: 'Truth (Aether)',
    growthDimension: 'aether',
    shadowTrigger: 'Rejection fear',
    corePattern: 'Prioritizes others\' needs at the expense of self.',
    coreTension: 'Connection vs authenticity',
    primaryBlock: 'Fear of rejection.',
    whenAligned: 'When integrated, becomes the Connector or Healer in balance.',
    whenMisaligned: 'Loses self, avoids conflict, and seeks approval.',
    rebalancingPath: 'Increase Aether (Intention); activate Fire (Volition).',
    practiceOrientation: 'Speak truth clearly. Set boundaries. Prioritize self-alignment.',
    aiOutput: 'You are operating as The People-Pleaser. You are connecting—but losing yourself. Your next step is to stand in your truth.',
    whenPrimary: 'Your care for others is genuine — it is one of your deepest gifts. The problem is not that you give. It is that you give from a place that forgets you exist. Somewhere along the way, being loved became conditional on being useful, and your own needs went underground. They are still there. The first act of courage is not a grand declaration. It is saying "no" to one small thing you would normally say "yes" to — and noticing that the world does not end.',
  },
  {
    id: 'perfectionist',
    name: 'The Perfectionist',
    category: 'shadow',
    vector: { aether: 2, fire: 3, air: 5, water: 1, earth: 3 },
    dominantForce: 'air',
    growthEdge: 'Ship (Earth)',
    growthDimension: 'earth',
    shadowTrigger: 'Fear of imperfection',
    corePattern: 'Obsessive refinement preventing completion.',
    coreTension: 'Perfection vs completion',
    primaryBlock: 'Fear of imperfection.',
    whenAligned: 'When integrated, becomes the Refiner in balance.',
    whenMisaligned: 'Never finishes, constantly adjusts, delays output.',
    rebalancingPath: 'Stabilize Water (Emotion); increase Earth (Execution).',
    practiceOrientation: 'Ship at 80%. Embrace imperfection. Focus on completion.',
    aiOutput: 'You are operating as The Perfectionist. You are refining—but not finishing. Your next step is to complete.',
    whenPrimary: 'Your standards are not the problem — they reflect a genuine commitment to quality and truth. What has happened is that the standards have become a wall between you and the world. Nothing feels ready. Nothing feels good enough. And so nothing ships, nothing lands, nothing gets to live in its imperfect form. The work now is not lowering your standards. It is learning that completion is its own form of excellence. Ship one thing at 80%. Watch it survive. That is the lesson.',
  },
  {
    id: 'burnout',
    name: 'The Burnout',
    category: 'shadow',
    vector: { aether: 0, fire: 0, air: 0, water: 0, earth: 0 },
    dominantForce: 'collapse',
    growthEdge: 'Restore (Water/Aether)',
    growthDimension: null,
    shadowTrigger: 'Overextension',
    corePattern: 'Depleted system from overextension and imbalance.',
    coreTension: 'Output vs sustainability',
    primaryBlock: 'Ignoring internal limits.',
    whenAligned: 'When integrated, returns to balance across all forces.',
    whenMisaligned: 'Exhausted, disengaged, disconnected from purpose.',
    rebalancingPath: 'Restore Water (Emotion); reconnect Aether (Intention); slowly rebuild Fire (Volition).',
    practiceOrientation: 'Rest intentionally. Reconnect with purpose. Reduce output temporarily.',
    aiOutput: 'You are operating as The Burnout. You are depleted. Your next step is to restore, not push.',
    whenPrimary: 'This is not a failure state. This is what happens when someone gives more than they have for longer than they should. You did not arrive here through weakness — you arrived here through sustained effort that exceeded what any system can sustain. The instinct to push through is strong. Resist it. The most productive thing you can do right now is stop producing. Rest is not a reward for finishing. It is a prerequisite for beginning again. Restore Water and Aether first. Everything else rebuilds from there.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TRANSCENDENT (7)
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'alchemist',
    name: 'The Alchemist',
    category: 'transcendent',
    vector: { aether: 5, fire: 3, air: 5, water: 3, earth: 3 },
    dominantForce: 'aether/air',
    growthEdge: 'Embody (Earth)',
    growthDimension: 'earth',
    shadowTrigger: 'Intellectualizing',
    corePattern: 'Transforms challenge, tension, and shadow into growth and power.',
    coreTension: 'Transformation vs bypassing',
    primaryBlock: 'Staying in insight instead of integration.',
    whenAligned: 'Sees every experience as material for transformation.',
    whenMisaligned: 'Over-intellectualizes transformation without embodiment.',
    rebalancingPath: 'Ground Earth (Execution); embody Water (Emotion).',
    practiceOrientation: 'Apply insights immediately. Work directly with discomfort. Turn lessons into action.',
    aiOutput: 'You are operating as The Alchemist. You are transforming—but must embody. Your next step is to live what you see.',
  },
  {
    id: 'sage',
    name: 'The Sage',
    category: 'transcendent',
    vector: { aether: 5, fire: 1, air: 5, water: 3, earth: 3 },
    dominantForce: 'aether',
    growthEdge: 'Act (Fire)',
    growthDimension: 'fire',
    shadowTrigger: 'Detachment',
    corePattern: 'Embodies deep understanding, perspective, and clarity.',
    coreTension: 'Wisdom vs participation',
    primaryBlock: 'Reluctance to engage.',
    whenAligned: 'Sees clearly and offers grounded wisdom.',
    whenMisaligned: 'Becomes detached, passive, or overly observational.',
    rebalancingPath: 'Activate Fire (Volition); engage Earth (Execution).',
    practiceOrientation: 'Share wisdom actively. Engage with life, not just observe. Take aligned action.',
    aiOutput: 'You are operating as The Sage. You see clearly—but must engage. Your next step is to act from wisdom.',
  },
  {
    id: 'orchestrator',
    name: 'The Orchestrator',
    category: 'transcendent',
    vector: { aether: 5, fire: 5, air: 5, water: 3, earth: 5 },
    dominantForce: 'integrated',
    growthEdge: 'Delegate (Water)',
    growthDimension: 'water',
    shadowTrigger: 'Overholding',
    corePattern: 'Coordinates people, systems, and energy into aligned movement.',
    coreTension: 'Coordination vs control',
    primaryBlock: 'Carrying too much.',
    whenAligned: 'Brings complex systems into harmony and execution.',
    whenMisaligned: 'Over-manages or becomes overwhelmed by complexity.',
    rebalancingPath: 'Stabilize Water (Emotion); delegate through Earth (Execution).',
    practiceOrientation: 'Trust others in the system. Focus on alignment, not control. Simplify complexity.',
    aiOutput: 'You are operating as The Orchestrator. You are coordinating—but may be overholding. Your next step is to trust the system.',
  },
  {
    id: 'harmonizer',
    name: 'The Harmonizer',
    category: 'transcendent',
    vector: { aether: 3, fire: 3, air: 3, water: 5, earth: 3 },
    dominantForce: 'water',
    growthEdge: 'Truth (Fire)',
    growthDimension: 'fire',
    shadowTrigger: 'Avoid conflict',
    corePattern: 'Balances internal and external systems into coherence and peace.',
    coreTension: 'Harmony vs truth',
    primaryBlock: 'Avoidance of disruption.',
    whenAligned: 'Creates deep harmony within self and environment.',
    whenMisaligned: 'Avoids necessary tension or conflict.',
    rebalancingPath: 'Activate Fire (Volition); clarify Air (Cognition).',
    practiceOrientation: 'Allow necessary conflict. Balance peace with truth. Stay grounded in alignment.',
    aiOutput: 'You are operating as The Harmonizer. You are balancing—but may be avoiding truth. Your next step is to allow tension.',
  },
  {
    id: 'magician',
    name: 'The Magician',
    category: 'transcendent',
    vector: { aether: 5, fire: 5, air: 5, water: 3, earth: 3 },
    dominantForce: 'aether',
    growthEdge: 'Ground (Earth)',
    growthDimension: 'earth',
    shadowTrigger: 'Illusion',
    corePattern: 'Channels intention into reality with precision and awareness.',
    coreTension: 'Creation vs illusion',
    primaryBlock: 'Disconnection from reality constraints.',
    whenAligned: 'Brings vision into reality with seeming effortlessness.',
    whenMisaligned: 'Becomes manipulative or disconnected from grounded reality.',
    rebalancingPath: 'Ground Earth (Execution); stabilize Water (Emotion).',
    practiceOrientation: 'Anchor vision in reality. Align intention with action. Create responsibly.',
    aiOutput: 'You are operating as The Magician. You are creating—but must stay grounded. Your next step is to anchor your power.',
  },
  {
    id: 'embodied-self',
    name: 'The Embodied Self',
    category: 'transcendent',
    vector: { aether: 5, fire: 3, air: 3, water: 3, earth: 5 },
    dominantForce: 'balanced',
    growthEdge: 'Sustain',
    growthDimension: null,
    shadowTrigger: 'Drift',
    corePattern: 'Lives in alignment across all dimensions consistently.',
    coreTension: 'Integration vs drift',
    primaryBlock: 'Loss of presence.',
    whenAligned: 'Fully present, grounded, and integrated in daily life.',
    whenMisaligned: 'Subtle drift into imbalance across dimensions.',
    rebalancingPath: 'Re-center Aether (Intention); rebalance all forces.',
    practiceOrientation: 'Daily awareness practices. Maintain alignment through action. Stay present.',
    aiOutput: 'You are operating as The Embodied Self. You are aligned. Your next step is to sustain and deepen.',
  },
  {
    id: 'unified-being',
    name: 'The Unified Being',
    category: 'transcendent',
    vector: { aether: 5, fire: 5, air: 5, water: 5, earth: 5 },
    dominantForce: 'total',
    growthEdge: 'Evolve',
    growthDimension: null,
    shadowTrigger: 'Attachment',
    corePattern: 'Full integration of all forces into a coherent, evolving whole.',
    coreTension: 'Unity vs fragmentation',
    primaryBlock: 'Attachment to identity.',
    whenAligned: 'Moves fluidly across all states, responding to life with total awareness.',
    whenMisaligned: 'Temporary fragmentation only.',
    rebalancingPath: 'Return to awareness; release fixed identity.',
    practiceOrientation: 'Flow between archetypes. Stay unattached to form. Serve the whole.',
    aiOutput: 'You are operating as The Unified Being. You are whole. Your next step is continual evolution without attachment.',
  },
]

// ── Lookup helpers ───────────────────────────────────────────────────────────

export function getArchetypeById(id: string): Archetype | undefined {
  return ARCHETYPES.find(a => a.id === id)
}

export function getArchetypesByCategory(category: ArchetypeCategory): Archetype[] {
  return ARCHETYPES.filter(a => a.category === category)
}

/** Shadow-category archetypes only — used by shadow matching logic. */
export const SHADOW_ARCHETYPES: Archetype[] = ARCHETYPES.filter(a => a.category === 'shadow')

/**
 * Get the appropriate mirror statement for a primary archetype.
 * Shadow-category archetypes use `whenPrimary` (compassion register).
 * All others use the standard `aiOutput`.
 */
export function getMirrorStatement(archetype: Archetype): string {
  if (archetype.category === 'shadow' && archetype.whenPrimary) {
    return archetype.whenPrimary
  }
  return archetype.aiOutput
}

/**
 * Get the short-form mirror (always the canonical `aiOutput`).
 * Used for previews, cards, and share images where brevity matters.
 */
export function getShortMirror(archetype: Archetype): string {
  return archetype.aiOutput
}
