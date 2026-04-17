'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

// ── Layers — outermost to innermost ──────────────────────────────────────────

const LAYERS = [
  { human: 'Body',   element: 'Earth',  color: '#2db885', emoji: '🌍' },
  { human: 'Heart',  element: 'Water',  color: '#4a9fd4', emoji: '🌊' },
  { human: 'Mind',   element: 'Air',    color: '#d4853a', emoji: '🌬' },
  { human: 'Soul',   element: 'Fire',   color: '#e05a3a', emoji: '🔥' },
  { human: 'Spirit', element: 'Aether', color: '#9590ec', emoji: '✨' },
]

// ── Living Diagram ───────────────────────────────────────────────────────────

function LivingDiagram({ phase, highlightIdx }: { phase: number; highlightIdx: number | null }) {
  const size = 300
  const cx = size / 2
  const cy = size / 2

  const bands = [
    { r: 144, w: 26 },
    { r: 114, w: 24 },
    { r: 86,  w: 22 },
    { r: 60,  w: 20 },
  ]
  const coreR = 26
  const coreHi = highlightIdx === 4

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: size, margin: '0 auto' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ overflow: 'visible' }}>
        <defs>
          {LAYERS.slice(0, 4).map((layer, i) => {
            const outer = bands[i].r
            const inner = outer - bands[i].w
            const innerPct = Math.round((inner / outer) * 100)
            const midPct = Math.round(((inner + outer) / 2 / outer) * 100)
            const isHi = highlightIdx === i
            return (
              <radialGradient key={`bf-${i}`} id={`bf-${i}`}>
                <stop offset="0%" stopColor={layer.color} stopOpacity="0" />
                <stop offset={`${innerPct - 3}%`} stopColor={layer.color} stopOpacity="0" />
                <stop offset={`${innerPct}%`} stopColor={layer.color} stopOpacity={isHi ? 0.06 : 0.04} />
                <stop offset={`${midPct}%`} stopColor={layer.color} stopOpacity={isHi ? 0.14 : 0.09} />
                <stop offset="100%" stopColor={layer.color} stopOpacity={isHi ? 0.05 : 0.03} />
              </radialGradient>
            )
          })}
          <radialGradient id="cg">
            <stop offset="0%" stopColor="#9590ec" stopOpacity={coreHi ? 0.45 : 0.35} />
            <stop offset="35%" stopColor="#9590ec" stopOpacity={coreHi ? 0.18 : 0.12} />
            <stop offset="100%" stopColor="#9590ec" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Energy bands */}
        {bands.map((band, i) => {
          const layer = LAYERS[i]
          const vis = phase >= i + 1
          const mid = band.r - band.w / 2
          const isHi = highlightIdx === i
          const isDimmed = highlightIdx !== null && highlightIdx !== i

          return (
            <g key={i} style={{ opacity: vis ? (isDimmed ? 0.35 : 1) : 0, transition: 'opacity 0.5s ease' }}>
              <circle cx={cx} cy={cy} r={band.r} fill={`url(#bf-${i})`} />
              {/* Outer edge */}
              <circle
                cx={cx} cy={cy} r={band.r} fill="none"
                stroke={layer.color}
                strokeWidth={isHi ? 0.7 : 0.4}
                strokeOpacity={isHi ? 0.18 : 0.08}
                style={{ transition: 'all 0.5s ease' }}
              />
              {/* Mid-band pulse line */}
              <circle cx={cx} cy={cy} r={mid} fill="none" stroke={layer.color} strokeWidth="0.6" strokeOpacity="0.1">
                <animate
                  attributeName="stroke-opacity"
                  values={isHi ? '0.15;0.3;0.15' : '0.1;0.22;0.1'}
                  dur="4s" begin={`${i * 0.6}s`} repeatCount="indefinite"
                />
                <animate
                  attributeName="stroke-width"
                  values={isHi ? '0.8;1.8;0.8' : '0.6;1.4;0.6'}
                  dur="4s" begin={`${i * 0.6}s`} repeatCount="indefinite"
                />
              </circle>
              {/* Inner edge — subtle second line for depth */}
              <circle
                cx={cx} cy={cy} r={band.r - band.w} fill="none"
                stroke={layer.color} strokeWidth="0.3" strokeOpacity="0.04"
              />
            </g>
          )
        })}

        {/* Core — Spirit/Aether */}
        <g style={{
          opacity: phase >= 5 ? (highlightIdx !== null && highlightIdx !== 4 ? 0.35 : 1) : 0,
          transition: 'opacity 0.5s ease',
        }}>
          <circle cx={cx} cy={cy} r={coreR} fill="#9590ec" fillOpacity={coreHi ? 0.08 : 0.05} style={{ transition: 'fill-opacity 0.5s ease' }} />
          <circle cx={cx} cy={cy} r={coreR} fill="none" stroke="#9590ec" strokeWidth={coreHi ? 0.9 : 0.6} strokeOpacity={coreHi ? 0.3 : 0.18} style={{ transition: 'all 0.5s ease' }}>
            <animate attributeName="stroke-opacity" values={coreHi ? '0.3;0.45;0.3' : '0.18;0.3;0.18'} dur="4s" repeatCount="indefinite" />
          </circle>
          {/* Glow field */}
          <circle cx={cx} cy={cy} r={20} fill="url(#cg)">
            <animate attributeName="r" values="20;30;20" dur="4s" repeatCount="indefinite" />
          </circle>
          {/* Core dot */}
          <circle cx={cx} cy={cy} r={3.5} fill="#9590ec" fillOpacity="0.75">
            <animate attributeName="r" values="3.5;5.5;3.5" dur="4s" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" values="0.75;0.35;0.75" dur="4s" repeatCount="indefinite" />
          </circle>
          {/* White center */}
          <circle cx={cx} cy={cy} r={1.3} fill="#eae8f2" fillOpacity="0.7">
            <animate attributeName="fill-opacity" values="0.7;1;0.7" dur="4s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </div>
  )
}

