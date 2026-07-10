import React, { ButtonHTMLAttributes, useState } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  children?: React.ReactNode
}

const SIZE_STYLES: Record<Size, {
  height: number
  padding: string
  fontSize: string
  gap: number
  borderRadius: string
}> = {
  sm: { height: 36, padding: '0 14px', fontSize: 'var(--text-sm)', gap: 6,  borderRadius: 'var(--radius-sm)' },
  md: { height: 44, padding: '0 18px', fontSize: 'var(--text-md)', gap: 8,  borderRadius: 'var(--radius-md)' },
  lg: { height: 52, padding: '0 24px', fontSize: 'var(--text-lg)', gap: 10, borderRadius: 'var(--radius-md)' },
}

interface VariantStyle {
  bg: string
  bgHover: string
  color: string
  border: string
}

const VARIANT_STYLES: Record<Variant, VariantStyle> = {
  primary:   { bg: 'var(--color-primary)',   bgHover: 'var(--color-primary-hover)', color: '#ffffff',              border: 'transparent' },
  secondary: { bg: 'var(--surface-card)',    bgHover: 'var(--surface-hover)',       color: 'var(--color-primary)', border: '1px solid var(--border-strong)' },
  ghost:     { bg: 'transparent',            bgHover: 'var(--color-primary-soft)',  color: 'var(--color-primary)', border: 'transparent' },
  danger:    { bg: 'var(--color-danger)',    bgHover: 'var(--color-danger-hover)',  color: '#ffffff',              border: 'transparent' },
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  icon,
  children,
  style,
  ...rest
}: ButtonProps) {
  const [hovered, setHovered] = useState(false)
  const s = SIZE_STYLES[size]
  const v = VARIANT_STYLES[variant]
  const isDisabled = disabled || loading

  const bg = (hovered && !isDisabled) ? v.bgHover : v.bg

  return (
    <button
      disabled={isDisabled}
      onMouseEnter={!isDisabled ? () => setHovered(true) : undefined}
      onMouseLeave={!isDisabled ? () => setHovered(false) : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        height: s.height,
        padding: s.padding,
        fontSize: s.fontSize,
        borderRadius: s.borderRadius,
        backgroundColor: bg,
        color: v.color,
        border: v.border,
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--weight-semibold)' as React.CSSProperties['fontWeight'],
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'background-color 140ms ease, opacity 140ms ease',
        outline: 'none',
        ...style,
      }}
      {...rest}
    >
      {icon && (
        <span style={{ display: 'inline-flex', color: 'currentColor', flexShrink: 0 }}>
          {icon}
        </span>
      )}
      {loading ? '...' : children}
    </button>
  )
}
