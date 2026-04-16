'use client'

/**
 * results/page.tsx — Aetherium Personal Intelligence System
 *
 * Not a results page. A living dashboard.
 *
 * Section order:
 *   0  Loading       "Interpreting your field…"
 *   1  Identity      archetype blend + derivation
 *   ·  Tension       single mirror statement
 *   ·  Alignment     today's 3 prioritised actions  [NEW]
 *   ·  Imbalance     system tension analysis         [NEW]
 *   2  Dimensional   radar + per-dimension + "how derived" accordions  [NEW]
 *   3  Progress      score history comparison         [NEW]
 *   4  The Door      growth edge
 *   5  Evolution     pathway cards
 *   6  Practices     3 enriched actions (why / impact / timeframe)  [NEW]
 *   7  Archetype     full profile detail
 *   ·  Footer
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter }                     from 'next/navigation'
import Link                              from 'next/link'
import { DimensionChart }               from '@/components/DimensionChart'
import { EnergyField }                  from '@/components/EnergyField'
import { Progress }                     from '@/components/ui/Progress'
import { Button }                       from '@/components/ui/Button'
import { Card }                         from '@/components/ui/Card'
import {
  DIMENSION_META,
  DIMENSIONS_ORDER,
  getQuestionsForDimension,
}                                        from '@/lib/assessment/questions'
import { getDimensionInterpretation }   from '@/lib/scoring/engine'
import { STATE_LABELS }                 from '@/lib/pathways/growth'
import type { ResultPayload }           from '@/lib/types/results'
import { fetchAndReconstructPayload, saveProfileRecord } from '@/lib/persistence/profiles'
// getRole import removed — canonicalRoleId no longer exists on Archetype
import { PreviewNav }                   from '@/components/dev/PreviewNav'
import {
  PREVIEW_RESULT,
  PREVIEW_ANSWERS,
  PREVIEW_HISTORY,
}                                        from '@/lib/dev/previewMock'
import {
  getTension,
  deriveTodayAlignment,
  deriveImbalanceInsight,
  PRACTICE_META,
  loadScoreHistory,
  saveScoreSnapshot,
  type ScoreSnapshot,
}                                        from '@/lib/intelligence'
import type { Dimension }               from '@/lib/assessment/questions'

// ─── Types ────────────────────────────────────────────────────────────────────

type ResultsData = ResultPayload

// ─── Dimension → Progress color key ──────────────────────────────────────────

const DIM_COLOR: Record<Dimension, 'purple' | 'fire' | 'air' | 'water' | 'earth'> = {
  aether: 'purple', fire: 'fire', air: 'air', water: 'water', earth: 'earth',
}

// ─── Likert labels ────────────────────────────────────────────────────────────

const SCALE: Record<number, string> = {
  1: 'Never', 2: 'Rarely', 3: 'Sometimes', 4: 'Often', 5: 'Always',
}

// ─── Micro-helpers ────────────────────────────────────────────────────────────

function SectionLabel({ n, children, color }: { n: string; children: React.ReactNode; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.55em', textTransform: 'uppercase', color: color ? `${color}55` : 'rgba(234,232,242,0.2)' }}>
        {n}
      </span>
      <div style={{ width: 20, height: 1, background: color ? `${color}22` : 'rgba(234,232,242,0.07)', flexShrink: 0 }} />
      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.42em', textTransform: 'uppercase', color: color ? `${color}88` : 'rgba(234,232,242,0.32)' }}>
        {children}
      </span>
    </div>
  )
}

function Hairline({ color }: { color?: string }) {
  return (
    <div style={{
      height: 1, margin: '80px 0',
      background: color
        ? `linear-gradient(to right, transparent, ${color}1a, transparent)`
        : 'linear-gradient(to right, transparent, rgba(234,232,242,0.07), transparent)',
    }} />
  )
}

function Chevron({ open, color }: { open: boolean; color?: string }) {
  return (
    <div style={{
      width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
      transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 0.22s ease',
      color: color ?? 'rgba(234,232,242,0.3)', fontSize: 12, flexShrink: 0,
    }}>›</div>
  )
}

// Small priority indicator dot
function PriorityDot({ priority, color }: { priority: 'critical' | 'important' | 'maintain'; color: string }) {
  const isMaintain = priority === 'maintain'
  return (
    <div style={{
      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
      background: isMaintain ? 'transparent' : color,
      border: isMaintain ? `1px solid ${color}88` : 'none',
      opacity: priority === 'critical' ? 0.9 : priority === 'important' ? 0.65 : 0.4,
      boxShadow: priority === 'critical' ? `0 0 6px ${color}60` : 'none',
    }} />
  )
}

// Dimension chip tag
function DimTag({ dim }: { dim: Dimension }) {
  const meta = DIMENSION_META[dim]
  return (
    <span style={{
      fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.22em', textTransform: 'uppercase',
      color: meta.color, background: `${meta.color}12`,
      border: `1px solid ${meta.color}28`, borderRadius: 2,
      padding: '2px 7px', flexShrink: 0,
    }}>
      {meta.label}
    </span>
  )
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <main style={{ minHeight: '100vh', background: '#08080e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, position: 'relative', overflow: 'hidden' }}>
      <EnergyField size={520} opacity={0.2} />
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.58em', textTransform: 'uppercase', color: 'rgba(149,144,236,0.5)' }}>
          Interpreting your field
        </p>
        <div style={{ display: 'flex', gap: 7 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: '50%', background: 'rgba(149,144,236,0.45)',
              animation: 'dm-pulse 1.7s ease-in-out infinite', animationDelay: `${i * 0.3}s`,
            }} />
          ))}
        </div>
      </div>
    </main>
  )
}

// ─── No-data fallback ─────────────────────────────────────────────────────────

function NoDataState() {
  return (
    <main style={{ minHeight: '100vh', background: '#08080e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: 'rgba(234,232,242,0.4)' }}>
        No assessment results found.
      </p>
      <Link href="/assessment"><Button>Begin Assessment</Button></Link>
    </main>
  )
}

// ─── Today's Alignment panel ──────────────────────────────────────────────────

function TodayAlignmentPanel({ data }: { data: ResultsData }) {
  const actions = deriveTodayAlignment(data)
  const today   = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{
      border: '1px solid rgba(234,232,242,0.07)',
      borderRadius: 4,
      background: 'rgba(234,232,242,0.018)',
      overflow: 'hidden',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid rgba(234,232,242,0.06)',
        background: 'rgba(234,232,242,0.02)',
      }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.5)' }}>
          Today&apos;s Alignment
        </span>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: 'rgba(234,232,242,0.28)', fontStyle: 'italic' }}>
          {today}
        </span>
      </div>

      {/* Action rows */}
      {actions.map((a, i) => {
        const meta = DIMENSION_META[a.dimension]
        return (
          <div
            key={a.slot}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 16,
              padding: '18px 20px',
              borderBottom: i < actions.length - 1 ? '1px solid rgba(234,232,242,0.04)' : 'none',
            }}
          >
            {/* Priority + slot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0, paddingTop: 2, minWidth: 72 }}>
              <PriorityDot priority={a.priority} color={meta.color} />
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.22)', textAlign: 'center', lineHeight: 1.5 }}>
                {a.slot}
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(234,232,242,0.05)', flexShrink: 0 }} />

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                <DimTag dim={a.dimension} />
                <span style={{
                  fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: a.priority === 'critical' ? `${meta.color}88` : a.priority === 'important' ? 'rgba(234,232,242,0.32)' : 'rgba(234,232,242,0.18)',
                }}>
                  {a.priority}
                </span>
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: 'rgba(234,232,242,0.72)', lineHeight: 1.68 }}>
                {a.action}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── System imbalance panel ───────────────────────────────────────────────────

function ImbalancePanel({ data }: { data: ResultsData }) {
  const insight   = deriveImbalanceInsight(data)
  const domDim    = data.dominantDimension
  const edgeDim   = data.growthProfile.growthEdge.dimension
  const domMeta   = DIMENSION_META[domDim]
  const edgeMeta  = edgeDim ? DIMENSION_META[edgeDim] : domMeta
  const domScore  = data.scoring.dimensions[domDim]
  const edgeScore = edgeDim ? data.scoring.dimensions[edgeDim] : 0

  return (
    <div style={{ border: '1px solid rgba(224,90,58,0.12)', borderRadius: 4, background: 'rgba(224,90,58,0.025)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(224,90,58,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e05a3a', opacity: 0.7, flexShrink: 0 }} />
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(224,90,58,0.55)' }}>
          System Imbalance
        </span>
      </div>

      <div style={{ padding: '20px 20px 22px' }}>
        {/* Headline */}
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: '#eae8f2', marginBottom: '1.2rem', lineHeight: 1.3 }}>
          {insight.headline}
        </p>

        {/* Gap visualisation — two mini bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.4rem', maxWidth: 360 }}>
          {[
            { dim: domDim,  meta: domMeta,  score: domScore  },
            { dim: edgeDim, meta: edgeMeta, score: edgeScore },
          ].map(({ meta, score }) => (
            <div key={meta.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.2em', textTransform: 'uppercase', color: meta.color, minWidth: 52 }}>
                {meta.label}
              </span>
              <div style={{ flex: 1, height: 2, background: 'rgba(234,232,242,0.06)', position: 'relative', borderRadius: 1 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${score}%`, background: meta.color, opacity: 0.6, borderRadius: 1 }} />
              </div>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: `${meta.color}aa`, minWidth: 24, textAlign: 'right' }}>
                {score}
              </span>
            </div>
          ))}
        </div>

        {/* Body + behavioral */}
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: 'rgba(234,232,242,0.58)', lineHeight: 1.75, marginBottom: '1rem' }}>
          {insight.body}
        </p>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: 'italic', color: 'rgba(234,232,242,0.42)', lineHeight: 1.72, marginBottom: '1.2rem', paddingLeft: 14, borderLeft: '2px solid rgba(224,90,58,0.2)' }}>
          {insight.behavioral}
        </p>

        {/* Intervention */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: `${edgeMeta.color}0a`, border: `1px solid ${edgeMeta.color}18`, borderRadius: 3 }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.28em', textTransform: 'uppercase', color: `${edgeMeta.color}88`, flexShrink: 0, paddingTop: 1 }}>
            Intervention
          </span>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: 'rgba(234,232,242,0.68)', lineHeight: 1.65 }}>
            {insight.intervention}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Dimension derivation accordion ──────────────────────────────────────────

