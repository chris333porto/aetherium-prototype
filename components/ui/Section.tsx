import React from 'react'

interface SectionProps {
  children: React.ReactNode
  className?: string
  label?: string
}

export function Section({ children, className = '', label }: SectionProps) {
  return (
    <section className={['py-16', className].join(' ')}>
      {label && (
        <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-text-low mb-8">
          {label}
        </p>
      )}
      {children}
    </section>
  )
}
