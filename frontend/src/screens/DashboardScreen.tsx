import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { StatCard } from '../components/data/StatCard'
import { getDashboardStats, getProfile } from '../api/dashboard'
import { toPersianDigits } from '../lib/fmt'
import type { RecentPropertySummary } from '../api/types'

function RecentPropertyRow({
  prop,
  onClick,
}: {
  prop: RecentPropertySummary
  onClick: () => void
}) {
  const isVacant = prop.status === 'خالی'
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        display: 'flex',
        gap: 12,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 14,
        padding: 12,
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
      }}
    >
      {/* gradient placeholder */}
      <div
        aria-hidden="true"
        style={{
          width: 74,
          height: 74,
          flexShrink: 0,
          borderRadius: 10,
          background: 'linear-gradient(135deg, var(--blue-500), var(--blue-700))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.85)',
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
        </svg>
      </div>

      {/* content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <strong
            style={{
              fontSize: 14,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {prop.type} {prop.region_name}
          </strong>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
              flexShrink: 0,
              background: isVacant ? 'var(--color-success-soft)' : 'var(--color-danger-soft)',
              color: isVacant ? 'var(--color-success-text)' : 'var(--color-danger-text)',
            }}
          >
            {prop.status}
          </span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
          {prop.region_name} · {prop.address}
        </span>
      </div>
    </div>
  )
}

export default function DashboardScreen() {
  const navigate = useNavigate()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  })

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const firstName = profile?.first_name ?? ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Greeting */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
          سلام{firstName ? `، ${firstName}` : ''} 👋
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
          خلاصه‌ی فعالیت دفتر در یک نگاه.
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
        }}
      >
        <StatCard
          label="فایل‌های فعال"
          value={statsLoading ? '—' : toPersianDigits(stats?.total_properties ?? 0)}
          accent="primary"
        />
        <StatCard
          label="قرارداد این ماه"
          value={statsLoading ? '—' : toPersianDigits(stats?.total_contracts ?? 0)}
          accent="success"
        />
        <StatCard
          label="درخواست در انتظار"
          value={statsLoading ? '—' : toPersianDigits(stats?.open_requests ?? 0)}
          accent="accent"
        />
        <StatCard
          label="نزدیک به پایان"
          value={toPersianDigits(0)}
          accent="danger"
        />
      </div>

      {/* Ending contracts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
            قراردادهای نزدیک به پایان
          </h3>
          <button
            onClick={() => navigate('/contracts')}
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--color-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            همه
          </button>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '16px 0',
            fontFamily: 'var(--font-sans)',
          }}
        >
          قراردادی در آستانه پایان وجود ندارد.
        </p>
      </div>

      {/* Recent files */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
            آخرین فایل‌ها
          </h3>
          <button
            onClick={() => navigate('/files')}
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--color-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            همه فایل‌ها
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {statsLoading ? (
            <p
              data-testid="loading"
              style={{
                margin: 0,
                fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '16px 0',
                fontFamily: 'var(--font-sans)',
              }}
            >
              در حال بارگذاری...
            </p>
          ) : !stats?.recent_properties?.length ? (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '16px 0',
                fontFamily: 'var(--font-sans)',
              }}
            >
              فایلی یافت نشد.
            </p>
          ) : (
            stats!.recent_properties.map((prop) => (
              <RecentPropertyRow
                key={prop.id}
                prop={prop}
                onClick={() => navigate(`/files/${prop.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
