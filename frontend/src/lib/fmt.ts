import { toJalaali as jalToJalaali, toGregorian as jalToGregorian } from 'jalaali-js';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function toPersianDigits(str: string | number): string {
  return String(str).replace(/[0-9]/g, d => PERSIAN_DIGITS[parseInt(d, 10)]);
}

export function formatToman(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount as number)) {
    return '—';
  }

  const neg = (amount as number) < 0;
  const abs = Math.abs(amount as number);

  let formatted: string;

  if (abs >= 1_000_000_000) {
    const scaled = abs / 1_000_000_000;
    const s = scaled % 1 === 0
      ? scaled.toString()
      : scaled.toFixed(1).replace('.', '٫');
    formatted = toPersianDigits(s) + ' میلیارد';
  } else if (abs >= 1_000_000) {
    const scaled = abs / 1_000_000;
    const s = scaled % 1 === 0
      ? scaled.toString()
      : scaled.toFixed(1).replace('.', '٫');
    formatted = toPersianDigits(s) + ' میلیون';
  } else {
    const s = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
    formatted = toPersianDigits(s);
  }

  return neg ? '-' + formatted : formatted;
}

export function formatRent(monthly: number): string {
  return `${formatToman(monthly)} / ماه`;
}

export function formatPhone(phone: string): string {
  return toPersianDigits(phone);
}

export function toJalali(date: Date | string): string {
  let gy: number, gm: number, gd: number;

  if (typeof date === 'string') {
    const parts = date.split('-');
    gy = parseInt(parts[0], 10);
    gm = parseInt(parts[1], 10);
    gd = parseInt(parts[2], 10);
  } else {
    gy = date.getFullYear();
    gm = date.getMonth() + 1;
    gd = date.getDate();
  }

  const { jy, jm, jd } = jalToJalaali(gy, gm, gd);
  return toPersianDigits(
    `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`
  );
}

export function fromJalali(jalaliStr: string): Date {
  const parts = jalaliStr.split('/');
  if (parts.length !== 3) {
    throw new Error(`Invalid Jalali date format: "${jalaliStr}"`);
  }
  const [jy, jm, jd] = parts.map(Number);
  if (isNaN(jy) || isNaN(jm) || isNaN(jd)) {
    throw new Error(`Invalid Jalali date parts in: "${jalaliStr}"`);
  }
  const { gy, gm, gd } = jalToGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}
