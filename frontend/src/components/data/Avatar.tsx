import React, { HTMLAttributes } from 'react'

type AvatarSize = 'sm' | 'md' | 'lg'

interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name?: string
  src?: string
  size?: AvatarSize
}

const SIZE_PX: Record<AvatarSize, number> = { sm: 32, md: 40, lg: 56 }
const FONT_PX: Record<AvatarSize, number> = { sm: 12, md: 15, lg: 20 }

function getInitials(name?: string): string {
  if (!name) return '؟'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '؟'
  const chars = parts.slice(0, 2).map(p => p.charAt(0))
  return chars.join('')
}

export function Avatar({ name, src, size = 'md', style, ...rest }: AvatarProps) {
  const px = SIZE_PX[size]
  const fs = FONT_PX[size]

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: px,
    height: px,
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: 'var(--color-primary-soft)',
    color: 'var(--blue-700)',
    fontSize: fs,
    fontWeight: 'var(--weight-semibold)' as React.CSSProperties['fontWeight'],
    fontFamily: 'var(--font-sans)',
    flexShrink: 0,
    userSelect: 'none',
    ...style,
  }

  return (
    <span style={baseStyle} {...rest}>
      {src ? (
        <img
          src={src}
          alt={name || ''}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  )
}
