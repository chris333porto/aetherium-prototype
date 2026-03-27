'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { HomepageMandala } from '@/components/HomepageMandala'
import { HomepageBgCanvas } from '@/components/HomepageBgCanvas'
import { ScrollReveal } from '@/components/ScrollReveal'
import { DimensionMandala } from '@/components/DimensionMandala'
import { DEMO_SCORES } from '@/lib/assessment/stateEngine'
import { supabase } from '@/lib/supabase'

const DIMENSIONS = [
  { name: 'Intention',  desc: 'What you want and why',              color: '#9590ec', angle: -90 },
  { name: 'Volition',   desc: 'Your ability to act and follow through', color: '#e05a3a', angle: -18 },
  { name: 'Cognition',  desc: 'How you think and process',           color: '#d4853a', angle: 54  },
  { name: 'Emotion',    desc: 'How you feel and regulate',           color: '#4a9fd4', angle: 126 },
  { name: 'Action',     desc: 'What you actually do consistently',   color: '#2db885', angle: 198 },
]

// From outer ring to center — order for mandala rendering
const MANDALA_RINGS = [
  { name: 'Action',    desc: 'What you actually do consistently',   color: '#2db885', r: 138, sw: 22 },
  { name: 'Emotion',   desc: 'How you feel and regulate',           color: '#4a9fd4', r: 111, sw: 20 },
  { name: 'Cognition', desc: 'How you think and process',           color: '#d4853a', r: 85,  sw: 18 },
  { name: 'Volition',  desc: 'Your will and drive to act',          color: '#e05a3a', r: 61,  sw: 16 },
  { name: 'Intention', desc: 'Your deepest purpose and why',        color: '#9590ec', r: 0,   sw: 0  },
]

const SHOWCASE_ARCHETYPES = [
  { name: 'The Seeker',      tagline: 'Searching for the truer life.',          colors: ['#9590ec'] },
  { name: 'The Dreamer',     tagline: 'Vision without ground.',                  colors: ['#9590ec', '#d4853a'] },
  { name: 'The Analyst',     tagline: 'Sharp mind, waking heart.',               colors: ['#d4853a'] },
  { name: 'The Warrior',     tagline: 'Force seeking a cause.',                  colors: ['#e05a3a', '#2db885'] },
  { name: 'The Builder',     tagline: 'Building toward an unclear destination.', colors: ['#2db885', '#e05a3a'] },
  { name: 'The Empath',      tagline: 'Feeling everything, holding it all.',     colors: ['#4a9fd4'] },
  { name: 'The Guardian',    tagline: 'Steady presence, fierce protection.',     colors: ['#2db885', '#4a9fd4'] },
  { name: 'The Philosopher', tagline: 'Insight crystallizing into wisdom.',      colors: ['#9590ec', '#d4853a', '#4a9fd4'] },
]

