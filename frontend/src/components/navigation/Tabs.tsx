import React from 'react'

interface TabItem {
  value: string
  label: string
  count?: number
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
}

export function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 'var(--space-5)',
        borderBottom: '1px solid var(--border-default)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {items.map(item => {
        const isActive = item.value === value
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.value)}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '12px 2px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'var(--text-md)',
              fontWeight: isActive
                ? ('var(--weight-semibold)' as React.CSSProperties['fontWeight'])
                : ('var(--weight-regular)' as React.CSSProperties['fontWeight']),
              color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
              outline: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}

            {item.count !== undefined && (
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  borderRadius: 'var(--radius-full)',
                  padding: '1px 7px',
                  backgroundColor: isActive ? 'var(--color-primary-soft)' : 'var(--surface-sunken)',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                }}
              >
                {item.count}
              </span>
            )}

            {/* Active underline */}
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  bottom: -1,
                  insetInlineStart: 0,
                  insetInlineEnd: 0,
                  height: 2,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-primary)',
                }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
