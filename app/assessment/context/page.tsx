'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'
import { Button }              from '@/components/ui/Button'
import { PreviewNav }          from '@/components/dev/PreviewNav'
import {
  parseNarrativeAnswers,
  EMPTY_NARRATIVE,
  type NarrativeAnswers,
} from '@/lib/assessment/narrative'

// ─── Three focused prompts ─────────────────────────────────────────────────────
// Maps to existing NarrativeAnswers fields so downstream scoring is unchanged.

type TextFieldId = 'recent_challenges' | 'recurring_pattern' | 'desired_direction'

interface Prompt {
  id:          TextFieldId
  question:    string
  placeholder: string
  rows:        number
}

const PROMPTS: Prompt[] = [
  {
    id:          'recent_challenges',
    question:    "What's actually happening in your life right now? Where are you feeling the most friction, pressure, or tension day to day?",
    placeholder: 'A situation, a relationship, a pressure you\'re navigating…',
    rows:        4,
  },
  {
    id:          'recurring_pattern',
    question:    "What keeps repeating that you haven't fully resolved? What do you already know — but aren't fully acting on?",
    placeholder: 'A pattern, a habit, a truth you\'re circling around…',
    rows:        4,
  },
  {
    id:          'desired_direction',
    question:    "Where do you feel pulled to go next? If things were more aligned, what would your life look like in the next 6 months?",
    placeholder: 'Not the goal — the feeling or quality of life you\'re moving toward…',
    rows:        4,
  },
]

// ─── Speech recognition types ──────────────────────────────────────────────────

interface AeSpeechRecognition extends EventTarget {
  continuous:     boolean
  interimResults: boolean
  lang:           string
  start():        void
  stop():         void
  onresult:       ((e: AeSpeechRecognitionEvent) => void) | null
  onend:          (() => void) | null
  onerror:        (() => void) | null
}
interface AeSpeechRecognitionEvent extends Event {
  results: { length: number; [i: number]: { [i: number]: { transcript: string } } }
}
type AeSpeechRecognitionCtor = new () => AeSpeechRecognition

// ─── Mic button ────────────────────────────────────────────────────────────────

