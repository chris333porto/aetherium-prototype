'use client'

/**
 * /discovery/reveal — the GATED initial result.
 *
 * Shows the user they have been named — but not yet fully seen. The
 * dimensional data, growth edge, and canonical practice copy are withheld
 * until they sign the guestbook. This creates explicit motivation for the
 * email capture without feeling transactional.
 *
 * What renders here:
 *   - overline "YOUR ARCHETYPE"
 *   - archetype name (hero, italic accent in dominant dimension color)
 *   - divider
 *   - FIRST sentence of aiOutput (the recognition line)
 *   - "There is more to see." tease
 *   - "Get your full results →" CTA
 *
 * What is REMOVED from here (moved to /discovery/welcome-home):
 *   - full aiOutput (sentences 2 + 3)
 *   - dominant force · growth edge mono line
 *   - dimensional bars
 *
 * Sun clearance: the content block gets an enlarged top spacer so the
 * archetype name always sits below the sun's halo on every viewport.
 */

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Atmosphere } from '../_components/Atmosphere'
import { Sun } from '../_components/Sun'
import { ShojiCurtain, useIncomingShoji, useOutgoingShoji } from '../_components/ShojiCurtain'
import { REALMS } from '../_lib/realms'
import { useComputedDiscovery } from '../_lib/computedResult'

export default function DiscoveryRevealPage() {
  const router = useRouter()
  const incoming = useIncomingShoji()
  const { phase: outgoing, trigger: exit } = useOutgoingShoji(() => {
    router.push('/discovery/guestbook')
  })

  const computed = useComputedDiscovery()
  const curtainPhase = outgoing !== 'idle' ? outgoing : incoming

  // ── No-data fallback ─────────────────────────────────────────────────────

  if (computed === 'no-data') {
    return (
      <main
        style={{
          position: 'relative',
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          overflow: 'hidden',
        }}
      >
        <Atmosphere />
        <Sun />
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            textAlign: 'center',
            maxWidth: 360,
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-fraunces), serif',
              fontSize: 22,
              fontStyle: 'italic',
              color: 'rgba(245,239,228,0.7)',
              marginBottom: 20,
            }}
          >
            Your answers aren&apos;t here yet.
          </p>
          <button
            type="button"
            onClick={() => router.push('/discovery/welcome')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(245,239,228,0.25)',
              color: 'rgba(245,239,228,0.8)',
              padding: '12px 22px',
              fontFamily: 'var(--font-jetbrains), monospace',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              borderRadius: 999,
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            Begin
          </button>
        </div>
      </main>
    )
  }

  // ── Loading (pre-computation) ─────────────────────────────────────────────

  if (!computed) {
    return (
      <main
        style={{
          position: 'relative',
          minHeight: '100dvh',
          overflow: 'hidden',
        }}
      >
        <Atmosphere />
        <Sun />
        <ShojiCurtain phase={curtainPhase} />
      </main>
    )
  }

  // ── Gated initial view ───────────────────────────────────────────────────

  return (
    <RevealContent
      computed={computed}
      curtainPhase={curtainPhase}
      outgoing={outgoing}
      onContinue={exit}
    />
  )
}

// ─── Gated reveal content ────────────────────────────────────────────────────

