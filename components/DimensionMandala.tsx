'use client'

/**
 * DimensionMandala — three-tier sub-ring system
 *
 * Each dimension is represented by 3 concentric sub-rings (low / mid / high).
 * Score drives which tiers are illuminated:
 *
 *   low  tier — always present; brightens linearly with score
 *   mid  tier — fades in from score ≥ 28; full presence near score 80+
 *   high tier — fades in from score ≥ 62; only visible for strong dimensions
 *
 * Animation:
 *   low  ring → very slow counter-clockwise rotation  (gives inner "gravity")
 *   mid  ring → brightness pulse only                 (steady anchor)
 *   high ring → very slow clockwise rotation          (outer charged field)
 *
 * Each dimension spins at a different rate so they never feel synchronised.
 * Blocked dimensions get a dashed stroke on the high tier.
 */

import type { DimensionScores } from '@/lib/scoring/engine'
import { classifyActivation, DEMO_SCORES } from '@/lib/assessment/stateEngine'

// ─── Sub-ring layout ─────────────────────────────────────────────────────────
//
// Available radial bands (separator circles define the walls):
//   Earth:  r=121 → r=149  (28 px)   sw=7   sep=149
//   Water:  r=95  → r=121  (26 px)   sw=6   sep=121
//   Air:    r=69  → r=95   (26 px)   sw=6   sep=95
//   Fire:   r=45  → r=69   (24 px)   sw=5.5 sep=69
//   Aether: r=0   → r=45   (centre)  sw=5   sep=45
//
// Within each band, 3 sub-rings are packed with ~1.5 px gaps and ~2 px margins.

interface SubRing { r: number; sw: number }
interface DimConfig {
  dim:     keyof DimensionScores
  color:   string
  rgb:     string
  sepR:    number           // outer separator radius
  rings:   [SubRing, SubRing, SubRing]  // [low, mid, high]
  spinDur: number           // base spin duration in seconds
}

const DIMS: DimConfig[] = [
  {
    dim: 'earth', color: '#2db885', rgb: '45,184,133',  sepR: 149, spinDur: 90,
    rings: [{ r: 127, sw: 7 }, { r: 136, sw: 7 }, { r: 145, sw: 7 }],
  },
  {
    dim: 'water', color: '#4a9fd4', rgb: '74,159,212',  sepR: 121, spinDur: 78,
    rings: [{ r: 101, sw: 6 }, { r: 109, sw: 6 }, { r: 117, sw: 6 }],
  },
  {
    dim: 'air',   color: '#d4853a', rgb: '212,133,58',  sepR: 95,  spinDur: 64,
    rings: [{ r: 75, sw: 6 }, { r: 83, sw: 6 }, { r: 91, sw: 6 }],
  },
  {
    dim: 'fire',  color: '#e05a3a', rgb: '224,90,58',   sepR: 69,  spinDur: 52,
    rings: [{ r: 50, sw: 5.5 }, { r: 57, sw: 5.5 }, { r: 64, sw: 5.5 }],
  },
]

// Aether — innermost nucleus, no rotation, pulse only
const AETHER: Omit<DimConfig, 'spinDur'> = {
  dim: 'aether', color: '#9590ec', rgb: '149,144,236', sepR: 45,
  rings: [{ r: 17, sw: 5 }, { r: 26, sw: 5 }, { r: 35, sw: 5 }],
}

// ─── Score → per-tier opacity ────────────────────────────────────────────────

function tierOpacity(score: number, tier: 'low' | 'mid' | 'high'): number {
  const n = score / 100
  if (tier === 'low')  return 0.14 + n * 0.54                              // 0.14 – 0.68
  if (tier === 'mid')  return Math.max(0.04, ((n - 0.28) / 0.72) * 0.76)  // fades in at score ≥ 28
  /* high */           return Math.max(0.00, ((n - 0.62) / 0.38) * 0.84)  // fades in at score ≥ 62
}

function tierFill(score: number, tier: 'low' | 'mid' | 'high'): number {
  return tierOpacity(score, tier) * 0.14
}

// Broken-dash for blocked high-tier rings (~10 arcs around circumference)
function blockedDash(r: number): string {
  const c = 2 * Math.PI * r
  const unit = c / 12
  return `${(unit * 0.68).toFixed(1)} ${(unit * 0.32).toFixed(1)}`
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  scores?:    DimensionScores
  size?:      number
  style?:     React.CSSProperties
  className?: string
}

