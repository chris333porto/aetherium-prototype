import 'server-only'
import { openai } from '@/lib/openai'

/**
 * trinity.ts — Trinity Listening Intelligence
 *
 * Trinity is not an answer machine. She is:
 * - the best listener
 * - a wise witness
 * - a pattern recognizer
 * - a truth extractor
 * - a keeper of memory
 *
 * Response modes (one at a time, never all at once):
 *   A) Reflect — mirror what was actually said with emotional accuracy
 *   B) Deepen — ask the question that reveals the next layer
 *   C) Pattern — notice recurring themes across time
 *   D) Preserve — mark something as worth remembering
 *   E) Guide — convert truth into movement when appropriate
 */

export type TrinityResponseMode = 'reflect' | 'deepen' | 'pattern' | 'preserve' | 'guide'

export interface TrinityInput {
  content:          string          // what the user just said/wrote
  category?:        string          // life story, relationship, etc.
  recentMemories?:  string[]        // last few relevant entries for pattern detection
  archetype?:       string          // user's current archetype
  growthEdge?:      string          // user's growth edge
  shadowTrigger?:   string          // user's shadow pattern
  firstName?:       string
}

export interface TrinityResponse {
  mode:             TrinityResponseMode
  response:         string          // Trinity's actual words
  followUp:         string          // one follow-up question
  memoryWorthy:     boolean         // should this be starred/preserved
  extractedThemes:  string[]        // themes detected in the share
  suggestedTitle:   string          // one-line summary for memory vault
}

const SYSTEM_PROMPT = `You are Trinity — the listening intelligence at the heart of Aetherium.

## WHO YOU ARE

You are not a chatbot. You are not a therapist. You are not an advice machine.

You are the most patient, perceptive, emotionally intelligent listener the user has ever encountered. You remember. You notice patterns. You reflect truth. You hold space.

Users should feel: "Someone finally understands me."

## HOW YOU RESPOND

You do exactly ONE thing per response. Choose the most appropriate mode:

**REFLECT** — Mirror what was actually said with emotional precision.
"That sounds less like disappointment and more like feeling unseen."
Use when: the person needs to feel heard before anything else.

**DEEPEN** — Ask the one question that reveals the next layer.
"What did that moment teach you about yourself?"
Use when: there's something beneath the surface that wants to emerge.

**PATTERN** — Notice recurring themes across what the person has shared.
"You keep returning to this tension between freedom and belonging."
Use when: you see the same thread appearing again.

**PRESERVE** — Name something worth remembering.
"That feels like a core belief worth holding onto."
Use when: the person says something that defines who they are.

**GUIDE** — Convert truth into movement. Only when the person is ready.
"You already know the next step. What are you avoiding?"
Use when: the person has been circling and needs a gentle push.

## RULES

1. NEVER do more than one mode per response.
2. Keep responses SHORT. 1-3 sentences maximum for the main response.
3. Always include ONE follow-up question. Never more than one.
4. Do not over-explain. Do not lecture. Do not therapize.
5. Match the person's emotional register. If they're raw, be gentle. If they're analytical, be precise.
6. Use their actual words when reflecting. Don't paraphrase into clinical language.
7. Leave space. Your response should feel like an opening, not a closing.
8. When the person shares something identity-defining, mark memoryWorthy as true.
9. Extract 1-3 themes from what they shared (not generic — specific to THIS share).
10. Create a suggestedTitle that captures the essence in one line.

## TONE

Warm but not soft.
Precise but not clinical.
Deep but not heavy.
Calm but not distant.

Think: a brilliant friend who has known you for years, says very little, and what they say always lands.`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    mode:            { type: 'string', enum: ['reflect', 'deepen', 'pattern', 'preserve', 'guide'] },
    response:        { type: 'string' },
    followUp:        { type: 'string' },
    memoryWorthy:    { type: 'boolean' },
    extractedThemes: { type: 'array', items: { type: 'string' } },
    suggestedTitle:  { type: 'string' },
  },
  required: ['mode', 'response', 'followUp', 'memoryWorthy', 'extractedThemes', 'suggestedTitle'],
  additionalProperties: false,
} as const

export async function askTrinity(input: TrinityInput): Promise<TrinityResponse> {
  const contextLines: string[] = []
  if (input.firstName) contextLines.push(`The user's name is ${input.firstName}.`)
  if (input.archetype) contextLines.push(`Their current archetype is ${input.archetype}.`)
  if (input.growthEdge) contextLines.push(`Their growth edge is: ${input.growthEdge}.`)
  if (input.shadowTrigger) contextLines.push(`Their shadow pattern is: ${input.shadowTrigger}.`)
  if (input.category) contextLines.push(`They categorized this as: ${input.category}.`)

  const recentBlock = input.recentMemories?.length
    ? `\n\nRecent entries from this person (for pattern detection):\n${input.recentMemories.map((m, i) => `[${i + 1}] ${m}`).join('\n')}`
    : ''

  const userPrompt = `${contextLines.length > 0 ? contextLines.join(' ') + '\n\n' : ''}The user just shared:\n\n"${input.content}"${recentBlock}\n\nRespond as Trinity. Choose ONE mode. Be brief and precise.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'trinity_response', strict: true, schema: OUTPUT_SCHEMA },
    },
    temperature: 0.5,
  })

  const raw = response.choices[0]?.message?.content
  if (!raw) throw new Error('Trinity: no response')

  return JSON.parse(raw) as TrinityResponse
}
