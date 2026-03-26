// AETHERIUM ARCHETYPE ENGINE
// Full 32-archetype starter dataset + matching helpers

import {
  ArchetypeMatch,
  DimensionKey,
  DimensionScore,
  ExtendedArchetypeDefinition,
} from "./schema";

// -----------------------------------
// SIGNATURE HELPERS
// -----------------------------------

type Signature = Record<DimensionKey, number>;

function sig(
  aether: number,
  fire: number,
  air: number,
  water: number,
  earth: number
): Signature {
  return { aether, fire, air, water, earth };
}

const VLOW = 10;
const LOW = 25;
const MED = 50;
const HIGH = 75;
const VHIGH = 90;

// -----------------------------------
// ARCHETYPES (32)
// -----------------------------------


export const ARCHETYPES: ExtendedArchetypeDefinition[] = [
  // SHADOW
  {
    key: "fragmented",
    name: "Fragmented",
    category: "shadow",
    shortDescription: "Scattered across dimensions with little internal coherence.",
    dominantDimensions: [],
    deficientDimensions: ["aether", "fire", "air", "water", "earth"],
    dominantDimension: "none",
    deficientDimension: "multi",
    signature: sig(VLOW, LOW, LOW, LOW, VLOW),
    shadowDescription: "Diffuse identity, weak center, and unstable direction.",
    growthDirection: "Stabilize one dimension and rebuild coherence from there.",
    coreTension: "Disorder vs integration",
    primaryBlock: "No stable center of gravity",
    practiceOrientation: [
      "Reduce overwhelm",
      "Stabilize daily rhythm",
      "Rebuild one reliable habit",
    ],
    avatarTone: "fractured, unstable, dispersed",
    aiOutput:
      "You are in a fragmented state. The goal is not self-optimization yet. The goal is stabilization and reconnection.",
  },
  {
    key: "drifter",
    name: "Drifter",
    category: "shadow",
    shortDescription: "Moves without clear direction, commitment, or grounding.",
    dominantDimensions: ["water"],
    deficientDimensions: ["aether", "earth"],
    dominantDimension: "water",
    deficientDimension: "multi",
    signature: sig(VLOW, LOW, LOW, MED, VLOW),
    shadowDescription: "Passes through life without choosing a path.",
    growthDirection: "Clarify Aether and strengthen Earth.",
    coreTension: "Freedom vs direction",
    primaryBlock: "Avoidance of commitment",
    practiceOrientation: [
      "Choose one direction",
      "Create structure",
      "Reduce passive drifting",
    ],
    avatarTone: "wandering, untethered, soft",
    aiOutput:
      "You are moving, but without a defined path. Your next step is to choose direction and build grounding.",
  },
  {
    key: "reactor",
    name: "Reactor",
    category: "shadow",
    shortDescription: "Acts from emotional charge instead of clarity.",
    dominantDimensions: ["fire", "water"],
    deficientDimensions: ["air"],
    dominantDimension: "multi",
    deficientDimension: "air",
    signature: sig(LOW, HIGH, LOW, HIGH, LOW),
    shadowDescription: "Triggered action, inconsistent regulation, volatile cycles.",
    growthDirection: "Strengthen Air and stabilize Earth.",
    coreTension: "Impulse vs clarity",
    primaryBlock: "No pause between feeling and action",
    practiceOrientation: [
      "Pause before response",
      "Name the emotion",
      "Create decision space",
    ],
    avatarTone: "charged, volatile, immediate",
    aiOutput:
      "You are reacting faster than you are processing. Your next step is to restore clarity before movement.",
  },
  {
    key: "suppressor",
    name: "Suppressor",
    category: "shadow",
    shortDescription: "Pushes down emotion, need, or truth to maintain control.",
    dominantDimensions: ["air", "earth"],
    deficientDimensions: ["water"],
    dominantDimension: "multi",
    deficientDimension: "water",
    signature: sig(LOW, MED, HIGH, VLOW, MED),
    shadowDescription: "Controlled outside, disconnected inside.",
    growthDirection: "Reconnect Water and soften control.",
    coreTension: "Control vs feeling",
    primaryBlock: "Fear of vulnerability",
    practiceOrientation: [
      "Name what you feel",
      "Allow softness",
      "Practice honest expression",
    ],
    avatarTone: "compressed, contained, armored",
    aiOutput:
      "You are holding yourself together by suppressing what is real. Your next step is to reconnect with feeling safely.",
  },
  {
    key: "overthinker",
    name: "Overthinker",
    category: "shadow",
    shortDescription: "High cognition with low movement and weak embodiment.",
    dominantDimensions: ["air"],
    deficientDimensions: ["fire", "earth", "water"],
    dominantDimension: "air",
    deficientDimension: "multi",
    signature: sig(MED, LOW, VHIGH, LOW, LOW),
    shadowDescription: "Loops in analysis and loses momentum.",
    growthDirection: "Activate Fire and Earth.",
    coreTension: "Insight vs action",
    primaryBlock: "Fear of being wrong",
    practiceOrientation: [
      "Act before certainty",
      "Shorten analysis loops",
      "Choose and move",
    ],
    avatarTone: "tight, cerebral, looping",
    aiOutput:
      "You understand a lot, but you are not moving. Your next step is action before certainty.",
  },
  {
    key: "escapist",
    name: "Escapist",
    category: "shadow",
    shortDescription: "Avoids reality, discomfort, or responsibility through distraction.",
    dominantDimensions: ["water"],
    deficientDimensions: ["fire", "earth"],
    dominantDimension: "water",
    deficientDimension: "multi",
    signature: sig(LOW, VLOW, LOW, HIGH, VLOW),
    shadowDescription: "Uses comfort, fantasy, or numbing to avoid what matters.",
    growthDirection: "Activate Fire and build Earth.",
    coreTension: "Relief vs responsibility",
    primaryBlock: "Fear of discomfort",
    practiceOrientation: [
      "Reduce avoidance loops",
      "Face one hard thing daily",
      "Build small accountability",
    ],
    avatarTone: "soft-focus, evasive, fading",
    aiOutput:
      "You are avoiding what matters most. Your next step is to re-enter reality with one deliberate action.",
  },
  {
    key: "performer",
    name: "Performer",
    category: "shadow",
    shortDescription: "Shapes identity through visibility and external response.",
    dominantDimensions: ["fire"],
    deficientDimensions: ["aether"],
    dominantDimension: "fire",
    deficientDimension: "aether",
    signature: sig(LOW, HIGH, MED, MED, LOW),
    shadowDescription: "Relies on reaction, attention, or approval for identity.",
    growthDirection: "Anchor in Aether and inner signal.",
    coreTension: "Expression vs approval",
    primaryBlock: "Dependence on external validation",
    practiceOrientation: [
      "Express without audience dependence",
      "Reconnect with authentic signal",
      "Create privately",
    ],
    avatarTone: "magnetic, exposed, reactive",
    aiOutput:
      "You are expressing, but too much of your signal is shaped by response. Your next step is to return to authentic expression.",
  },
  {
    key: "dependent",
    name: "Dependent",
    category: "shadow",
    shortDescription: "Looks outside the self for safety, direction, or permission.",
    dominantDimensions: ["water"],
    deficientDimensions: ["aether", "fire"],
    dominantDimension: "water",
    deficientDimension: "multi",
    signature: sig(VLOW, LOW, LOW, HIGH, LOW),
    shadowDescription: "Defers agency and over-relies on others for movement.",
    growthDirection: "Strengthen Aether and Fire.",
    coreTension: "Attachment vs autonomy",
    primaryBlock: "Fear of standing alone",
    practiceOrientation: [
      "Make independent decisions",
      "Strengthen internal authority",
      "Reduce permission-seeking",
    ],
    avatarTone: "attached, seeking, uncertain",
    aiOutput:
      "You are leaning too heavily on external support for direction. Your next step is to reclaim internal authority.",
  },

  // EMERGING
  {
    key: "initiator",
    name: "Initiator",
    category: "emerging",
    shortDescription: "Begins movement quickly and activates possibility.",
    dominantDimensions: ["fire"],
    deficientDimensions: ["earth"],
    dominantDimension: "fire",
    deficientDimension: "earth",
    signature: sig(MED, HIGH, MED, LOW, LOW),
    shadowDescription: "Starts strongly but struggles to sustain.",
    growthDirection: "Stabilize Earth and strengthen Aether.",
    coreTension: "Start vs sustain",
    primaryBlock: "Inconsistent follow-through",
    practiceOrientation: [
      "Finish what you begin",
      "Build process after ignition",
      "Anchor action in routine",
    ],
    avatarTone: "activating, bright, forward",
    aiOutput:
      "You are strong at initiation. Your next step is to convert ignition into consistency.",
  },
  {
    key: "striver",
    name: "Striver",
    category: "emerging",
    shortDescription: "Pushes hard toward progress, achievement, and advancement.",
    dominantDimensions: ["fire", "earth"],
    deficientDimensions: ["water"],
    dominantDimension: "multi",
    deficientDimension: "water",
    signature: sig(MED, HIGH, MED, LOW, HIGH),
    shadowDescription: "Can become effort-heavy, disconnected, and never satisfied.",
    growthDirection: "Restore Water and reconnect purpose.",
    coreTension: "Drive vs wholeness",
    primaryBlock: "Identity tied to effort",
    practiceOrientation: [
      "Rest without guilt",
      "Reconnect with meaning",
      "Soften constant striving",
    ],
    avatarTone: "driven, kinetic, forceful",
    aiOutput:
      "You are moving with force, but not enough softness. Your next step is to reconnect effort with meaning.",
  },
  {
    key: "analyst",
    name: "Analyst",
    category: "emerging",
    shortDescription: "Sees systems, patterns, and logic with precision.",
    dominantDimensions: ["air"],
    deficientDimensions: ["water"],
    dominantDimension: "air",
    deficientDimension: "water",
    signature: sig(MED, LOW, HIGH, LOW, MED),
    shadowDescription: "Can detach from human feeling and action.",
    growthDirection: "Increase Water and Fire.",
    coreTension: "Understanding vs embodiment",
    primaryBlock: "Living in abstraction",
    practiceOrientation: [
      "Act on insight quickly",
      "Include emotion in evaluation",
      "Balance thought with experience",
    ],
    avatarTone: "precise, cool, intelligent",
    aiOutput:
      "You see patterns clearly. Your next step is to bring your insight into lived action.",
  },
  {
    key: "strategist",
    name: "Strategist",
    category: "emerging",
    shortDescription: "Maps direction, sequence, and leverage effectively.",
    dominantDimensions: ["aether", "air"],
    deficientDimensions: ["earth"],
    dominantDimension: "air",
    deficientDimension: "earth",
    signature: sig(HIGH, MED, HIGH, LOW, LOW),
    shadowDescription: "Can stay in planning mode and avoid execution.",
    growthDirection: "Activate Earth and strengthen Fire.",
    coreTension: "Plan vs move",
    primaryBlock: "Fear of committing to one path",
    practiceOrientation: [
      "Move before perfect readiness",
      "Translate plan into one next action",
      "Reduce planning loops",
    ],
    avatarTone: "clear, directional, tactical",
    aiOutput:
      "You understand the path. Your next step is to step onto it.",
  },
  {
    key: "empath",
    name: "Empath",
    category: "emerging",
    shortDescription: "Feels others deeply and detects subtle emotional reality.",
    dominantDimensions: ["water"],
    deficientDimensions: ["air", "fire"],
    dominantDimension: "water",
    deficientDimension: "multi",
    signature: sig(LOW, LOW, LOW, HIGH, MED),
    shadowDescription: "Can become porous, overwhelmed, or unboundaried.",
    growthDirection: "Strengthen Air and Fire.",
    coreTension: "Sensitivity vs self-loss",
    primaryBlock: "Absorbing what is not yours",
    practiceOrientation: [
      "Set energetic boundaries",
      "Differentiate self from others",
      "Convert feeling into clarity",
    ],
    avatarTone: "sensitive, luminous, receptive",
    aiOutput:
      "You feel deeply. Your next step is not to feel less, but to contain and direct what you feel.",
  },
  {
    key: "connector",
    name: "Connector",
    category: "emerging",
    shortDescription: "Creates relationship, bridges people, and builds social coherence.",
    dominantDimensions: ["water", "air"],
    deficientDimensions: ["aether"],
    dominantDimension: "multi",
    deficientDimension: "aether",
    signature: sig(LOW, MED, MED, HIGH, MED),
    shadowDescription: "Can over-connect without clear direction or self-reference.",
    growthDirection: "Strengthen Aether.",
    coreTension: "Connection vs inner direction",
    primaryBlock: "Too much external orientation",
    practiceOrientation: [
      "Return to inner direction",
      "Connect with purpose",
      "Reduce diffuse relating",
    ],
    avatarTone: "social, linking, connective",
    aiOutput:
      "You build connection well. Your next step is to align those connections with your deeper direction.",
  },
  {
    key: "operator",
    name: "Operator",
    category: "emerging",
    shortDescription: "Executes systems reliably and keeps things moving.",
    dominantDimensions: ["earth"],
    deficientDimensions: ["aether"],
    dominantDimension: "earth",
    deficientDimension: "aether",
    signature: sig(LOW, MED, MED, LOW, HIGH),
    shadowDescription: "Can become mechanical or disconnected from purpose.",
    growthDirection: "Increase Aether and Water.",
    coreTension: "Execution vs meaning",
    primaryBlock: "Lack of purpose connection",
    practiceOrientation: [
      "Reconnect tasks to meaning",
      "Zoom out regularly",
      "Restore purpose before optimizing",
    ],
    avatarTone: "steady, precise, functional",
    aiOutput:
      "You execute well. Your next step is to reconnect execution to purpose.",
  },
  {
    key: "builder",
    name: "Builder",
    category: "emerging",
    shortDescription: "Turns ideas into form through sustained effort.",
    dominantDimensions: ["fire", "earth"],
    deficientDimensions: ["aether"],
    dominantDimension: "earth",
    deficientDimension: "aether",
    signature: sig(LOW, HIGH, MED, LOW, HIGH),
    shadowDescription: "Can build hard in the wrong direction.",
    growthDirection: "Clarify Aether.",
    coreTension: "Construction vs alignment",
    primaryBlock: "Working without a clear why",
    practiceOrientation: [
      "Clarify purpose before scaling effort",
      "Cut misaligned work",
      "Build only what matters",
    ],
    avatarTone: "grounded, productive, strong",
    aiOutput:
      "You can build powerfully. Your next step is to ensure you are building the right thing.",
  },

  // CORE
  {
    key: "warrior",
    name: "Warrior",
    category: "core",
    shortDescription: "Commits fully, moves decisively, and meets resistance directly.",
    dominantDimensions: ["fire", "earth"],
    deficientDimensions: ["water"],
    dominantDimension: "fire",
    deficientDimension: "water",
    signature: sig(MED, HIGH, MED, LOW, HIGH),
    shadowDescription: "Can become combative, rigid, or disconnected from softness.",
    growthDirection: "Restore Water and deepen Aether.",
    coreTension: "Strength vs tenderness",
    primaryBlock: "Armor as identity",
    practiceOrientation: [
      "Stay powerful without hardening",
      "Allow emotional access",
      "Lead from integrated strength",
    ],
    avatarTone: "strong, direct, armored",
    aiOutput:
      "You move with strength. Your next step is to integrate power with softness.",
  },
  {
    key: "architect",
    name: "Architect",
    category: "core",
    shortDescription: "Designs coherent systems that can actually hold reality.",
    dominantDimensions: ["aether", "air", "earth"],
    deficientDimensions: ["water"],
    dominantDimension: "multi",
    deficientDimension: "water",
    signature: sig(HIGH, MED, HIGH, LOW, HIGH),
    shadowDescription: "Can become over-structured or emotionally disconnected.",
    growthDirection: "Increase Water and relational depth.",
    coreTension: "Structure vs humanity",
    primaryBlock: "Over-prioritizing system over feeling",
    practiceOrientation: [
      "Make systems more human",
      "Include emotional reality in design",
      "Balance elegance with empathy",
    ],
    avatarTone: "designed, stable, intelligent",
    aiOutput:
      "You build structure well. Your next step is to make your structure more alive and human.",
  },
  {
    key: "scholar",
    name: "Scholar",
    category: "core",
    shortDescription: "Devotes energy to understanding, learning, and transmitting truth.",
    dominantDimensions: ["air", "aether"],
    deficientDimensions: ["earth"],
    dominantDimension: "air",
    deficientDimension: "earth",
    signature: sig(MED, LOW, HIGH, MED, LOW),
    shadowDescription: "Can remain in study without integration or application.",
    growthDirection: "Activate Earth and Fire.",
    coreTension: "Knowledge vs embodiment",
    primaryBlock: "Attachment to understanding over action",
    practiceOrientation: [
      "Apply what you learn",
      "Teach from embodiment",
      "Turn insight into disciplined practice",
    ],
    avatarTone: "luminous, studied, thoughtful",
    aiOutput:
      "You understand deeply. Your next step is to live what you know.",
  },
  {
    key: "visionary",
    name: "Visionary",
    category: "core",
    shortDescription: "Sees future possibility and emerging potential clearly.",
    dominantDimensions: ["aether"],
    deficientDimensions: ["earth"],
    dominantDimension: "aether",
    deficientDimension: "earth",
    signature: sig(HIGH, MED, MED, MED, LOW),
    shadowDescription: "Can live in possibility without realization.",
    growthDirection: "Ground into Earth and strengthen Fire.",
    coreTension: "Possibility vs realization",
    primaryBlock: "Avoidance of constraints and embodiment",
    practiceOrientation: [
      "Choose one vision",
      "Ground it into action",
      "Accept reality constraints as part of creation",
    ],
    avatarTone: "radiant, expansive, future-facing",
    aiOutput:
      "You see what could be. Your next step is to bring one vision fully into reality.",
  },
  {
    key: "guide",
    name: "Guide",
    category: "core",
    shortDescription: "Helps others move through complexity with clarity and steadiness.",
    dominantDimensions: ["water", "air"],
    deficientDimensions: ["fire"],
    dominantDimension: "multi",
    deficientDimension: "fire",
    signature: sig(MED, LOW, HIGH, HIGH, MED),
    shadowDescription: "Can support others while avoiding personal movement.",
    growthDirection: "Activate Fire in your own life.",
    coreTension: "Support vs self-activation",
    primaryBlock: "Helping others instead of moving yourself",
    practiceOrientation: [
      "Apply your guidance to yourself",
      "Take direct action",
      "Stop hiding in wisdom",
    ],
    avatarTone: "steady, warm, luminous",
    aiOutput:
      "You guide others well. Your next step is to turn that same guidance inward and move.",
  },
  {
    key: "guardian",
    name: "Guardian",
    category: "core",
    shortDescription: "Protects what matters and creates stable containers.",
    dominantDimensions: ["water", "earth"],
    deficientDimensions: ["air"],
    dominantDimension: "multi",
    deficientDimension: "air",
    signature: sig(MED, MED, LOW, HIGH, HIGH),
    shadowDescription: "Can resist change and over-protect the familiar.",
    growthDirection: "Strengthen Air and allow evolution.",
    coreTension: "Protection vs growth",
    primaryBlock: "Fear of disruption",
    practiceOrientation: [
      "Question what you are protecting",
      "Allow adaptive change",
      "Balance care with evolution",
    ],
    avatarTone: "protective, grounded, loyal",
    aiOutput:
      "You hold what matters. Your next step is to allow what you hold to evolve.",
  },
  {
    key: "alchemist",
    name: "Alchemist",
    category: "core",
    shortDescription: "Transforms difficulty, shadow, and friction into growth.",
    dominantDimensions: ["aether", "fire", "air"],
    deficientDimensions: [],
    dominantDimension: "multi",
    deficientDimension: "none",
    signature: sig(HIGH, MED, HIGH, MED, MED),
    shadowDescription: "Can become fascinated with transformation without embodiment.",
    growthDirection: "Increase Earth and Water integration.",
    coreTension: "Insight vs incarnation",
    primaryBlock: "Transformation staying conceptual",
    practiceOrientation: [
      "Embody what you discover",
      "Integrate through action",
      "Work with real friction directly",
    ],
    avatarTone: "transmutational, luminous, catalytic",
    aiOutput:
      "You can transform a great deal. Your next step is to embody the transformation fully.",
  },
  {
    key: "harmonizer",
    name: "Harmonizer",
    category: "core",
    shortDescription: "Brings balance, coherence, and attunement across the system.",
    dominantDimensions: ["water", "air"],
    deficientDimensions: ["fire"],
    dominantDimension: "multi",
    deficientDimension: "fire",
    signature: sig(MED, LOW, MED, HIGH, MED),
    shadowDescription: "Can prioritize peace over truth or action.",
    growthDirection: "Increase Fire and tolerate productive tension.",
    coreTension: "Harmony vs necessary friction",
    primaryBlock: "Avoidance of disruption",
    practiceOrientation: [
      "Allow useful tension",
      "Speak truth more directly",
      "Move without waiting for perfect peace",
    ],
    avatarTone: "balanced, calm, coherent",
    aiOutput:
      "You create harmony well. Your next step is to allow truth and action inside that harmony.",
  },

  // INTEGRATED
  {
    key: "leader",
    name: "Leader",
    category: "integrated",
    shortDescription: "Directs energy, makes decisions, and aligns movement.",
    dominantDimensions: ["aether", "fire"],
    deficientDimensions: [],
    dominantDimension: "multi",
    deficientDimension: "none",
    signature: sig(HIGH, HIGH, MED, MED, HIGH),
    shadowDescription: "Can become controlling if disconnected from Water.",
    growthDirection: "Lead with more listening and attunement.",
    coreTension: "Direction vs domination",
    primaryBlock: "Over-reliance on force",
    practiceOrientation: [
      "Listen before directing",
      "Lead through alignment",
      "Stay connected to people, not just outcomes",
    ],
    avatarTone: "clear, strong, aligned",
    aiOutput:
      "You are ready to direct meaningful movement. Your next step is to lead through alignment rather than force.",
  },
  {
    key: "healer",
    name: "Healer",
    category: "integrated",
    shortDescription: "Restores, repairs, and supports deeper wholeness.",
    dominantDimensions: ["water", "aether"],
    deficientDimensions: [],
    dominantDimension: "water",
    deficientDimension: "none",
    signature: sig(MED, MED, MED, HIGH, MED),
    shadowDescription: "Can overgive or hold too much for others.",
    growthDirection: "Protect energy and maintain self-alignment.",
    coreTension: "Service vs depletion",
    primaryBlock: "Taking responsibility for everyone else's healing",
    practiceOrientation: [
      "Serve without self-erasure",
      "Strengthen energetic boundaries",
      "Restore yourself as you restore others",
    ],
    avatarTone: "restorative, warm, radiant",
    aiOutput:
      "You bring healing energy. Your next step is to ensure your healing includes yourself.",
  },
  {
    key: "sage",
    name: "Sage",
    category: "integrated",
    shortDescription: "Embodies perspective, depth, and clear understanding.",
    dominantDimensions: ["aether", "air"],
    deficientDimensions: ["fire"],
    dominantDimension: "multi",
    deficientDimension: "fire",
    signature: sig(HIGH, LOW, HIGH, MED, MED),
    shadowDescription: "Can become detached and overly observational.",
    growthDirection: "Increase direct engagement and embodied action.",
    coreTension: "Wisdom vs participation",
    primaryBlock: "Observing instead of entering",
    practiceOrientation: [
      "Act from wisdom",
      "Enter life, don’t just interpret it",
      "Bring insight into lived motion",
    ],
    avatarTone: "clear, spacious, wise",
    aiOutput:
      "You see deeply. Your next step is to participate more fully from that wisdom.",
  },
  {
    key: "creator",
    name: "Creator",
    category: "integrated",
    shortDescription: "Brings authentic inner signal into expressive form.",
    dominantDimensions: ["aether", "water", "fire"],
    deficientDimensions: [],
    dominantDimension: "multi",
    deficientDimension: "none",
    signature: sig(HIGH, MED, MED, HIGH, MED),
    shadowDescription: "Can become diffuse if Earth is neglected.",
    growthDirection: "Increase Earth and completion energy.",
    coreTension: "Expression vs completion",
    primaryBlock: "Too much inspiration, not enough finishing",
    practiceOrientation: [
      "Finish one creation",
      "Give form to signal",
      "Make the invisible visible",
    ],
    avatarTone: "expressive, alive, generative",
    aiOutput:
      "You are meant to create. Your next step is to complete what wants to come through you.",
  },
  {
    key: "integrator",
    name: "Integrator",
    category: "integrated",
    shortDescription: "Brings the whole system into coherent alignment.",
    dominantDimensions: ["aether", "fire", "air", "water", "earth"],
    deficientDimensions: [],
    dominantDimension: "multi",
    deficientDimension: "none",
    signature: sig(HIGH, HIGH, HIGH, HIGH, HIGH),
    shadowDescription: "Can plateau if no new edge is engaged.",
    growthDirection: "Move from integration into contribution.",
    coreTension: "Wholeness vs stagnation",
    primaryBlock: "Comfort inside balance",
    practiceOrientation: [
      "Take on a bigger edge",
      "Serve beyond the self",
      "Continue refining through challenge",
    ],
    avatarTone: "whole, coherent, stable",
    aiOutput:
      "You are deeply integrated. Your next step is to direct that coherence toward contribution.",
  },

  // TRANSCENDENT
  {
    key: "seeker",
    name: "Seeker",
    category: "transcendent",
    shortDescription: "Lives in ongoing inquiry, orientation, and meaningful pursuit.",
    dominantDimensions: ["aether", "water"],
    deficientDimensions: [],
    dominantDimension: "multi",
    deficientDimension: "none",
    signature: sig(HIGH, MED, MED, HIGH, MED),
    shadowDescription: "Can wander if Earth is neglected.",
    growthDirection: "Ground the search in embodied path.",
    coreTension: "Inquiry vs arrival",
    primaryBlock: "Attachment to endless searching",
    practiceOrientation: [
      "Let inquiry become path",
      "Choose deeper embodiment",
      "Stop searching for permission",
    ],
    avatarTone: "pilgrim, open, meaningful",
    aiOutput:
      "You are on the path. Your next step is to let the search become embodied direction.",
  },
  {
    key: "orchestrator",
    name: "Orchestrator",
    category: "transcendent",
    shortDescription: "Coordinates people, systems, and energies into aligned movement.",
    dominantDimensions: ["aether", "fire", "air", "earth"],
    deficientDimensions: [],
    dominantDimension: "multi",
    deficientDimension: "none",
    signature: sig(HIGH, HIGH, HIGH, MED, HIGH),
    shadowDescription: "Can over-hold complexity or move into control.",
    growthDirection: "Deepen Water and trust the system more.",
    coreTension: "Coordination vs control",
    primaryBlock: "Taking on too much personally",
    practiceOrientation: [
      "Delegate and trust",
      "Align rather than force",
      "Hold complexity without gripping it",
    ],
    avatarTone: "systemic, luminous, coordinating",
    aiOutput:
      "You can orchestrate large-scale movement. Your next step is to coordinate with more trust and less control.",
  },
  {
    key: "avatar",
    name: "Avatar",
    category: "transcendent",
    shortDescription: "Embodies a visible, integrated expression of the full system.",
    dominantDimensions: ["aether", "fire", "air", "water", "earth"],
    deficientDimensions: [],
    dominantDimension: "multi",
    deficientDimension: "none",
    signature: sig(VHIGH, HIGH, HIGH, HIGH, HIGH),
    shadowDescription: "Can become identified with the role instead of the essence.",
    growthDirection: "Remain fluid and unattached to form.",
    coreTension: "Embodiment vs identity attachment",
    primaryBlock: "Mistaking expression for essence",
    practiceOrientation: [
      "Stay unattached to identity",
      "Keep evolving the form",
      "Let the signal stay alive",
    ],
    avatarTone: "iconic, radiant, embodied",
    aiOutput:
      "You are expressing a highly integrated state. Your next step is to stay fluid, not fixed inside the form.",
  },
];

