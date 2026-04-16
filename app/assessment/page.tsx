'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  DIMENSIONS_ORDER,
  DIMENSION_META,
  getQuestionsForDimension,
  type Dimension,
} from '@/lib/assessment/questions'
import { Button } from '@/components/ui/Button'
import { StepProgress } from '@/components/ui/Progress'
import { EnergyField } from '@/components/EnergyField'
import { createAssessment, saveAssessmentAnswers } from '@/lib/persistence/assessments'
import { scoreAssessment }     from '@/lib/scoring/engine'
import { buildArchetypeBlend } from '@/lib/archetypes/matcher'
import type { RawAnswers }     from '@/lib/scoring/engine'
import { PreviewNav } from '@/components/dev/PreviewNav'
import { PREVIEW_ANSWERS } from '@/lib/dev/previewMock'

const TOTAL_STEPS = 5

const SCALE_LABELS: Record<number, string> = {
  1: 'Never',
  2: 'Rarely',
  3: 'Sometimes',
  4: 'Often',
  5: 'Always',
}

// ── Presencing screen (threshold moment) ─────────────────────────────────────
//
// Three-phase experience:
//   Phase 0 (0–1.5s):    Darkness. A single point of light appears.
//   Phase 1 (1.5–5s):    Light expands. First line appears.
//   Phase 2 (5–8.5s):    Second line appears. The ring breathes.
//   Phase 3 (8.5–10.5s): Everything fades. "Begin" appears.
//   Phase 4 (auto/click): Advance to questions.

function PresencingScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1500)
    const t2 = setTimeout(() => setPhase(2), 5000)
    const t3 = setTimeout(() => setPhase(3), 8500)
    const t4 = setTimeout(() => onComplete(), 12000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onComplete])

  return (
    <main
      style={{
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
        background: '#06060a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* ── Outer ring — appears in phase 1, breathes in phase 2+ ── */}
      <div
        style={{
          position: 'absolute',
          width: 200, height: 200, borderRadius: '50%',
          border: '1px solid rgba(149,144,236,0.06)',
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 2 ? 'scale(1)' : 'scale(0.85)',
          transition: 'opacity 2s ease, transform 2s ease',
          animation: phase >= 2 ? 'threshold-breathe 5s ease-in-out infinite' : 'none',
        }}
      />

      {/* ── Inner ring — appears in phase 2 ── */}
      <div
        style={{
          position: 'absolute',
          width: 80, height: 80, borderRadius: '50%',
          border: '1px solid rgba(149,144,236,0.04)',
          opacity: phase >= 2 ? 1 : 0,
          transition: 'opacity 2s ease',
          animation: phase >= 2 ? 'threshold-breathe-inner 5s ease-in-out infinite' : 'none',
        }}
      />

      {/* ── Center point — the first thing that appears ── */}
      <div
        style={{
          position: 'absolute',
          width: phase >= 1 ? 4 : 2,
          height: phase >= 1 ? 4 : 2,
          borderRadius: '50%',
          background: phase >= 1 ? 'rgba(149,144,236,0.5)' : 'rgba(149,144,236,0.3)',
          boxShadow: phase >= 1
            ? '0 0 20px rgba(149,144,236,0.3), 0 0 60px rgba(149,144,236,0.1)'
            : 'none',
          opacity: phase === 0 ? 0 : phase >= 3 ? 0 : 1,
          transition: 'all 2s ease',
        }}
      />

      {/* ── Descending particles (phase 1+) ── */}
      {phase >= 1 && phase < 3 && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 1, height: 1, borderRadius: '50%',
                background: 'rgba(149,144,236,0.25)',
                left: `${15 + (i * 7) % 70}%`,
                animation: `threshold-fall ${3 + (i % 3) * 1.5}s linear infinite`,
                animationDelay: `${(i * 0.4) % 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Text content ── */}
      <div
        className="relative z-10 flex flex-col items-center text-center"
        style={{ maxWidth: 420, padding: '0 2rem' }}
      >
        {/* Line 1 — the invitation */}
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(24px, 4vw, 34px)',
          fontWeight: 300,
          color: 'rgba(234,232,242,0.72)',
          lineHeight: 1.5,
          letterSpacing: '-0.01em',
          opacity: phase >= 1 && phase < 3 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 1.8s ease, transform 1.8s ease',
          marginBottom: '1.8rem',
        }}>
          What is true about you<br />
          right now?
        </p>

        {/* Divider */}
        <div style={{
          width: 28, height: 1,
          background: 'rgba(149,144,236,0.15)',
          opacity: phase >= 2 && phase < 3 ? 1 : 0,
          transition: 'opacity 1.5s ease',
          marginBottom: '1.8rem',
        }} />

        {/* Line 2 — the instruction */}
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(15px, 2vw, 18px)',
          fontStyle: 'italic',
          color: 'rgba(234,232,242,0.42)',
          lineHeight: 1.75,
          opacity: phase >= 2 && phase < 3 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 1.5s ease, transform 1.5s ease',
        }}>
          Not what you wish were true.<br />
          Not what used to be true.<br />
          What is true right now.
        </p>

        {/* Phase 3 — Begin button */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: phase >= 3 ? 1 : 0,
          transition: 'opacity 1.5s ease',
        }}>
          <button
            onClick={onComplete}
            style={{
              fontFamily: "'Cinzel', serif", fontSize: 9.5,
              letterSpacing: '0.4em', textTransform: 'uppercase',
              color: 'rgba(234,232,242,0.55)',
              background: 'transparent',
              border: '1px solid rgba(149,144,236,0.18)',
              borderRadius: 3,
              padding: '13px 32px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(149,144,236,0.4)'
              e.currentTarget.style.color = 'rgba(234,232,242,0.8)'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(149,144,236,0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(149,144,236,0.18)'
              e.currentTarget.style.color = 'rgba(234,232,242,0.55)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Begin
          </button>
        </div>
      </div>

      {/* Skip — appears after 3s, very subtle */}
      {phase >= 2 && phase < 3 && (
        <button
          onClick={onComplete}
          style={{
            position: 'absolute', bottom: '2.5rem',
            fontFamily: "'Cinzel', serif", fontSize: 7.5,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(234,232,242,0.15)',
            background: 'transparent', border: 'none', cursor: 'pointer',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(234,232,242,0.35)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(234,232,242,0.15)')}
        >
          Skip
        </button>
      )}

      <style jsx>{`
        @keyframes threshold-breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.6; }
        }
        @keyframes threshold-breathe-inner {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.92); opacity: 0.5; }
        }
        @keyframes threshold-fall {
          0% { top: -2%; opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.15; }
          100% { top: 102%; opacity: 0; }
        }
      `}</style>
    </main>
  )
}

// ── Dimension transition (between dimensions) ────────────────────────────────

function DimensionTransition({
  dimension,
  onComplete,
}: {
  dimension: Dimension
  onComplete: () => void
}) {
  const meta = DIMENSION_META[dimension]

  useEffect(() => {
    const t = setTimeout(onComplete, 2200)
    return () => clearTimeout(t)
  }, [onComplete])

  return (
    <main
      className="page-atmosphere flex items-center justify-center"
      style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      <EnergyField size={350} opacity={0.3} color={meta.color} />
      <div
        className="relative z-10 flex flex-col items-center text-center"
        style={{
          animation: 'ae-dim-enter 1.5s ease forwards',
        }}
      >
        <div
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: meta.color, opacity: 0.7,
            boxShadow: `0 0 20px ${meta.color}60`,
            marginBottom: '1.5rem',
          }}
        />
        <p style={{
          fontFamily: "'Cinzel', serif", fontSize: 10,
          letterSpacing: '0.45em', textTransform: 'uppercase',
          color: meta.color, opacity: 0.8,
        }}>
          {meta.label}
        </p>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 15, fontStyle: 'italic',
          color: 'rgba(234,232,242,0.35)',
          marginTop: '0.5rem',
        }}>
          {meta.subtitle}
        </p>
      </div>
      <style jsx>{`
        @keyframes ae-dim-enter {
          0% { opacity: 0; transform: translateY(12px); }
          30% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </main>
  )
}