function DimensionDerivation({
  dim,
  rawAverage,
  rawAnswers,
}: {
  dim:        Dimension
  rawAverage: number
  rawAnswers: Record<string, number> | null
}) {
  const [open, setOpen] = useState(false)
  const meta      = DIMENSION_META[dim]
  const questions = getQuestionsForDimension(dim)

  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
        }}
      >
        <Chevron open={open} color={`${meta.color}88`} />
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.28em', textTransform: 'uppercase', color: `${meta.color}66` }}>
          How this score was calculated
        </span>
      </button>

      {open && (
        <div style={{ marginTop: 14, padding: '16px 18px', background: 'rgba(234,232,242,0.015)', border: '1px solid rgba(234,232,242,0.06)', borderRadius: 3 }}>
          {/* Formula summary */}
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, color: 'rgba(234,232,242,0.35)', lineHeight: 1.65, marginBottom: 14 }}>
            Score derived from 10 questions answered on a 1–5 scale. Reversed questions are
            inverted before averaging. Formula: ((mean − 1) ÷ 4) × 100.
            <span style={{ marginLeft: 8, color: `${meta.color}88` }}>
              Response average: {rawAverage.toFixed(2)} / 5.0
            </span>
          </p>

          {/* Per-question rows */}
          {rawAnswers ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {questions.map((q, qi) => {
                const raw    = rawAnswers[q.id]
                const scored = raw !== undefined ? (q.reverseScored ? 6 - raw : raw) : null

                return (
                  <div
                    key={q.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '18px 1fr auto auto',
                      gap: 10, alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: qi < questions.length - 1 ? '1px solid rgba(234,232,242,0.03)' : 'none',
                      opacity: raw !== undefined ? 1 : 0.4,
                    }}
                  >
                    {/* Q number */}
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, color: 'rgba(234,232,242,0.2)' }}>
                      {String(qi + 1).padStart(2, '0')}
                    </span>

                    {/* Question text */}
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: 'rgba(234,232,242,0.55)', lineHeight: 1.5 }}>
                      {q.text}
                      {q.reverseScored && (
                        <span style={{ marginLeft: 6, fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.2em', color: 'rgba(212,133,58,0.6)' }}>↺ reversed</span>
                      )}
                    </p>

                    {/* Response dots */}
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[1, 2, 3, 4, 5].map(v => (
                        <div key={v} style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: raw === v ? meta.color : 'rgba(234,232,242,0.1)',
                          boxShadow: raw === v ? `0 0 4px ${meta.color}60` : 'none',
                        }} />
                      ))}
                    </div>

                    {/* Label + scored value */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 62 }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, color: raw !== undefined ? `${meta.color}99` : 'rgba(234,232,242,0.2)' }}>
                        {raw !== undefined ? SCALE[raw] : '—'}
                      </span>
                      {q.reverseScored && scored !== null && raw !== undefined && (
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, color: 'rgba(212,133,58,0.5)', letterSpacing: '0.15em' }}>
                          →{scored}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: 'rgba(234,232,242,0.3)', fontStyle: 'italic' }}>
              Answer data unavailable for this session. Score was computed from {questions.length} responses with a mean of {rawAverage.toFixed(2)}.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Archetype derivation panel ───────────────────────────────────────────────

