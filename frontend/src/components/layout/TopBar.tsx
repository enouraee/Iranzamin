import React from 'react'

interface TopBarProps {
  title?: string
  subtitle?: string
  leading?: React.ReactNode
  trailing?: React.ReactNode
  dark?: boolean
}

export function TopBar({ title, subtitle, leading, trailing, dark = false }: TopBarProps) {
  return (
    <header
      style={{
        height: 'var(--header-h)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: '0 var(--gutter)',
        backgroundColor: dark ? 'transparent' : 'var(--surface-card)',
        borderBottom: dark ? 'none' : '1px solid var(--border-default)',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Trailing slot (logical-start = right in RTL) */}
      {trailing && (
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {trailing}
        </div>
      )}

      {/* Title block — fills remaining space */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-md)',
              fontWeight: 'var(--weight-bold)' as React.CSSProperties['fontWeight'],
              color: dark ? 'var(--text-on-dark)' : 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </p>
        )}
        {subtitle && (
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-xs)',
              color: dark ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: 1,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Leading slot (logical-end = left in RTL = visual start) */}
      {leading && (
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {leading}
        </div>
      )}
    </header>
  )
}
