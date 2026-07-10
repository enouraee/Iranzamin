import React, { useState } from 'react'
import { Home, Building2, PlusCircle, FileText, User } from 'lucide-react'

export interface SidebarNavItem {
  value: string
  label: string
  icon: React.ReactNode
}

const DEFAULT_NAV_ITEMS: SidebarNavItem[] = [
  { value: '/',           label: 'داشبورد',   icon: <Home size={20} strokeWidth={2} /> },
  { value: '/files',      label: 'فایل‌ها',   icon: <Building2 size={20} strokeWidth={2} /> },
  { value: '/files/new',  label: 'افزودن فایل', icon: <PlusCircle size={20} strokeWidth={2} /> },
  { value: '/contracts',  label: 'قراردادها',  icon: <FileText size={20} strokeWidth={2} /> },
  { value: '/profile',    label: 'پروفایل',   icon: <User size={20} strokeWidth={2} /> },
]

interface SidebarProps {
  value: string
  onChange: (value: string) => void
  items?: SidebarNavItem[]
}

export function Sidebar({ value, onChange, items = DEFAULT_NAV_ITEMS }: SidebarProps) {
  return (
    <aside
      role="complementary"
      aria-label="منوی کناری"
      style={{
        width: 260,
        height: '100vh',
        position: 'fixed',
        insetInlineStart: 0,
        top: 0,
        backgroundColor: 'var(--surface-card)',
        borderInlineEnd: '1px solid var(--border-default)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Brand block */}
      <div
        style={{
          height: 64,
          padding: '0 var(--gutter)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-bold)' as React.CSSProperties['fontWeight'],
            flexShrink: 0,
          }}
        >
          DE
        </div>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-bold)' as React.CSSProperties['fontWeight'],
              color: 'var(--text-primary)',
            }}
          >
            DealEstate
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            املاک ایران زمین
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ padding: 'var(--space-4) 0', flex: 1 }}>
        {items.map(item => (
          <SidebarNavItem
            key={item.value}
            item={item}
            isActive={value === item.value}
            onClick={() => onChange(item.value)}
          />
        ))}
      </nav>
    </aside>
  )
}

interface SidebarNavItemProps {
  item: SidebarNavItem
  isActive: boolean
  onClick: () => void
}

function SidebarNavItem({ item, isActive, onClick }: SidebarNavItemProps) {
  const [hovered, setHovered] = useState(false)

  let bg = 'transparent'
  if (isActive) bg = 'var(--color-primary-soft)'
  else if (hovered) bg = 'var(--surface-sunken)'

  const color = isActive ? 'var(--color-primary)' : 'var(--text-secondary)'

  return (
    <button
      aria-current={isActive ? 'page' : undefined}
      data-active={isActive}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: '12px var(--gutter)',
        border: 'none',
        backgroundColor: bg,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 'var(--text-md)',
        fontWeight: isActive
          ? ('var(--weight-semibold)' as React.CSSProperties['fontWeight'])
          : ('var(--weight-regular)' as React.CSSProperties['fontWeight']),
        color,
        borderRadius: 'var(--radius-md)',
        transition: 'background-color 140ms ease, color 140ms ease',
        textAlign: 'right',
      }}
    >
      <span style={{ display: 'inline-flex', color: 'currentColor', flexShrink: 0 }}>
        {item.icon}
      </span>
      {item.label}
    </button>
  )
}
