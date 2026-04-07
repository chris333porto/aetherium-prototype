import { NextRequest }           from 'next/server'
import { createClient }          from '@supabase/supabase-js'
import { runFrameworkAnalysis }  from '@/lib/engine/framework-analysis'
import {
  saveReflection,
  getRecentReflections,
  saveFrameworkReading,
  saveGuidanceOutput,
  type FullReading,
}                                from '@/lib/persistence/reflections'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── POST /api/reflect ─────────────────────────────────────────────────────────
//
// Body:
//   userId:      string  (auth.users.id)
//   accessToken: string  (session.access_token — used to create an authenticated
//                         Supabase client so RLS resolves correctly server-side)
//   content:     string  (the reflection text)
//   mood?:       string
//   tags?:       string[]
//
// Flow:
//   1. Validate + authenticate
//   2. Save the reflection
//   3. Fetch self-discovery context (profile_state + archetype + narrative)
//   4. Fetch last 3 prior reflections for pattern context
//   5. Run framework analysis (Rite → State → Stage → Guidance)
//   6. Save framework_reading + guidance_output
//   7. Return full reading

export async function POST(request: NextRequest) {
  // ── 1. Parse + validate body ───────────────────────────────────────────────

  let body: {
    userId:      string
    accessToken: string
    content:     string
    mood?:       string
    tags?:       string[]
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { userId, accessToken, content, mood, tags } = body

  if (!userId      || typeof userId      !== 'string') return Response.json({ error: 'userId is required'      }, { status: 422 })
  if (!accessToken || typeof accessToken !== 'string') return Response.json({ error: 'accessToken is required' }, { status: 422 })
  if (!content     || typeof content     !== 'string') return Response.json({ error: 'content is required'     }, { status: 422 })
  if (content.trim().length < 3)                       return Response.json({ error: 'Reflection is too short' }, { status: 422 })

  // ── 2. Create authenticated Supabase client ────────────────────────────────
  // Passes the user's JWT so auth.uid() resolves and RLS fires correctly.

  const authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth:   { persistSession: false },
  })

  // Verify the token is valid and belongs to the stated userId
  const { data: { user }, error: authError } = await authSupabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (user.id !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // ── 3. Save the reflection ───────────────────────────────────────────────

    const reflection = await saveReflection(authSupabase, userId, content.trim(), {
      mood,
      tags,
      source_type: 'daily',
    })

    // ── 4. Fetch self-discovery context ──────────────────────────────────────
    // Latest completed assessment → profile_state → archetype_result

    const { data: latestAssessment } = await authSupabase
      .from('assessments')
      .select('id, completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let profileState:    Record<string, unknown> | null = null
    let archetypeResult: Record<string, unknown> | null = null

    if (latestAssessment?.id) {
      const { data: ps } = await authSupabase
        .from('profile_states')
        .select(`
          aether_score, fire_score, air_score, water_score, earth_score,
          coherence_score, evolution_state,
          dominant_dimension, deficient_dimension,
          narrative_life_phase, narrative_challenges, narrative_direction,
          narrative_context
        `)
        .eq('assessment_id', latestAssessment.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      profileState = ps

      if (ps) {
        const { data: ar } = await authSupabase
          .from('archetype_results')
          .select('blend_title, primary_archetype_name')
          .eq('profile_state_id', (ps as { id?: string }).id ?? '')
          .maybeSingle()
        archetypeResult = ar
      }
    }

    // ── 5. Fetch last 3 prior reflections (before the one just saved) ────────

    const priorReflections = await getRecentReflections(authSupabase, userId, 4)
    // The just-saved reflection will appear first; skip it for prior context
    const contextReflections = priorReflections
      .filter(r => r.id !== reflection.id)
      .slice(0, 3)
      .reverse()   // oldest first for chronological context
      .map(r => r.content)

    // ── 6. Assemble framework input ──────────────────────────────────────────

    const nc = (profileState?.narrative_context ?? {}) as Record<string, string>

    const frameworkInput = {
      dimensionScores: {
        intention: (profileState?.aether_score as number) ?? 50,
        volition:  (profileState?.fire_score   as number) ?? 50,
        cognition: (profileState?.air_score    as number) ?? 50,
        emotion:   (profileState?.water_score  as number) ?? 50,
        action:    (profileState?.earth_score  as number) ?? 50,
      },
      narrative: {
        life_phase:        (profileState?.narrative_life_phase  as string) ?? null,
        challenges:        (profileState?.narrative_challenges  as string) ?? null,
        direction:         (profileState?.narrative_direction   as string) ?? null,
        environment:       nc.environment        ?? null,
        recurring_pattern: nc.recurring_pattern  ?? null,
        avoidance:         nc.avoidance          ?? null,
        deeper_pull:       nc.deeper_pull        ?? null,
        energy_state:      nc.energy_state       ?? null,
        energy_sources:    nc.energy_sources     ?? null,
      },
      newReflection:     content.trim(),
      recentReflections: contextReflections,
      archetypeLabel:    (archetypeResult?.blend_title as string)
                         ?? (archetypeResult?.primary_archetype_name as string)
                         ?? null,
    }

    // ── 7. Run framework analysis ────────────────────────────────────────────

    const analysis = await runFrameworkAnalysis(frameworkInput)

    // ── 8. Persist reading + guidance ────────────────────────────────────────

    const reading = await saveFrameworkReading(authSupabase, {
      userId,
      reflectionId:     reflection.id,
      rite:             analysis.rite.name,
      riteConfidence:   analysis.rite.confidence,
      stage:            analysis.stage.name,
      stageConfidence:  analysis.stage.confidence,
      stateJson:        analysis.state,
      reasoningSummary: analysis.reasoning_summary,
    })

    const guidance = await saveGuidanceOutput(authSupabase, {
      userId,
      frameworkReadingId: reading.id,
      whatIsHappening:    analysis.guidance.what_is_happening,
      whatIsBeingAsked:   analysis.guidance.what_is_being_asked,
      nextSteps:          analysis.guidance.next_steps,
      reflectionPrompt:   analysis.guidance.reflection_prompt,
    })

    // ── 9. Return assembled full reading ─────────────────────────────────────

    const fullReading: FullReading = {
      ...reading,
      guidance: guidance,
    }

    return Response.json({
      success: true,
      data: {
        reflectionId: reflection.id,
        reading:      fullReading,
        // Include the rite + stage explanations for immediate display
        analysis: {
          rite_explanation:  analysis.rite.explanation,
          stage_explanation: analysis.stage.explanation,
        },
      },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/reflect] Error:', message)
    return Response.json(
      { error: 'Framework analysis failed', detail: message },
      { status: 500 }
    )
  }
}
