import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { PreviewNav } from '@/components/dev/PreviewNav'

const DIMENSIONS = [
  {
    label: 'AETHER',
    subtitle: 'Intention & Purpose',
    color: '#9590ec',
    description: 'Your relationship with meaning, direction, and what you are here to do.',
  },
  {
    label: 'FIRE',
    subtitle: 'Volition & Drive',
    color: '#e05a3a',
    description: 'Your capacity to initiate, commit, and sustain force of will over time.',
  },
  {
    label: 'AIR',
    subtitle: 'Cognition & Clarity',
    color: '#d4853a',
    description: 'The precision and flexibility of your thinking and communication.',
  },
  {
    label: 'WATER',
    subtitle: 'Emotion & Connection',
    color: '#4a9fd4',
    description: 'Your emotional depth, empathy, and the quality of your inner life.',
  },
  {
    label: 'EARTH',
    subtitle: 'Execution & Grounding',
    color: '#2db885',
    description: 'Your ability to bring intention into physical, measurable reality.',
  },
]

export default function WelcomePage() {
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
          href="/"
          style={{
            fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.32em',
            textTransform: 'uppercase', color: 'rgba(234,232,242,0.28)',
            textDecoration: 'none', transition: 'color 0.2s',
          }}
        >
          ← Aetherium
        </Link>
      </nav>

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        maxWidth: 620, margin: '0 auto', padding: '4rem 2.5rem',
        width: '100%', position: 'relative', zIndex: 10,
      }}>

        {/* Eyebrow */}
        <p style={{
          fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.45em',
          textTransform: 'uppercase', color: 'rgba(149,144,236,0.45)',
          marginBottom: '1.8rem',
        }}>
          Before We Begin
        </p>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(30px, 4vw, 44px)',
          fontWeight: 300,
          color: '#eae8f2',
          letterSpacing: '-0.015em',
          lineHeight: 1.12,
          marginBottom: '1.2rem',
        }}>
          This is not a personality test.
        </h1>

        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(15px, 1.6vw, 18px)',
          fontStyle: 'italic',
          color: 'rgba(234,232,242,0.52)',
          lineHeight: 1.78,
          maxWidth: 480,
          marginBottom: '3rem',
        }}>
          Aetherium maps your current state across five dimensions of human experience.
          The result is not a label — it is a living profile that evolves as you do.
        </p>

        {/* Five Dimensions */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: '2.5rem' }}>
          {DIMENSIONS.map((d) => (
            <div
              key={d.label}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '1.2rem',
                padding: '1rem 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {/* Color accent bar */}
              <div style={{
                flexShrink: 0, marginTop: 3,
                width: 2, height: 38,
                background: `linear-gradient(to bottom, ${d.color}aa, transparent)`,
                borderRadius: 1,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <span style={{
                    fontFamily: "'Cinzel', serif", fontSize: 9,
                    letterSpacing: '0.22em', textTransform: 'uppercase', color: d.color,
                  }}>
                    {d.label}
                  </span>
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif", fontSize: 13,
                    fontStyle: 'italic', color: 'rgba(234,232,242,0.28)',
                  }}>
                    {d.subtitle}
                  </span>
                </div>
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif", fontSize: 14,
                  color: 'rgba(234,232,242,0.46)', lineHeight: 1.6,
                }}>
                  {d.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Time note */}
        <div style={{
          paddingLeft: '1.2rem', paddingTop: '0.75rem', paddingBottom: '0.75rem',
          borderLeft: '2px solid rgba(149,144,236,0.2)',
          background: 'rgba(149,144,236,0.03)',
          marginBottom: '2.5rem',
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 14, color: 'rgba(234,232,242,0.46)', lineHeight: 1.7,
          }}>
            The assessment takes approximately{' '}
            <strong style={{ color: 'rgba(234,232,242,0.7)', fontWeight: 500 }}>12–15 minutes</strong>.
            Answer from where you are now — not where you want to be.
            Honesty is the only requirement.
          </p>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/assessment/identity">
            <Button size="lg">Begin the Assessment</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="lg">Not Now</Button>
          </Link>
        </div>

      </div>

      {/* DEV: preview navigator — only visible when ?preview=1 */}
      <PreviewNav />
    </main>
  )
}
