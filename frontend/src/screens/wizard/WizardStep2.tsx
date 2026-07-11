import { useState } from 'react'
import { Switch } from '../../components/forms/Switch'
import type { WizardData } from '../AddFileScreen'
import type { CabinetMaterialApi } from '../../api/types'
import { toPersianDigits } from '../../lib/fmt'

interface Props {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}

const AMENITIES: { key: keyof WizardData; label: string }[] = [
  { key: 'has_parking', label: 'پارکینگ' },
  { key: 'has_obstructive_parking', label: 'پارکینگ مزاحم' },
  { key: 'has_balcony', label: 'بالکن' },
  { key: 'has_backyard', label: 'حیاط خلوت' },
  { key: 'has_elevator', label: 'آسانسور' },
]

const CABINET_OPTIONS: { value: CabinetMaterialApi; label: string }[] = [
  { value: 'open', label: 'اوپن' },
  { value: 'mdf', label: 'MDF' },
]

function isAptStyle(type: WizardData['type']): boolean {
  return type === 'apartment' || type === 'commercial' || type === 'office' || type === 'villa'
}

function isKalnagi(type: WizardData['type']): boolean {
  return type === 'kalnagi'
}

function isLand(type: WizardData['type']): boolean {
  return type === 'land'
}

export function WizardStep2({ data, onChange, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleNext() {
    const errs: Record<string, string> = {}

    if (isAptStyle(data.type)) {
      if (data.has_storage && !data.storage_area.trim()) {
        errs.storage_area = 'متراژ انباری را وارد کنید'
      }
    }
    if (isKalnagi(data.type) || isLand(data.type)) {
      if (data.has_aqab_neshini && !data.aqab_neshini_desc.trim()) {
        errs.aqab_neshini_desc = 'توضیحات عقب‌نشینی الزامی است'
      }
    }
    if (isKalnagi(data.type)) {
      if (data.has_hayat && !data.hayat_area.trim()) {
        errs.hayat_area = 'متراژ حیاط را وارد کنید'
      }
    }

    setErrors(errs)
    if (Object.keys(errs).length === 0) onNext()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* ── APARTMENT / COMMERCIAL / OFFICE / VILLA ── */}
      {isAptStyle(data.type) && (
        <>
          {/* Amenity chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={labelStyle}>امکانات</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AMENITIES.map(({ key, label }) => {
                const active = !!data[key]
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChange({ [key]: !active })}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-full)',
                      border: active ? '1.5px solid var(--color-primary)' : '1.5px solid var(--border-default)',
                      background: active ? 'var(--color-primary-soft)' : 'var(--surface-card)',
                      color: active ? 'var(--blue-700)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-sm)',
                      cursor: 'pointer',
                      transition: 'all 140ms ease',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* متراژ + تعداد خواب */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FieldInput
              label="متراژ (م²)"
              value={data.area}
              onChange={(v) => onChange({ area: v })}
              placeholder="مثال: ۱۲۰"
              type="number"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>تعداد خواب</label>
              <Stepper value={data.beds} onChange={(v) => onChange({ beds: v })} min={0} />
            </div>
          </div>

          {/* جنس کابینت */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={labelStyle}>جنس کابینت</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {CABINET_OPTIONS.map(({ value: cv, label }) => {
                const active = data.cabinet_material === cv
                return (
                  <button
                    key={cv}
                    type="button"
                    onClick={() => onChange({ cabinet_material: active ? '' : cv })}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 'var(--radius-full)',
                      border: active ? '1.5px solid var(--color-primary)' : '1.5px solid var(--border-default)',
                      background: active ? 'var(--color-primary-soft)' : 'var(--surface-card)',
                      color: active ? 'var(--blue-700)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* سال ساخت */}
          <FieldInput
            label="سال ساخت (شمسی)"
            value={data.build_year}
            onChange={(v) => onChange({ build_year: v })}
            placeholder="مثال: ۱۴۰۲"
          />

          {/* انباری toggle */}
          <ToggleRow
            label="انباری دارد"
            checked={data.has_storage}
            onChange={(v) => onChange({ has_storage: v, storage_area: v ? data.storage_area : '', storage_deed: v ? data.storage_deed : false })}
          />
          {data.has_storage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 16, borderRight: '2px solid var(--border-default)' }}>
              <ToggleRow
                label="انباری سندی"
                checked={data.storage_deed}
                onChange={(v) => onChange({ storage_deed: v })}
              />
              <FieldInput
                label="متراژ انباری (م²)"
                value={data.storage_area}
                onChange={(v) => onChange({ storage_area: v })}
                placeholder="مثال: ۵"
                type="number"
                error={errors.storage_area}
              />
            </div>
          )}

          {/* تبدیل دارد toggle */}
          <ToggleRow
            label="تبدیل دارد"
            checked={data.has_tobdil}
            onChange={(v) => onChange({ has_tobdil: v })}
          />
        </>
      )}

      {/* ── KALNAGI ── */}
      {isKalnagi(data.type) && (
        <>
          <FieldInput
            label="متراژ (م²)"
            value={data.area}
            onChange={(v) => onChange({ area: v })}
            placeholder="مثال: ۲۰۰"
            type="number"
          />

          <ToggleRow
            label="عقب‌نشینی دارد"
            checked={data.has_aqab_neshini}
            onChange={(v) => onChange({ has_aqab_neshini: v, aqab_neshini_desc: v ? data.aqab_neshini_desc : '' })}
          />
          {data.has_aqab_neshini && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 16, borderRight: '2px solid var(--border-default)' }}>
              <label style={labelStyle}>توضیحات عقب‌نشینی</label>
              <textarea
                value={data.aqab_neshini_desc}
                onChange={(e) => onChange({ aqab_neshini_desc: e.target.value })}
                placeholder="توضیحات عقب‌نشینی را وارد کنید"
                rows={2}
                style={textareaStyle(!!errors.aqab_neshini_desc)}
              />
              {errors.aqab_neshini_desc && (
                <span style={errorStyle}>{errors.aqab_neshini_desc}</span>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FieldInput
              label="تعداد بر"
              value={data.taadad_bar}
              onChange={(v) => onChange({ taadad_bar: v })}
              placeholder="مثال: ۲"
              type="number"
            />
            <FieldInput
              label="گذر کوچه (متر)"
              value={data.gozar_kooche}
              onChange={(v) => onChange({ gozar_kooche: v })}
              placeholder="مثال: ۶"
              type="number"
            />
          </div>

          <FieldInput
            label="تعداد طبقات"
            value={data.taadad_tabaghat}
            onChange={(v) => onChange({ taadad_tabaghat: v })}
            placeholder="مثال: ۳"
            type="number"
          />

          <ToggleRow
            label="حیاط دارد"
            checked={data.has_hayat}
            onChange={(v) => onChange({ has_hayat: v, hayat_area: v ? data.hayat_area : '' })}
          />
          {data.has_hayat && (
            <div style={{ paddingRight: 16, borderRight: '2px solid var(--border-default)' }}>
              <FieldInput
                label="متراژ حیاط (م²)"
                value={data.hayat_area}
                onChange={(v) => onChange({ hayat_area: v })}
                placeholder="مثال: ۸۰"
                type="number"
                error={errors.hayat_area}
              />
            </div>
          )}
        </>
      )}

      {/* ── LAND ── */}
      {isLand(data.type) && (
        <>
          <FieldInput
            label="متراژ (م²)"
            value={data.area}
            onChange={(v) => onChange({ area: v })}
            placeholder="مثال: ۳۰۰"
            type="number"
          />

          <ToggleRow
            label="عقب‌نشینی دارد"
            checked={data.has_aqab_neshini}
            onChange={(v) => onChange({ has_aqab_neshini: v, aqab_neshini_desc: v ? data.aqab_neshini_desc : '' })}
          />
          {data.has_aqab_neshini && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 16, borderRight: '2px solid var(--border-default)' }}>
              <label style={labelStyle}>توضیحات عقب‌نشینی</label>
              <textarea
                value={data.aqab_neshini_desc}
                onChange={(e) => onChange({ aqab_neshini_desc: e.target.value })}
                placeholder="توضیحات عقب‌نشینی را وارد کنید"
                rows={2}
                style={textareaStyle(!!errors.aqab_neshini_desc)}
              />
              {errors.aqab_neshini_desc && (
                <span style={errorStyle}>{errors.aqab_neshini_desc}</span>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FieldInput
              label="تعداد بر"
              value={data.taadad_bar}
              onChange={(v) => onChange({ taadad_bar: v })}
              placeholder="مثال: ۱"
              type="number"
            />
            <FieldInput
              label="گذر کوچه (متر)"
              value={data.gozar_kooche}
              onChange={(v) => onChange({ gozar_kooche: v })}
              placeholder="مثال: ۴"
              type="number"
            />
          </div>
        </>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10, marginTop: 'var(--space-3)' }}>
        <button type="button" onClick={onBack} style={backBtnStyle}>قبلی</button>
        <button type="button" onClick={handleNext} style={{ ...nextBtnStyle, flex: 1 }}>بعدی</button>
      </div>
    </div>
  )
}

// ── Sub-components ──

function Stepper({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 46,
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: '0 8px',
        backgroundColor: 'var(--surface-card)',
      }}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        style={stepperBtnStyle}
        aria-label="کاهش"
      >
        −
      </button>
      <span style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' as React.CSSProperties['fontWeight'], color: 'var(--text-primary)' }}>
        {toPersianDigits(value)}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        style={stepperBtnStyle}
        aria-label="افزایش"
      >
        +
      </button>
    </div>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '13px 14px',
        background: 'var(--surface-sunken)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-medium)' as React.CSSProperties['fontWeight'], color: 'var(--text-primary)' }}>
        {label}
      </span>
      <Switch checked={checked} onChange={onChange} />
    </div>
  )
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  error?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type === 'number' ? 'text' : type}
        inputMode={type === 'number' ? 'decimal' : undefined}
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
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  )
}

// ── Styles ──
const labelStyle: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)' as React.CSSProperties['fontWeight'],
  color: 'var(--text-secondary)',
}

const errorStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-danger)',
}

function textareaStyle(hasError: boolean): React.CSSProperties {
  return {
    padding: '10px 12px',
    border: `1px solid ${hasError ? 'var(--color-danger)' : 'var(--border-default)'}`,
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    color: 'var(--text-primary)',
    direction: 'rtl',
    resize: 'vertical',
    outline: 'none',
    backgroundColor: 'var(--surface-card)',
    width: '100%',
  }
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
}

const backBtnStyle: React.CSSProperties = {
  height: 48,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-strong)',
  background: 'var(--surface-card)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-md)',
  cursor: 'pointer',
  padding: '0 20px',
}

const stepperBtnStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  border: 'none',
  background: 'var(--surface-sunken)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 18,
  color: 'var(--text-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
}
