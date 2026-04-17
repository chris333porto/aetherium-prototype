import { NextRequest }               from 'next/server'
import { generateAetheriumResults }  from '@/lib/engine/generateResults'
import type { GenerateResultsInput } from '@/lib/engine/generateResults'

// ─── POST /api/generate-results ──────────────────────────────────────────────
//
// Canon-aware assessment enrichment endpoint.
// Receives deterministic results + narrative context.
// Returns canon-aligned interpretation (Life Chapter, Meaning Level, Flow, Calling).

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { success: false, error: 'Request body must be valid JSON.' },
      { status: 400 }
    )
  }

  const {
    dimensionScores, past, present, future,
    dominantDimension, deficientDimension,
    overallScore, coherenceScore,
    archetypeName, archetypeCategory,
    growthEdge, shadowTrigger,
    signalConfidence, isBalancedSystem,
  } = body

  // Validate required fields
  const missing: string[] = []
  if (!dimensionScores) missing.push('dimensionScores')
  if (typeof past    !== 'string' || !past)    missing.push('past')
  if (typeof present !== 'string' || !present) missing.push('present')
  if (typeof future  !== 'string' || !future)  missing.push('future')

  if (missing.length > 0) {
    return Response.json(
      { success: false, error: `Missing required fields: ${missing.join(', ')}.` },
      { status: 422 }
    )
  }

  // Validate dimensionScores shape
  const DIMS = ['aether', 'fire', 'air', 'water', 'earth'] as const
  const scores = dimensionScores as Record<string, unknown>
  const badScores = DIMS.filter(
    d => typeof scores[d] !== 'number' || (scores[d] as number) < 0 || (scores[d] as number) > 100
  )
  if (badScores.length > 0) {
    return Response.json(
      { success: false, error: `Invalid dimension scores: ${badScores.join(', ')}.` },
      { status: 422 }
    )
  }

  // Build typed input
  const input: GenerateResultsInput = {
    dimensionScores:   scores as GenerateResultsInput['dimensionScores'],
    dominantDimension:  (dominantDimension as string)  || 'aether',
    deficientDimension: (deficientDimension as string) || 'earth',
    overallScore:       (overallScore as number)  ?? 50,
    coherenceScore:     (coherenceScore as number) ?? 50,
    archetypeName:      (archetypeName as string)     || 'Unknown',
    archetypeCategory:  (archetypeCategory as string) || 'core',
    growthEdge:         (growthEdge as string)         || '',
    shadowTrigger:      (shadowTrigger as string)      || '',
    signalConfidence:   (signalConfidence as string)   || 'high',
    isBalancedSystem:   (isBalancedSystem as boolean)  ?? false,
    past:               (past as string).trim(),
    present:            (present as string).trim(),
    future:             (future as string).trim(),
  }

  try {
    const result = await generateAetheriumResults(input)
    return Response.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
    return Response.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
