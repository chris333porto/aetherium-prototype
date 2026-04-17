import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { askTrinity } from '@/lib/engine/trinity'
import { saveMemory } from '@/lib/persistence/memories'
import type { MemoryType } from '@/lib/persistence/memories'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/trinity
 *
 * Send a voice transcript or text entry to Trinity.
 * Trinity responds with ONE listening mode, saves to memory vault,
 * and returns the response + follow-up question.
 */
export async function POST(request: NextRequest) {
  let body: {
    userId:       string
    accessToken:  string
    content:      string
    category?:    string
    source?:      'text' | 'voice'
    firstName?:   string
    archetype?:   string
    growthEdge?:  string
    shadowTrigger?: string
    voiceNoteId?: string
  }

  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { userId, accessToken, content, category, source, firstName, archetype, growthEdge, shadowTrigger, voiceNoteId } = body

  if (!userId || !accessToken || !content?.trim()) {
    return Response.json({ error: 'Missing required fields' }, { status: 422 })
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
    // Fetch recent memories for pattern detection — prefer same category + starred
    const categoryTag = category?.toLowerCase().replace(/[\s/]+/g, '-')

    // 1. Category-related memories (if category set)
    let relatedMems: { content: string; title: string | null }[] = []
    if (categoryTag) {
      const { data } = await client
        .from('memories')
        .select('content, title')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .contains('tags', [categoryTag])
        .order('created_at', { ascending: false })
        .limit(3)
      relatedMems = (data ?? []) as typeof relatedMems
    }

    // 2. Recent starred memories (for cross-category pattern detection)
    const { data: starredMems } = await client
      .from('memories')
      .select('content, title')
      .eq('user_id', userId)
      .eq('is_starred', true)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(3)

    // 3. Most recent general memories
    const { data: recentMems } = await client
      .from('memories')
      .select('content, title')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(3)

    // Combine, deduplicate, limit to 7
    const allMems = [...relatedMems, ...(starredMems ?? []), ...(recentMems ?? [])]
    const seen = new Set<string>()
    const recentMemories: string[] = []
    for (const m of allMems) {
      const key = m.content.slice(0, 80)
      if (seen.has(key)) continue
      seen.add(key)
      recentMemories.push((m.title ? `[${m.title}] ` : '') + m.content.slice(0, 250))
      if (recentMemories.length >= 7) break
    }

    // Map category to memory_type
    const categoryToType: Record<string, MemoryType> = {
      'Life Story': 'story',
      'Childhood': 'story',
      'Relationship': 'story',
      'Business': 'reflection',
      'Philosophy': 'belief',
      'Pain / Healing': 'story',
      'Insight': 'insight',
      'Lesson Learned': 'teaching',
      'Dream / Vision': 'dream',
      'Creativity': 'reflection',
      'Parenting': 'story',
      'Spirituality': 'belief',
      'Daily Reflection': 'reflection',
      'Current Chapter': 'reflection',
      'Free Speak': 'reflection',
    }

    // Ask Trinity
    const trinityResponse = await askTrinity({
      content: content.trim(),
      category,
      recentMemories,
      firstName,
      archetype,
      growthEdge,
      shadowTrigger,
    })

    // Save user's entry as a memory (linked to audio if available)
    const memory = await saveMemory(client, userId, {
      content: content.trim(),
      title: trinityResponse.suggestedTitle,
      memory_type: categoryToType[category ?? ''] ?? (source === 'voice' ? 'voice_transcript' : 'reflection'),
      source: source ?? 'text',
      tags: [
        ...(category ? [categoryTag ?? ''] : []).filter(Boolean),
        ...(source === 'voice' ? ['voice', 'trinity'] : ['trinity']),
        ...trinityResponse.extractedThemes.slice(0, 3),
      ],
      voice_note_id: voiceNoteId,
    })

    // If memory-worthy, star it
    if (trinityResponse.memoryWorthy) {
      await client.from('memories').update({ is_starred: true }).eq('id', memory.id)
    }

    // Enrich memory with AI themes
    await client.from('memories').update({
      ai_summary: trinityResponse.suggestedTitle,
      ai_themes: trinityResponse.extractedThemes,
    }).eq('id', memory.id)

    // Link transcript back to voice_notes record if it exists
    if (voiceNoteId) {
      try {
        await client.from('voice_notes').update({
          transcript: content.trim(),
          status: 'transcribed',
        }).eq('id', voiceNoteId)
      } catch { /* non-fatal */ }
    }

    // Also save as a reflection for streak tracking
    await client.from('reflections').insert({
      user_id: userId,
      content: content.trim(),
      source_type: 'daily',
      tags: source === 'voice' ? ['voice', 'trinity'] : ['trinity'],
    })

    return Response.json({
      success: true,
      data: {
        trinity: trinityResponse,
        memoryId: memory.id,
      },
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Trinity API]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
