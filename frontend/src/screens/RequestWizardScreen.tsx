import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { createRequest, REQUEST_TYPE_LABEL } from '../api/requests'
import type { RequestTypeApi, RequestCreatePayload } from '../api/requests'

import { toPersianDigits, formatToman, fromJalali } from '../lib/fmt'
import { useToast } from '../components/common/Toast'
import { ReqStep1 } from './wizard/ReqStep1'
import type { ReqStep1Data } from './wizard/ReqStep1'
import { ReqStep2 } from './wizard/ReqStep2'
import { ReqStep3 } from './wizard/ReqStep3'
import type { ReqStep3Data } from './wizard/ReqStep3'
import { ReqStep4 } from './wizard/ReqStep4'

const STEP_LABELS = ['مشتری', 'نوع درخواست', 'مشخصات', 'تأیید']

function normDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
}
function parseMoney(s: string): number | undefined {
  const n = parseInt(normDigits(s).replace(/[٬,]/g, ''), 10)
  return isNaN(n) ? undefined : n
}
function parseNum(s: string): number | undefined {
  const n = parseInt(normDigits(s), 10)
  return isNaN(n) ? undefined : n
}
function parseFloat2(s: string): number | undefined {
  const n = parseFloat(normDigits(s))
  return isNaN(n) ? undefined : n
}

const INITIAL_STEP1: ReqStep1Data = {
  customer: null,
  quickFirstName: '',
  quickLastName: '',
  quickPhone: '',
}

const INITIAL_STEP3: ReqStep3Data = {
  beds: 1,
  wantsParking: false,
  wantsElevator: false,
  wantsStorage: false,
  preferredFloor: '',
  minArea: '',
  maxArea: '',
  region: null,
  deadline: '',
  notes: '',
  personsCount: '',
  maxDeposit: '',
  maxRent: '',
  targetPropertyType: null,
  minBuildYear: '',
  maxBuildYear: '',
  unitsCount: '',
  budget: '',
}

function buildSummaryLines(type: RequestTypeApi, step3: ReqStep3Data, customerName: string) {
  const lines: { label: string; value: string }[] = []

  lines.push({ label: 'مشتری', value: customerName })

  if (step3.region) lines.push({ label: 'منطقه', value: step3.region.name })

  if (type === 'rent' || type === 'rahn') {
    if (step3.personsCount) lines.push({ label: 'تعداد نفرات', value: toPersianDigits(step3.personsCount) })
    lines.push({ label: 'تعداد خواب', value: toPersianDigits(step3.beds) })
    const needs: string[] = []
    if (step3.wantsParking) needs.push('پارکینگ')
    if (step3.wantsElevator) needs.push('آسانسور')
    if (step3.wantsStorage) needs.push('انباری')
    if (needs.length) lines.push({ label: 'نیازها', value: needs.join('، ') })
    if (step3.preferredFloor) lines.push({ label: 'طبقه ترجیحی', value: step3.preferredFloor })
    if (step3.minArea || step3.maxArea) {
      const rangeVal = (step3.minArea ? toPersianDigits(step3.minArea) : '—') + ' تا ' + (step3.maxArea ? toPersianDigits(step3.maxArea) : '—') + ' متر'
      lines.push({ label: 'متراژ', value: rangeVal })
    }
    const dep = parseMoney(step3.maxDeposit)
    if (dep !== undefined) lines.push({ label: type === 'rahn' ? 'حداکثر رهن' : 'حداکثر پیش', value: toPersianDigits(formatToman(dep)) + ' تومان' })
    if (type === 'rent') {
      const rent = parseMoney(step3.maxRent)
      if (rent !== undefined) lines.push({ label: 'حداکثر اجاره', value: toPersianDigits(formatToman(rent)) + ' / ماه' })
    }
  } else {
    // sale
    if (step3.targetPropertyType) lines.push({ label: 'نوع ملک', value: step3.targetPropertyType })
    if (step3.minBuildYear || step3.maxBuildYear) {
      lines.push({ label: 'سال ساخت', value: (step3.minBuildYear || '—') + ' – ' + (step3.maxBuildYear || '—') })
    }
    if (step3.minArea || step3.maxArea) {
      const rangeVal = (step3.minArea ? toPersianDigits(step3.minArea) : '—') + ' تا ' + (step3.maxArea ? toPersianDigits(step3.maxArea) : '—') + ' متر'
      lines.push({ label: 'متراژ', value: rangeVal })
    }
    lines.push({ label: 'تعداد خواب', value: toPersianDigits(step3.beds) })
    if (step3.unitsCount) lines.push({ label: 'تعداد واحد', value: toPersianDigits(step3.unitsCount) })
    const needs: string[] = []
    if (step3.wantsParking) needs.push('پارکینگ')
    if (step3.wantsElevator) needs.push('آسانسور')
    if (step3.wantsStorage) needs.push('انباری')
    if (needs.length) lines.push({ label: 'نیازها', value: needs.join('، ') })
    const budget = parseMoney(step3.budget)
    if (budget !== undefined) lines.push({ label: 'بودجه', value: toPersianDigits(formatToman(budget)) + ' تومان' })
  }

  if (step3.deadline) lines.push({ label: 'مهلت', value: toPersianDigits(step3.deadline) })
  if (step3.notes) lines.push({ label: 'یادداشت', value: step3.notes })

  return lines
}

