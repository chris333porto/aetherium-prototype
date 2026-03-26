'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const [email, setEmail]     = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [sentTo, setSentTo]   = useState('')
  const [googleBusy, setGoogleBusy] = useState(false)
  const [error, setError]     = useState('')

  async function handleGoogle() {
    setError('')
    setGoogleBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/onboarding/welcome',
        scopes: 'email profile',
      },
    })
    if (error) {
      setError(error.message)
      setGoogleBusy(false)
    }
  }

  async function handleMagic() {
    const trimmed = email.trim()
    if (!trimmed) return
    setError('')
    setSending(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: window.location.origin + '/onboarding/welcome',
        shouldCreateUser: true,
      },
    })
    setSending(false)
    if (error) {
      setError(error.message)
      return
    }
    setSentTo(trimmed)
    setSent(true)
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#06060d' }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(149,144,236,0.07), transparent 60%)',
        }}
      />

      <div className="relative z-10 w-full" style={{ maxWidth: 400 }}>
        {/* Back */}
        <Link
          href="/"
          className="block mb-10"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(234,232,242,0.28)',
            textDecoration: 'none',
          }}
        >
          ← Aetherium
        </Link>

        {/* Card */}
        <div
          style={{
            background: 'rgba(13,13,24,1)',
            border: '1px solid rgba(149,144,236,0.2)',
            borderRadius: 20,
            padding: '2.5rem',
            position: 'relative',
          }}
        >
          {/* Top shimmer */}
          <div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg,transparent,rgba(149,144,236,0.3),transparent)',
              borderRadius: '20px 20px 0 0',
            }}
          />

          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 15,
              letterSpacing: '0.1em',
              color: 'rgba(234,232,242,0.82)',
              marginBottom: '0.4rem',
            }}
          >
            Welcome to Aetherium
          </div>
          <div
            style={{
              fontSize: 14,
              fontStyle: 'italic',
              color: 'rgba(234,232,242,0.35)',
              marginBottom: '2rem',
              fontFamily: "'Cormorant Garamond', serif",
            }}
          >
            Sign in to begin your journey.
          </div>

          {!sent ? (
            <>
              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={googleBusy}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 11,
                  padding: '14px 18px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.13)',
                  background: 'rgba(255,255,255,0.07)',
                  color: 'rgba(234,232,242,0.82)',
                  fontFamily: "'Cinzel', serif",
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  cursor: googleBusy ? 'not-allowed' : 'pointer',
                  opacity: googleBusy ? 0.45 : 1,
                  transition: 'all .3s ease',
                  marginBottom: 0,
                }}
              >
                <GoogleIcon />
                {googleBusy ? 'Redirecting to Google…' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  margin: '1.2rem 0',
                }}
              >
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                <span
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 8,
                    letterSpacing: '0.18em',
                    color: 'rgba(234,232,242,0.18)',
                  }}
                >
                  or
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              </div>

              {/* Magic link */}
              <input
                type="email"
                placeholder="Your email address"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMagic()}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: '13px 14px',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 16,
                  fontStyle: 'italic',
                  color: 'rgba(234,232,242,0.75)',
                  marginBottom: 10,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleMagic}
                disabled={sending}
                style={{
                  width: '100%',
                  padding: 14,
                  borderRadius: 28,
                  border: '1px solid rgba(149,144,236,0.35)',
                  background: 'rgba(83,74,183,0.14)',
                  color: '#9590ec',
                  fontFamily: "'Cinzel', serif",
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.6 : 1,
                  transition: 'all .3s',
                  marginTop: 4,
                }}
              >
                {sending ? 'Sending…' : 'Send magic link'}
              </button>
              <p
                style={{
                  fontSize: 12,
                  fontStyle: 'italic',
                  color: 'rgba(234,232,242,0.22)',
                  textAlign: 'center',
                  marginTop: '0.7rem',
                  lineHeight: 1.6,
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                We&apos;ll email you a sign-in link — no password needed.
              </p>

              {error && (
                <p
                  style={{
                    marginTop: '1rem',
                    fontSize: 13,
                    fontStyle: 'italic',
                    color: '#e05a3a',
                    textAlign: 'center',
                    fontFamily: "'Cormorant Garamond', serif",
                  }}
                >
                  {error}
                </p>
              )}
            </>
          ) : (
            /* Sent state */
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div style={{ fontSize: 32, marginBottom: '1rem', opacity: 0.65 }}>✉️</div>
              <p
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  color: 'rgba(234,232,242,0.72)',
                  marginBottom: '0.5rem',
                }}
              >
                Check your inbox
              </p>
              <p
                style={{
                  fontSize: 14,
                  fontStyle: 'italic',
                  color: 'rgba(234,232,242,0.35)',
                  lineHeight: 1.7,
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                Magic link sent to<br />
                <span style={{ color: 'rgba(149,144,236,0.65)' }}>{sentTo}</span>
              </p>
            </div>
          )}
        </div>

        {/* Continue without account */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link
            href="/onboarding/welcome"
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 9,
              letterSpacing: '0.14em',
              color: 'rgba(234,232,242,0.22)',
              textDecoration: 'none',
            }}
          >
            Continue without an account
          </Link>
        </div>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
