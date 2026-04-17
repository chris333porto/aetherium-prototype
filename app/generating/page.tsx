'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { scoreAssessment } from '@/lib/scoring/engine'
import { buildArchetypeBlend } from '@/lib/archetypes/matcher'
import { buildGrowthProfile } from '@/lib/pathways/growth'
import { parseNarrativeAnswers } from '@/lib/assessment/narrative'
import { analyzeSignalQuality } from '@/lib/scoring/signal'
import { buildResultPayload } from '@/lib/types/results'
import { saveNarrativeAnswers, markAssessmentComplete, createAssessment } from '@/lib/persistence/assessments'
import { saveProfileState, saveArchetypeResult } from '@/lib/persistence/profiles'
import type { RawAnswers } from '@/lib/scoring/engine'
import type { Dimension } from '@/lib/assessment/questions'

const STEPS = [
  'Reading your field',
  'Mapping dimensional tension',
  'Identifying your pattern',
  'Locating your growth edge',
  'Assembling your profile',
]

export default function GeneratingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < STEPS.length - 1) return prev + 1
        clearInterval(interval)
        return prev
      })
    }, 620)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (currentStep < STEPS.length - 1) return
    const timeout = setTimeout(() => {
      runScoringAndPersist().then(() => {
        setDone(true)
        router.push('/results')
      })
    }, 800)
    return () => clearTimeout(timeout)
  }, [currentStep, router])

  return (
    <main className="page-atmosphere flex items-center justify-center overflow-hidden">

      {/* ── Central energy mandala ── */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div style={{ position: 'relative', width: 560, height: 560 }}>
          <svg width="560" height="560" viewBox="0 0 560 560" style={{ overflow: 'visible' }}>
            <defs>
              <radialGradient id="gen-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="rgba(149,144,236,0.1)" />
                <stop offset="100%" stopColor="rgba(149,144,236,0)" />
              </radialGradient>
            </defs>

            <circle cx="280" cy="280" r="280" fill="url(#gen-glow)" />

            {[30, 60, 95, 135, 180, 230].map((r, i) => (
              <circle
                key={i}
                cx="280" cy="280" r={r}
                fill="none"
                stroke={`rgba(149,144,236,${0.06 - i * 0.007})`}
                strokeWidth={i === 0 ? 0.8 : 0.5}
              />
            ))}

            <g style={{ animation: 'gen-cw 80s linear infinite', transformOrigin: '280px 280px' }}>
              <circle cx="280" cy="280" r="200" fill="none"
                stroke="rgba(149,144,236,0.04)" strokeWidth="0.6" strokeDasharray="3 16" />
            </g>

            <g style={{ animation: 'gen-ccw 50s linear infinite', transformOrigin: '280px 280px' }}>
              <circle cx="280" cy="280" r="140" fill="none"
                stroke="rgba(149,144,236,0.05)" strokeWidth="0.5" strokeDasharray="2 8" />
            </g>

            <g style={{ animation: 'gen-cw 160s linear infinite', transformOrigin: '280px 280px' }}>
              <circle cx="280" cy="280" r="250" fill="none"
                stroke="rgba(149,144,236,0.025)" strokeWidth="0.4" strokeDasharray="1 18" />
            </g>

            {(() => {
              const pts = Array.from({ length: 5 }, (_, i) => {
                const a = (i * 2 * Math.PI) / 5 - Math.PI / 2
                return `${280 + 105 * Math.cos(a)},${280 + 105 * Math.sin(a)}`
              }).join(' ')
              return (
                <polygon points={pts} fill="none"
                  stroke="rgba(149,144,236,0.05)" strokeWidth="0.4" />
              )
            })()}

            <circle cx="280" cy="280" r="4" fill="rgba(149,144,236,0.12)" />
            <circle
              cx="280" cy="280" r="2" fill="rgba(149,144,236,0.35)"
              style={{ animation: 'gen-pulse 3s ease-in-out infinite' }}
            />
          </svg>
        </div>
      </div>

      {/* ── Step list ── */}
      <div className="relative z-10 flex flex-col items-center gap-12 px-6 max-w-sm w-full">

        {/* Headline */}
        <div className="text-center">
          <p
            className="font-cinzel text-xs uppercase tracking-[0.55em] mb-4"
            style={{ color: 'rgba(149,144,236,0.4)' }}
          >
            Mapping Your Current State
          </p>
          <p
            className="font-cormorant text-base leading-relaxed"
            style={{ color: 'rgba(234,232,242,0.28)', letterSpacing: '0.02em' }}
          >
            We&apos;re mapping your current state.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3.5">
          {STEPS.map((step, i) => {
            const isActive  = i === currentStep
            const isDone    = i < currentStep
            const isPending = i > currentStep

            return (
              <div
                key={step}
                className="flex items-center gap-4 transition-all duration-500"
                style={{ opacity: isPending ? 0.15 : isDone ? 0.4 : 1 }}
              >
                <div
                  className="flex-shrink-0 rounded-full transition-all duration-300"
                  style={{
                    width: 6,
                    height: 6,
                    background: isDone
                      ? 'rgba(149,144,236,0.45)'
                      : isActive
                      ? '#9590ec'
                      : 'rgba(234,232,242,0.1)',
                    boxShadow: isActive
                      ? '0 0 10px rgba(149,144,236,0.7), 0 0 20px rgba(149,144,236,0.3)'
                      : 'none',
                  }}
                />
                <span
                  className="font-cinzel text-xs uppercase tracking-[0.3em]"
                  style={{
                    color: isActive ? '#eae8f2' : 'rgba(234,232,242,0.5)',
                    letterSpacing: isActive ? '0.3em' : '0.2em',
                  }}
                >
                  {step}
                </span>
              </div>
            )
          })}
        </div>

        <p
          className="font-cormorant text-sm text-center"
          style={{ color: 'rgba(234,232,242,0.2)', letterSpacing: '0.05em' }}
        >
          {done ? 'Your profile is ready.' : 'Mapping your dimensional state…'}
        </p>
      </div>

      <style jsx>{`
        @keyframes gen-cw    { to { transform: rotate(360deg);  } }
        @keyframes gen-ccw   { to { transform: rotate(-360deg); } }
        @keyframes gen-pulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
      `}</style>
    </main>
  )
}

