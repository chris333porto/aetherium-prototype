'use client'

/**
 * ShojiCurtain — threshold transition.
 *
 * All inner layers set `pointer-events: none` explicitly so the curtain's
 * intended intercept behavior (via the wrapper's `pointer-events: auto` while
 * closing/held/opening) remains authoritative across iOS Chrome.
 *
 * The wrapper keeps `pointer-events: auto` when the curtain is visible so
 * users can't tap through the paper mid-transition.
 */

import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'

export type ShojiPhase = 'idle' | 'closing' | 'held' | 'opening'

export const SHOJI_CLOSING_MS = 520
export const SHOJI_HELD_MS    = 220
export const SHOJI_OPENING_MS = 520
export const SHOJI_TOTAL_MS   = SHOJI_CLOSING_MS + SHOJI_HELD_MS + SHOJI_OPENING_MS

const LATTICE_BG = `
  repeating-linear-gradient(
    to right,
    rgba(245,239,228,0.055) 0,
    rgba(245,239,228,0.055) 1px,
    transparent 1px,
    transparent calc(100% / 5)
  ),
  linear-gradient(
    180deg,
    rgba(245,239,228,0.02) 0%,
    rgba(245,239,228,0) 35%,
    rgba(245,239,228,0) 65%,
    rgba(245,239,228,0.02) 100%
  ),
  #0f0b1a
`

export function ShojiCurtain({ phase }: { phase: ShojiPhase }) {
  const closed   = phase === 'closing' || phase === 'held'
  const leftTx   = closed ? 0    : -100
  const rightTx  = closed ? 0    :  100
  const duration =
    phase === 'closing' ? SHOJI_CLOSING_MS :
    phase === 'opening' ? SHOJI_OPENING_MS :
    0

  // When idle, the wrapper is display:none to fully remove the curtain from
  // any hit-test consideration. When active, it intercepts so users can't
  // tap through the paper.
  if (phase === 'idle') {
    // Render nothing — the curtain is off-screen AND out of the DOM.
    return null
  }

  const panelBase: CSSProperties = {
    position:   'fixed',
    top:        0,
    width:      '50vw',
    height:     '100dvh',
    background: LATTICE_BG,
    transition: `transform ${duration}ms cubic-bezier(0.22,0.61,0.36,1)`,
    willChange: 'transform',
    pointerEvents: 'none',
  }

  return (
    <div
      aria-hidden
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        100,
        pointerEvents: 'auto',
      }}
    >
      {/* Left panel */}
      <div
        style={{
          ...panelBase,
          left:        0,
          transform:   `translateX(${leftTx}%)`,
          borderRight: '1px solid rgba(245,239,228,0.14)',
          boxShadow:   closed ? '6px 0 32px rgba(0,0,0,0.55)' : 'none',
        }}
      />
      {/* Right panel */}
      <div
        style={{
          ...panelBase,
          right:      0,
          transform:  `translateX(${rightTx}%)`,
          borderLeft: '1px solid rgba(245,239,228,0.14)',
          boxShadow:  closed ? '-6px 0 32px rgba(0,0,0,0.55)' : 'none',
        }}
      />

      {/* Center seam glow — warm amber, fades with phase */}
      <div
        style={{
          position:   'fixed',
          left:       '50vw',
          top:        0,
          width:      3,
          height:     '100dvh',
          transform:  'translateX(-50%)',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(253,224,156,0.9) 25%, rgba(253,224,156,1) 50%, rgba(253,224,156,0.9) 75%, transparent 100%)',
          filter:     'blur(6px)',
          opacity:    closed ? 0.75 : 0,
          transition: `opacity ${duration}ms cubic-bezier(0.22,0.61,0.36,1)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position:   'fixed',
          left:       '50vw',
          top:        0,
          width:      10,
          height:     '100dvh',
          transform:  'translateX(-50%)',
          background: 'linear-gradient(to bottom, transparent 10%, rgba(253,224,156,0.35) 50%, transparent 90%)',
          filter:     'blur(14px)',
          opacity:    closed ? 0.8 : 0,
          transition: `opacity ${duration}ms cubic-bezier(0.22,0.61,0.36,1)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

/**
 * Incoming: start closed (panels cover the page on arrival), open after mount.
 */
export function useIncomingShoji(): ShojiPhase {
  const [phase, setPhase] = useState<ShojiPhase>('held')
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('opening'), 80)
    const t2 = setTimeout(() => setPhase('idle'),    80 + SHOJI_OPENING_MS)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])
  return phase
}

/**
 * Outgoing: trigger closing; onReady fires at the start of 'held' so the
 * next page has the full hold window to mount under the curtain.
 */
export function useOutgoingShoji(onReady: () => void): {
  phase:   ShojiPhase
  trigger: () => void
} {
  const [phase, setPhase] = useState<ShojiPhase>('idle')

  function trigger() {
    if (phase !== 'idle') return
    setPhase('closing')
    setTimeout(() => {
      setPhase('held')
      onReady()
    }, SHOJI_CLOSING_MS)
  }

  return { phase, trigger }
}
