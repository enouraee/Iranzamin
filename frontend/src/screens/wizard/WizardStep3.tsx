import { useState } from 'react'
import { PersonPicker } from './PersonPicker'
import type { WizardData } from '../AddFileScreen'
import { formatToman } from '../../lib/fmt'

interface Props {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
  onNext: () => void
  onBack: () => void
}

function normDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
}

function parseNum(s: string): number {
  return parseInt(normDigits(s), 10)
}

function spelledOut(s: string): string {
  const n = parseNum(s)
  if (!s.trim() || isNaN(n)) return ''
  return `«${formatToman(n)} تومان»`
}

function isValidJalali(s: string): boolean {
  if (!s.trim()) return false
  const n = normDigits(s)
  const m = n.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
  if (!m) return false
  const [, jy, jm, jd] = m.map(Number)
  return jy > 1300 && jy < 1500 && jm >= 1 && jm <= 12 && jd >= 1 && jd <= 31
}

export function WizardStep3({ data, onChange, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const isLand = data.type === 'land'

  function handleNext() {
    const errs: Record<string, string> = {}

    const hasAny = data.is_for_sale || data.is_for_rent || data.is_for_rahn
    if (!hasAny) errs.deal = 'حداقل یک نوع معامله را انتخاب کنید'

    if (data.is_for_sale && !data.total_price.trim()) errs.total_price = 'قیمت کل الزامی است'
    if (data.is_for_rent && !data.monthly_rent.trim()) errs.monthly_rent = 'اجاره ماهیانه الزامی است'
    if (data.is_for_rahn && !data.rahn_amount.trim()) errs.rahn_amount = 'مبلغ رهن الزامی است'

    if (data.status === 'occupied') {
      if (!data.tenant) errs.tenant = 'مستأجر الزامی است'
      if (!data.occupancy_start.trim()) errs.occupancy_start = 'تاریخ شروع الزامی است'
      else if (!isValidJalali(data.occupancy_start)) errs.occupancy_start = 'فرمت تاریخ صحیح نیست (۱۴۰۳/۰۱/۰۱)'
      if (!data.occupancy_end.trim()) errs.occupancy_end = 'تاریخ پایان الزامی است'
      else if (!isValidJalali(data.occupancy_end)) errs.occupancy_end = 'فرمت تاریخ صحیح نیست (۱۴۰۳/۰۱/۰۱)'
      if (!data.occupancy_kind) errs.occupancy_kind = 'نوع اشغال را مشخص کنید'
      if (data.occupancy_kind === 'rent' && !data.occupancy_monthly_rent.trim()) errs.occupancy_monthly_rent = 'اجاره فعلی الزامی است'
      if (data.occupancy_kind === 'rahn' && !data.occupancy_rahn.trim()) errs.occupancy_rahn = 'مبلغ رهن فعلی الزامی است'
    }

    setErrors(errs)
    if (Object.keys(errs).length === 0) onNext()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* ── Deal Type Chips ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={labelStyle}>نوع معامله <span style={{ color: 'var(--color-danger)' }}>*</span></label>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* فروش — always shown */}
          <DealChip
            label="فروش"
            active={data.is_for_sale}
            onClick={() => onChange({ is_for_sale: !data.is_for_sale })}
            disabled={isLand}
          />
          {/* اجاره and رهن — hidden for land */}
          {!isLand && (
            <>
              <DealChip
                label="اجاره"
                active={data.is_for_rent}
                onClick={() => onChange({ is_for_rent: !data.is_for_rent })}
              />
              <DealChip
                label="رهن کامل"
                active={data.is_for_rahn}
                onClick={() => onChange({ is_for_rahn: !data.is_for_rahn })}
              />
            </>
          )}
        </div>
        {errors.deal && <span style={errorStyle}>{errors.deal}</span>}
      </div>

      {/* ── فروش panel ── */}
      {data.is_for_sale && (
        <PricePanel color="blue">
          <PriceField
            label="قیمت هر متر (تومان)"
            value={data.price_per_meter}
            onChange={(v) => onChange({ price_per_meter: v })}
            spelled={spelledOut(data.price_per_meter)}
            spelledColor="var(--blue-700)"
          />
          <PriceField
            label="قیمت کل (تومان)"
            value={data.total_price}
            onChange={(v) => onChange({ total_price: v })}
            spelled={spelledOut(data.total_price)}
            spelledColor="var(--blue-700)"
            error={errors.total_price}
          />
        </PricePanel>
      )}

      {/* ── اجاره panel ── */}
      {data.is_for_rent && (
        <PricePanel color="gold">
          <PriceField
            label="پول پیش (تومان)"
            value={data.deposit}
            onChange={(v) => onChange({ deposit: v })}
            spelled={spelledOut(data.deposit)}
            spelledColor="var(--gold-700)"
          />
          <PriceField
            label="اجاره ماهیانه (تومان)"
            value={data.monthly_rent}
            onChange={(v) => onChange({ monthly_rent: v })}
            spelled={spelledOut(data.monthly_rent)}
            spelledColor="var(--gold-700)"
            error={errors.monthly_rent}
          />
        </PricePanel>
      )}

      {/* ── رهن کامل panel ── */}
      {data.is_for_rahn && (
        <PricePanel color="sunken">
          <PriceField
            label="پول رهن (تومان)"
            value={data.rahn_amount}
            onChange={(v) => onChange({ rahn_amount: v })}
            spelled={spelledOut(data.rahn_amount)}
            spelledColor="var(--text-secondary)"
            error={errors.rahn_amount}
          />
        </PricePanel>
      )}

      {/* ── Status ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={labelStyle}>وضعیت ملک</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatusChip
            label="خالی"
            active={data.status === 'vacant'}
            color="green"
            onClick={() => onChange({ status: 'vacant', tenant: null })}
          />
          <StatusChip
            label="پر"
            active={data.status === 'occupied'}
            color="red"
            onClick={() => onChange({ status: 'occupied' })}
          />
        </div>
      </div>

      {/* ── Occupancy details ── */}
      {data.status === 'occupied' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: '16px 14px',
            background: 'var(--surface-sunken)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
          }}
        >
          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <JDateField
              label="تاریخ شروع"
              value={data.occupancy_start}
              onChange={(v) => onChange({ occupancy_start: v })}
              error={errors.occupancy_start}
            />
            <JDateField
              label="تاریخ پایان"
              value={data.occupancy_end}
              onChange={(v) => onChange({ occupancy_end: v })}
              error={errors.occupancy_end}
            />
          </div>

          {/* Tenant */}
          <PersonPicker
            value={data.tenant}
            onChange={(p) => onChange({ tenant: p })}
            createRole="customer"
            label="مستأجر"
            addLabel="افزودن مستأجر جدید"
            error={errors.tenant}
          />

          {/* Occupancy kind chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={labelStyle}>نوع اشغال</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <OccupancyKindChip
                label="اجاره"
                active={data.occupancy_kind === 'rent'}
                onClick={() => onChange({ occupancy_kind: data.occupancy_kind === 'rent' ? null : 'rent' })}
              />
              <OccupancyKindChip
                label="رهن"
                active={data.occupancy_kind === 'rahn'}
                onClick={() => onChange({ occupancy_kind: data.occupancy_kind === 'rahn' ? null : 'rahn' })}
              />
            </div>
            {errors.occupancy_kind && <span style={errorStyle}>{errors.occupancy_kind}</span>}
          </div>

          {/* اجاره amounts */}
          {data.occupancy_kind === 'rent' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <PriceField
                label="پول پیش فعلی (تومان)"
                value={data.occupancy_deposit}
                onChange={(v) => onChange({ occupancy_deposit: v })}
                spelled={spelledOut(data.occupancy_deposit)}
                spelledColor="var(--text-secondary)"
              />
              <PriceField
                label="اجاره فعلی (تومان)"
                value={data.occupancy_monthly_rent}
                onChange={(v) => onChange({ occupancy_monthly_rent: v })}
                spelled={spelledOut(data.occupancy_monthly_rent)}
                spelledColor="var(--text-secondary)"
                error={errors.occupancy_monthly_rent}
              />
            </div>
          )}

          {/* رهن amounts */}
          {data.occupancy_kind === 'rahn' && (
            <PriceField
              label="پول رهن فعلی (تومان)"
              value={data.occupancy_rahn}
              onChange={(v) => onChange({ occupancy_rahn: v })}
              spelled={spelledOut(data.occupancy_rahn)}
              spelledColor="var(--text-secondary)"
              error={errors.occupancy_rahn}
            />
          )}
        </div>
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