// ── Legend item component ─────────────────────────────────────────────────────

function LegendItem({
  layer,
  index,
  highlightIdx,
  onHover,
  onLeave,
}: {
  layer: typeof LAYERS[number]
  index: number
  highlightIdx: number | null
  onHover: (i: number) => void
  onLeave: () => void
}) {
  const isHi = highlightIdx === index
  const isDimmed = highlightIdx !== null && highlightIdx !== index

  return (
    <span
      onMouseEnter={() => onHover(index)}
      onMouseLeave={onLeave}
      onTouchStart={() => onHover(index)}
      onTouchEnd={onLeave}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        cursor: 'default',
        padding: '0.2rem 0',
        opacity: isDimmed ? 0.3 : 1,
        transition: 'opacity 0.4s ease',
      }}
    >
      <span style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 14.5, color: layer.color,
        opacity: isHi ? 1 : 0.7,
        textShadow: isHi ? `0 0 14px ${layer.color}70` : 'none',
        transition: 'opacity 0.4s ease, text-shadow 0.4s ease',
        letterSpacing: '0.02em',
      }}>
        {layer.element}
      </span>
      <span style={{ fontSize: 12, lineHeight: 1 }}>
        {layer.emoji}
      </span>
      <span style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 14.5, color: layer.color,
        opacity: isHi ? 1 : 0.7,
        textShadow: isHi ? `0 0 14px ${layer.color}70` : 'none',
        transition: 'opacity 0.4s ease, text-shadow 0.4s ease',
        letterSpacing: '0.02em',
      }}>
        {layer.human}
      </span>
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WelcomePage() {
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState(0)
  const [legendShow, setLegendShow] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null)

  useEffect(() => {
    const t0 = setTimeout(() => setVisible(true), 200)
    const t1 = setTimeout(() => setPhase(1), 500)
    const t2 = setTimeout(() => setPhase(2), 850)
    const t3 = setTimeout(() => setPhase(3), 1200)
    const t4 = setTimeout(() => setPhase(4), 1550)
    const t5 = setTimeout(() => setPhase(5), 1900)
    const t6 = setTimeout(() => setLegendShow(true), 2400)
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6) }
  }, [])

  const onHover = useCallback((idx: number) => setHighlightIdx(idx), [])
  const onLeave = useCallback(() => setHighlightIdx(null), [])

  return (
    <main className="page-atmosphere flex flex-col" style={{ minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center',
        padding: '1.2rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}>
        <Link
          href="/"
          style={{
            fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.35em',
            textTransform: 'uppercase', color: 'rgba(234,232,242,0.25)',
            textDecoration: 'none',
          }}
        >
          ← Aetherium
        </Link>
      </nav>

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0.5rem 1.25rem 1.5rem',
        width: '100%', position: 'relative', zIndex: 10,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 1s ease, transform 1s ease',
      }}>

        {/* Eyebrow */}
        <p style={{
          fontFamily: "'Cinzel', serif", fontSize: 8,
          letterSpacing: '0.5em', textTransform: 'uppercase',
          color: 'rgba(149,144,236,0.4)',
          marginBottom: '0.7rem',
        }}>
          Welcome
        </p>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(27px, 5vw, 42px)',
          fontWeight: 300, color: '#eae8f2',
          letterSpacing: '-0.015em', lineHeight: 1.18,
          textAlign: 'center',
          marginBottom: '0.5rem',
          maxWidth: 400,
        }}>
          How Well Do You<br />
          Know Your Self?
        </h1>

        {/* Subheadline */}
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(14px, 1.6vw, 16px)',
          color: 'rgba(234,232,242,0.45)',
          lineHeight: 1.75, textAlign: 'center',
          marginBottom: '0.8rem',
          maxWidth: 350,
        }}>
          This is a brief guided exploration across five dimensions of self.
          See how you are showing up in this chapter of life.
        </p>

        {/* Diagram */}
        <div style={{ marginBottom: '0.6rem', width: '100%', maxWidth: 300 }}>
          <LivingDiagram phase={phase} highlightIdx={highlightIdx} />
        </div>

        {/* Legend — two centered rows */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '0.2rem',
          marginBottom: '1.2rem',
          opacity: legendShow ? 1 : 0,
          transform: legendShow ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 1.2s ease, transform 1.2s ease',
        }}>
          {/* Row 1 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.2rem' }}>
            {LAYERS.slice(0, 3).map((layer, i) => (
              <LegendItem key={layer.human} layer={layer} index={i} highlightIdx={highlightIdx} onHover={onHover} onLeave={onLeave} />
            ))}
          </div>
          {/* Row 2 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.2rem' }}>
            {LAYERS.slice(3).map((layer, si) => (
              <LegendItem key={layer.human} layer={layer} index={si + 3} highlightIdx={highlightIdx} onHover={onHover} onLeave={onLeave} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link href="/assessment" style={{ textDecoration: 'none' }}>
          <button
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 10.5,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: '#eae8f2',
              background: 'rgba(149,144,236,0.08)',
              border: '1px solid rgba(149,144,236,0.22)',
              borderRadius: 3,
              padding: '15px 52px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 20px rgba(149,144,236,0.06)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(149,144,236,0.14)'
              e.currentTarget.style.borderColor = 'rgba(149,144,236,0.4)'
              e.currentTarget.style.boxShadow = '0 0 35px rgba(149,144,236,0.12), 0 0 15px rgba(149,144,236,0.06) inset'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(149,144,236,0.08)'
              e.currentTarget.style.borderColor = 'rgba(149,144,236,0.22)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(149,144,236,0.06)'
              e.currentTarget.style.color = '#eae8f2'
            }}
          >
            Begin Exploration
          </button>
        </Link>

        {/* Trust line */}
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 12,
          color: 'rgba(234,232,242,0.2)',
          marginTop: '0.7rem',
          textAlign: 'center',
          letterSpacing: '0.02em',
        }}>
          5–7 minutes · Personalized results · No sign-up required
        </p>

      </div>
    </main>
  )
}
