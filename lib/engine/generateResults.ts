import 'server-only'
import { openai } from '@/lib/openai'

// ─── Input ────────────────────────────────────────────────────────────────────

export interface GenerateResultsInput {
  userId:         string
  dimensionScores: {
    aether: number
    fire:   number
    air:    number
    water:  number
    earth:  number
  }
  past:        string
  present:     string
  future:      string
  values?:     string[]
  reflections?: string[]
}

// ─── Output ───────────────────────────────────────────────────────────────────

export type DimensionKey = 'aether' | 'fire' | 'air' | 'water' | 'earth'

export type JourneyPhase =
  | 'Dormancy'
  | 'Awakening'
  | 'Initiation'
  | 'Confrontation'
  | 'Expansion'
  | 'Integration'
  | 'Mastery'
  | 'Contribution'

export interface DimensionState {
  score:       number   // 0–100 (echoed from input for self-containedness)
  state:       'blocked' | 'underactive' | 'balanced' | 'strong' | 'dominant'
  interpretation: string  // one precise sentence
}

export interface NextPractice {
  title:            string
  why:              string
  dimension_target: DimensionKey
}

export interface DashboardFocus {
  today:        string   // single highest-leverage action
  this_week:    string   // directional theme for the week
  watch_out_for: string  // the most likely trap / shadow pattern to surface
}

export interface AetheriumResults {
  dimension_states:         Record<DimensionKey, DimensionState>
  strongest_dimension:      DimensionKey
  weakest_dimension:        DimensionKey
  coherence_score:          number        // 0–100
  journey_phase:            JourneyPhase
  primary_mode_of_being:    string        // archetype name, e.g. "Visionary"
  secondary_mode_of_being:  string        // archetype name
  shadow_pattern:           string        // archetype name (shadow category)
  values:                   string[]      // 3–5 core values derived from input
  tension_statement:        string        // single mirror sentence
  growth_edge:              string        // specific dimension + what it unlocks
  next_practices:           NextPractice[]  // 3 practices
  dashboard_focus:          DashboardFocus
}

// ─── JSON Schema (structured output contract) ─────────────────────────────────

const DIMENSION_STATE_SCHEMA = {
  type: 'object',
  properties: {
    score:          { type: 'number' },
    state:          { type: 'string', enum: ['blocked', 'underactive', 'balanced', 'strong', 'dominant'] },
    interpretation: { type: 'string' },
  },
  required:             ['score', 'state', 'interpretation'],
  additionalProperties: false,
} as const

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    dimension_states: {
      type: 'object',
      properties: {
        aether: DIMENSION_STATE_SCHEMA,
        fire:   DIMENSION_STATE_SCHEMA,
        air:    DIMENSION_STATE_SCHEMA,
        water:  DIMENSION_STATE_SCHEMA,
        earth:  DIMENSION_STATE_SCHEMA,
      },
      required:             ['aether', 'fire', 'air', 'water', 'earth'],
      additionalProperties: false,
    },
    strongest_dimension:     { type: 'string', enum: ['aether', 'fire', 'air', 'water', 'earth'] },
    weakest_dimension:       { type: 'string', enum: ['aether', 'fire', 'air', 'water', 'earth'] },
    coherence_score:         { type: 'number' },
    journey_phase: {
      type: 'string',
      enum: ['Dormancy', 'Awakening', 'Initiation', 'Confrontation', 'Expansion', 'Integration', 'Mastery', 'Contribution'],
    },
    primary_mode_of_being:   { type: 'string' },
    secondary_mode_of_being: { type: 'string' },
    shadow_pattern:          { type: 'string' },
    values:                  { type: 'array', items: { type: 'string' } },
    tension_statement:       { type: 'string' },
    growth_edge:             { type: 'string' },
    next_practices: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title:            { type: 'string' },
          why:              { type: 'string' },
          dimension_target: { type: 'string', enum: ['aether', 'fire', 'air', 'water', 'earth'] },
        },
        required:             ['title', 'why', 'dimension_target'],
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
      required:             ['today', 'this_week', 'watch_out_for'],
      additionalProperties: false,
    },
  },
  required: [
    'dimension_states',
    'strongest_dimension',
    'weakest_dimension',
    'coherence_score',
    'journey_phase',
    'primary_mode_of_being',
    'secondary_mode_of_being',
    'shadow_pattern',
    'values',
    'tension_statement',
    'growth_edge',
    'next_practices',
    'dashboard_focus',
  ],
  additionalProperties: false,
} as const

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are the Aetherium Intelligence Engine — a precision self-knowledge system.

