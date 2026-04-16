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
import { EMPTY_NARRATIVE } from '../assessment/narrative'
import type { Dimension } from '../assessment/questions'
import { ASSESSMENT_VERSION, PROFILE_MODEL_VERSION, buildResultPayload } from '../types/results'
import type { ResultPayload } from '../types/results'
import { buildArchetypeBlend } from '../archetypes/matcher'
import { buildGrowthProfile } from '../pathways/growth'
import { getBalance } from '../scoring/normalize'
import type { SignalQuality } from '../scoring/signal'

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

      // Narrative context — original 3 named columns (Supabase schema v1–v3)
      narrative_life_phase:  narrative.life_phase        || null,
      narrative_challenges:  narrative.recent_challenges || null,
      narrative_direction:   narrative.desired_direction || null,

      // Extended narrative fields (migration 003) — stored as jsonb
      narrative_context: {
        ...(narrative.environment       ? { environment:       narrative.environment }       : {}),
        ...(narrative.recurring_pattern ? { recurring_pattern: narrative.recurring_pattern } : {}),
        ...(narrative.avoidance         ? { avoidance:         narrative.avoidance }         : {}),
        ...(narrative.deeper_pull       ? { deeper_pull:       narrative.deeper_pull }       : {}),
        ...(narrative.energy_state      ? { energy_state:      narrative.energy_state }      : {}),
        ...(narrative.energy_sources    ? { energy_sources:    narrative.energy_sources }    : {}),
      },

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

  // Reconstruct full NarrativeAnswers from both named columns (migration 001/002)
  // and the narrative_context jsonb blob (migration 003).
  const ctx = (ps.narrative_context ?? {}) as Record<string, string>

  const narrative: NarrativeAnswers = {
    ...EMPTY_NARRATIVE,
    life_phase:        (ps.narrative_life_phase as string | null) ?? '',
    recent_challenges: (ps.narrative_challenges as string | null) ?? '',
    desired_direction: (ps.narrative_direction  as string | null) ?? '',
    environment:       ctx.environment        ?? '',
    recurring_pattern: ctx.recurring_pattern  ?? '',
    avoidance:         ctx.avoidance          ?? '',
    deeper_pull:       ctx.deeper_pull        ?? '',
    energy_state:      ctx.energy_state       ?? '',
    energy_sources:    ctx.energy_sources     ?? '',
  }

  // Reconstruction from persisted data — signal quality is not stored,
  // so we provide a neutral fallback.
  const fallbackSignal: SignalQuality = {
    confidence: 'moderate',
    isBalancedSystem: false,
    isFlatProfile: false,
    hasInflationBias: false,
    hasLowVariance: false,
    flags: [],
  }

  return buildResultPayload(scoring, archetypeBlend, growthProfile, narrative, fallbackSignal, {
    assessmentId:   (ps.assessment_id  as string | null) ?? null,
    profileStateId: ps.id as string,
  })
}

// ── Save profile record (post-results identity persistence) ───────────────────

/**
 * Called when the user taps "Save your profile and continue" on the results page.
 *
 * 1. Upserts a `profiles` row keyed on email (idempotent — retapping is safe).
 * 2. Links the current `assessments` row to that profile.
 * 3. Links the current `profile_states` row to that profile.
 *
 * Throws on Supabase error so the caller can surface a message.
 */
