import React from 'react'

type DimensionColor = 'purple' | 'fire' | 'air' | 'water' | 'earth'

interface ProgressProps {
  value: number // 0–100
  color?: DimensionColor
  label?: string
  showValue?: boolean
  className?: string
}

interface StepProgressProps {
  current: number
  total: number
  className?: string
}

export function Progress({
  value,
  color = 'purple',
  label,
  showValue = false,
  className = '',
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className={['flex flex-col gap-1.5', className].join(' ')}>
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && (
            <span className="font-cinzel text-xs uppercase tracking-widest text-text-low">
              {label}
            </span>
          )}
          {showValue && (
            <span className="font-cormorant text-sm text-text-mid">
              {Math.round(clamped)}
            </span>
          )}
        </div>
      )}
      <div className="ae-progress-track">
        <div
          className={`ae-progress-fill ae-progress-fill-${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

export function StepProgress({ current, total, className = '' }: StepProgressProps) {
  return (
    <div className={['flex gap-1.5 items-center', className].join(' ')}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={[
            'h-px flex-1 transition-all duration-500 rounded-full',
            i < current ? 'ae-step-segment-done' : 'ae-step-segment-pending',
          ].join(' ')}
        />
      ))}
    </div>
  )
}
