'use client'

/**
 * PreviewNav — DEV ONLY floating navigator.
 *
 * Renders a fixed bottom-right control bar when `?preview=1` is present in the
 * URL. Lets you jump to any step in the onboarding flow without retaking the
 * assessment. Safe to include in any page: it renders nothing in production.
 *
 * Removal: delete this file and remove <PreviewNav /> from each page.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Step map ─────────────────────────────────────────────────────────────────

interface PreviewStep {
  label: string
  url: string
  /** For matching: pathname + optional step param */
  pathname: string
  step?: string
}

const STEPS: PreviewStep[] = [
  { label: 'Welcome',       url: '/onboarding/welcome?preview=1',      pathname: '/onboarding/welcome'    },
  { label: 'Identity',      url: '/assessment/identity?preview=1',     pathname: '/assessment/identity'   },
  { label: '1 · Aether',    url: '/assessment?preview=1&step=0',       pathname: '/assessment', step: '0' },
  { label: '2 · Fire',      url: '/assessment?preview=1&step=1',       pathname: '/assessment', step: '1' },
  { label: '3 · Air',       url: '/assessment?preview=1&step=2',       pathname: '/assessment', step: '2' },
  { label: '4 · Water',     url: '/assessment?preview=1&step=3',       pathname: '/assessment', step: '3' },
  { label: '5 · Earth',     url: '/assessment?preview=1&step=4',       pathname: '/assessment', step: '4' },
  { label: 'Results',       url: '/results?preview=1',                 pathname: '/results'               },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectCurrentIndex(): number {
  const params = new URLSearchParams(window.location.search)
  const step   = params.get('step')
  const path   = window.location.pathname

  return STEPS.findIndex(s => {
    if (s.pathname !== path) return false
    if (s.step !== undefined) return s.step === step
    // For pages without a step param, match only when no step is present
    return step === null || step === ''
  })
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const shell: React.CSSProperties = {
  position:       'fixed',
  bottom:         20,
  right:          20,
  zIndex:         9999,
  display:        'flex',
  alignItems:     'center',
  gap:            10,
  padding:        '9px 13px',
  background:     'rgba(8,8,14,0.92)',
  border:         '1px solid rgba(149,144,236,0.28)',
  borderRadius:   6,
  backdropFilter: 'blur(14px)',
  boxShadow:      '0 4px 28px rgba(0,0,0,0.5)',
  userSelect:     'none',
}

const label: React.CSSProperties = {
  fontFamily:    "'Cinzel', serif",
  fontSize:      8,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color:         'rgba(149,144,236,0.55)',
  minWidth:      82,
  lineHeight:    1.4,
}

const sep: React.CSSProperties = {
  width:      1,
  height:     14,
  background: 'rgba(234,232,242,0.08)',
  flexShrink: 0,
}

function navBtn(disabled: boolean): React.CSSProperties {
  return {
    display:       'flex',
    alignItems:    'center',
    justifyContent:'center',
    width:         26,
    height:        26,
    fontFamily:    'monospace',
    fontSize:      13,
    color:         disabled ? 'rgba(234,232,242,0.18)' : 'rgba(234,232,242,0.65)',
    background:    'transparent',
    border:        '1px solid rgba(234,232,242,0.08)',
    borderRadius:  3,
    cursor:        disabled ? 'not-allowed' : 'pointer',
    transition:    'all 0.15s',
  }
}

function jumpBtn(color: string): React.CSSProperties {
  return {
    fontFamily:    "'Cinzel', serif",
    fontSize:      7,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color:         color,
    background:    'transparent',
    border:        `1px solid ${color.replace('0.75', '0.2').replace('0.8', '0.2')}`,
    borderRadius:  3,
    padding:       '3px 8px',
    cursor:        'pointer',
    lineHeight:    1.4,
    transition:    'all 0.15s',
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PreviewNav() {
  const router = useRouter()
  const [isPreview, setIsPreview] = useState(false)
  const [idx, setIdx]             = useState(-1)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('preview') !== '1') return
    setIsPreview(true)
    setIdx(detectCurrentIndex())
  }, [])

  if (!isPreview) return null

  const hasPrev   = idx > 0
  const hasNext   = idx < STEPS.length - 1
  const stepLabel = idx >= 0 ? STEPS[idx].label : '—'

  return (
    <div style={shell} title="DEV preview navigator — remove <PreviewNav /> to hide">
      {/* Step label */}
      <span style={label}>
        DEV&nbsp;&nbsp;{idx >= 0 ? `${idx + 1}/${STEPS.length}` : '?'}<br />
        {stepLabel}
      </span>

      <div style={sep} />

      {/* Prev / Next */}
      <div style={{ display: 'flex', gap: 5 }}>
        <button
          style={navBtn(!hasPrev)}
          disabled={!hasPrev}
          onClick={() => hasPrev && router.push(STEPS[idx - 1].url)}
          title="Previous step"
        >
          ←
        </button>
        <button
          style={navBtn(!hasNext)}
          disabled={!hasNext}
          onClick={() => hasNext && router.push(STEPS[idx + 1].url)}
          title="Next step"
        >
          →
        </button>
      </div>

      <div style={sep} />

      {/* Jump to results */}
      <button
        style={jumpBtn('rgba(45,184,133,0.75)')}
        onClick={() => router.push('/results?preview=1')}
        title="Jump to Results page"
      >
        Results
      </button>

      {/* Jump to welcome */}
      <button
        style={jumpBtn('rgba(234,232,242,0.35)')}
        onClick={() => router.push('/onboarding/welcome?preview=1')}
        title="Jump to Welcome"
      >
        ↩ Start
      </button>
    </div>
  )
}
