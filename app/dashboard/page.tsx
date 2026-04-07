'use client'

/**
 * dashboard/page.tsx — Desktop V1
 *
 * Full personal operating system layout.
 * All data logic, auth guard, and reflection engine are preserved from the
 * prior version — only the visual layout and mode structure have changed.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter }              from 'next/navigation'
import Link                       from 'next/link'
import { supabase }               from '@/lib/supabase'
import { linkUserToProfile }      from '@/lib/persistence/profiles'
import { getLatestFullReading }   from '@/lib/persistence/reflections'
import { DIMENSION_META, DIMENSIONS_ORDER } from '@/lib/assessment/questions'
import type { Dimension }         from '@/lib/assessment/questions'
import type { ArchetypeBlendRecord, ProfileState } from '@/lib/supabase'
import type { FullReading }       from '@/lib/persistence/reflections'
import { ARCHETYPES }             from '@/lib/archetypes/definitions'
import { getRole }                from '@/lib/canon'
import type { RoleDefinition }    from '@/lib/types/canon'

// ── Types ─────────────────────────────────────────────────────────────────────

type DashData = {
  firstName:          string
  assessmentDate:     string
  profileStateId:     string
  archetypeBlend:     ArchetypeBlendRecord
  scores:             Record<Dimension, number>
  deficientDimension: Dimension | null
  practices:          string[]
  canonRole:          RoleDefinition | null
}

type Phase = 'loading' | 'ready' | 'empty' | 'error'
type Mode  = 'reflect' | 'execute' | 'clarity' | 'practice' | 'learn' | 'present'

// ── Constants ─────────────────────────────────────────────────────────────────

// Maps framework rite names → operating-mode display labels
const RITE_LABEL: Record<string, string> = {
  ORIGIN:       'Inheritor',
  AWAKENING:    'Seeker',
  INITIATION:   'Initiator',
  CROSSING:     'Threshold Crosser',
  ORDEAL:       'Fighter',
  SURRENDER:    'Releaser',
  ILLUMINATION: 'Illuminated',
  OFFERING:     'Giver',
  EMBODIMENT:   'Embodied',
}

// Pentagon radar chart — top = Aether, clockwise
const RADAR_AXES: { key: Dimension; label: string; angle: number }[] = [
  { key: 'aether', label: 'INTENTION', angle: -90 },
  { key: 'fire',   label: 'VOLITION',  angle: -18 },
  { key: 'earth',  label: 'ACTION',    angle:  54 },
  { key: 'water',  label: 'EMOTION',   angle: 126 },
  { key: 'air',    label: 'COGNITION', angle: 198 },
]

// Maps element dimension → framework state dimension
const DIM_MAP = {
  water:  'emotion',
  fire:   'volition',
  air:    'cognition',
  earth:  'action',
  aether: 'intention',
} as const

// Mock time allocation (no real tracking yet)
const TIME_MODES = [
  { label: 'Practice', time: '1h 15m', pct: 25, color: '#9590ec' },
  { label: 'Reflect',  time: '30m',    pct: 10, color: '#4a9fd4' },
  { label: 'Execute',  time: '5h 20m', pct: 67, color: '#2db885' },
  { label: 'Learn',    time: '1h 40m', pct: 33, color: '#d4853a' },
  { label: 'Present',  time: '0h',     pct: 0,  color: '#e05a3a' },
  { label: 'Connect',  time: '1h',     pct: 20, color: '#9590ec' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  const [phase,       setPhase]       = useState<Phase>('loading')
  const [data,        setData]        = useState<DashData | null>(null)
  const [signOutBusy, setSignOutBusy] = useState(false)
  const [activeMode,  setActiveMode]  = useState<Mode>('reflect')

  // Reflection engine state
  const [reading,          setReading]          = useState<FullReading | null>(null)
  const [riteExplanation,  setRiteExplanation]  = useState<string | null>(null)
  const [stageExplanation, setStageExplanation] = useState<string | null>(null)
  const [reflectionText,   setReflectionText]   = useState('')
  const [reflectPhase,     setReflectPhase]     = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [reflectError,     setReflectError]     = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Execute panel state (mock until agent layer is built)
  const [execInput, setExecInput] = useState('')
  const [execPlan,  setExecPlan]  = useState<string[] | null>(null)

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      // 1. Auth guard
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) {
        router.replace('/auth')
        return
      }

      const { id: userId, email } = session.user

      try {
        // 2. Stitch auth.users.id → profiles row (idempotent)
        const profileId = await linkUserToProfile(userId, email!)

        if (!profileId) {
          setPhase('empty')
          return
        }

        // 3. Fetch profile display name
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', profileId)
          .single()

        // 4. Fetch latest profile_states row
        const { data: psRaw } = await supabase
          .from('profile_states')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const ps = psRaw as ProfileState | null

        if (!ps) {
          setPhase('empty')
          return
        }

        localStorage.setItem('ae_profile_state_id', ps.id)

        const primaryArchetype = ARCHETYPES.find(
          a => a.id === (ps.archetype_blend as ArchetypeBlendRecord | null)?.primary_id
        )
        const canonRole = primaryArchetype
          ? getRole(primaryArchetype.canonicalRoleId)
          : null

        setData({
          firstName:          profile?.first_name ?? email!.split('@')[0],
          assessmentDate:     ps.created_at,
          profileStateId:     ps.id,
          archetypeBlend:     ps.archetype_blend,
          scores: {
            earth:  ps.earth_score,
            water:  ps.water_score,
            air:    ps.air_score,
            fire:   ps.fire_score,
            aether: ps.aether_score,
          },
          deficientDimension: (ps.deficient_dimension as Dimension | null) ?? null,
          practices:          ps.practices ?? [],
          canonRole,
        })

        // 5. Fetch latest framework reading (non-fatal if absent)
        try {
          const latestReading = await getLatestFullReading(supabase, userId)
          if (latestReading) setReading(latestReading)
        } catch {
          // Dashboard works fine without a prior reading
        }

        setPhase('ready')
      } catch (err) {
        console.error('[Aetherium] Dashboard load error:', err)
        setPhase('error')
      }
    }

    load()
  }, [router])

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleSignOut() {
    setSignOutBusy(true)
    await supabase.auth.signOut()
    router.replace('/')
  }

  function handleViewResults() {
    if (!data) return
    localStorage.setItem('ae_profile_state_id', data.profileStateId)
    router.push('/results')
  }

  async function handleReflectionSubmit() {
    if (!reflectionText.trim() || reflectPhase === 'submitting') return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setReflectError('Session expired — please sign in again.'); return }

    setReflectPhase('submitting')
    setReflectError(null)

    try {
      const res = await fetch('/api/reflect', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          userId:      session.user.id,
          accessToken: session.access_token,
          content:     reflectionText.trim(),
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        let msg: string
        try { msg = (JSON.parse(text) as { error?: string }).error ?? text } catch { msg = text.slice(0, 300) }
        throw new Error(msg)
      }
      const json = await res.json()

      setReading(json.data.reading)
      setRiteExplanation(json.data.analysis?.rite_explanation  ?? null)
      setStageExplanation(json.data.analysis?.stage_explanation ?? null)
      setReflectionText('')
      setReflectPhase('done')
    } catch (err) {
      setReflectError(err instanceof Error ? err.message : 'Something went wrong')
      setReflectPhase('error')
    }
  }

  function handleExecutePlan() {
    if (!execInput.trim()) return
    setExecPlan([
      `Define the objective: ${execInput.trim().slice(0, 60)}${execInput.trim().length > 60 ? '…' : ''}`,
      'Identify the first concrete action step.',
      'Review and refine before executing.',
    ])
  }

  // ── Shared styles ─────────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    background:   'rgba(149,144,236,0.03)',
    border:       '1px solid rgba(149,144,236,0.09)',
    borderRadius: 10,
    padding:      '1.5rem 1.75rem',
  }

  const eyebrow: React.CSSProperties = {
    fontFamily:    "'Cinzel', serif",
    fontSize:      7,
    letterSpacing: '0.45em',
    textTransform: 'uppercase' as const,
    color:         'rgba(149,144,236,0.45)',
    marginBottom:  '0.5rem',
  }

  const sectionTitle: React.CSSProperties = {
    fontFamily:    "'Cormorant Garamond', serif",
    fontSize:      'clamp(20px, 2.4vw, 28px)',
    fontWeight:    300,
    color:         '#eae8f2',
    letterSpacing: '-0.01em',
    lineHeight:    1.2,
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <main style={{ minHeight: '100vh', background: '#06060d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '2px solid rgba(149,144,236,0.12)',
          borderTop: '2px solid rgba(149,144,236,0.55)',
          animation: 'ae-spin 0.9s linear infinite',
        }} />
        <style>{`@keyframes ae-spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    )
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (phase === 'empty') {
    return (
      <main style={{
        minHeight: '100vh', background: '#06060d',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '1.5rem', padding: '2rem',
      }}>
        <p style={{ ...eyebrow, marginBottom: 0 }}>Aetherium</p>
        <h1 style={{ ...sectionTitle, textAlign: 'center', maxWidth: 440, fontSize: 'clamp(28px, 4vw, 44px)' }}>
          No saved profile yet.
        </h1>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: 16,
          color: 'rgba(234,232,242,0.4)', fontStyle: 'italic',
          textAlign: 'center', maxWidth: 380, lineHeight: 1.75,
        }}>
          Complete the assessment to initialize your system.
        </p>
        <Link href="/onboarding/welcome" style={{
          marginTop: '0.5rem', padding: '0.9rem 2rem', borderRadius: 28,
          border: '1px solid rgba(149,144,236,0.35)',
          background: 'rgba(83,74,183,0.14)', color: '#9590ec',
          fontFamily: "'Cinzel', serif", fontSize: 10,
          letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none',
        }}>
          Begin Your Assessment
        </Link>
        <style>{`@keyframes ae-spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (phase === 'error' || !data) {
    return (
      <main style={{
        minHeight: '100vh', background: '#06060d',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '1rem',
      }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontStyle: 'italic', color: 'rgba(234,232,242,0.4)' }}>
          Something went wrong loading your profile.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.14em', color: 'rgba(149,144,236,0.55)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Try again →
        </button>
        <style>{`@keyframes ae-spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    )
  }

  // ── Ready ─────────────────────────────────────────────────────────────────

  const { archetypeBlend, scores, deficientDimension, practices, firstName, canonRole } = data

  // Primary Vector: next steps joined as directive, or fallback
  const primaryVector =
    reading?.guidance?.next_steps_json?.slice(0, 3).join(' → ')
    ?? (deficientDimension
        ? `Develop ${DIMENSION_META[deficientDimension].label.toLowerCase()} · ${DIMENSION_META[deficientDimension].subtitle}`
        : archetypeBlend.blend_title)

  // Radar chart geometry (200×200 viewBox, radius 80)
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const radarPoints = RADAR_AXES.map(({ key, angle }) => {
    const r   = ((scores[key] ?? 0) / 100) * 80
    return { x: 100 + r * Math.cos(toRad(angle)), y: 100 + r * Math.sin(toRad(angle)) }
  })
  const gridRings = [20, 40, 60, 80].map(r =>
    RADAR_AXES.map(({ angle }) =>
      `${(100 + r * Math.cos(toRad(angle))).toFixed(1)},${(100 + r * Math.sin(toRad(angle))).toFixed(1)}`
    ).join(' ')
  )

  // System Alignment: map element dimension → framework state entry
  const alignmentKey  = deficientDimension ? DIM_MAP[deficientDimension] : undefined
  const alignmentState = (reading?.state_json && alignmentKey)
    ? reading.state_json[alignmentKey]
    : null

  return (
    <main style={{ minHeight: '100vh', background: '#06060d', color: '#eae8f2' }}>

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 0%, rgba(149,144,236,0.07), transparent 55%)',
      }} />

      <style>{`@keyframes ae-spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.85rem 2.5rem',
        borderBottom: '1px solid rgba(149,144,236,0.08)',
        background: 'rgba(6,6,13,0.92)',
        backdropFilter: 'blur(16px)',
      }}>
        <Link href="/" style={{
          fontFamily: "'Cinzel', serif", fontSize: 11,
          letterSpacing: '0.22em', color: 'rgba(234,232,242,0.55)',
          textDecoration: 'none',
        }}>
          Aetherium
        </Link>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: '0' }}>
          {(['practice', 'reflect', 'clarity', 'execute', 'learn'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setActiveMode(m)}
              style={{
                fontFamily:    "'Cinzel', serif",
                fontSize:      8,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                padding:       '0.45rem 0.95rem',
                background:    'transparent',
                border:        'none',
                borderBottom:  activeMode === m
                               ? '1px solid rgba(149,144,236,0.6)'
                               : '1px solid transparent',
                color:         activeMode === m
                               ? '#9590ec'
                               : 'rgba(234,232,242,0.30)',
                cursor:        'pointer',
                transition:    'color 0.2s, border-color 0.2s',
              }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <button
          onClick={handleSignOut}
          disabled={signOutBusy}
          style={{
            fontFamily: "'Cinzel', serif", fontSize: 8,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'rgba(234,232,242,0.28)', background: 'none',
            border: 'none', cursor: signOutBusy ? 'not-allowed' : 'pointer',
            opacity: signOutBusy ? 0.5 : 1,
          }}
        >
          {signOutBusy ? 'Signing out…' : 'Sign Out'}
        </button>
      </nav>

      {/* ── Page body ────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 2.5rem 6rem' }}>

        {/* ── HEADER ─────────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem',
        }}>
          <div>
            <p style={{ ...eyebrow, marginBottom: '0.4rem' }}>
              <span style={{
                display: 'inline-block', width: 6, height: 6,
                borderRadius: '50%', background: '#2db885',
                marginRight: 8, verticalAlign: 'middle',
              }} />
              Aetherium
            </p>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(28px, 3.5vw, 46px)',
              fontWeight: 300, letterSpacing: '-0.015em',
              lineHeight: 1.1, color: '#eae8f2', marginBottom: '0.3rem',
            }}>
              Welcome back, {firstName}.
            </h1>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 14, fontStyle: 'italic',
              color: 'rgba(234,232,242,0.28)',
            }}>
              System active
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={handleViewResults}
              style={{
                padding: '0.65rem 1.4rem', borderRadius: 24,
                border: '1px solid rgba(149,144,236,0.28)',
                background: 'rgba(83,74,183,0.10)', color: 'rgba(149,144,236,0.75)',
                fontFamily: "'Cinzel', serif", fontSize: 8,
                letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              View Full Results
            </button>
            <Link href="/onboarding/welcome" style={{
              padding: '0.65rem 1.4rem', borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'transparent', color: 'rgba(234,232,242,0.28)',
              fontFamily: "'Cinzel', serif", fontSize: 8,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
            }}>
              New Assessment
            </Link>
          </div>
        </div>

        {/* ── SECTION 2: System State (left 7) + Identity (right 5) ─────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '7fr 5fr',
          gap: '1.25rem',
          marginBottom: '1.25rem',
          alignItems: 'start',
        }}>

          {/* LEFT: System State */}
          <div style={card}>
            <p style={eyebrow}>System State</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.2rem' }}>
              {DIMENSIONS_ORDER.map(dim => {
                const meta  = DIMENSION_META[dim]
                const score = scores[dim] ?? 0
                const isEdge = dim === deficientDimension
                return (
                  <div key={dim}>
                    <div style={{
                      display: 'flex', alignItems: 'baseline',
                      justifyContent: 'space-between', marginBottom: '0.22rem',
                    }}>
                      <span style={{
                        fontFamily: "'Cinzel', serif", fontSize: 7,
                        letterSpacing: '0.22em', textTransform: 'uppercase',
                        color: isEdge ? meta.color : 'rgba(234,232,242,0.38)',
                      }}>
                        {meta.label}{isEdge ? ' · growth edge' : ''}
                      </span>
                      <span style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 13, fontStyle: 'italic',
                        color: 'rgba(234,232,242,0.30)',
                      }}>
                        {score}
                      </span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${score}%`, borderRadius: 2,
                        background: isEdge ? meta.color : `${meta.color}80`,
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Active Development Zone */}
            {deficientDimension && (
              <div style={{
                marginTop: '1.4rem', paddingTop: '1.2rem',
                borderTop: '1px solid rgba(149,144,236,0.07)',
              }}>
                <p style={{ ...eyebrow, fontSize: 6.5, marginBottom: '0.4rem' }}>Active Development Zone</p>
                <p style={{ ...sectionTitle, fontSize: 20, marginBottom: '0.2rem' }}>
                  {DIMENSION_META[deficientDimension].label}
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 14, fontStyle: 'italic',
                    color: 'rgba(234,232,242,0.35)', marginLeft: 10,
                  }}>
                    — {DIMENSION_META[deficientDimension].subtitle}
                  </span>
                </p>
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 14, fontStyle: 'italic',
                  color: 'rgba(234,232,242,0.30)', lineHeight: 1.65,
                }}>
                  {DIMENSION_META[deficientDimension].description}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Identity + Radar + Tension */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Identity card */}
            <div style={card}>
              <p style={eyebrow}>Identity</p>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(18px, 2vw, 24px)',
                fontWeight: 300, color: '#eae8f2',
                letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: '0.65rem',
              }}>
                {archetypeBlend.blend_title}
              </p>

              {/* Blend pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.9rem' }}>
                {(
                  [
                    { name: archetypeBlend.primary_name,   pct: archetypeBlend.primary_pct,   op: 1 },
                    { name: archetypeBlend.secondary_name, pct: archetypeBlend.secondary_pct, op: 0.55 },
                    { name: archetypeBlend.tertiary_name,  pct: archetypeBlend.tertiary_pct,  op: 0.35 },
                  ] as { name: string; pct: number; op: number }[]
                ).map(a => (
                  <span key={a.name} style={{
                    fontFamily: "'Cinzel', serif", fontSize: 7,
                    letterSpacing: '0.12em',
                    padding: '0.25rem 0.65rem', borderRadius: 20,
                    border: '1px solid rgba(149,144,236,0.16)',
                    color: `rgba(149,144,236,${a.op})`,
                    whiteSpace: 'nowrap',
                  }}>
                    {a.name} · {a.pct}%
                  </span>
                ))}
              </div>

              {/* Canon role */}
              {canonRole && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: "'Cinzel', serif", fontSize: 6.5,
                    letterSpacing: '0.38em', textTransform: 'uppercase',
                    color: 'rgba(149,144,236,0.28)',
                  }}>
                    Role
                  </span>
                  <span style={{
                    fontFamily: "'Cinzel', serif", fontSize: 8.5,
                    letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: 'rgba(149,144,236,0.82)',
                    padding: '2px 8px',
                    border: '1px solid rgba(149,144,236,0.22)', borderRadius: 3,
                  }}>
                    {canonRole.name}
                  </span>
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 13, fontStyle: 'italic',
                    color: 'rgba(234,232,242,0.28)',
                  }}>
                    {canonRole.tagline}
                  </span>
                </div>
              )}
            </div>

            {/* System Tension — only when a reading exists */}
            {reading && canonRole && (
              <div style={{ ...card, borderColor: 'rgba(224,90,58,0.12)' }}>
                <p style={eyebrow}>System Tension</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <div>
                    <p style={{
                      fontFamily: "'Cinzel', serif", fontSize: 6.5,
                      letterSpacing: '0.3em', textTransform: 'uppercase',
                      color: 'rgba(234,232,242,0.2)', marginBottom: '0.18rem',
                    }}>
                      Operating as
                    </p>
                    <p style={{
                      fontFamily: "'Cinzel', serif", fontSize: 8.5,
                      letterSpacing: '0.18em',
                      color: 'rgba(224,90,58,0.78)',
                    }}>
                      → {RITE_LABEL[reading.rite] ?? reading.rite} (current)
                    </p>
                  </div>
                  <div>
                    <p style={{
                      fontFamily: "'Cinzel', serif", fontSize: 6.5,
                      letterSpacing: '0.3em', textTransform: 'uppercase',
                      color: 'rgba(234,232,242,0.2)', marginBottom: '0.18rem',
                    }}>
                      Baseline
                    </p>
                    <p style={{
                      fontFamily: "'Cinzel', serif", fontSize: 8.5,
                      letterSpacing: '0.18em',
                      color: 'rgba(149,144,236,0.72)',
                    }}>
                      → {canonRole.name}
                    </p>
                  </div>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 13, fontStyle: 'italic',
                    color: 'rgba(234,232,242,0.32)', lineHeight: 1.6, marginTop: '0.15rem',
                  }}>
                    → {canonRole.growth_edge}
                  </p>
                </div>
              </div>
            )}

            {/* Dimensional radar */}
            <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.25rem' }}>
              <p style={{ ...eyebrow, alignSelf: 'flex-start', marginBottom: '0.9rem' }}>Dimensional Profile</p>
              <svg viewBox="0 0 200 200" width="100%" style={{ maxWidth: 200, overflow: 'visible' }}>
                {/* Grid rings */}
                {gridRings.map((pts, i) => (
                  <polygon key={i} points={pts} fill="none"
                    stroke="rgba(149,144,236,0.07)" strokeWidth="1" />
                ))}
                {/* Axis lines */}
                {RADAR_AXES.map(({ angle, key }) => (
                  <line
                    key={key}
                    x1="100" y1="100"
                    x2={(100 + 80 * Math.cos(toRad(angle))).toFixed(1)}
                    y2={(100 + 80 * Math.sin(toRad(angle))).toFixed(1)}
                    stroke="rgba(149,144,236,0.06)" strokeWidth="1"
                  />
                ))}
                {/* Score polygon */}
                <polygon
                  points={radarPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
                  fill="rgba(149,144,236,0.11)"
                  stroke="rgba(149,144,236,0.5)"
                  strokeWidth="1.5"
                />
                {/* Vertex dots */}
                {radarPoints.map((p, i) => (
                  <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
                    r="2.5" fill="rgba(149,144,236,0.75)" />
                ))}
                {/* Axis labels */}
                {RADAR_AXES.map(({ angle, label, key }) => {
                  const lx = 100 + 96 * Math.cos(toRad(angle))
                  const ly = 100 + 96 * Math.sin(toRad(angle))
                  return (
                    <text key={key} x={lx.toFixed(1)} y={ly.toFixed(1)}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="5.5" fontFamily="'Cinzel', serif" letterSpacing="0.8"
                      fill={key === deficientDimension ? DIMENSION_META[key].color : 'rgba(234,232,242,0.38)'}
                    >
                      {label}
                    </text>
                  )
                })}
                {/* Score labels near vertices */}
                {RADAR_AXES.map(({ angle, key }) => {
                  const score = scores[key] ?? 0
                  const r  = (score / 100) * 80
                  const sx = 100 + (r + 11) * Math.cos(toRad(angle))
                  const sy = 100 + (r + 11) * Math.sin(toRad(angle))
                  return (
                    <text key={`s-${key}`} x={sx.toFixed(1)} y={sy.toFixed(1)}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="6.5" fontFamily="'Cormorant Garamond', serif"
                      fill="rgba(234,232,242,0.45)"
                    >
                      {score}
                    </text>
                  )
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* ── PRIMARY VECTOR ───────────────────────────────────────────────────── */}
        <div style={{
          ...card,
          borderColor: 'rgba(149,144,236,0.14)',
          background:  'rgba(83,74,183,0.04)',
          textAlign:   'center',
          padding:     '1.5rem 3rem',
          marginBottom: '1.5rem',
          position:    'relative',
          overflow:    'hidden',
        }}>
          <div style={{
            position: 'absolute', left: '1.75rem', top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(149,144,236,0.18)',
            fontFamily: "'Cinzel', serif", fontSize: 20, lineHeight: 1,
          }}>→</div>
          <div style={{
            position: 'absolute', right: '1.75rem', top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(149,144,236,0.18)',
            fontFamily: "'Cinzel', serif", fontSize: 20, lineHeight: 1,
          }}>→</div>

          <p style={{ ...eyebrow, marginBottom: '0.55rem' }}>Primary Vector</p>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(17px, 2.2vw, 24px)',
            fontWeight: 300, letterSpacing: '0.01em',
            color: '#eae8f2', lineHeight: 1.45,
          }}>
            {primaryVector}
          </p>
          {reading && (
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 12, fontStyle: 'italic',
              color: 'rgba(234,232,242,0.22)',
              marginTop: '0.45rem',
            }}>
              {reading.rite} · {reading.stage} · {reading.rite_confidence} confidence
            </p>
          )}
        </div>

        {/* ── MODE LAUNCHER ────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
          padding: '0.65rem 0.75rem',
          background: 'rgba(255,255,255,0.015)',
          borderRadius: 10,
          border: '1px solid rgba(149,144,236,0.07)',
          marginBottom: '1.75rem',
        }}>
          {(['practice', 'reflect', 'clarity', 'execute', 'learn', 'present'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setActiveMode(m)}
              style={{
                fontFamily:    "'Cinzel', serif",
                fontSize:      7.5,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                padding:       '0.55rem 1.1rem',
                borderRadius:  20,
                border:        activeMode === m
                               ? '1px solid rgba(149,144,236,0.45)'
                               : '1px solid rgba(149,144,236,0.10)',
                background:    activeMode === m
                               ? 'rgba(83,74,183,0.18)'
                               : 'transparent',
                color:         activeMode === m
                               ? '#9590ec'
                               : 'rgba(234,232,242,0.30)',
                cursor:        'pointer',
                transition:    'all 0.2s ease',
              }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* ── MODE: REFLECT ─────────────────────────────────────────────────── */}
        {activeMode === 'reflect' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '8fr 4fr',
            gap: '1.25rem',
            marginBottom: '1.5rem',
            alignItems: 'start',
          }}>
            {/* Left: reflection input + reading output */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Input card */}
              <div style={card}>
                <p style={eyebrow}>Reflect</p>
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 15, fontStyle: 'italic',
                  color: 'rgba(234,232,242,0.28)', lineHeight: 1.7,
                  marginBottom: '1rem',
                }}>
                  {reading?.guidance?.reflection_prompt
                    ? `"${reading.guidance.reflection_prompt}"`
                    : 'What is alive in you right now?'}
                </p>
                <textarea
                  ref={textareaRef}
                  value={reflectionText}
                  onChange={e => { setReflectionText(e.target.value); setReflectPhase('idle') }}
                  placeholder="Write freely…"
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(149,144,236,0.12)',
                    borderRadius: 6, padding: '0.85rem 1rem',
                    color: 'rgba(234,232,242,0.75)',
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 15, lineHeight: 1.7,
                    resize: 'vertical', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {reflectError && (
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 13, fontStyle: 'italic',
                    color: '#e05a3a', marginTop: '0.5rem',
                  }}>
                    {reflectError}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                  <button
                    onClick={handleReflectionSubmit}
                    disabled={reflectPhase === 'submitting' || !reflectionText.trim()}
                    style={{
                      padding: '0.65rem 1.5rem', borderRadius: 24,
                      border: '1px solid rgba(149,144,236,0.35)',
                      background: reflectPhase === 'submitting'
                                  ? 'rgba(83,74,183,0.04)' : 'rgba(83,74,183,0.14)',
                      color: reflectPhase === 'submitting'
                             ? 'rgba(149,144,236,0.3)' : '#9590ec',
                      fontFamily: "'Cinzel', serif", fontSize: 8,
                      letterSpacing: '0.18em', textTransform: 'uppercase',
                      cursor: reflectPhase === 'submitting' || !reflectionText.trim()
                              ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {reflectPhase === 'submitting' ? 'Analyzing…' : 'Submit Reflection'}
                  </button>
                </div>
              </div>

              {/* Reading output */}
              {reading && (
                <div style={card}>
                  <p style={eyebrow}>Interpretation</p>

                  {/* Context + Stage badges */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {[
                      { label: 'Context', value: reading.rite,  conf: reading.rite_confidence,  expl: riteExplanation },
                      { label: 'Stage',   value: reading.stage, conf: reading.stage_confidence, expl: stageExplanation },
                    ].map(item => (
                      <div key={item.label} style={{
                        flex: '1 1 140px',
                        padding: '0.65rem 1rem', borderRadius: 6,
                        border: '1px solid rgba(149,144,236,0.14)',
                        background: 'rgba(149,144,236,0.04)',
                      }}>
                        <p style={{ ...eyebrow, fontSize: 6.5, marginBottom: '0.22rem' }}>{item.label}</p>
                        <p style={{
                          fontFamily: "'Cinzel', serif", fontSize: 9.5,
                          letterSpacing: '0.14em', color: '#eae8f2',
                          marginBottom: item.expl ? '0.4rem' : 0,
                        }}>
                          {item.value}
                          <span style={{ color: 'rgba(149,144,236,0.38)', marginLeft: 6, fontSize: 7 }}>
                            {item.conf}
                          </span>
                        </p>
                        {item.expl && (
                          <p style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: 13, fontStyle: 'italic',
                            color: 'rgba(234,232,242,0.35)', lineHeight: 1.6,
                          }}>
                            {item.expl}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* State label — compact chips */}
                  {reading.state_json && Object.keys(reading.state_json).length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ ...eyebrow, fontSize: 6.5, marginBottom: '0.5rem' }}>State</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {(['intention', 'volition', 'cognition', 'emotion', 'action'] as const).map(dim => {
                          const d = reading.state_json[dim]
                          if (!d) return null
                          const isComp = d.quality === 'compromised'
                          return (
                            <div key={dim} style={{
                              flex: '1 1 110px',
                              padding: '0.45rem 0.7rem', borderRadius: 5,
                              background: isComp ? 'rgba(224,90,58,0.05)' : 'rgba(149,144,236,0.04)',
                              border: `1px solid ${isComp ? 'rgba(224,90,58,0.12)' : 'rgba(149,144,236,0.08)'}`,
                            }}>
                              <span style={{
                                fontFamily: "'Cinzel', serif", fontSize: 6.5,
                                letterSpacing: '0.2em', textTransform: 'uppercase',
                                color: isComp ? 'rgba(224,90,58,0.7)' : 'rgba(149,144,236,0.6)',
                                display: 'block', marginBottom: '0.2rem',
                              }}>
                                {dim}
                              </span>
                              <span style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: 12, color: 'rgba(234,232,242,0.45)', lineHeight: 1.4,
                              }}>
                                {d.level} · {d.quality}
                              </span>
                              {d.note && (
                                <p style={{
                                  fontFamily: "'Cormorant Garamond', serif",
                                  fontSize: 12, fontStyle: 'italic',
                                  color: 'rgba(234,232,242,0.35)',
                                  margin: '0.2rem 0 0', lineHeight: 1.5,
                                }}>
                                  {d.note}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Guidance */}
                  {reading.guidance && (
                    <div style={{ borderTop: '1px solid rgba(149,144,236,0.07)', paddingTop: '1rem' }}>
                      {reading.guidance.what_is_happening && (
                        <div style={{ marginBottom: '0.9rem' }}>
                          <p style={{ ...eyebrow, fontSize: 6.5, marginBottom: '0.35rem' }}>What is Happening</p>
                          <p style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: 15, lineHeight: 1.75, color: 'rgba(234,232,242,0.58)',
                          }}>
                            {reading.guidance.what_is_happening}
                          </p>
                        </div>
                      )}
                      {reading.guidance.what_is_being_asked && (
                        <div style={{ marginBottom: '0.9rem' }}>
                          <p style={{ ...eyebrow, fontSize: 6.5, marginBottom: '0.35rem' }}>What is Being Asked</p>
                          <p style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: 15, lineHeight: 1.75, color: 'rgba(234,232,242,0.58)',
                          }}>
                            {reading.guidance.what_is_being_asked}
                          </p>
                        </div>
                      )}
                      {(reading.guidance.next_steps_json?.length ?? 0) > 0 && (
                        <div style={{ marginBottom: '0.9rem' }}>
                          <p style={{ ...eyebrow, fontSize: 6.5, marginBottom: '0.45rem' }}>Next Steps</p>
                          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {(reading.guidance.next_steps_json ?? []).map((step, i) => (
                              <li key={i} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                                <span style={{
                                  fontFamily: "'Cinzel', serif", fontSize: 7.5,
                                  letterSpacing: '0.1em',
                                  color: 'rgba(149,144,236,0.38)',
                                  paddingTop: '0.15rem', flexShrink: 0, minWidth: 16,
                                }}>
                                  {String(i + 1).padStart(2, '0')}
                                </span>
                                <span style={{
                                  fontFamily: "'Cormorant Garamond', serif",
                                  fontSize: 15, lineHeight: 1.65, color: 'rgba(234,232,242,0.65)',
                                }}>
                                  — {step}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {reading.guidance.reflection_prompt && (
                        <div style={{
                          padding: '0.85rem 1rem', borderRadius: 6,
                          border: '1px solid rgba(149,144,236,0.12)',
                          background: 'rgba(149,144,236,0.03)',
                        }}>
                          <p style={{ ...eyebrow, fontSize: 6.5, marginBottom: '0.3rem' }}>Reflection Prompt</p>
                          <p style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: 15, fontStyle: 'italic',
                            color: 'rgba(234,232,242,0.6)', lineHeight: 1.7,
                          }}>
                            &ldquo;{reading.guidance.reflection_prompt}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 11, fontStyle: 'italic',
                    color: 'rgba(234,232,242,0.14)',
                    marginTop: '0.85rem', textAlign: 'right',
                  }}>
                    {new Intl.DateTimeFormat('en-US', {
                      month: 'short', day: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    }).format(new Date(reading.created_at))}
                  </p>
                </div>
              )}
            </div>

            {/* Right: System Alignment + Practices (sticky) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '5rem' }}>
              {deficientDimension && (
                <div style={{
                  ...card,
                  borderColor: `${DIMENSION_META[deficientDimension].color}22`,
                }}>
                  <p style={eyebrow}>System Alignment</p>
                  <p style={{ ...sectionTitle, fontSize: 18, marginBottom: '0.2rem' }}>
                    Growth Edge — {DIMENSION_META[deficientDimension].label}
                  </p>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 14, fontStyle: 'italic',
                    color: 'rgba(234,232,242,0.32)', lineHeight: 1.65,
                    marginBottom: '0.85rem',
                  }}>
                    {DIMENSION_META[deficientDimension].description}
                  </p>

                  {/* Impact from framework state */}
                  {alignmentState && (
                    <div>
                      <p style={{ ...eyebrow, fontSize: 6.5, marginBottom: '0.4rem' }}>Impact</p>
                      <div style={{
                        padding: '0.55rem 0.75rem', borderRadius: 5,
                        background: alignmentState.quality === 'compromised'
                                    ? 'rgba(224,90,58,0.05)' : 'rgba(149,144,236,0.04)',
                        border: `1px solid ${alignmentState.quality === 'compromised' ? 'rgba(224,90,58,0.12)' : 'rgba(149,144,236,0.08)'}`,
                      }}>
                        <p style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 13, fontStyle: 'italic',
                          color: alignmentState.quality === 'compromised'
                                 ? 'rgba(224,90,58,0.6)' : 'rgba(234,232,242,0.48)',
                          lineHeight: 1.6, margin: 0,
                        }}>
                          {alignmentState.note}
                        </p>
                      </div>
                    </div>
                  )}

                  {canonRole && (
                    <div style={{ marginTop: '0.9rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(149,144,236,0.07)' }}>
                      <p style={{ ...eyebrow, fontSize: 6.5, marginBottom: '0.35rem' }}>
                        {canonRole.name} · Alignment
                      </p>
                      <p style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 13, fontStyle: 'italic',
                        color: 'rgba(234,232,242,0.42)', lineHeight: 1.65,
                      }}>
                        {canonRole.growth_edge}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Practices */}
              {practices.length > 0 && (
                <div style={card}>
                  <p style={eyebrow}>Next Practices</p>
                  <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {practices.slice(0, 3).map((p, i) => (
                      <li key={i} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                        <span style={{
                          fontFamily: "'Cinzel', serif", fontSize: 7.5,
                          letterSpacing: '0.1em', color: 'rgba(149,144,236,0.38)',
                          paddingTop: '0.2rem', flexShrink: 0, minWidth: 16,
                        }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 14, lineHeight: 1.65, color: 'rgba(234,232,242,0.62)',
                        }}>
                          {p}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MODE: EXECUTE ─────────────────────────────────────────────────── */}
        {activeMode === 'execute' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}>
            {/* Input */}
            <div style={card}>
              <p style={eyebrow}>Execute</p>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 14, fontStyle: 'italic',
                color: 'rgba(234,232,242,0.28)', lineHeight: 1.65, marginBottom: '1rem',
              }}>
                Tell the system what to do. It will generate an execution plan.
              </p>
              <textarea
                value={execInput}
                onChange={e => setExecInput(e.target.value)}
                placeholder="Tell the system what to do…"
                rows={4}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(149,144,236,0.12)',
                  borderRadius: 6, padding: '0.85rem 1rem',
                  color: 'rgba(234,232,242,0.75)',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 15, lineHeight: 1.7,
                  resize: 'vertical', outline: 'none',
                  boxSizing: 'border-box', marginBottom: '0.75rem',
                }}
              />
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={handleExecutePlan}
                  style={{
                    padding: '0.65rem 1.4rem', borderRadius: 24,
                    border: '1px solid rgba(149,144,236,0.35)',
                    background: 'rgba(83,74,183,0.14)', color: '#9590ec',
                    fontFamily: "'Cinzel', serif", fontSize: 8,
                    letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer',
                  }}
                >
                  Generate Plan
                </button>
                {execPlan && (
                  <button
                    onClick={() => { setExecPlan(null); setExecInput('') }}
                    style={{
                      padding: '0.65rem 1rem', borderRadius: 24,
                      border: '1px solid rgba(255,255,255,0.07)',
                      background: 'transparent', color: 'rgba(234,232,242,0.28)',
                      fontFamily: "'Cinzel', serif", fontSize: 8,
                      letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Plan output */}
            {execPlan ? (
              <div style={card}>
                <p style={eyebrow}>Plan</p>
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 15, color: '#eae8f2',
                  marginBottom: '1rem',
                }}>
                  ✓ {execInput.trim().slice(0, 80)}{execInput.trim().length > 80 ? '…' : ''}
                </p>
                <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {execPlan.map((step, i) => (
                    <li key={i} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                      <span style={{
                        fontFamily: "'Cinzel', serif", fontSize: 7.5,
                        letterSpacing: '0.1em', color: 'rgba(149,144,236,0.4)',
                        paddingTop: '0.2rem', flexShrink: 0, minWidth: 16,
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 15, lineHeight: 1.65, color: 'rgba(234,232,242,0.68)',
                      }}>
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
                <button style={{
                  width: '100%', padding: '0.75rem', borderRadius: 24,
                  border: '1px solid rgba(149,144,236,0.35)',
                  background: 'rgba(83,74,183,0.18)', color: '#9590ec',
                  fontFamily: "'Cinzel', serif", fontSize: 9,
                  letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer',
                }}>
                  Execute Plan
                </button>
              </div>
            ) : (
              <div style={{
                ...card,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0.35,
              }}>
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 15, fontStyle: 'italic',
                  color: 'rgba(234,232,242,0.4)', textAlign: 'center',
                }}>
                  Plan will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── MODE: CLARITY ─────────────────────────────────────────────────── */}
        {activeMode === 'clarity' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}>
            {/* Time Allocation */}
            <div style={card}>
              <p style={eyebrow}>Time Allocation</p>
              <p style={{
                fontFamily: "'Cinzel', serif", fontSize: 7.5,
                letterSpacing: '0.3em', textTransform: 'uppercase',
                color: 'rgba(234,232,242,0.22)', marginBottom: '1rem',
              }}>
                Today&apos;s Mode Distribution
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {TIME_MODES.map(tm => (
                  <div key={tm.label}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'baseline', marginBottom: '0.2rem',
                    }}>
                      <span style={{
                        fontFamily: "'Cinzel', serif", fontSize: 7,
                        letterSpacing: '0.2em', textTransform: 'uppercase',
                        color: 'rgba(234,232,242,0.38)',
                      }}>
                        {tm.label}
                      </span>
                      <span style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 13, fontStyle: 'italic',
                        color: 'rgba(234,232,242,0.28)',
                      }}>
                        {tm.time}
                      </span>
                    </div>
                    <div style={{ height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${tm.pct}%`, borderRadius: 2,
                        background: tm.color, opacity: 0.55,
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Recommendation */}
            <div style={card}>
              <p style={eyebrow}>System Recommendation</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '0.5rem' }}>
                <div>
                  <p style={{
                    fontFamily: "'Cinzel', serif", fontSize: 6.5,
                    letterSpacing: '0.28em', textTransform: 'uppercase',
                    color: 'rgba(45,184,133,0.55)', marginBottom: '0.35rem',
                  }}>
                    Increase
                  </p>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 14, color: 'rgba(234,232,242,0.55)', lineHeight: 1.65,
                  }}>
                    · Practice (+20m)<br />· Reflect (+10m)
                  </p>
                </div>
                <div>
                  <p style={{
                    fontFamily: "'Cinzel', serif", fontSize: 6.5,
                    letterSpacing: '0.28em', textTransform: 'uppercase',
                    color: 'rgba(224,90,58,0.5)', marginBottom: '0.35rem',
                  }}>
                    Reduce
                  </p>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 14, color: 'rgba(234,232,242,0.55)', lineHeight: 1.65,
                  }}>
                    · Execute (−1h)
                  </p>
                </div>
                {deficientDimension && (
                  <div style={{ borderTop: '1px solid rgba(149,144,236,0.07)', paddingTop: '0.85rem' }}>
                    <p style={{
                      fontFamily: "'Cinzel', serif", fontSize: 6.5,
                      letterSpacing: '0.28em', textTransform: 'uppercase',
                      color: 'rgba(234,232,242,0.18)', marginBottom: '0.35rem',
                    }}>
                      Reason
                    </p>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 14, fontStyle: 'italic',
                      color: 'rgba(234,232,242,0.38)', lineHeight: 1.65,
                    }}>
                      {DIMENSION_META[deficientDimension].label} system under strain.
                      Reducing execution pressure creates space for integration.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── MODE: PRACTICE ────────────────────────────────────────────────── */}
        {activeMode === 'practice' && (
          <div style={{ ...card, marginBottom: '1.5rem' }}>
            <p style={eyebrow}>Next Practices</p>
            {practices.length > 0 ? (
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.25rem' }}>
                {practices.map((p, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <span style={{
                      fontFamily: "'Cinzel', serif", fontSize: 8,
                      letterSpacing: '0.12em', color: 'rgba(149,144,236,0.38)',
                      paddingTop: '0.2rem', flexShrink: 0, minWidth: 20,
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 16, lineHeight: 1.7, color: 'rgba(234,232,242,0.68)',
                    }}>
                      {p}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 15, fontStyle: 'italic',
                color: 'rgba(234,232,242,0.28)',
                marginTop: '0.5rem',
              }}>
                No practices found. Complete an assessment to generate recommendations.
              </p>
            )}
          </div>
        )}

        {/* ── MODE: LEARN / PRESENT — placeholder ──────────────────────────── */}
        {(activeMode === 'learn' || activeMode === 'present') && (
          <div style={{
            ...card,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '3.5rem 2rem',
            marginBottom: '1.5rem',
            opacity: 0.4,
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 18, fontStyle: 'italic',
              color: 'rgba(234,232,242,0.5)',
            }}>
              {activeMode.charAt(0).toUpperCase() + activeMode.slice(1)} mode — coming soon.
            </p>
          </div>
        )}

      </div>
    </main>
  )
}
