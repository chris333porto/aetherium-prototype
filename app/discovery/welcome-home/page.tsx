'use client'

/**
 * /discovery/welcome-home — the FULL results, post-guestbook.
 *
 * The earned view. User is no longer anonymous; they have traded name +
 * email for the complete mirror:
 *
 *   · personalized greeting ("Welcome home, {name}." or just "Welcome home.")
 *   · full aiOutput paragraph (recognition · tension · direction)
 *   · dominant force · growth · growth edge (mono line)
 *   · 5 dimensional bars with actual scores
 *   · closing note drawn from canon (whenAligned + practiceOrientation)
 *   · "We'll write before Monday…" bridge to the seven-day trial
 *   · Aetherium signature at the very bottom
 *
 * This page is the transition from visitor to practitioner.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Atmosphere } from '../_components/Atmosphere'
import { Sun } from '../_components/Sun'
import { ShojiCurtain, useIncomingShoji } from '../_components/ShojiCurtain'
import { REALMS } from '../_lib/realms'
import { useComputedDiscovery, NAME_KEY, EMAIL_KEY, TOKEN_KEY } from '../_lib/computedResult'
import { saveDiscoveryResult } from '../_lib/persistence'
import { DIMENSIONS_ORDER, type Dimension } from '@/lib/assessment/questions'
import { DimensionMandala } from '@/components/DimensionMandala'
import { DimensionAvatar } from '@/components/DimensionAvatar'

// Where the seven-day trial lives (the practice app). Configurable so a custom
// domain (e.g. app.aetherium.one) can override the Vercel default at build time.
const PRACTICE_APP_URL = (
  process.env.NEXT_PUBLIC_PRACTICE_APP_URL ?? 'https://app.aetherium.one'
).replace(/\/+$/, '')

// Shared styling for the canon-field rows in the closing "deeper read" block.
const CANON_LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-jetbrains), monospace',
  fontSize: 9,
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  color: 'rgba(245,239,228,0.4)',
  margin: '14px 0 0',
}
const CANON_VALUE: React.CSSProperties = {
  fontFamily: 'var(--font-fraunces), serif',
  fontSize: 17,
  lineHeight: 1.55,
  color: 'rgba(245,239,228,0.82)',
  margin: 0,
}

export default function DiscoveryWelcomeHomePage() {
  const incoming = useIncomingShoji()
  const computed = useComputedDiscovery()
  const router = useRouter()

  const [name, setName] = useState<string | null>(null)
  useEffect(() => {
    try { setName(localStorage.getItem(NAME_KEY)) } catch { /* ignore */ }
  }, [])

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
            The mirror can&apos;t see you yet.
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

  if (!computed) {
    return (
      <main style={{ position: 'relative', minHeight: '100dvh', overflow: 'hidden' }}>
        <Atmosphere />
        <Sun />
        <ShojiCurtain phase={incoming} />
      </main>
    )
  }

  return (
    <WelcomeHomeContent
      computed={computed}
      name={name}
      incoming={incoming}
    />
  )
}

// ─── Full results content ────────────────────────────────────────────────────

