import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { saveMemory } from '@/lib/persistence/memories'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/voice
 *
 * Receives a voice transcript (from browser Web Speech API) and saves it
 * as both a reflection and a memory vault entry.
 *
 * Body: { userId, accessToken, transcript, mood? }
 */
export async function POST(request: NextRequest) {
  let body: {
    userId:      string
    accessToken: string
    transcript:  string
    mood?:       string
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { userId, accessToken, transcript, mood } = body

  if (!userId || !accessToken || !transcript?.trim()) {
    return Response.json({ error: 'Missing required fields' }, { status: 422 })
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  })

  // Verify auth
  const { data: { user }, error: authErr } = await client.auth.getUser()
  if (authErr || !user || user.id !== userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Save as reflection
    const { data: refl, error: reflErr } = await client
      .from('reflections')
      .insert({
        user_id:     userId,
        content:     transcript.trim(),
        source_type: 'daily',
        mood:        mood ?? null,
        tags:        ['voice'],
      })
      .select('id')
      .single()

    if (reflErr) throw new Error(reflErr.message)

    // 2. Save as memory vault entry
    const memory = await saveMemory(client, userId, {
      content:       transcript.trim(),
      memory_type:   'voice_transcript',
      source:        'voice',
      tags:          ['voice', 'trinity'],
      reflection_id: refl.id,
    })

    return Response.json({
      success: true,
      data: {
        reflectionId: refl.id,
        memoryId:     memory.id,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
