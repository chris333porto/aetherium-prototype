'use client'

/**
 * Monday Earth · Practice Player
 *
 * Ten-minute guided practice. Auth-gated. iOS-safe audio (single unlocked
 * <audio> element reused across segments). Timer is the source of truth for
 * segment advance — audio is free to be shorter than the segment window
 * (the gaps are intentional silence).
 *
 * State machine:
 *   auth-checking → idle → segment(0..n)
 *     · segments 0..3 auto-advance on timer
 *     · segment 4 (reflection-prompt) auto-advances to recording
 *     · recording → uploading → segment 5 (reflection-close)
 *     · segment 5 auto-advances to segment 6 (integration)
 *     · segment 6 auto-advances to complete
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  CLOSING_SCREEN,
  PRACTICE_META,
  PRACTICE_SEQUENCE,
  REFLECTION_RECORDING,
  type Segment,
} from './script'

// Indexes into PRACTICE_SEQUENCE (order: opening, meditation, movement,
// contemplation, reflection-prompt, reflection-close, integration)
const REFLECTION_PROMPT_IDX = PRACTICE_SEQUENCE.findIndex(s => s.id === 'reflection-prompt')
const REFLECTION_CLOSE_IDX  = PRACTICE_SEQUENCE.findIndex(s => s.id === 'reflection-close')

// ─── Phase union ─────────────────────────────────────────────────────────────

type Phase =
  | { kind: 'auth-checking' }
  | { kind: 'idle' }
  | { kind: 'segment';   segmentIdx: number; endAt: number }
  | { kind: 'recording'; startedAt: number }
  | { kind: 'uploading' }
  | { kind: 'upload-failed'; message: string }
  | { kind: 'complete' }

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EarthPracticePage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>({ kind: 'auth-checking' })
  const [now,   setNow]   = useState<number>(() => Date.now())

  // Auth state — populated once the session check resolves
  const userIdRef      = useRef<string | null>(null)
  const accessTokenRef = useRef<string | null>(null)

  // One <audio> element, lazily created on the Begin tap. iOS requires the
  // first play() to be inside a user gesture — after that, subsequent src
  // changes + play() on the SAME element are permitted.
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // MediaRecorder + captured blob for the reflection segment
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef   = useRef<Blob[]>([])
  const streamRef   = useRef<MediaStream | null>(null)

  // ── Auth gate ─────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (!session?.user?.id || !session.access_token) {
        // TODO: /auth doesn't currently honor the `redirect` query param —
        // see app/auth/page.tsx. The param is additive & harmless; wire it
        // up properly when the auth page is next touched.
        router.replace('/auth?redirect=/practice/earth')
        return
      }
      userIdRef.current      = session.user.id
      accessTokenRef.current = session.access_token
      setPhase({ kind: 'idle' })
    })
    return () => { cancelled = true }
  }, [router])

  // ── Timer tick (segment + recording displays) ─────────────────────────────

  useEffect(() => {
    if (phase.kind !== 'segment' && phase.kind !== 'recording') return
    const id = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(id)
  }, [phase.kind])

  // ── Segment lifecycle: play audio on enter, auto-advance on timer zero ───

  useEffect(() => {
    if (phase.kind !== 'segment') return

    const segment = PRACTICE_SEQUENCE[phase.segmentIdx]
    const audio   = audioRef.current
    if (audio) {
      audio.src = segment.audioFile
      audio.load()
      audio.play().catch(() => { /* autoplay blocked — segment still advances on timer */ })
    }

    const msLeft = Math.max(0, phase.endAt - Date.now())
    const timeout = setTimeout(() => advanceFromSegment(phase.segmentIdx), msLeft)

    return () => {
      clearTimeout(timeout)
      audio?.pause()
    }
    // `advanceFromSegment` is stable via useCallback below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── Segment advance logic ────────────────────────────────────────────────

  const advanceFromSegment = useCallback((fromIdx: number) => {
    // Reflection prompt → recording
    if (fromIdx === REFLECTION_PROMPT_IDX) {
      startRecording()
      return
    }

    const nextIdx = fromIdx + 1
    // Reflection close is handled via startReflectionClose() after upload;
    // if we got here via timer it means audio played out without upload (shouldn't happen)
    if (nextIdx >= PRACTICE_SEQUENCE.length) {
      setPhase({ kind: 'complete' })
      return
    }
    setPhase({
      kind: 'segment',
      segmentIdx: nextIdx,
      endAt: Date.now() + PRACTICE_SEQUENCE[nextIdx].durationSeconds * 1000,
    })
  }, [])

  // ── Begin (user gesture — unlocks audio on iOS) ──────────────────────────

  const handleBegin = useCallback(() => {
    if (!audioRef.current) audioRef.current = new Audio()
    // Prime with a silent play() attempt on the same gesture — grants
    // permission for subsequent programmatic plays
    audioRef.current.src = PRACTICE_SEQUENCE[0].audioFile
    audioRef.current.play().catch(() => {})
    setPhase({
      kind: 'segment',
      segmentIdx: 0,
      endAt: Date.now() + PRACTICE_SEQUENCE[0].durationSeconds * 1000,
    })
  }, [])

  // ── Recording: MediaRecorder + auto-stop ─────────────────────────────────

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : ''
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null
        uploadReflection(blob)
      }
      recorderRef.current = mr
      mr.start()
      setPhase({ kind: 'recording', startedAt: Date.now() })
    } catch {
      // Mic denied or unavailable — skip recording, advance to reflection-close
      startReflectionClose()
    }
  }, [])

  // Auto-stop at max duration
  useEffect(() => {
    if (phase.kind !== 'recording') return
    const elapsed = now - phase.startedAt
    if (elapsed >= REFLECTION_RECORDING.maxSeconds * 1000) {
      recorderRef.current?.stop()
    }
  }, [phase, now])

  const handleFinishRecording = useCallback(() => {
    recorderRef.current?.stop()
  }, [])

  // ── Upload ────────────────────────────────────────────────────────────────

  const uploadReflection = useCallback(async (blob: Blob) => {
    setPhase({ kind: 'uploading' })

    const userId      = userIdRef.current
    const accessToken = accessTokenRef.current
    if (!userId || !accessToken) {
      // Shouldn't happen — auth gate guarantees these exist before Begin is possible
      setPhase({ kind: 'upload-failed', message: 'Session lost. Recording not saved.' })
      return
    }

    try {
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
      const duration = Math.round(blob.size / (32 * 1024 / 8)) // rough 32kbps estimate; server stores file_size anyway
      const fd = new FormData()
      fd.append('audioBlob', blob, `earth-practice.${ext}`)
      fd.append('userId', userId)
      fd.append('accessToken', accessToken)
      fd.append('durationSeconds', String(Math.min(duration, REFLECTION_RECORDING.maxSeconds)))

      // TODO(v1.1): tag this memo as an Earth practice recording.
      // Option-C plan: pre-create a `reflections` row with content
      // "Earth practice — {YYYY-MM-DD}" and pass its id here as
      // `reflection_id` (new field on /api/audio) so the memo is discoverable.
      // Untagged for v1 — identify by timestamp.
      const res = await fetch('/api/audio', { method: 'POST', body: fd })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text.slice(0, 180))
      }

      startReflectionClose()
    } catch (err) {
      setPhase({
        kind: 'upload-failed',
        message: err instanceof Error ? err.message : 'Upload failed',
      })
    }
  }, [])

  const startReflectionClose = useCallback(() => {
    setPhase({
      kind: 'segment',
      segmentIdx: REFLECTION_CLOSE_IDX,
      endAt: Date.now() + PRACTICE_SEQUENCE[REFLECTION_CLOSE_IDX].durationSeconds * 1000,
    })
  }, [])

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      }
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

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
      <Atmosphere accent={PRACTICE_META.accent} />

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
        <Header phase={phase} />
        <Stage
          phase={phase}
          now={now}
          accent={PRACTICE_META.accent}
          onBegin={handleBegin}
          onFinishRecording={handleFinishRecording}
          onRetryUpload={() => startReflectionClose()}
        />
      </div>
    </main>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({ phase }: { phase: Phase }) {
  const label = headerLabel(phase)
  const idx   = headerIndex(phase)
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 14,
        borderBottom: '1px solid rgba(245,239,228,0.08)',
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
          color: 'rgba(245,239,228,0.5)',
        }}
      >
        {idx ? `${idx} · ` : ''}{label}
      </span>
    </header>
  )
}

