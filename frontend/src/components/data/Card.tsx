import React, { HTMLAttributes, useState } from 'react'

type Padding = 'none' | 'sm' | 'md' | 'lg'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding
  interactive?: boolean
  children?: React.ReactNode
}

const PADDING_MAP: Record<Padding, string> = {
  none: '0',
  sm:   'var(--space-3)',
  md:   'var(--space-4)',
  lg:   'var(--space-6)',
}

export function Card({ padding = 'md', interactive = false, children, style, onClick, ...rest }: CardProps) {
  const [hovered, setHovered] = useState(false)

  const baseStyle: React.CSSProperties = {
    backgroundColor: 'var(--surface-card)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: interactive && hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
    padding: PADDING_MAP[padding],
    transform: interactive && hovered ? 'translateY(-2px)' : 'translateY(0)',
    transition: 'box-shadow 160ms ease, transform 160ms ease',
    cursor: interactive ? 'pointer' : undefined,
    ...style,
  }

  return (
    <div
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={interactive ? () => setHovered(true) : undefined}
      onMouseLeave={interactive ? () => setHovered(false) : undefined}
      {...rest}
    >
      {children}
    </div>
  )
}
