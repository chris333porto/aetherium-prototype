import React from 'react'

type Variant = 'primary' | 'ghost' | 'outline' | 'subtle'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: React.ReactNode
}

const variantClass: Record<Variant, string> = {
  primary: 'ae-btn-primary',
  ghost:   'ae-btn-ghost',
  outline: 'ae-btn-outline',
  subtle:  'ae-btn-subtle',
}

const sizeClass: Record<Size, string> = {
  sm: 'ae-btn-sm',
  md: 'ae-btn-md',
  lg: 'ae-btn-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={[
        'ae-btn',
        variantClass[variant],
        sizeClass[size],
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}
