import React, { HTMLAttributes } from 'react'

type Tone = 'neutral' | 'primary' | 'success' | 'danger' | 'warning' | 'accent'
type Size = 'sm' | 'md'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  size?: Size
  dot?: boolean
  children?: React.ReactNode
}

const TONE_STYLES: Record<Tone, { bg: string; color: string; dot: string }> = {
  neutral: { bg: 'var(--surface-sunken)', color: 'var(--text-secondary)', dot: 'var(--gray-400)' },
  primary: { bg: 'var(--color-primary-soft)', color: 'var(--blue-700)', dot: 'var(--color-primary)' },
  success: { bg: 'var(--color-success-soft)', color: 'var(--color-success-text)', dot: 'var(--color-success)' },
  danger:  { bg: 'var(--color-danger-soft)',  color: 'var(--color-danger-text)',  dot: 'var(--color-danger)' },
  warning: { bg: 'var(--color-warning-soft)', color: 'var(--gold-700)',           dot: 'var(--color-warning)' },
  accent:  { bg: 'var(--color-accent-soft)',  color: 'var(--gold-700)',           dot: 'var(--color-accent)' },
}

const SIZE_STYLES: Record<Size, { fontSize: string; padding: string; gap: number }> = {
  sm: { fontSize: 'var(--text-xs)', padding: '2px 8px', gap: 5 },
  md: { fontSize: 'var(--text-sm)', padding: '4px 10px', gap: 6 },
}

export function Badge({ tone = 'neutral', size = 'md', dot, children, style, ...rest }: BadgeProps) {
  const t = TONE_STYLES[tone]
  const s = SIZE_STYLES[size]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        fontSize: s.fontSize,
        padding: s.padding,
        borderRadius: 'var(--radius-full)',
        backgroundColor: t.bg,
        color: t.color,
        fontWeight: 'var(--weight-medium)',
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
      {...rest}
    >
      {dot && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: t.dot,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  )
}