function DealChip({ label, active, onClick, disabled }: { label: string; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '9px 16px',
        borderRadius: 'var(--radius-full)',
        border: active ? '1.5px solid var(--color-primary)' : '1.5px solid var(--border-default)',
        background: active ? 'var(--color-primary-soft)' : 'var(--surface-card)',
        color: active ? 'var(--blue-700)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: active ? ('var(--weight-semibold)' as React.CSSProperties['fontWeight']) : 'inherit',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        transition: 'all 140ms ease',
      }}
    >
      {label}
    </button>
  )
}

function StatusChip({ label, active, color, onClick }: { label: string; active: boolean; color: 'green' | 'red'; onClick: () => void }) {
  const colors = {
    green: { bg: 'var(--color-success-soft)', border: 'var(--color-success)', text: 'var(--color-success-text)' },
    red: { bg: 'var(--color-danger-soft)', border: 'var(--color-danger)', text: 'var(--color-danger-text)' },
  }
  const c = colors[color]
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '9px 20px',
        borderRadius: 'var(--radius-full)',
        border: active ? `1.5px solid ${c.border}` : '1.5px solid var(--border-default)',
        background: active ? c.bg : 'var(--surface-card)',
        color: active ? c.text : 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: active ? ('var(--weight-semibold)' as React.CSSProperties['fontWeight']) : 'inherit',
        cursor: 'pointer',
        transition: 'all 140ms ease',
      }}
    >
      {label}
    </button>
  )
}

function OccupancyKindChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 16px',
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
}

function PricePanel({ color, children }: { color: 'blue' | 'gold' | 'sunken'; children: React.ReactNode }) {
  const styles = {
    blue: { bg: 'var(--blue-50)', border: 'var(--blue-200)' },
    gold: { bg: 'var(--gold-50)', border: 'var(--gold-200)' },
    sunken: { bg: 'var(--surface-sunken)', border: 'var(--border-default)' },
  }
  const s = styles[color]
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: '14px 14px',
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {children}
    </div>
  )
}

function PriceField({
  label,
  value,
  onChange,
  spelled,
  spelledColor,
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  spelled: string
  spelledColor: string
  error?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
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
      {spelled && (
        <span style={{ fontSize: 'var(--text-sm)', color: spelledColor, paddingRight: 4 }}>{spelled}</span>
      )}
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  )
}

function JDateField({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="۱۴۰۳/۰۱/۰۱"
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

