import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { createProperty } from '../api/properties'
import type {
  PropertyTypeApi,
  PropertyStatusApi,
  CabinetMaterialApi,
  PropertyCreatePayload,
  Region,
  PersonStub,
} from '../api/types'
import { fromJalali, toPersianDigits } from '../lib/fmt'
import { useToast } from '../components/common/Toast'
import { WizardStep1 } from './wizard/WizardStep1'
import { WizardStep2 } from './wizard/WizardStep2'
import { WizardStep3 } from './wizard/WizardStep3'
import { WizardStep4 } from './wizard/WizardStep4'

// ── Shared wizard state type (exported so step components can import it) ──
export interface WizardData {
  // Step 1
  type: PropertyTypeApi | null
  region: Region | null
  address: string
  plak: string
  floor: string
  unit: string
  // Step 2
  area: string
  beds: number
  has_parking: boolean
  has_obstructive_parking: boolean
  has_balcony: boolean
  has_backyard: boolean
  has_elevator: boolean
  cabinet_material: CabinetMaterialApi
  build_year: string
  has_storage: boolean
  storage_deed: boolean
  storage_area: string
  has_tobdil: boolean
  has_aqab_neshini: boolean
  aqab_neshini_desc: string
  taadad_bar: string
  gozar_kooche: string
  taadad_tabaghat: string
  has_hayat: boolean
  hayat_area: string
  // Step 3
  is_for_sale: boolean
  price_per_meter: string
  total_price: string
  is_for_rent: boolean
  deposit: string
  monthly_rent: string
  is_for_rahn: boolean
  rahn_amount: string
  status: PropertyStatusApi
  tenant: PersonStub | null
  occupancy_start: string
  occupancy_end: string
  occupancy_kind: 'rent' | 'rahn' | null
  occupancy_deposit: string
  occupancy_monthly_rent: string
  occupancy_rahn: string
  // Step 4
  owner: PersonStub | null
  photoFiles: string[]
  videoFiles: string[]
}

const INITIAL: WizardData = {
  type: null,
  region: null,
  address: '',
  plak: '',
  floor: '',
  unit: '',
  area: '',
  beds: 1,
  has_parking: false,
  has_obstructive_parking: false,
  has_balcony: false,
  has_backyard: false,
  has_elevator: false,
  cabinet_material: '',
  build_year: '',
  has_storage: false,
  storage_deed: false,
  storage_area: '',
  has_tobdil: false,
  has_aqab_neshini: false,
  aqab_neshini_desc: '',
  taadad_bar: '',
  gozar_kooche: '',
  taadad_tabaghat: '',
  has_hayat: false,
  hayat_area: '',
  is_for_sale: false,
  price_per_meter: '',
  total_price: '',
  is_for_rent: false,
  deposit: '',
  monthly_rent: '',
  is_for_rahn: false,
  rahn_amount: '',
  status: 'vacant',
  tenant: null,
  occupancy_start: '',
  occupancy_end: '',
  occupancy_kind: null,
  occupancy_deposit: '',
  occupancy_monthly_rent: '',
  occupancy_rahn: '',
  owner: null,
  photoFiles: [],
  videoFiles: [],
}

const STEP_LABELS = ['موقعیت', 'مشخصات', 'معامله', 'مالک']

// Helper: normalize Persian digits to Latin for number parsing
function normDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
}

