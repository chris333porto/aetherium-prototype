import 'server-only'
import { openai } from '@/lib/openai'

/**
 * generateResults.ts — CANON-AWARE ASSESSMENT INTERPRETATION ENGINE
 *
 * This engine enriches the deterministic assessment output with AI-generated
 * contextual interpretation. It does NOT determine archetype, shadow, growth
 * edge, or dimension scores — those are already computed deterministically
 * by the scoring engine and archetype matcher.
 *
 * What it DOES:
 *   - Detect Life Chapter (from canon: 12 chapters)
 *   - Detect Meaning Level (from canon: 7 levels)
 *   - Assess Flow Conditions (from canon: 4 conditions)
 *   - Assess Calling Orientation (from canon: 4 aims)
 *   - Generate a contextual tension statement grounded in narrative
 *   - Generate 1–3 specific practices informed by narrative context
 *   - Generate a dashboard focus (today/this_week/watch_out_for)
 *   - Generate a reflection question to begin the daily practice
 *
 * What it receives as CONTEXT (already determined, not re-derived):
 *   - Dimension scores
 *   - Matched archetype name + category + growth edge + shadow trigger
 *   - Signal quality
 *   - Narrative responses from the user
 */

// ─── Input ───────────────────────────────────────────────────────────────────

export interface GenerateResultsInput {
  // Deterministic outputs (passed as context, NOT to be re-derived)
  dimensionScores: {
    aether: number
    fire:   number
    air:    number
    water:  number
    earth:  number
  }
  dominantDimension:   string
  deficientDimension:  string
  overallScore:        number
  coherenceScore:      number

  // Archetype context (already matched deterministically)
  archetypeName:       string   // e.g. "The Strategist"
  archetypeCategory:   string   // core | expansion | shadow | transcendent
  growthEdge:          string   // e.g. "Act (Earth)"
  shadowTrigger:       string   // e.g. "Overthinking"

  // Signal quality
  signalConfidence:    string   // high | moderate | low
  isBalancedSystem:    boolean

  // Narrative context from user
  past:    string              // recent challenges
  present: string              // recurring pattern / current state
  future:  string              // desired direction
}

// ─── Output (canon-aligned) ──────────────────────────────────────────────────

export type LifeChapterId =
  | 'initiation' | 'expansion' | 'stability' | 'plateau'
  | 'transition' | 'disruption' | 'contraction' | 'reconstruction'
  | 'integration' | 'emergence' | 'overload' | 'renewal'

export type MeaningLevelId =
  | 'survival' | 'desire' | 'belonging' | 'achievement'
  | 'awakening' | 'integration_meaning' | 'transcendence'

export interface FlowSnapshot {
  activation:    number  // 1–10
  alignment:     number  // 1–10
  attunement:    number  // 1–10
  attentiveness: number  // 1–10
}

export interface CallingSnapshot {
  connection:   number   // 1–10
  contribution: number   // 1–10
  creativity:   number   // 1–10
  capability:   number   // 1–10
}

export interface ContextualPractice {
  title:            string
  why:              string
  dimension_target: string
}

export interface DashboardFocus {
  today:         string
  this_week:     string
  watch_out_for: string
}

export interface CanonEnrichment {
  life_chapter:            LifeChapterId
  life_chapter_confidence: 'low' | 'medium' | 'high'
  life_chapter_explanation: string

  meaning_level:            MeaningLevelId
  meaning_level_confidence: 'low' | 'medium' | 'high'
  meaning_level_explanation: string

  flow_snapshot:      FlowSnapshot
  calling_snapshot:   CallingSnapshot

  tension_statement:  string      // contextual, grounded in narrative
  next_practices:     ContextualPractice[]
  dashboard_focus:    DashboardFocus
  reflection_question: string     // one question for first reflection
}

