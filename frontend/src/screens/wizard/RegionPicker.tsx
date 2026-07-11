import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRegions, createRegion } from '../../api/regions'
import type { Region } from '../../api/types'

interface Props {
  value: Region | null
  onChange: (region: Region | null) => void
  error?: string
}

export function RegionPicker({ value, onChange, error }: Props) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 280)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['regions', debounced],
    queryFn: () => getRegions(debounced || undefined),
    staleTime: 60_000,
  })

  const mut = useMutation({
    mutationFn: createRegion,
    onSuccess: (region) => {
      qc.invalidateQueries({ queryKey: ['regions'] })
      onChange(region)
      setAdding(false)
      setNewName('')
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

  const regions = data?.results ?? []

  function handleSelect(r: Region) {
    onChange(r)
    setOpen(false)
    setAdding(false)
    setSearch('')
  }

  function handleAdd() {
    if (newName.trim()) mut.mutate(newName.trim())
  }

  const borderColor = error ? 'var(--color-danger)' : 'var(--border-default)'

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-medium)' as React.CSSProperties['fontWeight'],
          color: 'var(--text-secondary)',
        }}
      >
        منطقه <span style={{ color: 'var(--color-danger)' }}>*</span>
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
          placeholder="جستجوی منطقه..."
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
              ) : regions.length === 0 ? (
                <div style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                  موردی یافت نشد
                </div>
              ) : (
                regions.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelect(r)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 14px',
                      textAlign: 'right',
                      background: value?.id === r.id ? 'var(--color-primary-soft)' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 'var(--text-md)',
                      color: value?.id === r.id ? 'var(--color-primary)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {r.name}
                  </button>
                ))
              )}
            </div>

            {adding ? (
              <div
                style={{
                  padding: '8px 14px',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  borderTop: `1px solid var(--border-default)`,
                  backgroundColor: 'var(--surface-sunken)',
                }}
              >
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="نام منطقه جدید"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    border: `1px solid var(--border-default)`,
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    direction: 'rtl',
                    outline: 'none',
                    backgroundColor: 'var(--surface-card)',
                  }}
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={mut.isPending || !newName.trim()}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--color-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: mut.isPending || !newName.trim() ? 'not-allowed' : 'pointer',
                    fontSize: 'var(--text-sm)',
                    fontFamily: 'var(--font-sans)',
                    opacity: mut.isPending || !newName.trim() ? 0.5 : 1,
                  }}
                >
                  {mut.isPending ? '...' : 'افزودن'}
                </button>
                <button
                  type="button"
                  onClick={() => { setAdding(false); setNewName('') }}
                  style={{
                    padding: '6px 10px',
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
                + افزودن منطقه جدید
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
          {value.name}
          <button
            type="button"
            onClick={() => { onChange(null); setSearch('') }}
            aria-label="حذف منطقه"
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