// ── Likert option (larger tap targets, better contrast) ──────────────────────

function LikertOption({
  value,
  selected,
  onSelect,
  color,
}: {
  value: number
  selected: boolean
  onSelect: () => void
  color: string
}) {
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onSelect}
        className="relative flex items-center justify-center transition-all duration-200"
        style={{ width: 48, height: 48 }}
        aria-label={SCALE_LABELS[value]}
      >
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-300"
          style={{
            border: selected
              ? `1.5px solid ${rgba(0.75)}`
              : `1px solid rgba(234,232,242,0.14)`,
            background: selected ? rgba(0.12) : 'transparent',
            boxShadow: selected
              ? `0 0 16px ${rgba(0.35)}, inset 0 0 8px ${rgba(0.08)}`
              : 'none',
          }}
        />

        {/* Bloom ring */}
        {selected && (
          <div
            className="absolute inset-0 rounded-full likert-selected"
            style={{ border: `1px solid ${rgba(0.5)}` }}
          />
        )}

        {/* Center dot */}
        {selected && (
          <div
            className="relative rounded-full likert-dot"
            style={{
              width: 12,
              height: 12,
              background: color,
              boxShadow: `0 0 10px ${rgba(0.8)}`,
            }}
          />
        )}
      </button>

      <span
        className="font-cinzel uppercase tracking-wider transition-all duration-200"
        style={{
          color: selected ? rgba(0.85) : 'rgba(234,232,242,0.40)',
          fontSize: 9.5,
          letterSpacing: '0.1em',
        }}
      >
        {SCALE_LABELS[value]}
      </span>
    </div>
  )
}

// ── Dimension step (improved typography + spacing) ───────────────────────────

