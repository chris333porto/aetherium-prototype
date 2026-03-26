// AETHERIUM VISUAL MAPPING ENGINE

import {
  DimensionKey,
  DimensionScore,
  MandalaVisualState,
  DimensionState
} from "./schema";

import { VISUAL_CONFIG } from "./constants";

// ----------------------------
// INTERNAL HELPERS
// ----------------------------

function thicknessFromScore(score: number): number {
  // maps 0–100 -> 0.2–1.0
  return 0.2 + (score / 100) * 0.8;
}

function opacityFromState(state: DimensionState): number {
  switch (state) {
    case "blocked":
      return 0.2;
    case "underactive":
      return 0.35;
    case "balanced":
      return 0.6;
    case "strong":
      return 0.8;
    case "dominant":
      return 1.0;
    default:
      return VISUAL_CONFIG.BASE_OPACITY;
  }
}

function glowFromState(state: DimensionState): number {
  switch (state) {
    case "blocked":
      return 0.1;
    case "underactive":
      return 0.25;
    case "balanced":
      return 0.5;
    case "strong":
      return 0.75;
    case "dominant":
      return 1.0;
    default:
      return 0.2;
  }
}

function pulseFromState(state: DimensionState): number {
  switch (state) {
    case "dominant":
      return VISUAL_CONFIG.PULSE_INTENSITY.strong;
    case "strong":
      return VISUAL_CONFIG.PULSE_INTENSITY.subtle;
    default:
      return VISUAL_CONFIG.PULSE_INTENSITY.none;
  }
}

function fragmentedFromState(state: DimensionState): boolean {
  return state === "blocked";
}

// ----------------------------
// BUILD VISUAL STATE
// ----------------------------

export function buildMandalaRingVisual(
  dimension: DimensionScore
): MandalaVisualState {
  return {
    key: dimension.key,
    thickness: thicknessFromScore(dimension.score),
    opacity: opacityFromState(dimension.state),
    glow: glowFromState(dimension.state),
    pulse: pulseFromState(dimension.state),
    fragmented: fragmentedFromState(dimension.state)
  };
}

// ----------------------------
// BUILD FULL MANDALA
// ----------------------------

export function buildMandalaVisualState(
  dimensions: Record<DimensionKey, DimensionScore>
): Record<DimensionKey, MandalaVisualState> {
  return {
    aether: buildMandalaRingVisual(dimensions.aether),
    fire: buildMandalaRingVisual(dimensions.fire),
    air: buildMandalaRingVisual(dimensions.air),
    water: buildMandalaRingVisual(dimensions.water),
    earth: buildMandalaRingVisual(dimensions.earth)
  };
}

// ----------------------------
// OPTIONAL UI HELPERS
// ----------------------------

export function getActiveRingCount(score: number): 1 | 2 | 3 {
  if (score <= 33) return 1;
  if (score <= 66) return 2;
  return 3;
}

export function getRingDisplayState(score: number, state: DimensionState) {
  return {
    activeRings: getActiveRingCount(score),
    fragmented: state === "blocked",
    dimmed: state === "underactive",
    stable: state === "balanced",
    energized: state === "strong" || state === "dominant",
    pulsing: state === "dominant"
  };
}