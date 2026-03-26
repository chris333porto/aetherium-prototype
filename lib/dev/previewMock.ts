/**
 * previewMock.ts — DEV ONLY
 *
 * Generates a realistic mock ResultPayload by running the real engine functions
 * against a fixed dimensional profile. Safe to import anywhere but should only
 * be reached when `?preview=1` is in the URL.
 *
 * Profile: Aether-dominant / Water-deficient → Emerging → Integrated boundary.
 * Maps to a Philosophical Seeker blend. Growth edge: Water (Emotion).
 */

import { buildResultPayload } from '@/lib/types/results'
import { buildArchetypeBlend } from '@/lib/archetypes/matcher'
import { buildGrowthProfile } from '@/lib/pathways/growth'
import type { ScoringResult } from '@/lib/scoring/engine'
import type { NarrativeAnswers } from '@/lib/assessment/narrative'

// ─── Scores ──────────────────────────────────────────────────────────────────

export const PREVIEW_SCORES = {
  aether: 72,
  fire:   44,
  air:    63,
  water:  38,
  earth:  55,
}

// ─── Scoring result ───────────────────────────────────────────────────────────

const PREVIEW_SCORING: ScoringResult = {
  dimensions: PREVIEW_SCORES,
  profiles: {
    aether: { score: 72, balance: 'high',   rawAverage: 3.88 },
    fire:   { score: 44, balance: 'medium', rawAverage: 2.76 },
    air:    { score: 63, balance: 'medium', rawAverage: 3.52 },
    water:  { score: 38, balance: 'medium', rawAverage: 2.52 },
    earth:  { score: 55, balance: 'medium', rawAverage: 3.20 },
  },
  coherenceScore: 74,
  overallScore: 54,
}

// ─── Narrative ────────────────────────────────────────────────────────────────

const PREVIEW_NARRATIVE: NarrativeAnswers = {
  life_phase:
    'A period of deliberate transition — moving from a career built for security toward work that carries real meaning.',
  recent_challenges:
    'Difficulty committing to a direction. Clarity arrives in waves: a strong sense of what matters, then a pulling away when action is actually required.',
  desired_direction:
    'To build something aligned with my own values — and to stop deferring the life I can see but have not yet stepped into.',
}

// ─── Full payload (built with real engines) ───────────────────────────────────

export const PREVIEW_RESULT = buildResultPayload(
  PREVIEW_SCORING,
  buildArchetypeBlend(PREVIEW_SCORES),
  buildGrowthProfile(PREVIEW_SCORES),
  PREVIEW_NARRATIVE,
)

// ─── Pre-filled assessment answers (all 50 questions) ────────────────────────
//
// Values chosen to approximately reproduce the PREVIEW_SCORES when run through
// the scoring engine. Primarily used to enable the "Continue →" button on every
// step of the assessment preview without requiring actual user input.

export const PREVIEW_ANSWERS: Record<string, number> = {
  // Aether — high scores → mostly 4s, reversed questions answered low (2)
  ae01: 4, ae02: 4, ae03: 2, ae04: 4, ae05: 4,
  ae06: 2, ae07: 4, ae08: 2, ae09: 4, ae10: 4,
  // Fire — medium-low → mostly 3s
  fi01: 3, fi02: 3, fi03: 3, fi04: 3, fi05: 3,
  fi06: 3, fi07: 3, fi08: 3, fi09: 3, fi10: 3,
  // Air — medium-high → mix of 3s and 4s
  ai01: 4, ai02: 3, ai03: 3, ai04: 4, ai05: 3,
  ai06: 4, ai07: 4, ai08: 3, ai09: 4, ai10: 3,
  // Water — medium-low → mostly 2s and 3s
  wa01: 3, wa02: 3, wa03: 3, wa04: 3, wa05: 3,
  wa06: 3, wa07: 2, wa08: 3, wa09: 3, wa10: 2,
  // Earth — medium → mostly 3s
  ea01: 3, ea02: 3, ea03: 3, ea04: 3, ea05: 3,
  ea06: 3, ea07: 3, ea08: 3, ea09: 3, ea10: 3,
}

// ─── Identity ─────────────────────────────────────────────────────────────────

export const PREVIEW_IDENTITY = {
  name:  'Dev Preview',
  email: 'preview@aetherium.dev',
}

export const PREVIEW_REFLECTIONS = {
  life_phase:          PREVIEW_NARRATIVE.life_phase,
  recent_challenges:   PREVIEW_NARRATIVE.recent_challenges,
  desired_direction:   PREVIEW_NARRATIVE.desired_direction,
}

// ─── Score history (for Progress Over Time section) ───────────────────────────
// Simulates a prior assessment taken ~30 days ago with lower scores,
// showing realistic upward movement after deliberate practice.

export const PREVIEW_HISTORY = [
  {
    date:           '2026-02-24T10:00:00.000Z',
    dimensions:     { aether: 58, fire: 32, air: 51, water: 24, earth: 42 },
    coherenceScore: 61,
    overallScore:   41,
    archetypeName:  'The Seeker',
  },
]
