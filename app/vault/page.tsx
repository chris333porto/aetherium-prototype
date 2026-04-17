'use client'

/**
 * vault/page.tsx — Memory Vault
 *
 * Browse, search, filter, and star saved memories.
 * Entries come from Trinity conversations, reflections, and Know Me answers.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { EnergyField } from '@/components/EnergyField'

type Memory = {
  id: string
  created_at: string
  content: string
  title: string | null
  memory_type: string
  source: string
  tags: string[]
  ai_summary: string | null
  ai_themes: string[] | null
  is_starred: boolean
}

type Filter = 'all' | 'starred' | 'voice' | 'story' | 'belief' | 'teaching' | 'insight' | 'dream'

const FILTER_OPTIONS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'starred', label: 'Starred' },
  { id: 'voice', label: 'Voice' },
  { id: 'story', label: 'Stories' },
  { id: 'belief', label: 'Beliefs' },
  { id: 'teaching', label: 'Teachings' },
  { id: 'insight', label: 'Insights' },
  { id: 'dream', label: 'Dreams' },
]

export default function VaultPage() {
  const router = useRouter()
  const [memories, setMemories] = useState<Memory[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.replace('/auth'); return }
      setUserId(session.user.id)

      let query = supabase
        .from('memories')
        .select('id, created_at, content, title, memory_type, source, tags, ai_summary, ai_themes, is_starred')
        .eq('user_id', session.user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(50)

      if (filter === 'starred') query = query.eq('is_starred', true)
      else if (filter === 'voice') query = query.eq('source', 'voice')
      else if (filter !== 'all') query = query.eq('memory_type', filter)

      if (search.trim()) {
        query = query.or(`content.ilike.%${search.trim()}%,title.ilike.%${search.trim()}%`)
      }

      const { data } = await query
      setMemories((data ?? []) as Memory[])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, filter, search])

  async function toggleStar(id: string, current: boolean) {
    await supabase.from('memories').update({ is_starred: !current }).eq('id', id)
    setMemories(prev => prev.map(m => m.id === id ? { ...m, is_starred: !current } : m))
  }

  function formatDate(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function typeLabel(type: string): string {
    const labels: Record<string, string> = {
      reflection: 'Reflection', story: 'Story', belief: 'Belief', teaching: 'Teaching',
      insight: 'Insight', dream: 'Dream', gratitude: 'Gratitude', letter: 'Letter',
      voice_transcript: 'Voice',
    }
    return labels[type] ?? type
  }

  return (
    <main style={{ minHeight: '100vh', background: '#06060d', color: '#eae8f2' }}>
      <EnergyField size={500} opacity={0.08} color="#9590ec" />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 1.5rem 4rem', position: 'relative', zIndex: 10 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0 1rem' }}>
          <div>
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(149,144,236,0.4)', marginBottom: '0.3rem' }}>
              Memory Vault
            </p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 300, margin: 0 }}>
              Your Collected Self
            </h1>
          </div>
          <Link href="/dashboard" style={{
            fontFamily: "'Cinzel', serif", fontSize: 7.5, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'rgba(234,232,242,0.25)', textDecoration: 'none',
          }}>
            ← Dashboard
          </Link>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setLoading(true) }}
          placeholder="Search memories..."
          style={{
            width: '100%', boxSizing: 'border-box',
            fontFamily: "'Cormorant Garamond', serif", fontSize: 15,
            color: '#eae8f2', background: 'rgba(234,232,242,0.025)',
            border: '1px solid rgba(234,232,242,0.07)', borderRadius: 6,
            padding: '0.7rem 1rem', outline: 'none', marginBottom: '0.8rem',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(149,144,236,0.2)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(234,232,242,0.07)'}
        />

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.2rem' }}>
          {FILTER_OPTIONS.map(f => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setLoading(true) }}
              style={{
                fontFamily: "'Cinzel', serif", fontSize: 7.5, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: filter === f.id ? '#eae8f2' : 'rgba(234,232,242,0.3)',
                background: filter === f.id ? 'rgba(149,144,236,0.1)' : 'rgba(149,144,236,0.02)',
                border: `1px solid ${filter === f.id ? 'rgba(149,144,236,0.25)' : 'rgba(149,144,236,0.06)'}`,
                borderRadius: 4, padding: '6px 12px', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Entries */}
        {loading ? (
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: 'italic', color: 'rgba(234,232,242,0.3)', textAlign: 'center', padding: '3rem 0' }}>
            Loading...
          </p>
        ) : memories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: 'rgba(234,232,242,0.35)', marginBottom: '0.5rem' }}>
              No memories yet.
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, fontStyle: 'italic', color: 'rgba(234,232,242,0.2)' }}>
              Speak to Trinity or write a reflection to begin building your vault.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {memories.map(m => (
              <div
                key={m.id}
                style={{
                  background: 'rgba(149,144,236,0.02)',
                  border: '1px solid rgba(149,144,236,0.06)',
                  borderRadius: 8,
                  padding: '1.1rem 1.3rem',
                }}
              >
                {/* Top row: type + date + star */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontFamily: "'Cinzel', serif", fontSize: 6.5, letterSpacing: '0.15em', textTransform: 'uppercase',
                      color: m.source === 'voice' ? 'rgba(149,144,236,0.45)' : 'rgba(234,232,242,0.25)',
                    }}>
                      {m.source === 'voice' ? '🎙 ' : ''}{typeLabel(m.memory_type)}
                    </span>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, color: 'rgba(234,232,242,0.18)' }}>
                      {formatDate(m.created_at)}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleStar(m.id, m.is_starred)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: m.is_starred ? 1 : 0.3, transition: 'opacity 0.2s' }}
                  >
                    {m.is_starred ? '★' : '☆'}
                  </button>
                </div>

                {/* Title */}
                {m.title && (
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif", fontSize: 15,
                    color: 'rgba(234,232,242,0.65)', fontWeight: 500,
                    marginBottom: '0.3rem', lineHeight: 1.4,
                  }}>
                    {m.title}
                  </p>
                )}

                {/* Content preview */}
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif", fontSize: 14,
                  color: 'rgba(234,232,242,0.45)', lineHeight: 1.6,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
                  margin: 0,
                }}>
                  {m.content}
                </p>

                {/* Themes */}
                {m.ai_themes && m.ai_themes.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {m.ai_themes.map((theme, i) => (
                      <span key={i} style={{
                        fontFamily: "'Cinzel', serif", fontSize: 6, letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'rgba(149,144,236,0.35)',
                        background: 'rgba(149,144,236,0.04)',
                        border: '1px solid rgba(149,144,236,0.08)',
                        borderRadius: 3, padding: '3px 7px',
                      }}>
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
