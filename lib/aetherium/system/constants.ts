// AETHERIUM CONSTANTS
// This defines the fixed ontology of the system

import { DimensionDefinition } from "./schema";

// ----------------------------
// DIMENSIONS (CANONICAL ORDER)
// ----------------------------

export const DIMENSIONS: DimensionDefinition[] = [
  {
    key: "aether",
    force: "intention",
    label: "Aether",
    elementLabel: "Aether",
    forceLabel: "Intention",
    color: "#7B61FF", // Purple
    order: 1,
    description: "Your deepest purpose, vision, and why."
  },
  {
    key: "fire",
    force: "volition",
    label: "Fire",
    elementLabel: "Fire",
    forceLabel: "Volition",
    color: "#FF4D4D", // Red
    order: 2,
    description: "Your willpower, drive, and ability to initiate."
  },
  {
    key: "air",
    force: "cognition",
    label: "Air",
    elementLabel: "Air",
    forceLabel: "Cognition",
    color: "#FF9F1C", // Orange
    order: 3,
    description: "How you think, analyze, and process."
  },
  {
    key: "water",
    force: "emotion",
    label: "Water",
    elementLabel: "Water",
    forceLabel: "Emotion",
    color: "#3A86FF", // Blue
    order: 4,
    description: "How you feel, connect, and regulate emotion."
  },
  {
    key: "earth",
    force: "action",
    label: "Earth",
    elementLabel: "Earth",
    forceLabel: "Action",
    color: "#2DC653", // Green
    order: 5,
    description: "What you consistently do and bring into reality."
  }
];

// ----------------------------
// LOOKUP MAP (FAST ACCESS)
// ----------------------------

export const DIMENSION_MAP = Object.fromEntries(
  DIMENSIONS.map((d) => [d.key, d])
);

// ----------------------------
// SCORE CONFIG
// ----------------------------

export const SCORE_CONFIG = {
  MIN: 0,
  MAX: 100,

  BUCKETS: {
    low: [0, 33],
    medium: [34, 66],
    high: [67, 100]
  },

  STATES: {
    blocked: [0, 20],
    underactive: [21, 40],
    balanced: [41, 60],
    strong: [61, 80],
    dominant: [81, 100]
  }
};

// ----------------------------
// PATHWAY STAGES
// ----------------------------

export const PATHWAY_STAGES = [
  "fragmented",
  "emerging",
  "integrated",
  "advanced",
  "unified"
] as const;

// ----------------------------
// VISUAL DEFAULTS
// ----------------------------

export const VISUAL_CONFIG = {
  BASE_OPACITY: 0.15,
  ACTIVE_OPACITY: 0.8,
  GLOW_INTENSITY: {
    low: 0.2,
    medium: 0.5,
    high: 0.9
  },
  PULSE_INTENSITY: {
    none: 0,
    subtle: 0.3,
    strong: 0.6
  }
};