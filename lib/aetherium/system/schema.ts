// AETHERIUM CORE SCHEMA
// Defines the structure of the intelligence system

// ----------------------------
// CORE TYPES
// ----------------------------

export type DimensionKey =
  | "aether"
  | "fire"
  | "air"
  | "water"
  | "earth";

export type ForceKey =
  | "intention"
  | "volition"
  | "cognition"
  | "emotion"
  | "action";

export type DimensionBucket = "low" | "medium" | "high";

export type DimensionState =
  | "blocked"
  | "underactive"
  | "balanced"
  | "strong"
  | "dominant";

export type PathwayStage =
  | "fragmented"
  | "emerging"
  | "integrated"
  | "advanced"
  | "unified";

export type ArchetypeCategory =
  | "shadow"
  | "emerging"
  | "core"
  | "integrated"
  | "transcendent";

// ----------------------------
// DIMENSIONS
// ----------------------------

export interface DimensionDefinition {
  key: DimensionKey;
  force: ForceKey;
  label: string;
  elementLabel: string;
  forceLabel: string;
  color: string;
  order: number;
  description: string;
}

// ----------------------------
// SCORING
// ----------------------------

export interface DimensionScore {
  key: DimensionKey;
  score: number; // 0–100
  bucket: DimensionBucket;
  state: DimensionState;
}

// ----------------------------
// ARCHETYPES
// ----------------------------

export interface ArchetypeDefinition {
  key: string;
  name: string;
  shortDescription: string;
  dominantDimensions: DimensionKey[];
  deficientDimensions: DimensionKey[];
  signature: Record<DimensionKey, number>;
  shadowDescription: string;
  growthDirection: string;
}

export interface ArchetypeMatch {
  archetypeKey: string;
  score: number;
  rank: number;
}

export interface ExtendedArchetypeDefinition extends ArchetypeDefinition {
  category: ArchetypeCategory;
  dominantDimension?: DimensionKey | "multi" | "none";
  deficientDimension?: DimensionKey | "multi" | "none";
  coreTension?: string;
  primaryBlock?: string;
  practiceOrientation?: string[];
  avatarTone?: string;
  aiOutput?: string;
}

// ----------------------------
// COHERENCE
// ----------------------------

export interface CoherenceResult {
  score: number;
  stage: PathwayStage;
  strongestDimension: DimensionKey;
  weakestDimension: DimensionKey;
  variance: number;
}

// ----------------------------
// PRACTICES
// ----------------------------

export interface PracticeRecommendation {
  id: string;
  title: string;
  dimension: DimensionKey;
  description: string;
  stage?: PathwayStage;
  archetypeKeys?: string[];
}

// ----------------------------
// USER STATE (FINAL OUTPUT)
// ----------------------------

export interface UserState {
  dimensions: Record<DimensionKey, DimensionScore>;
  coherence: CoherenceResult;
  primaryArchetype: ArchetypeMatch | null;
  secondaryArchetype: ArchetypeMatch | null;
  shadowArchetype: ArchetypeMatch | null;
  topMatches: ArchetypeMatch[];
  recommendedPractices: PracticeRecommendation[];
}

// ----------------------------
// VISUAL STATE (MANDALA)
// ----------------------------

export interface MandalaVisualState {
  key: DimensionKey;
  thickness: number;
  opacity: number;
  glow: number;
  pulse: number;
  fragmented: boolean;
}