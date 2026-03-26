'use client'

import { scoreAssessment } from './engine'
import { buildArchetypeBlend } from '../archetypes/matcher'
import { buildGrowthProfile } from '../pathways/growth'
import { parseNarrativeAnswers } from '../assessment/narrative'
import { buildResultPayload } from '../types/results'
import type { RawAnswers } from './engine'
import type { Dimension } from '../assessment/questions'
import type { ResultPayload } from '../types/results'

export interface RunnerInput {
  answers:      RawAnswers
  narrativeRaw: Record<string, string>
  options?: {
    assessmentId?:   string | null
    profileStateId?: string | null
  }
}

/**
 * Pure compute function — no side effects, no I/O.
 * Takes raw answers + narrative, returns a fully-typed ResultPayload.
 * Call this in the generating page before persisting.
 */
export function computeResultPayload(input: RunnerInput): ResultPayload {
  const { answers, narrativeRaw, options } = input

  const scoring        = scoreAssessment(answers)
  const archetypeBlend = buildArchetypeBlend(scoring.dimensions)
  const growthProfile  = buildGrowthProfile(scoring.dimensions)
  const narrative      = parseNarrativeAnswers(narrativeRaw)

  const entries = Object.entries(scoring.dimensions) as [Dimension, number][]
  const dominantDimension  = entries.reduce((a, b) => b[1] > a[1] ? b : a)[0]
  const deficientDimension = entries.reduce((a, b) => b[1] < a[1] ? b : a)[0]

  return buildResultPayload(scoring, archetypeBlend, growthProfile, narrative, {
    assessmentId:   options?.assessmentId   ?? null,
    profileStateId: options?.profileStateId ?? null,
  })
}

export type { ResultPayload }
export type { RawAnswers }
