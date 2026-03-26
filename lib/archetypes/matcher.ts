import { ARCHETYPES, type Archetype } from './definitions'
import type { DimensionScores } from '../scoring/engine'

export interface ArchetypeMatch {
  archetype: Archetype
  similarity: number   // 0–1
  percentage: number   // 0–100, normalized across top matches
}

export interface ArchetypeBlend {
  primary: ArchetypeMatch
  secondary: ArchetypeMatch
  tertiary: ArchetypeMatch
  shadow: Archetype
  blendTitle: string
}

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, v, i) => sum + Math.pow(v - b[i], 2), 0))
}

const MAX_DISTANCE = Math.sqrt(5 * 100 * 100) // ~223.6

export function matchArchetypes(scores: DimensionScores): ArchetypeMatch[] {
  const userVector = [
    scores.aether,
    scores.fire,
    scores.air,
    scores.water,
    scores.earth,
  ]

  const matches = ARCHETYPES.map(archetype => {
    const archetypeVector = [
      archetype.profile.aether,
      archetype.profile.fire,
      archetype.profile.air,
      archetype.profile.water,
      archetype.profile.earth,
    ]

    const distance = euclideanDistance(userVector, archetypeVector)
    const similarity = 1 - distance / MAX_DISTANCE

    return { archetype, similarity, percentage: 0 }
  })

  // Sort by similarity descending
  matches.sort((a, b) => b.similarity - a.similarity)

  return matches
}

export function buildArchetypeBlend(scores: DimensionScores): ArchetypeBlend {
  const all = matchArchetypes(scores)
  const top3 = all.slice(0, 3)

  // Normalize top 3 to percentages that sum to 100
  const totalSim = top3.reduce((sum, m) => sum + m.similarity, 0)
  const normalized = top3.map(m => ({
    ...m,
    percentage: Math.round((m.similarity / totalSim) * 100),
  }))

  // Adjust rounding to ensure sum = 100
  const sum = normalized.reduce((s, m) => s + m.percentage, 0)
  if (sum !== 100) {
    normalized[0].percentage += 100 - sum
  }

  // Shadow = the archetype from the SAME state that is LEAST similar
  // (what the user is suppressing or avoiding)
  const primaryState = normalized[0].archetype.state
  const sameStateArchetypes = all.filter(m => m.archetype.state === primaryState)
  const shadowMatch = sameStateArchetypes[sameStateArchetypes.length - 1]
  const shadow = shadowMatch?.archetype ?? all[all.length - 1].archetype

  // Build blend title
  const blendTitle = buildBlendTitle(normalized[0].archetype, normalized[1].archetype)

  return {
    primary: normalized[0],
    secondary: normalized[1],
    tertiary: normalized[2],
    shadow,
    blendTitle,
  }
}

function buildBlendTitle(primary: Archetype, secondary: Archetype): string {
  // Create a descriptive blend title from the two strongest archetypes
  const templates: Record<string, Record<string, string>> = {
    'the-drifter':      { 'the-ghost': 'The Wandering Soul', 'the-reactor': 'The Turbulent Drifter', 'default': 'The Drifter' },
    'the-seeker':       { 'the-dreamer': 'The Visionary Seeker', 'the-analyst': 'The Philosophical Seeker', 'default': 'The Seeker' },
    'the-dreamer':      { 'the-creator': 'The Inspired Dreamer', 'the-philosopher': 'The Illuminated Dreamer', 'default': 'The Dreamer' },
    'the-warrior':      { 'the-catalyst': 'The Awakening Warrior', 'the-builder': 'The Driven Warrior', 'default': 'The Warrior' },
    'the-builder':      { 'the-warrior': 'The Disciplined Builder', 'the-leader': 'The Emerging Leader', 'default': 'The Builder' },
    'the-philosopher':  { 'the-sage': 'The Emerging Sage', 'the-creator': 'The Philosophical Creator', 'default': 'The Philosopher' },
    'the-catalyst':     { 'the-leader': 'The Catalytic Leader', 'the-visionary': 'The Activated Visionary', 'default': 'The Catalyst' },
    'the-creator':      { 'the-visionary': 'The Inspired Creator', 'the-philosopher': 'The Reflective Creator', 'default': 'The Creator' },
    'the-leader':       { 'the-visionary': 'The Visionary Leader', 'the-guardian': 'The Grounded Leader', 'default': 'The Leader' },
    'the-visionary':    { 'the-sage': 'The Prophetic Visionary', 'the-alchemist': 'The Transformative Visionary', 'default': 'The Visionary' },
    'the-sage':         { 'the-oracle': 'The Oracular Sage', 'the-master': 'The Master Sage', 'default': 'The Sage' },
    'the-alchemist':    { 'the-sovereign': 'The Sovereign Alchemist', 'the-warrior-sage': 'The Warrior-Alchemist', 'default': 'The Alchemist' },
    'the-sovereign':    { 'the-master': 'The Sovereign Master', 'default': 'The Sovereign' },
    'the-master':       { 'default': 'The Master' },
  }

  const primaryTemplates = templates[primary.id]
  if (primaryTemplates) {
    return primaryTemplates[secondary.id] ?? primaryTemplates['default'] ?? primary.name
  }
  return primary.name
}