function headerLabel(phase: Phase): string {
  switch (phase.kind) {
    case 'auth-checking': return 'Loading'
    case 'idle':          return 'Monday · Earth'
    case 'segment':       return PRACTICE_SEQUENCE[phase.segmentIdx].label
    case 'recording':     return 'Reflection'
    case 'uploading':     return 'Saving'
    case 'upload-failed': return 'Saved locally'
    case 'complete':      return 'Complete'
  }
}

function headerIndex(phase: Phase): string {
  if (phase.kind === 'segment') {
    const n = PRACTICE_SEQUENCE[phase.segmentIdx].displayIndex
    return n !== null ? `0${n}` : ''
  }
  if (phase.kind === 'recording' || phase.kind === 'uploading' || phase.kind === 'upload-failed') return '04'
  return ''
}

// ─── Stage (switches view per phase) ─────────────────────────────────────────

function Stage({
  phase, now, accent, onBegin, onFinishRecording, onRetryUpload,
}: {
  phase: Phase
  now: number
  accent: string
  onBegin: () => void
  onFinishRecording: () => void
  onRetryUpload: () => void
}) {
  switch (phase.kind) {
    case 'auth-checking':
      return <Centered><DotPulse accent={accent} /></Centered>

    case 'idle':
      return <IdleView onBegin={onBegin} accent={accent} />

    case 'segment': {
      const segment = PRACTICE_SEQUENCE[phase.segmentIdx]
      const remainingMs = Math.max(0, phase.endAt - now)
      return <SegmentView segment={segment} remainingMs={remainingMs} accent={accent} />
    }

    case 'recording': {
      const elapsedMs  = now - phase.startedAt
      const canFinish  = elapsedMs >= REFLECTION_RECORDING.minSecondsBeforeFinish * 1000
      const remainingSecs = Math.max(0, REFLECTION_RECORDING.maxSeconds - Math.floor(elapsedMs / 1000))
      return (
        <RecordingView
          elapsedMs={elapsedMs}
          canFinish={canFinish}
          remainingSecs={remainingSecs}
          accent={accent}
          onFinish={onFinishRecording}
        />
      )
    }

    case 'uploading':
      return <Centered><DotPulse accent={accent} /><p style={uploadTextStyle}>Saving your reflection…</p></Centered>

    case 'upload-failed':
      return <UploadFailedView accent={accent} message={phase.message} onContinue={onRetryUpload} />

    case 'complete':
      return <CompleteView accent={accent} />
  }
}

