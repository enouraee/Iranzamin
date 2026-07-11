import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRequestMatches, markRequestDone, REQUEST_TYPE_LABEL } from '../../api/requests'
import type { RequestTypeApi, RequestMatchItem } from '../../api/requests'
import type { PropertyTypeApi } from '../../api/types'
import { PROPERTY_TYPE_LABEL } from '../../api/types'
import { formatToman, toPersianDigits } from '../../lib/fmt'
import { useToast } from '../../components/common/Toast'

interface SummaryLine {
  label: string
  value: string
}

interface Props {
  requestId: number
  requestType: RequestTypeApi
  summaryLines: SummaryLine[]
  onDone: () => void
  onPrev: () => void
}

function MatchCard({ item, requestId, onMarkedDone }: { item: RequestMatchItem; requestId: number; onMarkedDone: () => void }) {
  const qc = useQueryClient()
  const { showToast } = useToast()

  const mut = useMutation({
    mutationFn: () => markRequestDone(requestId, item.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] })
      qc.invalidateQueries({ queryKey: ['request-matches', requestId] })
      showToast('درخواست با موفقیت بسته شد', 'success')
      onMarkedDone()
    },
    onError: () => {
      showToast('خطا در بستن درخواست', 'error')
    },
  })

  const price = item.is_for_sale
    ? (item.total_price ? formatToman(item.total_price) + ' تومان' : null)
    : item.is_for_rahn
    ? (item.rahn_amount ? 'رهن ' + formatToman(item.rahn_amount) : null)
    : item.monthly_rent
    ? formatToman(item.monthly_rent) + ' / ماه'
    : null

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 14,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <strong style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {PROPERTY_TYPE_LABEL[item.type as PropertyTypeApi]} — {item.region.name}
          </strong>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.address}</span>
        </div>
        <span
          style={{
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            background: item.status === 'vacant' ? 'var(--color-success-soft)' : 'var(--color-danger-soft)',
            color: item.status === 'vacant' ? 'var(--color-success)' : 'var(--color-danger)',
            flexShrink: 0,
          }}
        >
          {item.status === 'vacant' ? 'خالی' : 'پر'}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
        {item.area && <span>{toPersianDigits(parseFloat(item.area).toFixed(0))} م²</span>}
        {item.beds !== null && <span>· {toPersianDigits(item.beds)} خواب</span>}
        {item.floor !== null && <span>· طبقه {toPersianDigits(item.floor)}</span>}
        {price && <span>· {toPersianDigits(price)}</span>}
      </div>

      <button
        onClick={() => mut.mutate()}
        disabled={mut.isPending}
        style={{
          height: 42,
          border: 'none',
          background: 'var(--color-primary)',
          color: '#fff',
          borderRadius: 10,
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          fontWeight: 600,
          cursor: mut.isPending ? 'default' : 'pointer',
          opacity: mut.isPending ? 0.7 : 1,
        }}
      >
        {mut.isPending ? 'در حال ثبت...' : 'انتخاب این ملک'}
      </button>
    </div>
  )
}

export function ReqStep4({ requestId, requestType, summaryLines, onDone, onPrev }: Props) {
  const { data: matchesData, isLoading } = useQuery({
    queryKey: ['request-matches', requestId],
    queryFn: () => getRequestMatches(requestId),
    staleTime: 30_000,
  })

  const matches = matchesData?.results ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Summary header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'var(--color-success-soft)',
            color: 'var(--color-success)',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
          </svg>
        </span>
        <strong style={{ fontSize: 16, fontWeight: 700 }}>خلاصه درخواست</strong>
      </div>

      {/* Summary lines */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-sunken)',
          borderRadius: 12,
          padding: '4px 16px',
        }}
      >
        <div
          style={{
            padding: '12px 0',
            borderBottom: '1px solid var(--border-default)',
            fontSize: 14,
            color: 'var(--text-primary)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>نوع درخواست</span>
          <span style={{ fontWeight: 600 }}>{REQUEST_TYPE_LABEL[requestType]}</span>
        </div>
        {summaryLines.map((line, i) => (
          <div
            key={i}
            style={{
              padding: '12px 0',
              borderBottom: i < summaryLines.length - 1 ? '1px solid var(--border-default)' : 'none',
              fontSize: 14,
              color: 'var(--text-primary)',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>{line.label}</span>
            <span style={{ fontWeight: 500, textAlign: 'left' }}>{line.value}</span>
          </div>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        با ثبت درخواست، فایل‌های منطبق به‌صورت خودکار به این مشتری پیشنهاد داده می‌شوند.
      </p>

      {/* Matches */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <strong style={{ fontSize: 14, fontWeight: 600 }}>فایل‌های پیشنهادی</strong>
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            در حال جستجوی فایل‌های مناسب...
          </div>
        )}
        {!isLoading && matches.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'var(--text-muted)',
              fontSize: 14,
              background: 'var(--surface-sunken)',
              borderRadius: 12,
            }}
          >
            ملکی با این مشخصات یافت نشد.
          </div>
        )}
        {matches.map((m) => (
          <MatchCard key={m.id} item={m} requestId={requestId} onMarkedDone={onDone} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onPrev}
          style={{
            flex: 1,
            height: 50,
            border: '1px solid var(--border-strong)',
            background: 'var(--surface-card)',
            color: 'var(--color-primary)',
            borderRadius: 12,
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
          قبلی
        </button>
        <button
          onClick={onDone}
          style={{
            flex: 1.6,
            height: 50,
            border: 'none',
            background: 'var(--color-primary)',
            color: '#fff',
            borderRadius: 12,
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          بازگشت به درخواست‌ها
        </button>
      </div>
    </div>
  )
}
