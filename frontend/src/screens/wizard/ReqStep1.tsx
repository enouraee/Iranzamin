import { useState } from 'react'
import { PersonPicker } from './PersonPicker'
import type { PersonStub } from '../../api/types'

export interface ReqStep1Data {
  customer: PersonStub | null
  quickFirstName: string
  quickLastName: string
  quickPhone: string
}

interface Props {
  data: ReqStep1Data
  onChange: (u: Partial<ReqStep1Data>) => void
  onNext: () => void
}

export function ReqStep1({ data, onChange, onNext }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    const hasExisting = !!data.customer
    const hasQuick = data.quickFirstName.trim() || data.quickPhone.trim()
    if (!hasExisting && !hasQuick) {
      errs.customer = 'مشتری را انتخاب یا اطلاعات افزودن سریع را وارد کنید'
    }
    if (!hasExisting && hasQuick) {
      if (!data.quickFirstName.trim()) errs.quickFirstName = 'نام الزامی است'
      if (!data.quickLastName.trim()) errs.quickLastName = 'نام خانوادگی الزامی است'
      if (!data.quickPhone.trim()) errs.quickPhone = 'شماره تلفن الزامی است'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleNext() {
    if (validate()) onNext()
  }

  const inputStyle = (hasErr: boolean): React.CSSProperties => ({
    width: '100%',
    height: 46,
    padding: '0 12px',
    border: `1px solid ${hasErr ? 'var(--color-danger)' : 'var(--border-default)'}`,
    borderRadius: 10,
    background: 'var(--surface-card)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
    boxSizing: 'border-box',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PersonPicker
        value={data.customer}
        onChange={(p) => onChange({ customer: p })}
        createRole="customer"
        searchRole="customer"
        label="انتخاب مشتری"
        addLabel="افزودن مشتری جدید"
        error={errors.customer}
      />

      {/* OR divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>یا افزودن سریع</span>
        <span style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>نام</label>
          <input
            style={inputStyle(!!errors.quickFirstName)}
            placeholder="نام"
            value={data.quickFirstName}
            onChange={(e) => onChange({ quickFirstName: e.target.value, customer: null })}
          />
          {errors.quickFirstName && <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>{errors.quickFirstName}</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>نام خانوادگی</label>
          <input
            style={inputStyle(!!errors.quickLastName)}
            placeholder="نام خانوادگی"
            value={data.quickLastName}
            onChange={(e) => onChange({ quickLastName: e.target.value, customer: null })}
          />
          {errors.quickLastName && <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>{errors.quickLastName}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>شماره تلفن</label>
        <input
          style={inputStyle(!!errors.quickPhone)}
          placeholder="۰۹۱۲ ۰۰۰ ۰۰۰۰"
          value={data.quickPhone}
          onChange={(e) => onChange({ quickPhone: e.target.value, customer: null })}
          dir="ltr"
        />
        {errors.quickPhone && <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>{errors.quickPhone}</span>}
      </div>

      <button
        onClick={handleNext}
        style={{
          width: '100%',
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
        ادامه
      </button>
    </div>
  )
}