// ─── Idle ────────────────────────────────────────────────────────────────────

function IdleView({ onBegin, accent }: { onBegin: () => void; accent: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: 22,
        paddingTop: 40,
        paddingBottom: 24,
      }}
    >
      <Overline>First Practice · 10 minutes</Overline>
      <h1
        style={{
          fontWeight: 300,
          fontSize: 'clamp(40px, 11vw, 56px)',
          lineHeight: 1.04,
          letterSpacing: '-0.02em',
          margin: 0,
        }}
      >
        Welcome to{' '}
        <em style={{ color: accent, fontStyle: 'italic', fontWeight: 300 }}>Earth</em>.
      </h1>
      <p
        style={{
          fontSize: 16,
          lineHeight: 1.6,
          color: 'rgba(245,239,228,0.65)',
          maxWidth: '30ch',
          margin: 0,
        }}
      >
        Five segments. Meditation, movement, contemplation, reflection,
        integration. Trinity&apos;s voice will guide you. When you&apos;re
        ready — somewhere you can stand and speak aloud — begin.
      </p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 20,
          borderTop: '1px solid rgba(245,239,228,0.1)',
          marginTop: 8,
        }}
      >
        <button
          onClick={onBegin}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            background: '#f5efe4',
            color: '#0f0b1a',
            border: 'none',
            padding: '14px 24px',
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderRadius: 999,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Begin
          <span
            style={{
              width: 14, height: 1, background: '#0f0b1a', position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute', right: -1, top: -3,
                width: 7, height: 7,
                borderTop: '1px solid #0f0b1a', borderRight: '1px solid #0f0b1a',
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
            maxWidth: 140,
          }}
        >
          Headphones<br />recommended
        </span>
      </div>
    </div>
  )
}

// ─── Segment view (timer + headline) ─────────────────────────────────────────

