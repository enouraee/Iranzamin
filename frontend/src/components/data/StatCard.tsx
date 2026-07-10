import React from 'react'

type Accent = 'primary' | 'success' | 'danger' | 'accent'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down'
  trendValue?: string
  accent?: Accent
}

const ACCENT_COLOR: Record<Accent, string> = {
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  danger:  'var(--color-danger)',
  accent:  'var(--color-accent)',
}

const ACCENT_SOFT: Record<Accent, string> = {
  primary: 'var(--color-primary-soft)',
  success: 'var(--color-success-soft)',
  danger:  'var(--color-danger-soft)',
  accent:  'var(--color-accent-soft)',
}

export function StatCard({ label, value, icon, trend, trendValue, accent = 'primary' }: StatCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 'var(--space-4)',
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Row 1: label + icon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </span>
        {icon && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              backgroundColor: ACCENT_SOFT[accent],
              color: ACCENT_COLOR[accent],
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Row 2: value */}
      <span
        style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--weight-bold)' as React.CSSProperties['fontWeight'],
          color: 'var(--text-primary)',
          lineHeight: 1.2,
        }}
      >
        {value}
      </span>

      {/* Row 3: trend */}
      {trend && trendValue && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 'var(--text-xs)',
            color: trend === 'up' ? 'var(--color-success-text)' : 'var(--color-danger-text)',
          }}
        >
          {trend === 'up' ? '▲' : '▼'}
          {trendValue}
        </span>
      )}
    </div>
  )
}
