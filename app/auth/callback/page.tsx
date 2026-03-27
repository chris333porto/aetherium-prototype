'use client'

/**
 * auth/callback/page.tsx
 *
 * Landing target for Supabase magic-link and OAuth redirects.
 * Handles three jobs:
 *   1. Exchange the auth code / token in the URL for a session.
 *   2. Stitch auth.users.id → profiles.user_id for the matching email (idempotent).
 *   3. Route the user to /dashboard (saved profile) or /onboarding/welcome (new user).
 *
 * No user input required — the page is a loading state that resolves automatically.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter }                   from 'next/navigation'
import { supabase }                    from '@/lib/supabase'
import { linkUserToProfile }           from '@/lib/persistence/profiles'

type Phase = 'verifying' | 'linking' | 'redirecting' | 'error'

const PHASE_LABEL: Record<Phase, string> = {
  verifying:   'Verifying sign-in…',
  linking:     'Linking your profile…',
  redirecting: 'Opening your dashboard…',
  error:       '',   // overridden by errorMsg state
}

export default function AuthCallbackPage() {
  const router  = useRouter()
  const handled = useRef(false)

  const [phase,    setPhase]    = useState<Phase>('verifying')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // ── Core handler — runs at most once ────────────────────────────────────
    async function proceed(userId: string, email: string) {
      if (handled.current) return
      handled.current = true
      setPhase('linking')

      try {
        // 1. Claim the profiles row for this email (idempotent)
        const profileId = await linkUserToProfile(userId, email)

        setPhase('redirecting')

        if (profileId) {
          // 2. Seed ae_profile_state_id so /dashboard and /results can load
          //    without a round-trip for the state ID
          const { data: latest } = await supabase
            .from('profile_states')
            .select('id')
            .eq('profile_id', profileId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (latest?.id) {
            localStorage.setItem('ae_profile_state_id', latest.id as string)
          }

          router.replace('/dashboard')
        } else {
          // Authenticated but no saved profile — start the assessment fresh
          router.replace('/onboarding/welcome')
        }
      } catch (err) {
        console.error('[Aetherium] Auth callback error:', err)
        handled.current = false          // allow the user to retry
        setErrorMsg('Something went wrong. Please try signing in again.')
        setPhase('error')
      }
    }

    // ── Strategy 1 (primary): PKCE code exchange — Google OAuth lands here ──
    // After Google auth, Supabase appends ?code=XXX to the redirectTo URL.
    // With Next.js App Router the onAuthStateChange event fires before the
    // useEffect listener is registered (initialization race), so we exchange
    // the code explicitly rather than waiting for the event.
    //
    // useSearchParams() is intentionally NOT used here — it requires a Suspense
    // boundary and causes Vercel build failures on this route.  Reading from
    // window.location.search inside useEffect is safe: this component is
    // 'use client' and the effect only runs in the browser.
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          console.error('[Aetherium] PKCE code exchange failed:', error.message)
          // Fall through — strategy 2/3 will pick up if there's still a session
          return
        }
        if (data.session?.user?.email) {
          proceed(data.session.user.id, data.session.user.email)
        }
      })
    }

    // ── Strategy 2: session already set (page refresh, already-signed-in) ───
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        proceed(session.user.id, session.user.email)
      }
    })

    // ── Strategy 3: SIGNED_IN event — magic-link first click ────────────────
    // Magic links land with a hash fragment (#access_token=...) which the
    // Supabase client converts to a session; the SIGNED_IN event fires after
    // our listener is registered because hash processing is async.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email) {
          proceed(session.user.id, session.user.email)
        }
      }
    )

    // ── Timeout guard (expired / already-used link) ──────────────────────────
    const timeout = setTimeout(() => {
      if (!handled.current) {
        handled.current = true
        setErrorMsg('Sign-in link expired or already used. Please request a new one.')
        setPhase('error')
      }
    }, 10_000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [router])

  // ── UI ────────────────────────────────────────────────────────────────────

  const label = phase === 'error' ? errorMsg : PHASE_LABEL[phase]

  return (
    <main
      style={{
        minHeight:      '100vh',
        background:     '#06060d',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '1.25rem',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position:       'fixed',
          inset:          0,
          pointerEvents:  'none',
          background:     'radial-gradient(circle at 50% 30%, rgba(149,144,236,0.07), transparent 60%)',
        }}
      />

      {/* Spinner — hidden on error */}
      {phase !== 'error' && (
        <div
          style={{
            width:        32,
            height:       32,
            borderRadius: '50%',
            border:       '2px solid rgba(149,144,236,0.12)',
            borderTop:    '2px solid rgba(149,144,236,0.55)',
            animation:    'ae-spin 0.9s linear infinite',
          }}
        />
      )}

      <p
        style={{
          fontFamily:     "'Cinzel', serif",
          fontSize:       11,
          letterSpacing:  '0.18em',
          textTransform:  'uppercase',
          color:          phase === 'error'
                            ? 'rgba(224,90,58,0.75)'
                            : 'rgba(234,232,242,0.35)',
          textAlign:      'center',
          maxWidth:       340,
          lineHeight:     1.7,
          padding:        '0 1rem',
        }}
      >
        {label}
      </p>

      {phase === 'error' && (
        <a
          href="/auth"
          style={{
            fontFamily:    "'Cinzel', serif",
            fontSize:      9,
            letterSpacing: '0.14em',
            color:         'rgba(149,144,236,0.55)',
            textDecoration: 'none',
            marginTop:     '0.25rem',
          }}
        >
          ← Return to sign in
        </a>
      )}

      <style>{`
        @keyframes ae-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  )
}
