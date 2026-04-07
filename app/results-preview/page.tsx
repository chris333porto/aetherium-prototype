'use client'

/**
 * results-preview/page.tsx
 *
 * Free preview layer shown immediately after the 50-question assessment.
 * Renders deterministic data only — no OpenAI calls, no API calls of any kind.
 *
 * Shows:
 *   - Dimensional radar chart
 *   - Per-dimension scores (bar visualization)
 *   - Archetype name + blend title
 *   - One deterministic tension line derived from the deficient dimension
 *
 * Does NOT show:
 *   - Practices
 *   - Evolution / growth pathway
 *   - Imbalance analysis
 *   - Full archetype interpretation
 *   - AI-generated copy of any kind
 *
 * Gate: reads ae_preview_scores from localStorage (written by /assessment on
 * completion). If absent, redirects back to /assessment.
 */

import { useEffect, useState } from 'react'
import { useRouter }            from 'next/navigation'
import { DimensionChart }       from '@/components/DimensionChart'
import { EnergyField }          from '@/components/EnergyField'
import {
  DIMENSION_META,
  DIMENSIONS_ORDER,
  type Dimension,
}                               from '@/lib/assessment/questions'
import type { DimensionScores, DimensionProfile } from '@/lib/scoring/engine'
import type { ArchetypeBlend }  from '@/lib/archetypes/matcher'

// ─── Deterministic tension lines ──────────────────────────────────────────────
// Derived from the deficient dimension only. No AI. No network.

