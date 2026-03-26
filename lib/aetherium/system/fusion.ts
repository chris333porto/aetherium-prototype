// AETHERIUM FUSION ENGINE
// Combines dimensions + coherence + archetypes + pathway + practices
// into one readable identity profile

import {
  ArchetypeMatch,
  DimensionKey,
  DimensionScore,
  PathwayStage,
} from "./schema";
import {
  getArchetypeByKey,
} from "./archetypes";
import {
  PathwayResult,
  buildPathwayResult,
} from "./pathways";
import {
  recommendPractices,
  getStagePracticeMessage,
  getArchetypePracticeHint,
} from "./practices";
import { computeCoherence, getStrongestDimension, getWeakestDimension } from "./scoring";

// ----------------------------
// TYPES
// ----------------------------

export type ExpressionQuality =
  | "blocked"
  | "inconsistent"
  | "expressing"
  | "magnetic";

export function deriveExpressionQuality(
  dimensions: Record<DimensionKey, DimensionScore>
): ExpressionQuality {
  const values = Object.values(dimensions).map((d) => d.score);

  const min = Math.min(...values);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

  if (min < 30) return "blocked";
  if (avg < 50) return "inconsistent";
  if (avg < 75) return "expressing";
  return "magnetic";
}

export interface IdentityProfile {
  stage: PathwayStage;
  coherenceScore: number;
  expressionQuality: ExpressionQuality;

  primaryArchetype: ArchetypeMatch | null;
  secondaryArchetype: ArchetypeMatch | null;
  shadowArchetype: ArchetypeMatch | null;

  strongestDimension: DimensionKey;
  weakestDimension: DimensionKey;

  tension: string;
  growthVector: string;

  pathway: PathwayResult;
  practiceMessage: string;
  archetypeHint: string | null;
}

// ----------------------------
// HELPERS
// ----------------------------

export function deriveTension(
  strongestDimension: DimensionKey,
  weakestDimension: DimensionKey
): string {
  return `Your strongest energy is currently ${strongestDimension}, while your weakest edge is ${weakestDimension}. The work is to bring those two into better relationship.`;
}

export function deriveGrowthVector(
  pathway: PathwayResult
): string {
  if (!pathway.nextStage) {
    return "Maintain coherence and continue refining expression through contribution.";
  }

  return `Your next movement is from ${pathway.currentStage} toward ${pathway.nextStage}, primarily by strengthening ${pathway.weakestDimension}.`;
}

// ----------------------------
// MAIN FUSION BUILDER
// ----------------------------

export function buildIdentityProfile(
  dimensions: Record<DimensionKey, DimensionScore>,
  topMatches: ArchetypeMatch[]
): IdentityProfile {
  const coherenceBase = computeCoherence(dimensions);

  const strongestDimension = getStrongestDimension(dimensions);
  const weakestDimension = getWeakestDimension(dimensions);

  const coherence = {
    score: coherenceBase.score,
    variance: coherenceBase.variance,
    stage:
      coherenceBase.score <= 20
        ? "fragmented"
        : coherenceBase.score <= 40
        ? "emerging"
        : coherenceBase.score <= 60
        ? "integrated"
        : coherenceBase.score <= 80
        ? "advanced"
        : "unified",
    strongestDimension,
    weakestDimension,
  } as const;

  const primaryArchetype = topMatches[0] || null;
  const secondaryArchetype = topMatches[1] || null;

  // use first shadow-category archetype if present in ranked list
  const shadowArchetype =
    topMatches.find((match) => {
      const def = getArchetypeByKey(match.archetypeKey);
      return def?.category === "shadow";
    }) || null;

  const pathway = buildPathwayResult(dimensions, coherence, topMatches);

  const expressionQuality = deriveExpressionQuality(dimensions);

  const practiceMessage = getStagePracticeMessage(coherence.stage);
  const archetypeHint = getArchetypePracticeHint(primaryArchetype?.archetypeKey);

  return {
    stage: coherence.stage,
    coherenceScore: coherence.score,
    expressionQuality,

    primaryArchetype,
    secondaryArchetype,
    shadowArchetype,

    strongestDimension,
    weakestDimension,

    tension: deriveTension(strongestDimension, weakestDimension),
    growthVector: deriveGrowthVector(pathway),

    pathway,
    practiceMessage,
    archetypeHint,
  };
}