function WelcomeHomeContent({
  computed, name, incoming,
}: {
  computed: NonNullable<Exclude<ReturnType<typeof useComputedDiscovery>, 'no-data' | null>>
  name:     string | null
  incoming: ReturnType<typeof useIncomingShoji>
}) {
  const { archetype, dimensionScores, dominantDimension } = computed
  const activeColor = REALMS[dominantDimension].color

  // AI-personalized reading of THIS person's specific result (five-energy scores
  // + matched archetype + canon fields). Progressive enhancement: falls back to
  // the static archetype mirror if it fails or the key is unset, so the page
  // never depends on it.
  const [reading, setReading] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const r = await fetch('/api/discovery-reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            archetypeName: archetype.name,
            archetypeCategory: archetype.category,
            corePattern: archetype.corePattern,
            coreTension: archetype.coreTension,
            whenAligned: archetype.whenAligned,
            whenMisaligned: archetype.whenMisaligned,
            rebalancingPath: archetype.rebalancingPath,
            practiceOrientation: archetype.practiceOrientation,
            growthEdge: archetype.growthEdge,
            shadowTrigger: archetype.shadowTrigger,
            dominantDimension,
            dimensionScores,
          }),
        })
        const data = (await r.json()) as { ok?: boolean; reading?: string }
        if (!cancelled && data?.ok && data.reading) setReading(data.reading)
      } catch { /* keep the static fallback */ }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The displayed mirror: the AI reading once it lands, else the static canon.
  const sentences = useMemo(
    () => splitSentences(reading ?? archetype.aiOutput),
    [reading, archetype.aiOutput],
  )

  // ── Handoff token ─────────────────────────────────────────────────────────
  // Mint a stable token once, persist the full result to discovery_results so
  // the practice app can fetch + populate the trial Profile, and keep the same
  // token in localStorage so a refresh doesn't create a second row.
  const [token, setToken] = useState<string | null>(null)
  useEffect(() => {
    let t: string | null = null
    try { t = localStorage.getItem(TOKEN_KEY) } catch { /* ignore */ }

    const alreadyPersisted = !!t
    if (!t) {
      t = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      try { localStorage.setItem(TOKEN_KEY, t) } catch { /* ignore */ }
    }
    setToken(t)

    if (!alreadyPersisted) {
      let email: string | null = null
      let nm: string | null = null
      try {
        email = localStorage.getItem(EMAIL_KEY)
        nm = localStorage.getItem(NAME_KEY)
      } catch { /* ignore */ }

      // Fire-and-forget; never blocks the reveal.
      void saveDiscoveryResult({
        token: t,
        name: nm,
        email,
        archetypeId: archetype.id,
        archetypeName: archetype.name,
        dimensionScores,
        dominantDimension,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const trialHref = token
    ? `${PRACTICE_APP_URL}/onboarding?t=${encodeURIComponent(token)}`
    : `${PRACTICE_APP_URL}/onboarding`

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
          padding: '24px 24px calc(40px + env(safe-area-inset-bottom, 0px))',
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
            Welcome home
          </span>
        </header>

        {/* Sun-clearance spacer */}
        <div style={{ minHeight: 'clamp(200px, 30vh, 280px)' }} />

        {/* Overline */}
        <div
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 10,
            letterSpacing: '0.38em',
            textTransform: 'uppercase',
            color: 'rgba(245,239,228,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            opacity: 0,
            animation: 'disc-home-fade 700ms ease 200ms forwards',
          }}
        >
          <span style={{ width: 28, height: 1, background: 'rgba(245,239,228,0.3)' }} />
          Your mark is held
        </div>

        {/* Headline — personalized */}
        <h1
          style={{
            fontWeight: 300,
            fontSize: 'clamp(36px, 10vw, 52px)',
            lineHeight: 1.06,
            letterSpacing: '-0.02em',
            margin: '18px 0 0',
            opacity: 0,
            animation: 'disc-home-name 1000ms cubic-bezier(0.22,0.61,0.36,1) 600ms forwards',
          }}
        >
          Welcome{' '}
          <em
            style={{
              color: 'var(--active)',
              fontStyle: 'italic',
              fontWeight: 300,
            }}
          >
            home
          </em>
          {name ? `, ${name}.` : '.'}
        </h1>

        {/* Divider */}
        <div
          style={{
            width: '60%',
            height: 1,
            margin: '28px 0 8px',
            background: 'linear-gradient(to right, transparent, rgba(245,239,228,0.28), transparent)',
            transformOrigin: 'left center',
            transform: 'scaleX(0)',
            animation: 'disc-home-divider 700ms cubic-bezier(0.22,0.61,0.36,1) 1400ms forwards',
          }}
        />

        {/* Full aiOutput */}
        <div style={{ marginTop: 20, maxWidth: '34ch' }}>
          {sentences.map((s, i) => (
            <p
              key={i}
              style={{
                fontFamily: 'var(--font-fraunces), serif',
                fontSize: 'clamp(18px, 4.8vw, 21px)',
                lineHeight: 1.5,
                letterSpacing: '-0.005em',
                color: 'rgba(245,239,228,0.88)',
                margin: '0 0 10px',
                opacity: 0,
                animation: `disc-home-fade 900ms cubic-bezier(0.22,0.61,0.36,1) ${2000 + i * 300}ms forwards`,
              }}
            >
              {s}
            </p>
          ))}
        </div>

        {/* Dominant force · growth · growth edge */}
        <p
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 10,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'rgba(245,239,228,0.42)',
            margin: '22px 0 0',
            opacity: 0,
            animation: `disc-home-fade 700ms ease ${2000 + sentences.length * 300 + 200}ms forwards`,
          }}
        >
          {prettyForce(String(archetype.dominantForce))} · Growth · {archetype.growthEdge}
        </p>

        {/* Visual artifacts — the mandala (your cartography) + avatar (self in motion) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            margin: '36px 0 4px',
            opacity: 0,
            animation: `disc-home-fade 1100ms ease ${2000 + sentences.length * 300 + 400}ms forwards`,
          }}
        >
          <DimensionMandala scores={dimensionScores} size={300} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <DimensionAvatar
              scores={dimensionScores}
              initial={name ? name.trim().charAt(0).toUpperCase() : undefined}
              size={62}
            />
            <span
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                fontSize: 9,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: 'rgba(245,239,228,0.4)',
                maxWidth: 150,
                lineHeight: 1.6,
              }}
            >
              Your avatar — self in motion
            </span>
          </div>
        </div>

        {/* Dimensional bars */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            margin: '24px 0 0',
          }}
        >
          {DIMENSIONS_ORDER.map((d, i) => (
            <DimensionBar
              key={d}
              dim={d}
              score={dimensionScores[d] ?? 0}
              isDominant={d === dominantDimension}
              delayMs={2000 + sentences.length * 300 + 600 + i * 100}
            />
          ))}
        </div>

        {/* Closing note — drawn from canon */}
        <div
          style={{
            marginTop: 36,
            paddingTop: 28,
            borderTop: '1px solid rgba(245,239,228,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            opacity: 0,
            animation: `disc-home-fade 900ms ease ${2000 + sentences.length * 300 + 1300}ms forwards`,
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              fontSize: 9,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'rgba(245,239,228,0.4)',
              margin: 0,
            }}
          >
            When aligned
          </p>
          <p
            style={{
              fontFamily: 'var(--font-fraunces), serif',
              fontSize: 17,
              lineHeight: 1.55,
              color: 'rgba(245,239,228,0.82)',
              margin: 0,
            }}
          >
            {archetype.whenAligned}
          </p>

          <p
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              fontSize: 9,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'rgba(245,239,228,0.4)',
              margin: '14px 0 0',
            }}
          >
            Where to place attention
          </p>
          <p
            style={{
              fontFamily: 'var(--font-fraunces), serif',
              fontStyle: 'italic',
              fontSize: 17,
              lineHeight: 1.55,
              color: 'rgba(245,239,228,0.75)',
              margin: 0,
            }}
          >
            {archetype.practiceOrientation}
          </p>

          <p style={CANON_LABEL}>Your core tension</p>
          <p style={CANON_VALUE}>{archetype.coreTension}</p>

          <p style={CANON_LABEL}>Where the shadow shows up</p>
          <p style={CANON_VALUE}>
            <em style={{ color: 'rgba(245,239,228,0.9)', fontStyle: 'italic' }}>
              {archetype.shadowTrigger}.
            </em>{' '}
            {archetype.whenMisaligned}
          </p>

          <p style={CANON_LABEL}>The path back</p>
          <p style={CANON_VALUE}>{archetype.rebalancingPath}</p>
        </div>

        {/* Trial bridge — the seam from visitor to practitioner */}
        <div
          style={{
            margin: '36px 0 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            opacity: 0,
            animation: `disc-home-fade 800ms ease ${2000 + sentences.length * 300 + 2000}ms forwards`,
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-fraunces), serif',
              fontStyle: 'italic',
              fontSize: 14.5,
              lineHeight: 1.65,
              color: 'rgba(245,239,228,0.55)',
              margin: 0,
            }}
          >
            Your seven-day journey begins now. The practice is waiting —
            your mandala is already drawn.
          </p>
          <a
            href={trialHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              alignSelf: 'flex-start',
              background: 'var(--active)',
              color: '#0d0b07',
              padding: '14px 26px',
              fontFamily: 'var(--font-jetbrains), monospace',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              borderRadius: 999,
              textDecoration: 'none',
              boxShadow: '0 0 18px color-mix(in oklab, var(--active) 45%, transparent)',
              touchAction: 'manipulation',
            }}
          >
            Enter the practice →
          </a>
        </div>

        <div style={{ flex: 1, minHeight: 32 }} />

        {/* Aetherium signature */}
        <p
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 9,
            letterSpacing: '0.38em',
            textTransform: 'uppercase',
            color: 'rgba(245,239,228,0.22)',
            margin: 0,
            textAlign: 'center',
            opacity: 0,
            animation: `disc-home-fade 800ms ease ${2000 + sentences.length * 300 + 2400}ms forwards`,
          }}
        >
          Aetherium
        </p>
      </div>

      <ShojiCurtain phase={incoming} />

      <style>{`
        @keyframes disc-home-fade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes disc-home-name {
          from { opacity: 0; transform: scale(0.98) translateY(4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        @keyframes disc-home-divider {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </main>
  )
}

// ─── DimensionBar ────────────────────────────────────────────────────────────

function DimensionBar({
  dim, score, isDominant, delayMs,
}: {
  dim:        Dimension
  score:      number
  isDominant: boolean
  delayMs:    number
}) {
  const r = REALMS[dim]
  const clamped = Math.max(0, Math.min(100, score))

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: 0,
        animation: `disc-home-fade 700ms ease ${delayMs}ms forwards`,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-jetbrains), monospace',
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: r.color,
          opacity: isDominant ? 1 : 0.55,
          width: 56,
          flexShrink: 0,
        }}
      >
        {r.element}
      </span>
      <div
        style={{
          flex: 1,
          height: 2,
          background: 'rgba(245,239,228,0.06)',
          borderRadius: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${clamped}%`,
            background: `linear-gradient(to right, ${r.color}, color-mix(in oklab, ${r.color} 60%, transparent))`,
            boxShadow: isDominant ? `0 0 8px ${r.color}` : 'none',
            transform: 'scaleX(0)',
            transformOrigin: 'left center',
            animation: `disc-home-bar 800ms cubic-bezier(0.22,0.61,0.36,1) ${delayMs + 200}ms forwards`,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-jetbrains), monospace',
          fontSize: 10,
          color: 'rgba(245,239,228,0.45)',
          width: 28,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {clamped}
      </span>
      <style>{`
        @keyframes disc-home-bar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function splitSentences(text: string): string[] {
  const parts = text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(Boolean)
  return parts.length ? parts : [text]
}

function prettyForce(raw: string): string {
  return raw.replace(/\//g, ' / ')
}
