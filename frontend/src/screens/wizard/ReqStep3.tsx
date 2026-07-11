import { useState } from 'react'
import { RegionPicker } from './RegionPicker'
import type { RequestTypeApi } from '../../api/requests'
import type { PropertyTypeApi, Region } from '../../api/types'
import { PROPERTY_TYPE_LABEL } from '../../api/types'
import { toPersianDigits, formatToman } from '../../lib/fmt'

export interface ReqStep3Data {
  // shared
  beds: number
  wantsParking: boolean
  wantsElevator: boolean
  wantsStorage: boolean
  preferredFloor: string
  minArea: string
  maxArea: string
  region: Region | null
  deadline: string
  notes: string
  // rent / rahn
  personsCount: string
  maxDeposit: string
  maxRent: string  // rent only; rahn ignores this
  // sale
  targetPropertyType: PropertyTypeApi | null
  minBuildYear: string
  maxBuildYear: string
  unitsCount: string
  budget: string
}

interface Props {
  requestType: RequestTypeApi
  data: ReqStep3Data
  onChange: (u: Partial<ReqStep3Data>) => void
  onNext: () => void
  onPrev: () => void
}

// Strip Persian digits & separators, parse int
function parseMoney(s: string): number | null {
  const n = parseInt(s.replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٬,]/g, ''), 10)
  return isNaN(n) ? null : n
}

function parseNum(s: string): number | null {
  const n = parseInt(s.replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))), 10)
  return isNaN(n) ? null : n
}

function moneyDisplay(s: string): string {
  const n = parseMoney(s)
  return n !== null ? formatToman(n) : ''
}

const SALE_TYPES: PropertyTypeApi[] = ['apartment', 'kalnagi', 'land', 'commercial', 'office', 'villa']

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 46,
  padding: '0 12px',
  border: '1px solid var(--border-default)',
  borderRadius: 10,
  background: 'var(--surface-card)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--text-secondary)',
}

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

