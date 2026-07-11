import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getContracts } from '../api/contracts'
import type { ContractApi } from '../api/contracts'
import type { ContractTypeApi } from '../api/types'
import { toPersianDigits, toJalali, formatToman } from '../lib/fmt'

const CONTRACT_TYPE_LABELS: Record<ContractTypeApi, string> = {
  sale: 'فروش',
  rent: 'اجاره',
  rahn: 'رهن',
}

const TYPE_COLORS: Record<ContractTypeApi, { bg: string; color: string }> = {
  sale: { bg: 'var(--color-primary-soft)', color: 'var(--blue-700)' },
  rent: { bg: 'var(--color-accent-soft)', color: 'var(--gold-700)' },
  rahn: { bg: 'var(--surface-sunken)', color: 'var(--text-secondary)' },
}

const CONTRACT_TYPES: ContractTypeApi[] = ['sale', 'rent', 'rahn']

function contractAmount(c: ContractApi): string {
  if (c.contract_type === 'sale' && c.sale_price) return formatToman(c.sale_price) + ' تومان'
  if (c.contract_type === 'rent') {
    const parts: string[] = []
    if (c.deposit_amount) parts.push(formatToman(c.deposit_amount) + ' پیش')
    if (c.monthly_rent) parts.push(formatToman(c.monthly_rent) + '/ماه')
    return parts.join(' · ') || '—'
  }
  if (c.contract_type === 'rahn' && c.rahn_amount) return formatToman(c.rahn_amount) + ' رهن'
  return '—'
}

function ContractCard({ c }: { c: ContractApi }) {
  const typeStyle = TYPE_COLORS[c.contract_type]
  const partyName = c.party_b?.full_name ?? c.party_a?.full_name ?? '—'
  const startJ = toJalali(c.start_date)
  const endJ = c.end_date ? toJalali(c.end_date) : null
  const datesStr = endJ ? `${startJ} تا ${endJ}` : startJ

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 9,
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 14, padding: 14,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <strong style={{
          fontSize: 15, fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {c.property.address}
        </strong>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '3px 9px', borderRadius: 999,
          fontSize: 12, fontWeight: 600, flexShrink: 0,
          background: typeStyle.bg, color: typeStyle.color,
        }}>
          {CONTRACT_TYPE_LABELS[c.contract_type]}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
        {partyName}
      </div>
      <div style={{ height: 1, background: 'var(--border-default)' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {datesStr}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>
          {contractAmount(c)}
        </span>
      </div>
    </div>
  )
}

export default function ContractsScreen() {
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState<ContractTypeApi | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contracts', typeFilter],
    queryFn: () => getContracts({ contract_type: typeFilter ?? undefined, page_size: 50 }),
    staleTime: 30_000,
  })

  const contracts = data?.results ?? []
  const total = data?.count ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
          {toPersianDigits(total)} قرارداد ثبت‌شده
        </p>
        <button
          onClick={() => navigate('/contracts/new')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 42, padding: '0 16px',
            border: 'none', borderRadius: 10,
            background: 'var(--color-primary)', color: '#ffffff',
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5v14" />
          </svg>
          ثبت قرارداد
        </button>
      </div>

      {/* Type filter chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        <button
          onClick={() => setTypeFilter(null)}
          style={chipStyle(typeFilter === null)}
        >همه</button>
        {CONTRACT_TYPES.map((ct) => (
          <button
            key={ct}
            onClick={() => setTypeFilter(typeFilter === ct ? null : ct)}
            style={chipStyle(typeFilter === ct)}
          >
            {CONTRACT_TYPE_LABELS[ct]}
          </button>
        ))}
      </div>

      {/* Body */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)', fontSize: 14 }}>
          در حال بارگذاری...
        </div>
      )}
      {isError && (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--color-danger)', fontSize: 14 }}>
          خطا در بارگذاری قراردادها
        </div>
      )}
      {!isLoading && !isError && contracts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)', fontSize: 14 }}>
          قراردادی با این مشخصات یافت نشد.
        </div>
      )}
      {!isLoading && contracts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {contracts.map((c) => <ContractCard key={c.id} c={c} />)}
        </div>
      )}
    </div>
  )
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 14px',
    borderRadius: 999,
    border: active ? 'none' : '1px solid var(--border-default)',
    background: active ? 'var(--color-primary)' : 'var(--surface-card)',
    color: active ? '#ffffff' : 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }
}
