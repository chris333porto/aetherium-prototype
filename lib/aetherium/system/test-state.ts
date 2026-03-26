// AETHERIUM ENGINE TEST HARNESS
// Quick sanity check to verify the full system is working

import {
  DimensionKey,
  DimensionScore,
} from "./schema";
import { matchArchetypes } from "./archetypes";
import { buildIdentityProfile } from "./fusion";

// ----------------------------
// MOCK INPUT (simulate user)
// ----------------------------

const mockDimensions: Record<DimensionKey, DimensionScore> = {
  aether: {
    key: "aether",
    score: 82,
    bucket: "high",
    state: "strong",
  },
  fire: {
    key: "fire",
    score: 68,
    bucket: "high",
    state: "balanced",
  },
  air: {
    key: "air",
    score: 74,
    bucket: "high",
    state: "strong",
  },
  water: {
    key: "water",
    score: 42,
    bucket: "medium",
    state: "underactive",
  },
  earth: {
    key: "earth",
    score: 28,
    bucket: "low",
    state: "underactive",
  },
};

// ----------------------------
// RUN ENGINE
// ----------------------------

// 1. Match archetypes
const matches = matchArchetypes(mockDimensions);

// 2. Build full identity profile
const profile = buildIdentityProfile(mockDimensions, matches);

// ----------------------------
// OUTPUT
// ----------------------------

console.log("🧭 AETHERIUM TEST OUTPUT");
console.log("----------------------------");

console.log("Stage:", profile.stage);
console.log("Coherence Score:", profile.coherenceScore);
console.log("Expression Quality:", profile.expressionQuality);

console.log("\nPrimary Archetype:", profile.primaryArchetype);
console.log("Secondary Archetype:", profile.secondaryArchetype);
console.log("Shadow Archetype:", profile.shadowArchetype);

console.log("\nStrongest Dimension:", profile.strongestDimension);
console.log("Weakest Dimension:", profile.weakestDimension);

console.log("\nTension:", profile.tension);
console.log("Growth Vector:", profile.growthVector);

console.log("\nPathway:", profile.pathway);

console.log("\nPractice Message:", profile.practiceMessage);
console.log("Archetype Hint:", profile.archetypeHint);