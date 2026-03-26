/**
 * lib/engine/payload.ts
 *
 * Assembles the POST body for POST /api/generate-results from the data
 * collected across the assessment flow.
 *
 * ─── Collection flow ──────────────────────────────────────────────────────────
 *
 *   /onboarding/welcome
 *     └─ no data collected
 *
 *   /assessment/identity               localStorage keys written
 *     ├─ name, email           →  ae_identity            { name, email }
 *     ├─ life_phase            →  ae_narrative_answers   { life_phase, ... }
 *     ├─ recent_challenges     →  ae_narrative_answers
 *     └─ desired_direction     →  ae_narrative_answers
 *
 *   /assessment                        localStorage keys written
 *     └─ 50 Likert answers     →  ae_assessment_answers  { [questionId]: 1–5 }
 *
 *   /generating  ← ASSEMBLE HERE
 *     ├─ computeDimensionScores(ae_assessment_answers)  → dimensionScores
 *     ├─ ae_narrative_answers  → past / present / future (field mapping below)
 *     ├─ ae_identity.email     → userId  (or 'anonymous')
 *     └─ buildGeneratePayload() → GeneratePayload → POST /api/generate-results
 *
 * ─── Field mapping (narrative → API) ─────────────────────────────────────────
 *
 *   life_phase          → present  ("What season of life are you in right now?")
 *   recent_challenges   → past     ("What has been pulling at you lately?")
 *   desired_direction   → future   ("If you could change one thing…")
 *
 *   The UI labels are optimised for user clarity. The API labels follow the
 *   temporal framing expected by the model prompt.
 *
 * ─── `values` — not yet collected ─────────────────────────────────────────────
 *
 *   The API accepts `values?: string[]`. This field is intentionally omitted
 *   until the identity page is updated.
 *
 *   Minimum viable addition (no flow redesign needed):
 *     Add one optional text input to /assessment/identity:
 *       label:       "Core Values  (optional)"
 *       placeholder: "e.g. integrity, clarity, deep work, freedom"
 *     Write to localStorage: ae_identity.values (comma-separated string)
 *     Parse here: ae_identity.values?.split(',').map(s => s.trim()).filter(Boolean)
 *
 * ─── Storage strategy ─────────────────────────────────────────────────────────
 *
 *   TEMPORARY (localStorage, cleared after /results renders):
 *     ae_assessment_answers  — raw Likert responses (assembled into dimensionScores)
 *     ae_narrative_answers   — identity-page prose (assembled into past/present/future)
 *     ae_identity            — name + email (userId source)
 *     ae_assessment_id       — Supabase session row (cleared after /generating)
 *
 *   PERSISTED (localStorage, long-lived):
 *     ae_results             — deterministic ResultPayload (rendered by /results)
 *     ae_profile_state_id    — Supabase profile state ID (for re-fetch)
 *     ae_score_history       — ScoreSnapshot[] (for Progress Over Time)
 *
 *   PERSISTED (Supabase):
 *     assessments            — session metadata
 *     assessment_answers     — individual scored answers with dimension + weight
 *     profile_states         — full scoring + archetype result
 *     archetype_results      — top archetype matches
 *
 *   NOT PERSISTED (assembled at call time):
 *     GeneratePayload        — built fresh from localStorage in /generating,
 *                              POSTed to /api/generate-results, never stored
 */

import { computeDimensionScores, type RawAnswers, type DimensionScores } from '@/lib/scoring/engine'

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The complete, typed POST body for /api/generate-results.
 * Matches the `GenerateResultsInput` interface in lib/engine/generateResults.ts.
 */
export interface GeneratePayload {
  /** Supabase user ID or email; 'anonymous' for unauthenticated users. */
  userId:          string

  /** Deterministic 0–100 scores computed from Likert answers. */
  dimensionScores: DimensionScores

  /**
   * Narrative context — temporal framing for the model prompt.
   * Mapped from identity-page fields; see file-level comment for details.
   */
  past:    string   // ← recent_challenges: "what has been pulling at you"
  present: string   // ← life_phase: "what season of life are you in"
  future:  string   // ← desired_direction: "what you would move toward"

  /**
   * Core values, self-reported. Optional until collected in the UI.
   * When present: string[] of 3–5 single-phrase values, e.g. ["integrity", "depth"].
   */
  values?: string[]

  /**
   * Additional context strings passed verbatim to the model.
   * Currently derived from all three narrative fields as an array.
   */
  reflections?: string[]
}

// ─── Raw localStorage shapes ──────────────────────────────────────────────────