// -----------------------------------
// MATCHING HELPERS
// -----------------------------------

function scoreDifference(userScore: number, targetScore: number): number {
  return Math.abs(userScore - targetScore);
}

function calculateMatchScore(
  user: Record<DimensionKey, DimensionScore>,
  archetype: ExtendedArchetypeDefinition
): number {
  const totalDifference =
    scoreDifference(user.aether.score, archetype.signature.aether) +
    scoreDifference(user.fire.score, archetype.signature.fire) +
    scoreDifference(user.air.score, archetype.signature.air) +
    scoreDifference(user.water.score, archetype.signature.water) +
    scoreDifference(user.earth.score, archetype.signature.earth);

  const avgDifference = totalDifference / 5;
  return Math.max(0, 100 - avgDifference);
}

export function matchArchetypes(
  user: Record<DimensionKey, DimensionScore>
): ArchetypeMatch[] {
  return ARCHETYPES
    .map((archetype) => ({
      archetypeKey: archetype.key,
      score: Number(calculateMatchScore(user, archetype).toFixed(2)),
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score)
    .map((match, index) => ({
      ...match,
      rank: index + 1,
    }));
}

export function getPrimaryArchetype(matches: ArchetypeMatch[]) {
  return matches[0] || null;
}

export function getSecondaryArchetype(matches: ArchetypeMatch[]) {
  return matches[1] || null;
}

export function getShadowArchetype(matches: ArchetypeMatch[]) {
  const shadowKeys = new Set(
    ARCHETYPES.filter((a) => a.category === "shadow").map((a) => a.key)
  );

  const bestShadow = matches.find((m) => shadowKeys.has(m.archetypeKey));
  return bestShadow || matches[matches.length - 1] || null;
}

export function getArchetypeByKey(key: string) {
  return ARCHETYPES.find((a) => a.key === key) || null;
}

export function getTopArchetypeDefinitions(
  matches: ArchetypeMatch[],
  count = 5
) {
  return matches
    .slice(0, count)
    .map((m) => ({
      match: m,
      archetype: getArchetypeByKey(m.archetypeKey),
    }))
    .filter((x) => x.archetype);
}