// ── Core scoring + persistence function ─────────────────────────────────────

async function runScoringAndPersist(): Promise<void> {
  // 1. Read answers from localStorage
  const rawAnswers: RawAnswers = (() => {
    try { return JSON.parse(localStorage.getItem('ae_assessment_answers') ?? '{}') }
    catch { return {} }
  })()

  const narrativeRaw: Record<string, string> = (() => {
    try { return JSON.parse(localStorage.getItem('ae_narrative_answers') ?? '{}') }
    catch { return {} }
  })()

  // 2. Score deterministically
  const scoring        = scoreAssessment(rawAnswers)
  const signalQuality  = analyzeSignalQuality(rawAnswers, scoring.dimensions)
  const archetypeBlend = buildArchetypeBlend(scoring.dimensions)
  const growthProfile  = buildGrowthProfile(scoring.dimensions, archetypeBlend.primary.archetype)
  const narrative      = parseNarrativeAnswers(narrativeRaw)

  const entries = Object.entries(scoring.dimensions) as [Dimension, number][]
  const dominantDimension  = entries.reduce((a, b) => b[1] > a[1] ? b : a)[0]
  const deficientDimension = entries.reduce((a, b) => b[1] < a[1] ? b : a)[0]

  // 3. Build local payload (IDs patched in below if Supabase succeeds)
  const payload = buildResultPayload(scoring, archetypeBlend, growthProfile, narrative, signalQuality)

  // 4. AI enrichment — this is the FIRST OpenAI call in the entire pre-dashboard flow.
  //    It only runs here, after the user has:
  //      a) completed 50 questions
  //      b) provided their email (ae_identity was written in /assessment/identity)
  //      c) passed through the context step (even if skipped)
  //    Never fires earlier. /results-preview uses deterministic scoring only.
  try {
    const primary = archetypeBlend.primary.archetype
    const enrichRes = await fetch('/api/generate-results', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dimensionScores:   scoring.dimensions,
        dominantDimension,
        deficientDimension,
        overallScore:      scoring.overallScore,
        coherenceScore:    scoring.coherenceScore,
        archetypeName:     primary.name,
        archetypeCategory: primary.category,
        growthEdge:        primary.growthEdge,
        shadowTrigger:     primary.shadowTrigger,
        signalConfidence:  signalQuality.confidence,
        isBalancedSystem:  signalQuality.isBalancedSystem,
        past:    narrative.recent_challenges  || '[not provided]',
        present: narrative.recurring_pattern  || '[not provided]',
        future:  narrative.desired_direction  || '[not provided]',
      }),
    })

    if (enrichRes.ok) {
      const enriched = (await enrichRes.json()) as { data: Record<string, unknown> }
      // Merge AI-generated fields into the payload so /results can render them
      Object.assign(payload, { enriched: enriched.data })
      // Also cache separately so /results can detect whether enrichment ran
      localStorage.setItem('ae_results_enriched', JSON.stringify(enriched.data))
    }
  } catch (err) {
    // AI enrichment failed (network error, missing key, quota, etc.).
    // The full results page degrades gracefully — deterministic sections
    // still render. Only AI-synthesised copy will be absent.
    console.warn('[Aetherium] AI enrichment skipped:', err)
  }

  // 5. Persist to Supabase (non-blocking — failure doesn't break the results page)
  try {
    // Re-use the assessment created when the user started; fall back to a new one
    const storedId = localStorage.getItem('ae_assessment_id')
    const assessmentId: string = storedId ?? await createAssessment(null).then(a => {
      localStorage.setItem('ae_assessment_id', a.id)
      return a.id
    })

    await saveNarrativeAnswers(assessmentId, narrative)
    await markAssessmentComplete(assessmentId)

    const savedProfile = await saveProfileState({
      userId:             null,
      assessmentId,
      scoring,
      archetypeBlend,
      growthProfile,
      narrative,
      evolutionState:     growthProfile.currentState,
      dominantDimension,
      deficientDimension,
      signalQuality,
    })

    await saveArchetypeResult({ profileStateId: savedProfile.id, archetypeBlend })

    // Patch persistence IDs into the payload
    payload.assessmentId   = assessmentId
    payload.profileStateId = savedProfile.id

    // Store profile state ID separately so results page can re-fetch if localStorage is cleared
    localStorage.setItem('ae_profile_state_id', savedProfile.id)
    localStorage.removeItem('ae_assessment_id')
  } catch (err) {
    // Supabase unavailable or env vars missing — results still render from localStorage
    console.warn('[Aetherium] Persistence skipped:', err)
  }

  // 5. Always write to localStorage so /results can render
  localStorage.setItem('ae_results', JSON.stringify(payload))
}
