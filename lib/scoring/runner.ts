'use client'

import { scoreAssessment } from './engine'
import { analyzeSignalQuality, type SignalQuality } from './signal'
import { buildArchetypeBlend } from '../archetypes/matcher'
import { buildGrowthProfile } from '../pathways/growth'
import { parseNarrativeAnswers } from '../assessment/narrative'
import { buildResultPayload } from '../types/results'
import type { RawAnswers } from './engine'
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
 * Now includes signal quality analysis per canon requirements.
 */
export function computeResultPayload(input: RunnerInput): ResultPayload {
  const { answers, narrativeRaw, options } = input

  const scoring        = scoreAssessment(answers)
  const signalQuality  = analyzeSignalQuality(answers, scoring.dimensions)
  const archetypeBlend = buildArchetypeBlend(scoring.dimensions)
  const growthProfile  = buildGrowthProfile(scoring.dimensions, archetypeBlend.primary.archetype)
  const narrative      = parseNarrativeAnswers(narrativeRaw)

  return buildResultPayload(scoring, archetypeBlend, growthProfile, narrative, signalQuality, {
    assessmentId:   options?.assessmentId   ?? null,
    profileStateId: options?.profileStateId ?? null,
  })
}

export type { ResultPayload }
export type { RawAnswers }
export type { SignalQuality }