function SegmentView({
  segment, remainingMs, accent,
}: {
  segment: Segment
  remainingMs: number
  accent: string
}) {
  const totalMs = segment.durationSeconds * 1000
  const progress = 1 - remainingMs / totalMs
  const mins = Math.floor(remainingMs / 60000)
  const secs = Math.floor((remainingMs % 60000) / 1000)

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 32,
        paddingTop: 40,
        paddingBottom: 24,
      }}
    >
      {/* Timer ring + clock */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <TimerRing progress={progress} accent={accent} size={180}>
          <span
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              fontSize: 30,
              fontWeight: 300,
              letterSpacing: '0.04em',
              color: 'rgba(245,239,228,0.92)',
            }}
          >
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
        </TimerRing>
      </div>

      {/* Segment text */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 10,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: accent,
            opacity: 0.85,
          }}
        >
          {segment.label}
        </span>
        <h2
          style={{
            fontWeight: 300,
            fontSize: 'clamp(24px, 7vw, 32px)',
            lineHeight: 1.22,
            letterSpacing: '-0.015em',
            margin: 0,
            fontStyle: 'italic',
            color: 'rgba(245,239,228,0.92)',
          }}
        >
          {segment.onScreenHeadline}
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 11,
            letterSpacing: '0.12em',
            color: 'rgba(245,239,228,0.42)',
            margin: 0,
          }}
        >
          {segment.onScreenCaption}
        </p>
      </div>
    </div>
  )
}

// ─── Recording view ──────────────────────────────────────────────────────────

