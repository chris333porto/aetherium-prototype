import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: 'purple' | 'fire' | 'air' | 'water' | 'earth' | null
  hover?: boolean
}

const glowColors: Record<string, string> = {
  purple: 'shadow-[0_0_40px_rgba(149,144,236,0.1)] border-[rgba(149,144,236,0.14)]',
  fire:   'shadow-[0_0_40px_rgba(224,90,58,0.1)]  border-[rgba(224,90,58,0.14)]',
  air:    'shadow-[0_0_40px_rgba(212,133,58,0.1)]  border-[rgba(212,133,58,0.14)]',
  water:  'shadow-[0_0_40px_rgba(74,159,212,0.1)]  border-[rgba(74,159,212,0.14)]',
  earth:  'shadow-[0_0_40px_rgba(45,184,133,0.1)]  border-[rgba(45,184,133,0.14)]',
}

// Top-edge highlight color per glow (or default purple)
const edgeColors: Record<string, string> = {
  purple: 'rgba(149,144,236,0.2)',
  fire:   'rgba(224,90,58,0.2)',
  air:    'rgba(212,133,58,0.2)',
  water:  'rgba(74,159,212,0.2)',
  earth:  'rgba(45,184,133,0.2)',
}

export function Card({ children, className = '', glow = null, hover = false }: CardProps) {
  const edgeColor = glow ? edgeColors[glow] : 'rgba(149,144,236,0.12)'

  return (
    <div
      className={[
        'bg-surface border border-border rounded-sm relative overflow-hidden transition-all duration-300',
        glow ? glowColors[glow] : '',
        hover ? 'hover:border-border-mid hover:shadow-[0_0_24px_rgba(149,144,236,0.07)] hover:bg-surface-2' : '',
        className,
      ].join(' ')}
    >
      {/* Top-edge highlight line */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${edgeColor}, transparent)`,
          zIndex: 1,
        }}
      />
      {children}
    </div>
  )
}
