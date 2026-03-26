'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { PreviewNav } from '@/components/dev/PreviewNav'
import { PREVIEW_IDENTITY, PREVIEW_REFLECTIONS } from '@/lib/dev/previewMock'

// Minimal Web Speech API typings
interface AeSpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: AeSpeechRecognitionEvent) => void) | null
  onend:    (() => void) | null
  onerror:  (() => void) | null
}
interface AeSpeechRecognitionEvent extends Event {
  results: { length: number; [i: number]: { [i: number]: { transcript: string } } }
}
type AeSpeechRecognitionConstructor = new () => AeSpeechRecognition

const REFLECTION_FIELDS = [
  {
    id: 'life_phase',
    label: 'Current Life Phase',
    placeholder: 'What season of life are you in right now? (e.g. early career, rebuilding, transition, building something new…)',
    rows: 3,
  },
  {
    id: 'recent_challenges',
    label: 'Recent Challenges',
    placeholder: 'What has been pulling at you lately? What isn\'t working, or feels unresolved?',
    rows: 4,
  },
  {
    id: 'desired_direction',
    label: 'Desired Direction',
    placeholder: 'If you could change one thing about how you\'re living or showing up — what would it be?',
    rows: 4,
  },
]

function MicButton({
  onTranscript,
  fieldId,
}: {
  onTranscript: (id: string, text: string) => void
  fieldId: string
}) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<AeSpeechRecognition | null>(null)

  const toggle = useCallback(() => {
    if (typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI: AeSpeechRecognitionConstructor | undefined =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition

    if (!SpeechRecognitionAPI) return

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event: AeSpeechRecognitionEvent) => {
      const transcript = Array.from(
        { length: event.results.length },
        (_, i) => event.results[i][0].transcript
      ).join(' ')
      onTranscript(fieldId, transcript)
    }

    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [listening, fieldId, onTranscript])

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? 'Stop recording' : 'Speak your answer'}
      style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, borderRadius: '50%',
        background: listening ? 'rgba(149,144,236,0.14)' : 'rgba(234,232,242,0.04)',
        border: listening ? '1px solid rgba(149,144,236,0.48)' : '1px solid rgba(234,232,242,0.08)',
        boxShadow: listening ? '0 0 10px rgba(149,144,236,0.25)' : 'none',
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      <svg width="11" height="13" viewBox="0 0 12 14" fill="none" style={{ opacity: listening ? 1 : 0.3 }}>
        <rect x="3.5" y="0.5" width="5" height="8" rx="2.5"
          stroke={listening ? '#9590ec' : 'rgba(234,232,242,0.8)'} strokeWidth="1"
          fill={listening ? 'rgba(149,144,236,0.18)' : 'none'} />
        <path d="M1 7.5C1 10.2614 3.23858 12.5 6 12.5C8.76142 12.5 11 10.2614 11 7.5"
          stroke={listening ? '#9590ec' : 'rgba(234,232,242,0.8)'} strokeWidth="1" strokeLinecap="round" />
        <line x1="6" y1="12.5" x2="6" y2="13.5"
          stroke={listening ? '#9590ec' : 'rgba(234,232,242,0.8)'} strokeWidth="1" strokeLinecap="round" />
      </svg>
    </button>
  )
}