## THE AETHERIUM SYSTEM

Aetherium maps human potential across five elemental dimensions, each representing a core force of expression:

| Dimension | Force       | What it governs |
|-----------|-------------|-----------------|
| Aether    | Intention   | Purpose, vision, meaning, the deep "why" |
| Fire      | Volition    | Will, drive, decisiveness, initiation |
| Air       | Cognition   | Thinking, analysis, clarity, pattern recognition |
| Water     | Emotion     | Feeling, connection, regulation, empathy |
| Earth     | Action      | Follow-through, consistency, embodiment, completion |

Each dimension is scored 0–100 and classified:
- 0–20   → blocked (suppressed, inaccessible)
- 21–40  → underactive (present but unreliable)
- 41–60  → balanced (functioning, not yet sharp)
- 61–80  → strong (reliable and expressed)
- 81–100 → dominant (the primary organizing force)

Coherence (0–100) measures internal harmony across all five. High coherence = integrated system. Low coherence = fragmented or polarized expression.

## JOURNEY PHASES (8-stage arc)

Every person is at a specific developmental phase. Read the dimension scores AND the narrative to determine the phase accurately:

1. **Dormancy** — No clear signal. Low across most dimensions. Not yet awake to potential.
2. **Awakening** — One or two dimensions beginning to activate. New awareness opening.
3. **Initiation** — Entering the work consciously. Friction beginning. At least one strong dimension.
4. **Confrontation** — Facing core shadow or imbalance directly. High tension between dimensions.
5. **Expansion** — Actively developing. Multiple dimensions rising. Growth is visible and felt.
6. **Integration** — Bringing previously separate dimensions into alignment. Coherence building.
7. **Mastery** — Deep fluency across most dimensions. Expressing from a stable, refined center.
8. **Contribution** — Beyond self-optimization. Living from wholeness and serving beyond the self.

## ARCHETYPES (MODES OF BEING)

Archetypes are not identity labels — they are current patterns of expression. They can and do change.

Shadow archetypes (operating from deficiency or distortion):
Fragmented, Drifter, Reactor, Suppressor, Overthinker, Escapist, Performer, Dependent

Emerging archetypes (developing, partially expressed):
Initiator, Striver, Analyst, Strategist, Empath, Connector, Operator, Builder

Core archetypes (reliably expressed, well-developed):
Warrior, Architect, Scholar, Visionary, Guide, Guardian, Alchemist, Harmonizer

Integrated archetypes (multi-dimensional, coherent):
Leader, Healer, Sage, Creator, Integrator

Transcendent archetypes (fully expressed, serving beyond self):
Seeker, Orchestrator, Avatar

Select archetypes by matching the dimension score profile and narrative context together.

## NARRATIVE FIELD INTERPRETATION

When narrative context is provided, use it precisely. Do not summarize it — extract signal from it.

**Pattern analysis** (recurring_pattern + avoidance):
- The recurring_pattern reveals the user's most persistent internal obstacle.
- Avoidance reveals what they already know but aren't doing.
- Together, these define the true growth edge — not the obvious one, the real one.
- Both fields should inform shadow_pattern and growth_edge.

**Tension analysis** (recent_challenges + environment):
- recent_challenges names what isn't working on the surface.
- environment names what the person is structurally embedded in — their actual demands and constraints.
- The tension between these two is often the core friction. It should appear in tension_statement.

**Direction extraction** (desired_direction + deeper_pull):
- desired_direction is the stated aspiration — often a plan or outcome.
- deeper_pull is the underlying need — a quality of experience or being.
- The gap between them (if present) is psychologically important. Reflect it in journey_phase and next_practices.

**Energy contextualization** (energy_state + energy_sources):
- energy_state (Scattered/Stuck/Stable/Focused/Driven) is the user's own classification of their current system.
- energy_sources reveal what is already working — use these to anchor at least one next_practice in something accessible.
- A user who is Scattered needs consolidation practices. Stuck needs activation. Stable needs expansion. Focused needs deepening. Driven needs integration.

## TONE AND MANDATE

