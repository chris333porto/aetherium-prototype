'use client'

/**
 * dashboard/page.tsx — Aetherium Daily Operating System
 *
 * Cards:
 *   1. Header (greeting + archetype + guidance)
 *   2. Speak to Trinity (voice capture)
 *   3. Meditation (timer 5/15/30)
 *   4. Reflection (prompt + journal + AI insight)
 *   5. Movement (body check-in)
 *   6. Mission (persistent daily tasks)
 *   7. System (radar + coherence + streak)
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter }              from 'next/navigation'
import Link                       from 'next/link'
import { supabase }               from '@/lib/supabase'
import { linkUserToProfile }      from '@/lib/persistence/profiles'
import { getLatestFullReading }   from '@/lib/persistence/reflections'
import { DIMENSION_META }         from '@/lib/assessment/questions'
import type { Dimension }         from '@/lib/assessment/questions'
import type { ArchetypeBlendRecord, ProfileState } from '@/lib/supabase'
import type { FullReading }       from '@/lib/persistence/reflections'
import { ARCHETYPES, type Archetype } from '@/lib/archetypes/definitions'
import { DimensionChart }         from '@/components/DimensionChart'
import { EnergyField }            from '@/components/EnergyField'
import type { DimensionScores }   from '@/lib/scoring/engine'

// ── Types ────────────────────────────────────────────────────────────────────

type DashData = {
  firstName: string; scores: Record<Dimension, number>; coherenceScore: number
  archetype: Archetype | null; archetypeBlend: ArchetypeBlendRecord
  growthDimension: Dimension | null; growthEdgeLabel: string | null
  shadowTrigger: string | null; profileStateId: string; userId: string
}
type Phase = 'loading' | 'ready' | 'empty' | 'error'
type MissionItem = { id: string; title: string; status: string; completed_at: string | null }

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Shared UI ────────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'rgba(149,144,236,0.025)', border: '1px solid rgba(149,144,236,0.07)', borderRadius: 10, padding: '1.4rem 1.5rem', ...style }}>{children}</div>
}
function Label({ children, color }: { children: React.ReactNode; color?: string }) {
  return <p style={{ fontFamily: "'Cinzel', serif", fontSize: 7.5, letterSpacing: '0.4em', textTransform: 'uppercase', color: color ?? 'rgba(149,144,236,0.45)', marginBottom: '0.5rem' }}>{children}</p>
}

// ── Voice Capture (Speak to Trinity) ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any

function VoiceCard({ userId, firstName, archetype, growthEdge, shadowTrigger }: {
  userId: string; firstName?: string; archetype?: string; growthEdge?: string; shadowTrigger?: string
}) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [category, setCategory] = useState('Free Speak')
  const [showCategories, setShowCategories] = useState(false)
  const [trinityResponse, setTrinityResponse] = useState<{ mode: string; response: string; followUp: string } | null>(null)
  const [processing, setProcessing] = useState(false)
  const recognitionRef = useRef<AnyRecognition>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const recordingStartRef = useRef<number>(0)

  const categories = ['Daily Reflection', 'Life Story', 'Childhood', 'Relationship', 'Business',
    'Philosophy', 'Pain / Healing', 'Insight', 'Lesson Learned', 'Dream / Vision',
    'Creativity', 'Parenting', 'Spirituality', 'Current Chapter', 'Free Speak']

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SpeechAPI = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SpeechAPI) return

    const recognition = new SpeechAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    let finalTranscript = transcript

    recognition.onresult = (e: AnyRecognition) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) { finalTranscript += t + ' ' } else { interim = t }
      }
      setTranscript(finalTranscript + interim)
    }

    recognition.onend = () => { setListening(false); setTranscript(finalTranscript.trim()) }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
    setTrinityResponse(null)
    setAudioBlob(null)
    recordingStartRef.current = Date.now()

    // Start MediaRecorder for raw audio capture
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' })
      audioChunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType })
        setAudioBlob(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRecorderRef.current = mr
    }).catch(() => { /* microphone denied — transcript still works via Web Speech API */ })
  }, [transcript])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    mediaRecorderRef.current?.stop()
    setListening(false)
  }, [])

  const sendToTrinity = useCallback(async () => {
    if (!transcript.trim()) return
    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Upload audio file if available
      let voiceNoteId: string | undefined
      if (audioBlob && audioBlob.size > 0) {
        const duration = Math.round((Date.now() - recordingStartRef.current) / 1000)
        const formData = new FormData()
        formData.append('audioBlob', audioBlob, 'recording.webm')
        formData.append('userId', userId)
        formData.append('accessToken', session.access_token)
        formData.append('durationSeconds', String(duration))

        const audioRes = await fetch('/api/audio', { method: 'POST', body: formData })
        if (audioRes.ok) {
          const audioJson = await audioRes.json()
          voiceNoteId = audioJson.data?.voiceNoteId
        }
      }

      const res = await fetch('/api/trinity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, accessToken: session.access_token,
          content: transcript.trim(), category,
          source: 'voice', firstName, archetype, growthEdge, shadowTrigger,
          voiceNoteId,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        setTrinityResponse(json.data.trinity)
      }
    } catch { /* silent */ }
    setProcessing(false)
  }, [transcript, category, userId, firstName, archetype, growthEdge, shadowTrigger, audioBlob])

  return (
    <Card>
      <Label color="rgba(149,144,236,0.5)">Speak to Trinity</Label>

      {/* Category selector */}
      <div style={{ marginBottom: '0.8rem' }}>
        <button onClick={() => setShowCategories(!showCategories)} style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: 13,
          color: 'rgba(234,232,242,0.45)', background: 'none', border: 'none',
          cursor: 'pointer', padding: 0,
        }}>
          {category} ▾
        </button>
        {showCategories && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
            {categories.map(c => (
              <button key={c} onClick={() => { setCategory(c); setShowCategories(false) }} style={{
                fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: c === category ? '#eae8f2' : 'rgba(234,232,242,0.35)',
                background: c === category ? 'rgba(149,144,236,0.12)' : 'rgba(149,144,236,0.03)',
                border: `1px solid ${c === category ? 'rgba(149,144,236,0.25)' : 'rgba(149,144,236,0.06)'}`,
                borderRadius: 3, padding: '5px 10px', cursor: 'pointer',
              }}>{c}</button>
            ))}
          </div>
        )}
      </div>

      {/* Transcript */}
      {transcript && (
        <div style={{ padding: '0.8rem 1rem', background: 'rgba(149,144,236,0.03)', border: '1px solid rgba(149,144,236,0.06)', borderRadius: 6, marginBottom: '0.8rem', maxHeight: 150, overflow: 'auto' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: 'rgba(234,232,242,0.6)', lineHeight: 1.65, margin: 0 }}>{transcript}</p>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {!listening ? (
          <button onClick={startListening} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
            fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase',
            color: '#eae8f2', background: 'rgba(149,144,236,0.08)',
            border: '1px solid rgba(149,144,236,0.2)', borderRadius: 8,
            padding: transcript ? '10px 18px' : '14px 0', width: transcript ? 'auto' : '100%',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 0 20px rgba(149,144,236,0.05)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(149,144,236,0.14)'; e.currentTarget.style.borderColor = 'rgba(149,144,236,0.35)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(149,144,236,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(149,144,236,0.08)'; e.currentTarget.style.borderColor = 'rgba(149,144,236,0.2)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(149,144,236,0.05)' }}
          ><span style={{ fontSize: 16 }}>🎙</span> {transcript ? 'Continue' : 'Begin Voice Reflection'}</button>
        ) : (
          <button onClick={stopListening} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#eae8f2', background: 'rgba(224,90,58,0.1)',
            border: '1px solid rgba(224,90,58,0.25)', borderRadius: 6,
            padding: '10px 18px', cursor: 'pointer',
            animation: 'ae-pulse-border 2s ease-in-out infinite',
          }}><span style={{ fontSize: 14 }}>⏹</span> Stop</button>
        )}

        {transcript && !listening && !trinityResponse && (
          <button onClick={sendToTrinity} disabled={processing} style={{
            fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'rgba(149,144,236,0.7)', background: 'rgba(149,144,236,0.06)',
            border: '1px solid rgba(149,144,236,0.18)', borderRadius: 4,
            padding: '8px 14px', cursor: 'pointer',
          }}>{processing ? 'Trinity is listening...' : 'Send to Trinity'}</button>
        )}

        {transcript && !listening && !trinityResponse && (
          <button onClick={() => { setTranscript(''); setTrinityResponse(null) }} style={{ fontFamily: "'Cinzel', serif", fontSize: 7, color: 'rgba(234,232,242,0.2)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
        )}
      </div>

      {/* Trinity's response */}
      {trinityResponse && (
        <div style={{ marginTop: '1rem', padding: '1rem 1.2rem', borderLeft: '2px solid rgba(149,144,236,0.2)', background: 'rgba(149,144,236,0.025)', borderRadius: '0 6px 6px 0' }}>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: 6.5, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(149,144,236,0.4)', marginBottom: '0.4rem' }}>
            Trinity · {trinityResponse.mode}
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: 'rgba(234,232,242,0.72)', lineHeight: 1.65, margin: '0 0 0.6rem' }}>
            {trinityResponse.response}
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: 'italic', color: 'rgba(149,144,236,0.5)', lineHeight: 1.6, margin: 0 }}>
            {trinityResponse.followUp}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.6rem' }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, color: 'rgba(45,184,133,0.45)', fontStyle: 'italic' }}>Stored in Memory Vault ✓</span>
            <button onClick={() => { setTranscript(''); setTrinityResponse(null); setAudioBlob(null) }} style={{
              fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'rgba(234,232,242,0.25)', background: 'none', border: 'none', cursor: 'pointer',
            }}>New Entry</button>
          </div>
        </div>
      )}

      <style>{`@keyframes ae-pulse-border { 0%, 100% { border-color: rgba(224,90,58,0.25); } 50% { border-color: rgba(224,90,58,0.5); } }`}</style>
    </Card>
  )
}

