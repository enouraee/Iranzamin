import type { RequestTypeApi } from '../../api/requests'

interface Props {
  requestType: RequestTypeApi | null
  onChange: (t: RequestTypeApi) => void
  onNext: () => void
  onPrev: () => void
}

const TYPES: { type: RequestTypeApi; title: string; desc: string; icon: React.ReactNode }[] = [
  {
    type: 'rent',
    title: 'اجاره',
    desc: 'مستأجر به دنبال ملک اجاره‌ای است',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5 12 3l9 6.5" /><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" /><path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    type: 'rahn',
    title: 'رهن کامل',
    desc: 'رهن بدون اجاره ماهیانه',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    type: 'sale',
    title: 'خرید',
    desc: 'خریدار به دنبال ملک برای خرید است',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
]

export function ReqStep2({ requestType, onChange, onNext, onPrev }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>نوع درخواست را انتخاب کنید</label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TYPES.map(({ type, title, desc, icon }) => {
          const active = requestType === type
          return (
            <button
              key={type}
              onClick={() => onChange(type)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                border: `2px solid ${active ? 'var(--color-primary)' : 'var(--border-default)'}`,
                borderRadius: 14,
                background: active ? 'var(--color-primary-soft)' : 'var(--surface-card)',
                cursor: 'pointer',
                textAlign: 'right',
                width: '100%',
                transition: 'all 150ms ease',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'var(--color-primary-soft)',
                  color: 'var(--color-primary)',
                  flexShrink: 0,
                }}
              >
                {icon}
              </span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <strong style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</strong>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</span>
              </span>
              {active && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          )
        })}
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
          onClick={() => requestType && onNext()}
          disabled={!requestType}
          style={{
            flex: 1.6,
            height: 50,
            border: 'none',
            background: requestType ? 'var(--color-primary)' : 'var(--border-default)',
            color: requestType ? '#fff' : 'var(--text-muted)',
            borderRadius: 12,
            fontFamily: 'var(--font-sans)',
            fontSize: 15,
            fontWeight: 600,
            cursor: requestType ? 'pointer' : 'default',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          ادامه
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
