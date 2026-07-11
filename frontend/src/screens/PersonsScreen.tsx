import { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import type { AxiosError } from 'axios'
import { getPeople, createPerson } from '../api/people'
import type { PersonCreatePayload } from '../api/people'
import type { PersonApi } from '../api/types'
import { toPersianDigits, formatPhone } from '../lib/fmt'
import { Button } from '../components/forms/Button'
import { Input } from '../components/forms/Input'

type RoleFilter = 'owner' | 'customer' | undefined

function initials(person: PersonApi): string {
  const first = person.first_name?.[0] ?? ''
  const last = person.last_name?.[0] ?? ''
  return (first + last).toUpperCase() || '؟'
}

function FilterTab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 20px',
        fontSize: 'var(--text-sm)',
        fontWeight: active ? 600 : 400,
        fontFamily: 'var(--font-sans)',
        border: 'none',
        background: 'none',
        color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
        borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 140ms ease',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  )
}

function PersonCard({
  person,
  onClick,
}: {
  person: PersonApi
  onClick: () => void
}) {
  const ownedCount = (person as PersonApi & { owned_properties_count?: number }).owned_properties_count ?? 0
  const rentedCount = (person as PersonApi & { rented_properties_count?: number }).rented_properties_count ?? 0
  const propertyCount = ownedCount + rentedCount

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
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
          width: 44,
          height: 44,
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-primary-soft)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
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
            fontSize: 'var(--text-md)',
            fontWeight: 500,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            marginBottom: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {person.full_name || `${person.first_name} ${person.last_name}`.trim()}
        </div>
        <div
          dir="ltr"
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-sans)',
            textAlign: 'left',
          }}
        >
          {formatPhone(person.phone)}
        </div>
      </div>
      {propertyCount > 0 && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary-soft)',
            color: 'var(--color-primary)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {toPersianDigits(propertyCount)} ملک
        </span>
      )}
    </button>
  )
}

interface AddPersonForm {
  first_name: string
  last_name: string
  phone: string
  national_id: string
  role: 'owner' | 'customer' | ''
}

function AddPersonModal({
  onClose,
}: {
  onClose: () => void
}) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState<AddPersonForm>({
    first_name: '',
    last_name: '',
    phone: '',
    national_id: '',
    role: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof AddPersonForm, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [existingId, setExistingId] = useState<number | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: PersonCreatePayload) => createPerson(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['people'] })
      onClose()
    },
    onError: (err) => {
      const axErr = err as AxiosError<{ message?: string; id?: number; person_id?: number }>
      const data = axErr.response?.data
      const msg = data?.message ?? 'خطایی رخ داد. دوباره تلاش کنید.'
      setServerError(msg)
      const pid = data?.person_id ?? data?.id ?? null
      setExistingId(pid as number | null)
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
    setServerError(null)
    setExistingId(null)
    if (!validate()) return
    mutate({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim() || undefined,
      phone: form.phone.trim(),
      role: form.role as 'owner' | 'customer',
      national_id: form.national_id.trim() || undefined,
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="افزودن شخص جدید"
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
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
        }}
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
            افزودن شخص جدید
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
            id="add-first-name"
            label="نام"
            value={form.first_name}
            onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
            error={errors.first_name}
            fullWidth
            autoComplete="given-name"
          />
          <Input
            id="add-last-name"
            label="نام خانوادگی"
            value={form.last_name}
            onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
            fullWidth
            autoComplete="family-name"
          />
          <Input
            id="add-phone"
            label="شماره موبایل"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            error={errors.phone}
            fullWidth
            dir="ltr"
            autoComplete="tel"
            placeholder="09xxxxxxxxx"
          />
          <Input
            id="add-national-id"
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

          {serverError && (
            <div
              role="alert"
              style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--color-danger-soft)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-danger-text)',
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <span>{serverError}</span>
              {existingId !== null && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigate(`/persons/${existingId}`)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--text-link)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-sm)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textAlign: 'right',
                  }}
                >
                  مشاهده شخص موجود
                </button>
              )}
            </div>
          )}

          <Button type="submit" loading={isPending} size="lg" style={{ marginTop: 4 }}>
            افزودن شخص
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function PersonsScreen() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(undefined)
  const [page, setPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(0 as unknown as ReturnType<typeof setTimeout>)

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 400)
  }, [])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['people', debouncedSearch, roleFilter, page],
    queryFn: () =>
      getPeople({
        search: debouncedSearch || undefined,
        role: roleFilter,
        page,
        page_size: 20,
      }),
    placeholderData: (prev) => prev,
  })

  const items = data?.results ?? []
  const totalCount = data?.count ?? 0
  const hasNext = Boolean(data?.next)
  const hasPrev = Boolean(data?.previous)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              insetInlineEnd: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              display: 'flex',
              pointerEvents: 'none',
            }}
          >
            <Search size={16} />
          </span>
          <input
            type="search"
            placeholder="جستجوی اشخاص…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="جستجو"
            style={{
              width: '100%',
              padding: '10px 42px 10px 14px',
              borderRadius: 12,
              border: '1.5px solid var(--border-default)',
              background: 'var(--surface-card)',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--text-primary)',
              outline: 'none',
              direction: 'rtl',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <Button
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => setShowAddModal(true)}
          aria-label="افزودن شخص"
        >
          افزودن
        </Button>
      </div>

      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-default)',
          gap: 0,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <FilterTab
          label="همه"
          active={roleFilter === undefined}
          onClick={() => { setRoleFilter(undefined); setPage(1) }}
        />
        <FilterTab
          label="مالک"
          active={roleFilter === 'owner'}
          onClick={() => { setRoleFilter('owner'); setPage(1) }}
        />
        <FilterTab
          label="مشتری"
          active={roleFilter === 'customer'}
          onClick={() => { setRoleFilter('customer'); setPage(1) }}
        />
      </div>

      {!isLoading && (
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {toPersianDigits(totalCount)} شخص
        </div>
      )}

      {isLoading ? (
        <div data-testid="loading" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 72,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--surface-card)',
                border: '1px solid var(--border-default)',
              }}
            />
          ))}
        </div>
      ) : isError ? (
        <p
          role="alert"
          style={{
            margin: 0,
            textAlign: 'center',
            padding: '24px 0',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-danger)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          خطا در دریافت اطلاعات
        </p>
      ) : items.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            padding: '40px 0',
          }}
        >
          <svg
            width="52"
            height="52"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            شخصی با این مشخصات یافت نشد.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              onClick={() => navigate(`/persons/${person.id}`)}
            />
          ))}
        </div>
      )}

      {(hasPrev || hasNext) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '8px 0' }}>
          {hasPrev && (
            <button
              onClick={() => setPage((p) => p - 1)}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-default)',
                background: 'var(--surface-card)',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
            >
              قبلی
            </button>
          )}
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            صفحه {toPersianDigits(page)}
          </span>
          {hasNext && (
            <button
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-default)',
                background: 'var(--surface-card)',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
            >
              بعدی
            </button>
          )}
        </div>
      )}

      {showAddModal && <AddPersonModal onClose={() => setShowAddModal(false)} />}
    </div>
  )
}