// ─── JSON Schema ─────────────────────────────────────────────────────────────

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    life_chapter:             { type: 'string', enum: ['initiation','expansion','stability','plateau','transition','disruption','contraction','reconstruction','integration','emergence','overload','renewal'] },
    life_chapter_confidence:  { type: 'string', enum: ['low','medium','high'] },
    life_chapter_explanation: { type: 'string' },

    meaning_level:             { type: 'string', enum: ['survival','desire','belonging','achievement','awakening','integration_meaning','transcendence'] },
    meaning_level_confidence:  { type: 'string', enum: ['low','medium','high'] },
    meaning_level_explanation: { type: 'string' },

    flow_snapshot: {
      type: 'object',
      properties: {
        activation:    { type: 'number' },
        alignment:     { type: 'number' },
        attunement:    { type: 'number' },
        attentiveness: { type: 'number' },
      },
      required: ['activation','alignment','attunement','attentiveness'],
      additionalProperties: false,
    },

    calling_snapshot: {
      type: 'object',
      properties: {
        connection:   { type: 'number' },
        contribution: { type: 'number' },
        creativity:   { type: 'number' },
        capability:   { type: 'number' },
      },
      required: ['connection','contribution','creativity','capability'],
      additionalProperties: false,
    },

    tension_statement:   { type: 'string' },
    reflection_question: { type: 'string' },

    next_practices: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title:            { type: 'string' },
          why:              { type: 'string' },
          dimension_target: { type: 'string', enum: ['aether','fire','air','water','earth'] },
        },
        required: ['title','why','dimension_target'],
        additionalProperties: false,
      },
    },

    dashboard_focus: {
      type: 'object',
      properties: {
        today:         { type: 'string' },
        this_week:     { type: 'string' },
        watch_out_for: { type: 'string' },
      },
      required: ['today','this_week','watch_out_for'],
      additionalProperties: false,
    },
  },
  required: [
    'life_chapter','life_chapter_confidence','life_chapter_explanation',
    'meaning_level','meaning_level_confidence','meaning_level_explanation',
    'flow_snapshot','calling_snapshot',
    'tension_statement','reflection_question',
    'next_practices','dashboard_focus',
  ],
  additionalProperties: false,
} as const

// ─── Prompt builders ─────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are the Aetherium Intelligence Engine — a canon-aware interpretation system.

You are given a person's assessment results (dimension scores, matched archetype, growth edge, shadow trigger). These are ALREADY DETERMINED. Do not re-derive them.

Your job is to enrich the profile with contextual interpretation using four canonical frameworks:

## 1. LIFE CHAPTERS (12 terrains — cyclical, not linear)

Detect which chapter the person is currently in based on their narrative context:

| Chapter | Essence | Core Risk |
|---------|---------|-----------|
| Initiation | Beginning something new | Waiting for certainty |
| Expansion | Momentum rising | Overextension |
| Stability | Maintaining structure | Stagnation |
| Plateau | Flat progress, hidden growth | Mistaking invisibility for failure |
| Transition | Between identities | Forcing premature certainty |
| Disruption | Shock, crisis, rupture | Rigid resistance |
| Contraction | Inward pull, grief, slowdown | Believing it is permanent |
| Reconstruction | Rebuilding after collapse | Rebuilding too fast |
| Integration | Making sense of experience | Endless processing |
| Emergence | New pattern coming online | Protecting the old self |
| Overload | Too many demands | Burnout |
| Renewal | Vitality returning | Staying passive too long |

Chapters are NOT developmental stages. A person may revisit any chapter multiple times. Base detection on narrative signals, not on scores alone.

## 2. SEVEN LEVELS OF MEANING (value structures)

Detect the dominant meaning-making lens:

| Level | Core Orientation | Identity Logic |
|-------|-----------------|----------------|
| Survival | Safety | "I need to stay safe" |
| Desire | Pleasure/Identity | "I am what I pursue" |
| Belonging | Relationship | "I am loved, therefore I am" |
| Achievement | Mastery/Results | "I am what I accomplish" |
| Awakening | Truth/Awareness | "I seek what is true" |
| Integration | Wholeness/Systems | "I seek to make the whole work" |
| Transcendence | Service/Devotion | "I am here to serve something larger" |

Different life domains may operate from different levels simultaneously. Base detection on values expressed in narrative, not assumed from scores.

## 3. FOUR CONDITIONS FOR FLOW (operating state)

Rate each condition 1–10 based on the full picture (scores + narrative):

| Condition | What it means |
|-----------|---------------|
| Activation | Energy converted into motion. Willingness to begin. |
| Alignment | Values, priorities, and direction are congruent. |
| Attunement | Sensitive connection to reality, timing, self, others. |
| Attentiveness | Stable presence directed toward what matters. |