interface StoredIdentity {
  firstName?: string
  lastName?:  string
  email?:     string
  birthDate?: string
  location?:  { city?: string; region?: string; country?: string; timezone?: string }
  phone?:     string
  /** Future: comma-separated values field, not yet in UI. */
  values?:    string
}

interface StoredNarrative {
  // Original fields (persisted to Supabase)
  life_phase?:        string
  recent_challenges?: string
  desired_direction?: string
  // Extended fields (localStorage + AI payload only)
  environment?:       string
  recurring_pattern?: string
  avoidance?:         string
  deeper_pull?:       string
  energy_state?:      string
  energy_sources?:    string
}

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Assemble a `GeneratePayload` from the three data sources written to
 * localStorage during the assessment flow.
 *
 * All arguments are optional — the function falls back safely so a partial
 * flow (e.g. user skipped the identity page) never throws.
 *
 * @example
 * // In /generating page, after the Likert assessment completes:
 * const rawAnswers  = JSON.parse(localStorage.getItem('ae_assessment_answers') ?? '{}')
 * const narrative   = JSON.parse(localStorage.getItem('ae_narrative_answers')  ?? '{}')
 * const identity    = JSON.parse(localStorage.getItem('ae_identity')            ?? '{}')
 *
 * const payload = buildGeneratePayload(rawAnswers, narrative, identity)
 *
 * const res = await fetch('/api/generate-results', {
 *   method:  'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body:    JSON.stringify(payload),
 * })
 */
export function buildGeneratePayload(
  rawAnswers: RawAnswers,
  narrative:  StoredNarrative,
  identity?:  StoredIdentity,
): GeneratePayload {
  // 1. Deterministic scores — no LLM involved
  const dimensionScores = computeDimensionScores(rawAnswers)

  // 2. userId — prefer Supabase ID (set externally); fall back to email or anonymous
  const userId = identity?.email?.trim() || 'anonymous'

  // 3. Narrative → temporal framing
  const present = (narrative.life_phase        ?? '').trim()
  const past    = (narrative.recent_challenges  ?? '').trim()
  const future  = (narrative.desired_direction  ?? '').trim()

  // 4. Values — parse from comma-separated string if present (future UI field)
  const values = identity?.values
    ? identity.values.split(',').map(s => s.trim()).filter(Boolean)
    : undefined

  // 5. Reflections — all 9 narrative fields as labeled strings for the AI.
  //    The three temporal anchors (past/present/future) are already in the top-level
  //    fields; the six additional fields are passed here as labeled context so the
  //    model can use them for richer pattern analysis.
  const extra: string[] = [
    narrative.environment       ? `Environment: ${narrative.environment.trim()}`             : '',
    narrative.recurring_pattern ? `Recurring pattern: ${narrative.recurring_pattern.trim()}` : '',
    narrative.avoidance         ? `Avoidance: ${narrative.avoidance.trim()}`                 : '',
    narrative.deeper_pull       ? `Deeper pull: ${narrative.deeper_pull.trim()}`             : '',
    narrative.energy_state      ? `Current energy: ${narrative.energy_state.trim()}`         : '',
    narrative.energy_sources    ? `Energy sources: ${narrative.energy_sources.trim()}`       : '',
  ].filter(Boolean)

  const reflections = [...[past, present, future].filter(Boolean), ...extra]

  return {
    userId,
    dimensionScores,
    past,
    present,
    future,
    ...(values      && values.length      > 0 ? { values }      : {}),
    ...(reflections && reflections.length > 0 ? { reflections } : {}),
  }
}

// ─── localStorage convenience reader ─────────────────────────────────────────

/**
 * Read all three assessment data sources from localStorage and return a
 * ready-to-POST `GeneratePayload`. Safe to call only in browser context
 * (i.e. inside useEffect or an event handler, never at module level).
 *
 * @example
 * // In /generating page:
 * const payload = readGeneratePayload()
 * await fetch('/api/generate-results', { method: 'POST', body: JSON.stringify(payload) })
 */
export function readGeneratePayload(): GeneratePayload {
  function safeParse<T>(key: string): T {
    try   { return JSON.parse(localStorage.getItem(key) ?? '{}') as T }
    catch { return {} as T }
  }

  const rawAnswers = safeParse<RawAnswers>('ae_assessment_answers')
  const narrative  = safeParse<StoredNarrative>('ae_narrative_answers')
  const identity   = safeParse<StoredIdentity>('ae_identity')

  return buildGeneratePayload(rawAnswers, narrative, identity)
}
