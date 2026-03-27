'use client'

/**
 * dashboard/page.tsx
 *
 * Minimum viable signed-in landing page.
 *
 * Loads:  auth session → profiles row → latest profile_states row
 * Shows:  greeting, archetype blend, dimension scores, growth edge, practices
 * Routes: "View full results" → /results   |   "New assessment" → /onboarding/welcome
 */

import { useEffect, useState }   from 'react'
import { useRouter }              from 'next/navigation'
import Link                       from 'next/link'
import { supabase }               from '@/lib/supabase'
import { linkUserToProfile }      from '@/lib/persistence/profiles'
import { DIMENSION_META, DIMENSIONS_ORDER } from '@/lib/assessment/questions'
import type { Dimension }         from '@/lib/assessment/questions'
import type { ArchetypeBlendRecord, ProfileState } from '@/lib/supabase'
import { ARCHETYPES }                              from '@/lib/archetypes/definitions'
import { getRole }                                 from '@/lib/canon'
import type { RoleDefinition }                     from '@/lib/types/canon'

// ── Dashboard data shape ──────────────────────────────────────────────────────

type DashData = {
  firstName:          string
  assessmentDate:     string          // ISO string from profile_states.created_at
  profileStateId:     string
  archetypeBlend:     ArchetypeBlendRecord
  scores:             Record<Dimension, number>
  deficientDimension: Dimension | null
  practices:          string[]
  canonRole:          RoleDefinition | null
}

