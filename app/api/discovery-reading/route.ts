import { NextRequest } from 'next/server'
import { openai } from '@/lib/openai'

// ─── POST /api/discovery-reading ─────────────────────────────────────────────
//
// Personalizes the Self-Discovery result WITHOUT requiring narrative input
// (unlike /api/generate-results). It writes a warm, second-person reading
// grounded in the person's actual five-energy scores + matched archetype +
// the locked canon fields — so the prose feels individual, not a template.
//
// The discovery flow stays low-friction (no extra capture step); the client
// falls back to the static archetype copy if this fails or the key is unset.

export const runtime = 'nodejs'

interface Body {
  name?: string | null
  archetypeName: string
  archetypeCategory: string
  corePattern?: string
  coreTension?: string
  whenAligned?: string
  whenMisaligned?: string
  rebalancingPath?: string
  practiceOrientation?: string
  growthEdge?: string
  shadowTrigger?: string
  dominantDimension: string
  dimensionScores: Record<string, number>
}

const DIM_ENERGY: Record<string, string> = {
  aether: 'Aether (Intention)',
  fire: 'Fire (Volition)',
  air: 'Air (Cognition)',
  water: 'Water (Emotion)',
  earth: 'Earth (Action)',
}

export async function POST(request: NextRequest) {
  let b: Body
  try { b = (await request.json()) as Body } catch {
    return Response.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }
  if (!b?.archetypeName || !b?.dimensionScores) {
    return Response.json({ ok: false, error: 'missing fields' }, { status: 400 })
  }

  const entries = Object.entries(b.dimensionScores)
  const sorted = [...entries].sort((a, c) => c[1] - a[1])
  const deficient = sorted[sorted.length - 1]?.[0] ?? 'earth'
  const scoreLine = entries
    .map(([d, v]) => `${DIM_ENERGY[d] ?? d}: ${Math.round(v)}/100`)
    .join(', ')

  const system =
    'You are Aetherium — a contemplative system that mirrors a person back to themselves. ' +
    'You write a short, personal Self-Discovery reading. Voice: second person, warm, grounded, ' +
    'a little spare. No hype, no horoscope clichés, no flattery, no jargon. Speak TO the person, ' +
    'never ABOUT "the archetype." Use their actual energy levels as evidence. Three short beats, ' +
    'no headers: (1) recognition — what is alive and working in them now; (2) tension — what is ' +
    'quietly off or unmet, the growth edge; (3) direction — the one move that opens things. ' +
    'Each beat 1–2 sentences. Total ~90 words. Plain prose only.'

  const user = [
    `Name: ${b.name || '(unknown)'}`,
    `Matched pattern: ${b.archetypeName} (${b.archetypeCategory})`,
    `Five energies — ${scoreLine}`,
    `Strongest: ${DIM_ENERGY[b.dominantDimension] ?? b.dominantDimension}. Most latent: ${DIM_ENERGY[deficient] ?? deficient}.`,
    b.corePattern ? `Core pattern: ${b.corePattern}` : '',
    b.coreTension ? `Core tension: ${b.coreTension}` : '',
    b.whenAligned ? `When aligned: ${b.whenAligned}` : '',
    b.whenMisaligned ? `When misaligned: ${b.whenMisaligned}` : '',
    b.rebalancingPath ? `Path back: ${b.rebalancingPath}` : '',
    b.growthEdge ? `Growth edge: ${b.growthEdge}` : '',
    b.shadowTrigger ? `Shadow trigger: ${b.shadowTrigger}` : '',
    '',
    'Write the reading now. Ground it in their strongest and most-latent energies specifically.',
  ].filter(Boolean).join('\n')

  try {
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      max_tokens: 320,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    })
    const reading = r.choices[0]?.message?.content?.trim()
    if (!reading) return Response.json({ ok: false, error: 'empty' }, { status: 502 })
    return Response.json({ ok: true, reading })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message ?? 'error' }, { status: 502 })
  }
}
