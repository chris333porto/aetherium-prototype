import 'server-only'
import { openai }             from '@/lib/openai'
import type { StateJson }     from '@/lib/persistence/reflections'

// ── Input ─────────────────────────────────────────────────────────────────────

export type FrameworkInput = {
  // Pre-computed dimension levels (0-40=low, 41-65=moderate, 66-100=high)
  // Mapped: intention=aether, volition=fire, cognition=air, emotion=water, action=earth
  dimensionScores: {
    intention: number   // aether
    volition:  number   // fire
    cognition: number   // air
    emotion:   number   // water
    action:    number   // earth
  }

  // Narrative context from the user's self-discovery assessment
  narrative: {
    life_phase?:        string | null
    challenges?:        string | null
    direction?:         string | null
    environment?:       string | null
    recurring_pattern?: string | null
    avoidance?:         string | null
    deeper_pull?:       string | null
    energy_state?:      string | null
    energy_sources?:    string | null
  }

  // The reflection just submitted (primary signal for Rite and State)
  newReflection: string

  // Up to 3 prior reflections for pattern context (oldest first)
  recentReflections: string[]

  // Optional archetype context to inform Stage inference
  archetypeLabel?: string | null
}

// ── Output ────────────────────────────────────────────────────────────────────

export type FrameworkOutput = {
  rite: {
    name:        string    // one of the Nine Rites
    confidence:  'low' | 'medium' | 'high'
    explanation: string
  }
  state:     StateJson
  stage: {
    name:        string    // one of the Seven Levels
    confidence:  'low' | 'medium' | 'high'
    explanation: string
  }
  guidance: {
    what_is_happening:   string
    what_is_being_asked: string
    next_steps:          string[]   // 1–3 items
    reflection_prompt:   string
  }
  reasoning_summary: string         // one-paragraph summary for storage
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreToLevel(score: number): 'low' | 'moderate' | 'high' {
  if (score <= 40) return 'low'
  if (score <= 65) return 'moderate'
  return 'high'
}

// ── JSON Schema ───────────────────────────────────────────────────────────────

const DIMENSION_ASSESSMENT_SCHEMA = {
  type: 'object',
  properties: {
    level:   { type: 'string', enum: ['low', 'moderate', 'high'] },
    quality: { type: 'string', enum: ['healthy', 'compromised'] },
    note:    { type: 'string' },
  },
  required:             ['level', 'quality', 'note'],
  additionalProperties: false,
} as const

const FRAMEWORK_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    rite: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          enum: [
            'ORIGIN','AWAKENING','INITIATION','CROSSING',
            'ORDEAL','SURRENDER','ILLUMINATION','OFFERING','EMBODIMENT',
          ],
        },
        confidence:  { type: 'string', enum: ['low','medium','high'] },
        explanation: { type: 'string' },
      },
      required:             ['name','confidence','explanation'],
      additionalProperties: false,
    },
    state: {
      type: 'object',
      properties: {
        intention: DIMENSION_ASSESSMENT_SCHEMA,
        volition:  DIMENSION_ASSESSMENT_SCHEMA,
        cognition: DIMENSION_ASSESSMENT_SCHEMA,
        emotion:   DIMENSION_ASSESSMENT_SCHEMA,
        action:    DIMENSION_ASSESSMENT_SCHEMA,
      },
      required:             ['intention','volition','cognition','emotion','action'],
      additionalProperties: false,
    },
    stage: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          enum: [
            'REACTIVE','CONFORMING','AWAKENING','BUILDING',
            'AUTHORING','INTEGRATING','TRANSCENDING',
          ],
        },
        confidence:  { type: 'string', enum: ['low','medium','high'] },
        explanation: { type: 'string' },
      },
      required:             ['name','confidence','explanation'],
      additionalProperties: false,
    },
    guidance: {
      type: 'object',
      properties: {
        what_is_happening:   { type: 'string' },
        what_is_being_asked: { type: 'string' },
        next_steps: {
          type:     'array',
          items:    { type: 'string' },
          minItems: 1,
          maxItems: 3,
        },
        reflection_prompt: { type: 'string' },
      },
      required:             ['what_is_happening','what_is_being_asked','next_steps','reflection_prompt'],
      additionalProperties: false,
    },
    reasoning_summary: { type: 'string' },
  },
  required:             ['rite','state','stage','guidance','reasoning_summary'],
  additionalProperties: false,
} as const

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are the Aetherium Framework Engine.

Your job is to analyze a user's current situation and produce a structured reading using an exact 4-step framework. You must follow the steps in order. Do not blend them.

═══════════════════════════════════════
STEP 1 — RITE (Context)
═══════════════════════════════════════

Identify which of the Nine Rites describes the user's current life situation.
Base this ONLY on explicit situational signals — transitions, challenges, phases.
Do NOT interpret personality or development here.

