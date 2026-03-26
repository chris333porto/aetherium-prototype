// AETHERIUM SCORING ENGINE

import {
  DimensionKey,
  DimensionScore,
  DimensionBucket,
  DimensionState
} from "./schema";

import { SCORE_CONFIG } from "./constants";

// ----------------------------
// BUCKET LOGIC
// ----------------------------

export function getBucket(score: number): DimensionBucket {
  if (score <= 33) return "low";
  if (score <= 66) return "medium";
  return "high";
}

// ----------------------------
// STATE LOGIC
// ----------------------------

export function getState(score: number): DimensionState {
  if (score <= 20) return "blocked";
  if (score <= 40) return "underactive";
  if (score <= 60) return "balanced";
  if (score <= 80) return "strong";
  return "dominant";
}

// ----------------------------
// BUILD DIMENSION SCORE
// ----------------------------

export function buildDimensionScore(
  key: DimensionKey,
  score: number
): DimensionScore {
  return {
    key,
    score,
    bucket: getBucket(score),
    state: getState(score)
  };
}

// ----------------------------
// NORMALIZE INPUT
// ----------------------------

export function normalizeScore(score: number): number {
  return Math.max(
    SCORE_CONFIG.MIN,
    Math.min(SCORE_CONFIG.MAX, score)
  );
}

// ----------------------------
// BUILD ALL DIMENSIONS
// ----------------------------

export function buildDimensionScores(
  rawScores: Record<DimensionKey, number>
): Record<DimensionKey, DimensionScore> {
  const result: Record<DimensionKey, DimensionScore> = {} as any;

  (Object.keys(rawScores) as DimensionKey[]).forEach((key) => {
    const normalized = normalizeScore(rawScores[key]);
    result[key] = buildDimensionScore(key, normalized);
  });

  return result;
}

// ----------------------------
// COHERENCE
// ----------------------------

export function computeCoherence(
  scores: Record<DimensionKey, DimensionScore>
) {
  const values = Object.values(scores).map((d) => d.score);

  const max = Math.max(...values);
  const min = Math.min(...values);
  const spread = max - min;

  // coherence is about how internally consistent / balanced the system is
  // lower spread = higher coherence
  const coherence = 100 - spread;

  const avg =
    values.reduce((sum, v) => sum + v, 0) / values.length;

  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
    values.length;

  return {
    score: Math.max(0, Math.min(100, coherence)),
    variance,
  };
}

// ----------------------------
// STRONGEST / WEAKEST
// ----------------------------

export function getStrongestDimension(
  scores: Record<DimensionKey, DimensionScore>
): DimensionKey {
  return Object.values(scores).sort((a, b) => b.score - a.score)[0].key;
}

export function getWeakestDimension(
  scores: Record<DimensionKey, DimensionScore>
): DimensionKey {
  return Object.values(scores).sort((a, b) => a.score - b.score)[0].key;
}