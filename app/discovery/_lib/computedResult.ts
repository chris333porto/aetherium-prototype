'use client'

/**
 * Shared hook that reads /discovery answers from localStorage, runs them
 * through the locked scoring engine + archetype matcher, and returns the
 * archetype + dimensional scores + user's dominant dimension.
 *
 * Both /discovery/reveal and /discovery/welcome-home depend on exactly this
 * computation; factoring it here prevents drift between the gated initial
 * view and the full post-guestbook results.
 *
 * Returns:
 *   null        — still computing on first render
 *   'no-data'   — answers missing or incomplete (user direct-navigated here)
 *   result      — the full computed bundle
 */

import { useEffect, useState } from 'react'
import { scoreAssessment, type RawAnswers } from '@/lib/scoring/engine'
import { buildArchetypeBlend } from '@/lib/archetypes/matcher'
import type { Archetype } from '@/lib/archetypes/definitions'
import type { Dimension } from '@/lib/assessment/questions'

export const ANSWERS_KEY      = 'ae_disc_answers'
export const ARCHETYPE_ID_KEY = 'ae_disc_archetype_id'
export const NAME_KEY         = 'ae_disc_name'
export const EMAIL_KEY        = 'ae_disc_email'
export const TOKEN_KEY        = 'ae_disc_token'   // handoff token, set once on welcome-home

export interface ComputedDiscovery {
  archetype:         Archetype
  dimensionScores:   Record<Dimension, number>
  dominantDimension: Dimension
}

export type ComputedState = ComputedDiscovery | 'no-data' | null

export function useComputedDiscovery(): ComputedState {
  const [result, setResult] = useState<ComputedState>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ANSWERS_KEY)
      if (!raw) { setResult('no-data'); return }
      const answers = JSON.parse(raw) as RawAnswers
      if (Object.keys(answers).length < 10) { setResult('no-data'); return }

      const scoring = scoreAssessment(answers)
      const blend   = buildArchetypeBlend(scoring.dimensions)
      const archetype = blend.primary.archetype

      localStorage.setItem(ARCHETYPE_ID_KEY, archetype.id)

      const entries = Object.entries(scoring.dimensions) as [Dimension, number][]
      const dominantDimension = entries.reduce((a, b) => b[1] > a[1] ? b : a)[0]

      setResult({
        archetype,
        dimensionScores: scoring.dimensions,
        dominantDimension,
      })
    } catch {
      setResult('no-data')
    }
  }, [])

  return result
}
