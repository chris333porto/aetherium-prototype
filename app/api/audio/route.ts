import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/audio
 *
 * Receives raw audio blob + userId, uploads to Supabase Storage,
 * creates a voice_notes record, returns the voice_note_id and storage path.
 *
 * Body: FormData with fields: audioBlob (File), userId, accessToken, durationSeconds
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const audioBlob    = formData.get('audioBlob') as File | null
  const userId       = formData.get('userId') as string | null
  const accessToken  = formData.get('accessToken') as string | null
  const durationStr  = formData.get('durationSeconds') as string | null

  if (!audioBlob || !userId || !accessToken) {
    return Response.json({ error: 'Missing audioBlob, userId, or accessToken' }, { status: 422 })
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  })

  const { data: { user }, error: authErr } = await client.auth.getUser()
  if (authErr || !user || user.id !== userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Generate unique path
    const timestamp = Date.now()
    const ext = audioBlob.type.includes('webm') ? 'webm' : audioBlob.type.includes('mp4') ? 'mp4' : 'ogg'
    const storagePath = `${userId}/${timestamp}.${ext}`

    // Upload to Supabase Storage (bucket: voice-notes)
    const buffer = Buffer.from(await audioBlob.arrayBuffer())
    const { error: uploadErr } = await client.storage
      .from('voice-notes')
      .upload(storagePath, buffer, {
        contentType: audioBlob.type || 'audio/webm',
        upsert: false,
      })

    if (uploadErr) {
      // If bucket doesn't exist, try creating it (first-time setup)
      if (uploadErr.message?.includes('not found') || uploadErr.message?.includes('Bucket')) {
        // Can't create buckets with anon key — return helpful error
        return Response.json({
          error: 'Storage bucket "voice-notes" not found. Create it in Supabase Dashboard → Storage → New bucket → name: voice-notes, private.',
          detail: uploadErr.message,
        }, { status: 500 })
      }
      throw new Error(`Upload failed: ${uploadErr.message}`)
    }

    // Create voice_notes record
    const durationSeconds = durationStr ? parseInt(durationStr, 10) : null
    const { data: voiceNote, error: dbErr } = await client
      .from('voice_notes')
      .insert({
        user_id:          userId,
        storage_path:     storagePath,
        duration_seconds: durationSeconds,
        file_size_bytes:  audioBlob.size,
        mime_type:        audioBlob.type || 'audio/webm',
        status:           'pending',
      })
      .select('id')
      .single()

    if (dbErr) throw new Error(`DB insert failed: ${dbErr.message}`)

    return Response.json({
      success: true,
      data: {
        voiceNoteId: voiceNote.id,
        storagePath,
      },
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Audio API]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
