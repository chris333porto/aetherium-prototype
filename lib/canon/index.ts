/**
 * lib/canon/index.ts
 * Runtime access layer for Aetherium Canon v1.
 *
 * Import from here — never import the JSON directly in product code.
 * This module is the single point of change if the canon is ever versioned.
 */

import canonJson from './aetherium_canon_v1.json'
import type {
  AetheriumCanon,
  RoleDefinition,
  ElementDefinition,
  RoleId,
  Element,
} from '../types/canon'

// ── Typed canon root ──────────────────────────────────────────────────────────

export const CANON = canonJson as AetheriumCanon

// ── Flat collections ──────────────────────────────────────────────────────────

/** All 32 roles in canon order (Fire → Water → Earth → Air → Aether → Meta). */
export const ROLES: RoleDefinition[] = CANON.roles

/** All element definitions in canon order. */
export const ELEMENTS: ElementDefinition[] = CANON.elements

// ── Lookup maps ───────────────────────────────────────────────────────────────

/** O(1) role lookup by id. */
export const ROLES_BY_ID: Record<RoleId, RoleDefinition> =
  Object.fromEntries(CANON.roles.map(r => [r.id, r])) as Record<RoleId, RoleDefinition>

/** Roles grouped by element. */
export const ROLES_BY_ELEMENT: Record<Element, RoleDefinition[]> =
  CANON.roles.reduce(
    (acc, role) => {
      acc[role.element] = [...(acc[role.element] ?? []), role]
      return acc
    },
    {} as Record<Element, RoleDefinition[]>
  )

/** O(1) element lookup by id. */
export const ELEMENTS_BY_ID: Record<Element, ElementDefinition> =
  Object.fromEntries(CANON.elements.map(e => [e.id, e])) as Record<Element, ElementDefinition>

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the RoleDefinition for a given id. Throws if the id is not in canon. */
export function getRole(id: RoleId): RoleDefinition {
  const role = ROLES_BY_ID[id]
  if (!role) throw new Error(`[Canon] Unknown role id: "${id}"`)
  return role
}

/** Returns all roles for a given element. */
export function getRolesByElement(element: Element): RoleDefinition[] {
  return ROLES_BY_ELEMENT[element] ?? []
}

/** Returns the ElementDefinition for a given id. Throws if not in canon. */
export function getElement(id: Element): ElementDefinition {
  const el = ELEMENTS_BY_ID[id]
  if (!el) throw new Error(`[Canon] Unknown element id: "${id}"`)
  return el
}

// ── Language ──────────────────────────────────────────────────────────────────

/** Canonical correct language patterns for role presentation. */
export const ROLE_LANGUAGE_CORRECT: string[] = CANON.language.correct

/** Language patterns explicitly forbidden by the canon. */
export const ROLE_LANGUAGE_INCORRECT: string[] = CANON.language.incorrect

// ── Core triad ────────────────────────────────────────────────────────────────

export const CORE_TRIAD = CANON.core_triad
export const CORE_PRINCIPLE = CANON.core_principle
