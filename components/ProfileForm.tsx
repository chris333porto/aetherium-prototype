'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  onSuccess: () => void
}

const archetypes = [
  'Strategist',
  'Builder',
  'Seeker',
  'Guardian',
  'Catalyst',
  'Creator',
  'Integrator',
  'Visionary',
  'Refiner',
  'Connector',
]

export default function ProfileForm({ onSuccess }: Props) {
  const [name, setName] = useState('')
  const [archetype, setArchetype] = useState('Strategist')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

    if (!name.trim()) {
      setMessage('Please enter a name.')
      return
    }

    setSubmitting(true)

    const { error } = await supabase.from('profiles').insert([
      {
        name: name.trim(),
        archetype,
      },
    ])

    if (error) {
      console.error('Insert error:', error)
      setMessage('Could not create profile.')
    } else {
      setName('')
      setArchetype('Strategist')
      setMessage('Profile created.')
      onSuccess()
    }

    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block font-cinzel text-[11px] uppercase tracking-[0.2em] text-white/45">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Chris"
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-[#9590ec]/50"
        />
      </div>

      <div>
        <label className="mb-2 block font-cinzel text-[11px] uppercase tracking-[0.2em] text-white/45">
          Archetype
        </label>
        <select
          value={archetype}
          onChange={(e) => setArchetype(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#9590ec]/50"
        >
          {archetypes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full border border-[#9590ec]/40 px-5 py-3 font-cinzel text-xs uppercase tracking-[0.2em] text-[#9590ec] transition hover:bg-[#9590ec]/10 disabled:opacity-50"
      >
        {submitting ? 'Creating...' : 'Create Profile'}
      </button>

      {message ? <p className="text-sm italic text-white/50">{message}</p> : null}
    </form>
  )
}