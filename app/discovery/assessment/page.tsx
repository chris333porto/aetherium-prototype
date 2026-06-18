'use client'

/**
 * /discovery/assessment — 50 questions, one per screen, with realm gates.
 *
 * The counter reads within-realm position ("3 / 10") rather than marching
 * through 50 linearly. A row of five dots underneath shows realm progress
 * using each dimension's color — giving the user a spatial sense of "I'm
 * inside Earth; four more realms to meet" without the arithmetic burden.
 */

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DIMENSIONS_ORDER,
  getQuestionsForDimension,
  type Question,
  type Dimension,
} from '@/lib/assessment/questions'
import { Atmosphere } from '../_components/Atmosphere'
import { Sun } from '../_components/Sun'
import { MetaLine } from '../_components/MetaLine'
import { REALMS, REALM_ORDER } from '../_lib/realms'
import {
  ShojiCurtain,
  ShojiPhase,
  useIncomingShoji,
  SHOJI_CLOSING_MS,
  SHOJI_HELD_MS,
  SHOJI_OPENING_MS,
} from '../_components/ShojiCurtain'

// ─── Question ordering ───────────────────────────────────────────────────────

const ORDERED: Question[] = DIMENSIONS_ORDER.flatMap(d => getQuestionsForDimension(d))
const TOTAL = ORDERED.length

// Pre-compute realm boundaries + sizes so the counter doesn't recompute each tick
const REALM_SIZES: Record<Dimension, number> = (() => {
  const out = {} as Record<Dimension, number>
  for (const d of REALM_ORDER) out[d] = ORDERED.filter(q => q.dimension === d).length
  return out
})()

function realmInfo(idx: number) {
  const dim = ORDERED[idx].dimension
  const firstIdxInRealm = ORDERED.findIndex(q => q.dimension === dim)
  return {
    dim,
    positionInRealm: idx - firstIdxInRealm + 1,
    realmSize:       REALM_SIZES[dim],
    realmIndex:      REALM_ORDER.indexOf(dim),
  }
}

// ─── Phase ───────────────────────────────────────────────────────────────────

type Phase =
  | { kind: 'question'; idx: number }
  | { kind: 'selected'; idx: number; value: number }
  | { kind: 'within-out'; idx: number; value: number; nextIdx: number }
  | { kind: 'within-in';  idx: number }
  | { kind: 'gate-out';   idx: number; value: number; gateIdx: number }
  | { kind: 'gate';       fromDim: Dimension; toDim: Dimension; nextIdx: number }
  | { kind: 'gate-shoji-closing'; toIdx: number }
  | { kind: 'gate-shoji-held';    toIdx: number }
  | { kind: 'gate-shoji-opening'; idx: number }
  | { kind: 'finish-shoji-closing' }
  | { kind: 'finish-shoji-held' }

const T = {
  selected:   180,
  withinOut:  320,
  withinIn:   340,
  gateOut:    380,
} as const

const STORAGE_KEY = 'ae_disc_answers'

