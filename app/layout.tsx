import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aetherium — A Platform for Human Evolution',
  description: 'Discover who you are, where you are misaligned, and how to move toward your highest expression.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning: the Feedly browser extension (and some other
    // extensions — Grammarly, LastPass, etc.) inject attributes like
    // `data-feedly-mini` into <html> / <body> BEFORE React hydrates, which
    // causes a mismatch error and — in Next 16 + React 19 — can halt the
    // hydration of the tree entirely. Scoping the suppression to these two
    // elements is the documented fix; it does not mask real mismatches
    // inside the app.
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg text-text antialiased" suppressHydrationWarning>
        <div className="grain" />
        {children}
      </body>
    </html>
  )
}