THE NINE RITES:

1. ORIGIN — inherited structure, default mode, no major disruption.
   "This is just how life is." Not yet cracked open.
   ≠ AWAKENING: has not yet questioned the given reality.

2. AWAKENING — questioning the given reality. Restlessness, longing, dissatisfaction.
   "Something feels off / there must be more."
   ≠ INITIATION: sees the possibility but has not chosen it yet.

3. INITIATION — the first conscious commitment to a new path. Crossing from passive to active.
   "I have decided." A real choice has been made.
   ≠ CROSSING: the decision, not the step into the unknown.

4. CROSSING — has left the familiar and entered new terrain. Identity beginning to destabilize.
   Old frame no longer fully works. Thresholds, transitions.
   ≠ ORDEAL: entered the unknown; Ordeal is when it pushes back.

5. ORDEAL — pressure, friction, resistance, conflict, proving ground.
   "This is hard." The path is testing the person.
   ≠ SURRENDER: active struggle, not yet letting go.

6. SURRENDER — releasing force, control, egoic grasping, or outdated identity.
   Breakdown, grief, humility, laying something down.
   ≠ ILLUMINATION: release without clarity yet.

7. ILLUMINATION — insight, clarity, seeing what was previously obscured.
   "I see it now." Pattern recognition, coherent perspective.
   ≠ OFFERING: sees clearly but hasn't turned it outward.

8. OFFERING — returning with purpose. Teaching, creating, serving, contributing.
   Active giving back of what was learned.
   ≠ EMBODIMENT: active contribution, not yet stable lived expression.

9. EMBODIMENT — the learning is lived naturally. Stable alignment, integrated behavior.
   Conscious and integrated, not inherited and unconscious.
   ≠ ORIGIN: looks ordinary but is fully awake.

═══════════════════════════════════════
STEP 2 — STATE (Five Dimensions)
═══════════════════════════════════════

Assess how the person is currently showing up across five dimensions.
This reflects current expression, NOT developmental level.

Each dimension maps to a score (0–100):
- 0–40   → low
- 41–65  → moderate
- 66–100 → high

You will be given the pre-computed level for each dimension.
Confirm it (or note if the narrative clearly contradicts it), then determine:
- quality: healthy or compromised
- note: one brief sentence grounded in the actual content

THE FIVE DIMENSIONS:

INTENTION (maps to: aether score)
Meaning: clarity of aim, purpose, direction
Healthy: clear, aligned, purposeful, values-aware
Compromised: scattered, aimless, conflicted, drifting

VOLITION (maps to: fire score)
Meaning: will, decision-making, commitment, capacity to choose
Healthy: decisive, committed, courageous, able to act
Compromised: passive, avoidant, indecisive, stuck

COGNITION (maps to: air score)
Meaning: thinking, discernment, perspective-taking
Healthy: clear thinking, nuance, good judgment
Compromised: confusion, distortion, rigidity, black-and-white

EMOTION (maps to: water score)
Meaning: feeling, sensitivity, emotional honesty, connection
Healthy: aware, regulated, connected, able to feel without drowning
Compromised: numb, flooded, avoidant, volatile, defended

ACTION (maps to: earth score)
Meaning: embodiment, execution, follow-through
Healthy: consistent, grounded, responsive, embodied
Compromised: inert, chaotic, inconsistent, all thought/no movement

═══════════════════════════════════════
STEP 3 — STAGE (Seven Levels)
═══════════════════════════════════════

Only AFTER identifying Rite and State, infer the user's developmental Stage.

CRITICAL RULES:
- Do NOT equate eloquent or spiritual language with higher stage
- Do NOT infer advanced stage from a single data point
- Anchor to the LOWEST consistent pattern in the data
- If uncertain, choose the lower stage
- Use 'low' confidence unless the pattern is strongly consistent across multiple signals

THE SEVEN LEVELS:

1. REACTIVE — Survive
   Fear-based, impulsive, low self-reflection. Life happens to them.
   Signals: blame, urgency, little perspective, no self-observation.

2. CONFORMING — Belong
   Identity shaped by group norms, approval, external authority.
   Signals: "should," borrowed identity, strong reliance on social expectations.

3. AWAKENING — See
   Self-awareness beginning. Questioning inherited assumptions.
   Signals: self-questioning, discomfort with old identity, searching.

4. BUILDING — Stabilize
   Developing discipline, structure, practical agency.
   Signals: responsibility, routines, effort to build a stable life.

5. AUTHORING — Direct
   Internally directed, values-driven, self-authored path.
   Signals: clear values, chosen mission, internally anchored choices.

6. INTEGRATING — Unify
   Holds complexity, paradox, shadow, multiple perspectives.
   Signals: both/and logic, shadow integration, nuanced identity.

7. TRANSCENDING — Serve
   Deeply aligned with the whole. Less ego-identified.
   Signals: non-attachment, service, universality, whole-system concern.

