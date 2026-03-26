/**
 * results.ts
 * Canonical ResultPayload type — the single object consumed by /results.
 *
 * Everything the results screen needs lives here. Persistence IDs are
 * set after the Supabase save and patched in before localStorage write.
 */

import type { ScoringResult, EvolutionState } from '../scoring/engine'
import type { Dimension } from '../assessment/questions'
import type { ArchetypeBlend } from '../archetypes/matcher'
import type { GrowthProfile } from '../pathways/growth'
import type { NarrativeAnswers } from '../assessment/narrative'

export const ASSESSMENT_VERSION     = '1.0'
export const PROFILE_MODEL_VERSION  = '1.0'

// ── Sub-types ───────────────────────────────────────────────────────────────

export interface DimensionBucket {
  dimension:   Dimension
  score:       number                          // 0–100
  balance:     'low' | 'medium' | 'high'
  label:       string                          // "Low" | "Medium" | "High"
  rawAverage:  number                          // 1–5 (for audit / debug)
}

// ── Master payload ──────────────────────────────────────────────────────────

export interface ResultPayload {
  // ── Persistence IDs (null until saved to Supabase) ──────────────────────
  assessmentId:    string | null
  profileStateId:  string | null

  // ── Raw scoring output ───────────────────────────────────────────────────
  scoring:         ScoringResult

  // ── Convenience top-level unpacks (mirror scoring internals) ────────────
  coherenceScore:  number            // 0–100
  overallScore:    number            // 0–100

  // ── Dimensional profile ──────────────────────────────────────────────────
  dimensionBuckets:    Record<Dimension, DimensionBucket>
  dominantDimension:   Dimension
  deficientDimension:  Dimension

  // ── Evolution ────────────────────────────────────────────────────────────
  evolutionState:  EvolutionState

  // ── Archetypes ───────────────────────────────────────────────────────────
  archetypeBlend:  ArchetypeBlend

  // ── Growth ───────────────────────────────────────────────────────────────
  growthProfile:   GrowthProfile

  // ── Narrative context ────────────────────────────────────────────────────
  narrative:       NarrativeAnswers

  // ── Metadata ─────────────────────────────────────────────────────────────
  generatedAt:            string     // ISO timestamp
  assessmentVersion:      string
  profileModelVersion:    string
}

// ── Builder ─────────────────────────────────────────────────────────────────

export function buildResultPayload(
  scoring:        ScoringResult,
  archetypeBlend: ArchetypeBlend,
  growthProfile:  GrowthProfile,
  narrative:      NarrativeAnswers,
  options?: {
    assessmentId?:   string | null
    profileStateId?: string | null
  }
): ResultPayload {
  const DIMS: Dimension[] = ['aether', 'fire', 'air', 'water', 'earth']

  const dimensionBuckets = Object.fromEntries(
    DIMS.map(dim => {
      const profile = scoring.profiles[dim]
      return [
        dim,
        {
          dimension:  dim,
          score:      profile.score,
          balance:    profile.balance,
          label:      profile.balance.charAt(0).toUpperCase() + profile.balance.slice(1),
          rawAverage: profile.rawAverage,
        } satisfies DimensionBucket,
      ]
    })
  ) as Record<Dimension, DimensionBucket>

  // Derive dominant / deficient from scoring.dimensions
  const entries = Object.entries(scoring.dimensions) as [Dimension, number][]
  const dominantDimension  = entries.reduce((a, b) => b[1] > a[1] ? b : a)[0]
  const deficientDimension = entries.reduce((a, b) => b[1] < a[1] ? b : a)[0]

  return {
    assessmentId:   options?.assessmentId   ?? null,
    profileStateId: options?.profileStateId ?? null,

    scoring,
    coherenceScore:  scoring.coherenceScore,
    overallScore:    scoring.overallScore,

    dimensionBuckets,
    dominantDimension,
    deficientDimension,

    evolutionState: growthProfile.currentState,

    archetypeBlend,
    growthProfile,
    narrative,

    generatedAt:         new Date().toISOString(),
    assessmentVersion:   ASSESSMENT_VERSION,
    profileModelVersion: PROFILE_MODEL_VERSION,
  }
}
