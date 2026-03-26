'use client'

import React from 'react'

export interface DimensionScores {
  aether: number
  fire: number
  air: number
  water: number
  earth: number
}

interface DimensionChartProps {
  scores: DimensionScores
  size?: number
  animated?: boolean
}

const DIMENSIONS = [
  { key: 'aether', label: 'AETHER', color: '#9590ec' },
  { key: 'fire',   label: 'FIRE',   color: '#e05a3a' },
  { key: 'air',    label: 'AIR',    color: '#d4853a' },
  { key: 'water',  label: 'WATER',  color: '#4a9fd4' },
  { key: 'earth',  label: 'EARTH',  color: '#2db885' },
] as const

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.sin(angleRad),
    y: cy - r * Math.cos(angleRad),
  }
}

export function DimensionChart({ scores, size = 260, animated = true }: DimensionChartProps) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.36
  const labelR = size * 0.46
  const rings = [0.25, 0.5, 0.75, 1.0]
  const angles = DIMENSIONS.map((_, i) => (i * 2 * Math.PI) / DIMENSIONS.length)

  // Build ring polygons
  function buildPolygon(fraction: number) {
    return angles.map(a => {
      const p = polarToCartesian(cx, cy, maxR * fraction, a)
      return `${p.x},${p.y}`
    }).join(' ')
  }

  // Build score polygon
  const scorePoints = DIMENSIONS.map(({ key }, i) => {
    const val = Math.max(0, Math.min(100, scores[key])) / 100
    const p = polarToCartesian(cx, cy, maxR * val, angles[i])
    return `${p.x},${p.y}`
  }).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {/* Ring guidelines */}
      {rings.map((r, i) => (
        <polygon
          key={i}
          points={buildPolygon(r)}
          fill="none"
          stroke="rgba(234,232,242,0.06)"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {angles.map((a, i) => {
        const outer = polarToCartesian(cx, cy, maxR, a)
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={outer.x} y2={outer.y}
            stroke="rgba(234,232,242,0.06)"
            strokeWidth="1"
          />
        )
      })}

      {/* Score fill */}
      <polygon
        points={scorePoints}
        fill="rgba(149,144,236,0.12)"
        stroke="rgba(149,144,236,0.5)"
        strokeWidth="1.5"
        className={animated ? 'animate-fade-in' : ''}
      />

      {/* Score dots */}
      {DIMENSIONS.map(({ key, color }, i) => {
        const val = Math.max(0, Math.min(100, scores[key])) / 100
        const p = polarToCartesian(cx, cy, maxR * val, angles[i])
        return (
          <circle
            key={key}
            cx={p.x} cy={p.y}
            r="3"
            fill={color}
            className={animated ? 'animate-fade-in' : ''}
          />
        )
      })}

      {/* Labels */}
      {DIMENSIONS.map(({ label, color }, i) => {
        const p = polarToCartesian(cx, cy, labelR, angles[i])
        const textAnchor =
          Math.abs(p.x - cx) < 5 ? 'middle' :
          p.x < cx ? 'end' : 'start'
        return (
          <text
            key={label}
            x={p.x}
            y={p.y}
            textAnchor={textAnchor}
            dominantBaseline="middle"
            fontSize="8"
            letterSpacing="2"
            fontFamily="Cinzel, serif"
            fill={color}
            opacity="0.85"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}
