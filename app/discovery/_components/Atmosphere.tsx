'use client'

/**
 * Atmosphere — the recolorable dark environment behind every Discovery scene.
 *
 * Three layers:
 *   1. Bloom      — large soft wash driven by --active, transitions in oklab
 *   2. Orb        — big breathing color field (the "weather", not the sun)
 *   3. Grain      — static fractal noise overlay for texture
 *   4. Vignette   — top + bottom darkening for content legibility
 *
 * Every child carries `pointer-events: none` explicitly. iOS Chrome's hit-test
 * treats children with their own stacking context (from `filter`, `transform`,
 * `mixBlendMode`, or `z-index`) as independent targets even when the parent
 * has `pointer-events: none` — setting it on each child is the reliable fix.
 */

export function Atmosphere() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Bloom */}
      <div
        style={{
          position: 'absolute',
          inset: '-15%',
          background: `
            radial-gradient(ellipse 55% 70% at 50% 38%,
              color-mix(in oklab, var(--active) 70%, #fff) 0%,
              color-mix(in oklab, var(--active) 45%, #1a1020) 22%,
              transparent 55%),
            radial-gradient(ellipse 120% 70% at 50% 110%,
              color-mix(in oklab, var(--active) 40%, #06050a) 0%,
              transparent 65%)
          `,
          filter: 'blur(42px)',
          opacity: 0.55,
          transition: 'background 1.6s cubic-bezier(0.22,0.61,0.36,1)',
          pointerEvents: 'none',
        }}
      />

      {/* Orb — dimensional weather, large & breathing */}
      <div
        style={{
          position: 'absolute',
          top: '34%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80vw',
          maxWidth: 360,
          aspectRatio: '1 / 1',
          borderRadius: '50%',
          background: `radial-gradient(circle at 50% 45%,
            color-mix(in oklab, var(--active) 30%, #fff) 0%,
            color-mix(in oklab, var(--active) 60%, transparent) 45%,
            transparent 72%)`,
          filter: 'blur(32px)',
          opacity: 0.75,
          animation: 'disc-orb 10s ease-in-out infinite',
          transition: 'background 1.6s cubic-bezier(0.22,0.61,0.36,1)',
          pointerEvents: 'none',
        }}
      />

      {/* Grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          opacity: 0.11,
          mixBlendMode: 'overlay',
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
          pointerEvents: 'none',
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          background: `linear-gradient(180deg,
            rgba(15,11,26,0.50) 0%,
            transparent 20%,
            transparent 55%,
            rgba(15,11,26,0.88) 92%,
            rgba(15,11,26,0.96) 100%)`,
          pointerEvents: 'none',
        }}
      />

      <style>{`
        @keyframes disc-orb {
          0%, 100% { transform: translate(-50%, -50%) scale(1);    opacity: 0.75; }
          50%      { transform: translate(-50%, -53%) scale(1.06); opacity: 0.92; }
        }
      `}</style>
    </div>
  )
}
