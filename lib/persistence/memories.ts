/**
 * persistence/memories.ts
 * CRUD for the memory vault — stories, beliefs, teachings, insights.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type MemoryType =
  | 'reflection' | 'story' | 'belief' | 'teaching'
  | 'insight' | 'dream' | 'gratitude' | 'letter' | 'voice_transcript'

export type MemorySource = 'text' | 'voice' | 'ai_generated' | 'imported'

export type MemoryRow = {
  id:            string
  created_at:    string
  user_id:       string
  content:       string
  title:         string | null
  memory_type:   MemoryType
  source:        MemorySource
  tags:          string[]
  dimension:     string | null
  life_chapter:  string | null
  ai_summary:    string | null
  ai_themes:     string[] | null
  is_starred:    boolean
  is_archived:   boolean
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function saveMemory(
  client: SupabaseClient,
  userId: string,
  params: {
    content:      string
    title?:       string
    memory_type?: MemoryType
    source?:      MemorySource
    tags?:        string[]
    dimension?:   string
    life_chapter?: string
    reflection_id?: string
    voice_note_id?: string
  }
): Promise<MemoryRow> {
  const { data, error } = await client
    .from('memories')
    .insert({
      user_id:       userId,
      content:       params.content,
      title:         params.title ?? null,
      memory_type:   params.memory_type ?? 'reflection',
      source:        params.source ?? 'text',
      tags:          params.tags ?? [],
      dimension:     params.dimension ?? null,
      life_chapter:  params.life_chapter ?? null,
      reflection_id: params.reflection_id ?? null,
      voice_note_id: params.voice_note_id ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`saveMemory: ${error.message}`)
  return data as MemoryRow
}

// ── Read ─────────────────────────────────────────────────────────────────────

export async function getRecentMemories(
  client: SupabaseClient,
  userId: string,
  opts?: { limit?: number; type?: MemoryType; starred?: boolean }
): Promise<MemoryRow[]> {
  let query = client
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (opts?.type) query = query.eq('memory_type', opts.type)
  if (opts?.starred) query = query.eq('is_starred', true)
  query = query.limit(opts?.limit ?? 20)

  const { data, error } = await query
  if (error) throw new Error(`getRecentMemories: ${error.message}`)
  return (data ?? []) as MemoryRow[]
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function starMemory(client: SupabaseClient, id: string, starred: boolean) {
  const { error } = await client.from('memories').update({ is_starred: starred }).eq('id', id)
  if (error) throw new Error(`starMemory: ${error.message}`)
}

export async function enrichMemory(
  client: SupabaseClient,
  id: string,
  enrichment: { ai_summary?: string; ai_themes?: string[]; ai_dimension?: string }
) {
  const { error } = await client.from('memories').update(enrichment).eq('id', id)
  if (error) throw new Error(`enrichMemory: ${error.message}`)
}
