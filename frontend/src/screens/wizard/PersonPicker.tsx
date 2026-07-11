import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPeople, createPerson } from '../../api/people'
import type { PersonStub } from '../../api/types'

interface Props {
  value: PersonStub | null
  onChange: (person: PersonStub | null) => void
  createRole: 'owner' | 'customer'
  searchRole?: 'owner' | 'customer'
  label: string
  addLabel: string
  error?: string
}

export function PersonPicker({ value, onChange, createRole, searchRole, label, addLabel, error }: Props) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 280)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['people', searchRole, debounced],
    queryFn: () => getPeople({ role: searchRole, search: debounced || undefined }),
    staleTime: 60_000,
  })

  const mut = useMutation({
    mutationFn: createPerson,
    onSuccess: (person) => {
      qc.invalidateQueries({ queryKey: ['people'] })
      const stub: PersonStub = {
        id: person.id,
        first_name: person.first_name,
        last_name: person.last_name,
        phone: person.phone,
      }
      onChange(stub)
      setAdding(false)
      setFirstName('')
      setLastName('')
      setPhone('')
      setFormErrors({})
      setOpen(false)
      setSearch('')
    },
  })

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setAdding(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const people = data?.results ?? []

  function handleSelect(p: typeof people[number]) {
    const stub: PersonStub = {
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      phone: p.phone,
    }
    onChange(stub)
    setOpen(false)
    setAdding(false)
    setSearch('')
  }

  function handleAdd() {
    const errs: Record<string, string> = {}
    if (!firstName.trim()) errs.firstName = 'نام الزامی است'
    if (!phone.trim()) errs.phone = 'شماره موبایل الزامی است'
    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return
    mut.mutate({ first_name: firstName.trim(), last_name: lastName.trim() || undefined, phone: phone.trim(), role: createRole })
  }

  const borderColor = error ? 'var(--color-danger)' : 'var(--border-default)'
  const displayName = value ? `${value.first_name} ${value.last_name}`.trim() : ''

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-medium)' as React.CSSProperties['fontWeight'],
          color: 'var(--text-secondary)',
        }}
      >
        {label} <span style={{ color: 'var(--color-danger)' }}>*</span>
      </label>

      <div
        style={{
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          backgroundColor: 'var(--surface-card)',
        }}
      >
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="جستجو بر اساس نام یا شماره..."
          style={{
            padding: '12px 14px',
            width: '100%',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-md)',
            color: 'var(--text-primary)',
            backgroundColor: 'transparent',
            direction: 'rtl',
          }}
        />

        {open && (
          <div style={{ borderTop: `1px solid var(--border-default)` }}>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {isLoading ? (
                <div style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                  در حال بارگذاری...
                </div>
              ) : people.length === 0 ? (
                <div style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                  موردی یافت نشد
                </div>
              ) : (
                people.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      padding: '10px 14px',
                      textAlign: 'right',
                      background: value?.id === p.id ? 'var(--color-primary-soft)' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-md)', color: value?.id === p.id ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                      {p.first_name} {p.last_name}
                    </span>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{p.phone}</span>
                  </button>
                ))
              )}
            </div>

            {adding ? (
              <div
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  borderTop: `1px solid var(--border-default)`,
                  backgroundColor: 'var(--surface-sunken)',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="نام *"
                      autoFocus
                      style={inlineInputStyle}
                    />
                    {formErrors.firstName && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>{formErrors.firstName}</span>
                    )}
                  </div>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="نام خانوادگی"
                    style={inlineInputStyle}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="شماره موبایل *"
                    type="tel"
                    style={inlineInputStyle}
                  />
                  {formErrors.phone && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>{formErrors.phone}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={mut.isPending}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'var(--color-primary)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: mut.isPending ? 'not-allowed' : 'pointer',
                      fontSize: 'var(--text-sm)',
                      fontFamily: 'var(--font-sans)',
                      opacity: mut.isPending ? 0.6 : 1,
                    }}
                  >
                    {mut.isPending ? '...' : 'افزودن'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAdding(false); setFormErrors({}) }}
                    style={{
                      padding: '8px 14px',
                      background: 'none',
                      border: `1px solid var(--border-default)`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: 'var(--text-sm)',
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    لغو
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  borderTop: `1px solid var(--border-default)`,
                  background: 'var(--surface-sunken)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-primary)',
                  fontFamily: 'var(--font-sans)',
                  textAlign: 'right',
                }}
              >
                + {addLabel}
              </button>
            )}
          </div>
        )}
      </div>

      {value && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'var(--color-primary-soft)',
            border: `1px solid var(--color-primary)`,
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-primary)',
            width: 'fit-content',
          }}
        >
          {displayName}
          <button
            type="button"
            onClick={() => { onChange(null); setSearch('') }}
            aria-label={`حذف ${label}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>{error}</span>
      )}
    </div>
  )
}

const inlineInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  border: `1px solid var(--border-default)`,
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-primary)',
  direction: 'rtl',
  outline: 'none',
  backgroundColor: 'var(--surface-card)',
}