function buildPayload(step1: ReqStep1Data, type: RequestTypeApi, step3: ReqStep3Data): RequestCreatePayload {
  const p: RequestCreatePayload = { request_type: type }

  if (step1.customer) {
    p.customer_id = step1.customer.id
  } else {
    p.customer_first_name = step1.quickFirstName.trim()
    p.customer_last_name = step1.quickLastName.trim()
    p.customer_phone = step1.quickPhone.trim()
  }

  if (step3.region) p.region_id = step3.region.id

  const minArea = parseFloat2(step3.minArea)
  const maxArea = parseFloat2(step3.maxArea)
  if (minArea !== undefined) p.min_area = minArea
  if (maxArea !== undefined) p.max_area = maxArea

  p.beds = step3.beds
  if (step3.preferredFloor.trim()) p.preferred_floor = step3.preferredFloor.trim()
  p.wants_parking = step3.wantsParking
  p.wants_elevator = step3.wantsElevator
  p.wants_storage = step3.wantsStorage
  if (step3.notes.trim()) p.notes = step3.notes.trim()

  // Convert Jalali deadline to Gregorian ISO
  if (step3.deadline.trim()) {
    try {
      const d = fromJalali(normDigits(step3.deadline).trim())
      p.deadline = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    } catch {
      // skip invalid date
    }
  }

  if (type === 'rent' || type === 'rahn') {
    const personsCount = parseNum(step3.personsCount)
    if (personsCount !== undefined) p.persons_count = personsCount
    const maxDep = parseMoney(step3.maxDeposit)
    if (maxDep !== undefined) p.max_deposit = maxDep
    if (type === 'rent') {
      const maxRent = parseMoney(step3.maxRent)
      if (maxRent !== undefined) p.max_rent = maxRent
    }
  }

  if (type === 'sale') {
    if (step3.targetPropertyType) p.target_property_type = step3.targetPropertyType
    const minYear = parseNum(step3.minBuildYear)
    const maxYear = parseNum(step3.maxBuildYear)
    if (minYear !== undefined) p.min_build_year = minYear
    if (maxYear !== undefined) p.max_build_year = maxYear
    const units = parseNum(step3.unitsCount)
    if (units !== undefined) p.units_count = units
    const budget = parseMoney(step3.budget)
    if (budget !== undefined) p.budget = budget
  }

  return p
}

// ── Progress ──
function WizardProgress({ step }: { step: number }) {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 16,
        padding: '16px 14px 12px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 'var(--space-4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {STEP_LABELS.map((label, i) => {
          const isActive = i === step
          const isDone = i < step
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_LABELS.length - 1 ? 'none' : undefined }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'bold' as React.CSSProperties['fontWeight'],
                    backgroundColor: isDone ? 'var(--color-success)' : isActive ? 'var(--color-primary)' : 'transparent',
                    border: isDone || isActive ? 'none' : '2px solid var(--border-strong)',
                    color: isDone || isActive ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 200ms ease',
                    flexShrink: 0,
                  }}
                >
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    toPersianDigits(i + 1)
                  )}
                </div>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: isActive ? 'bold' : 'normal',
                    color: isDone ? 'var(--text-muted)' : isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    minWidth: 12,
                    marginBottom: 22,
                    marginInline: 6,
                    background: isDone ? 'var(--color-success)' : 'var(--border-default)',
                    transition: 'background 200ms ease',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main ──
