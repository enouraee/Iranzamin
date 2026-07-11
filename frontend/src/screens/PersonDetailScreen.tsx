import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import type { AxiosError } from 'axios'
import { getPerson, updatePerson } from '../api/people'
import type { PersonCreatePayload } from '../api/people'
import type { PersonDetailApi, PersonRoleApi, PropertyTypeApi, PropertyStatusApi } from '../api/types'
import { PROPERTY_TYPE_LABEL } from '../api/types'
import { toPersianDigits, formatPhone, toJalali } from '../lib/fmt'
import { Badge } from '../components/data/Badge'
import { Button } from '../components/forms/Button'
import { Input } from '../components/forms/Input'
import { useToast } from '../components/common/Toast'

const ROLE_LABEL: Record<PersonRoleApi, string> = {
  owner: 'مالک',
  customer: 'مشتری',
}

const STATUS_LABEL: Record<PropertyStatusApi, string> = {
  vacant: 'خالی',
  occupied: 'پر',
}

function initials(person: PersonDetailApi): string {
  const first = person.first_name?.[0] ?? ''
  const last = person.last_name?.[0] ?? ''
  return (first + last).toUpperCase() || '؟'
}

function InfoRow({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid var(--border-default)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{label}</span>
      <span
        dir={ltr ? 'ltr' : undefined}
        style={{
          fontSize: 'var(--text-md)',
          color: 'var(--text-primary)',
          fontWeight: 500,
          textAlign: ltr ? 'left' : 'right',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function LinkedPropertyCard({
  id,
  type,
  address,
  status,
  onClick,
}: {
  id: number
  type: PropertyTypeApi
  address: string
  status: PropertyStatusApi
  onClick: () => void
}) {
  return (
    <button
      key={id}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3)',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'right',
        transition: 'box-shadow 140ms ease',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--blue-500), var(--blue-700))',
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: 4,
          }}
        >
          {PROPERTY_TYPE_LABEL[type]}
          {address ? ` · ${address}` : ''}
        </div>
        <Badge
          tone={status === 'vacant' ? 'success' : 'danger'}
          size="sm"
          dot
        >
          {STATUS_LABEL[status]}
        </Badge>
      </div>
    </button>
  )
}

interface EditForm {
  first_name: string
  last_name: string
  phone: string
  national_id: string
  role: PersonRoleApi | ''
}

