import type { ReactNode } from 'react'
import { Fraunces, JetBrains_Mono } from 'next/font/google'

/**
 * Scoped layout for the Earth practice.
 *
 * Fonts are loaded ONLY for this subtree — the rest of the app keeps its
 * Cinzel + Cormorant Garamond pairing untouched. We expose them as CSS vars
 * (`--font-fraunces`, `--font-jetbrains`) and switch them in via
 * `style={{ fontFamily: 'var(--font-fraunces)' }}` on the page.
 *
 * Background and text color are set at the layout level so any future
 * /practice/* routes can inherit the same surface without re-declaring it.
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

export default function PracticeLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${fraunces.variable} ${jetbrains.variable}`}
      style={{
        minHeight:  '100dvh',
        background: '#0f0b1a',
        color:      '#f5efe4',
        fontFamily: 'var(--font-fraunces)',
        fontWeight: 300,
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {children}
    </div>
  )
}