## 4. FOUR AIMS OF CALLING (energy direction)

Rate each aim 1–10 based on what the person is currently oriented toward:

| Aim | Essence |
|-----|---------|
| Connection | Relationship, resonance, belonging |
| Contribution | Service, usefulness, impact |
| Creativity | Expression, originality, bringing forth the new |
| Capability | Mastery, competence, discipline |

## INTERPRETATION MANDATE

- The archetype, shadow, growth edge, and scores are GIVEN. Do not contradict them.
- The tension_statement must be grounded in the narrative, not generic.
- Practices must be specific and actionable — tied to the person's actual situation.
- dashboard_focus.today must be a single concrete action.
- The reflection_question should open what most needs to be seen.
- Be precise. No vague spiritual language. No flattery.`
}

function buildUserPrompt(input: GenerateResultsInput): string {
  return `Interpret this person's assessment results using the four canonical frameworks.

## DETERMINISTIC RESULTS (already computed — do not change)

Archetype: ${input.archetypeName}
Category: ${input.archetypeCategory}
Growth Edge: ${input.growthEdge}
Shadow Trigger: ${input.shadowTrigger}

## DIMENSION SCORES
Spirit  (Intention): ${input.dimensionScores.aether}/100
Soul    (Volition):  ${input.dimensionScores.fire}/100
Mind    (Cognition): ${input.dimensionScores.air}/100
Heart   (Emotion):   ${input.dimensionScores.water}/100
Body    (Execution): ${input.dimensionScores.earth}/100

Overall: ${input.overallScore}/100
Coherence: ${input.coherenceScore}/100
Dominant: ${input.dominantDimension}
Deficient: ${input.deficientDimension}
Signal confidence: ${input.signalConfidence}
Balanced system: ${input.isBalancedSystem}

## NARRATIVE CONTEXT
Recent challenges: ${input.past || '(not provided)'}
Current situation: ${input.present || '(not provided)'}
Desired direction: ${input.future || '(not provided)'}

## INSTRUCTIONS

1. Detect **Life Chapter** from the narrative signals. If narrative is thin, use low confidence.
2. Detect **Meaning Level** from the values expressed. Default to achievement if unclear.
3. Rate **Flow Conditions** (1–10 each) from the full picture.
4. Rate **Calling Aims** (1–10 each) from what the person is oriented toward.
5. Write a **tension_statement** that names the specific friction this person is living — grounded in their narrative, not generic.
6. Write 1–3 **next_practices** that are specific, actionable, and tied to their growth edge and narrative context.
7. Write **dashboard_focus** with a concrete today action, a weekly theme, and the shadow pattern to watch for.
8. Write one **reflection_question** that opens what most needs to be seen for this person.

Every output must reflect THIS person — not a generic profile.`
}

// ─── Main function ───────────────────────────────────────────────────────────

export async function generateAetheriumResults(
  input: GenerateResultsInput
): Promise<CanonEnrichment> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user',   content: buildUserPrompt(input) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name:   'aetherium_canon_enrichment',
        strict: true,
        schema: OUTPUT_SCHEMA,
      },
    },
    temperature: 0.4,
  })

  const raw = response.choices[0]?.message?.content
  if (!raw) {
    throw new Error('generateAetheriumResults: no content returned from model')
  }

  let parsed: CanonEnrichment
  try {
    parsed = JSON.parse(raw) as CanonEnrichment
  } catch {
    throw new Error(
      `generateAetheriumResults: model returned non-JSON — ${raw.slice(0, 120)}`
    )
  }

  // Runtime guard
  const REQUIRED: (keyof CanonEnrichment)[] = [
    'life_chapter', 'life_chapter_confidence', 'life_chapter_explanation',
    'meaning_level', 'meaning_level_confidence', 'meaning_level_explanation',
    'flow_snapshot', 'calling_snapshot',
    'tension_statement', 'reflection_question',
    'next_practices', 'dashboard_focus',
  ]

  const missing = REQUIRED.filter(k => !(k in parsed))
  if (missing.length > 0) {
    throw new Error(
      `generateAetheriumResults: missing fields: ${missing.join(', ')}`
    )
  }

  return parsed
}

// ─── Re-export types for consumers ───────────────────────────────────────────

export type { GenerateResultsInput as CanonEnrichmentInput }
