'use client'

import { useState, useEffect }  from 'react'
import { useRouter }             from 'next/navigation'
import Link                      from 'next/link'
import { Button }                from '@/components/ui/Button'
import { PreviewNav }            from '@/components/dev/PreviewNav'
import { PREVIEW_IDENTITY }      from '@/lib/dev/previewMock'

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width:      '100%',
  background: 'rgba(234,232,242,0.025)',
  border:     '1px solid rgba(234,232,242,0.08)',
  borderRadius: 2,
  padding:    '11px 14px',
  color:      'rgba(234,232,242,0.78)',
  fontSize:   15,
  fontFamily: "'Cormorant Garamond', serif",
  lineHeight: 1.5,
  outline:    'none',
  transition: 'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
  fontFamily:    "'Cinzel', serif",
  fontSize:      8,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color:         'rgba(149,144,236,0.48)',
}

const optionalTag: React.CSSProperties = {
  color: 'rgba(234,232,242,0.2)',
}

// ─── FieldGroup ───────────────────────────────────────────────────────────────

function FieldGroup({
  label,
  optional,
  children,
}: {
  label: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={labelStyle}>
        {label}{optional && <span style={optionalTag}> (optional)</span>}
      </label>
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
  const [lastName,  setLastName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [city,      setCity]      = useState('')
  const [region,    setRegion]    = useState('')
  const [country,   setCountry]   = useState('')

  // DEV: pre-fill fields when ?preview=1 is active
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('preview') !== '1') return
    setFirstName(PREVIEW_IDENTITY.firstName)
    setLastName(PREVIEW_IDENTITY.lastName)
    setEmail(PREVIEW_IDENTITY.email)
    setBirthDate(PREVIEW_IDENTITY.birthDate)
    setCity(PREVIEW_IDENTITY.location?.city ?? '')
    setRegion(PREVIEW_IDENTITY.location?.region ?? '')
    setCountry(PREVIEW_IDENTITY.location?.country ?? '')
  }, [])

  function handleContinue() {
    // Auto-detect timezone (browser API, non-blocking)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    localStorage.setItem('ae_identity', JSON.stringify({
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      email:     email.trim(),
      birthDate: birthDate.trim(),
      location: {
        city:     city.trim()    || undefined,
        region:   region.trim()  || undefined,
        country:  country.trim() || undefined,
        timezone: timezone       || undefined,
      },
    }))

    router.push('/assessment')
  }

  const canContinue = firstName.trim() && lastName.trim() && email.trim() && birthDate.trim()

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
          href="/onboarding/welcome"
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
          Step 0 of 6
        </span>
      </nav>

      {/* Content */}
      <div style={{
        flex: 1,
        maxWidth: 620, margin: '0 auto', padding: '3.5rem 2.5rem 4rem',
        width: '100%', position: 'relative', zIndex: 10,
      }}>

        <p style={{
          fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.5em',
          textTransform: 'uppercase', color: 'rgba(149,144,236,0.45)',
          marginBottom: '1.6rem',
        }}>
          Enter the Field
        </p>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(28px, 3.8vw, 42px)', fontWeight: 300,
          color: '#eae8f2', letterSpacing: '-0.015em',
          lineHeight: 1.12, marginBottom: '1rem',
        }}>
          This begins with who you are.
        </h1>

        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(14px, 1.5vw, 17px)', fontStyle: 'italic',
          color: 'rgba(234,232,242,0.5)', lineHeight: 1.78,
          maxWidth: 460, marginBottom: '2.5rem',
        }}>
          Used only to personalise your profile. Never shared.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', marginBottom: '2.5rem' }}>

          {/* Name row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FieldGroup label="First Name">
              <Input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Last Name">
              <Input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </FieldGroup>
          </div>

          {/* Email */}
          <FieldGroup label="Email">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </FieldGroup>

          {/* Birth date */}
          <FieldGroup label="Date of Birth">
            <Input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }}
            />
          </FieldGroup>

          {/* Location */}
          <div>
            <label style={{ ...labelStyle, display: 'block', marginBottom: '0.6rem' }}>
              Location <span style={optionalTag}>(optional)</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <Input
                type="text"
                placeholder="City"
                value={city}
                onChange={e => setCity(e.target.value)}
              />
              <Input
                type="text"
                placeholder="State / Region"
                value={region}
                onChange={e => setRegion(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Country"
                value={country}
                onChange={e => setCountry(e.target.value)}
              />
            </div>
          </div>

        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button size="lg" onClick={handleContinue} disabled={!canContinue}>
            Begin Assessment →
          </Button>
          <Link href="/onboarding/welcome">
            <Button variant="ghost" size="lg">← Go Back</Button>
          </Link>
        </div>

      </div>

      <PreviewNav />
    </main>
  )
}
