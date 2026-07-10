import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Building2, PlusCircle, FileText, User } from 'lucide-react'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { BottomNav, type BottomNavItem } from '../navigation/BottomNav'
import { useMediaQuery } from '../../hooks/useMediaQuery'

const NAV_ITEMS: BottomNavItem[] = [
  {
    value: '/',
    label: 'داشبورد',
    icon: (active) => (
      <Home size={24} strokeWidth={active ? 2.4 : 2} color="currentColor" />
    ),
  },
  {
    value: '/files',
    label: 'فایل‌ها',
    icon: (active) => (
      <Building2 size={24} strokeWidth={active ? 2.4 : 2} color="currentColor" />
    ),
  },
  {
    value: '/files/new',
    label: 'افزودن',
    icon: (_active) => (
      <PlusCircle size={28} strokeWidth={2} color="currentColor" />
    ),
  },
  {
    value: '/contracts',
    label: 'قراردادها',
    icon: (active) => (
      <FileText size={24} strokeWidth={active ? 2.4 : 2} color="currentColor" />
    ),
  },
  {
    value: '/profile',
    label: 'پروفایل',
    icon: (active) => (
      <User size={24} strokeWidth={active ? 2.4 : 2} color="currentColor" />
    ),
  },
]

interface AppShellProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  leading?: React.ReactNode
  trailing?: React.ReactNode
  darkHeader?: boolean
  hideNav?: boolean
}

export function AppShell({
  children,
  title,
  subtitle,
  leading,
  trailing,
  darkHeader = false,
  hideNav = false,
}: AppShellProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 920px)')

  // Determine active route: exact match first, then longest prefix match
  const activeRoute = NAV_ITEMS.map(i => i.value)
    .filter(v => location.pathname === v || (v !== '/' && location.pathname.startsWith(v)))
    .sort((a, b) => b.length - a.length)[0] ?? '/'

  function handleNavChange(value: string) {
    navigate(value)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-app)',
        position: 'relative',
      }}
    >
      {/* Desktop sidebar — only rendered on desktop */}
      {!hideNav && isDesktop && (
        <Sidebar value={activeRoute} onChange={handleNavChange} />
      )}

      {/* Main content column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          marginInlineStart: !hideNav && isDesktop ? 260 : 0,
        }}
      >
        {!hideNav && (
          <TopBar
            title={title}
            subtitle={subtitle}
            leading={leading}
            trailing={trailing}
            dark={darkHeader}
          />
        )}

        <main
          style={{
            flex: 1,
            padding: hideNav ? 0 : 'var(--gutter)',
            paddingBottom: !hideNav && !isDesktop
              ? 'calc(var(--bottomnav-h) + var(--gutter))'
              : hideNav
                ? 0
                : 'var(--gutter)',
            maxWidth: isDesktop ? 'none' : 'var(--content-max)',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {children}
        </main>

        {/* Mobile bottom nav */}
        {!hideNav && !isDesktop && (
          <BottomNav
            items={NAV_ITEMS}
            value={activeRoute}
            onChange={handleNavChange}
          />
        )}
      </div>
    </div>
  )
}
