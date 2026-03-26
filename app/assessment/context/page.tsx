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
  type EnergyState,
} from '@/lib/assessment/narrative'
import { PREVIEW_REFLECTIONS } from '@/lib/dev/previewMock'

// ─── Energy options ────────────────────────────────────────────────────────────

const ENERGY_OPTIONS: { value: EnergyState; description: string }[] = [
  { value: 'Scattered', description: 'Pulled in too many directions'         },
  { value: 'Stuck',     description: 'Not moving forward'                    },
  { value: 'Stable',    description: 'Functioning, but not fully engaged'    },
  { value: 'Focused',   description: 'Clear and moving with purpose'         },
  { value: 'Driven',    description: 'High energy, strong momentum'          },
]

// ─── Section config ────────────────────────────────────────────────────────────

type TextFieldId = Exclude<keyof NarrativeAnswers, 'energy_state'>

interface TextPrompt {
  type:        'text'
  id:          TextFieldId
  question:    string
  placeholder: string
  rows:        number
}

interface ChoicePrompt {
  type:     'choice'
  id:       'energy_state'
  question: string
}

type Prompt = TextPrompt | ChoicePrompt

interface Section {
  label:       string
  description: string
  prompts:     Prompt[]
}

const SECTIONS: Section[] = [
  {
    label:       'Context',
    description: 'Where you actually are.',
    prompts: [
      {
        type:        'text',
        id:          'life_phase',
        question:    'Describe the season of life you are in right now. Not where you want to be — where you actually are.',
        placeholder: 'A transition, a plateau, a rebuild, a new beginning…',
        rows:        3,
      },
      {
        type:        'text',
        id:          'environment',
        question:    'What does your current environment require from you? What are you surrounded by, responsible for, or pulled between?',
        placeholder: 'Work, relationships, obligations, living situation, pace of life…',
        rows:        3,
      },
    ],
  },
  {
    label:       'Friction',
    description: 'Where energy is stuck or leaking.',
    prompts: [
      {
        type:        'text',
        id:          'recent_challenges',
        question:    'What has felt unresolved, draining, or quietly off lately?',
        placeholder: 'A situation, a feeling, a relationship, a pattern of avoiding…',
        rows:        3,
      },
      {
        type:        'text',
        id:          'recurring_pattern',
        question:    'What pattern do you keep seeing in yourself, even when you want to respond differently?',
        placeholder: 'A reaction, a habit of thought, a way of getting in your own way…',
        rows:        3,
      },
      {
        type:        'text',
        id:          'avoidance',
        question:    'What do you already know you need to face, but keep putting off?',
        placeholder: 'A decision, a conversation, a truth, an action…',
        rows:        2,
      },
    ],
  },
  {
    label:       'Direction',
    description: 'The pull toward what\'s next.',
    prompts: [
      {
        type:        'text',
        id:          'desired_direction',
        question:    'If something in you shifted over the next six months — how would you be different?',
        placeholder: 'In your work, your relationships, your inner life, your sense of yourself…',
        rows:        3,
      },
      {
        type:        'text',
        id:          'deeper_pull',
        question:    'Beneath obligation and expectation — what is actually calling you forward?',
        placeholder: 'Not the goal. The feeling or quality of life you\'re after…',
        rows:        3,
      },
    ],
  },
  {
    label:       'Energy',
    description: 'Your current state and vitality.',
    prompts: [
      {
        type:     'choice',
        id:       'energy_state',
        question: 'How are you running right now?',
      },
      {
        type:        'text',
        id:          'energy_sources',
        question:    'What is giving you energy right now — even slightly?',
        placeholder: 'People, activities, environments, ideas, moments…',
        rows:        2,
      },
    ],
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

// ─── Energy choice ─────────────────────────────────────────────────────────────

function EnergyChoice({
  selected,
  onChange,
}: {
  selected: string
  onChange: (value: EnergyState) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {ENERGY_OPTIONS.map(opt => {
        const isSelected = selected === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              display:     'flex',
              alignItems:  'center',
              gap:         '0.85rem',
              padding:     '0.7rem 1rem',
              background:  isSelected ? 'rgba(149,144,236,0.08)' : 'rgba(234,232,242,0.02)',
              border:      isSelected
                ? '1px solid rgba(149,144,236,0.35)'
                : '1px solid rgba(234,232,242,0.07)',
              borderRadius: 3,
              cursor:      'pointer',
              textAlign:   'left',
              transition:  'all 0.15s',
              boxShadow:   isSelected ? '0 0 12px rgba(149,144,236,0.12)' : 'none',
            }}
          >
            {/* Dot indicator */}
            <div style={{
              flexShrink:  0,
              width:       8,
              height:      8,
              borderRadius: '50%',
              background:  isSelected ? '#9590ec' : 'transparent',
              border:      isSelected
                ? '1px solid rgba(149,144,236,0.6)'
                : '1px solid rgba(234,232,242,0.2)',
              boxShadow:   isSelected ? '0 0 6px rgba(149,144,236,0.5)' : 'none',
              transition:  'all 0.15s',
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <span style={{
                fontFamily:    "'Cinzel', serif",
                fontSize:      9,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color:         isSelected ? 'rgba(149,144,236,0.9)' : 'rgba(234,232,242,0.5)',
                transition:    'color 0.15s',
              }}>
                {opt.value}
              </span>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize:   13,
                color:      isSelected ? 'rgba(234,232,242,0.65)' : 'rgba(234,232,242,0.28)',
                transition: 'color 0.15s',
              }}>
                {opt.description}
              </span>
            </div>
          </button>
        )
      })}
    </div>
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

  // DEV: pre-fill when ?preview=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('preview') !== '1') return
    setNarrative(parseNarrativeAnswers(PREVIEW_REFLECTIONS))
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

  const handleEnergyChange = useCallback((value: EnergyState) => {
    setNarrative(prev => ({ ...prev, energy_state: value }))
  }, [])

  function handleContinue() {
    localStorage.setItem('ae_narrative_answers', JSON.stringify(narrative))
    router.push('/generating')
  }

  return (
    <main className="page-atmosphere flex flex-col" style={{ minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{
        position:     'relative',
        zIndex:       10,
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
        padding:      '1.4rem 2.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <Link
          href="/assessment"
          style={{
            fontFamily:    "'Cinzel', serif",
            fontSize:      9,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color:         'rgba(234,232,242,0.28)',
            textDecoration: 'none',
            transition:    'color 0.2s',
          }}
        >
          ← Assessment
        </Link>
        <span style={{
          fontFamily:    "'Cinzel', serif",
          fontSize:      9,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color:         'rgba(234,232,242,0.18)',
        }}>
          Context
        </span>
      </nav>

      {/* Content */}
      <div style={{
        flex:       1,
        maxWidth:   620,
        margin:     '0 auto',
        padding:    '3.5rem 2.5rem 5rem',
        width:      '100%',
        position:   'relative',
        zIndex:     10,
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
          Your Context
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
          Before we interpret your pattern, we need to understand your reality.
        </h1>

        <p style={{
          fontFamily:    "'Cormorant Garamond', serif",
          fontSize:      'clamp(14px, 1.5vw, 17px)',
          fontStyle:     'italic',
          color:         'rgba(234,232,242,0.45)',
          lineHeight:    1.78,
          maxWidth:      480,
          marginBottom:  '2rem',
        }}>
          The pattern you just measured only makes sense inside a life.
          These questions are about that life — where it is right now.
        </p>

        {/* Soft check-in — non-interactive, not stored */}
        <div style={{
          marginBottom:  '3rem',
          paddingLeft:   '1.1rem',
          borderLeft:    '2px solid rgba(149,144,236,0.12)',
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize:   15,
            color:      'rgba(234,232,242,0.3)',
            lineHeight: 1.7,
            fontStyle:  'italic',
          }}>
            Take a breath. How are you feeling right now in your body?
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
          {SECTIONS.map((section, si) => (
            <div key={section.label}>

              {/* Section header */}
              <div style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '0.85rem',
                marginBottom: '1.5rem',
              }}>
                <div style={{
                  width:      2,
                  height:     28,
                  background: 'linear-gradient(to bottom, rgba(149,144,236,0.6), rgba(149,144,236,0.05))',
                  borderRadius: 1,
                  flexShrink: 0,
                }} />
                <div>
                  <p style={{
                    fontFamily:    "'Cinzel', serif",
                    fontSize:      8,
                    letterSpacing: '0.4em',
                    textTransform: 'uppercase',
                    color:         'rgba(149,144,236,0.55)',
                    marginBottom:  '0.2rem',
                  }}>
                    {section.label}
                  </p>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize:   13,
                    color:      'rgba(234,232,242,0.3)',
                    fontStyle:  'italic',
                  }}>
                    {section.description}
                  </p>
                </div>
              </div>

              {/* Prompts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                {section.prompts.map(prompt => (
                  <div key={prompt.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>

                    {/* Question label row */}
                    <div style={{
                      display:        'flex',
                      alignItems:     'flex-start',
                      justifyContent: 'space-between',
                      gap:            '0.75rem',
                    }}>
                      <p style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize:   16,
                        color:      'rgba(234,232,242,0.72)',
                        lineHeight: 1.45,
                        flex:       1,
                      }}>
                        {prompt.question}
                      </p>
                      {prompt.type === 'text' && (
                        <MicButton fieldId={prompt.id} onTranscript={handleTranscript} />
                      )}
                    </div>

                    {/* Input */}
                    {prompt.type === 'text' ? (
                      <textarea
                        rows={prompt.rows}
                        placeholder={prompt.placeholder}
                        value={narrative[prompt.id]}
                        onChange={e => handleTextChange(prompt.id, e.target.value)}
                        style={textareaStyle}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(149,144,236,0.32)' }}
                        onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(234,232,242,0.08)' }}
                      />
                    ) : (
                      <EnergyChoice
                        selected={narrative.energy_state}
                        onChange={handleEnergyChange}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Section divider (not after last) */}
              {si < SECTIONS.length - 1 && (
                <div style={{
                  marginTop:  '3.5rem',
                  height:     1,
                  background: 'linear-gradient(to right, rgba(149,144,236,0.1), transparent)',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Mic hint */}
        <div style={{
          marginTop:     '2.5rem',
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
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '2.5rem' }}>
          <Button size="lg" onClick={handleContinue}>
            Generate My Profile →
          </Button>
          <Link href="/assessment">
            <Button variant="ghost" size="lg">← Go Back</Button>
          </Link>
        </div>

      </div>

      <PreviewNav />
    </main>
  )
}
