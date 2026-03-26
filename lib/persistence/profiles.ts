/**
 * persistence/profiles.ts
 * Save computed profile state and archetype results to Supabase.
 *
 * profile_states is APPEND-ONLY — never update or delete rows.
 * Every reassessment creates a new row, preserving full evolution history.
 */

import { supabase } from '../supabase'
import type { ScoringResult, EvolutionState, DimensionProfile } from '../scoring/engine'
import type { ArchetypeBlend } from '../archetypes/matcher'
import type { GrowthProfile } from '../pathways/growth'
import type { NarrativeAnswers } from '../assessment/narrative'
import type { Dimension } from '../assessment/questions'
import { ASSESSMENT_VERSION, PROFILE_MODEL_VERSION, buildResultPayload } from '../types/results'
import type { ResultPayload } from '../types/results'
import { buildArchetypeBlend } from '../archetypes/matcher'
import { buildGrowthProfile } from '../pathways/growth'
import { getBalance } from '../scoring/normalize'

export interface SavedProfileState {
  id:         string
  created_at: string
}

export interface SavedArchetypeResult {
  id: string
}

// ── Profile state ────────────────────────────────────────────────────────────

export async function saveProfileState(params: {
  userId?:             string | null
  assessmentId:        string | null
  scoring:             ScoringResult
  archetypeBlend:      ArchetypeBlend
  growthProfile:       GrowthProfile
  narrative:           NarrativeAnswers
  evolutionState:      EvolutionState
  dominantDimension:   Dimension
  deficientDimension:  Dimension
}): Promise<SavedProfileState> {
  const {
    userId, assessmentId, scoring, archetypeBlend,
    growthProfile, narrative, evolutionState,
    dominantDimension, deficientDimension,
  } = params

  const { data, error } = await supabase
    .from('profile_states')
    .insert({
      user_id:               userId ?? null,
      assessment_id:         assessmentId,
      assessment_version:    ASSESSMENT_VERSION,
      profile_model_version: PROFILE_MODEL_VERSION,
      prompt_version:        '1.0',

      // Dimension scores
      aether_score:   scoring.dimensions.aether,
      fire_score:     scoring.dimensions.fire,
      air_score:      scoring.dimensions.air,
      water_score:    scoring.dimensions.water,
      earth_score:    scoring.dimensions.earth,
      overall_score:  scoring.overallScore,
      coherence_score: scoring.coherenceScore,

      evolution_state:     evolutionState,
      dominant_dimension:  dominantDimension,
      deficient_dimension: deficientDimension,

      // Per-dimension bucket detail
      dimensional_buckets: Object.fromEntries(
        Object.entries(scoring.profiles).map(([dim, p]) => [
          dim,
          { score: p.score, balance: p.balance, rawAverage: p.rawAverage },
        ])
      ),

      // Archetype blend (compact summary for quick reads)
      archetype_blend: {
        primary_id:    archetypeBlend.primary.archetype.id,
        primary_name:  archetypeBlend.primary.archetype.name,
        primary_pct:   archetypeBlend.primary.percentage,
        secondary_id:  archetypeBlend.secondary.archetype.id,
        secondary_name: archetypeBlend.secondary.archetype.name,
        secondary_pct: archetypeBlend.secondary.percentage,
        tertiary_id:   archetypeBlend.tertiary.archetype.id,
        tertiary_name: archetypeBlend.tertiary.archetype.name,
        tertiary_pct:  archetypeBlend.tertiary.percentage,
        shadow_id:     archetypeBlend.shadow.id,
        shadow_name:   archetypeBlend.shadow.name,
        blend_title:   archetypeBlend.blendTitle,
      },

      // Full distribution for analytics (array ordered by percentage)
      archetype_distribution: [
        buildArchetypeDistEntry(archetypeBlend.primary.archetype.id, archetypeBlend.primary.archetype.name, archetypeBlend.primary.percentage),
        buildArchetypeDistEntry(archetypeBlend.secondary.archetype.id, archetypeBlend.secondary.archetype.name, archetypeBlend.secondary.percentage),
        buildArchetypeDistEntry(archetypeBlend.tertiary.archetype.id, archetypeBlend.tertiary.archetype.name, archetypeBlend.tertiary.percentage),
        { id: archetypeBlend.shadow.id, name: archetypeBlend.shadow.name, percentage: 0, is_shadow: true },
      ],

      // Legacy evolution pathway column (kept for backward compat)
      evolution_pathway: {
        current_state:    growthProfile.currentState,
        next_state:       growthProfile.evolutionPathway.next.state,
        future_state:     growthProfile.evolutionPathway.future.state,
        growth_dimension: growthProfile.growthEdge.dimension,
        growth_score:     growthProfile.growthEdge.score,
      },

      // Full pathway options
      pathway_options: growthProfile.pathwayOptions.map(p => ({
        id:             p.id,
        title:          p.title,
        archetype_id:   p.targetArchetype.id,
        archetype_name: p.targetArchetype.name,
        dimension:      p.growthDimension,
        description:    p.transitionDescription,
      })),

      practices: growthProfile.practices,

      // Narrative context
      narrative_life_phase:  narrative.life_phase  || null,
      narrative_challenges:  narrative.recent_challenges || null,
      narrative_direction:   narrative.desired_direction || null,

      metadata: {},
    })
    .select('id, created_at')
    .single()

  if (error) throw error
  return data as SavedProfileState
}