type Phase = 'loading' | 'ready' | 'empty' | 'error'

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  const [phase,    setPhase]    = useState<Phase>('loading')
  const [data,     setData]     = useState<DashData | null>(null)
  const [signOutBusy, setSignOutBusy] = useState(false)

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
        // 2. Ensure user_id is stitched to profiles row (idempotent)
        const profileId = await linkUserToProfile(userId, email!)

        if (!profileId) {
          // Signed in but no saved profile — prompt to complete assessment
          setPhase('empty')
          return
        }

        // 3. Fetch profile row for display name
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', profileId)
          .single()

        // 4. Fetch latest profile_states row for this profile
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

        // Seed localStorage so /results can re-hydrate without re-fetching the ID
        localStorage.setItem('ae_profile_state_id', ps.id)

        // Resolve canonical role from the stored primary archetype id
        const primaryArchetype = ARCHETYPES.find(
          a => a.id === (ps.archetype_blend as ArchetypeBlendRecord).primary_id
        )
        const canonRole = primaryArchetype
          ? getRole(primaryArchetype.canonicalRoleId)
          : null

        setData({
          firstName:      profile?.first_name ?? (email!.split('@')[0]),
          assessmentDate: ps.created_at,
          profileStateId: ps.id,
          archetypeBlend: ps.archetype_blend,
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

  // ── Shared styles ─────────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    background:   'rgba(149,144,236,0.04)',
    border:       '1px solid rgba(149,144,236,0.10)',
    borderRadius: 8,
    padding:      '1.75rem 2rem',
  }

  const eyebrow: React.CSSProperties = {
    fontFamily:    "'Cinzel', serif",
    fontSize:      8,
    letterSpacing: '0.45em',
    textTransform: 'uppercase' as const,
    color:         'rgba(149,144,236,0.45)',
    marginBottom:  '0.6rem',
  }

  const sectionTitle: React.CSSProperties = {
    fontFamily:    "'Cormorant Garamond', serif",
    fontSize:      'clamp(20px, 2.4vw, 28px)',
    fontWeight:    300,
    color:         '#eae8f2',
    letterSpacing: '-0.01em',
    lineHeight:    1.2,
    marginBottom:  '1.25rem',
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

  // ── Empty state (signed in, no saved profile) ─────────────────────────────

  if (phase === 'empty') {
    return (
      <main style={{
        minHeight: '100vh', background: '#06060d',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '1.5rem', padding: '2rem',
      }}>
        <p style={{ ...eyebrow, marginBottom: 0 }}>Your Dashboard</p>
        <h1 style={{ ...sectionTitle, textAlign: 'center', maxWidth: 440 }}>
          No saved profile yet.
        </h1>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: 16,
          color: 'rgba(234,232,242,0.4)', fontStyle: 'italic',
          textAlign: 'center', maxWidth: 380, lineHeight: 1.75,
        }}>
          Complete the assessment and save your profile to track your evolution here.
        </p>
        <Link
          href="/onboarding/welcome"
          style={{
            marginTop: '0.5rem',
            padding: '0.9rem 2rem',
            borderRadius: 28,
            border: '1px solid rgba(149,144,236,0.35)',
            background: 'rgba(83,74,183,0.14)',
            color: '#9590ec',
            fontFamily: "'Cinzel', serif",
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          Begin Your Assessment
        </Link>
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
      </main>
    )
  }

  // ── Ready ─────────────────────────────────────────────────────────────────

  const { archetypeBlend, scores, deficientDimension, practices, firstName, assessmentDate, canonRole } = data

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date(assessmentDate))

  return (
    <main style={{ minHeight: '100vh', background: '#06060d', color: '#eae8f2' }}>

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 0%, rgba(149,144,236,0.06), transparent 55%)',
      }} />

      <style>{`@keyframes ae-spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav style={{
        position:       'sticky',
        top:            0,
        zIndex:         50,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '1rem 2rem',
        borderBottom:   '1px solid rgba(149,144,236,0.08)',
        background:     'rgba(6,6,13,0.88)',
        backdropFilter: 'blur(12px)',
      }}>
        <Link href="/" style={{
          fontFamily: "'Cinzel', serif", fontSize: 11,
          letterSpacing: '0.18em', color: 'rgba(234,232,242,0.45)',
          textDecoration: 'none',
        }}>
          Aetherium
        </Link>

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
          {signOutBusy ? 'Signing out…' : 'Sign out'}
        </button>
      </nav>

      {/* ── Page body ───────────────────────────────────────────── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(2rem, 5vw, 4rem) 1.5rem 6rem' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '3rem' }}>
          <p style={eyebrow}>Your Dashboard</p>
          <h1 style={{
            fontFamily:    "'Cormorant Garamond', serif",
            fontSize:      'clamp(32px, 5vw, 52px)',
            fontWeight:    300,
            letterSpacing: '-0.015em',
            lineHeight:    1.1,
            color:         '#eae8f2',
            marginBottom:  '0.5rem',
          }}>
            Welcome back, {firstName}.
          </h1>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 15, fontStyle: 'italic',
            color: 'rgba(234,232,242,0.28)',
          }}>
            Profile captured {formattedDate}
          </p>
        </div>

        {/* ── Archetype ─────────────────────────────────────────── */}
        <div style={{ ...card, marginBottom: '1.5rem' }}>
          <p style={eyebrow}>Your Archetype</p>
          <p style={{
            fontFamily:    "'Cormorant Garamond', serif",
            fontSize:      'clamp(22px, 3vw, 34px)',
            fontWeight:    300,
            letterSpacing: '-0.01em',
            color:         '#eae8f2',
            marginBottom:  '0.4rem',
            lineHeight:    1.2,
          }}>
            {archetypeBlend.blend_title}
          </p>

          {/* Current Role — canonical operating role */}
          {canonRole && (
            <div style={{
              display:    'flex',
              alignItems: 'baseline',
              gap:        12,
              marginTop:  '0.85rem',
              marginBottom: '0.25rem',
            }}>
              <span style={{
                fontFamily:    "'Cinzel', serif",
                fontSize:      7,
                letterSpacing: '0.42em',
                textTransform: 'uppercase' as const,
                color:         'rgba(149,144,236,0.35)',
                flexShrink:    0,
              }}>
                Current Role
              </span>
              <div style={{ width: 12, height: 1, background: 'rgba(149,144,236,0.15)', flexShrink: 0, alignSelf: 'center' }} />
              <span style={{
                fontFamily:    "'Cinzel', serif",
                fontSize:      9,
                letterSpacing: '0.22em',
                textTransform: 'uppercase' as const,
                color:         'rgba(149,144,236,0.85)',
                padding:       '2px 9px',
                border:        '1px solid rgba(149,144,236,0.25)',
                borderRadius:  3,
              }}>
                {canonRole.name}
              </span>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize:   14,
                fontStyle:  'italic',
                color:      'rgba(234,232,242,0.30)',
                lineHeight: 1.4,
              }}>
                {canonRole.function}
              </span>
            </div>
          )}

          {/* Primary / secondary / tertiary percentages */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1rem' }}>
            {(
              [
                { name: archetypeBlend.primary_name,   pct: archetypeBlend.primary_pct,   opacity: 1    },
                { name: archetypeBlend.secondary_name, pct: archetypeBlend.secondary_pct, opacity: 0.65 },
                { name: archetypeBlend.tertiary_name,  pct: archetypeBlend.tertiary_pct,  opacity: 0.42 },
              ] as { name: string; pct: number; opacity: number }[]
            ).map(a => (
              <span
                key={a.name}
                style={{
                  fontFamily:    "'Cinzel', serif",
                  fontSize:      9,
                  letterSpacing: '0.14em',
                  padding:       '0.35rem 0.75rem',
                  borderRadius:  20,
                  border:        '1px solid rgba(149,144,236,0.2)',
                  color:         `rgba(149,144,236,${a.opacity})`,
                  whiteSpace:    'nowrap',
                }}
              >
                {a.name} · {a.pct}%
              </span>
            ))}
          </div>
        </div>

        {/* ── Dimensional Scores ────────────────────────────────── */}
        <div style={{ ...card, marginBottom: '1.5rem' }}>
          <p style={eyebrow}>Dimensional Scores</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.25rem' }}>
            {DIMENSIONS_ORDER.map(dim => {
              const meta  = DIMENSION_META[dim]
              const score = scores[dim] ?? 0
              const isGrowthEdge = dim === deficientDimension
              return (
                <div key={dim}>
                  <div style={{
                    display: 'flex', alignItems: 'baseline',
                    justifyContent: 'space-between', marginBottom: '0.3rem',
                  }}>
                    <span style={{
                      fontFamily: "'Cinzel', serif", fontSize: 8,
                      letterSpacing: '0.22em', textTransform: 'uppercase',
                      color: isGrowthEdge
                        ? meta.color
                        : 'rgba(234,232,242,0.45)',
                    }}>
                      {meta.label}{isGrowthEdge ? ' · growth edge' : ''}
                    </span>
                    <span style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 13, fontStyle: 'italic',
                      color: 'rgba(234,232,242,0.35)',
                    }}>
                      {score}
                    </span>
                  </div>
                  {/* Track */}
                  <div style={{
                    height: 3, borderRadius: 2,
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height:       '100%',
                      width:        `${score}%`,
                      borderRadius: 2,
                      background:   isGrowthEdge
                        ? meta.color
                        : `${meta.color}88`,
                      transition:   'width 0.6s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Growth Edge ──────────────────────────────────────── */}
        {deficientDimension && (
          <div style={{ ...card, marginBottom: '1.5rem', borderColor: `${DIMENSION_META[deficientDimension].color}28` }}>
            <p style={eyebrow}>Growth Edge</p>
            <p style={{ ...sectionTitle, marginBottom: '0.35rem' }}>
              {DIMENSION_META[deficientDimension].label}
            </p>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 15, fontStyle: 'italic',
              color: 'rgba(234,234,242,0.38)', lineHeight: 1.7,
            }}>
              {DIMENSION_META[deficientDimension].subtitle}
            </p>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 15,
              color: 'rgba(234,232,242,0.45)', lineHeight: 1.75,
              marginTop: '0.75rem',
            }}>
              {DIMENSION_META[deficientDimension].description}
            </p>
            {/* Canon role growth edge */}
            {canonRole && (
              <div style={{
                marginTop:    '1.25rem',
                paddingTop:   '1rem',
                borderTop:    '1px solid rgba(149,144,236,0.08)',
              }}>
                <p style={{
                  fontFamily:    "'Cinzel', serif",
                  fontSize:      7,
                  letterSpacing: '0.38em',
                  textTransform: 'uppercase' as const,
                  color:         'rgba(149,144,236,0.32)',
                  marginBottom:  '0.5rem',
                }}>
                  {canonRole.name} · Development
                </p>
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize:   15,
                  fontStyle:  'italic',
                  color:      'rgba(234,232,242,0.5)',
                  lineHeight: 1.7,
                }}>
                  {canonRole.growth_edge}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Practices ────────────────────────────────────────── */}
        {practices.length > 0 && (
          <div style={{ ...card, marginBottom: '2.5rem' }}>
            <p style={eyebrow}>Next Practices</p>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {practices.slice(0, 3).map((p, i) => (
                <li key={i} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  <span style={{
                    fontFamily: "'Cinzel', serif", fontSize: 8,
                    letterSpacing: '0.12em',
                    color: 'rgba(149,144,236,0.4)',
                    paddingTop: '0.2rem',
                    flexShrink: 0,
                    minWidth: 18,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 16, lineHeight: 1.65,
                    color: 'rgba(234,232,242,0.7)',
                  }}>
                    {p}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ── CTAs ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleViewResults}
            style={{
              padding:       '0.9rem 2rem',
              borderRadius:  28,
              border:        '1px solid rgba(149,144,236,0.35)',
              background:    'rgba(83,74,183,0.14)',
              color:         '#9590ec',
              fontFamily:    "'Cinzel', serif",
              fontSize:      10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor:        'pointer',
            }}
          >
            View Full Results
          </button>

          <Link
            href="/onboarding/welcome"
            style={{
              padding:       '0.9rem 2rem',
              borderRadius:  28,
              border:        '1px solid rgba(255,255,255,0.08)',
              background:    'transparent',
              color:         'rgba(234,232,242,0.38)',
              fontFamily:    "'Cinzel', serif",
              fontSize:      10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              display:       'inline-flex',
              alignItems:    'center',
            }}
          >
            New Assessment
          </Link>
        </div>

      </div>
    </main>
  )
}
