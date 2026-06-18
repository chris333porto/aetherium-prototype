'use client'

/**
 * /discovery/welcome — the arrival scene.
 *
 * Sun anchor at the unified position. Below the copy, a subtle row of the
 * five element kanji in their dimension colors hints at the framework the
 * user is about to meet. On Begin, outgoing shoji closes and the flow
 * advances to the elements teaching.
 */

import { useRouter } from 'next/navigation'
import { Atmosphere } from '../_components/Atmosphere'
import { Sun } from '../_components/Sun'
import { ShojiCurtain, useOutgoingShoji } from '../_components/ShojiCurtain'
import { REALMS, REALM_ORDER } from '../_lib/realms'

export default function DiscoveryWelcomePage() {
  const router = useRouter()
  const { phase, trigger } = useOutgoingShoji(() => {
    router.push('/discovery/elements')
  })

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Atmosphere />
      <Sun />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 480,
          padding: '24px 24px calc(32px + env(safe-area-inset-bottom, 0px))',
          paddingTop: 'calc(24px + env(safe-area-inset-top, 0px))',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100dvh',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 8,
          }}
        >
          <span style={{ fontStyle: 'italic', fontSize: 17, letterSpacing: '0.02em' }}>
            Aetherium
          </span>
          <span
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(245,239,228,0.45)',
            }}
          >
            Discovery
          </span>
        </header>

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            paddingBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              fontSize: 10,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'rgba(245,239,228,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ width: 28, height: 1, background: 'rgba(245,239,228,0.35)' }} />
            Begin
          </div>

          <h1
            style={{
              fontWeight: 300,
              fontSize: 'clamp(40px, 11vw, 58px)',
              lineHeight: 1.04,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Know the shape{' '}
            <em
              style={{
                color: 'var(--active)',
                fontStyle: 'italic',
                fontWeight: 300,
              }}
            >
              you&apos;re moving in
            </em>
            .
          </h1>

          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: 'rgba(245,239,228,0.62)',
              maxWidth: '30ch',
              margin: 0,
            }}
          >
            Fifty questions. One at a time. Between eight and twelve minutes.
            Somewhere quiet is best.
          </p>

          {/* Element preview — subtle row of 5 kanji in dimension colors.
              No labels, no overline. A hint, not a teaching. */}
          <div
            aria-hidden
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 20,
              paddingTop: 6,
              pointerEvents: 'none',
            }}
          >
            {REALM_ORDER.map(d => {
              const r = REALMS[d]
              return (
                <span
                  key={d}
                  style={{
                    fontFamily: 'var(--font-noto-jp), serif',
                    fontSize: 26,
                    lineHeight: 1,
                    color: r.color,
                    opacity: 0.42,
                    pointerEvents: 'none',
                  }}
                >
                  {r.kanji}
                </span>
              )
            })}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 20,
              borderTop: '1px solid rgba(245,239,228,0.1)',
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={trigger}
              onTouchEnd={(e) => {
                // Some iOS Chrome versions don't fire a synthetic click after
                // touchend when the target re-renders mid-gesture. Firing the
                // handler directly from touchend is a safety net; the onClick
                // path still wins on desktop / non-touch.
                e.preventDefault()
                trigger()
              }}
              disabled={phase !== 'idle'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                background: '#f5efe4',
                color: '#0f0b1a',
                border: 'none',
                padding: '14px 24px',
                fontFamily: 'var(--font-jetbrains), monospace',
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: phase === 'idle' ? 'pointer' : 'default',
                borderRadius: 999,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                position: 'relative',
                zIndex: 20,
                minHeight: 44,
              }}
            >
              Begin
              <span style={{ width: 14, height: 1, background: '#0f0b1a', position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute', right: -1, top: -3,
                    width: 7, height: 7,
                    borderTop: '1px solid #0f0b1a', borderRight: '1px solid #0f0b1a',
                    transform: 'rotate(45deg)',
                  }}
                />
              </span>
            </button>

            <span
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(245,239,228,0.35)',
                textAlign: 'right',
                lineHeight: 1.6,
              }}
            >
              Your pace<br />no account needed
            </span>
          </div>
        </div>
      </div>

      <ShojiCurtain phase={phase} />
    </main>
  )
}
