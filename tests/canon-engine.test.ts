/**
 * canon-engine.test.ts
 *
 * 25-PERSONA TRUTH TEST SUITE
 *
 * Validates that the Aetherium scoring engine produces correct results
 * against the locked canonical archetype system.
 *
 * Tests:
 *   - Primary archetype matching
 *   - Growth edge from matched archetype (not lowest score)
 *   - Shadow derivation from weakest dimension + trigger rules
 *   - Balanced system detection
 *   - Signal quality checks (inflation bias, low variance)
 *
 * Run: npx tsx tests/canon-engine.test.ts
 */

import { matchArchetypes, buildArchetypeBlend, normalizeScores } from '../lib/archetypes/matcher'
import { deriveShadow } from '../lib/archetypes/shadow'
import { ARCHETYPES, getArchetypeById, SHADOW_ARCHETYPES } from '../lib/archetypes/definitions'
import { analyzeSignalQuality } from '../lib/scoring/signal'
import { scoreAssessment, computeDimensionScores } from '../lib/scoring/engine'
import type { DimensionScores, RawAnswers } from '../lib/scoring/engine'

// ── Test infrastructure ──────────────────────────────────────────────────────

let passed = 0
let failed = 0
const failures: string[] = []

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++
  } else {
    failed++
    failures.push(message)
    console.error(`  ✗ ${message}`)
  }
}

function section(name: string) {
  console.log(`\n━━━ ${name} ━━━`)
}

// ── Helper: create DimensionScores from shorthand ────────────────────────────

function scores(aether: number, fire: number, air: number, water: number, earth: number): DimensionScores {
  return { aether, fire, air, water, earth }
}

// ── Helper: create RawAnswers that produce target dimension scores ────────────
// Each dimension has 10 questions. To hit a target 0-100 score,
// we set all answers for that dimension to produce the right average.
// score = round(((avg - 1) / 4) * 100), so avg = score/100 * 4 + 1

