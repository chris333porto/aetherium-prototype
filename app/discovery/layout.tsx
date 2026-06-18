import type { ReactNode } from 'react'
import { Fraunces, JetBrains_Mono, Noto_Serif_JP } from 'next/font/google'

/**
 * Scoped layout for the parallel Discovery flow.
 *
 * Fonts (all scoped to /discovery/*):
 *   - Fraunces        — body + headlines
 *   - JetBrains Mono  — meta labels, overlines, counters
 *   - Noto Serif JP   — kanji only (the element glyphs at thresholds)
 *
 * Kanji appears at threshold moments only (elements teaching + realm gates),
 * so the JP font pays its weight: it's not loaded for the assessment body.
 *
 * `--active` CSS var drives the realm accent; child routes set it inline to
 * the current realm's color and atmosphere layers follow automatically.
 */

const fraunces = Fraunces({
  subsets:  ['latin'],
  weight:   ['300', '400'],
  style:    ['normal', 'italic'],
  variable: '--font-fraunces',
  display:  'swap',
})

const jetbrains = JetBrains_Mono({
  subsets:  ['latin'],
  weight:   ['300', '400'],
  variable: '--font-jetbrains',
  display:  'swap',
})

const notoJp = Noto_Serif_JP({
  subsets:  ['latin'],          // 'japanese' subset isn't a supported Google Fonts subset token; latin+default covers the kanji range via the font file itself
  weight:   ['400'],
  variable: '--font-noto-jp',
  display:  'swap',
  preload:  false,              // kanji only appears at threshold screens; don't block the critical path
})

export default function DiscoveryLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${fraunces.variable} ${jetbrains.variable} ${notoJp.variable}`}
      style={{
        minHeight:  '100dvh',
        background: '#0f0b1a',
        color:      '#f5efe4',
        fontFamily: 'var(--font-fraunces)',
        fontWeight: 300,
        WebkitFontSmoothing: 'antialiased',

        // Default realm accent: Aether purple (pre-assessment scenes).
        ['--active' as string]: '#9590ec',
      }}
    >
      {children}
    </div>
  )
}
