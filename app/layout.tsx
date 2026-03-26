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
    <html lang="en">
      <body className="bg-bg text-text antialiased">
        <div className="grain" />
        {children}
      </body>
    </html>
  )
}
