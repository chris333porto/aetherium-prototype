/**
 * output-review.ts
 *
 * Generates 10 realistic full engine outputs for copy review.
 * Run: npx tsx tests/output-review.ts
 */

import { scoreAssessment } from '../lib/scoring/engine'
import { buildArchetypeBlend } from '../lib/archetypes/matcher'
import { buildGrowthProfile } from '../lib/pathways/growth'
import { analyzeSignalQuality } from '../lib/scoring/signal'
import { deriveShadow } from '../lib/archetypes/shadow'
import { getTension } from '../lib/intelligence/index'
import { DIMENSION_META } from '../lib/assessment/questions'
import { QUESTIONS } from '../lib/assessment/questions'
import type { DimensionScores, RawAnswers } from '../lib/scoring/engine'
import type { Dimension } from '../lib/assessment/questions'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAnswers(target: DimensionScores): RawAnswers {
  const answers: RawAnswers = {}
  for (const q of QUESTIONS) {
    const targetScore = target[q.dimension as keyof DimensionScores]
    const targetAvg = (targetScore / 100) * 4 + 1
    let answer = Math.round(Math.max(1, Math.min(5, targetAvg)))
    if (q.reverseScored) answer = 6 - answer
    answers[q.id] = answer
  }
  return answers
}

interface Persona {
  name: string
  description: string
  scores: DimensionScores
}

const PERSONAS: Persona[] = [
  {
    name: 'Sarah — 34, startup founder, chronic visionary',
    description: 'Has raised funding twice but never shipped V1. Reads philosophy, attends retreats. Team frustrated.',
    scores: { aether: 88, fire: 42, air: 68, water: 55, earth: 25 },
  },
  {
    name: 'Marcus — 28, software engineer, quietly unhappy',
    description: 'Ships code on time. Gets promoted. Feels hollow. Cannot name what he wants. Avoids hard conversations.',
    scores: { aether: 22, fire: 55, air: 78, water: 30, earth: 82 },
  },
  {
    name: 'Elena — 41, therapist, emotionally burned',
    description: 'Gives everything to clients. Neglects own boundaries. Cries in the car. Hasn\'t taken vacation in 2 years.',
    scores: { aether: 55, fire: 18, air: 45, water: 92, earth: 50 },
  },
  {
    name: 'James — 52, COO, control fortress',
    description: 'Runs a tight ship. Everyone performs. Nobody stays. Wife says he\'s "emotionally absent." High blood pressure.',
    scores: { aether: 60, fire: 90, air: 65, water: 15, earth: 88 },
  },
  {
    name: 'Aisha — 23, recent graduate, paralyzed by options',
    description: 'Valedictorian. 4 job offers. Can\'t choose. Journals endlessly. Reads 3 self-help books/month. Zero action.',
    scores: { aether: 35, fire: 15, air: 90, water: 40, earth: 18 },
  },
  {
    name: 'David — 38, former athlete, post-identity crisis',
    description: 'Retired from professional sports. Body still works. Mind doesn\'t know what to aim at. Drinks too much.',
    scores: { aether: 12, fire: 65, air: 30, water: 45, earth: 70 },
  },
  {
    name: 'Priya — 31, product manager, secretly creative',
    description: 'Runs roadmaps by day. Writes poetry nobody sees. Feels split between "real job" and "real self."',
    scores: { aether: 72, fire: 50, air: 60, water: 78, earth: 38 },
  },
  {
    name: 'Tom — 45, small business owner, steady but stuck',
    description: 'Business runs itself. Kids are fine. Marriage is "fine." Everything is fine. Nothing is alive.',
    scores: { aether: 48, fire: 45, air: 52, water: 50, earth: 55 },
  },
  {
    name: 'Mei — 27, activist, burning bright',
    description: 'Organizes protests. Posts daily. Fights hard. Hasn\'t sat still in 3 years. Friends worry about burnout.',
    scores: { aether: 70, fire: 95, air: 35, water: 55, earth: 40 },
  },
  {
    name: 'Robert — 60, retired executive, unraveling',
    description: 'Built empires. Now sits in a quiet house. Wife died 2 years ago. Doesn\'t know who he is without the title.',
    scores: { aether: 20, fire: 10, air: 40, water: 65, earth: 15 },
  },
]

// ── Generate outputs ─────────────────────────────────────────────────────────

console.log('═'.repeat(80))
console.log('AETHERIUM ENGINE OUTPUT REVIEW — 10 REALISTIC PERSONAS')
console.log('═'.repeat(80))

