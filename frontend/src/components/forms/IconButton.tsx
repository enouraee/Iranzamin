import React, { ButtonHTMLAttributes, useState } from 'react'

type Variant = 'ghost' | 'solid' | 'primary'
type Size = 'sm' | 'md' | 'lg'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  'aria-label': string
  children?: React.ReactNode
}

const SIZE_PX: Record<Size, number> = { sm: 36, md: 44, lg: 52 }

interface VariantStyle {
  bg: string
  bgHover: string
  color: string
  border: string
}

const VARIANT_STYLES: Record<Variant, VariantStyle> = {
  ghost:   { bg: 'transparent',         bgHover: 'var(--surface-sunken)', color: 'var(--text-secondary)', border: 'transparent' },
  solid:   { bg: 'var(--surface-card)', bgHover: 'var(--surface-hover)',  color: 'var(--text-secondary)', border: '1px solid var(--border-default)' },
  primary: { bg: 'var(--color-primary)', bgHover: 'var(--color-primary-hover)', color: '#ffffff',          border: 'transparent' },
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  disabled,
  children,
  style,
  ...rest
}: IconButtonProps) {
  const [hovered, setHovered] = useState(false)
  const px = SIZE_PX[size]
  const v = VARIANT_STYLES[variant]
  const bg = (hovered && !disabled) ? v.bgHover : v.bg

  return (
    <button
      disabled={disabled}
      onMouseEnter={!disabled ? () => setHovered(true) : undefined}
      onMouseLeave={!disabled ? () => setHovered(false) : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: px,
        height: px,
        borderRadius: 'var(--radius-md)',
        backgroundColor: bg,
        color: v.color,
        border: v.border,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background-color 140ms ease',
        outline: 'none',
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