export default function LandingPage() {
  const navRef = useRef<HTMLElement>(null)
  const [scrolled,  setScrolled]  = useState(false)
  const [authed,    setAuthed]    = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Check auth state — if already signed in, nav button becomes "Dashboard"
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session?.user)
    })
    // Keep in sync if the user signs out in another tab
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setAuthed(!!session?.user)
    )
    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      <HomepageBgCanvas />
      <div className="grain" />

      {/* ── Nav ─────────────────────────────────────── */}
      <nav ref={navRef} className={`hp-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="hp-nav-logo">AETHERIUM</div>
        <Link href={authed ? '/dashboard' : '/auth'} className="hp-nav-btn">
          {authed ? 'Dashboard' : 'Sign in'}
        </Link>
      </nav>

      {/* ══ 1. ARRIVAL — Hero ════════════════════════ */}
      {/* backgroundAttachment: 'fixed' is omitted — iOS Safari doesn't support it
          and renders a blurred/zoomed version. Desktop parallax is re-added via CSS
          media query (@media min-width 769px). */}
      <section className="hp-hero" style={{
        backgroundImage: "url('/Aetherium Temple v3.33.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center 50%',
      }}>
        <div className="hero-overlay" />

        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(560px, 90vw)', height: 'min(560px, 90vw)',
          opacity: 0.08, pointerEvents: 'none', zIndex: 0,
        }}>
          <HomepageMandala />
        </div>

        <h1 className="hero-h1">
          <span className="line1">Discover Yourself</span>
          <span className="line2">Navigate the Way</span>
        </h1>

        <p className="hero-sub">
          There is an underlying structure to human life.<br />
          You are already moving through it.<br />
          Aetherium makes it visible — and navigable.
        </p>

        <div className="hero-cta-wrap">
          <Link href="/onboarding/welcome" className="cta-hero">Begin Your Journey</Link>
        </div>

        <p className="hero-time">
          <span>Free</span> &nbsp;·&nbsp; ~10 minutes &nbsp;·&nbsp; No account required &nbsp;·&nbsp; Your profile evolves with you
        </p>

        <div className="scroll-hint">
          <div className="scroll-line" />
          <span>Learn more</span>
        </div>
      </section>

      {/* ══ 2. REFLECTION — Pain ════════════════════ */}
      <section className="s-band section-dark">
        <div className="section-vignette" />
        <div className="s-inner">
          <ScrollReveal>
            <div className="s-center">
              <span className="hp-eyebrow">Sound familiar?</span>
              <h2 className="hp-section-h">Most People Are Moving Through Life<br />Without a Clear Map</h2>
            </div>
          </ScrollReveal>
          <div className="pain-grid" style={{ marginTop: '3rem' }}>
            {[
              "They don't know what to focus on — so they focus on everything and make no real progress",
              "They second-guess decisions constantly, unsure whether to trust their gut or their logic",
              "They feel stuck or scattered — working hard but not moving in any real direction",
              "They know they have more potential — but they don't have a system to access it",
              "They've tried personality tests, books, therapy — but nothing gave them a clear map forward",
              "They're capable and intelligent — and still not living like it",
            ].map((t, i) => (
              <ScrollReveal key={t} delay={(i % 2) as 0 | 1}>
                <div className="pain-item">
                  <div className="pain-dot" />
                  <div className="pain-text">{t}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal delay={1}>
            <div className="pain-then">
              Aetherium changes that.
              <em>It gives you the map.</em>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Entrance — cinematic chapter marker ─────────────────── */}
      <div style={{ width: '100%', lineHeight: 0 }}>
        <img
          src="/2. Entrance.png"
          alt=""
          role="presentation"
          style={{
            width: '100%',
            height: 'clamp(220px, 54vw, 820px)',
            objectFit: 'cover',
            objectPosition: 'center center',
            display: 'block',
          }}
        />
      </div>

      {/* ══ 3. STRUCTURE — Five Dimensions ══════════ */}
      <section className="s-band section-dark section-foundation">
        <div className="section-vignette" />
        <ScrollReveal>
          <div className="s-center">
            <span className="hp-eyebrow">The Foundation</span>
            <h2 className="hp-section-h">The Five Dimensions of the Self</h2>
            <p className="hp-section-body">
              Every human operates across five core dimensions.
              Most people are imbalanced — and don&apos;t know why.
            </p>
          </div>
        </ScrollReveal>

        {/* Concentric mandala */}
        <ScrollReveal>
          <div className="mandala-rings-wrap" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '4rem', marginTop: '4rem', padding: '0 3rem', maxWidth: 860, marginLeft: 'auto', marginRight: 'auto' }}>
            <div className="mandala-rings-svg-shell" style={{ flexShrink: 0, filter: 'drop-shadow(0 0 40px rgba(149,144,236,0.08))' }}>
              <DimensionMandala scores={DEMO_SCORES} size={320} />
            </div>

            {/* Dimension labels — from center outward */}
            <div className="mring-labels" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', flex: 1, minWidth: 200, maxWidth: 300 }}>
              {MANDALA_RINGS.slice().reverse().map((d, i) => (
                <div key={d.name} className="mring-label">
                  <div className="mring-swatch" style={{ background: d.color, boxShadow: `0 0 8px ${d.color}44` }} />
                  <div>
                    <div className="mring-lname" style={{ color: d.color }}>{d.name}</div>
                    <div className="mring-ldesc">{d.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={1}>
          <div className="five-dim-message">
            <p className="five-dim-clarity">
              Clarity doesn&apos;t come from labeling yourself.<br />
              It comes from seeing how these dimensions interact.
            </p>
            <p className="five-dim-transition">
              This is the structure Aetherium maps.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Courtyard — cinematic chapter marker ─────────────────── */}
      <div style={{ width: '100%', lineHeight: 0 }}>
        <img
          src="/4. Courtyard.png"
          alt=""
          role="presentation"
          style={{
            width: '100%',
            height: 'clamp(220px, 54vw, 820px)',
            objectFit: 'cover',
            objectPosition: 'center center',
            display: 'block',
          }}
        />
      </div>

      {/* ══ 4. FLOW — Life Through the System ═══════ */}
      <section className="s-band section-dark section-mechanism flow-section">
        <div className="section-vignette" />
        <ScrollReveal>
          <div className="s-center">
            <span className="hp-eyebrow">The Mechanism</span>
            <h2 className="hp-section-h">Structure Is Not Enough</h2>
            <p className="hp-section-body">
              Life moves. Energy flows through these dimensions
              continuously — from intention to action and back again.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={1}>
          <div className="flow-diagram">
            <div className="flow-chain">
              {[
                { name: 'Intention', color: '#9590ec' },
                { name: 'Volition',  color: '#e05a3a' },
                { name: 'Cognition', color: '#d4853a' },
                { name: 'Emotion',   color: '#4a9fd4' },
                { name: 'Action',    color: '#2db885' },
              ].map((d, i, arr) => (
                <div key={d.name} className="flow-node-wrap">
                  <div className="flow-node" style={{ '--flow-color': d.color } as React.CSSProperties}>
                    <div className="flow-dot" style={{ background: d.color, boxShadow: `0 0 10px ${d.color}66` }} />
                    <div className="flow-node-name" style={{ color: d.color }}>{d.name}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flow-arrow">
                      <div className="flow-arrow-line" style={{ background: `linear-gradient(90deg, ${d.color}44, ${arr[i+1].color}44)` }} />
                      <div className="flow-arrow-head" style={{ borderLeftColor: arr[i+1].color + '55' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flow-states">
              {[
                { label: 'Blockage',     desc: 'When energy cannot move between dimensions — clarity becomes impossible.',   color: '#e05a3a' },
                { label: 'Distortion',   desc: 'When dimensions are misaligned — effort goes in the wrong direction.',        color: '#d4853a' },
                { label: 'Misalignment', desc: 'When action contradicts intention — you work hard but move in circles.',      color: '#4a9fd4' },
              ].map((s) => (
                <div key={s.label} className="flow-state-item">
                  <div className="flow-state-dot" style={{ background: s.color }} />
                  <div>
                    <div className="flow-state-label" style={{ color: s.color }}>{s.label}</div>
                    <div className="flow-state-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={1}>
          <div className="five-dim-message">
            <p className="five-dim-clarity">
              Aetherium helps you see — and restore — your flow.
            </p>
            <p className="five-dim-transition">
              When structure becomes visible and flow becomes clear — you can begin to navigate.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Passage — cinematic chapter marker ──────────────────── */}
      <div style={{ width: '100%', lineHeight: 0 }}>
        <img
          src="/3. Passage.png"
          alt=""
          role="presentation"
          style={{
            width: '100%',
            height: 'clamp(220px, 54vw, 820px)',
            objectFit: 'cover',
            objectPosition: 'center center',
            display: 'block',
          }}
        />
      </div>

      {/* ══ 5. EXPRESSION — Archetypes ═══════════════ */}
      <section className="s-band">
        <ScrollReveal>
          <div className="s-center">
            <span className="hp-eyebrow">Expression</span>
            <h2 className="hp-section-h">You Are Not One Thing</h2>
            <p className="hp-section-body">
              You are a dynamic configuration within the same system.
              Every person is a unique pattern across the five dimensions.
            </p>
          </div>
        </ScrollReveal>

        <div className="archetype-grid" style={{ maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
          {SHOWCASE_ARCHETYPES.map((a, i) => (
            <ScrollReveal key={a.name} delay={(i % 3) as 0 | 1 | 2}>
              <div className="arch-card">
                <div className="arch-dots">
                  {a.colors.map((c, ci) => (
                    <div key={ci} className="arch-dot" style={{ background: c, boxShadow: `0 0 8px ${c}66` }} />
                  ))}
                </div>
                <div className="arch-name">{a.name}</div>
                <div className="arch-tagline">{a.tagline}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={1}>
          <div className="five-dim-message" style={{ marginTop: '3rem' }}>
            <p className="five-dim-clarity">
              You are not a type.<br />
              You are a configuration.
            </p>
            <p className="five-dim-transition">
              Aetherium maps your configuration — and how it evolves.
            </p>
          </div>
        </ScrollReveal>
      </section>

      <Kigo />

      {/* ══ 6. THRESHOLD — This Is Different ════════ */}
      <section className="s-band threshold-section" style={{ paddingTop: 0 }}>
        <div className="threshold-glow" />
        <ScrollReveal>
          <div className="s-center">
            <span className="hp-eyebrow">This is where things change</span>
            <h2 className="hp-section-h">This Isn&apos;t Another Personality Test</h2>
            <p className="hp-section-body">
              Most tools give you a label and leave you there. Aetherium gives you a living map —
              one that reveals your unique configuration and evolves as you do.
            </p>
            <p style={{ marginTop: '1.4rem', fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.14em', color: 'rgba(149,144,236,0.52)', fontStyle: 'normal' }}>
              This is where you stop guessing — and start seeing.
            </p>
          </div>
        </ScrollReveal>
        <div className="vs-grid" style={{ maxWidth: 900, marginLeft: 'auto', marginRight: 'auto', marginTop: '3rem' }}>
          <ScrollReveal>
            <div className="vs-card">
              <div className="vs-label">MBTI / Enneagram</div>
              <div className="vs-title">A label</div>
              <div className="vs-items">
                <div className="vs-item">You get a type. That&apos;s it.</div>
                <div className="vs-item">Static — doesn&apos;t change as you grow</div>
                <div className="vs-item">No pathway. No system. No daily use.</div>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={1}>
            <div className="vs-card">
              <div className="vs-label">Journaling / Meditation apps</div>
              <div className="vs-title">Open space</div>
              <div className="vs-items">
                <div className="vs-item">No structure. No interpretation.</div>
                <div className="vs-item">Feels good in the moment</div>
                <div className="vs-item">No map. No clarity on what to do next.</div>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={2}>
            <div className="vs-card featured">
              <div className="vs-label highlight">Aetherium</div>
              <div className="vs-title" style={{ color: 'rgba(234,232,242,0.78)' }}>A living system</div>
              <div className="vs-items">
                <div className="vs-item good">Dynamic profile that evolves with you</div>
                <div className="vs-item good">Clear pathway — what to do next</div>
                <div className="vs-item good">Daily use: clarity, decisions, focus</div>
                <div className="vs-item good">Visual identity. Archetype. Avatar.</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Kigo />

      {/* ══ 5. INITIATION — Four Steps ═══════════════ */}
      <section className="s-band" style={{ paddingTop: 0 }}>
        <ScrollReveal>
          <div className="s-center">
            <span className="hp-eyebrow">Simple and doable</span>
            <h2 className="hp-section-h">Four Steps. One Clear Profile.</h2>
            <p className="hp-section-body">Start in under 10 minutes. No expertise required. Just honesty.</p>
          </div>
        </ScrollReveal>
        <div className="steps-row" style={{ maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
          {[
            { n: '01', title: 'Answer guided questions', desc: 'We map your identity across five core dimensions — who you are, how you think, what drives you.', time: '~8 minutes' },
            { n: '02', title: 'Share your story', desc: 'Brief reflections on your past, where you are now, and where you\'re going. This shapes your trajectory.', time: '~2 minutes' },
            { n: '03', title: 'Your archetype is revealed', desc: 'The system maps your configuration across 32 archetypal states and generates your unique blend.', time: 'Instant' },
            { n: '04', title: 'Get your full profile', desc: 'Avatar, dimensional map, growth pathway, shadow analysis — everything. Free. Right now.', time: 'Instant · Free' },
          ].map((s, i) => (
            <ScrollReveal key={s.n} delay={(i % 3) as 0 | 1 | 2}>
              <div className="step-card">
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
                <div className="step-time">{s.time}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <Kigo />

      {/* ══ 6. REVELATION — What You Get ════════════ */}
      <section className="s-band section-dark" style={{ paddingTop: 0 }}>
        <div className="section-vignette" />
        <ScrollReveal>
          <div className="s-center">
            <span className="hp-eyebrow">Revelation</span>
            <h2 className="hp-section-h">Your Profile Is Your Map</h2>
            <p className="hp-section-body" style={{ marginTop: '0.8rem' }}>This is you — mapped clearly.</p>
          </div>
        </ScrollReveal>
        <div className="get-grid" style={{ maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
          {[
            { icon: '🧬', title: 'Your Archetype Blend', desc: 'Not a single type. A weighted blend of archetypes that reflects how you actually operate — including the shadow patterns running in the background.' },
            { icon: '📊', title: 'Full Dimensional Profile', desc: 'Your scores across five dimensions: Intention, Volition, Cognition, Emotion, and Action. See exactly which dimensions are strong — and which are limiting you.' },
            { icon: '🌱', title: 'Your Growth Pathway', desc: 'The precise sequence of development your evolution is moving toward. And the specific practices that activate each transition.' },
            { icon: '◈',  title: 'Your Aetherium Avatar', desc: 'A visual and symbolic representation of your current state — generated uniquely from your dimensional profile. Yours alone.' },
            { icon: '🎯', title: 'Your Growth Edge', desc: 'The single dimension most limiting your forward motion right now — named precisely, with specific practices to start developing it today.' },
            { icon: '🌑', title: 'Shadow Pattern Analysis', desc: 'The unconscious pattern shaping your decisions. Named without judgment. Understood with clarity. This alone is worth more than most self-help books.' },
          ].map((c, i) => (
            <ScrollReveal key={c.title} delay={(i % 2) as 0 | 1}>
              <div className="get-card">
                <div className="get-icon">{c.icon}</div>
                <div className="get-title">{c.title}</div>
                <div className="get-desc">{c.desc}</div>
                <div className="get-badge">Free</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay={1}>
          <div className="get-power" style={{ maxWidth: 900, marginLeft: 'auto', marginRight: 'auto', marginTop: 12 }}>
            <p className="get-power-text">You don&apos;t just learn about yourself. You get a system to navigate your life.</p>
          </div>
        </ScrollReveal>
      </section>

      <Kigo />

      {/* ══ 7. IDENTITY — Avatar ═════════════════════ */}
      <ScrollReveal>
        <div className="avatar-section">
          <div className="av-wrap-demo">
            <svg className="av-ring-demo" viewBox="0 0 130 130" fill="none">
              <path d="M65 4 A61 61 0 0 1 113 34" stroke="rgba(149,144,236,0.6)" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
              <path d="M113 34 A61 61 0 0 1 124 81" stroke="rgba(224,90,58,0.48)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
              <path d="M124 81 A61 61 0 0 1 76 124" stroke="rgba(212,133,58,0.58)" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
              <path d="M76 124 A61 61 0 0 1 24 108" stroke="rgba(74,159,212,0.38)" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
              <path d="M24 108 A61 61 0 0 1 4 65" stroke="rgba(45,184,133,0.42)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
              <path d="M4 65 A61 61 0 0 1 65 4" stroke="rgba(149,144,236,0.2)" strokeWidth="1" fill="none" strokeLinecap="round"/>
              <circle cx="65" cy="4" r="3" fill="rgba(149,144,236,0.7)"/>
              <circle cx="113" cy="34" r="2.5" fill="rgba(224,90,58,0.52)"/>
              <circle cx="124" cy="81" r="2.5" fill="rgba(212,133,58,0.62)"/>
              <circle cx="76" cy="124" r="2.5" fill="rgba(74,159,212,0.42)"/>
              <circle cx="24" cy="108" r="2" fill="rgba(45,184,133,0.4)"/>
            </svg>
            <div className="av-core-demo">◈</div>
          </div>
          <p className="av-label">This is the visual expression of your current state.</p>
          <p className="av-q">What does yours look like?</p>
          <p className="av-note">Your Aetherium Avatar is generated uniquely from your profile — visible immediately after you complete the assessment.</p>
        </div>
      </ScrollReveal>

      <Kigo />

      {/* ══ 8. UTILITY — Daily System ════════════════ */}
      <section className="s-band" style={{ paddingTop: 0 }}>
        <ScrollReveal>
          <div className="s-center">
            <span className="hp-eyebrow">Navigation</span>
            <h2 className="hp-section-h">How You Navigate Your Life</h2>
            <p className="hp-section-body">
              Aetherium is not a one-time result. It is the system you return to
              when you need to think clearly, decide confidently, or understand what&apos;s happening inside you.
            </p>
          </div>
        </ScrollReveal>
        <div className="daily-grid" style={{ maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
          {[
            { icon: '🎯', label: 'Clarity Tool',       desc: 'When you feel scattered, return to your profile to reorient' },
            { icon: '💬', label: 'Reflection Space',   desc: 'Daily voice or text reflections that feed your evolving map' },
            { icon: '⚖️', label: 'Decision Guide',     desc: 'Make choices from self-knowledge rather than guesswork' },
            { icon: '📈', label: 'Personal Dashboard', desc: 'Track your evolution. See what\'s changing. Know where to focus.' },
          ].map((c, i) => (
            <ScrollReveal key={c.label} delay={(i % 3) as 0 | 1 | 2}>
              <div className="daily-card">
                <div className="daily-icon">{c.icon}</div>
                <div className="daily-label">{c.label}</div>
                <div className="daily-desc">{c.desc}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay={1}>
          <p className="daily-line" style={{ marginTop: '2.5rem' }}>
            <strong>When you don&apos;t know what to do next — this helps you figure it out.</strong>
          </p>
        </ScrollReveal>
      </section>

      <Kigo />

      {/* ══ 9. VALIDATION — Testimonials ════════════ */}
      <section className="s-band" style={{ paddingTop: 0 }}>
        <ScrollReveal>
          <div className="s-center">
            <span className="hp-eyebrow">What people found</span>
            <h2 className="hp-section-h">The Mirror<br />Does Not Flatter</h2>
          </div>
        </ScrollReveal>
        <div className="testi-grid" style={{ maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
          {[
            { text: "I've done MBTI, Enneagram, Human Design. Nothing came close to the clarity Aetherium gave me. The shadow analysis alone was worth more than a year of therapy.", name: 'Marcus R.', arch: 'Architect · Integrated Phase' },
            { text: "I kept wondering why I had so much clarity but couldn't execute anything. Aetherium named it in one word — and then showed me the exact path out.", name: 'Priya S.', arch: 'Strategist · Emerging Phase' },
            { text: "I didn't expect a visual to hit that hard. My Avatar made me emotional. It was like seeing myself from the outside for the first time.", name: 'Daniel W.', arch: 'Seeker · Emerging Phase' },
          ].map((t, i) => (
            <ScrollReveal key={t.name} delay={(i % 3) as 0 | 1 | 2}>
              <div className="testi">
                <div className="testi-q">&ldquo;</div>
                <p className="testi-text">{t.text}</p>
                <div className="testi-name">{t.name}</div>
                <div className="testi-arch">{t.arch}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <Kigo />

      {/* ══ Philosophy ══════════════════════════════ */}
      <section className="s-band" style={{ paddingTop: 0 }}>
        <ScrollReveal>
          <div className="temple-inner">
            <span className="hp-eyebrow">Built on a simple idea</span>
            <p className="temple-quote">&ldquo;Know thyself.&rdquo;</p>
            <p className="temple-attr">— inscribed at the temple of Apollo at Delphi, 6th century BC</p>
            <p className="temple-body">
              For thousands of years, this has been the foundation of wisdom traditions across every culture.
              Aetherium brings that idea into the modern world — with the structure, precision, and daily
              usability that actually makes it work.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ══ 10. COMMITMENT — Final CTA ══════════════ */}
      <ScrollReveal>
        <div className="final-wrap">
          <div className="final-glow" />
          <span className="hp-eyebrow" style={{ marginBottom: '2rem' }}>Your journey begins here</span>
          <h2 className="final-question">
            See Clearly.<br />Navigate the Way.
          </h2>
          <p className="final-sub">
            Know yourself. Map your life. Move with intention.
          </p>
          <Link href="/onboarding/welcome" className="cta-hero">Begin Your Journey</Link>
          <p className="final-note">
            <span>Free</span> &nbsp;·&nbsp; ~10 minutes &nbsp;·&nbsp; Instant results &nbsp;·&nbsp;{' '}
            <span>No account required</span>
          </p>
        </div>
      </ScrollReveal>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="hp-footer">
        AETHERIUM &nbsp;·&nbsp; A platform for human evolution
      </footer>
    </>
  )
}


function Kigo() {
  return (
    <ScrollReveal>
      <div className="kigo">
        <div className="kigo-line" />
        <div className="kigo-mark">◈</div>
        <div className="kigo-line" />
      </div>
    </ScrollReveal>
  )
}