function toIso(jalali: string): string | undefined {
  if (!jalali.trim()) return undefined
  try {
    const n = normDigits(jalali)
    const d = fromJalali(n)
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

function safeFloat(s: string): number | undefined {
  const n = parseFloat(normDigits(s))
  return isNaN(n) ? undefined : n
}

function buildPayload(d: WizardData): PropertyCreatePayload {
  const p: PropertyCreatePayload = {
    type: d.type!,
    region_id: d.region!.id,
    address: d.address,
  }

  if (d.plak) p.plak = d.plak
  if (d.owner) p.owner_id = d.owner.id

  p.status = d.status

  if (d.status === 'occupied') {
    if (d.tenant) p.tenant_id = d.tenant.id
    const os = toIso(d.occupancy_start)
    const oe = toIso(d.occupancy_end)
    if (os) p.occupancy_start = os
    if (oe) p.occupancy_end = oe
    if (d.occupancy_kind === 'rent') {
      const dep = safeInt(d.occupancy_deposit)
      const rent = safeInt(d.occupancy_monthly_rent)
      if (dep !== undefined) p.occupancy_deposit = dep
      if (rent !== undefined) p.occupancy_monthly_rent = rent
    } else if (d.occupancy_kind === 'rahn') {
      const r = safeInt(d.occupancy_rahn)
      if (r !== undefined) p.occupancy_rahn = r
    }
  }

  p.is_for_sale = d.is_for_sale
  p.is_for_rent = d.is_for_rent
  p.is_for_rahn = d.is_for_rahn

  if (d.is_for_sale) {
    const ppm = safeInt(d.price_per_meter)
    const total = safeInt(d.total_price)
    if (ppm !== undefined) p.price_per_meter = ppm
    if (total !== undefined) p.total_price = total
  }
  if (d.is_for_rent) {
    const dep = safeInt(d.deposit)
    const rent = safeInt(d.monthly_rent)
    if (dep !== undefined) p.deposit = dep
    if (rent !== undefined) p.monthly_rent = rent
  }
  if (d.is_for_rahn) {
    const r = safeInt(d.rahn_amount)
    if (r !== undefined) p.rahn_amount = r
  }

  const area = safeFloat(d.area)
  if (area !== undefined) p.area = area

  const isApt = d.type === 'apartment' || d.type === 'commercial' || d.type === 'office' || d.type === 'villa'
  if (isApt) {
    const floor = safeInt(d.floor)
    if (floor !== undefined) p.floor = floor
    if (d.unit) p.unit = d.unit
    p.beds = d.beds
    p.has_parking = d.has_parking
    p.has_obstructive_parking = d.has_obstructive_parking
    p.has_balcony = d.has_balcony
    p.has_backyard = d.has_backyard
    p.has_elevator = d.has_elevator
    if (d.cabinet_material) p.cabinet_material = d.cabinet_material
    const year = safeInt(d.build_year)
    if (year !== undefined) p.build_year = year
    p.has_storage = d.has_storage
    if (d.has_storage) {
      p.storage_deed = d.storage_deed
      const sa = safeFloat(d.storage_area)
      if (sa !== undefined) p.storage_area = sa
    }
    p.has_tobdil = d.has_tobdil
  }

  const isKalnagi = d.type === 'kalnagi'
  const isLand = d.type === 'land'
  if (isKalnagi || isLand) {
    p.has_aqab_neshini = d.has_aqab_neshini
    if (d.has_aqab_neshini && d.aqab_neshini_desc) p.aqab_neshini_desc = d.aqab_neshini_desc
    const bar = safeInt(d.taadad_bar)
    const gozar = safeFloat(d.gozar_kooche)
    if (bar !== undefined) p.taadad_bar = bar
    if (gozar !== undefined) p.gozar_kooche = gozar
  }
  if (isKalnagi) {
    const tabs = safeInt(d.taadad_tabaghat)
    if (tabs !== undefined) p.taadad_tabaghat = tabs
    p.has_hayat = d.has_hayat
    if (d.has_hayat) {
      const ha = safeFloat(d.hayat_area)
      if (ha !== undefined) p.hayat_area = ha
    }
  }

  if (d.photoFiles.length > 0) p.photo_files = d.photoFiles
  if (d.videoFiles.length > 0) p.video_files = d.videoFiles

  return p
}

// ── Progress bar ──
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
                {/* Circle */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-bold)' as React.CSSProperties['fontWeight'],
                    backgroundColor: isDone
                      ? 'var(--color-success)'
                      : isActive
                      ? 'var(--color-primary)'
                      : 'transparent',
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
                {/* Label */}
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: isActive ? ('var(--weight-bold)' as React.CSSProperties['fontWeight']) : 'inherit',
                    color: isDone ? 'var(--text-muted)' : isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
              </div>
              {/* Connecting line */}
              {i < STEP_LABELS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    minWidth: 20,
                    backgroundColor: i < step ? 'var(--color-success)' : 'var(--border-default)',
                    marginBottom: 20,
                    marginInline: 6,
                    transition: 'background-color 200ms ease',
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

// ── Main component ──
export default function AddFileScreen() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(INITIAL)

  function handleChange(updates: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const mutation = useMutation({
    mutationFn: () => createProperty(buildPayload(data)),
    onSuccess: (result) => {
      showToast('فایل جدید با موفقیت ثبت شد', 'success')
      navigate(`/files/${result.id}`)
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { message?: string } } }
      const msg = apiErr?.response?.data?.message || 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'
      showToast(msg, 'error')
    },
  })

  return (
    <div
      style={{
        maxWidth: 'var(--content-max)',
        margin: '0 auto',
        padding: 'var(--gutter)',
        paddingBottom: 'calc(var(--bottomnav-h) + var(--space-4))',
      }}
    >
      <WizardProgress step={step} />

      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          padding: 18,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {step === 0 && (
          <WizardStep1
            data={data}
            onChange={handleChange}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <WizardStep2
            data={data}
            onChange={handleChange}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <WizardStep3
            data={data}
            onChange={handleChange}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <WizardStep4
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
