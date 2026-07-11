import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProperties } from '../../api/properties'
import type { PropertyListItem, ContractTypeApi } from '../../api/types'
import { toPersianDigits } from '../../lib/fmt'

export interface ContractWizardData {
  property: PropertyListItem | null
  contract_type: ContractTypeApi | null
  party_a_id: number | null
  party_a_name: string
  party_b_id: number | null
  party_b_name: string
  start_date: string
  end_date: string
  sale_price: string
  deposit_amount: string
  monthly_rent: string
  rahn_amount: string
  photo_files: string[]
  notes: string
}

export const CONTRACT_INITIAL: ContractWizardData = {
  property: null,
  contract_type: null,
  party_a_id: null,
  party_a_name: '',
  party_b_id: null,
  party_b_name: '',
  start_date: '',
  end_date: '',
  sale_price: '',
  deposit_amount: '',
  monthly_rent: '',
  rahn_amount: '',
  photo_files: [],
  notes: '',
}

const CONTRACT_TYPE_LABELS: Record<ContractTypeApi, string> = {
  sale: 'فروش',
  rent: 'اجاره',
  rahn: 'رهن',
}

interface Props {
  data: ContractWizardData
  onChange: (u: Partial<ContractWizardData>) => void
  onNext: () => void
}

export function ContractStep1({ data, onChange, onNext }: Props) {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 280)
    return () => clearTimeout(t)
  }, [search])

  const { data: propData, isLoading } = useQuery({
    queryKey: ['properties', 'picker', debounced],
    queryFn: () => getProperties({ search: debounced || undefined, page_size: 20 }),
    staleTime: 30_000,
  })

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function selectProperty(p: PropertyListItem) {
    onChange({ property: p })
    setSearch('')
    setOpen(false)
  }

  function clearProperty() {
    onChange({ property: null })
    setSearch('')
  }

  function handleNext() {
    const errs: Record<string, string> = {}
    if (!data.property) errs.property = 'ملک را انتخاب کنید'
    if (!data.contract_type) errs.contract_type = 'نوع قرارداد را انتخاب کنید'
    setErrors(errs)
    if (Object.keys(errs).length === 0) onNext()
  }

  const properties = propData?.results ?? []

  const statusLabel = data.property?.status === 'vacant' ? 'خالی' : 'پر'
  const statusColor = data.property?.status === 'vacant' ? 'var(--color-success)' : 'var(--color-danger)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* Property Picker */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} ref={containerRef}>
        <label style={labelStyle}>
          انتخاب ملک <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>

        {data.property ? (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '12px 14px',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary-soft)',
            cursor: 'pointer',
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {data.property.title || data.property.address}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {data.property.region.name} · {data.property.address}
              </p>
              <span style={{
                display: 'inline-block',
                marginTop: 4,
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                background: data.property.status === 'vacant' ? 'var(--color-success-soft)' : 'var(--color-danger-soft)',
                color: statusColor,
              }}>
                {statusLabel}
              </span>
            </div>
            <button type="button" onClick={clearProperty} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 2,
            }}>✕</button>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              placeholder="جستجوی آدرس، منطقه یا مالک..."
              style={{
                width: '100%',
                height: 46,
                padding: '0 12px',
                border: `1px solid ${errors.property ? 'var(--color-danger)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-md)',
                color: 'var(--text-primary)',
                direction: 'rtl',
                outline: 'none',
                background: 'var(--surface-card)',
              }}
            />
            {open && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                left: 0,
                zIndex: 50,
                background: 'var(--surface-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                maxHeight: 260,
                overflowY: 'auto',
                marginTop: 4,
              }}>
                {isLoading && (
                  <div style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                    در حال جستجو...
                  </div>
                )}
                {!isLoading && properties.length === 0 && (
                  <div style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                    ملکی یافت نشد.
                  </div>
                )}
                {properties.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectProperty(p)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      padding: '10px 14px',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid var(--border-default)',
                      cursor: 'pointer',
                      textAlign: 'right',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {p.title || p.address}
                    </span>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      {p.region.name} · {p.address}
                    </span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: p.status === 'vacant' ? 'var(--color-success)' : 'var(--color-danger)',
                    }}>
                      {p.status === 'vacant' ? 'خالی' : 'پر'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {errors.property && <span style={errorStyle}>{errors.property}</span>}
      </div>

      {/* Contract Type */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={labelStyle}>
          نوع قرارداد <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['sale', 'rent', 'rahn'] as ContractTypeApi[]).map((ct) => {
            const active = data.contract_type === ct
            return (
              <button
                key={ct}
                type="button"
                onClick={() => onChange({ contract_type: ct })}
                style={{
                  flex: 1,
                  height: 44,
                  border: active ? 'none' : '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  background: active ? 'var(--color-primary)' : 'var(--surface-card)',
                  color: active ? '#ffffff' : 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-md)',
                  fontWeight: active ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {CONTRACT_TYPE_LABELS[ct]}
              </button>
            )
          })}
        </div>
        {errors.contract_type && <span style={errorStyle}>{errors.contract_type}</span>}
      </div>

      {/* Next */}
      <button type="button" onClick={handleNext} style={nextBtnStyle}>
        مرحله بعد
      </button>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)' as React.CSSProperties['fontWeight'],
  color: 'var(--text-secondary)',
}

const errorStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-danger)',
}

const nextBtnStyle: React.CSSProperties = {
  height: 48,
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--color-primary)',
  color: '#ffffff',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-md)',
  fontWeight: 'var(--weight-semibold)' as React.CSSProperties['fontWeight'],
  cursor: 'pointer',
  marginTop: 'var(--space-3)' as React.CSSProperties['marginTop'],
}

export { toPersianDigits }