function RevealContent({
  computed, curtainPhase, outgoing, onContinue,
}: {
  computed:     NonNullable<Exclude<ReturnType<typeof useComputedDiscovery>, 'no-data' | null>>
  curtainPhase: ReturnType<typeof useIncomingShoji>
  outgoing:     ReturnType<typeof useOutgoingShoji>['phase']
  onContinue:   () => void
}) {
  const { archetype, dominantDimension } = computed
  const activeColor = REALMS[dominantDimension].color

  const [namePrefix, ...nameRest] = archetype.name.split(' ')
  const nameAccent = nameRest.join(' ') || namePrefix

  // Just the first sentence — recognition only. Tension + direction are
  // withheld until welcome-home.
  const firstSentence = useMemo(() => firstSentenceOf(archetype.aiOutput), [archetype.aiOutput])

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
        ['--active' as string]: activeColor,
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
            Reveal
          </span>
        </header>

        {/* Sun-clearance spacer — guarantees the archetype name starts BELOW
            the sun's halo on every viewport. Sun halo extends to roughly
            22vh + 55% of sun size = ~(22 + 5.5)vh ≈ 28vh from top. */}
        <div style={{ minHeight: 'clamp(200px, 30vh, 280px)' }} />

        {/* Wave 1 · overline */}
        <p
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 10,
            letterSpacing: '0.38em',
            textTransform: 'uppercase',
            color: 'rgba(245,239,228,0.5)',
            margin: 0,
            opacity: 0,
            animation: 'disc-rev-fade 700ms ease 400ms forwards',
          }}
        >
          Your Archetype
        </p>

        {/* Wave 2 · archetype name — hero */}
        <h1
          style={{
            fontWeight: 300,
            fontSize: 'clamp(44px, 12vw, 66px)',
            lineHeight: 1.02,
            letterSpacing: '-0.025em',
            margin: '16px 0 0',
            opacity: 0,
            animation: 'disc-rev-name 1000ms cubic-bezier(0.22,0.61,0.36,1) 1000ms forwards',
          }}
        >
          <span style={{ color: 'rgba(245,239,228,0.88)' }}>{namePrefix}</span>{' '}
          <em
            style={{
              color: 'var(--active)',
              fontStyle: 'italic',
              fontWeight: 300,
              textShadow: '0 0 22px color-mix(in oklab, var(--active) 40%, transparent)',
            }}
          >
            {nameAccent}
          </em>
        </h1>

        {/* Wave 3 · divider draws */}
        <div
          style={{
            width: '60%',
            height: 1,
            margin: '28px 0 8px',
            background: 'linear-gradient(to right, transparent, rgba(245,239,228,0.28), transparent)',
            transformOrigin: 'left center',
            transform: 'scaleX(0)',
            animation: 'disc-rev-divider 700ms cubic-bezier(0.22,0.61,0.36,1) 1800ms forwards',
          }}
        />

        {/* Wave 4 · first sentence of aiOutput (recognition only) */}
        <p
          style={{
            fontFamily: 'var(--font-fraunces), serif',
            fontSize: 'clamp(18px, 4.8vw, 21px)',
            lineHeight: 1.5,
            letterSpacing: '-0.005em',
            color: 'rgba(245,239,228,0.88)',
            margin: '20px 0 0',
            maxWidth: '34ch',
            opacity: 0,
            animation: 'disc-rev-fade 900ms cubic-bezier(0.22,0.61,0.36,1) 2400ms forwards',
          }}
        >
          {firstSentence}
        </p>

        {/* Wave 5 · tease */}
        <p
          style={{
            fontFamily: 'var(--font-fraunces), serif',
            fontSize: 'clamp(16px, 4.2vw, 18px)',
            fontStyle: 'italic',
            lineHeight: 1.5,
            color: 'rgba(245,239,228,0.5)',
            margin: '14px 0 0',
            maxWidth: '34ch',
            opacity: 0,
            animation: 'disc-rev-fade 800ms ease 3200ms forwards',
          }}
        >
          There is more to see.
        </p>

        <div style={{ flex: 1, minHeight: 24 }} />

        {/* Wave 6 · CTA */}
        <div
          style={{
            opacity: 0,
            animation: 'disc-rev-fade 700ms ease 3800ms forwards',
          }}
        >
          <button
            type="button"
            onClick={onContinue}
            onTouchEnd={(e) => { e.preventDefault(); onContinue() }}
            disabled={outgoing !== 'idle'}
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
              cursor: outgoing === 'idle' ? 'pointer' : 'default',
              borderRadius: 999,
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              position: 'relative',
              zIndex: 20,
              minHeight: 44,
            }}
          >
            Get your full results
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
        </div>
      </div>

      <ShojiCurtain phase={curtainPhase} />

      <style>{`
        @keyframes disc-rev-fade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes disc-rev-name {
          from { opacity: 0; transform: scale(0.98) translateY(4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        @keyframes disc-rev-divider {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </main>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function firstSentenceOf(text: string): string {
  // Canon aiOutput is 2-3 sentences separated by '. '. Grab up to and including
  // the first terminator. Fall back to full text on any parsing weirdness.
  const match = text.match(/^[^.!?]+[.!?]/)
  return match ? match[0].trim() : text
}