export default function RequestWizardScreen() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [step, setStep] = useState(0)   // 0–3 maps to steps 1–4
  const [submitted, setSubmitted] = useState(false)
  const [createdId, setCreatedId] = useState<number | null>(null)

  const [step1, setStep1] = useState<ReqStep1Data>(INITIAL_STEP1)
  const [requestType, setRequestType] = useState<RequestTypeApi | null>(null)
  const [step3, setStep3] = useState<ReqStep3Data>(INITIAL_STEP3)

  const mut = useMutation({
    mutationFn: (payload: RequestCreatePayload) => createRequest(payload),
    onSuccess: (data) => {
      setCreatedId(data.id)
      setSubmitted(true)
      setStep(3)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      showToast(msg ?? 'خطا در ثبت درخواست', 'error')
    },
  })

  function handleSubmit() {
    if (!requestType) return
    const payload = buildPayload(step1, requestType, step3)
    mut.mutate(payload)
  }

  function customerName(): string {
    if (step1.customer) return step1.customer.first_name + ' ' + step1.customer.last_name
    const parts = [step1.quickFirstName.trim(), step1.quickLastName.trim()].filter(Boolean)
    return parts.join(' ') || '—'
  }

  const summaryLines = requestType ? buildSummaryLines(requestType, step3, customerName()) : []

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: 'var(--space-4)',
        paddingBottom: 80,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <WizardProgress step={step} />

      {step === 0 && (
        <ReqStep1
          data={step1}
          onChange={(u) => setStep1((prev) => ({ ...prev, ...u }))}
          onNext={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <ReqStep2
          requestType={requestType}
          onChange={(t) => { setRequestType(t); setStep3(INITIAL_STEP3) }}
          onNext={() => setStep(2)}
          onPrev={() => setStep(0)}
        />
      )}

      {step === 2 && requestType && (
        <ReqStep3
          requestType={requestType}
          data={step3}
          onChange={(u) => setStep3((prev) => ({ ...prev, ...u }))}
          onNext={() => setStep(3)}
          onPrev={() => setStep(1)}
        />
      )}

      {step === 3 && !submitted && requestType && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Summary preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, background: 'var(--color-primary-soft)', color: 'var(--color-primary)', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
              </svg>
            </span>
            <strong style={{ fontSize: 16, fontWeight: 700 }}>خلاصه درخواست</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface-sunken)', borderRadius: 12, padding: '4px 16px' }}>
            <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-default)', fontSize: 14, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: 'var(--text-muted)' }}>نوع درخواست</span>
              <span style={{ fontWeight: 600 }}>{REQUEST_TYPE_LABEL[requestType]}</span>
            </div>
            {summaryLines.map((line, i) => (
              <div key={i} style={{ padding: '12px 0', borderBottom: i < summaryLines.length - 1 ? '1px solid var(--border-default)' : 'none', fontSize: 14, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>{line.label}</span>
                <span style={{ fontWeight: 500, textAlign: 'left' }}>{line.value}</span>
              </div>
            ))}
          </div>

          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            با ثبت درخواست، فایل‌های منطبق به‌صورت خودکار به این مشتری پیشنهاد داده می‌شوند.
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep(2)}
              style={{ flex: 1, height: 50, border: '1px solid var(--border-strong)', background: 'var(--surface-card)', color: 'var(--color-primary)', borderRadius: 12, fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
              قبلی
            </button>
            <button
              onClick={handleSubmit}
              disabled={mut.isPending}
              style={{ flex: 1.6, height: 50, border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: 12, fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, cursor: mut.isPending ? 'default' : 'pointer', opacity: mut.isPending ? 0.7 : 1, boxShadow: 'var(--shadow-xs)' }}
            >
              {mut.isPending ? 'در حال ثبت...' : 'ثبت درخواست'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && submitted && createdId !== null && requestType && (
        <ReqStep4
          requestId={createdId}
          requestType={requestType}
          summaryLines={summaryLines}
          onDone={() => navigate('/requests')}
          onPrev={() => { setSubmitted(false) }}
        />
      )}
    </div>
  )
}
