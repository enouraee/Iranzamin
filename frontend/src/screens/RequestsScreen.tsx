import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getRequests, REQUEST_TYPE_LABEL } from '../api/requests'
import type { RequestApi, RequestTypeApi, RequestStatusApi } from '../api/requests'
import { toPersianDigits, formatToman, toJalali } from '../lib/fmt'

const TYPE_FILTER_OPTIONS: { label: string; value: RequestTypeApi | '' }[] = [
  { label: 'همه', value: '' },
  { label: 'اجاره', value: 'rent' },
  { label: 'رهن', value: 'rahn' },
  { label: 'خرید', value: 'sale' },
]

const STATUS_FILTER_OPTIONS: { label: string; value: RequestStatusApi | '' }[] = [
  { label: 'باز', value: 'open' },
  { label: 'انجام‌شده', value: 'done' },
  { label: 'همه', value: '' },
]

const TYPE_PILL_STYLE: Record<RequestTypeApi, React.CSSProperties> = {
  rent: { background: 'var(--color-primary-soft)', color: 'var(--color-primary)' },
  rahn: { background: '#f5f0fe', color: '#7c3aed' },
  sale: { background: 'var(--color-success-soft)', color: 'var(--color-success)' },
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(' ')
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0]?.substring(0, 2) ?? '؟'
}

function requestSummary(r: RequestApi): string {
  const parts: string[] = []
  if (r.region) parts.push(r.region.name)
  if (r.beds !== null) parts.push(toPersianDigits(r.beds) + ' خواب')
  if (r.min_area || r.max_area) {
    const range = (r.min_area ? toPersianDigits(parseFloat(r.min_area).toFixed(0)) : '—') + '–' + (r.max_area ? toPersianDigits(parseFloat(r.max_area).toFixed(0)) : '—') + ' م²'
    parts.push(range)
  }
  if (r.budget) parts.push(formatToman(r.budget) + ' تومان')
  if (r.max_deposit) parts.push('پیش ' + formatToman(r.max_deposit))
  return parts.join(' · ') || '—'
}

export default function RequestsScreen() {
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState<RequestTypeApi | ''>('')
  const [statusFilter, setStatusFilter] = useState<RequestStatusApi | ''>('open')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['requests', typeFilter, statusFilter],
    queryFn: () =>
      getRequests({
        request_type: typeFilter || undefined,
        status: statusFilter || undefined,
        page_size: 50,
      }),
    staleTime: 30_000,
  })

  const results = data?.results ?? []

  // Client-side search by name/phone/notes
  const filtered = search.trim()
    ? results.filter((r) => {
        const q = search.toLowerCase()
        return (
          r.customer.full_name.includes(q) ||
          r.customer.phone.includes(q) ||
          (r.notes && r.notes.includes(q))
        )
      })
    : results

  const openCount = data?.count ?? 0

  function chipStyle(active: boolean): React.CSSProperties {
    return {
      padding: '6px 14px',
      border: `1px solid ${active ? 'var(--color-primary)' : 'var(--border-default)'}`,
      borderRadius: 20,
      background: active ? 'var(--color-primary-soft)' : 'var(--surface-card)',
      color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      cursor: 'pointer',
      fontWeight: active ? 600 : 400,
      whiteSpace: 'nowrap',
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 'var(--space-4)', maxWidth: 480, margin: '0 auto', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
          {toPersianDigits(statusFilter === 'open' ? openCount : filtered.length)} درخواست
          {statusFilter === 'open' ? ' در جریان' : ''}
        </p>
        <button
          onClick={() => navigate('/requests/new')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 42,
            padding: '0 16px',
            border: 'none',
            borderRadius: 10,
            background: 'var(--color-primary)',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5v14" />
          </svg>
          ثبت درخواست
        </button>
      </div>

      {/* Search */}
      <input
        role="searchbox"
        style={{
          width: '100%',
          height: 46,
          padding: '0 12px',
          border: '1px solid var(--border-default)',
          borderRadius: 10,
          background: 'var(--surface-card)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          outline: 'none',
          boxSizing: 'border-box',
        }}
        placeholder="جستجوی نام، شماره تلفن یا توضیحات..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Type filter chips */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 2,
          scrollbarWidth: 'none',
        }}
      >
        {TYPE_FILTER_OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setTypeFilter(value)}
            style={chipStyle(typeFilter === value)}
          >
            {label}
          </button>
        ))}
        <span style={{ flex: '0 0 8px' }} />
        {STATUS_FILTER_OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            style={chipStyle(statusFilter === value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 14 }}>
          در حال بارگذاری...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)', fontSize: 14 }}>
          درخواستی با این مشخصات یافت نشد.
        </div>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((r: RequestApi) => (
          <div
            key={r.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 14,
              padding: 14,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'var(--color-primary-soft)',
                    color: 'var(--blue-700, var(--color-primary))',
                    fontWeight: 600,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {initials(r.customer.full_name)}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <strong style={{ fontSize: 14, fontWeight: 600 }}>{r.customer.full_name}</strong>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', direction: 'ltr', textAlign: 'right' }}>
                    {r.customer.phone}
                  </span>
                </div>
              </div>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  flexShrink: 0,
                  ...TYPE_PILL_STYLE[r.request_type],
                }}
              >
                {REQUEST_TYPE_LABEL[r.request_type]}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {requestSummary(r)}
            </p>

            {r.deadline && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                مهلت: {toPersianDigits(toJalali(r.deadline))}
              </div>
            )}

            {r.status === 'done' && r.matched_property && (
              <div style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 500 }}>
                ✓ انجام‌شده — {r.matched_property.address}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
