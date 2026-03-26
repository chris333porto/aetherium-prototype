'use client'

import { useEffect, useRef, ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  delay?: 0 | 1 | 2   // maps to sr, sr2, sr3 delay tiers
  className?: string
}

export function ScrollReveal({ children, delay = 0, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('sr-vis')
          obs.unobserve(el)
        }
      },
      { threshold: 0.08 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const delayClass = delay === 1 ? 'sr-d1' : delay === 2 ? 'sr-d2' : ''

  return (
    <div ref={ref} className={`sr-base ${delayClass} ${className}`}>
      {children}
    </div>
  )
}