function isRealmBoundary(fromIdx: number): boolean {
  if (fromIdx >= TOTAL - 1) return false
  return ORDERED[fromIdx].dimension !== ORDERED[fromIdx + 1].dimension
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DiscoveryAssessmentPage() {
  const router = useRouter()
  const incoming = useIncomingShoji()
  const [phase, setPhase] = useState<Phase>({ kind: 'question', idx: 0 })
  const [answers, setAnswers] = useState<Record<string, number>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setAnswers(JSON.parse(raw))
    } catch { /* fresh start */ }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(answers)) }
    catch { /* ignore */ }
  }, [answers])

  const visibleIdx = phaseToVisibleIdx(phase)
  const visibleQuestion =
    visibleIdx >= 0 && visibleIdx < TOTAL ? ORDERED[visibleIdx] : null
  const activeDimension: Dimension =
    phase.kind === 'gate'        ? phase.toDim :
    visibleQuestion              ? visibleQuestion.dimension :
    'earth'
  const activeColor = REALMS[activeDimension].color

  const handleAnswer = useCallback((value: number) => {
    if (phase.kind !== 'question') return
    const idx = phase.idx
    const q = ORDERED[idx]
    setAnswers(prev => ({ ...prev, [q.id]: value }))
    setPhase({ kind: 'selected', idx, value })

    const lastQuestion = idx === TOTAL - 1

    setTimeout(() => {
      if (lastQuestion) {
        setPhase({ kind: 'finish-shoji-closing' })
        return
      }
      if (isRealmBoundary(idx)) {
        setPhase({ kind: 'gate-out', idx, value, gateIdx: idx + 1 })
      } else {
        setPhase({ kind: 'within-out', idx, value, nextIdx: idx + 1 })
      }
    }, T.selected)
  }, [phase])

  const handleGateContinue = useCallback(() => {
    if (phase.kind !== 'gate') return
    setPhase({ kind: 'gate-shoji-closing', toIdx: phase.nextIdx })
  }, [phase])

  useEffect(() => {
    switch (phase.kind) {
      case 'within-out': {
        const t = setTimeout(
          () => setPhase({ kind: 'within-in', idx: phase.nextIdx }),
          T.withinOut,
        )
        return () => clearTimeout(t)
      }
      case 'within-in': {
        const t = setTimeout(
          () => setPhase({ kind: 'question', idx: phase.idx }),
          T.withinIn,
        )
        return () => clearTimeout(t)
      }
      case 'gate-out': {
        const fromDim = ORDERED[phase.idx].dimension
        const toDim   = ORDERED[phase.gateIdx].dimension
        const t = setTimeout(
          () => setPhase({ kind: 'gate', fromDim, toDim, nextIdx: phase.gateIdx }),
          T.gateOut,
        )
        return () => clearTimeout(t)
      }
      case 'gate-shoji-closing': {
        const t = setTimeout(
          () => setPhase({ kind: 'gate-shoji-held', toIdx: phase.toIdx }),
          SHOJI_CLOSING_MS,
        )
        return () => clearTimeout(t)
      }
      case 'gate-shoji-held': {
        const t = setTimeout(
          () => setPhase({ kind: 'gate-shoji-opening', idx: phase.toIdx }),
          SHOJI_HELD_MS,
        )
        return () => clearTimeout(t)
      }
      case 'gate-shoji-opening': {
        const t = setTimeout(
          () => setPhase({ kind: 'question', idx: phase.idx }),
          SHOJI_OPENING_MS,
        )
        return () => clearTimeout(t)
      }
      case 'finish-shoji-closing': {
        const t = setTimeout(
          () => setPhase({ kind: 'finish-shoji-held' }),
          SHOJI_CLOSING_MS,
        )
        return () => clearTimeout(t)
      }
      case 'finish-shoji-held': {
        const t = setTimeout(() => router.push('/discovery/reveal'), SHOJI_HELD_MS)
        return () => clearTimeout(t)
      }
    }
  }, [phase, router])

  const handleBack = useCallback(() => {
    if (phase.kind !== 'question') return
    if (phase.idx === 0) {
      router.push('/discovery/presencing')
      return
    }
    setPhase({ kind: 'question', idx: phase.idx - 1 })
  }, [phase, router])

  const gateShoji: ShojiPhase =
    phase.kind === 'gate-shoji-closing' ? 'closing' :
    phase.kind === 'gate-shoji-held'    ? 'held'    :
    phase.kind === 'gate-shoji-opening' ? 'opening' :
    phase.kind === 'finish-shoji-closing' ? 'closing' :
    phase.kind === 'finish-shoji-held'    ? 'held'    :
    'idle'

  const curtainPhase: ShojiPhase = gateShoji !== 'idle' ? gateShoji : incoming

  const qVis = phaseToQuestionVisibility(phase)
  const showQuestion = phase.kind !== 'gate' && phase.kind !== 'gate-out'

  const selectedValue =
    phase.kind === 'selected'   ? phase.value :
    phase.kind === 'within-out' ? phase.value :
    phase.kind === 'gate-out'   ? phase.value : null

  // Counter readout — within-realm position when we're on a question,
  // "Passage" on the gate screens.
  const onGate = phase.kind === 'gate' || phase.kind === 'gate-out'
  const counterInfo = visibleQuestion ? realmInfo(visibleIdx) : null

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
        ['--active' as string]: activeColor,
      }}
    >
      <Atmosphere />
      <Sun />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 480,
          padding: '24px 24px calc(32px + env(safe-area-inset-bottom, 0px))',
          paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100dvh',
        }}
      >
        {/* Header: back (left) + within-realm counter with realm dots (right) */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingBottom: 8,
          }}
        >
          {visibleIdx > 0 && phase.kind === 'question' ? (
            <button
              onClick={handleBack}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(245,239,228,0.4)',
                fontFamily: 'var(--font-jetbrains), monospace',
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                padding: 4,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                position: 'relative',
                zIndex: 20,
              }}
            >
              ← Back
            </button>
          ) : <span />}

          {onGate ? (
            <span
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'rgba(245,239,228,0.5)',
              }}
            >
              Passage
            </span>
          ) : counterInfo && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  color: 'rgba(245,239,228,0.58)',
                }}
              >
                {counterInfo.positionInRealm} / {counterInfo.realmSize}
              </span>
              <RealmDots currentIndex={counterInfo.realmIndex} />
            </div>
          )}
        </header>

        <div style={{ flex: 1 }} />

        {/* Question block */}
        {showQuestion && visibleQuestion && (
          <div
            style={{
              opacity: qVis.opacity,
              transform: `translateY(${qVis.ty}px)`,
              transition: `opacity ${qVis.duration}ms cubic-bezier(0.22,0.61,0.36,1), transform ${qVis.duration}ms cubic-bezier(0.22,0.61,0.36,1)`,
              display: 'flex',
              flexDirection: 'column',
              gap: 28,
              paddingBottom: 40,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ width: 18, height: 1, background: 'var(--active)', opacity: 0.55 }} />
              <MetaLine dimension={visibleQuestion.dimension} variant="triplet" />
            </span>

            <h2
              style={{
                fontWeight: 300,
                fontSize: 'clamp(24px, 7vw, 32px)',
                lineHeight: 1.26,
                letterSpacing: '-0.015em',
                margin: 0,
                color: 'rgba(245,239,228,0.94)',
              }}
            >
              {visibleQuestion.text}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-jetbrains), monospace',
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(245,239,228,0.38)',
                }}
              >
                <span>Never</span>
                <span>Always</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(v => (
                  <ScaleButton
                    key={v}
                    value={v}
                    selected={selectedValue === v}
                    answered={answers[visibleQuestion.id] === v && phase.kind === 'question'}
                    onTap={() => handleAnswer(v)}
                    disabled={phase.kind !== 'question'}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Realm gate */}
        {phase.kind === 'gate' && (
          <RealmGate
            fromDim={phase.fromDim}
            toDim={phase.toDim}
            onContinue={handleGateContinue}
          />
        )}
      </div>

      <ShojiCurtain phase={curtainPhase} />
    </main>
  )
}

