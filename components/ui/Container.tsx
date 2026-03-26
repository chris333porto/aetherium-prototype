import React from 'react'

interface ContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap: Record<string, string> = {
  sm: 'max-w-xl',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
}

export function Container({ children, className = '', size = 'lg' }: ContainerProps) {
  return (
    <div className={['mx-auto px-6 w-full', sizeMap[size], className].join(' ')}>
      {children}
    </div>
  )
}