export async function saveProfileRecord(params: {
  identity: {
    email:      string
    firstName:  string
    lastName:   string
    birthDate?: string | null
    city?:      string | null
    region?:    string | null
    country?:   string | null
    timezone?:  string | null
  }
  assessmentId:   string | null
  profileStateId: string | null
}): Promise<{ profileId: string }> {
  const { identity, assessmentId, profileStateId } = params

  // Normalize email so stored value always matches what auth providers return
  const normalizedEmail = identity.email.toLowerCase().trim()

  // 1. Upsert profiles row — email is the unique key
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .upsert(
      {
        email:      normalizedEmail,
        first_name: identity.firstName,
        last_name:  identity.lastName,
        birth_date: identity.birthDate  || null,
        city:       identity.city       || null,
        region:     identity.region     || null,
        country:    identity.country    || null,
        timezone:   identity.timezone   || null,
        metadata:   {},
      },
      { onConflict: 'email' }
    )
    .select('id')
    .single()

  if (profileErr) throw profileErr
  const profileId = (profile as { id: string }).id

  // 2. Link assessments row
  if (assessmentId) {
    const { error: aErr } = await supabase
      .from('assessments')
      .update({ profile_id: profileId })
      .eq('id', assessmentId)
    if (aErr) throw aErr
  }

  // 3. Link profile_states row
  if (profileStateId) {
    const { error: psErr } = await supabase
      .from('profile_states')
      .update({ profile_id: profileId })
      .eq('id', profileStateId)
    if (psErr) throw psErr
  }

  return { profileId }
}

// ── Identity stitching (post sign-in) ────────────────────────────────────────

/**
 * Called on every successful sign-in.
 *
 * Finds the `profiles` row whose email matches the authenticated user and
 * claims it by setting `user_id` if it is still null.  Idempotent — safe
 * to call on every sign-in regardless of whether the link already exists.
 *
 * Returns the profiles.id if a matching row exists, null otherwise
 * (the user is authenticated but has not yet saved a profile).
 *
 * Normalization: emails are lowercased + trimmed before matching so that
 * case differences between the stored email and the auth provider email
 * never cause a false miss.
 */
export async function linkUserToProfile(
  userId: string,
  email:  string,
): Promise<string | null> {
  // Normalize — both the auth provider and the save flow may differ in case
  const normalizedEmail = email.toLowerCase().trim()

  console.log(
    `[linkUserToProfile] auth email: "${email}" → normalized: "${normalizedEmail}" | userId: ${userId}`
  )

  // ── Step 1: find the profile row ─────────────────────────────────────────
  // Use ilike so any pre-existing rows with non-normalized casing are still
  // found (case-insensitive LIKE match in PostgreSQL).
  const { data: profile, error: selectErr } = await supabase
    .from('profiles')
    .select('id, email, user_id')
    .ilike('email', normalizedEmail)
    .maybeSingle()

  if (selectErr) {
    console.error('[linkUserToProfile] SELECT error:', selectErr.message, selectErr)
    return null
  }

  if (!profile) {
    console.log(
      `[linkUserToProfile] No profile found for normalized email "${normalizedEmail}" — user has not saved a profile yet`
    )
    return null
  }

  const p = profile as { id: string; email: string; user_id: string | null }

  console.log(
    `[linkUserToProfile] Profile found → id: ${p.id} | stored email: "${p.email}" | existing user_id: ${p.user_id ?? 'null'}`
  )

  // ── Step 2: check ownership ──────────────────────────────────────────────
  if (p.user_id === userId) {
    // Already correctly linked — nothing to do
    console.log(`[linkUserToProfile] Already linked to this user — no update needed, returning ${p.id}`)
    return p.id
  }

  if (p.user_id !== null) {
    // Owned by a different user_id — do not overwrite; return the id so the
    // dashboard can still load the profile data.
    console.warn(
      `[linkUserToProfile] Profile ${p.id} is owned by a different user_id (${p.user_id}) — skipping claim, returning id anyway`
    )
    return p.id
  }

  // ── Step 3: claim the unclaimed row ─────────────────────────────────────
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ user_id: userId })
    .eq('id', p.id)

  if (updateErr) {
    console.error(
      `[linkUserToProfile] UPDATE failed for profile ${p.id}:`,
      updateErr.message,
      updateErr
    )
    // Profile exists — return id even if the link write failed so the
    // dashboard can still display data. The link will retry on next sign-in.
    return p.id
  }

  console.log(`[linkUserToProfile] ✓ Linked profile ${p.id} → user ${userId}`)
  return p.id
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildArchetypeDistEntry(id: string, name: string, percentage: number) {
  return { id, name, percentage }
}
