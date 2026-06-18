'use client'

/**
 * MetaLine — the realm meta-line rendered with per-part typography.
 *
 * Two forms:
 *   - 'triplet'    ELEMENT · DIMENSION · FUNCTION      (assessment screens — no kanji)
 *   - 'quadruplet' ELEMENT · KANJI · DIMENSION · FUNCTION (threshold screens: elements
 *                  teaching, realm gates — kanji as sacred punctuation)
 *
 * The kanji is the only part rendered in Noto Serif JP, and it's sized slightly
 * larger to give it weight as a symbolic anchor without overwhelming the line.
 * Everything else is JetBrains Mono uppercase — the same treatment used for
 * every other mono overline in /discovery.
 */

import type { Dimension } from '@/lib/assessment/questions'
import { REALMS } from '../_lib/realms'

type Variant = 'triplet' | 'quadruplet'

interface MetaLineProps {
  dimension: Dimension
  variant:   Variant
  size?:     'sm' | 'md'    // default 'sm' — bumps to 'md' on threshold scenes
  accent?:   string         // override realm color; defaults to the dimension's color
}

export function MetaLine({
  dimension,
  variant,
  size   = 'sm',
  accent,
}: MetaLineProps) {
  const r = REALMS[dimension]
  const c = accent ?? r.color

  const monoSize  = size === 'md' ? 12 : 10
  const kanjiSize = size === 'md' ? 20 : 17
  const tracking  = size === 'md' ? '0.34em' : '0.32em'
  const gap       = size === 'md' ? 10 : 8

  const sep = (
    <span
      aria-hidden
      style={{
        opacity: 0.55,
        // Inline vertical alignment so the kanji and mono caps sit on the
        // same optical baseline despite different font metrics.
        display: 'inline-block',
        paddingInline: 2,
      }}
    >
      ·
    </span>
  )

  return (
    <span
      style={{
        fontFamily:    'var(--font-jetbrains), monospace',
        fontSize:      monoSize,
        letterSpacing: tracking,
        textTransform: 'uppercase',
        color:         c,
        display:       'inline-flex',
        alignItems:    'baseline',
        gap,
        lineHeight:    1.2,
        whiteSpace:    'nowrap',
      }}
    >
      <span>{r.element}</span>
      {sep}
      {variant === 'quadruplet' && (
        <>
          <span
            style={{
              fontFamily:    'var(--font-noto-jp), serif',
              fontSize:      kanjiSize,
              // kanji sits optically lower than caps — nudge up slightly
              transform:     'translateY(-0.02em)',
              letterSpacing: 'normal',
              textTransform: 'none',
            }}
          >
            {r.kanji}
          </span>
          {sep}
        </>
      )}
      <span>{r.dimension}</span>
      {sep}
      <span>{r.function}</span>
    </span>
  )
}
