'use client'

/**
 * /discovery/presencing — 12-second breathing moment.
 *
 * Sun at the unified position with a countdown ring drawing around it. Cue
 * copy cycles (Arrive → Settle → Breathe). At completion, outgoing shoji
 * closes and the assessment route takes over. Skip is available as a subtle
 * mono link — also fires the shoji so the transition into inquiry still
 * feels like a threshold, not an escape.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Atmosphere } from '../_components/Atmosphere'
import { Sun } from '../_components/Sun'
import {
  ShojiCurtain,
  useIncomingShoji,
  useOutgoingShoji,
  SHOJI_TOTAL_MS,
} from '../_components/ShojiCurtain'

const DURATION_SECONDS = 12

export default function PresencingPage() {
  const router = useRouter()
  const incoming = useIncomingShoji()
  const { phase: outgoing, trigger: exit } = useOutgoingShoji(() => {
    router.push('/discovery/assessment')
  })

  const [cue, setCue] = useState<'arrive' | 'settle' | 'breathe'>('arrive')

  useEffect(() => {
    const t1 = setTimeout(() => setCue('settle'),  2800)
    const t2 = setTimeout(() => setCue('breathe'), 7200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useEffect(() => {
    const t = setTimeout(
      () => exit(),
      DURATION_SECONDS * 1000 - SHOJI_TOTAL_MS / 2,
    )
    return () => clearTimeout(t)
  }, [exit])

  const line = CUES[cue]
  const curtainPhase = outgoing !== 'idle' ? outgoing : incoming

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
      <Sun countdown={DURATION_SECONDS} />

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
          textAlign: 'center',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
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
            Presencing
          </span>
        </header>

        <div style={{ flex: 1 }} />

        <div
          key={cue}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingBottom: 60,
            animation: 'disc-cue-in 1s ease forwards',
          }}
        >
          <p
            style={{
              fontWeight: 300,
              fontStyle: 'italic',
              fontSize: 'clamp(22px, 6.5vw, 30px)',
              lineHeight: 1.28,
              letterSpacing: '-0.01em',
              color: 'rgba(245,239,228,0.88)',
              margin: 0,
            }}
          >
            {line.primary}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              fontSize: 11,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'rgba(245,239,228,0.42)',
              margin: 0,
            }}
          >
            {line.secondary}
          </p>
        </div>

        <button
          onClick={() => exit()}
          disabled={outgoing !== 'idle'}
          style={{
            alignSelf: 'center',
            background: 'transparent',
            border: 'none',
            color: 'rgba(245,239,228,0.3)',
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            padding: 10,
            cursor: outgoing === 'idle' ? 'pointer' : 'default',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            position: 'relative',
            zIndex: 20,
          }}
        >
          Skip
        </button>
      </div>

      <ShojiCurtain phase={curtainPhase} />

      <style>{`
        @keyframes disc-cue-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </main>
  )
}

const CUES = {
  arrive:  { primary: 'Arrive.',  secondary: 'You are here.' },
  settle:  { primary: 'Settle.',  secondary: 'Nothing to do yet.' },
  breathe: { primary: 'Breathe.', secondary: 'One long. One longer.' },
}