function DimensionStep({
  dimension,
  stepIndex,
  answers,
  onAnswer,
  onNext,
  onBack,
}: {
  dimension: Dimension
  stepIndex: number
  answers: Record<string, number>
  onAnswer: (questionId: string, value: number) => void
  onNext: () => void
  onBack: () => void
}) {
  const questions = getQuestionsForDimension(dimension)
  const meta = DIMENSION_META[dimension]
  const answered = questions.filter(q => answers[q.id] !== undefined).length
  const allAnswered = answered === questions.length

  const hex = meta.color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`

  return (
    <div className="flex flex-col gap-8">
      {/* Dimension header — compact */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: meta.color, opacity: 0.7,
              boxShadow: `0 0 8px ${rgba(0.4)}`,
            }}
          />
          <p
            className="font-cinzel uppercase"
            style={{
              fontSize: 9, letterSpacing: '0.3em',
              color: meta.color, opacity: 0.85,
            }}
          >
            {meta.label}
          </p>
          <span
            className="font-cinzel uppercase"
            style={{
              fontSize: 10, letterSpacing: '0.12em',
              color: 'rgba(234,232,242,0.30)', marginLeft: 'auto',
            }}
          >
            {answered}/{questions.length}
          </span>
        </div>
        <p
          className="font-cormorant"
          style={{
            fontSize: 15, color: 'rgba(234,232,242,0.42)',
            lineHeight: 1.6,
          }}
        >
          {meta.description}
        </p>
      </div>

      {/* Questions */}
      <div className="flex flex-col" style={{ gap: '2.25rem' }}>
        {questions.map((q, qi) => {
          const selected = answers[q.id]
          const isAnswered = selected !== undefined

          return (
            <div
              key={q.id}
              className="flex flex-col transition-all duration-300"
              style={{ gap: '0.9rem' }}
            >
              <p
                className="font-cormorant leading-relaxed"
                style={{
                  fontSize: 'clamp(17px, 2vw, 20px)',
                  lineHeight: 1.65,
                  color: isAnswered ? 'rgba(234,232,242,0.88)' : 'rgba(234,232,242,0.72)',
                  transition: 'color 0.3s ease',
                }}
              >
                <span
                  className="font-cinzel mr-3 inline-block"
                  style={{
                    color: isAnswered ? rgba(0.5) : 'rgba(234,232,242,0.22)',
                    fontSize: 12,
                    minWidth: 24,
                    transition: 'color 0.3s ease',
                  }}
                >
                  {String(qi + 1).padStart(2, '0')}
                </span>
                {q.text}
              </p>

              {/* Likert scale */}
              <div className="flex items-end" style={{ gap: 0 }}>
                <span
                  className="font-cormorant hidden sm:block"
                  style={{
                    fontSize: 12, color: 'rgba(234,232,242,0.32)',
                    paddingBottom: '1.75rem', minWidth: 48, textAlign: 'right',
                    paddingRight: 8,
                  }}
                >
                  Never
                </span>

                <div className="flex flex-1 justify-between" style={{ maxWidth: 320 }}>
                  {[1, 2, 3, 4, 5].map(v => (
                    <LikertOption
                      key={v}
                      value={v}
                      selected={selected === v}
                      onSelect={() => onAnswer(q.id, v)}
                      color={meta.color}
                    />
                  ))}
                </div>

                <span
                  className="font-cormorant hidden sm:block"
                  style={{
                    fontSize: 12, color: 'rgba(234,232,242,0.32)',
                    paddingBottom: '1.75rem', minWidth: 48,
                    paddingLeft: 8,
                  }}
                >
                  Always
                </span>
              </div>

              {/* Separator — subtle, only between questions */}
              {qi < questions.length - 1 && (
                <div
                  style={{
                    height: 1, marginTop: '0.5rem',
                    background: 'rgba(234,232,242,0.04)',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex gap-4 pt-4" style={{ borderTop: '1px solid rgba(234,232,242,0.06)' }}>
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={onNext} disabled={!allAnswered}>
          {stepIndex === TOTAL_STEPS ? 'Reveal My Profile →' : 'Continue →'}
        </Button>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AssessmentPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'presencing' | 'transition' | 'questions' | 'complete'>('presencing')
  const [step, setStep]               = useState(0)
  const [answers, setAnswers]         = useState<Record<string, number>>({})
  const [showTransition, setShowTransition] = useState(false)
  const assessmentIdRef = useRef<string | null>(null)

  // Create assessment record on mount
  useEffect(() => {
    const stored = localStorage.getItem('ae_assessment_id')
    if (stored) {
      assessmentIdRef.current = stored
      return
    }
    createAssessment(null)
      .then(result => {
        assessmentIdRef.current = result.id
        localStorage.setItem('ae_assessment_id', result.id)
      })
      .catch(() => {})
  }, [])

  // DEV: override for preview mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('preview') !== '1') return
    const raw = parseInt(params.get('step') ?? '0', 10)
    const target = isNaN(raw) ? 0 : Math.max(0, Math.min(TOTAL_STEPS - 1, raw))
    setStep(target)
    setAnswers(PREVIEW_ANSWERS)
    setPhase('questions')
  }, [])

  // Auto-advance from completion transition → results preview
  useEffect(() => {
    if (!showTransition) return
    const t = setTimeout(() => router.push('/results-preview'), 2800)
    return () => clearTimeout(t)
  }, [showTransition, router])

  const currentDimension = DIMENSIONS_ORDER[step]
  const dimensionColor   = DIMENSION_META[currentDimension].color

  function handleAnswer(questionId: string, value: number) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  function handleNext() {
    // Save this dimension's answers (fire-and-forget)
    if (assessmentIdRef.current) {
      const dimAnswers = Object.fromEntries(
        getQuestionsForDimension(currentDimension)
          .map(q => [q.id, answers[q.id]])
          .filter(([, v]) => v !== undefined)
      ) as RawAnswers
      saveAssessmentAnswers(assessmentIdRef.current, dimAnswers).catch(() => {})
    }

    if (step < TOTAL_STEPS - 1) {
      // Show dimension transition before next step
      setPhase('transition')
    } else {
      // Final step — compute scores and show completion
      localStorage.setItem('ae_assessment_answers', JSON.stringify(answers))
      try {
        const scoring        = scoreAssessment(answers as RawAnswers)
        const archetypeBlend = buildArchetypeBlend(scoring.dimensions)
        const entries        = Object.entries(scoring.dimensions) as [Dimension, number][]
        const dominantDimension  = entries.reduce((a, b) => b[1] > a[1] ? b : a)[0]
        const deficientDimension = entries.reduce((a, b) => b[1] < a[1] ? b : a)[0]

        localStorage.setItem('ae_preview_scores', JSON.stringify({
          dimensions:        scoring.dimensions,
          profiles:          scoring.profiles,
          archetypeBlend,
          dominantDimension,
          deficientDimension,
          overallScore:      scoring.overallScore,
          coherenceScore:    scoring.coherenceScore,
        }))
      } catch (err) {
        console.warn('[Aetherium] Preview scoring failed:', err)
      }
      setShowTransition(true)
    }
  }

  function handleBack() {
    if (step === 0) {
      router.push('/onboarding/welcome')
    } else {
      setStep(s => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ── Presencing screen ──────────────────────────────────────────────────────
  if (phase === 'presencing') {
    return <PresencingScreen onComplete={() => setPhase('questions')} />
  }

  // ── Dimension transition ───────────────────────────────────────────────────
  if (phase === 'transition') {
    const nextDim = DIMENSIONS_ORDER[step + 1]
    return (
      <DimensionTransition
        dimension={nextDim}
        onComplete={() => {
          setStep(s => s + 1)
          setPhase('questions')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
    )
  }

  // ── Completion transition ──────────────────────────────────────────────────
  if (showTransition) {
    return (
      <main className="page-atmosphere flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <EnergyField size={500} opacity={0.35} color="#9590ec" />
        <div
          className="relative z-10 flex flex-col items-center text-center"
          style={{ maxWidth: 420, padding: '0 2rem' }}
        >
          <p style={{
            fontFamily: "'Cinzel', serif", fontSize: 9,
            letterSpacing: '0.5em', textTransform: 'uppercase',
            color: 'rgba(149,144,236,0.5)', marginBottom: '2rem',
          }}>
            Discovery Complete
          </p>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 300,
            color: '#eae8f2', letterSpacing: '-0.01em',
            lineHeight: 1.15, marginBottom: '1.2rem',
          }}>
            Your pattern has been mapped.
          </h2>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(15px, 1.6vw, 17px)', fontStyle: 'italic',
            color: 'rgba(234,232,242,0.42)', lineHeight: 1.7,
          }}>
            Preparing your profile…
          </p>
        </div>
      </main>
    )
  }

  // ── Questions ──────────────────────────────────────────────────────────────
  return (
    <main className="page-atmosphere">
      <EnergyField
        size={600}
        opacity={0.45}
        color={dimensionColor}
        className="transition-all duration-[2000ms]"
      />

      {/* Top bar */}
      <div
        className="sticky top-0 z-20"
        style={{
          borderBottom: '1px solid rgba(234,232,242,0.05)',
          background: 'rgba(8,8,14,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '0.85rem 0',
        }}
      >
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span
              className="font-cinzel uppercase"
              style={{ fontSize: 9, letterSpacing: '0.35em', color: 'rgba(234,232,242,0.25)' }}
            >
              Aetherium
            </span>
            <span
              className="font-cinzel uppercase"
              style={{
                fontSize: 9, letterSpacing: '0.2em',
                color: dimensionColor, opacity: 0.7,
              }}
            >
              {step + 1} of {TOTAL_STEPS}
            </span>
          </div>
          <StepProgress current={step + 1} total={TOTAL_STEPS} />
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2.5rem 2rem 5rem', position: 'relative', zIndex: 10 }}>
        <DimensionStep
          key={currentDimension}
          dimension={currentDimension}
          stepIndex={step + 1}
          answers={answers}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onBack={handleBack}
        />
      </div>

      <PreviewNav />
    </main>
  )
}