export function DimensionMandala({ scores = DEMO_SCORES, size = 320, style, className }: Props) {
  return (
    <svg
      viewBox="0 0 320 320"
      width={size}
      height={size}
      fill="none"
      aria-label="Five dimension mandala"
      className={className}
      style={{ width: `min(${size}px, 80vw)`, height: `min(${size}px, 80vw)`, display: 'block', ...style }}
    >
      {/* Outer guide ring */}
      <circle cx="160" cy="160" r="152" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />

      {/* ── Five outer dimensions (earth → fire) ───────────────────────── */}
      {DIMS.map(cfg => {
        const score = Math.max(0, Math.min(100, scores[cfg.dim] ?? 50))
        const blocked = classifyActivation(score) === 'blocked'
        const [low, mid, high] = cfg.rings

        return (
          <g key={cfg.dim}>
            {/* LOW tier — slow CCW spin */}
            <g
              className="dm-ring-ccw dm-pulse"
              style={{ animationDuration: `${cfg.spinDur}s` } as React.CSSProperties}
            >
              <circle
                cx="160" cy="160" r={low.r}
                stroke={cfg.color}
                strokeWidth={low.sw}
                strokeOpacity={tierOpacity(score, 'low')}
                fill={`rgba(${cfg.rgb},${tierFill(score, 'low').toFixed(3)})`}
              />
            </g>

            {/* MID tier — pulse only, no rotation */}
            <g className="dm-pulse">
              <circle
                cx="160" cy="160" r={mid.r}
                stroke={cfg.color}
                strokeWidth={mid.sw}
                strokeOpacity={tierOpacity(score, 'mid')}
                fill={`rgba(${cfg.rgb},${tierFill(score, 'mid').toFixed(3)})`}
              />
            </g>

            {/* HIGH tier — slow CW spin; dashed if blocked */}
            <g
              className="dm-ring-cw dm-pulse-high"
              style={{ animationDuration: `${cfg.spinDur * 0.75}s` } as React.CSSProperties}
            >
              <circle
                cx="160" cy="160" r={high.r}
                stroke={cfg.color}
                strokeWidth={high.sw}
                strokeOpacity={tierOpacity(score, 'high')}
                strokeDasharray={blocked ? blockedDash(high.r) : undefined}
                strokeLinecap={blocked ? 'round' : undefined}
                fill={`rgba(${cfg.rgb},${tierFill(score, 'high').toFixed(3)})`}
              />
              {/* Soft halo on lit high rings */}
              {tierOpacity(score, 'high') > 0.15 && (
                <circle
                  cx="160" cy="160" r={high.r}
                  stroke={cfg.color}
                  strokeWidth={high.sw * 2.2}
                  strokeOpacity={tierOpacity(score, 'high') * 0.10}
                  fill="none"
                />
              )}
            </g>

            {/* Dimension boundary separator */}
            <circle
              cx="160" cy="160" r={cfg.sepR}
              stroke="rgba(8,8,14,0.9)"
              strokeWidth="2.5"
            />
          </g>
        )
      })}

      {/* ── Aether — nucleus ─────────────────────────────────────────── */}
      {(() => {
        const score   = Math.max(0, Math.min(100, scores['aether'] ?? 50))
        const [low, mid, high] = AETHER.rings
        return (
          <g key="aether">
            {/* Aether separator boundary */}
            <circle cx="160" cy="160" r={AETHER.sepR} stroke="rgba(8,8,14,0.9)" strokeWidth="2.5" />

            {/* LOW — faint outer aether ring */}
            <g className="dm-pulse" style={{ animationDuration: '8s' } as React.CSSProperties}>
              <circle
                cx="160" cy="160" r={low.r}
                stroke={AETHER.color}
                strokeWidth={low.sw}
                strokeOpacity={tierOpacity(score, 'low')}
                fill={`rgba(${AETHER.rgb},${tierFill(score, 'low').toFixed(3)})`}
              />
            </g>

            {/* MID */}
            <g className="dm-pulse" style={{ animationDuration: '6s' } as React.CSSProperties}>
              <circle
                cx="160" cy="160" r={mid.r}
                stroke={AETHER.color}
                strokeWidth={mid.sw}
                strokeOpacity={tierOpacity(score, 'mid')}
                fill={`rgba(${AETHER.rgb},${tierFill(score, 'mid').toFixed(3)})`}
              />
            </g>

            {/* HIGH */}
            <g className="dm-pulse" style={{ animationDuration: '4.5s' } as React.CSSProperties}>
              <circle
                cx="160" cy="160" r={high.r}
                stroke={AETHER.color}
                strokeWidth={high.sw}
                strokeOpacity={tierOpacity(score, 'high')}
                fill={`rgba(${AETHER.rgb},${tierFill(score, 'high').toFixed(3)})`}
              />
            </g>

            {/* Centre nucleus */}
            <circle
              cx="160" cy="160" r="5"
              fill={`rgba(${AETHER.rgb},${(0.45 + (score / 100) * 0.45).toFixed(2)})`}
            />
            {/* Inner pulse ring */}
            <circle
              cx="160" cy="160" r="9"
              stroke="rgba(149,144,236,0.16)"
              strokeWidth="1"
            />
          </g>
        )
      })()}
    </svg>
  )
}
