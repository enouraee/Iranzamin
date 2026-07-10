import { describe, it, expect } from 'vitest'
import { toPersianDigits, formatToman, formatRent, formatPhone, toJalali, fromJalali } from '../lib/fmt'

describe('toPersianDigits', () => {
  it('converts latin digits', () => expect(toPersianDigits('1248')).toBe('۱۲۴۸'))
  it('handles number input', () => expect(toPersianDigits(42)).toBe('۴۲'))
  it('preserves non-digits', () => expect(toPersianDigits('abc123')).toBe('abc۱۲۳'))
  it('handles empty string', () => expect(toPersianDigits('')).toBe(''))
})

describe('formatToman', () => {
  it('formats with thousands separator', () => expect(formatToman(1248)).toBe('۱٬۲۴۸'))
  it('formats milliard', () => expect(formatToman(8_500_000_000)).toBe('۸٫۵ میلیارد'))
  it('formats million', () => expect(formatToman(45_000_000)).toBe('۴۵ میلیون'))
  it('formats partial million', () => expect(formatToman(8_500_000)).toBe('۸٫۵ میلیون'))
  it('returns dash for null', () => expect(formatToman(null)).toBe('—'))
  it('returns dash for undefined', () => expect(formatToman(undefined)).toBe('—'))
  it('returns dash for NaN', () => expect(formatToman(NaN)).toBe('—'))
  it('handles zero', () => expect(formatToman(0)).toBe('۰'))
  it('handles negative', () => {
    const r = formatToman(-1000)
    expect(r).toContain('۱٬۰۰۰')
  })
  it('handles huge number', () => {
    const r = formatToman(999_999_999_999)
    expect(r).toContain('میلیارد')
  })
})

describe('formatRent', () => {
  it('appends / ماه', () => expect(formatRent(45_000_000)).toBe('۴۵ میلیون / ماه'))
})

describe('formatPhone', () => {
  it('converts phone digits', () => expect(formatPhone('09123456789')).toBe('۰۹۱۲۳۴۵۶۷۸۹'))
})

describe('Jalali', () => {
  it('converts gregorian to jalali', () => {
    const d = new Date(2025, 2, 20) // March 20, 2025 = 1403/12/30 (1403 is leap)
    const result = toJalali(d)
    expect(result).toBe('۱۴۰۳/۱۲/۳۰')
  })
  it('round-trips jalali to gregorian', () => {
    const d = fromJalali('1403/12/30')
    expect(d.getFullYear()).toBe(2025)
    expect(d.getMonth()).toBe(2) // March = 2
    expect(d.getDate()).toBe(20)
  })
  it('throws on invalid jalali format', () => {
    expect(() => fromJalali('invalid')).toThrow()
  })
  it('accepts ISO string', () => {
    const result = toJalali('2025-03-20')
    expect(result).toBe('۱۴۰۳/۱۲/۳۰')
  })
})
