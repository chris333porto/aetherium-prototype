'use client'

/**
 * results-preview/page.tsx — THE MIRROR
 *
 * The conversion page. Shown immediately after the 50-question discovery.
 * Renders deterministic data only — no API calls.
 *
 * Structure:
 *   1. Archetype reveal (free — emotional impact)
 *   2. Radar shape (free — visual identity)
 *   3. Tension statement (free — the mirror)
 *   4. Inline email gate (expands in-place, no route change)
 *   5. After email → routes to context questions → generating → results
 *
 * Gate: reads ae_preview_scores from localStorage.
 * If absent, redirects to /assessment.
 */

import { useEffect, useState, useRef } from 'react'
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

// ─── Tension lines (deterministic, per deficient dimension) ──────────────────

const TENSION: Record<Dimension, string> = {
  earth:  'You see it. You feel it. You understand it. But it is not yet landing in the physical world — and that gap is where the friction lives.',
  water:  'There is an emotional layer running beneath your decisions that you have not fully mapped. What you feel is quietly shaping everything.',
  air:    'Your thinking is circling. The signal is there — but the clarity to act on it has not yet arrived.',
  fire:   'The intention exists. The will to sustain it does not — yet. Something keeps interrupting the translation from knowing to doing.',
  aether: 'You are moving. But the question of toward what is still forming. Direction is the work now.',
}

// ─── What the full profile reveals (used in hook copy) ───────────────────────