// ── Meditation Timer ─────────────────────────────────────────────────────────

function MeditationCard() {
  const [duration, setDuration] = useState<number | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [active, setActive] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [postNote, setPostNote] = useState('')
  const [postSaved, setPostSaved] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<AudioContext | null>(null)

  // Load today's meditation from localStorage
  const todayKey = `ae_med_${new Date().toISOString().split('T')[0]}`
  const [todayMinutes, setTodayMinutes] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem(todayKey)
    if (stored) setTodayMinutes(parseInt(stored, 10) || 0)
  }, [todayKey])

  function startTimer(minutes: number) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setDuration(minutes); setRemaining(minutes * 60); setActive(true); setCompleted(false); setPostSaved(false); setPostNote('')
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!); intervalRef.current = null; setActive(false); setCompleted(true)
          // Track minutes
          const newTotal = todayMinutes + minutes
          setTodayMinutes(newTotal)
          localStorage.setItem(todayKey, String(newTotal))
          // Streak
          const streakKey = 'ae_med_streak'
          const lastDate = localStorage.getItem('ae_med_last_date')
          const today = new Date().toISOString().split('T')[0]
          if (lastDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
            const currentStreak = parseInt(localStorage.getItem(streakKey) ?? '0', 10)
            localStorage.setItem(streakKey, String(lastDate === yesterday ? currentStreak + 1 : 1))
            localStorage.setItem('ae_med_last_date', today)
          }
          // Chime
          try {
            const ctx = audioRef.current ?? new AudioContext(); audioRef.current = ctx
            const osc = ctx.createOscillator(); const gain = ctx.createGain()
            osc.connect(gain); gain.connect(ctx.destination)
            osc.frequency.value = 528; osc.type = 'sine'
            gain.gain.setValueAtTime(0.15, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5)
            osc.start(); osc.stop(ctx.currentTime + 2.5)
          } catch {}
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function stopTimer() { if (intervalRef.current) clearInterval(intervalRef.current); intervalRef.current = null; setActive(false); setDuration(null); setRemaining(0) }
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const mins = Math.floor(remaining / 60); const secs = remaining % 60
  const progress = duration ? 1 - remaining / (duration * 60) : 0
  const streak = typeof window !== 'undefined' ? parseInt(localStorage.getItem('ae_med_streak') ?? '0', 10) : 0

  return (
    <Card>
      <Label>Meditation</Label>

      {/* Ready state */}
      {!active && !completed && (
        <>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontStyle: 'italic', color: 'rgba(234,232,242,0.4)', marginBottom: '1rem', lineHeight: 1.6 }}>
            Settle your system before the day begins.
          </p>
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: todayMinutes > 0 || streak > 0 ? '0.8rem' : 0 }}>
            {[5, 15, 30].map(m => (
              <button key={m} onClick={() => startTimer(m)} style={{ flex: 1, fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.15em', color: '#eae8f2', background: 'rgba(149,144,236,0.06)', border: '1px solid rgba(149,144,236,0.15)', borderRadius: 6, padding: '12px 0', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(149,144,236,0.12)'; e.currentTarget.style.borderColor = 'rgba(149,144,236,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(149,144,236,0.06)'; e.currentTarget.style.borderColor = 'rgba(149,144,236,0.15)' }}
              >{m} min</button>
            ))}
          </div>
          {/* Stats */}
          {(todayMinutes > 0 || streak > 0) && (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              {todayMinutes > 0 && <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, color: 'rgba(149,144,236,0.35)', fontStyle: 'italic' }}>{todayMinutes} min today</span>}
              {streak > 0 && <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, color: 'rgba(149,144,236,0.35)', fontStyle: 'italic' }}>{streak} day streak</span>}
            </div>
          )}
        </>
      )}

      {/* Active state */}
      {active && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 1rem' }}>
            <svg viewBox="0 0 140 140" width="140" height="140">
              <circle cx="70" cy="70" r="62" fill="none" stroke="rgba(149,144,236,0.08)" strokeWidth="2" />
              <circle cx="70" cy="70" r="62" fill="none" stroke="rgba(149,144,236,0.4)" strokeWidth="2" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 62}`} strokeDashoffset={`${2 * Math.PI * 62 * (1 - progress)}`} transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: 'rgba(234,232,242,0.7)', letterSpacing: '0.05em' }}>{mins}:{secs.toString().padStart(2, '0')}</span>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(149,144,236,0.35)', marginTop: 4 }}>Remaining</span>
            </div>
          </div>
          <button onClick={stopTimer} style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>End Session</button>
        </div>
      )}

      {/* Post-meditation check-in */}
      {completed && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: 'rgba(234,232,242,0.6)', marginBottom: '0.6rem' }}>
            {duration} minutes complete.
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: 'italic', color: 'rgba(149,144,236,0.45)', marginBottom: '0.8rem' }}>
            How are you now?
          </p>
          {!postSaved ? (
            <>
              {/* Quick mood buttons */}
              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                {['Calm', 'Clear', 'Heavy', 'Focused', 'Grateful'].map(mood => (
                  <button key={mood} onClick={() => { setPostNote(mood); setPostSaved(true) }} style={{
                    fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'rgba(234,232,242,0.5)', background: 'rgba(149,144,236,0.04)',
                    border: '1px solid rgba(149,144,236,0.12)', borderRadius: 4,
                    padding: '6px 12px', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(149,144,236,0.1)'; e.currentTarget.style.color = '#eae8f2' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(149,144,236,0.04)'; e.currentTarget.style.color = 'rgba(234,232,242,0.5)' }}
                  >{mood}</button>
                ))}
              </div>
              <button onClick={() => { setPostSaved(true) }} style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.2)', background: 'none', border: 'none', cursor: 'pointer' }}>Skip</button>
            </>
          ) : (
            <div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: 'rgba(45,184,133,0.5)', fontStyle: 'italic', marginBottom: '0.3rem' }}>
                {postNote ? `${postNote} · ` : ''}Meditated ✓
              </p>
              <button onClick={() => { setCompleted(false); setDuration(null) }} style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.2)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ── Movement ─────────────────────────────────────────────────────────────────

function MovementCard() {
  const [logged, setLogged] = useState(false); const [note, setNote] = useState('')
  if (logged) return (
    <Card><Label color="rgba(45,184,133,0.45)">Movement</Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(45,184,133,0.5)' }} />
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: 'italic', color: 'rgba(45,184,133,0.5)' }}>{note || 'Moved today'} ✓</span></div></Card>
  )
  return (
    <Card><Label color="rgba(45,184,133,0.45)">Movement</Label>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: 'italic', color: 'rgba(234,232,242,0.35)', marginBottom: '0.8rem' }}>Did your body move today?</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {['Walk', 'Run', 'Gym', 'Yoga', 'Stretch', 'Sport'].map(opt => (
          <button key={opt} onClick={() => { setNote(opt); setLogged(true) }} style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.5)', background: 'rgba(45,184,133,0.04)', border: '1px solid rgba(45,184,133,0.12)', borderRadius: 4, padding: '7px 14px', cursor: 'pointer' }}>{opt}</button>
        ))}
        <button onClick={() => { setNote('Rest day'); setLogged(true) }} style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.25)', background: 'none', border: '1px solid rgba(234,232,242,0.06)', borderRadius: 4, padding: '7px 14px', cursor: 'pointer' }}>Rest</button>
      </div></Card>
  )
}

// ── Persistent Mission Card ──────────────────────────────────────────────────

function MissionCard({ userId }: { userId: string }) {
  const [missions, setMissions] = useState<MissionItem[]>([])
  const [newTask, setNewTask] = useState('')
  const [loaded, setLoaded] = useState(false)

  // Load today's missions
  useEffect(() => {
    async function load() {
      try {
        const today = new Date().toISOString().split('T')[0]
        const { data } = await supabase.from('missions').select('id, title, status, completed_at').eq('user_id', userId).eq('target_date', today).in('status', ['active', 'completed']).order('created_at', { ascending: true })
        setMissions((data ?? []) as MissionItem[])
      } catch {}
      setLoaded(true)
    }
    load()
  }, [userId])

  async function addMission() {
    if (!newTask.trim()) return
    try {
      const { data } = await supabase.from('missions').insert({ user_id: userId, title: newTask.trim(), target_date: new Date().toISOString().split('T')[0] }).select('id, title, status, completed_at').single()
      if (data) setMissions(prev => [...prev, data as MissionItem])
      setNewTask('')
    } catch {}
  }

  async function toggleComplete(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'completed' ? 'active' : 'completed'
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null
    try {
      await supabase.from('missions').update({ status: newStatus, completed_at: completedAt }).eq('id', id)
      setMissions(prev => prev.map(m => m.id === id ? { ...m, status: newStatus, completed_at: completedAt } : m))
    } catch {}
  }

  if (!loaded) return null

  const active = missions.filter(m => m.status === 'active')
  const completed = missions.filter(m => m.status === 'completed')

  return (
    <Card>
      <Label color="rgba(224,90,58,0.45)">Today&apos;s Missions</Label>

      {/* Active missions */}
      {active.map(m => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(234,232,242,0.03)' }}>
          <button onClick={() => toggleComplete(m.id, m.status)} style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid rgba(224,90,58,0.25)', background: 'none', cursor: 'pointer', flexShrink: 0 }} />
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: 'rgba(234,232,242,0.7)', lineHeight: 1.5 }}>{m.title}</span>
        </div>
      ))}

      {/* Completed missions */}
      {completed.map(m => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(234,232,242,0.03)' }}>
          <button onClick={() => toggleComplete(m.id, m.status)} style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid rgba(45,184,133,0.3)', background: 'rgba(45,184,133,0.15)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'rgba(45,184,133,0.6)' }}>✓</button>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: 'rgba(234,232,242,0.3)', textDecoration: 'line-through', textDecorationColor: 'rgba(234,232,242,0.1)', lineHeight: 1.5 }}>{m.title}</span>
        </div>
      ))}

      {/* Add new */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: missions.length > 0 ? '0.6rem' : 0 }}>
        <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addMission() }} placeholder={missions.length === 0 ? 'What must move forward today?' : 'Add another...'} style={{ flex: 1, fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: '#eae8f2', background: 'rgba(234,232,242,0.025)', border: '1px solid rgba(234,232,242,0.07)', borderRadius: 6, padding: '9px 12px', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(224,90,58,0.18)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(234,232,242,0.07)'} />
        <button onClick={addMission} disabled={!newTask.trim()} style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: !newTask.trim() ? 'rgba(234,232,242,0.15)' : 'rgba(224,90,58,0.55)', background: 'rgba(224,90,58,0.04)', border: '1px solid rgba(224,90,58,0.12)', borderRadius: 6, padding: '9px 14px', cursor: !newTask.trim() ? 'default' : 'pointer' }}>Add</button>
      </div>
    </Card>
  )
}

// ── Know Me — daily self-discovery question ──────────────────────────────────

function KnowMeCard({ userId }: { userId: string }) {
  const [question, setQuestion] = useState<{ id: string; question: string; category: string } | null>(null)
  const [answer, setAnswer] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Pick a consistent daily question based on the date
    const today = new Date().toISOString().split('T')[0]
    const stored = localStorage.getItem('ae_knowme_date')
    const storedQ = localStorage.getItem('ae_knowme_q')
    const storedDone = localStorage.getItem('ae_knowme_done')

    if (stored === today && storedQ) {
      const parsed = JSON.parse(storedQ)
      setQuestion(parsed)
      if (storedDone === today) setSaved(true)
      return
    }

    // Import and pick a new question
    import('@/lib/engine/know-me').then(({ getNextQuestion }) => {
      // Get previously answered IDs
      const answeredRaw = localStorage.getItem('ae_knowme_answered') ?? '[]'
      const answeredIds = JSON.parse(answeredRaw) as string[]
      const q = getNextQuestion(answeredIds)
      const qData = { id: q.id, question: q.question, category: q.category }
      setQuestion(qData)
      localStorage.setItem('ae_knowme_date', today)
      localStorage.setItem('ae_knowme_q', JSON.stringify(qData))
    })
  }, [])

  async function saveAnswer() {
    if (!answer.trim() || !question) return
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      await fetch('/api/trinity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, accessToken: session.access_token,
          content: `[Know Me — ${question.category}] Q: ${question.question}\n\nA: ${answer.trim()}`,
          category: question.category,
          source: 'text',
        }),
      })

      // Track answered
      const answeredRaw = localStorage.getItem('ae_knowme_answered') ?? '[]'
      const answeredIds = JSON.parse(answeredRaw) as string[]
      answeredIds.push(question.id)
      localStorage.setItem('ae_knowme_answered', JSON.stringify(answeredIds))
      localStorage.setItem('ae_knowme_done', new Date().toISOString().split('T')[0])
      setSaved(true)
    } catch {}
    setSaving(false)
  }

  if (!question) return null

  if (saved) {
    return (
      <Card style={{ marginBottom: '0.8rem' }}>
        <Label color="rgba(212,133,58,0.45)">Know Me</Label>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, fontStyle: 'italic', color: 'rgba(45,184,133,0.45)' }}>
          Today&apos;s question answered ✓
        </p>
      </Card>
    )
  }

  return (
    <Card style={{ marginBottom: '0.8rem' }}>
      <Label color="rgba(212,133,58,0.45)">Know Me</Label>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(15px, 1.8vw, 17px)', color: 'rgba(234,232,242,0.65)', lineHeight: 1.65, marginBottom: '0.7rem' }}>
        {question.question}
      </p>
      <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Take your time..." rows={3}
        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: '#eae8f2', background: 'rgba(234,232,242,0.025)', border: '1px solid rgba(234,232,242,0.07)', borderRadius: 6, padding: '0.75rem 1rem', outline: 'none', lineHeight: 1.65 }}
        onFocus={e => e.currentTarget.style.borderColor = 'rgba(212,133,58,0.2)'}
        onBlur={e => e.currentTarget.style.borderColor = 'rgba(234,232,242,0.07)'} />
      <div style={{ marginTop: '0.5rem' }}>
        <button onClick={saveAnswer} disabled={!answer.trim() || saving} style={{
          fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: !answer.trim() ? 'rgba(234,232,242,0.15)' : 'rgba(212,133,58,0.6)',
          background: 'rgba(212,133,58,0.04)', border: '1px solid rgba(212,133,58,0.15)',
          borderRadius: 4, padding: '9px 18px', cursor: !answer.trim() ? 'default' : 'pointer',
        }}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </Card>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('loading')
  const [data, setData] = useState<DashData | null>(null)
  const [reading, setReading] = useState<FullReading | null>(null)
  const [reflCount, setReflCount] = useState(0)
  const [signOutBusy, setSignOutBusy] = useState(false)
  const [reflText, setReflText] = useState('')
  const [reflPhase, setReflPhase] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [reflError, setReflError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) { router.replace('/auth'); return }
      const { id: userId, email } = session.user
      try {
        const profileId = await linkUserToProfile(userId, email!)
        if (!profileId) { setPhase('empty'); return }
        const { data: profile } = await supabase.from('profiles').select('first_name').eq('id', profileId).single()
        const { data: ps } = await supabase.from('profile_states').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1).maybeSingle()
        if (!ps) { setPhase('empty'); return }
        const state = ps as ProfileState; localStorage.setItem('ae_profile_state_id', state.id)
        const blend = state.archetype_blend as ArchetypeBlendRecord
        const archetype = ARCHETYPES.find(a => a.id === blend?.primary_id) ?? null
        setData({
          firstName: profile?.first_name ?? email!.split('@')[0], userId,
          scores: { aether: state.aether_score, fire: state.fire_score, air: state.air_score, water: state.water_score, earth: state.earth_score },
          coherenceScore: state.coherence_score, archetype, archetypeBlend: blend,
          growthDimension: (state.growth_dimension as Dimension) ?? archetype?.growthDimension ?? null,
          growthEdgeLabel: state.growth_edge_label ?? archetype?.growthEdge ?? null,
          shadowTrigger: state.shadow_trigger ?? archetype?.shadowTrigger ?? null, profileStateId: state.id,
        })
        try { const r = await getLatestFullReading(supabase, userId); if (r) setReading(r) } catch {}
        try {
          const ws = new Date(); ws.setDate(ws.getDate() - ws.getDay()); ws.setHours(0, 0, 0, 0)
          const { count } = await supabase.from('reflections').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', ws.toISOString())
          setReflCount(count ?? 0)
        } catch {}
        setPhase('ready')
      } catch (err) { console.error('[Dashboard]', err); setPhase('error') }
    }
    load()
  }, [router])

  const handleReflSubmit = useCallback(async () => {
    if (!reflText.trim() || reflPhase === 'submitting') return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setReflError('Session expired.'); return }
    setReflPhase('submitting'); setReflError(null)
    try {
      const res = await fetch('/api/reflect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session.user.id, accessToken: session.access_token, content: reflText.trim() }) })
      if (!res.ok) { const t = await res.text(); let msg: string; try { msg = (JSON.parse(t) as { error?: string }).error ?? t } catch { msg = t.slice(0, 200) }; throw new Error(msg) }
      const json = await res.json(); setReading(json.data.reading); setReflText(''); setReflPhase('done'); setReflCount(c => c + 1)
    } catch (err) { setReflError(err instanceof Error ? err.message : 'Something went wrong'); setReflPhase('error') }
  }, [reflText, reflPhase])

  // States
  if (phase === 'loading') return <main style={{ minHeight: '100vh', background: '#06060d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(149,144,236,0.1)', borderTop: '2px solid rgba(149,144,236,0.5)', animation: 'ae-spin 0.9s linear infinite' }} /><style>{`@keyframes ae-spin{to{transform:rotate(360deg)}}`}</style></main>
  if (phase === 'empty') return <main style={{ minHeight: '100vh', background: '#06060d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem' }}><p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 300, color: '#eae8f2', textAlign: 'center' }}>No profile yet.</p><Link href="/onboarding/welcome" style={{ padding: '0.9rem 2rem', borderRadius: 3, border: '1px solid rgba(149,144,236,0.25)', background: 'rgba(149,144,236,0.06)', color: '#eae8f2', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', textDecoration: 'none' }}>Begin Exploration</Link></main>
  if (phase === 'error' || !data) return <main style={{ minHeight: '100vh', background: '#06060d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}><p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: 'rgba(234,232,242,0.4)' }}>Something went wrong.</p><button onClick={() => window.location.reload()} style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: 'rgba(149,144,236,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>Retry →</button></main>

  const { archetype, scores, coherenceScore, growthDimension, shadowTrigger, archetypeBlend, userId } = data
  const growthColor = growthDimension ? DIMENSION_META[growthDimension].color : '#9590ec'
  const guidanceLine = archetype?.practiceOrientation ?? 'Move one meaningful thing forward today.'
  const reflPrompt = reading?.guidance?.reflection_prompt ?? 'What is true about you right now?'

  return (
    <main style={{ minHeight: '100vh', background: '#06060d', color: '#eae8f2' }}>
      <EnergyField size={500} opacity={0.1} color="#9590ec" />
      <style>{`@keyframes ae-spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 1.5rem 4rem', position: 'relative', zIndex: 10 }}>

        {/* ── 1. HEADER + GUIDANCE ── */}
        <div style={{ padding: '2rem 0 0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 300, lineHeight: 1.2, margin: '0 0 0.25rem' }}>{getGreeting()}, {data.firstName}.</h1>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13.5, fontStyle: 'italic', color: 'rgba(234,232,242,0.3)', margin: 0 }}>{archetypeBlend.blend_title}</p>
            </div>
            <button onClick={async () => { setSignOutBusy(true); await supabase.auth.signOut(); router.replace('/') }} disabled={signOutBusy} style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.18)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}>{signOutBusy ? '...' : 'Sign out'}</button>
          </div>
          <div style={{ padding: '1rem 1.2rem', borderLeft: `2px solid ${growthColor}30`, background: `${growthColor}05`, borderRadius: '0 6px 6px 0', marginBottom: '1.2rem' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(15px, 1.8vw, 17px)', color: 'rgba(234,232,242,0.65)', lineHeight: 1.65, margin: 0 }}>{guidanceLine}</p>
            {shadowTrigger && <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, fontStyle: 'italic', color: 'rgba(224,90,58,0.35)', margin: '0.4rem 0 0' }}>Watch for: {shadowTrigger}</p>}
          </div>
        </div>

        {/* ── 2. SPEAK TO TRINITY ── */}
        <div style={{ marginBottom: '0.8rem' }}>
          <VoiceCard
            userId={userId}
            firstName={data.firstName}
            archetype={archetype?.name}
            growthEdge={data.growthEdgeLabel ?? undefined}
            shadowTrigger={shadowTrigger ?? undefined}
          />
        </div>

        {/* ── 3. MEDITATION ── */}
        <div style={{ marginBottom: '0.8rem' }}><MeditationCard /></div>

        {/* ── 4. REFLECTION ── */}
        <Card style={{ marginBottom: '0.8rem' }}>
          <Label>Reflect</Label>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: 'italic', color: 'rgba(234,232,242,0.38)', marginBottom: '0.7rem', lineHeight: 1.6 }}>{reflPrompt}</p>
          <textarea value={reflText} onChange={e => { setReflText(e.target.value); if (reflPhase !== 'idle') setReflPhase('idle') }} placeholder="Write what comes to mind..." rows={4}
            style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box', fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: '#eae8f2', background: 'rgba(234,232,242,0.025)', border: '1px solid rgba(234,232,242,0.07)', borderRadius: 6, padding: '0.75rem 1rem', outline: 'none', lineHeight: 1.65 }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(149,144,236,0.2)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(234,232,242,0.07)'} />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
            <button onClick={handleReflSubmit} disabled={!reflText.trim() || reflPhase === 'submitting'} style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: !reflText.trim() ? 'rgba(234,232,242,0.15)' : '#eae8f2', background: !reflText.trim() ? 'rgba(149,144,236,0.03)' : 'rgba(149,144,236,0.08)', border: '1px solid rgba(149,144,236,0.15)', borderRadius: 4, padding: '9px 18px', cursor: !reflText.trim() ? 'default' : 'pointer' }}>{reflPhase === 'submitting' ? 'Saving...' : 'Save'}</button>
            {reflPhase === 'done' && <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, color: 'rgba(45,184,133,0.5)', fontStyle: 'italic' }}>Saved ✓</span>}
            {reflError && <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, color: 'rgba(224,90,58,0.5)', fontStyle: 'italic' }}>{reflError}</span>}
          </div>
          {/* AI insight after submission */}
          {reading?.guidance && reflPhase === 'done' && (
            <div style={{ marginTop: '0.8rem', padding: '0.8rem 0', borderTop: '1px solid rgba(149,144,236,0.06)' }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: 'rgba(234,232,242,0.5)', lineHeight: 1.65, margin: '0 0 0.4rem' }}>{reading.guidance.what_is_happening}</p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, fontStyle: 'italic', color: 'rgba(149,144,236,0.45)', lineHeight: 1.6, margin: 0 }}>{reading.guidance.what_is_being_asked}</p>
            </div>
          )}
        </Card>

        {/* ── 5. MOVEMENT ── */}
        <div style={{ marginBottom: '0.8rem' }}><MovementCard /></div>

        {/* ── 6. MISSIONS (persistent) ── */}
        <div style={{ marginBottom: '0.8rem' }}><MissionCard userId={userId} /></div>

        {/* ── 7. KNOW ME — daily question ── */}
        <KnowMeCard userId={userId} />

        {/* ── 8. SYSTEM + STREAK ── */}
        <Card style={{ marginBottom: '0.8rem' }}>
          <Label>Your System</Label>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '0.3rem 0 0.8rem' }}>
            <DimensionChart scores={scores as DimensionScores} size={180} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.18)' }}>Coherence</span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: 'rgba(149,144,236,0.5)' }}>{coherenceScore}</span>
          </div>
          {/* Growth Edge + Pattern */}
          {data.growthEdgeLabel && (
            <div style={{ borderTop: '1px solid rgba(149,144,236,0.06)', paddingTop: '0.7rem', marginTop: '0.5rem', marginBottom: '0.6rem' }}>
              <p style={{ fontFamily: "'Cinzel', serif", fontSize: 6.5, letterSpacing: '0.25em', textTransform: 'uppercase', color: `${growthColor}50`, marginBottom: '0.25rem' }}>
                Growth Edge
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: 'rgba(234,232,242,0.45)', lineHeight: 1.5, margin: 0 }}>
                {data.growthEdgeLabel}
              </p>
              {archetype?.coreTension && (
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, fontStyle: 'italic', color: 'rgba(234,232,242,0.25)', marginTop: '0.3rem', margin: '0.3rem 0 0' }}>
                  Pattern: {archetype.coreTension}
                </p>
              )}
            </div>
          )}

          {/* Weekly streak */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {Array.from({ length: 7 }).map((_, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i < reflCount ? 'rgba(149,144,236,0.5)' : 'rgba(234,232,242,0.06)', boxShadow: i < reflCount ? '0 0 5px rgba(149,144,236,0.25)' : 'none' }} />)}
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, color: 'rgba(234,232,242,0.25)', fontStyle: 'italic' }}>{reflCount === 0 ? 'No reflections yet' : `${reflCount} this week`}</span>
          </div>
        </Card>

        {/* ── FOOTER ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '1.2rem 0', borderTop: '1px solid rgba(234,232,242,0.03)' }}>
          <a href="/results" onClick={e => {
            e.preventDefault()
            // Ensure identity guard passes on results page
            if (data) {
              localStorage.setItem('ae_identity', JSON.stringify({ firstName: data.firstName, email: '' }))
              localStorage.setItem('ae_profile_state_id', data.profileStateId)
            }
            router.push('/results')
          }} style={{ fontFamily: "'Cinzel', serif", fontSize: 7.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.2)', textDecoration: 'none', cursor: 'pointer' }}>Full Profile</a>
          <span style={{ color: 'rgba(234,232,242,0.08)' }}>·</span>
          <Link href="/vault" style={{ fontFamily: "'Cinzel', serif", fontSize: 7.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.2)', textDecoration: 'none' }}>Memory Vault</Link>
          <span style={{ color: 'rgba(234,232,242,0.08)' }}>·</span>
          <Link href="/assessment" style={{ fontFamily: "'Cinzel', serif", fontSize: 7.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(234,232,242,0.2)', textDecoration: 'none' }}>Reassess</Link>
        </div>
      </div>
    </main>
  )
}