function MicButton({
  fieldId,
  onTranscript,
}: {
  fieldId:      TextFieldId
  onTranscript: (id: TextFieldId, text: string) => void
}) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<AeSpeechRecognition | null>(null)

  const toggle = useCallback(() => {
    if (typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const API: AeSpeechRecognitionCtor | undefined =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!API) return

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const r = new API()
    r.continuous     = true
    r.interimResults = false
    r.lang           = 'en-US'

    r.onresult = (e: AeSpeechRecognitionEvent) => {
      const transcript = Array.from(
        { length: e.results.length },
        (_, i) => e.results[i][0].transcript
      ).join(' ')
      onTranscript(fieldId, transcript)
    }
    r.onend   = () => setListening(false)
    r.onerror = () => setListening(false)

    recognitionRef.current = r
    r.start()
    setListening(true)
  }, [listening, fieldId, onTranscript])

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? 'Stop recording' : 'Speak your answer'}
      style={{
        flexShrink:  0,
        display:     'flex', alignItems: 'center', justifyContent: 'center',
        width:       26, height: 26, borderRadius: '50%',
        background:  listening ? 'rgba(149,144,236,0.14)' : 'rgba(234,232,242,0.04)',
        border:      listening ? '1px solid rgba(149,144,236,0.48)' : '1px solid rgba(234,232,242,0.08)',
        boxShadow:   listening ? '0 0 10px rgba(149,144,236,0.25)' : 'none',
        cursor:      'pointer', transition: 'all 0.2s',
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

// ─── Shared styles ─────────────────────────────────────────────────────────────

const textareaStyle: React.CSSProperties = {
  width:        '100%',
  background:   'rgba(234,232,242,0.025)',
  border:       '1px solid rgba(234,232,242,0.08)',
  borderRadius: 2,
  padding:      '11px 14px',
  color:        'rgba(234,232,242,0.78)',
  fontSize:     15,
  fontFamily:   "'Cormorant Garamond', serif",
  lineHeight:   1.55,
  outline:      'none',
  resize:       'none',
  transition:   'border-color 0.2s',
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ContextPage() {
  const router = useRouter()
  const [narrative, setNarrative] = useState<NarrativeAnswers>({ ...EMPTY_NARRATIVE })

  // Restore on back-navigation
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ae_narrative_answers')
      if (stored) setNarrative(parseNarrativeAnswers(JSON.parse(stored)))
    } catch { /* ignore */ }
  }, [])

  const handleTextChange = useCallback((id: TextFieldId, val: string) => {
    setNarrative(prev => ({ ...prev, [id]: val }))
  }, [])

  const handleTranscript = useCallback((id: TextFieldId, text: string) => {
    setNarrative(prev => ({
      ...prev,
      [id]: prev[id] ? `${prev[id]} ${text}` : text,
    }))
  }, [])

  function saveAndPush(destination: string) {
    localStorage.setItem('ae_narrative_answers', JSON.stringify(narrative))
    router.push(destination)
  }

  // Primary: user has added context — full AI enrichment with narrative
  function handleRefine() {
    saveAndPush('/generating')
  }

  // Secondary: skip context — AI enrichment runs with empty narrative (baseline only)
  function handleBaseline() {
    localStorage.setItem('ae_narrative_answers', JSON.stringify({}))
    router.push('/generating')
  }

  return (
    <main className="page-atmosphere flex flex-col" style={{ minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{
        position:       'relative',
        zIndex:         10,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '1.4rem 2.5rem',
        borderBottom:   '1px solid rgba(255,255,255,0.04)',
      }}>
        <Link
          href="/assessment/identity"
          style={{
            fontFamily:     "'Cinzel', serif",
            fontSize:       9,
            letterSpacing:  '0.32em',
            textTransform:  'uppercase',
            color:          'rgba(234,232,242,0.28)',
            textDecoration: 'none',
            transition:     'color 0.2s',
          }}
        >
          ← Back
        </Link>
        <span style={{
          fontFamily:    "'Cinzel', serif",
          fontSize:      9,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color:         'rgba(234,232,242,0.18)',
        }}>
          Deepen Your Profile
        </span>
      </nav>

      {/* Content */}
      <div style={{
        flex:      1,
        maxWidth:  620,
        margin:    '0 auto',
        padding:   '3.5rem 2.5rem 5rem',
        width:     '100%',
        position:  'relative',
        zIndex:    10,
      }}>

        {/* Page header */}
        <p style={{
          fontFamily:    "'Cinzel', serif",
          fontSize:      9,
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          color:         'rgba(149,144,236,0.45)',
          marginBottom:  '1.5rem',
        }}>
          Deepen Your Profile
        </p>

        <h1 style={{
          fontFamily:    "'Cormorant Garamond', serif",
          fontSize:      'clamp(28px, 3.8vw, 42px)',
          fontWeight:    300,
          color:         '#eae8f2',
          letterSpacing: '-0.015em',
          lineHeight:    1.12,
          marginBottom:  '1.25rem',
        }}>
          Three questions that make your results more precise.
        </h1>

        <p style={{
          fontFamily:    "'Cormorant Garamond', serif",
          fontSize:      'clamp(14px, 1.5vw, 17px)',
          fontStyle:     'italic',
          color:         'rgba(234,232,242,0.45)',
          lineHeight:    1.78,
          maxWidth:      480,
          marginBottom:  '3rem',
        }}>
          Optional — but the more you share, the more specific your profile becomes.
          You can speak your answers using the microphone.
        </p>

        {/* Prompts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.75rem', marginBottom: '3rem' }}>
          {PROMPTS.map((prompt, i) => (
            <div key={prompt.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* Number + question row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontFamily:    "'Cinzel', serif",
                    fontSize:      7.5,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color:         'rgba(149,144,236,0.35)',
                    display:       'block',
                    marginBottom:  '0.5rem',
                  }}>
                    0{i + 1}
                  </span>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize:   18,
                    color:      'rgba(234,232,242,0.78)',
                    lineHeight: 1.5,
                  }}>
                    {prompt.question}
                  </p>
                </div>
                <MicButton fieldId={prompt.id} onTranscript={handleTranscript} />
              </div>

              <textarea
                rows={prompt.rows}
                placeholder={prompt.placeholder}
                value={narrative[prompt.id]}
                onChange={e => handleTextChange(prompt.id, e.target.value)}
                style={textareaStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(149,144,236,0.32)' }}
                onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(234,232,242,0.08)' }}
              />

              {i < PROMPTS.length - 1 && (
                <div style={{
                  marginTop:  '1rem',
                  height:     1,
                  background: 'linear-gradient(to right, rgba(149,144,236,0.08), transparent)',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Mic hint */}
        <div style={{
          marginBottom:  '2.5rem',
          paddingLeft:   '1.2rem',
          paddingTop:    '0.75rem',
          paddingBottom: '0.75rem',
          borderLeft:    '2px solid rgba(149,144,236,0.15)',
          background:    'rgba(149,144,236,0.02)',
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize:   13,
            color:      'rgba(234,232,242,0.35)',
            lineHeight: 1.65,
            fontStyle:  'italic',
          }}>
            You can speak your answers — tap the microphone icon next to any
            field and your words will be transcribed in real time.
          </p>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Primary — adds context, produces richer results */}
          <Button size="lg" onClick={handleRefine}>
            Refine My Profile →
          </Button>

          {/* Secondary — skips context, produces baseline results only */}
          <button
            onClick={handleBaseline}
            style={{
              fontFamily:    "'Cinzel', serif",
              fontSize:      9,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color:         'rgba(234,232,242,0.3)',
              background:    'transparent',
              border:        '1px solid rgba(234,232,242,0.07)',
              borderRadius:  3,
              padding:       '11px 20px',
              cursor:        'pointer',
              transition:    'all 0.2s',
              width:         '100%',
              textAlign:     'center',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'rgba(234,232,242,0.5)'
              e.currentTarget.style.borderColor = 'rgba(234,232,242,0.14)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(234,232,242,0.3)'
              e.currentTarget.style.borderColor = 'rgba(234,232,242,0.07)'
            }}
          >
            Use Baseline Results →
          </button>

          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize:   12,
            color:      'rgba(234,232,242,0.2)',
            fontStyle:  'italic',
            textAlign:  'center',
            marginTop:  '0.25rem',
          }}>
            Adding context produces a more specific profile.
            Skipping uses your dimensional scores alone.
          </p>

        </div>

      </div>

      <PreviewNav />
    </main>
  )
}
