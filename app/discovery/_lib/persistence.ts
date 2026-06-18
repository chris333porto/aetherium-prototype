/**
 * Thin persistence helpers for the /discovery flow.
 *
 * Writes go directly via the Supabase client. Fire-and-forget; failures log
 * to console but never block the UI.
 *
 * Requires migration 011 (adds assessments.source + creates discovery_emails
 * with name/email/archetype_id/locale). If unapplied, writes fail silently
 * and the flow still completes for the user.
 */

import { supabase } from '@/lib/supabase'
import type { Dimension } from '@/lib/assessment/questions'

interface GuestbookEntry {
  name?:        string
  email:        string
  archetypeId?: string
}

/**
 * Record a guestbook signature. Pre-auth; no user_id.
 * Name is optional (guestbook convention — some sign, some don't).
 */
export async function signGuestbook({ name, email, archetypeId }: GuestbookEntry): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const { error } = await supabase
      .from('discovery_emails')
      .insert({
        name:         name?.trim() ? name.trim() : null,
        email:        email.trim().toLowerCase(),
        archetype_id: archetypeId ?? null,
        locale:       typeof navigator !== 'undefined' ? navigator.language : null,
      })

    if (error) {
      console.warn('[discovery] guestbook insert failed:', error.message)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    console.warn('[discovery] guestbook insert threw:', msg)
    return { ok: false, error: msg }
  }
}

// ─── Discovery → trial handoff ─────────────────────────────────────────────────

interface DiscoveryResultPayload {
  token:             string
  name?:             string | null
  email?:            string | null
  archetypeId:       string
  archetypeName?:    string | null
  dimensionScores:   Record<Dimension, number>
  dominantDimension: Dimension
}

/**
 * Persist the FULL computed discovery result (archetype + 5 dimension scores)
 * to a token-addressable row so the separate, auth-less practice app can fetch
 * it via the get_discovery_result(token) RPC and populate the trial Profile.
 *
 * Requires migration 013 (discovery_results + get_discovery_result RPC). If
 * unapplied, the insert fails silently — the welcome-home page still renders
 * and the CTA still links across (the practice app just falls back to its own
 * "begin discovery" empty state). Fire-and-forget, never blocks the UI.
 */
export async function saveDiscoveryResult(p: DiscoveryResultPayload): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const { error } = await supabase
      .from('discovery_results')
      .insert({
        token:              p.token,
        name:               p.name?.trim() ? p.name.trim() : null,
        email:              p.email?.trim() ? p.email.trim().toLowerCase() : null,
        archetype_id:       p.archetypeId,
        archetype_name:     p.archetypeName ?? null,
        dimension_scores:   p.dimensionScores,
        dominant_dimension: p.dominantDimension,
      })

    if (error) {
      console.warn('[discovery] result insert failed:', error.message)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    console.warn('[discovery] result insert threw:', msg)
    return { ok: false, error: msg }
  }
}