const DEFICIENCY_TENSION: Record<Dimension, string> = {
  earth:  'Your capacity to execute is creating drag on everything else. The pattern is clear — momentum keeps stalling at the point of action.',
  water:  'Your emotional layer is running below awareness. What you feel is shaping what you do in ways you haven\'t fully mapped.',
  air:    'Your thinking is circling without landing. Clarity is available — it\'s the channel, not the signal, that needs attention.',
  fire:   'Your drive is present but inconsistent. Something is interrupting the translation from intention into sustained forward motion.',
  aether: 'Your sense of direction is diffuse. You\'re moving — but the question of toward what remains open.',
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PreviewScores {
  dimensions:         DimensionScores
  profiles:           Record<Dimension, DimensionProfile>
  archetypeBlend:     ArchetypeBlend
  dominantDimension:  Dimension
  deficientDimension: Dimension
  overallScore:       number
  coherenceScore:     number
}

// ─── Blurred placeholder card (represents locked sections) ────────────────────

function LockedCard() {
  return (
    <div style={{
      padding:         '1.1rem 1.25rem',
      border:          '1px solid rgba(234,232,242,0.05)',
      borderRadius:    3,
      background:      'rgba(234,232,242,0.012)',
      display:         'flex',
      alignItems:      'center',
      gap:             '0.85rem',
      filter:          'blur(3.5px)',
      userSelect:      'none',
      pointerEvents:   'none',
    }}>
      <div style={{ width: 3, height: 36, background: 'rgba(234,232,242,0.07)', borderRadius: 1, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: 90, height: 8, background: 'rgba(234,232,242,0.07)', borderRadius: 2, marginBottom: 8 }} />
        <div style={{ width: 140, height: 6, background: 'rgba(234,232,242,0.05)', borderRadius: 2 }} />
      </div>
      <div style={{ width: 36, height: 14, background: 'rgba(234,232,242,0.05)', borderRadius: 2, flexShrink: 0 }} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultsPreviewPage() {
  const router = useRouter()
  const [preview, setPreview] = useState<PreviewScores | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ae_preview_scores')
      if (!raw) {
        // No preview scores — user arrived directly without completing the assessment
        router.replace('/assessment')
        return
      }
      const parsed = JSON.parse(raw) as PreviewScores
      setPreview(parsed)
    } catch {
      router.replace('/assessment')
    }
  }, [router])

  // Hold render until localStorage read completes (avoids flash)
  if (!preview) return null

  const {
    dimensions,
    profiles,
    archetypeBlend,
    dominantDimension,
    deficientDimension,
  } = preview

  const tension        = DEFICIENCY_TENSION[deficientDimension]
  const deficientMeta  = DIMENSION_META[deficientDimension]
  const dominantMeta   = DIMENSION_META[dominantDimension]

  return (
    <main className="page-atmosphere flex flex-col" style={{ minHeight: '100vh' }}>
      <EnergyField size={600} opacity={0.22} color="#9590ec" />

      {/* Nav */}
      <nav style={{
        position:       'relative',
        zIndex:         10,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '1.4rem 2.5rem',
        borderBottom:   '1px solid rgba(255,255,255,0.04)',
      }}>
        <span style={{
          fontFamily:    "'Cinzel', serif",
          fontSize:      9,
          letterSpacing: '0.42em',
          textTransform: 'uppercase',
          color:         'rgba(234,232,242,0.18)',
        }}>
          Aetherium
        </span>
        <span style={{
          fontFamily:    "'Cinzel', serif",
          fontSize:      9,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color:         'rgba(149,144,236,0.35)',
        }}>
          Pattern Mapped
        </span>
      </nav>

      {/* Content */}
      <div style={{
        maxWidth:  640,
        margin:    '0 auto',
        padding:   '3.5rem 2.5rem 5rem',
        width:     '100%',
        position:  'relative',
        zIndex:    10,
      }}>

        {/* Eyebrow */}
        <p style={{
          fontFamily:    "'Cinzel', serif",
          fontSize:      9,
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          color:         'rgba(149,144,236,0.45)',
          marginBottom:  '1.5rem',
        }}>
          Your Pattern
        </p>

        {/* Archetype name */}
        <h1 style={{
          fontFamily:    "'Cormorant Garamond', serif",
          fontSize:      'clamp(32px, 4.5vw, 52px)',
          fontWeight:    300,
          color:         '#eae8f2',
          letterSpacing: '-0.015em',
          lineHeight:    1.08,
          marginBottom:  '0.65rem',
        }}>
          {archetypeBlend.blendTitle}
        </h1>

        <p style={{
          fontFamily:    "'Cormorant Garamond', serif",
          fontSize:      'clamp(15px, 1.6vw, 18px)',
          fontStyle:     'italic',
          color:         'rgba(234,232,242,0.38)',
          lineHeight:    1.7,
          marginBottom:  '2.75rem',
        }}>
          Primary expression: {archetypeBlend.primary.archetype.name}
        </p>

        {/* Radar chart */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.75rem' }}>
          <DimensionChart scores={dimensions} size={260} />
        </div>

        {/* Per-dimension score bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2.75rem' }}>
          {DIMENSIONS_ORDER.map(dim => {
            const meta  = DIMENSION_META[dim]
            const score = profiles[dim]?.score ?? dimensions[dim] ?? 0

            const hex  = meta.color.replace('#', '')
            const r    = parseInt(hex.substring(0, 2), 16)
            const g    = parseInt(hex.substring(2, 4), 16)
            const b    = parseInt(hex.substring(4, 6), 16)
            const rgba = (a: number) => `rgba(${r},${g},${b},${a})`

            return (
              <div key={dim} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{
                  fontFamily:    "'Cinzel', serif",
                  fontSize:      7.5,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color:         meta.color,
                  opacity:       0.8,
                  width:         56,
                  flexShrink:    0,
                }}>
                  {meta.label}
                </span>
                <div style={{
                  flex:         1,
                  height:       3,
                  background:   'rgba(234,232,242,0.06)',
                  borderRadius: 2,
                  overflow:     'hidden',
                }}>
                  <div style={{
                    width:        `${score}%`,
                    height:       '100%',
                    background:   `linear-gradient(to right, ${rgba(0.75)}, ${rgba(0.35)})`,
                    borderRadius: 2,
                    transition:   'width 1.2s cubic-bezier(0.16,1,0.3,1)',
                  }} />
                </div>
                <span style={{
                  fontFamily:    "'Cinzel', serif",
                  fontSize:      8,
                  letterSpacing: '0.12em',
                  color:         'rgba(234,232,242,0.32)',
                  width:         28,
                  textAlign:     'right',
                  flexShrink:    0,
                }}>
                  {score}
                </span>
              </div>
            )
          })}
        </div>

        {/* Tension line */}
        <div style={{
          padding:      '1.4rem 1.6rem',
          borderLeft:   `2px solid ${deficientMeta.color}40`,
          background:   `${deficientMeta.color}06`,
          marginBottom: '3rem',
          borderRadius: '0 3px 3px 0',
        }}>
          <p style={{
            fontFamily:    "'Cinzel', serif",
            fontSize:      7.5,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color:         `${deficientMeta.color}70`,
            marginBottom:  '0.65rem',
          }}>
            Primary Tension — {deficientMeta.label}
          </p>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize:   17,
            color:      'rgba(234,232,242,0.68)',
            lineHeight: 1.65,
            fontStyle:  'italic',
          }}>
            {tension}
          </p>
        </div>

        {/* Locked sections preview */}
        <div style={{ marginBottom: '3rem' }}>
          <p style={{
            fontFamily:    "'Cinzel', serif",
            fontSize:      8,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color:         'rgba(234,232,242,0.14)',
            marginBottom:  '0.85rem',
          }}>
            Locked — Full System Profile
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'relative' }}>
            <LockedCard />
            <LockedCard />
            <LockedCard />
            {/* Fade overlay */}
            <div style={{
              position:       'absolute',
              bottom:         0,
              left:           0,
              right:          0,
              height:         72,
              background:     'linear-gradient(to top, #08080e, transparent)',
              pointerEvents:  'none',
            }} />
          </div>
        </div>

        {/* Hook copy */}
        <div style={{
          marginBottom: '2.5rem',
          padding:      '1.75rem',
          border:       '1px solid rgba(149,144,236,0.12)',
          borderRadius: 4,
          background:   'rgba(149,144,236,0.03)',
        }}>
          <p style={{
            fontFamily:    "'Cormorant Garamond', serif",
            fontSize:      'clamp(18px, 2.2vw, 24px)',
            fontWeight:    300,
            color:         '#eae8f2',
            lineHeight:    1.4,
            marginBottom:  '1rem',
          }}>
            There is a deeper pattern running beneath this.
          </p>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize:   'clamp(14px, 1.5vw, 16px)',
            fontStyle:  'italic',
            color:      'rgba(234,232,242,0.45)',
            lineHeight: 1.72,
          }}>
            Your{' '}
            <span style={{ color: dominantMeta.color }}>
              {dominantMeta.label.toLowerCase()}
            </span>
            {' '}and{' '}
            <span style={{ color: deficientMeta.color }}>
              {deficientMeta.label.toLowerCase()}
            </span>
            {' '}are in a specific kind of tension that shapes how you work, relate,
            and make decisions. Your full profile maps this — your growth edge, shadow
            pattern, next practices, and the evolution path forward.
          </p>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <button
            onClick={() => router.push('/assessment/identity')}
            style={{
              fontFamily:    "'Cinzel', serif",
              fontSize:      10,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color:         '#eae8f2',
              background:    'rgba(149,144,236,0.12)',
              border:        '1px solid rgba(149,144,236,0.3)',
              borderRadius:  3,
              padding:       '14px 28px',
              cursor:        'pointer',
              transition:    'all 0.2s',
              width:         '100%',
              textAlign:     'center',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background    = 'rgba(149,144,236,0.18)'
              e.currentTarget.style.borderColor   = 'rgba(149,144,236,0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background    = 'rgba(149,144,236,0.12)'
              e.currentTarget.style.borderColor   = 'rgba(149,144,236,0.3)'
            }}
          >
            Unlock My Full Profile →
          </button>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize:   12,
            color:      'rgba(234,232,242,0.2)',
            textAlign:  'center',
            fontStyle:  'italic',
          }}>
            Free to create. Your data is never shared or sold.
          </p>
        </div>

      </div>
    </main>
  )
}
