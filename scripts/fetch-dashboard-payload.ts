/**
 * fetch-dashboard-payload.ts
 *
 * Fetches the closest possible analysis payload for contact@chrisporto.me
 * using the existing schema (no new tables required).
 *
 * Mapping:
 *   user                     ← profiles (id, email, first_name + last_name)
 *   latest_self_discovery    ← latest completed assessment
 *                               + its profile_state (dimension scores)
 *                               + its archetype_result (label)
 *                               + its assessment_answers (responses)
 *   recent_reflections       ← [] (table does not exist yet)
 *   current_context_snapshot ← null (table does not exist yet)
 *   previous_framework_reading ← null (table does not exist yet)
 *   recent_guidance          ← [] (ai_generations exists but is a stub with no records)
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx scripts/fetch-dashboard-payload.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = 'https://hojbkwarfptzhshvszhy.supabase.co'
const TARGET_EMAIL      = 'contact@chrisporto.me'

// Requires service role key — anon key cannot bypass RLS for this user's rows.
// Find it at: Supabase Dashboard → Settings → API → service_role (secret)
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.')
  console.error('Run as: SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx scripts/fetch-dashboard-payload.ts')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

async function run() {
  // ── Step 1: Resolve user identity ─────────────────────────────────────────
  // auth.admin.listUsers() requires service role. We look up by email.
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers()
  if (authErr) throw new Error(`Auth lookup failed: ${authErr.message}`)

  const authUser = users.find(u => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase())
  if (!authUser) throw new Error(`No auth user found for email: ${TARGET_EMAIL}`)

  const userId = authUser.id
  console.error(`Auth user found: ${userId} (${authUser.email})`)

  // ── Step 2: profiles ───────────────────────────────────────────────────────
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, timezone, created_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileErr) throw new Error(`profiles query failed: ${profileErr.message}`)

  // ── Step 3: Latest completed assessment ───────────────────────────────────
  const { data: assessment, error: assessmentErr } = await supabase
    .from('assessments')
    .select('id, completed_at, assessment_version')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (assessmentErr) throw new Error(`assessments query failed: ${assessmentErr.message}`)

  let latestSelfDiscovery = null

  if (assessment) {
    // ── Step 4: profile_state linked to that assessment ────────────────────
    const { data: profileState, error: psErr } = await supabase
      .from('profile_states')
      .select(`
        id,
        aether_score, fire_score, air_score, water_score, earth_score,
        overall_score, coherence_score,
        evolution_state,
        dominant_dimension, deficient_dimension,
        narrative_life_phase, narrative_challenges, narrative_direction,
        narrative_context
      `)
      .eq('assessment_id', assessment.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (psErr) throw new Error(`profile_states query failed: ${psErr.message}`)

    // ── Step 5: archetype_result for that profile_state ───────────────────
    let archetypeResult = null
    if (profileState) {
      const { data: ar, error: arErr } = await supabase
        .from('archetype_results')
        .select(`
          blend_title,
          primary_archetype_name, primary_percentage,
          secondary_archetype_name, secondary_percentage,
          tertiary_archetype_name, tertiary_percentage,
          shadow_archetype_name,
          summary
        `)
        .eq('profile_state_id', profileState.id)
        .maybeSingle()

      if (arErr) throw new Error(`archetype_results query failed: ${arErr.message}`)
      archetypeResult = ar
    }

    // ── Step 6: assessment_answers for that assessment ────────────────────
    const { data: answers, error: answersErr } = await supabase
      .from('assessment_answers')
      .select('question_id, question_type, dimension, answer_numeric, answer_text')
      .eq('assessment_id', assessment.id)

    if (answersErr) throw new Error(`assessment_answers query failed: ${answersErr.message}`)

    // Collapse answers into a compact map: { question_id: value }
    const responsesMap: Record<string, number | string | null> = {}
    for (const row of (answers ?? [])) {
      responsesMap[row.question_id] = row.answer_text ?? row.answer_numeric ?? null
    }

    latestSelfDiscovery = {
      // Mapping: assessments.completed_at
      completed_at: assessment.completed_at,

      // Mapping: assessment_answers collapsed to {question_id: value}
      responses: responsesMap,

      // Mapping: profile_states dimension scores
      dimension_scores: profileState ? {
        aether:    profileState.aether_score,
        fire:      profileState.fire_score,
        air:       profileState.air_score,
        water:     profileState.water_score,
        earth:     profileState.earth_score,
        overall:   profileState.overall_score,
        coherence: profileState.coherence_score,
        evolution_state:      profileState.evolution_state,
        dominant_dimension:   profileState.dominant_dimension,
        deficient_dimension:  profileState.deficient_dimension,
        narrative: {
          life_phase:  profileState.narrative_life_phase,
          challenges:  profileState.narrative_challenges,
          direction:   profileState.narrative_direction,
          ...((profileState.narrative_context as Record<string, string>) ?? {}),
        },
      } : null,

      // Mapping: archetype_results.blend_title (primary_archetype_name as fallback)
      archetype_label: archetypeResult?.blend_title
        ?? archetypeResult?.primary_archetype_name
        ?? null,

      // Mapping: no direct confidence score exists.
      // Using profile_states.coherence_score as the closest structural proxy.
      // coherence_score measures internal consistency of the dimension pattern (0–100).
      archetype_confidence: profileState?.coherence_score ?? null,

      // Additional archetype detail (not in target shape but present in schema)
      archetype_detail: archetypeResult ? {
        blend_title:         archetypeResult.blend_title,
        primary:             { name: archetypeResult.primary_archetype_name,   pct: archetypeResult.primary_percentage },
        secondary:           { name: archetypeResult.secondary_archetype_name, pct: archetypeResult.secondary_percentage },
        tertiary:            { name: archetypeResult.tertiary_archetype_name,  pct: archetypeResult.tertiary_percentage },
        shadow:              { name: archetypeResult.shadow_archetype_name },
        summary:             archetypeResult.summary,
      } : null,
    }
  }

  // ── Step 7: ai_generations — check for any useful records ─────────────────
  // Table exists as a stub. Fetch last 3 complete records if any.
  const { data: aiGens, error: aiErr } = await supabase
    .from('ai_generations')
    .select('id, created_at, generation_type, output_text, parsed_output, status')
    .eq('status', 'complete')
    .order('created_at', { ascending: false })
    .limit(3)

  if (aiErr) throw new Error(`ai_generations query failed: ${aiErr.message}`)

  // ── Assemble payload ───────────────────────────────────────────────────────
  const payload = {
    user: profile ? {
      id:           profile.id,
      email:        profile.email,
      display_name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || null,
      timezone:     profile.timezone,
    } : {
      // Profile row not yet created (user authenticated but hasn't saved a profile)
      id:           userId,
      email:        TARGET_EMAIL,
      display_name: null,
      timezone:     null,
    },

    latest_self_discovery: latestSelfDiscovery,

    // No table exists yet
    recent_reflections: [],

    // No table exists yet
    current_context_snapshot: null,

    // No table exists yet
    previous_framework_reading: null,

    // ai_generations mapped to recent_guidance shape.
    // Returns [] if stub table has no completed records.
    recent_guidance: (aiGens ?? []).map(g => ({
      id:              g.id,
      created_at:      g.created_at,
      generation_type: g.generation_type,
      guidance_text:   g.output_text ?? null,
      parsed_output:   g.parsed_output ?? null,
    })),
  }

  console.log(JSON.stringify(payload, null, 2))
}

run().catch(err => {
  console.error('Fatal error:', err.message)
  process.exit(1)
})
