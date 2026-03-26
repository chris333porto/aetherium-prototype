'use client'

import React from 'react'

interface EnergyFieldProps {
  size?: number
  opacity?: number
  color?: string
  className?: string
  fixed?: boolean
}

/**
 * Ambient circular mandala — the central visual anchor of Aetherium.
 * Low opacity, slow rotation. A presence, not decoration.
 */
export function EnergyField({
  size = 700,
  opacity = 1,
  color = '#9590ec',
  className = '',
  fixed = true,
}: EnergyFieldProps) {
  const cx = size / 2
  const cy = size / 2

  // Parse color to rgba helper
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`

  // Concentric circle radii
  const rings = [30, 60, 95, 135, 180, 230, 285, 340]

  // Pentagon points for the 5 dimension markers
  const pentagonR = 105
  const pentaPoints = Array.from({ length: 5 }, (_, i) => {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
    return {
      x: cx + pentagonR * Math.cos(angle),
      y: cy + pentagonR * Math.sin(angle),
    }
  })

  return (
    <div
      className={className}
      style={{
        position: fixed ? 'fixed' : 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: size,
        height: size,
        pointerEvents: 'none',
        opacity,
        zIndex: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Central glow gradient */}
          <radialGradient id="ef-center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={rgba(0.08)} />
            <stop offset="40%"  stopColor={rgba(0.03)} />
            <stop offset="100%" stopColor={rgba(0)} />
          </radialGradient>

          {/* Bloom gradient for inner rings */}
          <radialGradient id="ef-bloom" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={rgba(0.06)} />
            <stop offset="100%" stopColor={rgba(0)} />
          </radialGradient>
        </defs>

        {/* Ambient background bloom */}
        <circle cx={cx} cy={cy} r={340} fill="url(#ef-center-glow)" />

        {/* Concentric rings — opacity fades outward */}
        {rings.map((r, i) => {
          const a = 0.07 - i * 0.007
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={rgba(Math.max(a, 0.015))}
              strokeWidth={i === 0 ? 0.8 : 0.5}
            />
          )
        })}

        {/* Slow outer dashed ring — clockwise */}
        <g
          style={{
            animation: 'ef-spin-cw 140s linear infinite',
            transformOrigin: `${cx}px ${cy}px`,
          }}
        >
          <circle
            cx={cx} cy={cy} r={200}
            fill="none"
            stroke={rgba(0.035)}
            strokeWidth={0.6}
            strokeDasharray="3 18"
          />
        </g>

        {/* Inner dashed ring — counterclockwise */}
        <g
          style={{
            animation: 'ef-spin-ccw 90s linear infinite',
            transformOrigin: `${cx}px ${cy}px`,
          }}
        >
          <circle
            cx={cx} cy={cy} r={140}
            fill="none"
            stroke={rgba(0.04)}
            strokeWidth={0.5}
            strokeDasharray="2 10"
          />
        </g>

        {/* Very slow outer ring */}
        <g
          style={{
            animation: 'ef-spin-cw 220s linear infinite',
            transformOrigin: `${cx}px ${cy}px`,
          }}
        >
          <circle
            cx={cx} cy={cy} r={280}
            fill="none"
            stroke={rgba(0.02)}
            strokeWidth={0.4}
            strokeDasharray="1 20"
          />
        </g>

        {/* Pentagon connecting lines (very faint) */}
        <polygon
          points={pentaPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={rgba(0.04)}
          strokeWidth={0.4}
        />

        {/* Pentagon vertex dots — 5 dimensions (kept very faint) */}
        {pentaPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={1.2}
            fill={rgba(0.09)}
          />
        ))}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={2.5} fill={rgba(0.08)} />
        <circle cx={cx} cy={cy} r={1} fill={rgba(0.22)} />
      </svg>

      <style>{`
        @keyframes ef-spin-cw  { to { transform: rotate(360deg); } }
        @keyframes ef-spin-ccw { to { transform: rotate(-360deg); } }
      `}</style>
    </div>
  )
}
