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
import type { RawAnswers } from '@/lib/scoring/engine'
import { PreviewNav } from '@/components/dev/PreviewNav'
import { PREVIEW_ANSWERS } from '@/lib/dev/previewMock'

// 5 dimension steps
const TOTAL_STEPS = 5

const SCALE_LABELS: Record<number, string> = {
  1: 'Never',
  2: 'Rarely',
  3: 'Sometimes',
  4: 'Often',
  5: 'Always',
}

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
    <div className="flex flex-col items-center gap-2.5">
      <button
        type="button"
        onClick={onSelect}
        className="relative flex items-center justify-center transition-all duration-200"
        style={{ width: 40, height: 40 }}
        aria-label={SCALE_LABELS[value]}
      >
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-300"
          style={{
            border: selected
              ? `1px solid ${rgba(0.7)}`
              : `1px solid rgba(234,232,242,0.1)`,
            background: selected ? rgba(0.1) : 'transparent',
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
              width: 10,
              height: 10,
              background: color,
              boxShadow: `0 0 8px ${rgba(0.8)}`,
            }}
          />
        )}
      </button>

      <span
        className="font-cinzel uppercase tracking-wider transition-all duration-200"
        style={{
          color: selected ? rgba(0.7) : 'rgba(234,232,242,0.18)',
          fontSize: 7,
          letterSpacing: '0.15em',
        }}
      >
        {SCALE_LABELS[value]}
      </span>
    </div>
  )
}

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
    <div className="flex flex-col gap-10">
      {/* Dimension header */}
      <div>
        <p
          className="font-cinzel text-xs uppercase tracking-[0.5em] mb-5"
          style={{ color: 'rgba(234,232,242,0.25)' }}
        >
          Step {stepIndex} of {TOTAL_STEPS}
        </p>
        <div className="flex items-start gap-4 mb-4">
          <div
            className="flex-shrink-0 mt-1"
            style={{
              width: 2,
              height: 48,
              background: `linear-gradient(to bottom, ${meta.color}, ${rgba(0.1)})`,
              borderRadius: 1,
            }}
          />
          <div>
            <p
              className="font-cinzel text-xs uppercase tracking-[0.35em] mb-1"
              style={{ color: meta.color, opacity: 0.9 }}
            >
              {meta.label}
            </p>
            <h2
              className="font-cormorant font-light"
              style={{
                fontSize: 32,
                color: '#eae8f2',
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
              }}
            >
              {meta.subtitle}
            </h2>
          </div>
        </div>
        <p
          className="font-cormorant text-base leading-relaxed"
          style={{ color: 'rgba(234,232,242,0.48)', maxWidth: 480 }}
        >
          {meta.description}
        </p>
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-10">
        {questions.map((q, qi) => {
          const selected = answers[q.id]
          const isAnswered = selected !== undefined

          return (
            <div
              key={q.id}
              className="flex flex-col gap-5 transition-all duration-300"
              style={{ opacity: isAnswered ? 1 : 0.75 }}
            >
              <p
                className="font-cormorant leading-snug"
                style={{
                  fontSize: 18,
                  lineHeight: 1.62,
                  color: isAnswered ? 'rgba(234,232,242,0.92)' : 'rgba(234,232,242,0.70)',
                  transition: 'color 0.3s ease',
                }}
              >
                <span
                  className="font-cinzel mr-3"
                  style={{ color: 'rgba(234,232,242,0.2)', fontSize: 9 }}
                >
                  {String(qi + 1).padStart(2, '0')}
                </span>
                {q.text}
              </p>

              {/* Likert scale */}
              <div className="flex items-end gap-1 sm:gap-3">
                <span
                  className="font-cormorant text-xs pb-6 hidden sm:block"
                  style={{ color: 'rgba(234,232,242,0.2)', minWidth: 52 }}
                >
                  Disagree
                </span>

                <div className="flex gap-3 sm:gap-5 flex-1">
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
                  className="font-cormorant text-xs pb-6 hidden sm:block text-right"
                  style={{ color: 'rgba(234,232,242,0.2)', minWidth: 52 }}
                >
                  Agree
                </span>
              </div>

              {qi < questions.length - 1 && (
                <div
                  className="h-px"
                  style={{
                    background: `linear-gradient(to right, ${rgba(0.12)}, transparent)`,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {questions.map((q) => (
            <div
              key={q.id}
              className="rounded-full transition-all duration-200"
              style={{
                width: answers[q.id] !== undefined ? 6 : 4,
                height: answers[q.id] !== undefined ? 6 : 4,
                background: answers[q.id] !== undefined ? meta.color : 'rgba(234,232,242,0.12)',
                boxShadow: answers[q.id] !== undefined ? `0 0 6px ${rgba(0.5)}` : 'none',
              }}
            />
          ))}
        </div>
        <span
          className="font-cinzel text-xs uppercase tracking-widest"
          style={{ color: 'rgba(234,232,242,0.2)' }}
        >
          {answered}/{questions.length}
        </span>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={onNext} disabled={!allAnswered}>
          {stepIndex === TOTAL_STEPS ? 'Complete →' : 'Continue →'}
        </Button>
      </div>
    </div>
  )
}

export default function AssessmentPage() {
  const router = useRouter()
  const [step, setStep] = useState(0) // 0–4 = dimensions 1–5
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const assessmentIdRef = useRef<string | null>(null)

  // Create assessment record on mount — fire-and-forget, non-blocking
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
      .catch(() => { /* Supabase unavailable — continue without persistence */ })
  }, [])

  // DEV: override step and pre-fill answers when ?preview=1 is active
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('preview') !== '1') return
    const raw = parseInt(params.get('step') ?? '0', 10)
    const target = isNaN(raw) ? 0 : Math.max(0, Math.min(TOTAL_STEPS - 1, raw))
    setStep(target)
    setAnswers(PREVIEW_ANSWERS)
  }, [])

  const currentDimension = DIMENSIONS_ORDER[step]
  const dimensionColor = DIMENSION_META[currentDimension].color

  function handleAnswer(questionId: string, value: number) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  function handleNext() {
    // Fire-and-forget: save this dimension's answers to Supabase
    if (assessmentIdRef.current) {
      const dimAnswers = Object.fromEntries(
        getQuestionsForDimension(currentDimension)
          .map(q => [q.id, answers[q.id]])
          .filter(([, v]) => v !== undefined)
      ) as RawAnswers
      saveAssessmentAnswers(assessmentIdRef.current, dimAnswers).catch(() => {})
    }

    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      localStorage.setItem('ae_assessment_answers', JSON.stringify(answers))
      router.push('/generating')
    }
  }

  function handleBack() {
    if (step === 0) {
      router.push('/assessment/identity')
    } else {
      setStep(s => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <main className="page-atmosphere">
      <EnergyField
        size={600}
        opacity={0.5}
        color={dimensionColor}
        className="transition-all duration-[2000ms]"
      />

      {/* Top bar */}
      <div
        className="sticky top-0 z-20"
        style={{
          borderBottom: '1px solid rgba(234,232,242,0.05)',
          background: 'rgba(8,8,14,0.9)',
          backdropFilter: 'blur(20px)',
          padding: '1rem 0',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span
              className="font-cinzel text-xs uppercase tracking-[0.4em]"
              style={{ color: 'rgba(234,232,242,0.22)' }}
            >
              Aetherium
            </span>
            <span
              className="font-cinzel text-xs uppercase tracking-widest"
              style={{ color: DIMENSION_META[currentDimension].color, opacity: 0.65 }}
            >
              {DIMENSION_META[currentDimension].label}
            </span>
          </div>
          <StepProgress current={step + 1} total={TOTAL_STEPS} />
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '3.5rem 2.5rem 5rem', position: 'relative', zIndex: 10 }}>
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

      {/* DEV: preview navigator — only visible when ?preview=1 */}
      <PreviewNav />
    </main>
  )
}
