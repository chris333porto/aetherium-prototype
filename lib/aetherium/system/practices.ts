// AETHERIUM PRACTICE ENGINE
// Maps weak dimensions, stages, and archetypes into actionable practices

import {
  DimensionKey,
  PathwayStage,
  PracticeRecommendation,
} from "./schema";

// ----------------------------
// PRACTICE LIBRARY
// ----------------------------

export const PRACTICES: PracticeRecommendation[] = [
  // AETHER
  {
    id: "aether-clarify-vision",
    title: "Clarify Vision",
    dimension: "aether",
    description:
      "Write a one-sentence statement of what matters most right now.",
  },
  {
    id: "aether-daily-orientation",
    title: "Daily Orientation",
    dimension: "aether",
    description:
      "Begin the day by naming your highest priority and why it matters.",
  },
  {
    id: "aether-purpose-review",
    title: "Purpose Review",
    dimension: "aether",
    description:
      "Review whether your current efforts actually align with your deeper direction.",
  },

  // FIRE
  {
    id: "fire-single-decision",
    title: "Single Decisive Action",
    dimension: "fire",
    description:
      "Make one clear, non-reversible decision today instead of waiting for certainty.",
  },
  {
    id: "fire-activation-block",
    title: "Activation Block",
    dimension: "fire",
    description:
      "Spend 20 focused minutes acting on the most avoided task.",
  },
  {
    id: "fire-commitment-practice",
    title: "Commitment Practice",
    dimension: "fire",
    description:
      "Choose one path and commit to it for a defined period without re-evaluating constantly.",
  },

  // AIR
  {
    id: "air-clarity-journal",
    title: "Clarity Journal",
    dimension: "air",
    description:
      "Write what is true, what is assumed, and what remains unclear.",
  },
  {
    id: "air-thinking-window",
    title: "Bounded Thinking Window",
    dimension: "air",
    description:
      "Limit analysis to a defined time block, then move into action.",
  },
  {
    id: "air-pattern-review",
    title: "Pattern Review",
    dimension: "air",
    description:
      "Review recent decisions and identify recurring thought patterns.",
  },

  // WATER
  {
    id: "water-emotional-checkin",
    title: "Emotional Check-In",
    dimension: "water",
    description:
      "Pause and name what you are actually feeling without trying to fix it.",
  },
  {
    id: "water-boundary-practice",
    title: "Boundary Practice",
    dimension: "water",
    description:
      "Notice where you are carrying what is not yours and set one boundary.",
  },
  {
    id: "water-regulation-breath",
    title: "Regulation Breath",
    dimension: "water",
    description:
      "Use slow breathing to settle the nervous system before reacting.",
  },

  // EARTH
  {
    id: "earth-daily-rhythm",
    title: "Daily Rhythm",
    dimension: "earth",
    description:
      "Create a simple repeatable rhythm for sleep, movement, work, and recovery.",
  },
  {
    id: "earth-finish-one-thing",
    title: "Finish One Thing",
    dimension: "earth",
    description:
      "Complete one open loop before starting anything new.",
  },
  {
    id: "earth-embodiment-walk",
    title: "Embodiment Walk",
    dimension: "earth",
    description:
      "Take a deliberate walk without devices to ground your attention in the body.",
  },
];

// ----------------------------
// DIMENSION PRACTICE LOOKUP
// ----------------------------

export function getPracticesForDimension(
  dimension: DimensionKey,
  limit = 3
): PracticeRecommendation[] {
  return PRACTICES.filter((p) => p.dimension === dimension).slice(0, limit);
}

// ----------------------------
// STAGE MODIFIERS
// ----------------------------

export function getStagePracticeMessage(stage: PathwayStage): string {
  switch (stage) {
    case "fragmented":
      return "Prioritize stabilization over optimization.";
    case "emerging":
      return "Focus on consistency and reinforcing what is beginning to work.";
    case "integrated":
  return `Stabilize your system by strengthening your weakest edge. 
Progress now comes from reliability, consistency, and embodied follow-through.`;
    case "advanced":
      return "Move from competence toward precision and mastery.";
    case "unified":
      return "Maintain coherence while serving beyond the self.";
    default:
      return "Take the next steady step.";
  }
}

// ----------------------------
// ARCHETYPE-SPECIFIC HINTS
// ----------------------------

export function getArchetypePracticeHint(archetypeKey?: string | null): string | null {
  if (!archetypeKey) return null;

  const hints: Record<string, string> = {
    overthinker: "Act before certainty.",
    drifter: "Choose one direction and commit.",
    reactor: "Pause before response.",
    strategist: "Move from planning into execution.",
    builder: "Reconnect effort to purpose.",
    empath: "Contain what you feel before carrying others.",
    warrior: "Stay strong without hardening.",
    creator: "Finish one expression fully.",
    leader: "Lead with alignment, not force.",
    integrator: "Take on the next edge, not just comfort.",
  };

  return hints[archetypeKey] || null;
}

// ----------------------------
// MAIN RECOMMENDER
// ----------------------------

export function recommendPractices(
  weakestDimension: DimensionKey,
  stage: PathwayStage,
  primaryArchetypeKey?: string | null,
  limit = 3
): PracticeRecommendation[] {
  const base = getPracticesForDimension(weakestDimension, limit);

  // For now, return the dimension-based practices.
  // Archetype / stage-specific ranking can be refined later.
  return base;
}