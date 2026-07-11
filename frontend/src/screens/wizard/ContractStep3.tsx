import { useState } from 'react'
import type { ContractWizardData } from './ContractStep1'
import { formatToman } from '../../lib/fmt'

interface Props {
  data: ContractWizardData
  onChange: (u: Partial<ContractWizardData>) => void
  onNext: () => void
  onBack: () => void
}

function normDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
}

function spelledOut(s: string): string {
  if (!s.trim()) return ''
  const n = parseInt(normDigits(s), 10)
  if (isNaN(n)) return ''
  return `«${formatToman(n)} تومان»`
}

function isValidJalali(s: string): boolean {
  if (!s.trim()) return false
  const n = normDigits(s)
  const m = n.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
  if (!m) return false
  const [, , jm, jd] = m.map(Number)
  return jm >= 1 && jm <= 12 && jd >= 1 && jd <= 31
}

export function ContractStep3({ data, onChange, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isSale = data.contract_type === 'sale'
  const isRent = data.contract_type === 'rent'
  const isRahn = data.contract_type === 'rahn'

  function handleNext() {
    const errs: Record<string, string> = {}

    if (!data.start_date.trim()) errs.start_date = 'تاریخ شروع الزامی است'
    else if (!isValidJalali(data.start_date)) errs.start_date = 'فرمت تاریخ صحیح نیست (۱۴۰۳/۰۱/۰۱)'

    if (isRent || isRahn) {
      if (!data.end_date.trim()) errs.end_date = 'تاریخ پایان الزامی است'
      else if (!isValidJalali(data.end_date)) errs.end_date = 'فرمت تاریخ صحیح نیست (۱۴۰۳/۰۱/۰۱)'
      else if (data.start_date.trim() && isValidJalali(data.start_date)) {
        const ns = normDigits(data.start_date)
        const ne = normDigits(data.end_date)
        if (ne <= ns) errs.end_date = 'تاریخ پایان باید بعد از تاریخ شروع باشد'
      }
    }

    if (isSale && !data.sale_price.trim()) errs.sale_price = 'مبلغ معامله الزامی است'
    if (isRent) {
      if (!data.deposit_amount.trim()) errs.deposit_amount = 'پول پیش الزامی است'
      if (!data.monthly_rent.trim()) errs.monthly_rent = 'اجاره ماهیانه الزامی است'
    }
    if (isRahn && !data.rahn_amount.trim()) errs.rahn_amount = 'مبلغ رهن الزامی است'

    setErrors(errs)
    if (Object.keys(errs).length === 0) onNext()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* Dates row */}
      <div style={{ display: 'grid', gridTemplateColumns: (isRent || isRahn) ? '1fr 1fr' : '1fr', gap: 10 }}>
        <JDateField
          label="تاریخ شروع"
          value={data.start_date}
          onChange={(v) => onChange({ start_date: v })}
          error={errors.start_date}
        />
        {(isRent || isRahn) && (
          <JDateField
            label="تاریخ پایان"
            value={data.end_date}
            onChange={(v) => onChange({ end_date: v })}
            error={errors.end_date}
          />
        )}
      </div>

      {/* Sale: مبلغ معامله */}
      {isSale && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>مبلغ معامله (تومان) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <input
            value={data.sale_price}
            onChange={(e) => onChange({ sale_price: e.target.value })}
            placeholder="۲۵٬۰۰۰٬۰۰۰٬۰۰۰"
            style={inputStyle(!!errors.sale_price)}
          />
          {spelledOut(data.sale_price) && (
            <span style={{ fontSize: 12, color: 'var(--color-primary)', textAlign: 'left' }}>
              {spelledOut(data.sale_price)}
            </span>
          )}
          {errors.sale_price && <span style={errorStyle}>{errors.sale_price}</span>}
        </div>
      )}

      {/* Rent: پول پیش + اجاره */}
      {isRent && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>پول پیش (تومان) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input
              value={data.deposit_amount}
              onChange={(e) => onChange({ deposit_amount: e.target.value })}
              placeholder="۸۰۰٬۰۰۰٬۰۰۰"
              style={inputStyle(!!errors.deposit_amount)}
            />
            {spelledOut(data.deposit_amount) && (
              <span style={{ fontSize: 12, color: 'var(--gold-700)', textAlign: 'left' }}>
                {spelledOut(data.deposit_amount)}
              </span>
            )}
            {errors.deposit_amount && <span style={errorStyle}>{errors.deposit_amount}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>اجاره ماهیانه (تومان) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input
              value={data.monthly_rent}
              onChange={(e) => onChange({ monthly_rent: e.target.value })}
              placeholder="۷۰٬۰۰۰٬۰۰۰"
              style={inputStyle(!!errors.monthly_rent)}
            />
            {spelledOut(data.monthly_rent) && (
              <span style={{ fontSize: 12, color: 'var(--gold-700)', textAlign: 'left' }}>
                {spelledOut(data.monthly_rent)}
              </span>
            )}
            {errors.monthly_rent && <span style={errorStyle}>{errors.monthly_rent}</span>}
          </div>
        </>
      )}

      {/* Rahn: مبلغ رهن */}
      {isRahn && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>مبلغ رهن (تومان) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <input
            value={data.rahn_amount}
            onChange={(e) => onChange({ rahn_amount: e.target.value })}
            placeholder="۴٬۵۰۰٬۰۰۰٬۰۰۰"
            style={inputStyle(!!errors.rahn_amount)}
          />
          {spelledOut(data.rahn_amount) && (
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'left' }}>
              {spelledOut(data.rahn_amount)}
            </span>
          )}
          {errors.rahn_amount && <span style={errorStyle}>{errors.rahn_amount}</span>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 'var(--space-3)' }}>
        <button type="button" onClick={onBack} style={backBtnStyle}>قبلی</button>
        <button type="button" onClick={handleNext} style={nextBtnStyle}>مرحله بعد</button>
      </div>
    </div>
  )
}

function JDateField({ label, value, onChange, error }: {
  label: string; value: string; onChange: (v: string) => void; error?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="۱۴۰۳/۰۱/۰۱"
        style={inputStyle(!!error)}
      />
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  )
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    height: 46,
    padding: '0 12px',
    border: `1px solid ${hasError ? 'var(--color-danger)' : 'var(--border-default)'}`,
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-md)',
    color: 'var(--text-primary)',
    direction: 'rtl',
    outline: 'none',
    backgroundColor: 'var(--surface-card)',
    width: '100%',
  }
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
  flex: 1,
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
