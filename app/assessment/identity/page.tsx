'use client'

import { useState, useEffect }  from 'react'
import { useRouter }             from 'next/navigation'
import Link                      from 'next/link'
import { Button }                from '@/components/ui/Button'
import { PreviewNav }            from '@/components/dev/PreviewNav'
import { PREVIEW_IDENTITY }      from '@/lib/dev/previewMock'

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width:        '100%',
  background:   'rgba(234,232,242,0.025)',
  border:       '1px solid rgba(234,232,242,0.08)',
  borderRadius: 2,
  padding:      '11px 14px',
  color:        'rgba(234,232,242,0.78)',
  fontSize:     15,
  fontFamily:   "'Cormorant Garamond', serif",
  lineHeight:   1.5,
  outline:      'none',
  transition:   'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
  fontFamily:    "'Cinzel', serif",
  fontSize:      8,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color:         'rgba(149,144,236,0.48)',
}

// ─── FieldGroup ───────────────────────────────────────────────────────────────

function FieldGroup({
  label,
  children,
}: {
  label:    string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={inputStyle}
      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(149,144,236,0.32)' }}
      onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(234,232,242,0.08)' }}
    />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IdentityPage() {
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [email,     setEmail]     = useState('')

  // Restore previous values on back-navigation
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ae_identity')
      if (stored) {
        const parsed = JSON.parse(stored) as { firstName?: string; email?: string }
        if (parsed.firstName) setFirstName(parsed.firstName)
        if (parsed.email)     setEmail(parsed.email)
      }
    } catch { /* ignore */ }
  }, [])

  // DEV: pre-fill fields when ?preview=1 is active
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('preview') !== '1') return
    setFirstName(PREVIEW_IDENTITY.firstName)
    setEmail(PREVIEW_IDENTITY.email)
  }, [])

  function handleContinue() {
    localStorage.setItem('ae_identity', JSON.stringify({
      firstName: firstName.trim(),
      email:     email.trim(),
    }))
    router.push('/assessment/context')
  }

  const canContinue = firstName.trim().length > 0 && email.trim().length > 0

  return (
    <main className="page-atmosphere flex flex-col" style={{ minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.4rem 2.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <Link
          href="/results-preview"
          style={{
            fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.32em',
            textTransform: 'uppercase', color: 'rgba(234,232,242,0.28)',
            textDecoration: 'none', transition: 'color 0.2s',
          }}
        >
          ← Back
        </Link>
        <span style={{
          fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.32em',
          textTransform: 'uppercase', color: 'rgba(234,232,242,0.18)',
        }}>
          Almost There
        </span>
      </nav>

      {/* Content */}
      <div style={{
        flex: 1,
        maxWidth: 520, margin: '0 auto', padding: '4rem 2.5rem 4rem',
        width: '100%', position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>

        <p style={{
          fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.5em',
          textTransform: 'uppercase', color: 'rgba(149,144,236,0.45)',
          marginBottom: '1.6rem',
        }}>
          Your Profile
        </p>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(28px, 3.8vw, 42px)', fontWeight: 300,
          color: '#eae8f2', letterSpacing: '-0.015em',
          lineHeight: 1.12, marginBottom: '1rem',
        }}>
          Create your profile to unlock your full system.
        </h1>

        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(14px, 1.5vw, 17px)', fontStyle: 'italic',
          color: 'rgba(234,232,242,0.5)', lineHeight: 1.78,
          maxWidth: 420, marginBottom: '2.5rem',
        }}>
          Takes 30 seconds. Your data is never shared or sold.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>

          {/* First name */}
          <FieldGroup label="First Name">
            <Input
              type="text"
              placeholder="Your first name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </FieldGroup>

          {/* Email */}
          <FieldGroup label="Email">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </FieldGroup>

        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <Button size="lg" onClick={handleContinue} disabled={!canContinue}>
            Unlock My Profile →
          </Button>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 12, color: 'rgba(234,232,242,0.2)',
            fontStyle: 'italic', textAlign: 'center', marginTop: '0.25rem',
          }}>
            Your assessment results are saved to your profile.
          </p>
        </div>

      </div>

      <PreviewNav />
    </main>
  )
}