for (let i = 0; i < PERSONAS.length; i++) {
  const p = PERSONAS[i]
  const rawAnswers = makeAnswers(p.scores)
  const scoring = scoreAssessment(rawAnswers)
  const signal = analyzeSignalQuality(rawAnswers, scoring.dimensions)
  const blend = buildArchetypeBlend(scoring.dimensions)
  const shadow = deriveShadow(scoring.dimensions)
  const growth = buildGrowthProfile(scoring.dimensions, blend.primary.archetype)

  const dominant = (Object.entries(scoring.dimensions) as [Dimension, number][])
    .reduce((a, b) => b[1] > a[1] ? b : a)[0]
  const deficient = (Object.entries(scoring.dimensions) as [Dimension, number][])
    .reduce((a, b) => b[1] < a[1] ? b : a)[0]

  const edgeDim = growth.growthEdge.dimension
  const tension = edgeDim ? getTension(dominant, edgeDim) : 'System is seeking balance across all dimensions.'

  console.log(`\n${'─'.repeat(80)}`)
  console.log(`PERSONA ${i + 1}: ${p.name}`)
  console.log(`Context: ${p.description}`)
  console.log('─'.repeat(80))

  console.log(`\n  DIMENSIONS (0–100):`)
  for (const dim of ['aether', 'fire', 'air', 'water', 'earth'] as Dimension[]) {
    const score = scoring.dimensions[dim]
    const bar = '█'.repeat(Math.round(score / 5)) + '░'.repeat(20 - Math.round(score / 5))
    const label = DIMENSION_META[dim].label.padEnd(10)
    console.log(`    ${label} ${bar} ${score}`)
  }
  console.log(`    ${'─'.repeat(40)}`)
  console.log(`    Overall: ${scoring.overallScore}  |  Coherence: ${scoring.coherenceScore}`)

  console.log(`\n  PRIMARY ARCHETYPE:`)
  console.log(`    ${blend.primary.archetype.name} (${blend.primary.percentage}%)`)
  console.log(`    Category: ${blend.primary.archetype.category}`)
  console.log(`    AI Output: "${blend.primary.archetype.aiOutput}"`)

  console.log(`\n  BLEND:`)
  console.log(`    Title: ${blend.blendTitle}`)
  console.log(`    Secondary: ${blend.secondary.archetype.name} (${blend.secondary.percentage}%)`)
  console.log(`    Tertiary: ${blend.tertiary.archetype.name} (${blend.tertiary.percentage}%)`)

  console.log(`\n  SHADOW:`)
  console.log(`    ${shadow.archetype.name}`)
  console.log(`    Trigger: ${shadow.trigger}`)
  console.log(`    Pattern: "${shadow.archetype.whenMisaligned}"`)
  console.log(`    Integration: "${shadow.integrationPath}"`)

  console.log(`\n  GROWTH EDGE:`)
  console.log(`    ${growth.growthEdge.label} (${edgeDim ?? 'n/a'})`)
  console.log(`    From archetype: "${blend.primary.archetype.growthEdge}"`)
  console.log(`    Score in growth dimension: ${edgeDim ? scoring.dimensions[edgeDim] : 'n/a'}`)
  console.log(`    Description: "${growth.growthEdge.description}"`)

  console.log(`\n  TENSION:`)
  console.log(`    Dominant: ${DIMENSION_META[dominant].label} (${scoring.dimensions[dominant]})`)
  console.log(`    Growth:   ${edgeDim ? DIMENSION_META[edgeDim].label : 'n/a'} (${edgeDim ? scoring.dimensions[edgeDim] : 'n/a'})`)
  console.log(`    Statement: "${tension}"`)

  console.log(`\n  SIGNAL QUALITY:`)
  console.log(`    Confidence: ${signal.confidence}`)
  console.log(`    Balanced system: ${signal.isBalancedSystem}`)
  console.log(`    Flags: ${signal.flags.length > 0 ? signal.flags.join('; ') : 'none'}`)

  console.log(`\n  PRACTICES (from archetype):`)
  console.log(`    "${blend.primary.archetype.practiceOrientation}"`)

  console.log(`\n  REBALANCING:`)
  console.log(`    "${blend.primary.archetype.rebalancingPath}"`)
}

console.log(`\n${'═'.repeat(80)}`)
console.log('END OF OUTPUT REVIEW')
console.log('═'.repeat(80))
