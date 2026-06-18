'use client'

import { useEffect, useState } from 'react'
import { saveFoundingMember } from '@/lib/foundingMember'

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Source tag stored with each founding-member signup. Bump per event if useful. */
const SOURCE = 'founding-member'

type Phase = 'idle' | 'submitting' | 'done'

/**
 * Self-contained founding-member CTA: renders a button that opens a capture
 * modal (name + email + optional note). Drop it anywhere — it owns its own
 * open/submit state. Capture never blocks the user: on infra failure we still
 * show the thank-you (the email is also logged client-side as a safety net).
 */
export function FoundingMemberCTA({
  label = 'Become a Founding Member',
  className = 'cta-hero',
}: {
  label?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && <FoundingMemberModal onClose={() => setOpen(false)} />}
    </>
  )
}

function FoundingMemberModal({ onClose }: { onClose: () => void }) {
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote]   = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [touched, setTouched] = useState(false)

  const valid = EMAIL_RX.test(email.trim())

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && phase !== 'submitting') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, phase])

  async function handleSubmit() {
    setTouched(true)
    if (!valid || phase !== 'idle') return
    setPhase('submitting')

    // Safety net so a lead is never lost even if the network/DB hiccups.
    try {
      localStorage.setItem('aetherium.founding.email', email.trim().toLowerCase())
      if (name.trim()) localStorage.setItem('aetherium.founding.name', name.trim())
    } catch { /* ignore */ }

    const res = await saveFoundingMember({
      email,
      name: name || undefined,
      note: note || undefined,
      source: SOURCE,
    })
    if (!res.ok) console.warn('[founding] capture non-blocking failure:', res.error)

    // Always advance to the thank-you — the person should never see infra errors.
    setPhase('done')
  }

  return (
    <div className="fm-overlay" onClick={() => phase !== 'submitting' && onClose()}>
      <div className="fm-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Become a Founding Member">
        <button type="button" className="fm-close" onClick={onClose} aria-label="Close" disabled={phase === 'submitting'}>×</button>

        {phase === 'done' ? (
          <div className="fm-done">
            <div className="fm-mark">◈</div>
            <h3 className="fm-done-h">You&rsquo;re in.</h3>
            <p className="fm-done-p">
              You&rsquo;re a founding member. We&rsquo;ll be in touch with your invitation
              to begin the journey&nbsp;&mdash; among the very first.
            </p>
            <button type="button" className="cta-hero fm-submit" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <span className="hp-eyebrow">Founding membership</span>
            <h3 className="fm-h">Begin as a Founder</h3>
            <p className="fm-sub">
              Be among the first to walk the journey toward becoming the author of your own life.
              Leave your name and we&rsquo;ll send your invitation.
            </p>

            <label className="fm-label" htmlFor="fm-name">Name <span className="fm-opt">(optional)</span></label>
            <input
              id="fm-name" className="fm-input" type="text" autoComplete="name"
              value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?"
            />

            <label className="fm-label" htmlFor="fm-email">Email</label>
            <input
              id="fm-email" className="fm-input" type="email" inputMode="email" autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="you@example.com"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
            />
            {touched && !valid && <div className="fm-err">Please enter a valid email.</div>}

            <label className="fm-label" htmlFor="fm-note">What are you seeking? <span className="fm-opt">(optional)</span></label>
            <textarea
              id="fm-note" className="fm-input fm-textarea" value={note}
              onChange={(e) => setNote(e.target.value)} rows={2}
              placeholder="A word on where you are, or what drew you here."
            />

            <button
              type="button"
              className="cta-hero fm-submit"
              onClick={handleSubmit}
              disabled={phase === 'submitting' || (touched && !valid)}
            >
              {phase === 'submitting' ? 'Joining…' : 'Claim my founding place'}
            </button>
            <p className="fm-fine">No spam. Your story stays yours.</p>
          </>
        )}
      </div>
    </div>
  )
}