═══════════════════════════════════════
STEP 4 — GUIDANCE
═══════════════════════════════════════

Combine Rite (what is happening) + State (how they are showing up) + Stage (what they can hold).
Generate guidance calibrated to what is true right now.

what_is_happening: one clear paragraph naming the situation
what_is_being_asked: one paragraph naming what this moment requires
next_steps: 1–3 concrete, specific actions (not themes, not principles)
reflection_prompt: one useful question that opens what most needs to be seen

TONE:
- Precise and grounded. No vague spiritual encouragement.
- Speak to the actual content the person provided, not to a generic archetype.
- The next steps should be the smallest useful unit of action, not a life plan.
- If something is explicitly being avoided, name it.

═══════════════════════════════════════
GUARDRAILS
═══════════════════════════════════════

- Never collapse stage, state, and rite into one judgment
- Never assume stage from emotional tone alone
- Prioritize usefulness over certainty
- If information is insufficient, choose lower confidence and say what is missing in reasoning_summary`
}

// ── User prompt ───────────────────────────────────────────────────────────────

function buildUserPrompt(input: FrameworkInput): string {
  const { dimensionScores, narrative, newReflection, recentReflections, archetypeLabel } = input

  const levels = {
    intention: scoreToLevel(dimensionScores.intention),
    volition:  scoreToLevel(dimensionScores.volition),
    cognition: scoreToLevel(dimensionScores.cognition),
    emotion:   scoreToLevel(dimensionScores.emotion),
    action:    scoreToLevel(dimensionScores.action),
  }

  const priorBlock = recentReflections.length > 0
    ? `\n## PRIOR REFLECTIONS (oldest first — for pattern context)\n${recentReflections.map((r, i) => `[${i + 1}] ${r}`).join('\n\n')}\n`
    : ''

  const narrativeBlock = Object.entries(narrative)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
    .join('\n')

  return `Analyze this person using the 4-step framework. Follow the steps in order.

## NEW REFLECTION (primary signal)
${newReflection}
${priorBlock}
## SELF-DISCOVERY NARRATIVE
${narrativeBlock || '(not provided)'}

## DIMENSION SCORES
These are pre-computed from assessment responses. Use as anchors for State assessment.

  Intention (aether): ${dimensionScores.intention}/100 → ${levels.intention}
  Volition  (fire):   ${dimensionScores.volition}/100 → ${levels.volition}
  Cognition (air):    ${dimensionScores.cognition}/100 → ${levels.cognition}
  Emotion   (water):  ${dimensionScores.emotion}/100 → ${levels.emotion}
  Action    (earth):  ${dimensionScores.action}/100 → ${levels.action}

${archetypeLabel ? `## ARCHETYPE CONTEXT\n${archetypeLabel} — use as a soft signal for Stage inference only, not as a conclusion.\n` : ''}
## INSTRUCTIONS

1. Determine Rite from the life situation signals (reflection + narrative). Be cautious if context is thin — use lower confidence.

2. Assess State across all five dimensions. Use the pre-computed levels as anchors. Override if the narrative clearly contradicts the score. Determine healthy/compromised from the actual content, not just the score.

3. Infer Stage from the lowest consistent behavioral pattern across all inputs. Do NOT infer from vocabulary sophistication or spiritual language. If uncertain, default lower with low confidence.

4. Generate Guidance specific to this person's current Rite, State, and Stage. Name what the Ordeal or transition is actually asking. Give concrete next steps, not principles.

5. Write a reasoning_summary (one paragraph) that captures why you landed on each determination. Include what you were uncertain about.`
}

// ── Main function ─────────────────────────────────────────────────────────────

export async function runFrameworkAnalysis(
  input: FrameworkInput
): Promise<FrameworkOutput> {
  const response = await openai.chat.completions.create({
    model:       'gpt-5.4',
    temperature: 0.3,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user',   content: buildUserPrompt(input) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name:   'framework_analysis',
        strict: true,
        schema: FRAMEWORK_OUTPUT_SCHEMA,
      },
    },
  })

  const raw = response.choices[0]?.message?.content
  if (!raw) throw new Error('runFrameworkAnalysis: no content returned from model')

  let parsed: FrameworkOutput
  try {
    parsed = JSON.parse(raw) as FrameworkOutput
  } catch {
    throw new Error(
      `runFrameworkAnalysis: model returned non-JSON — ${raw.slice(0, 120)}`
    )
  }

  // Structural guard
  const required: (keyof FrameworkOutput)[] = ['rite', 'state', 'stage', 'guidance', 'reasoning_summary']
  const missing = required.filter(k => !(k in parsed))
  if (missing.length > 0) {
    throw new Error(`runFrameworkAnalysis: missing required fields: ${missing.join(', ')}`)
  }

  return parsed
}