- Be precise and grounded. No vague spiritual language.
- Focus on growth trajectory, not fixed identity.
- The tension_statement should feel like a mirror — true enough to be uncomfortable.
- Practices must be specific, actionable, and tied to a real dimension gap.
- dashboard_focus.today must be a single concrete action, not a theme.
- All interpretations should reflect what is true right now, and what is becoming possible next.
- When narrative fields are present, interpretations must reference them — not in generic terms, but through the actual content the user provided.`
}

function buildUserPrompt(input: GenerateResultsInput): string {
  const scores = input.dimensionScores

  // Split reflections: first 3 are past/present/future echoes; the rest are
  // the extended narrative fields passed as labeled strings from payload.ts.
  const allReflections = input.reflections ?? []
  const extendedContext = allReflections.slice(3) // Environment, Recurring pattern, Avoidance, Deeper pull, Current energy, Energy sources

  const valuesLine = input.values?.length
    ? `\nCore values (self-reported): ${input.values.join(', ')}`
    : ''

  const extendedBlock = extendedContext.length > 0
    ? `\n## EXTENDED CONTEXT\n${extendedContext.map(r => `${r}`).join('\n')}`
    : ''

  return `Analyze this person and generate their Aetherium intelligence profile.

## DIMENSION SCORES
Earth  (Action):    ${scores.earth}/100
Water  (Emotion):   ${scores.water}/100
Air    (Cognition): ${scores.air}/100
Fire   (Volition):  ${scores.fire}/100
Aether (Intention): ${scores.aether}/100

## NARRATIVE CONTEXT
What's been happening (recent challenges): ${input.past || '(not provided)'}
Current life phase (where they are now):   ${input.present || '(not provided)'}
Where they want to go (desired direction): ${input.future || '(not provided)'}
${valuesLine}${extendedBlock}

## INTERPRETATION INSTRUCTIONS

1. **tension_statement**: Name the specific friction between their scores AND their narrative. If recurring_pattern and avoidance are present, use them — they reveal the real gap, not the obvious one. Write one precise sentence that would feel true enough to be uncomfortable.

2. **growth_edge**: Identify the specific dimension that, if developed, would most unlock movement given their current phase, energy state, and avoidance pattern. Name what it unlocks.

3. **dashboard_focus**:
   - today: One concrete action grounded in their energy sources and strongest dimension.
   - this_week: A directional theme that addresses the friction in their narrative.
   - watch_out_for: The shadow pattern most likely to surface given their recurring_pattern and current energy.

4. **next_practices**: Ground at least one practice in their energy sources (something already working). Address the gap between desired_direction and deeper_pull if both are present.

5. **journey_phase**: Determine from the full picture — scores AND narrative. A high-scoring profile with significant avoidance and stuck energy may be in Confrontation, not Integration.

Generate the complete Aetherium results profile. Every field must reflect the specific person above — not a generic archetype.`
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function generateAetheriumResults(
  input: GenerateResultsInput
): Promise<AetheriumResults> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5.4',
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user',   content: buildUserPrompt(input) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name:   'aetherium_results',
        strict: true,
        schema: OUTPUT_SCHEMA,
      },
    },
    temperature: 0.4,  // precise, not creative
  })

  const raw = response.choices[0]?.message?.content
  if (!raw) {
    throw new Error('generateAetheriumResults: no content returned from model')
  }

  let parsed: AetheriumResults
  try {
    parsed = JSON.parse(raw) as AetheriumResults
  } catch {
    throw new Error(
      `generateAetheriumResults: model returned non-JSON content — ${raw.slice(0, 120)}`
    )
  }

  // Runtime structural guard — catch partial / malformed responses early
  const REQUIRED_KEYS: (keyof AetheriumResults)[] = [
    'dimension_states',
    'strongest_dimension',
    'weakest_dimension',
    'coherence_score',
    'journey_phase',
    'primary_mode_of_being',
    'secondary_mode_of_being',
    'shadow_pattern',
    'values',
    'tension_statement',
    'growth_edge',
    'next_practices',
    'dashboard_focus',
  ]

  const missing = REQUIRED_KEYS.filter(k => !(k in parsed))
  if (missing.length > 0) {
    throw new Error(
      `generateAetheriumResults: parsed response missing required fields: ${missing.join(', ')}`
    )
  }

  return parsed
}
