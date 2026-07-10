import React, { useState } from 'react'

export interface BottomNavItem {
  value: string
  label: string
  icon: (active: boolean) => React.ReactNode
}

interface BottomNavProps {
  items: BottomNavItem[]
  value: string
  onChange: (value: string) => void
}

export function BottomNav({ items, value, onChange }: BottomNavProps) {
  return (
    <nav
      role="navigation"
      aria-label="منوی پایین"
      style={{
        position: 'fixed',
        insetInline: 0,
        bottom: 0,
        height: 'var(--bottomnav-h)',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: 'var(--surface-card)',
        borderTop: '1px solid var(--border-default)',
        boxShadow: '0 -2px 12px rgba(16,30,54,0.05)',
        zIndex: 50,
      }}
    >
      {items.map(item => {
        const isActive = item.value === value
        const isFab = item.value === '/files/new'
        return (
          <BottomNavButton
            key={item.value}
            item={item}
            isActive={isActive}
            isFab={isFab}
            onClick={() => onChange(item.value)}
          />
        )
      })}
    </nav>
  )
}

interface BottomNavButtonProps {
  item: BottomNavItem
  isActive: boolean
  isFab: boolean
  onClick: () => void
}

function BottomNavButton({ item, isActive, isFab, onClick }: BottomNavButtonProps) {
  const [hovered, setHovered] = useState(false)

  const color = isActive || isFab ? 'var(--color-primary)' : 'var(--text-muted)'

  return (
    <button
      aria-current={isActive ? 'page' : undefined}
      data-active={isActive}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        border: 'none',
        backgroundColor: hovered ? 'var(--surface-sunken)' : 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
        color,
        transition: 'color 140ms ease, background-color 140ms ease',
        padding: '4px 0',
      }}
    >
      <span style={{ display: 'inline-flex', color: 'currentColor' }}>
        {item.icon(isActive)}
      </span>
      {!isFab && (
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: isActive
              ? ('var(--weight-semibold)' as React.CSSProperties['fontWeight'])
              : ('var(--weight-regular)' as React.CSSProperties['fontWeight']),
            color: 'currentColor',
            lineHeight: 1,
          }}
        >
          {item.label}
        </span>
      )}
    </button>
  )
}