function RecordingView({
  elapsedMs, canFinish, remainingSecs, accent, onFinish,
}: {
  elapsedMs: number
  canFinish: boolean
  remainingSecs: number
  accent: string
  onFinish: () => void
}) {
  const elapsedSecs = Math.floor(elapsedMs / 1000)
  const mm = Math.floor(elapsedSecs / 60)
  const ss = (elapsedSecs % 60).toString().padStart(2, '0')

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 28,
        paddingTop: 40,
        paddingBottom: 24,
        textAlign: 'center',
      }}
    >
      {/* Pulsing mic orb */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: `1.5px solid ${accent}`,
            background: `color-mix(in oklab, ${accent} 12%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'earth-rec-pulse 1.8s ease-in-out infinite',
            boxShadow: `0 0 32px color-mix(in oklab, ${accent} 45%, transparent)`,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              fontSize: 22,
              fontWeight: 300,
              color: accent,
              letterSpacing: '0.04em',
            }}
          >
            {mm}:{ss}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 10,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: accent,
          }}
        >
          Recording
        </span>
        <h2
          style={{
            fontWeight: 300,
            fontSize: 'clamp(22px, 6.5vw, 28px)',
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
            margin: 0,
            fontStyle: 'italic',
          }}
        >
          Speak what you just touched.
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 11,
            letterSpacing: '0.14em',
            color: 'rgba(245,239,228,0.4)',
            margin: 0,
          }}
        >
          {canFinish
            ? `auto-stops in ${remainingSecs}s`
            : `finish unlocks at 0:${REFLECTION_RECORDING.minSecondsBeforeFinish.toString().padStart(2, '0')}`}
        </p>
      </div>

      <button
        onClick={onFinish}
        disabled={!canFinish}
        style={{
          alignSelf: 'center',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          background: canFinish ? '#f5efe4' : 'rgba(245,239,228,0.08)',
          color: canFinish ? '#0f0b1a' : 'rgba(245,239,228,0.28)',
          border: 'none',
          padding: '13px 28px',
          fontFamily: 'var(--font-jetbrains), monospace',
          fontSize: 11,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          cursor: canFinish ? 'pointer' : 'not-allowed',
          borderRadius: 999,
          transition: 'all 0.25s cubic-bezier(0.22,0.61,0.36,1)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Finish
      </button>

      <style>{`
        @keyframes earth-rec-pulse {
          0%, 100% { transform: scale(1);    opacity: 0.9; }
          50%      { transform: scale(1.05); opacity: 1;    }
        }
      `}</style>
    </div>
  )
}

// ─── Upload-failed view ──────────────────────────────────────────────────────

function UploadFailedView({
  accent, message, onContinue,
}: {
  accent: string
  message: string
  onContinue: () => void
}) {
  return (
    <Centered>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, textAlign: 'center', maxWidth: 320 }}>
        <span
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 10,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'rgba(245,239,228,0.5)',
          }}
        >
          Your reflection was captured
        </span>
        <p style={{ fontSize: 18, lineHeight: 1.45, margin: 0, color: 'rgba(245,239,228,0.85)' }}>
          It didn&apos;t save to your profile this time — the practice continues.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 10,
            letterSpacing: '0.1em',
            color: 'rgba(245,239,228,0.35)',
            margin: 0,
          }}
        >
          {message}
        </p>
        <button
          onClick={onContinue}
          style={{
            alignSelf: 'center',
            marginTop: 6,
            background: 'transparent',
            color: accent,
            border: `1px solid ${accent}`,
            padding: '11px 22px',
            fontFamily: 'var(--font-jetbrains), monospace',
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderRadius: 999,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Continue
        </button>
      </div>
    </Centered>
  )
}

// ─── Complete ────────────────────────────────────────────────────────────────

function CompleteView({ accent }: { accent: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 22,
        textAlign: 'center',
      }}
    >
      <span
        style={{
          width: 10, height: 10, borderRadius: '50%',
          background: accent,
          boxShadow: `0 0 18px ${accent}`,
        }}
      />
      <h1
        style={{
          fontWeight: 300,
          fontSize: 'clamp(34px, 9vw, 44px)',
          lineHeight: 1.06,
          letterSpacing: '-0.02em',
          margin: 0,
        }}
      >
        {CLOSING_SCREEN.headline}
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-jetbrains), monospace',
          fontSize: 11,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'rgba(245,239,228,0.5)',
          margin: 0,
        }}
      >
        {CLOSING_SCREEN.caption}
      </p>
      <a
        href="/dashboard"
        style={{
          marginTop: 28,
          color: 'rgba(245,239,228,0.55)',
          textDecoration: 'none',
          fontFamily: 'var(--font-jetbrains), monospace',
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          borderBottom: '1px solid rgba(245,239,228,0.2)',
          paddingBottom: 2,
        }}
      >
        Return to dashboard
      </a>
    </div>
  )
}

// ─── Shared pieces ───────────────────────────────────────────────────────────

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-jetbrains), monospace',
        fontSize: 10,
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color: 'rgba(245,239,228,0.55)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span style={{ width: 28, height: 1, background: 'rgba(245,239,228,0.35)' }} />
      {children}
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
      }}
    >
      {children}
    </div>
  )
}

function DotPulse({ accent }: { accent: string }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: accent, opacity: 0.7,
            animation: 'earth-dot-pulse 1.6s ease-in-out infinite',
            animationDelay: `${i * 0.22}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes earth-dot-pulse {
          0%, 100% { transform: scale(0.85); opacity: 0.3; }
          50%      { transform: scale(1);    opacity: 1;   }
        }
      `}</style>
    </div>
  )
}

function TimerRing({
  progress, accent, size, children,
}: {
  progress: number        // 0..1
  accent:   string
  size:     number
  children: React.ReactNode
}) {
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(245,239,228,0.08)"
          strokeWidth="1.5"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 0.2s linear' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {children}
      </div>
    </div>
  )
}

const uploadTextStyle: React.CSSProperties = {
  fontFamily: 'var(--font-jetbrains), monospace',
  fontSize: 11,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(245,239,228,0.5)',
  marginTop: 12,
}

// ─── Atmosphere (bloom + orb + grain + vignette) ─────────────────────────────

function Atmosphere({ accent }: { accent: string }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '-15%',
          background: `
            radial-gradient(ellipse 55% 70% at 50% 38%,
              color-mix(in oklab, ${accent} 70%, #fff) 0%,
              color-mix(in oklab, ${accent} 45%, #1a1020) 22%,
              transparent 55%),
            radial-gradient(ellipse 120% 70% at 50% 110%,
              color-mix(in oklab, ${accent} 40%, #06050a) 0%,
              transparent 65%)
          `,
          filter: 'blur(42px)',
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '22%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70vw',
          maxWidth: 320,
          aspectRatio: '1 / 1',
          borderRadius: '50%',
          background: `radial-gradient(circle at 50% 45%,
            color-mix(in oklab, ${accent} 35%, #fff) 0%,
            color-mix(in oklab, ${accent} 65%, transparent) 45%,
            transparent 70%)`,
          filter: 'blur(30px)',
          animation: 'earth-orb 9s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          opacity: 0.11,
          mixBlendMode: 'overlay',
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          background: `linear-gradient(180deg,
            rgba(15,11,26,0.50) 0%,
            transparent 20%,
            transparent 55%,
            rgba(15,11,26,0.88) 92%,
            rgba(15,11,26,0.96) 100%)`,
        }}
      />
      <style>{`
        @keyframes earth-orb {
          0%, 100% { transform: translate(-50%, -50%) scale(1);    opacity: 0.85; }
          50%      { transform: translate(-50%, -52%) scale(1.06); opacity: 1;    }
        }
      `}</style>
    </div>
  )
}
