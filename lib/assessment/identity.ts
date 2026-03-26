/**
 * lib/assessment/identity.ts
 *
 * Canonical type definitions for user identity collected on /assessment/identity.
 * Stored in localStorage under the key `ae_identity`.
 *
 * V1 scope: personal basics required for profile generation.
 * Out of scope (future "complete your profile" flow): education, occupation.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IdentityLocation {
  city?:     string
  region?:   string   // state / province / region
  country?:  string
  timezone?: string   // IANA timezone, e.g. "America/Los_Angeles" — auto-detected
}

export interface UserIdentity {
  firstName: string
  lastName:  string
  email:     string
  birthDate: string          // ISO date: "YYYY-MM-DD"
  location?: IdentityLocation
  phone?:    string          // optional; E.164 or user-entered string
  /** Comma-separated values string (future UI field, not yet collected). */
  values?:   string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Full display name; falls back gracefully if fields are missing. */
export function getDisplayName(identity: Partial<UserIdentity>): string {
  const parts = [identity.firstName, identity.lastName].filter(Boolean)
  return parts.join(' ') || 'Anonymous'
}

/** Safe parse from localStorage JSON; returns partial if malformed. */
export function parseIdentity(raw: string | null): Partial<UserIdentity> {
  if (!raw) return {}
  try { return JSON.parse(raw) as Partial<UserIdentity> }
  catch { return {} }
}

/** localStorage key for identity data. */
export const IDENTITY_STORAGE_KEY = 'ae_identity'
