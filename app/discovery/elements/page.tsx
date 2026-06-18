'use client'

/**
 * /discovery/elements — the five-element teaching slip-through.
 *
 * Each card uses the kanji as the visual seal of the element — large,
 * centered, the anchor the eye lands on first. Meta-line (ELEMENT ·
 * DIMENSION · FUNCTION — as triplet; the kanji above replaces the inline
 * glyph) sits beneath as the label. Essence in italic Fraunces follows.
 * At the bottom, a realm row of the five kanji in their dimension colors
 * shows where you are in the sequence.
 */

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Atmosphere } from '../_components/Atmosphere'
import { Sun } from '../_components/Sun'
import { MetaLine } from '../_components/MetaLine'
import {
  ShojiCurtain,
  useIncomingShoji,
  useOutgoingShoji,
} from '../_components/ShojiCurtain'
import { REALMS, REALM_ORDER } from '../_lib/realms'

const PER_CARD_MS = 5500

export default function ElementsTeachingPage() {
  const router = useRouter()
  const incoming = useIncomingShoji()
  const { phase: outgoing, trigger: exit } = useOutgoingShoji(() => {
    router.push('/discovery/presencing')
  })

  const [idx, setIdx] = useState(0)

  const active = REALM_ORDER[idx]
  const realm  = REALMS[active]

  // Auto-advance unless the shoji is in motion
  useEffect(() => {
    if (outgoing !== 'idle') return
    const t = setTimeout(() => {
      if (idx < REALM_ORDER.length - 1) {
        setIdx(i => i + 1)
      } else {
        exit()
      }
    }, PER_CARD_MS)
    return () => clearTimeout(t)
  }, [idx, exit, outgoing])

  const handleTap = useCallback(() => {
    if (outgoing !== 'idle') return
    if (idx < REALM_ORDER.length - 1) {
      setIdx(i => i + 1)
    } else {
      exit()
    }
  }, [idx, exit, outgoing])

  const curtainPhase = outgoing !== 'idle' ? outgoing : incoming

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
        ['--active' as string]: realm.color,
        cursor: outgoing === 'idle' ? 'pointer' : 'default',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
      onClick={handleTap}
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
            {String(idx + 1).padStart(2, '0')} / 05
          </span>
        </header>

        <div style={{ flex: 1 }} />

        {/* Framing line — only on card 1 */}
        {idx === 0 && (
          <p
            style={{
              fontFamily:    'var(--font-jetbrains), monospace',
              fontSize:      11,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color:         'rgba(245,239,228,0.45)',
              marginBottom:  8,
              animation:     'disc-el-in 800ms ease forwards',
            }}
          >
            You are a configuration of five energies.
          </p>
        )}

        {/* Element card */}
        <div
          key={active}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            paddingBottom: 28,
            animation: 'disc-el-in 800ms cubic-bezier(0.22,0.61,0.36,1) forwards',
          }}
        >
          {/* Kanji as the symbolic seal of the element — the visual anchor */}
          <div
            style={{
              fontFamily: 'var(--font-noto-jp), serif',
              fontSize:   'clamp(116px, 32vw, 168px)',
              lineHeight: 1,
              color:      'var(--active)',
              textShadow: '0 0 28px color-mix(in oklab, var(--active) 40%, transparent), 0 0 64px color-mix(in oklab, var(--active) 22%, transparent)',
              letterSpacing: 'normal',
              marginBottom: 4,
            }}
          >
            {realm.kanji}
          </div>

          {/* Label triplet (no inline kanji — the kanji is above as the seal) */}
          <MetaLine dimension={active} variant="triplet" size="md" />

          {/* Essence — italic Fraunces from canon */}
          <p
            style={{
              fontWeight: 300,
              fontStyle: 'italic',
              fontSize: 'clamp(20px, 5.8vw, 24px)',
              lineHeight: 1.38,
              letterSpacing: '-0.005em',
              margin: 0,
              color: 'rgba(245,239,228,0.88)',
              maxWidth: '34ch',
            }}
          >
            {realm.essence}
          </p>

          {/* Realm row — five kanji in dimension colors, spatial map of the sequence */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              marginTop: 14,
            }}
          >
            {REALM_ORDER.map((d, i) => {
              const r = REALMS[d]
              const isCurrent = i === idx
              const isPast    = i <  idx
              const opacity = isCurrent ? 1 : isPast ? 0.5 : 0.2
              return (
                <span
                  key={d}
                  style={{
                    fontFamily: 'var(--font-noto-jp), serif',
                    fontSize: 18,
                    lineHeight: 1,
                    color: r.color,
                    opacity,
                    textShadow: isCurrent
                      ? `0 0 10px color-mix(in oklab, ${r.color} 60%, transparent)`
                      : 'none',
                    transition: 'opacity 0.5s, text-shadow 0.5s',
                  }}
                >
                  {r.kanji}
                </span>
              )
            })}
          </div>

          <p
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(245,239,228,0.3)',
              marginTop: 2,
            }}
          >
            Tap to continue
          </p>
        </div>
      </div>

      <ShojiCurtain phase={curtainPhase} />

      <style>{`
        @keyframes disc-el-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </main>
  )
}