export function ReqStep3({ requestType, data, onChange, onNext, onPrev }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (data.minArea && data.maxArea) {
      const min = parseNum(data.minArea)
      const max = parseNum(data.maxArea)
      if (min !== null && max !== null && min > max) errs.area = 'حداقل متراژ باید کمتر از حداکثر باشد'
    }
    if (requestType === 'sale' && data.minBuildYear && data.maxBuildYear) {
      const min = parseNum(data.minBuildYear)
      const max = parseNum(data.maxBuildYear)
      if (min !== null && max !== null && min > max) errs.buildYear = 'حداقل سال ساخت باید کمتر از حداکثر باشد'
    }
    if (data.deadline.trim()) {
      const parts = data.deadline.replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).split('/')
      if (parts.length === 3) {
        const [jy, jm, jd] = parts.map(Number)
        if (!isNaN(jy) && !isNaN(jm) && !isNaN(jd)) {
          // Simple past-date check using Jalali year (rough: current Jalali year ≈ 1403+)
          const nowYear = new Date().getFullYear() - 621
          if (jy < nowYear || (jy === nowYear && jm < new Date().getMonth() + 1)) {
            errs.deadline = 'مهلت نمی‌تواند در گذشته باشد'
          }
        }
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleNext() {
    if (validate()) onNext()
  }

  const isRentOrRahn = requestType === 'rent' || requestType === 'rahn'
  const isSale = requestType === 'sale'

  function BedsControl() {
    return (
      <div style={fieldStyle}>
        <label style={labelStyle}>تعداد خواب</label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            overflow: 'hidden',
            height: 46,
            maxWidth: isSale ? 180 : undefined,
          }}
        >
          <button
            onClick={() => onChange({ beds: Math.max(0, data.beds - 1) })}
            style={{ width: 46, height: 46, border: 'none', background: 'var(--surface-sunken)', color: 'var(--color-primary)', fontSize: 22, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
          >
            −
          </button>
          <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700 }}>
            {toPersianDigits(data.beds)}
          </span>
          <button
            onClick={() => onChange({ beds: data.beds + 1 })}
            style={{ width: 46, height: 46, border: 'none', background: 'var(--surface-sunken)', color: 'var(--color-primary)', fontSize: 22, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
          >
            +
          </button>
        </div>
      </div>
    )
  }

  function NeedsChips() {
    const chips: { key: keyof ReqStep3Data; label: string }[] = [
      { key: 'wantsParking', label: 'پارکینگ' },
      { key: 'wantsElevator', label: 'آسانسور' },
      { key: 'wantsStorage', label: 'انباری' },
    ]
    return (
      <div style={fieldStyle}>
        <label style={labelStyle}>نیازها</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {chips.map(({ key, label }) => {
            const active = !!data[key]
            return (
              <button
                key={key}
                onClick={() => onChange({ [key]: !active } as Partial<ReqStep3Data>)}
                style={{
                  padding: '6px 14px',
                  border: `1px solid ${active ? 'var(--color-primary)' : 'var(--border-default)'}`,
                  borderRadius: 20,
                  background: active ? 'var(--color-primary-soft)' : 'var(--surface-card)',
                  color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

      {/* RENT / RAHN BRANCH */}
      {isRentOrRahn && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>تعداد نفرات</label>
              <input
                style={inputStyle}
                placeholder="۳"
                value={data.personsCount}
                onChange={(e) => onChange({ personsCount: e.target.value })}
              />
            </div>
            <BedsControl />
          </div>

          <NeedsChips />

          <div style={fieldStyle}>
            <label style={labelStyle}>طبقه ترجیحی</label>
            <input
              style={inputStyle}
              placeholder="مثلاً طبقات میانی"
              value={data.preferredFloor}
              onChange={(e) => onChange({ preferredFloor: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>حداقل متراژ (متر)</label>
              <input style={inputStyle} placeholder="۵۰" value={data.minArea} onChange={(e) => onChange({ minArea: e.target.value })} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>حداکثر متراژ (متر)</label>
              <input style={inputStyle} placeholder="۱۵۰" value={data.maxArea} onChange={(e) => onChange({ maxArea: e.target.value })} />
            </div>
          </div>
          {errors.area && <span style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: -8 }}>{errors.area}</span>}

          <div style={fieldStyle}>
            <label style={labelStyle}>
              {requestType === 'rahn' ? 'حداکثر مبلغ رهن (تومان)' : 'حداکثر پول پیش (تومان)'}
            </label>
            <input
              style={inputStyle}
              placeholder="۸۰۰٬۰۰۰٬۰۰۰"
              value={data.maxDeposit}
              onChange={(e) => onChange({ maxDeposit: e.target.value })}
            />
            {data.maxDeposit && <span style={{ fontSize: 12, color: 'var(--gold-700)', textAlign: 'left' }}>{moneyDisplay(data.maxDeposit)}</span>}
          </div>

          {requestType === 'rent' && (
            <div style={fieldStyle}>
              <label style={labelStyle}>حداکثر اجاره ماهیانه (تومان)</label>
              <input
                style={inputStyle}
                placeholder="۶۰٬۰۰۰٬۰۰۰"
                value={data.maxRent}
                onChange={(e) => onChange({ maxRent: e.target.value })}
              />
              {data.maxRent && <span style={{ fontSize: 12, color: 'var(--gold-700)', textAlign: 'left' }}>{moneyDisplay(data.maxRent)}</span>}
            </div>
          )}
        </>
      )}

      {/* SALE BRANCH */}
      {isSale && (
        <>
          <div style={fieldStyle}>
            <label style={labelStyle}>نوع ملک</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SALE_TYPES.map((t) => {
                const active = data.targetPropertyType === t
                return (
                  <button
                    key={t}
                    onClick={() => onChange({ targetPropertyType: active ? null : t })}
                    style={{
                      padding: '6px 14px',
                      border: `1px solid ${active ? 'var(--color-primary)' : 'var(--border-default)'}`,
                      borderRadius: 20,
                      background: active ? 'var(--color-primary-soft)' : 'var(--surface-card)',
                      color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {PROPERTY_TYPE_LABEL[t]}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>حداقل سال ساخت</label>
              <input style={inputStyle} placeholder="۱۳۸۰" value={data.minBuildYear} onChange={(e) => onChange({ minBuildYear: e.target.value })} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>حداکثر سال ساخت</label>
              <input style={inputStyle} placeholder="۱۴۰۳" value={data.maxBuildYear} onChange={(e) => onChange({ maxBuildYear: e.target.value })} />
            </div>
          </div>
          {errors.buildYear && <span style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: -8 }}>{errors.buildYear}</span>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>حداقل متراژ (متر)</label>
              <input style={inputStyle} placeholder="۵۰" value={data.minArea} onChange={(e) => onChange({ minArea: e.target.value })} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>حداکثر متراژ (متر)</label>
              <input style={inputStyle} placeholder="۱۵۰" value={data.maxArea} onChange={(e) => onChange({ maxArea: e.target.value })} />
            </div>
          </div>
          {errors.area && <span style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: -8 }}>{errors.area}</span>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
            <BedsControl />
            <div style={fieldStyle}>
              <label style={labelStyle}>تعداد واحد</label>
              <input style={inputStyle} placeholder="۶" value={data.unitsCount} onChange={(e) => onChange({ unitsCount: e.target.value })} />
            </div>
          </div>

          <NeedsChips />

          <div style={fieldStyle}>
            <label style={labelStyle}>بودجه خریدار (تومان)</label>
            <input
              style={inputStyle}
              placeholder="۴۰٬۰۰۰٬۰۰۰٬۰۰۰"
              value={data.budget}
              onChange={(e) => onChange({ budget: e.target.value })}
            />
            {data.budget && <span style={{ fontSize: 12, color: 'var(--color-primary)', textAlign: 'left' }}>{moneyDisplay(data.budget)}</span>}
          </div>
        </>
      )}

      {/* SHARED — region + deadline + notes */}
      <RegionPicker value={data.region} onChange={(r) => onChange({ region: r })} />

      <div style={fieldStyle}>
        <label style={labelStyle}>مهلت (شمسی، مثال: ۱۴۰۳/۱۲/۲۹)</label>
        <input
          style={{ ...inputStyle, borderColor: errors.deadline ? 'var(--color-danger)' : 'var(--border-default)' }}
          placeholder="۱۴۰۳/۱۲/۲۹"
          value={data.deadline}
          onChange={(e) => onChange({ deadline: e.target.value })}
        />
        {errors.deadline && <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>{errors.deadline}</span>}
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>یادداشت</label>
        <textarea
          style={{ ...inputStyle, height: 80, padding: '10px 12px', resize: 'vertical' }}
          placeholder="توضیحات اضافه..."
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>

      {/* Nav buttons */}
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
          onClick={handleNext}
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
