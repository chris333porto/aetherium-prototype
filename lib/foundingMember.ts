import { supabase } from './supabase'

/**
 * Founding-member capture (homepage / festival QR signup).
 *
 * Reuses the `discovery_emails` soft-guestbook table — it already exists in the
 * live DB and has an anon INSERT policy. The optional `source`/`note` columns are
 * added by migration 012; if that migration hasn't been applied yet we fall back
 * to the base columns so capture NEVER fails at a live event.
 */

export type FoundingMemberEntry = {
  email: string
  name?: string
  note?: string
  source?: string
}

type Result = { ok: true } | { ok: false; error: string }

export async function saveFoundingMember(entry: FoundingMemberEntry): Promise<Result> {
  const base = {
    name:   entry.name?.trim() ? entry.name.trim() : null,
    email:  entry.email.trim().toLowerCase(),
    locale: typeof navigator !== 'undefined' ? navigator.language : null,
  }

  const rich = {
    ...base,
    source: entry.source?.trim() || 'founding-member',
    note:   entry.note?.trim() || null,
  }

  try {
    const first = await supabase.from('discovery_emails').insert(rich)
    if (!first.error) return { ok: true }

    // If source/note columns aren't in this DB yet, retry with base columns only.
    const missingColumn =
      first.error.code === 'PGRST204' ||
      /could not find|does not exist/i.test(first.error.message)

    if (missingColumn) {
      const second = await supabase.from('discovery_emails').insert(base)
      if (!second.error) return { ok: true }
      console.warn('[founding] fallback insert failed:', second.error.message)
      return { ok: false, error: second.error.message }
    }

    console.warn('[founding] insert failed:', first.error.message)
    return { ok: false, error: first.error.message }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    console.warn('[founding] insert threw:', msg)
    return { ok: false, error: msg }
  }
}