export default function IdentityPage() {
  const router = useRouter()
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [reflections, setReflections] = useState<Record<string, string>>({
    life_phase: '',
    recent_challenges: '',
    desired_direction: '',
  })

  // DEV: pre-fill fields when ?preview=1 is active
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('preview') !== '1') return
    setName(PREVIEW_IDENTITY.name)
    setEmail(PREVIEW_IDENTITY.email)
    setReflections(PREVIEW_REFLECTIONS)
  }, [])

  function handleReflectionChange(id: string, val: string) {
    setReflections(prev => ({ ...prev, [id]: val }))
  }

  function handleTranscript(id: string, text: string) {
    setReflections(prev => ({
      ...prev,
      [id]: prev[id] ? `${prev[id]} ${text}` : text,
    }))
  }

  function handleContinue() {
    localStorage.setItem('ae_identity', JSON.stringify({ name, email }))
    localStorage.setItem('ae_narrative_answers', JSON.stringify(reflections))
    router.push('/assessment')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(234,232,242,0.025)',
    border: '1px solid rgba(234,232,242,0.08)',
    borderRadius: 2,
    padding: '11px 14px',
    color: 'rgba(234,232,242,0.78)',
    fontSize: 15,
    fontFamily: "'Cormorant Garamond', serif",
    lineHeight: 1.5,
    outline: 'none',
    transition: 'border-color 0.2s',
  }

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

        {/* Eyebrow */}
        <p style={{
          fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.5em',
          textTransform: 'uppercase', color: 'rgba(149,144,236,0.45)',
          marginBottom: '1.6rem',
        }}>
          Enter the Field
        </p>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(28px, 3.8vw, 42px)',
          fontWeight: 300,
          color: '#eae8f2',
          letterSpacing: '-0.015em',
          lineHeight: 1.12,
          marginBottom: '1rem',
        }}>
          Let&apos;s begin with your lived reality.
        </h1>

        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(14px, 1.5vw, 17px)',
          fontStyle: 'italic',
          color: 'rgba(234,232,242,0.5)',
          lineHeight: 1.78,
          maxWidth: 460,
          marginBottom: '2.5rem',
        }}>
          The more honestly you answer, the more precisely your profile will reflect you.
          There are no correct responses — only true ones.
        </p>

        {/* Name + Email */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{
              fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.28em',
              textTransform: 'uppercase', color: 'rgba(149,144,236,0.48)',
            }}>
              Your Name
            </label>
            <input
              type="text"
              placeholder="How you think of yourself"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(149,144,236,0.32)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(234,232,242,0.08)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{
              fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.28em',
              textTransform: 'uppercase', color: 'rgba(149,144,236,0.48)',
            }}>
              Email <span style={{ color: 'rgba(234,232,242,0.2)' }}>(optional)</span>
            </label>
            <input
              type="email"
              placeholder="To save your profile"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(149,144,236,0.32)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(234,232,242,0.08)' }}
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: 1, marginBottom: '2rem',
          background: 'linear-gradient(to right, rgba(149,144,236,0.15), transparent)',
        }} />

        {/* Reflection fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem', marginBottom: '2rem' }}>
          {REFLECTION_FIELDS.map(field => (
            <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{
                  fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.28em',
                  textTransform: 'uppercase', color: 'rgba(149,144,236,0.5)',
                }}>
                  {field.label}
                </label>
                <MicButton fieldId={field.id} onTranscript={handleTranscript} />
              </div>
              <textarea
                rows={field.rows}
                placeholder={field.placeholder}
                value={reflections[field.id] ?? ''}
                onChange={e => handleReflectionChange(field.id, e.target.value)}
                style={{
                  ...inputStyle,
                  resize: 'none',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(149,144,236,0.32)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(234,232,242,0.08)' }}
              />
            </div>
          ))}
        </div>

        {/* Note */}
        <div style={{
          paddingLeft: '1.2rem', paddingTop: '0.75rem', paddingBottom: '0.75rem',
          borderLeft: '2px solid rgba(149,144,236,0.18)',
          background: 'rgba(149,144,236,0.025)',
          marginBottom: '2.5rem',
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 14, color: 'rgba(234,232,242,0.44)', lineHeight: 1.65,
            fontStyle: 'italic',
          }}>
            You can speak your answers — tap the microphone icon next to any field.
            Your words will be transcribed in real time.
          </p>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button size="lg" onClick={handleContinue}>
            Enter the Assessment →
          </Button>
          <Link href="/onboarding/welcome">
            <Button variant="ghost" size="lg">← Go Back</Button>
          </Link>
        </div>

      </div>

      {/* DEV: preview navigator — only visible when ?preview=1 */}
      <PreviewNav />
    </main>
  )
}
