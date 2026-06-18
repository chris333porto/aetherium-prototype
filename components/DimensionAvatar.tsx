'use client'

/**
 * DimensionAvatar — the canonical "avatar ring": a single ring whose arc
 * segments are proportional to each dimension's score and colored by element,
 * wrapped around the practitioner's initial. Per brand-canon §8.5/§9.7 the
 * avatar is the *living* counterpart to the mandala (self in motion now), where
 * the mandala is the fuller cartography.
 *
 * Placeholder-grade by design: this is the deterministic SVG avatar. Generative
 * photorealistic avatars (from the 3 onboarding photos) are a later phase.
 */

import type { DimensionScores } from '@/lib/scoring/engine'

// Canonical order, center → edge, with element colors matched to DimensionMandala.
const SEGMENTS: { dim: keyof DimensionScores; color: string }[] = [
  { dim: 'aether', color: '#9590ec' },
  { dim: 'fire',   color: '#e05a3a' },
  { dim: 'air',    color: '#d4853a' },
  { dim: 'water',  color: '#4a9fd4' },
  { dim: 'earth',  color: '#2db885' },
]

interface Props {
  scores:    DimensionScores
  initial?:  string
  size?:     number
  style?:    React.CSSProperties
  className?: string
}

export function DimensionAvatar({ scores, initial, size = 88, style, className }: Props) {
  const R = 42
  const C = 2 * Math.PI * R
  const GAP = 3 // px gap between segments along the circumference

  const total =
    SEGMENTS.reduce((s, x) => s + Math.max(0, scores[x.dim] ?? 0), 0) || 1

  let offset = 0
  const arcs = SEGMENTS.map(seg => {
    const frac = Math.max(0, scores[seg.dim] ?? 0) / total
    const seg_len = Math.max(0, frac * C - GAP)
    const node = (
      <circle
        key={seg.dim}
        cx="50" cy="50" r={R}
        fill="none"
        stroke={seg.color}
        strokeWidth="6"
        strokeOpacity={0.9}
        strokeLinecap="round"
        strokeDasharray={`${seg_len.toFixed(2)} ${(C - seg_len).toFixed(2)}`}
        strokeDashoffset={(-offset).toFixed(2)}
        transform="rotate(-90 50 50)"
      />
    )
    offset += frac * C
    return node
  })

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      aria-label="Your avatar"
      className={className}
      style={{ display: 'block', ...style }}
    >
      {/* faint base ring */}
      <circle cx="50" cy="50" r={R} stroke="rgba(245,239,228,0.06)" strokeWidth="6" />
      {arcs}
      {initial && (
        <text
          x="50" y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(245,239,228,0.86)"
          style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 30, fontStyle: 'italic' }}
        >
          {initial}
        </text>
      )}
    </svg>
  )
}
