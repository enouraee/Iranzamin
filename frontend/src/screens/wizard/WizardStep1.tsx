import { useState } from 'react'
import { RegionPicker } from './RegionPicker'
import type { WizardData } from '../AddFileScreen'
import type { PropertyTypeApi } from '../../api/types'
import { PROPERTY_TYPE_LABEL } from '../../api/types'

interface Props {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
  onNext: () => void
}

// تجاری / اداری / ویلا are hidden for now — may be unhidden later.
const TYPE_ORDER: PropertyTypeApi[] = ['apartment', 'kalnagi', 'land']

// For land type, force is_for_sale
function typeDefaults(type: PropertyTypeApi): Partial<WizardData> {
  if (type === 'land') {
    return { type, is_for_sale: true, is_for_rent: false, is_for_rahn: false }
  }
  return { type }
}

// Which types share apartment-style location fields (plak + floor + unit)
function isAptStyle(type: PropertyTypeApi | null): boolean {
  return type === 'apartment' || type === 'commercial' || type === 'office' || type === 'villa'
}

export function WizardStep1({ data, onChange, onNext }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleTypeClick(type: PropertyTypeApi) {
    onChange(typeDefaults(type))
  }

  function handleNext() {
    const errs: Record<string, string> = {}
    if (!data.type) errs.type = 'نوع ملک را انتخاب کنید'
    if (!data.region) errs.region = 'منطقه را انتخاب کنید'
    if (!data.address.trim()) errs.address = 'آدرس را وارد کنید'
    setErrors(errs)
    if (Object.keys(errs).length === 0) onNext()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Type picker */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)' as React.CSSProperties['fontWeight'],
            color: 'var(--text-secondary)',
          }}
        >
          نوع ملک <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {TYPE_ORDER.map((t) => {
            const active = data.type === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeClick(t)}
                style={{
                  padding: '10px 6px',
                  borderRadius: 'var(--radius-md)',
                  border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--border-default)',
                  background: active ? 'var(--color-primary-soft)' : 'var(--surface-card)',
                  color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: active ? ('var(--weight-bold)' as React.CSSProperties['fontWeight']) : 'inherit',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 140ms ease',
                }}
              >
                {PROPERTY_TYPE_LABEL[t]}
              </button>
            )
          })}
        </div>
        {errors.type && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>{errors.type}</span>
        )}
      </div>

      {/* Location fields — only shown when type is selected */}
      {data.type && (
        <>
          <RegionPicker
            value={data.region}
            onChange={(r) => onChange({ region: r })}
            error={errors.region}
          />

          {/* Address */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                color: 'var(--text-secondary)',
              }}
            >
              آدرس <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <textarea
              value={data.address}
              onChange={(e) => onChange({ address: e.target.value })}
              placeholder="آدرس کامل ملک را وارد کنید"
              rows={3}
              style={{
                padding: '12px 14px',
                border: `1px solid ${errors.address ? 'var(--color-danger)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-md)',
                color: 'var(--text-primary)',
                direction: 'rtl',
                resize: 'vertical',
                outline: 'none',
                backgroundColor: 'var(--surface-card)',
              }}
            />
            {errors.address && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>{errors.address}</span>
            )}
          </div>

          {/* Apartment-style: plak + floor + unit */}
          {isAptStyle(data.type) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <FieldInput
                label="پلاک"
                value={data.plak}
                onChange={(v) => onChange({ plak: v })}
                placeholder="مثال: ۵"
              />
              <FieldInput
                label="طبقه"
                value={data.floor}
                onChange={(v) => onChange({ floor: v })}
                placeholder="مثال: ۳"
              />
              <FieldInput
                label="واحد"
                value={data.unit}
                onChange={(v) => onChange({ unit: v })}
                placeholder="مثال: ۷"
              />
            </div>
          )}

          {/* Kalnagi/Land: only plak */}
          {(data.type === 'kalnagi' || data.type === 'land') && (
            <FieldInput
              label="پلاک"
              value={data.plak}
              onChange={(v) => onChange({ plak: v })}
              placeholder="پلاک ملک"
            />
          )}
        </>
      )}

      {/* Navigation */}
      <button
        type="button"
        onClick={handleNext}
        style={nextBtnStyle}
      >
        بعدی
      </button>
    </div>
  )
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-medium)' as React.CSSProperties['fontWeight'],
          color: 'var(--text-secondary)',
        }}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          height: 46,
          padding: '0 12px',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-md)',
          color: 'var(--text-primary)',
          direction: 'rtl',
          outline: 'none',
          backgroundColor: 'var(--surface-card)',
          width: '100%',
        }}
      />
      {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  )
}

const nextBtnStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--color-primary)',
  color: '#ffffff',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-md)',
  fontWeight: 'var(--weight-semibold)' as React.CSSProperties['fontWeight'],
  cursor: 'pointer',
  marginTop: 'var(--space-3)',
}
