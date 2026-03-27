/**
 * types/canon.ts
 * TypeScript types for Aetherium Canon v1.
 *
 * Source of truth: lib/canon/aetherium_canon_v1.json
 * Do not add, remove, or rename anything without a versioned canon update.
 */

// ── Primitives ────────────────────────────────────────────────────────────────

export type Element =
  | 'fire'
  | 'water'
  | 'earth'
  | 'air'
  | 'aether'
  | 'meta'

export type RoleId =
  // Fire
  | 'warrior'
  | 'creator'
  | 'performer'
  | 'storyteller'
  | 'visionary'
  | 'igniter'
  // Water
  | 'healer'
  | 'guide'
  | 'mediator'
  | 'partner'
  | 'advocate'
  | 'anchor'
  // Earth
  | 'builder'
  | 'operator'
  | 'maker'
  | 'engineer'
  | 'organizer'
  | 'steward'
  // Air
  | 'strategist'
  | 'analyst'
  | 'researcher'
  | 'teacher'
  | 'advisor'
  | 'navigator'
  // Aether
  | 'leader'
  | 'orchestrator'
  | 'architect'
  | 'connector'
  | 'catalyst'
  | 'alchemist'
  // Meta
  | 'explorer'
  | 'founder'

export type RoleName =
  // Fire
  | 'Warrior'
  | 'Creator'
  | 'Performer'
  | 'Storyteller'
  | 'Visionary'
  | 'Igniter'
  // Water
  | 'Healer'
  | 'Guide'
  | 'Mediator'
  | 'Partner'
  | 'Advocate'
  | 'Anchor'
  // Earth
  | 'Builder'
  | 'Operator'
  | 'Maker'
  | 'Engineer'
  | 'Organizer'
  | 'Steward'
  // Air
  | 'Strategist'
  | 'Analyst'
  | 'Researcher'
  | 'Teacher'
  | 'Advisor'
  | 'Navigator'
  // Aether
  | 'Leader'
  | 'Orchestrator'
  | 'Architect'
  | 'Connector'
  | 'Catalyst'
  | 'Alchemist'
  // Meta
  | 'Explorer'
  | 'Founder'

// ── Core types ────────────────────────────────────────────────────────────────

/** One of the 32 canonical roles from Aetherium Canon v1. */
export interface RoleDefinition {
  id:          RoleId
  name:        RoleName
  element:     Element
  /** Brief one-line description from the role listing in the canon. */
  tagline:     string
  /** Core function — what the role does. */
  function:    string
  /** Shadow pattern — what goes wrong when the role overextends or distorts. */
  shadow:      string
  /** Growth edge — the developmental challenge for this role. */
  growth_edge: string
}

/** One of the five elemental domains or the meta domain. */
export interface ElementDefinition {
  id:       Element
  name:     string
  /** Short header from the role-listing section of the canon. */
  domain:   string
  /** From the "How Roles Map to the Five Elements" section. */
  emphasis: string
}

// ── Triad ─────────────────────────────────────────────────────────────────────

export interface TriadEntry {
  name:             string
  definition:       string
  correct_language?: string[]
  avoid_language?:  string[]
}

export interface CoreTriad {
  role:      TriadEntry
  context:   TriadEntry
  direction: TriadEntry
}

// ── Full canon ────────────────────────────────────────────────────────────────

export interface AetheriumCanon {
  version:         string
  canonical_rule:  string
  purpose:         string
  core_principle:  string
  core_triad:      CoreTriad
  elements:        ElementDefinition[]
  roles:           RoleDefinition[]
  language: {
    correct:   string[]
    incorrect: string[]
  }
  overlap_risks: string[][]
}
