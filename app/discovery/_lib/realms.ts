/**
 * Realm data for the Discovery flow.
 *
 * Single source for the triplet (assessment screens) and quadruplet
 * (threshold screens) that appear everywhere the realm is named.
 *
 * The kanji characters are intentionally colocated with the rest of the meta
 * so the MetaLine component can pick them up in a single object and render
 * the Noto Serif JP glyph in the right position.
 *
 * Essence strings are pulled from the locked canon at lib/canon/v1/five-elements.ts.
 * If the canon changes, re-source — do not edit copy here independently.
 */

import type { Dimension } from '@/lib/assessment/questions'
import { FIVE_ELEMENTS } from '@/lib/canon/v1/five-elements'

export interface RealmMeta {
  element:   string    // "Earth"    — shown as uppercase in UI
  kanji:     string    // "地"        — Noto Serif JP at threshold moments only
  dimension: string    // "Body"     — shown as uppercase in UI
  function:  string    // "Action"   — shown as uppercase in UI
  color:     string    // hex accent
  essence:   string    // italic Fraunces line for the Elements teaching card
}

// Build the realm map from the locked canon so we don't duplicate truth.
// Canon has: element, color, dimension (Spirit/Soul/Mind/Heart/Body),
// function (Intention/Volition/Cognition/Emotion/Execution — note "Execution"
// in canon vs the user-facing "Action"), essence, and essentialQuestion.
//
// Function labels in the Discovery UI use the user-approved terms:
//   Action, Emotion, Cognition, Volition, Intention
// These match canon exactly EXCEPT Earth's function, which canon calls
// "Execution" but the user spec calls "Action". We honor the user spec here.

const KANJI: Record<Dimension, string> = {
  earth:  '地',
  water:  '水',
  air:    '風',
  fire:   '火',
  aether: '空',
}

const FUNCTION_LABEL: Record<Dimension, string> = {
  earth:  'Action',      // canon says "Execution"; user-facing copy is "Action"
  water:  'Emotion',
  air:    'Cognition',
  fire:   'Volition',
  aether: 'Intention',
}

export const REALMS: Record<Dimension, RealmMeta> = (() => {
  const out = {} as Record<Dimension, RealmMeta>
  for (const el of FIVE_ELEMENTS) {
    out[el.id] = {
      element:   el.element,
      kanji:     KANJI[el.id],
      dimension: el.dimension,
      function:  FUNCTION_LABEL[el.id],
      color:     el.color,
      essence:   el.essence,
    }
  }
  return out
})()

// Order used for the Elements teaching slip-through AND for the assessment
// traversal. Matches DIMENSIONS_ORDER from lib/assessment/questions.ts:
//   earth → water → air → fire → aether
export const REALM_ORDER: Dimension[] = ['earth', 'water', 'air', 'fire', 'aether']

/**
 * "EARTH · BODY · ACTION" — used on assessment question screens.
 * Plain string; no kanji here.
 */
export function tripletText(d: Dimension): string {
  const r = REALMS[d]
  return `${r.element.toUpperCase()} · ${r.dimension.toUpperCase()} · ${r.function.toUpperCase()}`
}