const DEPTH_LABELS = [
  { label: 'Your growth edge',  desc: 'The one dimension holding the others back' },
  { label: 'Your shadow pattern', desc: 'What you avoid, suppress, or project' },
  { label: 'Your next practice',  desc: 'The single highest-leverage action for this season' },
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface PreviewScores {
  dimensions:         DimensionScores
  profiles:           Record<Dimension, DimensionProfile>
  archetypeBlend:     ArchetypeBlend
  dominantDimension:  Dimension
  deficientDimension: Dimension
  overallScore:       number
  coherenceScore:     number
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ResultsPreviewPage() {
  const router = useRouter()
  const [preview, setPreview] = useState<PreviewScores | null>(null)
  const [gateOpen, setGateOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const gateRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ae_preview_scores')
      if (!raw) { router.replace('/assessment'); return }
      setPreview(JSON.parse(raw) as PreviewScores)
    } catch { router.replace('/assessment') }
  }, [router])

  if (!preview) return null

  const {
    dimensions,
    profiles,
    archetypeBlend,
    dominantDimension,
    deficientDimension,
  } = preview

  const tension       = TENSION[deficientDimension]
  const defMeta       = DIMENSION_META[deficientDimension]
  const domMeta       = DIMENSION_META[dominantDimension]
  const primary       = archetypeBlend.primary.archetype

  // Dimension labels for score bars — human names
  const DIM_HUMAN: Record<Dimension, string> = {
    earth: 'Body', water: 'Heart', air: 'Mind', fire: 'Soul', aether: 'Spirit',
  }

  function handleUnlock() {
    setGateOpen(true)
    // Scroll to the gate after a brief delay for the animation
    setTimeout(() => {
      gateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 200)
  }

  function handleSubmit() {
    if (!firstName.trim() || !email.trim()) return
    setSubmitting(true)

    // Save identity to localStorage
    localStorage.setItem('ae_identity', JSON.stringify({
      firstName: firstName.trim(),
      email: email.trim(),
    }))

    // Route to context questions (which then → generating → results)
    setTimeout(() => {
      router.push('/assessment/context')
    }, 400)
  }

  return (
    <main className="page-atmosphere flex flex-col" style={{ minHeight: '100vh' }}>
      <EnergyField size={600} opacity={0.2} color="#9590ec" />

      {/* Nav */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.4rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}>
        <span style={{
          fontFamily: "'Cinzel', serif", fontSize: 9,
          letterSpacing: '0.4em', textTransform: 'uppercase',
          color: 'rgba(234,232,242,0.22)',
        }}>
          Aetherium
        </span>
        <span style={{
          fontFamily: "'Cinzel', serif", fontSize: 9,
          letterSpacing: '0.3em', textTransform: 'uppercase',
          color: 'rgba(149,144,236,0.35)',
        }}>
          Discovery Complete
        </span>
      </nav>

      {/* Content */}
      <div style={{
        maxWidth: 580, margin: '0 auto', padding: '3rem 2rem 5rem',
        width: '100%', position: 'relative', zIndex: 10,
      }}>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1 — THE REVEAL (free, above the gate)
        ═══════════════════════════════════════════════════════════════ */}

        {/* Eyebrow */}
        <p style={{
          fontFamily: "'Cinzel', serif", fontSize: 9,
          letterSpacing: '0.45em', textTransform: 'uppercase',
          color: 'rgba(149,144,236,0.45)', marginBottom: '1.5rem',
        }}>
          You are currently operating as
        </p>

        {/* Archetype name — the hero moment */}
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(36px, 5.5vw, 58px)',
          fontWeight: 300, color: '#eae8f2',
          letterSpacing: '-0.02em', lineHeight: 1.06,
          marginBottom: '1rem',
        }}>
          {archetypeBlend.blendTitle}
        </h1>

        {/* When Aligned — recognition */}
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(16px, 1.8vw, 20px)',
          color: 'rgba(234,232,242,0.6)',
          lineHeight: 1.6, marginBottom: '2.5rem',
          maxWidth: 460,
        }}>
          {primary.whenAligned}
        </p>

        {/* Radar chart — shape only, no numeric labels */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          marginBottom: '2.5rem',
        }}>
          <DimensionChart scores={dimensions} size={240} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2 — DIMENSION SCORES
        ═══════════════════════════════════════════════════════════════ */}

        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
          marginBottom: '2.5rem',
        }}>
          {DIMENSIONS_ORDER.map(dim => {
            const meta  = DIMENSION_META[dim]
            const score = profiles[dim]?.score ?? dimensions[dim] ?? 0
            const hex   = meta.color.replace('#', '')
            const r     = parseInt(hex.substring(0, 2), 16)
            const g     = parseInt(hex.substring(2, 4), 16)
            const b     = parseInt(hex.substring(4, 6), 16)
            const rgba  = (a: number) => `rgba(${r},${g},${b},${a})`

            return (
              <div key={dim} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span style={{
                  fontFamily: "'Cinzel', serif", fontSize: 8,
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: meta.color, opacity: 0.75,
                  width: 48, flexShrink: 0,
                }}>
                  {DIM_HUMAN[dim]}
                </span>
                <div style={{
                  flex: 1, height: 3, background: 'rgba(234,232,242,0.06)',
                  borderRadius: 2, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${score}%`, height: '100%',
                    background: `linear-gradient(to right, ${rgba(0.7)}, ${rgba(0.3)})`,
                    borderRadius: 2,
                    transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)',
                  }} />
                </div>
                <span style={{
                  fontFamily: "'Cinzel', serif", fontSize: 9,
                  letterSpacing: '0.1em', color: 'rgba(234,232,242,0.35)',
                  width: 26, textAlign: 'right', flexShrink: 0,
                }}>
                  {score}
                </span>
              </div>
            )
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3 — TENSION STATEMENT (the mirror)
        ═══════════════════════════════════════════════════════════════ */}

        <div style={{
          padding: '1.5rem 1.6rem',
          borderLeft: `2px solid ${defMeta.color}35`,
          background: `${defMeta.color}05`,
          marginBottom: '3rem',
          borderRadius: '0 3px 3px 0',
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(16px, 1.8vw, 19px)',
            color: 'rgba(234,232,242,0.65)',
            lineHeight: 1.7, fontStyle: 'italic',
          }}>
            {tension}
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4 — THE GATE (inline, no route change)
        ═══════════════════════════════════════════════════════════════ */}

        <div ref={gateRef}>

          {/* What lies beneath — depth preview */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '0.5rem',
            marginBottom: '1.5rem', position: 'relative',
          }}>
            {DEPTH_LABELS.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '0.9rem 1.1rem',
                  border: '1px solid rgba(234,232,242,0.05)',
                  borderRadius: 3,
                  background: 'rgba(234,232,242,0.012)',
                  display: 'flex', alignItems: 'center', gap: '0.8rem',
                  filter: 'blur(2.5px)',
                  userSelect: 'none', pointerEvents: 'none',
                }}
              >
                <div style={{
                  width: 3, height: 28,
                  background: 'rgba(234,232,242,0.06)',
                  borderRadius: 1, flexShrink: 0,
                }} />
                <div>
                  <p style={{
                    fontFamily: "'Cinzel', serif", fontSize: 7.5,
                    letterSpacing: '0.25em', textTransform: 'uppercase',
                    color: 'rgba(234,232,242,0.25)', marginBottom: 3,
                  }}>
                    {item.label}
                  </p>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 13, color: 'rgba(234,232,242,0.18)',
                  }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}

            {/* Fade overlay on blurred cards */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: 60,
              background: 'linear-gradient(to top, #08080e, transparent)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Hook copy */}
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(19px, 2.5vw, 26px)',
            fontWeight: 300, color: '#eae8f2',
            lineHeight: 1.4, marginBottom: '0.8rem',
          }}>
            There is more beneath this.
          </p>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(14px, 1.5vw, 16px)',
            fontStyle: 'italic',
            color: 'rgba(234,232,242,0.42)',
            lineHeight: 1.72, marginBottom: '2rem',
            maxWidth: 440,
          }}>
            Your full profile maps the specific tension between
            your {DIM_HUMAN[dominantDimension].toLowerCase()} and
            your {DIM_HUMAN[deficientDimension].toLowerCase()} —
            what it creates in your life, what it costs you,
            and what to do next.
          </p>

          {/* ── Gate: collapsed state (button only) ── */}
          {!gateOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                onClick={handleUnlock}
                style={{
                  fontFamily: "'Cinzel', serif", fontSize: 10,
                  letterSpacing: '0.3em', textTransform: 'uppercase',
                  color: '#eae8f2',
                  background: 'rgba(149,144,236,0.1)',
                  border: '1px solid rgba(149,144,236,0.25)',
                  borderRadius: 3, padding: '15px 28px',
                  cursor: 'pointer', transition: 'all 0.25s',
                  width: '100%', textAlign: 'center',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(149,144,236,0.16)'
                  e.currentTarget.style.borderColor = 'rgba(149,144,236,0.45)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(149,144,236,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(149,144,236,0.25)'
                }}
              >
                See My Full Profile
              </button>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 12, fontStyle: 'italic',
                color: 'rgba(234,232,242,0.2)',
                textAlign: 'center',
              }}>
                Free. Takes 30 seconds.
              </p>
            </div>
          )}

          {/* ── Gate: expanded state (inline email capture) ── */}
          {gateOpen && (
            <div
              style={{
                padding: '1.75rem',
                border: '1px solid rgba(149,144,236,0.12)',
                borderRadius: 4,
                background: 'rgba(149,144,236,0.03)',
                animation: 'ae-gate-open 0.5s ease forwards',
              }}
            >
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 16, color: 'rgba(234,232,242,0.55)',
                lineHeight: 1.7, marginBottom: '1.5rem',
              }}>
                Enter your name and email to unlock your complete profile —
                growth edge, shadow pattern, practices, and evolution path.
              </p>

              <div style={{
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                marginBottom: '1.25rem',
              }}>
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  autoFocus
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 16, color: '#eae8f2',
                    background: 'rgba(234,232,242,0.04)',
                    border: '1px solid rgba(234,232,242,0.1)',
                    borderRadius: 3, padding: '12px 16px',
                    outline: 'none', width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(149,144,236,0.35)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(234,232,242,0.1)'}
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 16, color: '#eae8f2',
                    background: 'rgba(234,232,242,0.04)',
                    border: '1px solid rgba(234,232,242,0.1)',
                    borderRadius: 3, padding: '12px 16px',
                    outline: 'none', width: '100%',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(149,144,236,0.35)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(234,232,242,0.1)'}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!firstName.trim() || !email.trim() || submitting}
                style={{
                  fontFamily: "'Cinzel', serif", fontSize: 10,
                  letterSpacing: '0.3em', textTransform: 'uppercase',
                  color: (!firstName.trim() || !email.trim()) ? 'rgba(234,232,242,0.3)' : '#eae8f2',
                  background: (!firstName.trim() || !email.trim()) ? 'rgba(149,144,236,0.05)' : 'rgba(149,144,236,0.12)',
                  border: '1px solid rgba(149,144,236,0.25)',
                  borderRadius: 3, padding: '14px 28px',
                  cursor: (!firstName.trim() || !email.trim()) ? 'default' : 'pointer',
                  transition: 'all 0.25s',
                  width: '100%', textAlign: 'center',
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                {submitting ? 'Opening…' : 'Unlock My Profile →'}
              </button>

              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 12, fontStyle: 'italic',
                color: 'rgba(234,232,242,0.2)',
                textAlign: 'center', marginTop: '0.65rem',
              }}>
                Your data is never shared or sold.
              </p>
            </div>
          )}
        </div>

      </div>

      <style jsx>{`
        @keyframes ae-gate-open {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  )
}