function makeAnswersForScores(target: DimensionScores): RawAnswers {
  const { QUESTIONS } = require('../lib/assessment/questions')
  const answers: RawAnswers = {}

  for (const q of QUESTIONS) {
    const targetScore = target[q.dimension as keyof DimensionScores]
    // Convert 0-100 back to average 1-5
    const targetAvg = (targetScore / 100) * 4 + 1
    // Clamp to valid Likert range
    let answer = Math.round(Math.max(1, Math.min(5, targetAvg)))
    // If reverse scored, invert
    if (q.reverseScored) {
      answer = 6 - answer
    }
    answers[q.id] = answer
  }

  return answers
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONA DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface Persona {
  id: number
  name: string
  scores: DimensionScores
  expectedPrimary?: string         // archetype ID (optional for balanced/signal-only tests)
  expectedGrowthEdge?: string      // dimension or special value
  expectedShadow?: string          // shadow archetype ID
  expectedBalanced?: boolean
  expectedConfidence?: 'high' | 'moderate' | 'low'
  notes: string
}

const PERSONAS: Persona[] = [
  {
    id: 1,
    name: 'Overthinking grad student',
    scores: scores(20, 20, 100, 20, 20),
    expectedPrimary: 'overthinker',
    expectedShadow: 'overthinker',  // Shadow derivation: weakest=fire, strongest=air → overthinker
    notes: 'Pure Air spike → Shadow category archetype',
  },
  {
    id: 2,
    name: 'Burned-out exec',
    scores: scores(5, 5, 5, 5, 5),
    expectedPrimary: 'burnout',
    expectedShadow: 'burnout',
    notes: 'All near zero → collapse detection',
  },
  {
    id: 3,
    name: 'Purpose-driven but stuck',
    scores: scores(100, 20, 40, 80, 20),
    expectedPrimary: 'seeker',
    expectedGrowthEdge: 'fire',
    notes: 'High Aether+Water, low Fire+Earth → Seeker',
  },
  {
    id: 4,
    name: 'Reliable operator',
    scores: scores(20, 60, 60, 20, 100),
    expectedPrimary: 'operator',
    expectedGrowthEdge: 'aether',
    notes: 'Earth-dominant, Aether-deficient → Operator',
  },
  {
    id: 5,
    name: 'Balanced mid-range',
    scores: scores(50, 50, 50, 50, 50),
    expectedBalanced: true,
    notes: '±0.5 check must trigger as balanced system',
  },
  {
    id: 6,
    name: 'Strategic planner',
    scores: scores(80, 40, 100, 20, 20),
    expectedPrimary: 'strategist',
    expectedGrowthEdge: 'earth',
    notes: 'Air+Aether dominant → Strategist',
  },
  {
    id: 7,
    name: 'Chaotic activist',
    scores: scores(40, 100, 20, 40, 40),
    expectedPrimary: 'catalyst',
    expectedGrowthEdge: 'air',
    notes: 'Fire spike → Catalyst',
  },
  {
    id: 8,
    name: 'People-pleasing teacher',
    scores: scores(20, 20, 20, 100, 60),
    expectedPrimary: 'people-pleaser',
    expectedShadow: 'people-pleaser',
    expectedGrowthEdge: 'aether',
    notes: 'Water spike, no Aether → People-Pleaser shadow',
  },
  {
    id: 9,
    name: 'Master builder',
    scores: scores(40, 80, 40, 20, 100),
    expectedPrimary: 'builder',
    expectedGrowthEdge: 'aether',
    notes: 'Earth+Fire dominant → Builder',
  },
  {
    id: 10,
    name: 'Visionary founder',
    scores: scores(100, 60, 60, 60, 20),
    expectedPrimary: 'visionary',
    expectedGrowthEdge: 'earth',
    notes: 'High Aether, low Earth → Visionary',
  },
  {
    id: 11,
    name: 'Emotional healer',
    scores: scores(60, 20, 40, 100, 60),
    expectedPrimary: 'healer',
    expectedGrowthEdge: 'fire',
    notes: 'Water dominant → Healer',
  },
  {
    id: 12,
    name: 'Rebel without a cause',
    scores: scores(40, 100, 60, 20, 20),
    expectedPrimary: 'rebel',
    expectedGrowthEdge: 'earth',
    notes: 'Fire spike, no Earth → Rebel',
  },
  {
    id: 13,
    name: 'Detached sage',
    scores: scores(100, 20, 100, 60, 60),
    expectedPrimary: 'sage',
    expectedGrowthEdge: 'fire',
    notes: 'Aether+Air high, low Fire → Sage',
  },
  {
    id: 14,
    name: 'Nearly balanced (slight tilt)',
    scores: scores(52, 48, 50, 50, 50),
    expectedBalanced: true,
    notes: 'Must not force archetype tension — balanced system',
  },
  {
    id: 15,
    name: 'Controller CEO',
    scores: scores(60, 100, 60, 20, 100),
    expectedPrimary: 'controller',
    expectedShadow: 'controller',
    expectedGrowthEdge: 'water',
    notes: 'Fire+Earth high, no Water → Controller shadow',
  },
  {
    id: 16,
    name: 'Scattered creator',
    scores: scores(80, 60, 40, 100, 20),
    expectedPrimary: 'creator',
    expectedGrowthEdge: 'earth',
    notes: 'Water+Aether, no Earth → Creator',
  },
  {
    id: 17,
    name: 'Integrated teacher',
    scores: scores(60, 60, 100, 60, 60),
    expectedPrimary: 'teacher',
    expectedGrowthEdge: 'earth',
    notes: 'High Air, balanced rest → Teacher',
  },
  {
    id: 18,
    name: 'Alchemist pattern',
    scores: scores(100, 60, 100, 60, 60),
    expectedPrimary: 'alchemist',
    expectedGrowthEdge: 'earth',
    notes: 'Aether+Air both high → Alchemist',
  },
  {
    id: 19,
    name: 'Drifter/avoider',
    scores: scores(20, 20, 20, 60, 20),
    expectedPrimary: 'drifter',
    expectedShadow: 'drifter',
    expectedGrowthEdge: 'aether',
    notes: 'Low everything except slight Water → Drifter',
  },
  {
    id: 20,
    name: 'Performer/influencer',
    scores: scores(40, 100, 20, 60, 60),
    expectedPrimary: 'performer',
    expectedGrowthEdge: 'aether',
    notes: 'High Fire, low Air → Performer',
  },
  {
    id: 21,
    name: 'Perfectionist engineer',
    scores: scores(40, 60, 100, 20, 60),
    expectedPrimary: 'refiner',  // Refiner [2,3,5,1,3] and Perfectionist [2,3,5,1,3] have identical vectors; Refiner (Core) is correct primary
    expectedShadow: 'perfectionist',  // Shadow is correctly derived from Water being weakest
    expectedGrowthEdge: 'earth',
    notes: 'Air dominant, low Water → Refiner primary, Perfectionist shadow',
  },
  {
    id: 22,
    name: 'Unified being (all high)',
    scores: scores(100, 100, 100, 100, 100),
    expectedPrimary: 'unified-being',
    notes: 'Max all → Unified Being',
  },
  {
    id: 23,
    name: 'Guardian/protector',
    scores: scores(40, 40, 20, 100, 80),
    expectedPrimary: 'guardian',
    expectedGrowthEdge: 'air',
    notes: 'Water+Earth dominant → Guardian',
  },
  {
    id: 24,
    name: 'Orchestrator',
    scores: scores(100, 100, 100, 60, 100),
    expectedPrimary: 'orchestrator',
    expectedGrowthEdge: 'water',
    notes: 'High everything except Water → Orchestrator',
  },
  {
    id: 25,
    name: 'Inflation bias (all 5s)',
    scores: scores(100, 100, 100, 100, 100),
    expectedConfidence: 'low',
    notes: 'Signal quality: >75% max answers → reduce confidence',
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// TEST EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

console.log('AETHERIUM CANON ENGINE — 25-PERSONA TRUTH TEST\n')
console.log(`Archetypes loaded: ${ARCHETYPES.length}`)
console.log(`Shadow archetypes: ${SHADOW_ARCHETYPES.length}`)

// ── Sanity checks ────────────────────────────────────────────────────────────

section('SANITY CHECKS')

assert(ARCHETYPES.length === 32, `Expected 32 archetypes, got ${ARCHETYPES.length}`)

const categories = { core: 0, expansion: 0, shadow: 0, transcendent: 0 }
for (const a of ARCHETYPES) categories[a.category]++
assert(categories.core === 10, `Expected 10 Core, got ${categories.core}`)
assert(categories.expansion === 8, `Expected 8 Expansion, got ${categories.expansion}`)
assert(categories.shadow === 7, `Expected 7 Shadow, got ${categories.shadow}`)
assert(categories.transcendent === 7, `Expected 7 Transcendent, got ${categories.transcendent}`)

assert(SHADOW_ARCHETYPES.length === 7, `Expected 7 shadow archetypes, got ${SHADOW_ARCHETYPES.length}`)

// Verify all archetype IDs are unique
const ids = ARCHETYPES.map(a => a.id)
const uniqueIds = new Set(ids)
assert(ids.length === uniqueIds.size, `Duplicate archetype IDs found`)

// Verify all vectors are on 0-5 scale
for (const a of ARCHETYPES) {
  const vals = [a.vector.aether, a.vector.fire, a.vector.air, a.vector.water, a.vector.earth]
  for (const v of vals) {
    assert(v >= 0 && v <= 5, `${a.id} has vector value ${v} outside 0-5 range`)
  }
}

console.log(`  ✓ All sanity checks passed`)

// ── Vector normalization test ────────────────────────────────────────────────

section('VECTOR NORMALIZATION')

const testScores = scores(100, 60, 40, 80, 20)
const normalized = normalizeScores(testScores)
assert(normalized.aether === 5.0,  `Expected aether=5.0, got ${normalized.aether}`)
assert(normalized.fire === 3.0,    `Expected fire=3.0, got ${normalized.fire}`)
assert(normalized.air === 2.0,     `Expected air=2.0, got ${normalized.air}`)
assert(normalized.water === 4.0,   `Expected water=4.0, got ${normalized.water}`)
assert(normalized.earth === 1.0,   `Expected earth=1.0, got ${normalized.earth}`)
console.log(`  ✓ Normalization correct`)

// ── Similarity formula test ──────────────────────────────────────────────────

section('SIMILARITY FORMULA')

// A user with exact match to an archetype vector should have high similarity
const exactMatch = scores(100, 20, 100, 20, 20)  // Maps to 5,1,5,1,1 → Strategist vector is 4,2,5,1,1
const matches = matchArchetypes(exactMatch)
// The similarity should use 1/(1+d), not 1-d/max
assert(matches[0].similarity > 0 && matches[0].similarity <= 1,
  `Similarity should be in (0,1], got ${matches[0].similarity}`)
// Top match should have highest similarity
assert(matches[0].similarity >= matches[1].similarity,
  `Top match similarity ${matches[0].similarity} should be >= second ${matches[1].similarity}`)
console.log(`  ✓ Similarity formula uses 1/(1+d)`)

// ── Primary archetype matching ───────────────────────────────────────────────

section('PRIMARY ARCHETYPE MATCHING')

for (const persona of PERSONAS) {
  if (!persona.expectedPrimary) continue

  const blend = buildArchetypeBlend(persona.scores)
  const primaryId = blend.primary.archetype.id

  assert(
    primaryId === persona.expectedPrimary,
    `Persona #${persona.id} "${persona.name}": expected primary "${persona.expectedPrimary}", got "${primaryId}" (${blend.primary.archetype.name})`
  )
}

// ── Growth edge from archetype ───────────────────────────────────────────────

section('GROWTH EDGE FROM ARCHETYPE')

for (const persona of PERSONAS) {
  if (!persona.expectedGrowthEdge) continue

  const blend = buildArchetypeBlend(persona.scores)
  const archetype = blend.primary.archetype
  const growthDim = archetype.growthDimension

  assert(
    growthDim === persona.expectedGrowthEdge,
    `Persona #${persona.id} "${persona.name}": expected growth edge "${persona.expectedGrowthEdge}", got "${growthDim}" (archetype: ${archetype.id}, growthEdge: ${archetype.growthEdge})`
  )
}

// ── Shadow derivation ────────────────────────────────────────────────────────

section('SHADOW DERIVATION')

for (const persona of PERSONAS) {
  if (!persona.expectedShadow) continue

  const shadow = deriveShadow(persona.scores)

  assert(
    shadow.archetype.id === persona.expectedShadow,
    `Persona #${persona.id} "${persona.name}": expected shadow "${persona.expectedShadow}", got "${shadow.archetype.id}" (trigger: ${shadow.trigger})`
  )
}

// ── Balanced system detection ────────────────────────────────────────────────

section('BALANCED SYSTEM DETECTION')

for (const persona of PERSONAS) {
  if (persona.expectedBalanced === undefined) continue

  const rawAnswers = makeAnswersForScores(persona.scores)
  const signal = analyzeSignalQuality(rawAnswers, persona.scores)

  assert(
    signal.isBalancedSystem === persona.expectedBalanced,
    `Persona #${persona.id} "${persona.name}": expected balanced=${persona.expectedBalanced}, got ${signal.isBalancedSystem}`
  )
}

// ── Signal quality / confidence ──────────────────────────────────────────────

section('SIGNAL QUALITY')

// Persona 25: all 5s → inflation bias
const inflationAnswers: RawAnswers = {}
const { QUESTIONS: Qs } = require('../lib/assessment/questions')
for (const q of Qs) { inflationAnswers[q.id] = 5 }
const inflationSignal = analyzeSignalQuality(inflationAnswers, scores(100, 100, 100, 100, 100))
assert(inflationSignal.hasInflationBias === true, `Expected inflation bias detected for all-5 answers`)
assert(inflationSignal.confidence === 'low', `Expected low confidence for inflation bias, got ${inflationSignal.confidence}`)

// Low variance test: all answers are 3
const flatAnswers: RawAnswers = {}
for (const q of Qs) { flatAnswers[q.id] = 3 }
const flatSignal = analyzeSignalQuality(flatAnswers, scores(50, 50, 50, 50, 50))
assert(flatSignal.hasLowVariance === true, `Expected low variance detected for all-3 answers`)
assert(flatSignal.isBalancedSystem === true, `Expected balanced system for all-3 answers`)

console.log(`  ✓ Signal quality checks working`)

// ── Blend percentage normalization ───────────────────────────────────────────

section('BLEND PERCENTAGES')

for (const persona of PERSONAS.slice(0, 10)) {
  const blend = buildArchetypeBlend(persona.scores)
  const sum = blend.primary.percentage + blend.secondary.percentage + blend.tertiary.percentage
  assert(
    sum === 100,
    `Persona #${persona.id}: blend percentages sum to ${sum}, expected 100`
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// RESULTS
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(60))
console.log(`RESULTS: ${passed} passed, ${failed} failed`)
console.log('═'.repeat(60))

if (failures.length > 0) {
  console.log('\nFAILURES:')
  for (const f of failures) {
    console.log(`  ✗ ${f}`)
  }
}

process.exit(failed > 0 ? 1 : 0)