function EditSheet({
  person,
  onClose,
}: {
  person: PersonDetailApi
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const [form, setForm] = useState<EditForm>({
    first_name: person.first_name,
    last_name: person.last_name ?? '',
    phone: person.phone,
    national_id: person.national_id ?? '',
    role: person.role,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof EditForm, string>>>({})

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: Partial<PersonCreatePayload>) => updatePerson(person.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['person', person.id] })
      qc.invalidateQueries({ queryKey: ['people'] })
      onClose()
    },
    onError: (err) => {
      const axErr = err as AxiosError<{ message?: string }>
      const msg = axErr.response?.data?.message ?? 'خطایی رخ داد. دوباره تلاش کنید.'
      showToast(msg, 'error')
    },
  })

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!form.first_name.trim()) errs.first_name = 'نام الزامی است.'
    if (!form.phone.trim()) {
      errs.phone = 'شماره موبایل الزامی است.'
    } else if (!/^09\d{9}$/.test(form.phone)) {
      errs.phone = 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.'
    }
    if (!form.role) errs.role = 'نقش الزامی است.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    mutate({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim() || undefined,
      phone: form.phone.trim(),
      role: form.role as PersonRoleApi,
      national_id: form.national_id.trim() || undefined,
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ویرایش اطلاعات شخص"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          padding: 'var(--space-6)',
          width: '100%',
          maxWidth: 480,
          maxHeight: '92vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          direction: 'rtl',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2
            style={{
              margin: 0,
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-primary)',
            }}
          >
            ویرایش اطلاعات
          </h2>
          <button
            onClick={onClose}
            aria-label="بستن"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} noValidate>
          <Input
            id="edit-first-name"
            label="نام"
            value={form.first_name}
            onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
            error={errors.first_name}
            fullWidth
          />
          <Input
            id="edit-last-name"
            label="نام خانوادگی"
            value={form.last_name}
            onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
            fullWidth
          />
          <Input
            id="edit-phone"
            label="شماره موبایل"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            error={errors.phone}
            fullWidth
            dir="ltr"
            autoComplete="tel"
          />
          <Input
            id="edit-national-id"
            label="کد ملی"
            value={form.national_id}
            onChange={(e) => setForm((f) => ({ ...f, national_id: e.target.value }))}
            fullWidth
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              نقش
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              {([['owner', 'مالک'], ['customer', 'مشتری']] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: val }))}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    border: form.role === val ? '2px solid var(--color-primary)' : '1.5px solid var(--border-default)',
                    background: form.role === val ? 'var(--color-primary-soft)' : 'var(--surface-card)',
                    color: form.role === val ? 'var(--color-primary)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-md)',
                    fontWeight: form.role === val ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 140ms ease',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {errors.role && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>
                {errors.role}
              </span>
            )}
          </div>

          <Button type="submit" loading={isPending} size="lg" style={{ marginTop: 4 }}>
            ذخیره تغییرات
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function PersonDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showEdit, setShowEdit] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const { data: person, isLoading, isError } = useQuery({
    queryKey: ['person', Number(id)],
    queryFn: () => getPerson(Number(id)),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[120, 200, 140].map((h, i) => (
          <div
            key={i}
            style={{
              height: h,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
            }}
          />
        ))}
      </div>
    )
  }

  if (isError || !person) {
    return (
      <p
        role="alert"
        style={{
          margin: 0,
          textAlign: 'center',
          padding: '40px 0',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-danger)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        خطا در دریافت اطلاعات شخص
      </p>
    )
  }

  const allProperties = [
    ...person.owned_properties.map((p) => ({ ...p, relation: 'owner' as const })),
    ...person.rented_properties.map((p) => ({ ...p, relation: 'tenant' as const })),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, direction: 'rtl' }}>
      <div
        style={{
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary-soft)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {initials(person)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              marginBottom: 6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {person.full_name || `${person.first_name} ${person.last_name}`.trim()}
          </div>
          <Badge tone={person.role === 'owner' ? 'primary' : 'neutral'} size="sm">
            {ROLE_LABEL[person.role]}
          </Badge>
        </div>
        <button
          onClick={() => setShowEdit(true)}
          aria-label="ویرایش"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-full)',
            border: '1.5px solid var(--border-default)',
            background: 'var(--surface-card)',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            flexShrink: 0,
          }}
        >
          <Pencil size={16} />
        </button>
      </div>

      <div
        style={{
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '0 var(--space-4)',
          border: '1px solid var(--border-default)',
        }}
      >
        <InfoRow label="نام" value={person.first_name} />
        <InfoRow label="نام خانوادگی" value={person.last_name || '—'} />
        <InfoRow label="شماره تلفن" value={formatPhone(person.phone)} ltr />
        <InfoRow label="کد ملی" value={person.national_id ?? '—'} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>تاریخ تولد</span>
          <span style={{ fontSize: 'var(--text-md)', color: 'var(--text-primary)', fontWeight: 500 }}>
            {person.birth_date ? toJalali(person.birth_date) : '—'}
          </span>
        </div>
      </div>

      <div
        style={{
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => setHistoryOpen((o) => !o)}
          aria-expanded={historyOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: 'var(--space-4)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-md)',
            fontWeight: 500,
            color: 'var(--text-primary)',
            direction: 'rtl',
          }}
        >
          تاریخچه تغییرات
          {historyOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {historyOpen && (
          <div
            style={{
              padding: 'var(--space-4)',
              paddingTop: 0,
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              textAlign: 'center',
              borderTop: '1px solid var(--border-default)',
              paddingBottom: 'var(--space-4)',
            }}
          >
            تاریخچه‌ای ثبت نشده.
          </div>
        )}
      </div>

      {allProperties.length > 0 && (
        <div
          style={{
            background: 'var(--surface-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 'var(--text-md)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            املاک مرتبط ({toPersianDigits(allProperties.length)})
          </h3>
          {allProperties.map((prop) => (
            <LinkedPropertyCard
              key={`${prop.relation}-${prop.id}`}
              id={prop.id}
              type={prop.type}
              address={prop.address}
              status={prop.status}
              onClick={() => navigate(`/files/${prop.id}`)}
            />
          ))}
        </div>
      )}

      {showEdit && <EditSheet person={person} onClose={() => setShowEdit(false)} />}
    </div>
  )
}
