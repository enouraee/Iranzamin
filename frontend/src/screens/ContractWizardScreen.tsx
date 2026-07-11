import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createContract } from '../api/contracts'
import { useToast } from '../components/common/Toast'
import { toPersianDigits, fromJalali } from '../lib/fmt'
import { ContractStep1, CONTRACT_INITIAL } from './wizard/ContractStep1'
import { ContractStep2 } from './wizard/ContractStep2'
import { ContractStep3 } from './wizard/ContractStep3'
import { ContractStep4 } from './wizard/ContractStep4'
import type { ContractWizardData } from './wizard/ContractStep1'

const STEP_LABELS = ['ملک', 'طرفین', 'مبالغ', 'اسناد']

function normDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
}

function toIso(jalali: string): string | undefined {
  if (!jalali.trim()) return undefined
  try {
    const d = fromJalali(normDigits(jalali))
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-')
  } catch {
    return undefined
  }
}

function safeInt(s: string): number | undefined {
  const n = parseInt(normDigits(s), 10)
  return isNaN(n) ? undefined : n
}

function WizardProgress({ step }: { step: number }) {
  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 16, padding: '16px 14px 12px',
      boxShadow: 'var(--shadow-sm)', marginBottom: 'var(--space-4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {STEP_LABELS.map((label, i) => {
          const isActive = i === step
          const isDone = i < step
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_LABELS.length - 1 ? 'none' : undefined }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-bold)' as React.CSSProperties['fontWeight'],
                  backgroundColor: isDone ? 'var(--color-success)' : isActive ? 'var(--color-primary)' : 'transparent',
                  border: isDone || isActive ? 'none' : '2px solid var(--border-strong)',
                  color: isDone || isActive ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 200ms ease', flexShrink: 0,
                }}>
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : toPersianDigits(i + 1)}
                </div>
                <span style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: isActive ? ('var(--weight-bold)' as React.CSSProperties['fontWeight']) : 'inherit',
                  color: isDone ? 'var(--text-muted)' : isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}>{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, minWidth: 20,
                  backgroundColor: i < step ? 'var(--color-success)' : 'var(--border-default)',
                  marginBottom: 20, marginInline: 6, transition: 'background-color 200ms ease',
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ContractWizardScreen() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<ContractWizardData>(CONTRACT_INITIAL)

  function handleChange(u: Partial<ContractWizardData>) {
    setData((prev) => ({ ...prev, ...u }))
  }

  const mutation = useMutation({
    mutationFn: () => {
      const payload = buildPayload(data)
      return createContract(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      qc.invalidateQueries({ queryKey: ['properties'] })
      showToast('قرارداد با موفقیت ثبت شد', 'success')
      navigate('/contracts')
    },
    onError: (err: unknown) => {
      const msg = extractMessage(err)
      showToast(msg, 'error')
    },
  })

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 'var(--space-4)' }}>
      <WizardProgress step={step} />
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 16, padding: '20px 16px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {step === 0 && (
          <ContractStep1
            data={data}
            onChange={handleChange}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <ContractStep2
            data={data}
            onChange={handleChange}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <ContractStep3
            data={data}
            onChange={handleChange}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <ContractStep4
            data={data}
            onChange={handleChange}
            onBack={() => setStep(2)}
            onSubmit={() => mutation.mutate()}
            isSubmitting={mutation.isPending}
          />
        )}
      </div>
    </div>
  )
}

function buildPayload(d: ContractWizardData) {
  const start = toIso(d.start_date)!
  const payload: Parameters<typeof createContract>[0] = {
    property_id: d.property!.id,
    contract_type: d.contract_type!,
    start_date: start,
  }

  if (d.party_a_id) payload.party_a_id = d.party_a_id
  if (d.party_b_id) payload.party_b_id = d.party_b_id

  if (d.contract_type === 'sale' || d.contract_type === 'rent' || d.contract_type === 'rahn') {
    const end = toIso(d.end_date)
    if (end) payload.end_date = end
  }

  if (d.contract_type === 'sale') {
    const sp = safeInt(d.sale_price)
    if (sp !== undefined) payload.sale_price = sp
  }
  if (d.contract_type === 'rent') {
    const dep = safeInt(d.deposit_amount)
    const rent = safeInt(d.monthly_rent)
    if (dep !== undefined) payload.deposit_amount = dep
    if (rent !== undefined) payload.monthly_rent = rent
  }
  if (d.contract_type === 'rahn') {
    const rahn = safeInt(d.rahn_amount)
    if (rahn !== undefined) payload.rahn_amount = rahn
  }

  if (d.notes.trim()) payload.notes = d.notes.trim()
  if (d.photo_files.length > 0) payload.photo_files = d.photo_files

  return payload
}

function extractMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (e.response && typeof e.response === 'object') {
      const resp = e.response as Record<string, unknown>
      if (resp.data && typeof resp.data === 'object') {
        const data = resp.data as Record<string, unknown>
        if (typeof data.message === 'string') return data.message
      }
    }
  }
  return 'خطا در ثبت قرارداد'
}