// ── Archetype result ─────────────────────────────────────────────────────────

export async function saveArchetypeResult(params: {
  profileStateId: string
  archetypeBlend: ArchetypeBlend
  summary?:       string
}): Promise<SavedArchetypeResult> {
  const { profileStateId, archetypeBlend, summary } = params

  const { data, error } = await supabase
    .from('archetype_results')
    .insert({
      profile_state_id:      profileStateId,

      primary_archetype_id:   archetypeBlend.primary.archetype.id,
      primary_archetype_name: archetypeBlend.primary.archetype.name,
      primary_percentage:     archetypeBlend.primary.percentage,

      secondary_archetype_id:   archetypeBlend.secondary.archetype.id,
      secondary_archetype_name: archetypeBlend.secondary.archetype.name,
      secondary_percentage:     archetypeBlend.secondary.percentage,

      tertiary_archetype_id:   archetypeBlend.tertiary.archetype.id,
      tertiary_archetype_name: archetypeBlend.tertiary.archetype.name,
      tertiary_percentage:     archetypeBlend.tertiary.percentage,

      shadow_archetype_id:   archetypeBlend.shadow.id,
      shadow_archetype_name: archetypeBlend.shadow.name,

      blend_title: archetypeBlend.blendTitle,
      summary:     summary ?? null,
    })
    .select('id')
    .single()

  if (error) throw error
  return data as SavedArchetypeResult
}

// ── Fetch + reconstruct ───────────────────────────────────────────────────────

/**
 * Fetch a saved profile_state from Supabase and reconstruct a full ResultPayload
 * by re-running the deterministic scoring engines from stored dimension scores.
 *
 * Returns null if the row cannot be found or Supabase is unavailable.
 */
export async function fetchAndReconstructPayload(
  profileStateId: string
): Promise<ResultPayload | null> {
  const { data: ps, error } = await supabase
    .from('profile_states')
    .select('*')
    .eq('id', profileStateId)
    .single()

  if (error || !ps) return null

  const dimensions = {
    aether: ps.aether_score as number,
    fire:   ps.fire_score   as number,
    air:    ps.air_score    as number,
    water:  ps.water_score  as number,
    earth:  ps.earth_score  as number,
  }

  // Reconstruct dimension profiles from stored buckets (or approximate)
  type StoredBucket = { score: number; balance: string; rawAverage?: number }
  const buckets = (ps.dimensional_buckets ?? {}) as Record<Dimension, StoredBucket>

  const profiles = Object.fromEntries(
    (Object.keys(dimensions) as Dimension[]).map(dim => {
      const score = dimensions[dim]
      const b = buckets[dim]
      const profile: DimensionProfile = {
        score,
        balance:    (b?.balance as DimensionProfile['balance']) ?? getBalance(score),
        rawAverage: b?.rawAverage ?? parseFloat(((score / 100) * 4 + 1).toFixed(2)),
      }
      return [dim, profile]
    })
  ) as Record<Dimension, DimensionProfile>

  const scoring: ScoringResult = {
    dimensions,
    profiles,
    coherenceScore: ps.coherence_score as number,
    overallScore:   ps.overall_score   as number,
  }

  const archetypeBlend = buildArchetypeBlend(dimensions)
  const growthProfile  = buildGrowthProfile(dimensions)

  const narrative: NarrativeAnswers = {
    life_phase:         (ps.narrative_life_phase  as string | null) ?? '',
    recent_challenges:  (ps.narrative_challenges  as string | null) ?? '',
    desired_direction:  (ps.narrative_direction   as string | null) ?? '',
  }

  return buildResultPayload(scoring, archetypeBlend, growthProfile, narrative, {
    assessmentId:   (ps.assessment_id  as string | null) ?? null,
    profileStateId: ps.id as string,
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildArchetypeDistEntry(id: string, name: string, percentage: number) {
  return { id, name, percentage }
}
