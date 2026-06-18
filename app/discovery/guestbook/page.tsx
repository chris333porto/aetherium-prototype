'use client'

/**
 * /discovery/guestbook — name + email capture.
 *
 * The gate between the initial reveal and the full results. Name first
 * (optional, mirrors how a real guestbook works), email second. On submit,
 * we fire-and-forget the DB write and move on to welcome-home regardless
 * of persistence success — the user should never be blocked by infra.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Atmosphere } from '../_components/Atmosphere'
import { Sun } from '../_components/Sun'
import { ShojiCurtain, useIncomingShoji, useOutgoingShoji } from '../_components/ShojiCurtain'
import { signGuestbook } from '../_lib/persistence'
import { ARCHETYPE_ID_KEY, NAME_KEY, EMAIL_KEY } from '../_lib/computedResult'

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function DiscoveryGuestbookPage() {
  const router = useRouter()
  const incoming = useIncomingShoji()
  const { phase: outgoing, trigger: exit } = useOutgoingShoji(() => {
    router.push('/discovery/welcome-home')
  })

  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const curtainPhase = outgoing !== 'idle' ? outgoing : incoming
  const valid = EMAIL_RX.test(email.trim())

  function handleSubmit() {
    if (!valid || submitting || outgoing !== 'idle') return
    setError(null)
    setSubmitting(true)

    const archetypeId = typeof window !== 'undefined'
      ? localStorage.getItem(ARCHETYPE_ID_KEY) ?? undefined
      : undefined

    // Cache locally so welcome-home can personalize
    try {
      if (name.trim()) localStorage.setItem(NAME_KEY, name.trim())
      else             localStorage.removeItem(NAME_KEY)
      localStorage.setItem(EMAIL_KEY, email.trim())
    } catch { /* ignore */ }

    signGuestbook({
      name:  name.trim() || undefined,
      email: email.trim(),
      archetypeId,
    }).then((res) => {
      if (!res.ok) {
        console.warn('[discovery] guestbook write failed (non-blocking):', res.error)
      }
    })

    exit()
  }

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
            Guestbook
          </span>
        </header>

        {/* Sun-clearance spacer — same pattern as reveal so header copy sits clean */}
        <div style={{ minHeight: 'clamp(180px, 26vh, 240px)' }} />

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
            marginBottom: 22,
          }}
        >
          <span style={{ width: 28, height: 1, background: 'rgba(245,239,228,0.35)' }} />
          Mark your arrival
        </div>

        <h1
          style={{
            fontWeight: 300,
            fontSize: 'clamp(34px, 9vw, 46px)',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            margin: 0,
            marginBottom: 18,
          }}
        >
          Sign the{' '}
          <em
            style={{
              color: 'var(--active)',
              fontStyle: 'italic',
              fontWeight: 300,
            }}
          >
            guestbook
          </em>
          .
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-fraunces), serif',
            fontSize: 15.5,
            fontStyle: 'italic',
            lineHeight: 1.65,
            color: 'rgba(245,239,228,0.6)',
            maxWidth: '32ch',
            margin: 0,
            marginBottom: 28,
          }}
        >
          Leave your name and email and your place is held. No account.
          No list. Just a way back in when the next door opens.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {/* Name field (optional) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              htmlFor="disc-name"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                fontSize: 9,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'rgba(245,239,228,0.4)',
              }}
            >
              What we should call you
            </label>
            <input
              id="disc-name"
              type="text"
              autoComplete="given-name"
              autoCapitalize="words"
              spellCheck={false}
              placeholder="your name, or what to call you…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting || outgoing !== 'idle'}
              style={{
                width: '100%',
                background: 'rgba(245,239,228,0.04)',
                border: '1px solid rgba(245,239,228,0.15)',
                borderRadius: 8,
                padding: '14px 16px',
                color: '#f5efe4',
                fontFamily: 'var(--font-fraunces), serif',
                fontSize: 18,
                outline: 'none',
                transition: 'border-color 0.25s',
                touchAction: 'manipulation',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--active)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(245,239,228,0.15)' }}
            />
          </div>

          {/* Email field (required) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              htmlFor="disc-email"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                fontSize: 9,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'rgba(245,239,228,0.4)',
              }}
            >
              Where to send your full results
            </label>
            <input
              id="disc-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="you@somewhere"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(null) }}
              disabled={submitting || outgoing !== 'idle'}
              style={{
                width: '100%',
                background: 'rgba(245,239,228,0.04)',
                border: '1px solid rgba(245,239,228,0.15)',
                borderRadius: 8,
                padding: '14px 16px',
                color: '#f5efe4',
                fontFamily: 'var(--font-fraunces), serif',
                fontSize: 18,
                outline: 'none',
                transition: 'border-color 0.25s',
                touchAction: 'manipulation',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--active)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(245,239,228,0.15)' }}
            />
          </div>

          {error && (
            <p
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                fontSize: 10,
                letterSpacing: '0.12em',
                color: '#e0a76a',
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 20,
              borderTop: '1px solid rgba(245,239,228,0.1)',
              marginTop: 10,
            }}
          >
            <button
              type="submit"
              onTouchEnd={(e) => { e.preventDefault(); handleSubmit() }}
              disabled={!valid || submitting || outgoing !== 'idle'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                background: valid ? '#f5efe4' : 'rgba(245,239,228,0.16)',
                color: valid ? '#0f0b1a' : 'rgba(15,11,26,0.55)',
                border: 'none',
                padding: '14px 24px',
                fontFamily: 'var(--font-jetbrains), monospace',
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: valid && !submitting ? 'pointer' : 'default',
                borderRadius: 999,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                minHeight: 44,
                transition: 'background 0.25s, color 0.25s',
              }}
            >
              {submitting ? 'Signing…' : 'Sign'}
              <span style={{ width: 14, height: 1, background: 'currentColor', position: 'relative', opacity: valid ? 1 : 0.5 }}>
                <span
                  style={{
                    position: 'absolute', right: -1, top: -3,
                    width: 7, height: 7,
                    borderTop: '1px solid currentColor', borderRight: '1px solid currentColor',
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
              We&apos;ll write<br />only when it matters
            </span>
          </div>
        </form>
      </div>

      <ShojiCurtain phase={curtainPhase} />
    </main>
  )
}
