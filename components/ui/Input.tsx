import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="font-cinzel text-xs uppercase tracking-widest text-text-low">
          {label}
        </label>
      )}
      <input
        {...props}
        className={[
          'bg-surface-2 border border-border rounded-sm px-4 py-3',
          'text-text text-sm font-cormorant',
          'placeholder:text-text-low',
          'focus:outline-none focus:border-ae-purple focus:border-opacity-60',
          'transition-colors duration-200',
          error ? 'border-ae-fire' : '',
          className,
        ].join(' ')}
      />
      {error && (
        <span className="text-ae-fire text-xs font-cormorant">{error}</span>
      )}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="font-cinzel text-xs uppercase tracking-widest text-text-low">
          {label}
        </label>
      )}
      <textarea
        {...props}
        className={[
          'bg-surface-2 border border-border rounded-sm px-4 py-3',
          'text-text text-sm font-cormorant resize-none',
          'placeholder:text-text-low',
          'focus:outline-none focus:border-ae-purple focus:border-opacity-60',
          'transition-colors duration-200',
          error ? 'border-ae-fire' : '',
          className,
        ].join(' ')}
      />
      {error && (
        <span className="text-ae-fire text-xs font-cormorant">{error}</span>
      )}
    </div>
  )
}
