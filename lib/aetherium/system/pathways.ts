// AETHERIUM PATHWAY ENGINE
// Converts user state + archetype pattern into directional growth guidance

import {
  ArchetypeMatch,
  CoherenceResult,
  DimensionKey,
  DimensionScore,
  PathwayStage,
} from "./schema";
import { getArchetypeByKey } from "./archetypes";

// ----------------------------
// TYPES
// ----------------------------

export interface GrowthEdge {
  dimension: DimensionKey;
  currentScore: number;
  message: string;
}

export interface PathwayTransition {
  from: PathwayStage;
  to: PathwayStage;
  description: string;
}

export interface PathwayResult {
  currentStage: PathwayStage;
  nextStage: PathwayStage | null;
  strongestDimension: DimensionKey;
  weakestDimension: DimensionKey;
  growthEdge: GrowthEdge;
  transition: PathwayTransition | null;
  suggestedArchetypeShift: string | null;
}

// ----------------------------
// STAGE ORDER
// ----------------------------

export const STAGE_ORDER: PathwayStage[] = [
  "fragmented",
  "emerging",
  "integrated",
  "advanced",
  "unified",
];

// ----------------------------
// STAGE HELPERS
// ----------------------------

export function derivePathwayStage(coherenceScore: number): PathwayStage {
  if (coherenceScore <= 20) return "fragmented";
  if (coherenceScore <= 40) return "emerging";
  if (coherenceScore <= 60) return "integrated";
  if (coherenceScore <= 80) return "advanced";
  return "unified";
}

export function getNextStage(stage: PathwayStage): PathwayStage | null {
  const currentIndex = STAGE_ORDER.indexOf(stage);
  if (currentIndex === -1 || currentIndex === STAGE_ORDER.length - 1) {
    return null;
  }
  return STAGE_ORDER[currentIndex + 1];
}

// ----------------------------
// GROWTH EDGE LOGIC
// ----------------------------

export function deriveGrowthEdge(
  dimensions: Record<DimensionKey, DimensionScore>,
  weakestDimension: DimensionKey
): GrowthEdge {
  const score = dimensions[weakestDimension].score;

  const messages: Record<DimensionKey, string> = {
    aether:
      "Clarify your purpose. Your next movement comes from stronger direction and meaning.",
    fire:
      "Activate your will. Your next movement comes from decisive action and commitment.",
    air:
      "Refine your thinking. Your next movement comes from clearer interpretation and perspective.",
    water:
      "Reconnect with feeling. Your next movement comes from emotional honesty and regulation.",
    earth:
      "Ground your energy. Your next movement comes from consistency, embodiment, and follow-through.",
  };

  return {
    dimension: weakestDimension,
    currentScore: score,
    message: messages[weakestDimension],
  };
}

// ----------------------------
// TRANSITION COPY
// ----------------------------

export function describeTransition(
  from: PathwayStage,
  to: PathwayStage
): PathwayTransition | null {
  const map: Record<string, string> = {
    "fragmented:emerging":
      "Move from instability into basic coherence by stabilizing your weakest dimension.",
    "emerging:integrated":
      "Shift from inconsistent potential into a more reliable internal structure.",
    "integrated:advanced":
      "Move from balance into mastery by strengthening your most important growth edge.",
    "advanced:unified":
      "Shift from strong alignment into fully embodied coherence across the whole system.",
  };

  const key = `${from}:${to}`;
  if (!map[key]) return null;

  return {
    from,
    to,
    description: map[key],
  };
}

// ----------------------------
// ARCHETYPE SHIFT LOGIC
// ----------------------------

export function deriveSuggestedArchetypeShift(
  topMatches: ArchetypeMatch[]
): string | null {
  const primary = topMatches[0];
  const secondary = topMatches[1];

  if (!primary) return null;

  const primaryDef = getArchetypeByKey(primary.archetypeKey);
  const secondaryDef = secondary
    ? getArchetypeByKey(secondary.archetypeKey)
    : null;

  if (!primaryDef) return null;

  if (secondaryDef) {
    return `You are currently most aligned with ${primaryDef.name}, with ${secondaryDef.name} emerging as a nearby developmental pattern.`;
  }

  return `You are currently most aligned with ${primaryDef.name}.`;
}

// ----------------------------
// MAIN PATHWAY BUILDER
// ----------------------------

export function buildPathwayResult(
  dimensions: Record<DimensionKey, DimensionScore>,
  coherence: CoherenceResult,
  topMatches: ArchetypeMatch[]
): PathwayResult {
  const currentStage =
    coherence.stage || derivePathwayStage(coherence.score);

  const nextStage = getNextStage(currentStage);

  const growthEdge = deriveGrowthEdge(
    dimensions,
    coherence.weakestDimension
  );

  const transition = nextStage
    ? describeTransition(currentStage, nextStage)
    : null;

  const suggestedArchetypeShift =
    deriveSuggestedArchetypeShift(topMatches);

  return {
    currentStage,
    nextStage,
    strongestDimension: coherence.strongestDimension,
    weakestDimension: coherence.weakestDimension,
    growthEdge,
    transition,
    suggestedArchetypeShift,
  };
}