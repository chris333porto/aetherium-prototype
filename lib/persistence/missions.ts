/**
 * persistence/missions.ts
 * Persistent daily missions with completion tracking.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type MissionStatus = 'active' | 'completed' | 'deferred' | 'dropped'
export type MissionPriority = 'critical' | 'normal' | 'someday'

export type MissionRow = {
  id:           string
  created_at:   string
  user_id:      string
  title:        string
  notes:        string | null
  target_date:  string
  status:       MissionStatus
  completed_at: string | null
  dimension:    string | null
  priority:     MissionPriority
  is_recurring: boolean
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function createMission(
  client: SupabaseClient,
  userId: string,
  title: string,
  opts?: { notes?: string; dimension?: string; priority?: MissionPriority; target_date?: string }
): Promise<MissionRow> {
  const { data, error } = await client
    .from('missions')
    .insert({
      user_id:     userId,
      title,
      notes:       opts?.notes ?? null,
      dimension:   opts?.dimension ?? null,
      priority:    opts?.priority ?? 'normal',
      target_date: opts?.target_date ?? new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) throw new Error(`createMission: ${error.message}`)
  return data as MissionRow
}

// ── Read ─────────────────────────────────────────────────────────────────────

export async function getTodayMissions(
  client: SupabaseClient,
  userId: string,
): Promise<MissionRow[]> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await client
    .from('missions')
    .select('*')
    .eq('user_id', userId)
    .eq('target_date', today)
    .in('status', ['active', 'completed'])
    .order('created_at', { ascending: true })

  if (error) throw new Error(`getTodayMissions: ${error.message}`)
  return (data ?? []) as MissionRow[]
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function completeMission(client: SupabaseClient, id: string) {
  const { error } = await client
    .from('missions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`completeMission: ${error.message}`)
}

export async function deferMission(client: SupabaseClient, id: string) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const { error } = await client
    .from('missions')
    .update({ target_date: tomorrow.toISOString().split('T')[0], status: 'active' })
    .eq('id', id)
  if (error) throw new Error(`deferMission: ${error.message}`)
}
