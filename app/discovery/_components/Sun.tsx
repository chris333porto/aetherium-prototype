'use client'

/**
 * Sun — the constant still point across every Discovery scene.
 *
 * All layers carry `pointer-events: none` explicitly so touches pass through
 * to interactive content beneath (iOS Chrome can hit-test filter/transform
 * children independently of parent pointer-events).
 */

const SIZE = 100
// 22dvh (viewport height) instead of 22% — which would be relative to <main>'s
// height and shift down on pages where content makes main grow taller than
// the viewport (e.g. the long welcome-home results).
const TOP  = '22dvh'

interface SunProps {
  countdown?: number
  paused?:    boolean
}

export function Sun({ countdown, paused = false }: SunProps) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left:     '50%',
        top:      TOP,
        transform: 'translate(-50%, -50%)',
        width:    SIZE,
        height:   SIZE,
        zIndex:   4,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `radial-gradient(circle at 50% 48%,
            #fff6d8 0%,
            #fdeac2 45%,
            #f5d79a 70%,
            transparent 100%)`,
          boxShadow: `
            0 0 ${SIZE * 0.55}px ${SIZE * 0.12}px color-mix(in oklab, var(--active) 50%, transparent),
            0 0 ${SIZE * 1.1}px ${SIZE * 0.24}px color-mix(in oklab, var(--active) 22%, transparent)
          `,
          animation: paused ? undefined : 'disc-sun-pulse 4s ease-in-out infinite',
          transition: 'box-shadow 1.6s cubic-bezier(0.22,0.61,0.36,1)',
          pointerEvents: 'none',
        }}
      />

      {countdown && countdown > 0 && (
        <svg
          width={SIZE * 1.35}
          height={SIZE * 1.35}
          viewBox={`0 0 ${SIZE * 1.35} ${SIZE * 1.35}`}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-90deg)',
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          <circle
            cx={SIZE * 0.675}
            cy={SIZE * 0.675}
            r={SIZE * 0.62}
            fill="none"
            stroke="rgba(245,239,228,0.15)"
            strokeWidth="1.5"
            style={{ pointerEvents: 'none' }}
          />
          <circle
            cx={SIZE * 0.675}
            cy={SIZE * 0.675}
            r={SIZE * 0.62}
            fill="none"
            stroke="rgba(255,240,200,0.9)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * SIZE * 0.62}
            strokeDashoffset={2 * Math.PI * SIZE * 0.62}
            style={{
              animation: `disc-sun-countdown ${countdown}s linear forwards`,
              filter: `drop-shadow(0 0 6px color-mix(in oklab, var(--active) 55%, transparent))`,
              pointerEvents: 'none',
            }}
          />
        </svg>
      )}

      <style>{`
        @keyframes disc-sun-pulse {
          0%, 100% { transform: scale(1);    filter: brightness(1);    }
          50%      { transform: scale(1.05); filter: brightness(1.12); }
        }
        @keyframes disc-sun-countdown {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}