// ─── Realm dots — spatial progress indicator (5 small markers, one per realm) ─

function RealmDots({ currentIndex }: { currentIndex: number }) {
  return (
    <div style={{ display: 'flex', gap: 7 }}>
      {REALM_ORDER.map((d, i) => {
        const color = REALMS[d].color
        const isCurrent = i === currentIndex
        const isPast    = i <  currentIndex
        const size = 5
        return (
          <span
            key={d}
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              background: isCurrent
                ? color
                : isPast
                ? `color-mix(in oklab, ${color} 55%, transparent)`
                : 'transparent',
              border: isPast || isCurrent ? 'none' : `1px solid color-mix(in oklab, ${color} 40%, transparent)`,
              boxSizing: 'border-box',
              boxShadow: isCurrent ? `0 0 5px ${color}` : 'none',
              transition: 'all 0.5s',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── RealmGate ───────────────────────────────────────────────────────────────

function RealmGate({
  fromDim,
  toDim,
  onContinue,
}: {
  fromDim: Dimension
  toDim:   Dimension
  onContinue: () => void
}) {
  const from = REALMS[fromDim]
  const to   = REALMS[toDim]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        paddingBottom: 40,
        animation: 'disc-gate-in 700ms cubic-bezier(0.22,0.61,0.36,1) forwards',
      }}
    >
      <p
        style={{
          fontWeight: 300,
          fontStyle: 'italic',
          fontSize: 'clamp(26px, 7.5vw, 34px)',
          lineHeight: 1.18,
          letterSpacing: '-0.015em',
          margin: 0,
          color: 'rgba(245,239,228,0.94)',
        }}
      >
        {from.element} is seen.
      </p>

      <p
        style={{
          fontFamily: 'var(--font-jetbrains), monospace',
          fontSize: 11,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'rgba(245,239,228,0.42)',
          margin: 0,
        }}
      >
        Now we enter {to.dimension}.
      </p>

      <div
        style={{
          height: 1,
          background: 'linear-gradient(to right, transparent, rgba(245,239,228,0.18), transparent)',
          marginBlock: 4,
        }}
      />

      <MetaLine dimension={toDim} variant="quadruplet" size="md" />

      <button
        onClick={onContinue}
        style={{
          alignSelf: 'flex-start',
          marginTop: 12,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--active)',
          color: '#0f0b1a',
          border: 'none',
          padding: '13px 24px',
          fontFamily: 'var(--font-jetbrains), monospace',
          fontSize: 11,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          borderRadius: 999,
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          position: 'relative',
          zIndex: 20,
        }}
      >
        Continue
        <span style={{ width: 14, height: 1, background: '#0f0b1a', position: 'relative' }}>
          <span
            style={{
              position: 'absolute', right: -1, top: -3,
              width: 7, height: 7,
              borderTop: '1px solid #0f0b1a', borderRight: '1px solid #0f0b1a',
              transform: 'rotate(45deg)',
            }}
          />
        </span>
      </button>

      <style>{`
        @keyframes disc-gate-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  )
}

// ─── ScaleButton ─────────────────────────────────────────────────────────────

function ScaleButton({
  value, selected, answered, onTap, disabled,
}: {
  value:    number
  selected: boolean
  answered: boolean
  onTap:    () => void
  disabled: boolean
}) {
  const active = selected || answered
  return (
    <button
      onClick={onTap}
      disabled={disabled}
      aria-label={`Answer ${value}`}
      style={{
        flex: 1,
        aspectRatio: '1 / 1',
        maxHeight: 58,
        border: active ? '1.5px solid var(--active)' : '1px solid rgba(245,239,228,0.14)',
        background: active
          ? 'color-mix(in oklab, var(--active) 22%, transparent)'
          : 'rgba(245,239,228,0.03)',
        borderRadius: 12,
        color: active ? '#fff' : 'rgba(245,239,228,0.7)',
        fontFamily: 'var(--font-fraunces), serif',
        fontSize: 18,
        fontWeight: 300,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.25s cubic-bezier(0.22,0.61,0.36,1)',
        backdropFilter: 'blur(6px)',
        boxShadow: selected
          ? '0 0 24px color-mix(in oklab, var(--active) 45%, transparent)'
          : 'none',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        position: 'relative',
        zIndex: 20,
      }}
    >
      {value}
    </button>
  )
}

// ─── Phase helpers ───────────────────────────────────────────────────────────

function phaseToVisibleIdx(phase: Phase): number {
  switch (phase.kind) {
    case 'question':             return phase.idx
    case 'selected':             return phase.idx
    case 'within-out':           return phase.idx
    case 'within-in':            return phase.idx
    case 'gate-out':             return phase.idx
    case 'gate':                 return -1
    case 'gate-shoji-closing':   return phase.toIdx
    case 'gate-shoji-held':      return phase.toIdx
    case 'gate-shoji-opening':   return phase.idx
    case 'finish-shoji-closing': return TOTAL - 1
    case 'finish-shoji-held':    return TOTAL - 1
  }
}

function phaseToQuestionVisibility(phase: Phase): {
  opacity: number
  ty:      number
  duration: number
} {
  switch (phase.kind) {
    case 'question':
    case 'selected':
    case 'gate-shoji-held':
    case 'gate-shoji-opening':
      return { opacity: 1, ty: 0, duration: 0 }
    case 'within-out':
    case 'gate-out':
    case 'finish-shoji-closing':
    case 'finish-shoji-held':
      return { opacity: 0, ty: -8, duration: T.withinOut }
    case 'gate':
    case 'gate-shoji-closing':
      return { opacity: 0, ty: 0, duration: 0 }
    case 'within-in':
      return { opacity: 1, ty: 0, duration: T.withinIn }
  }
}