function ArchetypeDerivationPanel({ data }: { data: ResultsData }) {
  const [open, setOpen] = useState(false)
  const { primary, secondary, tertiary } = data.archetypeBlend
  const dims = data.scoring.dimensions

  const top3 = [primary, secondary, tertiary]

  return (
    <div style={{ marginTop: 24 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
      >
        <Chevron open={open} />
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.28)' }}>
          How this archetype was identified
        </span>
      </button>

      {open && (
        <div style={{ marginTop: 16, padding: '20px 20px 22px', background: 'rgba(234,232,242,0.015)', border: '1px solid rgba(234,232,242,0.06)', borderRadius: 3 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: 'rgba(234,232,242,0.35)', lineHeight: 1.65, marginBottom: 20 }}>
            Your dimensional scores were matched against 32 archetypal signatures using Euclidean
            distance on a 5-dimensional vector. Similarity = 1 − (distance ÷ 223.6).
          </p>

          {/* User profile vector */}
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.22)', marginBottom: 12 }}>
            Your profile
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 24 }}>
            {DIMENSIONS_ORDER.map(d => {
              const meta = DIMENSION_META[d]
              return (
                <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase', color: meta.color, minWidth: 52 }}>
                    {meta.label}
                  </span>
                  <div style={{ flex: 1, height: 2, background: 'rgba(234,232,242,0.06)', position: 'relative', borderRadius: 1 }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${dims[d]}%`, background: meta.color, opacity: 0.7, borderRadius: 1 }} />
                  </div>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: `${meta.color}aa`, minWidth: 24, textAlign: 'right' }}>
                    {dims[d]}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Top 3 matches */}
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.22)', marginBottom: 14 }}>
            Top matches
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {top3.map((match, rank) => {
              const arch    = match.archetype
              const simPct  = Math.round(match.similarity * 100)
              const isPrimary = rank === 0

              return (
                <div key={arch.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, color: 'rgba(234,232,242,0.2)', minWidth: 16 }}>
                      {String(rank + 1).padStart(2, '0')}
                    </span>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: isPrimary ? '#eae8f2' : 'rgba(234,232,242,0.5)' }}>
                      {arch.name}
                    </span>
                    {isPrimary && (
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.18em', color: 'rgba(149,144,236,0.55)', marginLeft: 4 }}>
                        ← PRIMARY
                      </span>
                    )}
                    <span style={{ marginLeft: 'auto', fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: isPrimary ? 'rgba(149,144,236,0.7)' : 'rgba(234,232,242,0.28)' }}>
                      {simPct}%
                    </span>
                  </div>
                  {/* Similarity bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 26 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(234,232,242,0.06)', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${simPct}%`, background: isPrimary ? 'rgba(149,144,236,0.5)' : 'rgba(234,232,242,0.18)' }} />
                    </div>
                  </div>
                  {/* Archetype ideal vs user comparison (top match only) */}
                  {isPrimary && (
                    <div style={{ display: 'flex', gap: 6, marginLeft: 26, flexWrap: 'wrap' }}>
                      {DIMENSIONS_ORDER.map(d => {
                        const meta     = DIMENSION_META[d]
                        const userVal  = dims[d]
                        const archVal  = arch.vector[d]
                        const delta    = userVal - archVal
                        return (
                          <span key={d} style={{
                            fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.15em',
                            color: Math.abs(delta) <= 10 ? `${meta.color}88` : 'rgba(234,232,242,0.28)',
                            background: `${meta.color}0a`,
                            border: `1px solid ${meta.color}18`, borderRadius: 2, padding: '2px 6px',
                          }}>
                            {meta.label} {userVal}/{archVal}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Progress over time panel ─────────────────────────────────────────────────

function ProgressPanel({
  current,
  history,
}: {
  current: ResultsData
  history: ScoreSnapshot[]
}) {
  const prev = history[history.length - 1] ?? null

  if (!prev) {
    return (
      <div style={{ padding: '28px 24px', border: '1px solid rgba(234,232,242,0.06)', borderRadius: 4, background: 'rgba(234,232,242,0.015)', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.22)', marginBottom: 12 }}>
          First Assessment
        </p>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontStyle: 'italic', color: 'rgba(234,232,242,0.35)', lineHeight: 1.7 }}>
          Your baseline has been captured. Return after deliberate practice to see your dimensional evolution.
        </p>
      </div>
    )
  }

  const prevDate = new Date(prev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const currDate = new Date(current.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div style={{ border: '1px solid rgba(234,232,242,0.06)', borderRadius: 4, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(234,232,242,0.05)', background: 'rgba(234,232,242,0.018)' }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.35)' }}>
          Score Comparison
        </span>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: 'rgba(234,232,242,0.28)', fontStyle: 'italic' }}>
          {prevDate} → {currDate}
        </span>
      </div>

      {/* Dimension rows */}
      <div style={{ padding: '8px 0' }}>
        {DIMENSIONS_ORDER.map(dim => {
          const meta    = DIMENSION_META[dim]
          const prevVal = prev.dimensions[dim] ?? 0
          const currVal = current.scoring.dimensions[dim]
          const delta   = currVal - prevVal
          const isUp    = delta > 0
          const isFlat  = delta === 0

          return (
            <div key={dim} style={{ display: 'grid', gridTemplateColumns: '56px 1fr 36px auto', gap: 12, alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid rgba(234,232,242,0.03)' }}>
              {/* Label */}
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase', color: meta.color }}>
                {meta.label}
              </span>

              {/* Dual progress bar */}
              <div style={{ position: 'relative', height: 6 }}>
                {/* Previous (faint) */}
                <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: `${prevVal}%`, height: 2, background: `${meta.color}25`, borderRadius: 1 }} />
                {/* Current (bright) */}
                <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: `${currVal}%`, height: 4, background: `${meta.color}70`, borderRadius: 1 }} />
              </div>

              {/* Current score */}
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 300, color: `${meta.color}cc`, textAlign: 'right' }}>
                {currVal}
              </span>

              {/* Delta */}
              <span style={{
                fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.15em',
                color: isFlat ? 'rgba(234,232,242,0.2)' : isUp ? 'rgba(45,184,133,0.75)' : 'rgba(224,90,58,0.65)',
                minWidth: 36, textAlign: 'right',
              }}>
                {isFlat ? '—' : `${isUp ? '↑' : '↓'}${Math.abs(delta)}`}
              </span>
            </div>
          )
        })}
      </div>

      {/* Footer summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '14px 20px', borderTop: '1px solid rgba(234,232,242,0.05)', background: 'rgba(234,232,242,0.012)', gap: 12 }}>
        {[
          { label: 'Overall Score',  prev: prev.overallScore,   curr: current.scoring.overallScore   },
          { label: 'Coherence',      prev: prev.coherenceScore, curr: current.scoring.coherenceScore },
        ].map(({ label, prev: p, curr: c }) => {
          const delta = c - p
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.22)' }}>
                {label}
              </span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: 'rgba(234,232,242,0.55)' }}>
                {p} → {c}
              </span>
              {delta !== 0 && (
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: delta > 0 ? 'rgba(45,184,133,0.65)' : 'rgba(224,90,58,0.6)' }}>
                  {delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Previous archetype note */}
      <div style={{ padding: '10px 20px 14px', borderTop: '1px solid rgba(234,232,242,0.04)' }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: 'rgba(234,232,242,0.28)', fontStyle: 'italic' }}>
          Previous archetype: {prev.archetypeName}
        </p>
      </div>
    </div>
  )
}

// ─── Enhanced practice item ───────────────────────────────────────────────────

function EnhancedPracticeItem({
  practice,
  index,
  growthDim,
}: {
  practice:  string
  index:     number
  growthDim: Dimension
}) {
  const [open, setOpen] = useState(false)
  const meta            = PRACTICE_META[growthDim]?.[index]
  const dimMeta         = meta ? DIMENSION_META[meta.dimension] : DIMENSION_META[growthDim]

  return (
    <div style={{ borderBottom: '1px solid rgba(234,232,242,0.05)' }}>
      {/* Practice row */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', padding: '24px 0' }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.2em', color: 'rgba(45,184,133,0.38)', flexShrink: 0, marginTop: 2, minWidth: 22 }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: 'rgba(234,232,242,0.78)', lineHeight: 1.72, flex: 1 }}>
          {practice}
        </p>
        {meta && (
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              background: 'none', border: '1px solid rgba(234,232,242,0.07)', borderRadius: 3,
              padding: '5px 10px', cursor: 'pointer',
            }}
          >
            <Chevron open={open} />
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.3)' }}>
              Why
            </span>
          </button>
        )}
      </div>

      {/* Expanded enrichment */}
      {open && meta && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', marginBottom: 20, border: '1px solid rgba(234,232,242,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          {[
            { heading: 'Why this practice', body: meta.why,      headingColor: 'rgba(234,232,242,0.28)' },
            { heading: 'Expected impact',   body: meta.impact,   headingColor: `${dimMeta.color}88`     },
            { heading: 'Timeframe',         body: meta.timeframe, headingColor: 'rgba(45,184,133,0.55)' },
          ].map(({ heading, body, headingColor }) => (
            <div key={heading} style={{ padding: '16px 18px', background: 'rgba(234,232,242,0.018)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                {heading === 'Expected impact' && <DimTag dim={meta.dimension} />}
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.28em', textTransform: 'uppercase', color: headingColor }}>
                  {heading}
                </p>
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: 'rgba(234,232,242,0.55)', lineHeight: 1.7 }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const router = useRouter()
  const [data,       setData]      = useState<ResultsData | null>(null)
  const [loaded,     setLoaded]    = useState(false)
  const [revealing,  setRevealing] = useState(true)
  const [synced,     setSynced]    = useState(false)
  const [rawAnswers, setRawAnswers] = useState<Record<string, number> | null>(null)
  const [history,    setHistory]   = useState<ScoreSnapshot[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Save profile state ────────────────────────────────────────────────────
  type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  async function handleSaveProfile() {
    if (saveStatus === 'saving' || saveStatus === 'saved') return
    setSaveStatus('saving')

    try {
      // Read identity stored during /assessment/identity
      const rawIdentity = localStorage.getItem('ae_identity')
      if (!rawIdentity) throw new Error('No identity data found. Please complete the identity step first.')

      const id = JSON.parse(rawIdentity) as {
        firstName:  string
        lastName?:  string
        email:      string
        birthDate?: string
        location?:  { city?: string; region?: string; country?: string; timezone?: string }
      }

      // ae_assessment_id is cleared by generating/page.tsx after persistence.
      // The canonical source is data.assessmentId (patched into the payload before
      // localStorage write). ae_profile_state_id stays set through to this page.
      const assessmentId   = data?.assessmentId                                            || null
      const profileStateId = data?.profileStateId || localStorage.getItem('ae_profile_state_id') || null

      await saveProfileRecord({
        identity: {
    email: id.email,
firstName: id.firstName,
lastName: id.lastName || '',
birthDate: id.birthDate || null,
city: id.location?.city || '',
region: id.location?.region || '',
country: id.location?.country || '',
        },
        assessmentId,
        profileStateId,
      })

      setSaveStatus('saved')
      setSynced(true)
    } catch (err) {
      console.error('[Aetherium] Save profile failed:', err)
      setSaveStatus('error')
    }
  }

  useEffect(() => {
    const loadStart = Date.now()

    function finalize(payload: ResultsData | null) {
      if (payload) {
        setData(payload)
        // Save snapshot for future progress comparisons
        saveScoreSnapshot(payload)
      }
      setLoaded(true)
      const remaining = Math.max(0, 1600 - (Date.now() - loadStart))
      timerRef.current = setTimeout(() => setRevealing(false), remaining)
    }

    async function load() {
      // DEV: preview bypass
      const params = new URLSearchParams(window.location.search)
      if (params.get('preview') === '1') {
        setRawAnswers(PREVIEW_ANSWERS)
        setHistory(PREVIEW_HISTORY)
        finalize(PREVIEW_RESULT)
        return
      }

      // ── Temporary client-side identity guard ──────────────────────────────
      // Prevents direct URL access to /results without passing through the
      // commitment step (/assessment/identity). This is a prototype-level guard
      // only — it relies on localStorage and can be bypassed by a determined user.
      //
      // TODO (production): Replace with server-side session check so that full
      // results are only served to authenticated (and eventually subscribed) users.
      // The natural upgrade path is: middleware.ts checks for a valid Supabase
      // session cookie; if absent, redirect to /assessment/identity with ?next=/results.
      const hasIdentity = Boolean(localStorage.getItem('ae_identity'))
      if (!hasIdentity) {
        router.replace('/assessment/identity')
        return
      }
      // ── End guard ──────────────────────────────────────────────────────────

      // Load raw answers for derivation panel
      try {
        const raw = localStorage.getItem('ae_assessment_answers')
        if (raw) setRawAnswers(JSON.parse(raw))
      } catch { /* ignore */ }

      // Load score history
      setHistory(loadScoreHistory())

      // Fast path: localStorage
      const raw = localStorage.getItem('ae_results')
      if (raw) {
        try {
          const parsed: ResultsData = JSON.parse(raw)
          if (parsed.profileStateId) setSynced(true)
          finalize(parsed)
          return
        } catch { /* malformed */ }
      }

      // Supabase fallback
      const storedProfileId = localStorage.getItem('ae_profile_state_id')
      if (storedProfileId) {
        try {
          const payload = await fetchAndReconstructPayload(storedProfileId)
          if (payload) {
            setSynced(true)
            localStorage.setItem('ae_results', JSON.stringify(payload))
            finalize(payload)
            return
          }
        } catch { /* unavailable */ }
      }

      finalize(null)
    }

    load()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  // ── Gate renders ────────────────────────────────────────────────────────

  if (!loaded || revealing) return <LoadingState />
  if (!data)                 return <NoDataState />

  // ── Destructure ─────────────────────────────────────────────────────────

  const { scoring, archetypeBlend, growthProfile, dominantDimension, signalQuality } = data
  const { dimensions, profiles, coherenceScore }                       = scoring
  const { primary, secondary, tertiary, shadow, blendTitle }           = archetypeBlend
  const { growthEdge, evolutionPathway, practices }                    = growthProfile

  const tensionText         = getTension(dominantDimension, growthEdge.dimension ?? dominantDimension)
  const dominantColor       = DIMENSION_META[dominantDimension].color
  const edgeColor           = growthEdge.dimension ? DIMENSION_META[growthEdge.dimension].color : dominantColor

  // Signal quality: balanced system + low confidence = dedicated mode
  const isBalancedLowSignal = signalQuality?.isBalancedSystem && signalQuality?.confidence === 'low'
  // Shadow-as-primary: use compassion register
  const isShadowPrimary     = primary.archetype.category === 'shadow'
  const mirrorStatement     = isShadowPrimary && primary.archetype.whenPrimary
    ? primary.archetype.whenPrimary
    : primary.archetype.aiOutput

  const W = 900

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <main className="page-atmosphere" style={{ position: 'relative', overflow: 'hidden' }}>
      <EnergyField size={1000} opacity={0.3} />

      {/* ── TOP NAV ─────────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 20, borderBottom: '1px solid rgba(234,232,242,0.05)', background: 'rgba(8,8,14,0.94)', backdropFilter: 'blur(18px)', padding: '1rem 0' }}>
        <div style={{ maxWidth: W, margin: '0 auto', padding: '0 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.42em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.24)', textDecoration: 'none' }}>
            Aetherium
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {synced && (
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(45,184,133,0.48)' }}>
                · saved
              </span>
            )}
            <Link href="/assessment"><Button variant="ghost" size="sm">Reassess</Button></Link>
          </div>
        </div>
      </nav>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: W, margin: '0 auto', padding: '7rem 2.5rem 9rem', position: 'relative', zIndex: 10 }}>

        {/* ══════════════════════════════════════════════════════════════════
            01 — IDENTITY
        ══════════════════════════════════════════════════════════════════ */}
        <SectionLabel n="01" color={dominantColor}>Identity</SectionLabel>

        {/* ── Balanced / Low Signal Mode ──────────────────────────────── */}
        {isBalancedLowSignal && (
          <div style={{
            padding: '1.8rem 2rem', marginBottom: '2.5rem',
            border: '1px solid rgba(149,144,236,0.12)', borderRadius: 4,
            background: 'rgba(149,144,236,0.03)',
          }}>
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.42em', textTransform: 'uppercase', color: 'rgba(149,144,236,0.5)', marginBottom: 14 }}>
              Balanced System Detected
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: 'rgba(234,232,242,0.55)', lineHeight: 1.7, marginBottom: 12 }}>
              Your five dimensions are closely balanced. This may reflect genuine equilibrium — or it may mean the assessment did not fully capture the range of your experience.
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: 'rgba(234,232,242,0.38)', lineHeight: 1.7 }}>
              The archetype below is approximate. For sharper resolution, consider retaking after a week of deliberate self-observation — notice where energy flows easily and where it stalls.
            </p>
          </div>
        )}

        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.28)', marginBottom: '1.5rem' }}>
          You are currently operating as:
        </p>

        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(50px, 8.5vw, 94px)', fontWeight: 300, color: '#eae8f2', letterSpacing: '-0.025em', lineHeight: 1.0, marginBottom: '1rem' }}>
          {blendTitle}
        </h1>

        {/* When Aligned — what this looks like at its best */}
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(17px, 2.2vw, 22px)', color: `${dominantColor}b0`, marginBottom: '0.8rem', lineHeight: 1.55 }}>
          {primary.archetype.whenAligned}
        </p>

        {/* Mirror statement — compassion register for Shadow-as-primary, standard for others */}
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isShadowPrimary ? 16 : 'clamp(15px, 1.8vw, 18px)', fontStyle: 'italic', color: isShadowPrimary ? 'rgba(234,232,242,0.52)' : `${dominantColor}80`, marginBottom: '2rem', lineHeight: 1.7, maxWidth: isShadowPrimary ? 640 : undefined }}>
          {mirrorStatement}
        </p>

        <div style={{ marginBottom: '3.5rem' }} />

        {/* Blend bars */}
        <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {([
            { match: primary,   role: 'Primary'   },
            { match: secondary, role: 'Secondary' },
            { match: tertiary,  role: 'Tertiary'  },
          ] as const).map(({ match, role }) => (
            <div key={match.archetype.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.22)', minWidth: 60 }}>
                {role}
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(234,232,242,0.07)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${match.percentage}%`, background: `linear-gradient(to right, ${dominantColor}70, transparent)` }} />
              </div>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: 'rgba(234,232,242,0.65)', minWidth: 148 }}>
                {match.archetype.name}
              </span>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.18em', color: 'rgba(234,232,242,0.28)', minWidth: 30, textAlign: 'right' }}>
                {match.percentage}%
              </span>
            </div>
          ))}

          {/* Shadow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 20, marginTop: 4, borderTop: '1px solid rgba(234,232,242,0.05)' }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(224,90,58,0.4)', minWidth: 60 }}>
              Shadow
            </span>
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: 'rgba(234,232,242,0.42)', minWidth: 148 }}>
              {shadow.name}
            </span>
            <div style={{ minWidth: 30 }} />
          </div>
        </div>

        {/* Archetype derivation (collapsible) */}
        <ArchetypeDerivationPanel data={data} />

        <Hairline />

        {/* ══════════════════════════════════════════════════════════════════
            TENSION STATEMENT
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(20px, 2.8vw, 29px)', fontStyle: 'italic', fontWeight: 300, color: 'rgba(234,232,242,0.5)', lineHeight: 1.7, maxWidth: 700, margin: '0 auto' }}>
            &ldquo;{tensionText}&rdquo;
          </p>
        </div>

        <Hairline />

        {/* ══════════════════════════════════════════════════════════════════
            TODAY'S ALIGNMENT
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.42em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.22)', marginBottom: 24 }}>
            Daily Intelligence
          </p>
        </div>
        <TodayAlignmentPanel data={data} />

        <div style={{ height: 40 }} />

        {/* ══════════════════════════════════════════════════════════════════
            SYSTEM IMBALANCE
        ══════════════════════════════════════════════════════════════════ */}
        <ImbalancePanel data={data} />

        <Hairline color="#4a9fd4" />

        {/* ══════════════════════════════════════════════════════════════════
            02 — DIMENSIONAL STATE
        ══════════════════════════════════════════════════════════════════ */}
        <SectionLabel n="02" color="#4a9fd4">Dimensional State</SectionLabel>

        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontStyle: 'italic', color: 'rgba(234,232,242,0.3)', marginBottom: '3.5rem', letterSpacing: '0.08em' }}>
          Your dimensional field
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '4.5rem', alignItems: 'start' }}>
          {/* Radar + coherence */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
            <DimensionChart scores={dimensions} size={260} animated />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.2)', marginBottom: 8 }}>
                Coherence
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 300, color: coherenceScore >= 70 ? '#2db885' : coherenceScore >= 45 ? '#d4853a' : '#e05a3a', lineHeight: 1, marginBottom: 6 }}>
                {coherenceScore}
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, color: 'rgba(234,232,242,0.22)' }}>
                consistency of field
              </p>
            </div>
          </div>

          {/* Dimension list with derivation accordions */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {DIMENSIONS_ORDER.map(dim => {
              const profile = profiles[dim]
              const meta    = DIMENSION_META[dim]
              const interp  = getDimensionInterpretation(dim, profile.score)

              return (
                <div key={dim} style={{ padding: '18px 0', borderBottom: '1px solid rgba(234,232,242,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flexShrink: 0, width: 2, height: 46, marginTop: 4, background: `linear-gradient(to bottom, ${meta.color}cc, transparent)`, borderRadius: 1 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div>
                          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: meta.color, marginRight: 10 }}>
                            {meta.label}
                          </span>
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, fontStyle: 'italic', color: 'rgba(234,232,242,0.28)' }}>
                            {meta.subtitle.split(' · ')[0]}
                          </span>
                        </div>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: `${meta.color}bb` }}>
                          {profile.score}
                        </span>
                      </div>
                      <Progress value={profile.score} color={DIM_COLOR[dim]} className="mb-2.5" />
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: 'rgba(234,232,242,0.5)', lineHeight: 1.68 }}>
                        {interp}
                      </p>
                      {/* "How derived" accordion */}
                      <DimensionDerivation
                        dim={dim}
                        rawAverage={profile.rawAverage}
                        rawAnswers={rawAnswers}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <Hairline color="rgba(45,184,133,0.5)" />

        {/* ══════════════════════════════════════════════════════════════════
            03 — PROGRESS
        ══════════════════════════════════════════════════════════════════ */}
        <SectionLabel n="03" color="#2db885">Progress</SectionLabel>

        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontStyle: 'italic', color: 'rgba(234,232,242,0.35)', marginBottom: '2.5rem', maxWidth: 500, lineHeight: 1.72 }}>
          Dimensions are not fixed. They are trained.
        </p>

        <ProgressPanel current={data} history={history} />

        <Hairline color={edgeColor} />

        {/* ══════════════════════════════════════════════════════════════════
            04 — THE DOOR
        ══════════════════════════════════════════════════════════════════ */}
        <SectionLabel n="04" color={edgeColor}>The Door</SectionLabel>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '3.5rem', alignItems: 'start' }}>
          <div>
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.38em', textTransform: 'uppercase', color: `${edgeColor}88`, marginBottom: 14 }}>
              Primary Growth Edge
            </p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(40px, 5.5vw, 62px)', fontWeight: 300, color: '#eae8f2', letterSpacing: '-0.02em', lineHeight: 1.03, marginBottom: '1.6rem' }}>
              {growthEdge.label.charAt(0).toUpperCase() + growthEdge.label.slice(1).toLowerCase()}
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: 'rgba(234,232,242,0.62)', lineHeight: 1.78, marginBottom: '1.4rem' }}>
              {growthEdge.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Progress value={growthEdge.score} color={DIM_COLOR[growthEdge.dimension ?? dominantDimension]} className="flex-1" />
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 300, color: 'rgba(234,232,242,0.38)' }}>
                {growthEdge.score}
              </span>
            </div>
          </div>

          <div>
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.2)', marginBottom: 18 }}>
              Transition Pathways
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {growthProfile.pathwayOptions.map(opt => (
                <div key={opt.id} style={{ padding: '14px 16px', border: '1px solid rgba(234,232,242,0.06)', background: 'rgba(234,232,242,0.015)', borderRadius: 2 }}>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.2em', textTransform: 'uppercase', color: `${edgeColor}80`, marginBottom: 7 }}>
                    {opt.targetArchetype.name}
                  </p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: 'rgba(234,232,242,0.42)', lineHeight: 1.65 }}>
                    {opt.transitionDescription}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Hairline color="#d4853a" />

        {/* ══════════════════════════════════════════════════════════════════
            05 — EVOLUTION PATH
        ══════════════════════════════════════════════════════════════════ */}
        <SectionLabel n="05" color="#d4853a">Evolution Path</SectionLabel>

        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontStyle: 'italic', color: 'rgba(234,232,242,0.35)', marginBottom: '3rem', maxWidth: 500, lineHeight: 1.72 }}>
          Not a destination — a direction. Each horizon is already forming inside the current one.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          {([evolutionPathway.current, evolutionPathway.next, evolutionPathway.future] as const).map((step, i) => {
            const isCurrent = i === 0
            const alpha     = isCurrent ? 1 : i === 1 ? 0.58 : 0.32
            return (
              <div key={step.label} style={{ position: 'relative' }}>
                {i > 0 && (
                  <div style={{ position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'rgba(234,232,242,0.1)', pointerEvents: 'none', fontFamily: 'monospace', lineHeight: 1 }}>
                    →
                  </div>
                )}
                <Card className="p-5 h-full" glow={isCurrent ? 'purple' : null}>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.42em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.18)', marginBottom: 14 }}>
                    {step.label}
                  </p>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.28em', textTransform: 'uppercase', color: isCurrent ? 'rgba(149,144,236,0.72)' : 'rgba(149,144,236,0.32)', marginBottom: 10 }}>
                    {STATE_LABELS[step.state]}
                  </p>
                  {step.archetype && (
                    <>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300, color: `rgba(234,232,242,${alpha})`, lineHeight: 1.1, marginBottom: 6 }}>
                        {step.archetype.name}
                      </p>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, fontStyle: 'italic', color: `rgba(234,232,242,${alpha * 0.52})`, marginBottom: 12, lineHeight: 1.5 }}>
                        {step.archetype.name + ' — ' + step.archetype.aiOutput.split('.')[0] + '.'}
                      </p>
                    </>
                  )}
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: `rgba(234,232,242,${alpha * 0.44})`, lineHeight: 1.65 }}>
                    {step.description}
                  </p>
                </Card>
              </div>
            )
          })}
        </div>

        <Hairline color="#2db885" />

        {/* ══════════════════════════════════════════════════════════════════
            06 — WHAT TO DO NEXT
        ══════════════════════════════════════════════════════════════════ */}
        <SectionLabel n="06" color="#2db885">What to Do Next</SectionLabel>

        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(26px, 3.8vw, 40px)', fontWeight: 300, color: '#eae8f2', lineHeight: 1.15, marginBottom: '0.6rem' }}>
          Three practices for {DIMENSION_META[growthEdge.dimension ?? dominantDimension].label.toLowerCase()}.
        </h2>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontStyle: 'italic', color: 'rgba(234,232,242,0.36)', marginBottom: '3.5rem', lineHeight: 1.7 }}>
          These are the exact actions your system is asking for. Expand each to understand why.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {practices.map((practice, i) => (
            <EnhancedPracticeItem
              key={i}
              practice={practice}
              index={i}
              growthDim={growthEdge.dimension ?? dominantDimension}
            />
          ))}
        </div>

        <Hairline color={dominantColor} />

        {/* ══════════════════════════════════════════════════════════════════
            07 — ARCHETYPE
        ══════════════════════════════════════════════════════════════════ */}
        <SectionLabel n="07" color={dominantColor}>Archetype</SectionLabel>

        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: 300, color: '#eae8f2', letterSpacing: '-0.022em', lineHeight: 1.03, marginBottom: '0.6rem' }}>
          {primary.archetype.name}
        </h2>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: 'italic', color: `${dominantColor}99`, marginBottom: '2.2rem' }}>
          {primary.archetype.name + ' — ' + primary.archetype.aiOutput.split('.')[0] + '.'}
        </p>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: 'rgba(234,232,242,0.60)', lineHeight: 1.84, maxWidth: 620, marginBottom: '3rem' }}>
          {primary.archetype.corePattern}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <Card className="p-6">
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.22)', marginBottom: 16 }}>
              Expression
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: 'rgba(234,232,242,0.56)', lineHeight: 1.8 }}>
              {primary.archetype.whenAligned}
            </p>
          </Card>
          <Card className="p-6">
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(224,90,58,0.42)', marginBottom: 16 }}>
              Shadow
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: 'rgba(234,232,242,0.46)', lineHeight: 1.8 }}>
              {primary.archetype.whenMisaligned}
            </p>
          </Card>
          <Card className="p-6">
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.38em', textTransform: 'uppercase', color: `${dominantColor}55`, marginBottom: 16 }}>
              Growth Edge
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: 'rgba(234,232,242,0.56)', lineHeight: 1.8, marginBottom: 8 }}>
              {primary.archetype.growthEdge}
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, fontStyle: 'italic', color: 'rgba(234,232,242,0.28)', lineHeight: 1.6 }}>
              Shadow trigger: {primary.archetype.shadowTrigger}
            </p>
          </Card>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SAVE PROFILE — post-results conversion
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{
          marginTop:     80,
          padding:       '3rem 2.5rem',
          background:    'rgba(149,144,236,0.04)',
          border:        '1px solid rgba(149,144,236,0.12)',
          borderRadius:  6,
          textAlign:     'center',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           '1.5rem',
        }}>
          <p style={{
            fontFamily: "'Cinzel', serif", fontSize: 8,
            letterSpacing: '0.45em', textTransform: 'uppercase',
            color: 'rgba(149,144,236,0.5)',
          }}>
            Continue Your Path
          </p>

          <h2 style={{
            fontFamily:    "'Cormorant Garamond', serif",
            fontSize:      'clamp(24px, 3.2vw, 36px)',
            fontWeight:    300,
            color:         '#eae8f2',
            letterSpacing: '-0.012em',
            lineHeight:    1.15,
            maxWidth:      440,
          }}>
            Save this profile and carry it forward.
          </h2>

          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize:   16,
            color:      'rgba(234,232,242,0.45)',
            lineHeight: 1.78,
            maxWidth:   460,
            fontStyle:  'italic',
          }}>
            This is a precise snapshot of where you are right now. Save it to
            track your evolution, revisit your results, and build your dashboard
            over time.
          </p>

          {saveStatus === 'saved' ? (
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize:   17,
              color:      'rgba(45,184,133,0.75)',
              fontStyle:  'italic',
              letterSpacing: '0.02em',
            }}>
              Profile saved. Your evolution is now being tracked.
            </p>
          ) : (
            <>
              {saveStatus === 'error' && (
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize:   13,
                  color:      'rgba(224,90,58,0.7)',
                  fontStyle:  'italic',
                }}>
                  Something went wrong. Please try again.
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
                <Button
                  size="lg"
                  onClick={handleSaveProfile}
                  disabled={saveStatus === 'saving'}
                >
                  {saveStatus === 'saving' ? 'Saving…' : 'Save your profile and continue'}
                </Button>
                <Button variant="ghost" size="lg">
                  Not now
                </Button>
              </div>

              {/* Optional phone step */}
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize:   13,
                color:      'rgba(234,232,242,0.22)',
                lineHeight: 1.65,
                marginTop:  '0.5rem',
                fontStyle:  'italic',
              }}>
                Or{' '}
                <span style={{ color: 'rgba(149,144,236,0.4)', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(149,144,236,0.18)' }}>
                  send this to your phone
                </span>
                {' '}and return when you&apos;re ready.
              </p>
            </>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{ borderTop: '1px solid rgba(234,232,242,0.06)', marginTop: 64, paddingTop: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' }}>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.18)', lineHeight: 1.8 }}>
            Aetherium · Personal Intelligence System
            <br />
            Generated {new Date(data.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/assessment"><Button variant="outline" size="sm">Reassess</Button></Link>
            <Link href="/"><Button variant="ghost" size="sm">Go to Dashboard</Button></Link>
          </div>
        </div>

      </div>

      {/* DEV: preview navigator */}
      <PreviewNav />
    </main>
  )
}
