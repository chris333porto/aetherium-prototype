import { NextRequest }               from 'next/server'
import { generateAetheriumResults }  from '@/lib/engine/generateResults'
import type { GenerateResultsInput } from '@/lib/engine/generateResults'

// ─── POST /api/generate-results ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Parse body
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { success: false, error: 'Request body must be valid JSON.' },
      { status: 400 }
    )
  }

  // 2. Validate required fields
  const { userId, dimensionScores, past, present, future, values, reflections } = body

  const missing: string[] = []
  if (!dimensionScores)        missing.push('dimensionScores')
  if (typeof past     !== 'string' || !past.trim())     missing.push('past')
  if (typeof present  !== 'string' || !present.trim())  missing.push('present')
  if (typeof future   !== 'string' || !future.trim())   missing.push('future')

  if (missing.length > 0) {
    return Response.json(
      { success: false, error: `Missing required fields: ${missing.join(', ')}.` },
      { status: 422 }
    )
  }

  // 3. Validate dimensionScores shape
  const DIMENSIONS = ['aether', 'fire', 'air', 'water', 'earth'] as const
  const scores = dimensionScores as Record<string, unknown>
  const badScores = DIMENSIONS.filter(
    d => typeof scores[d] !== 'number' || (scores[d] as number) < 0 || (scores[d] as number) > 100
  )
  if (badScores.length > 0) {
    return Response.json(
      { success: false, error: `Invalid or missing dimension scores: ${badScores.join(', ')}. Each must be a number between 0 and 100.` },
      { status: 422 }
    )
  }

  // 4. Build typed input
  const input: GenerateResultsInput = {
    userId:         typeof userId === 'string' ? userId : 'anonymous',
    dimensionScores: scores as GenerateResultsInput['dimensionScores'],
    past:            (past    as string).trim(),
    present:         (present as string).trim(),
    future:          (future  as string).trim(),
    values:          Array.isArray(values)      ? (values      as string[]) : undefined,
    reflections:     Array.isArray(reflections) ? (reflections as string[]) : undefined,
  }

  // 5. Generate results
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
