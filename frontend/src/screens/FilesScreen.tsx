import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { PropertyCard } from '../components/data/PropertyCard'
import { getProperties } from '../api/properties'
import { toPersianDigits, formatToman } from '../lib/fmt'
import type { PropertyTypeApi, PropertyStatusApi, DealTypeApi } from '../api/types'
import { PROPERTY_TYPE_LABEL, DEAL_TYPE_LABEL } from '../api/types'

const TYPE_OPTIONS: { value: PropertyTypeApi; label: string }[] = [
  { value: 'apartment', label: 'آپارتمان' },
  { value: 'kalnagi', label: 'کلنگی' },
  { value: 'land', label: 'زمین' },
  { value: 'commercial', label: 'تجاری' },
  { value: 'office', label: 'اداری' },
  { value: 'villa', label: 'ویلا' },
]

const DEAL_OPTIONS: { value: DealTypeApi; label: string }[] = [
  { value: 'sale', label: 'فروش' },
  { value: 'rent', label: 'اجاره' },
  { value: 'rahn', label: 'رهن کامل' },
]

const STATUS_OPTIONS: { value: PropertyStatusApi; label: string }[] = [
  { value: 'vacant', label: 'خالی' },
  { value: 'occupied', label: 'پر' },
]

function FilterChip({
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
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 14px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        fontFamily: 'var(--font-sans)',
        border: active ? '1.5px solid var(--color-primary)' : '1.5px solid var(--border-default)',
        background: active ? 'var(--color-primary-soft)' : 'var(--surface-card)',
        color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        transition: 'all 120ms ease',
      }}
    >
      {label}
    </button>
  )
}

function buildPrice(item: {
  is_for_sale: boolean
  is_for_rent: boolean
  is_for_rahn: boolean
  total_price: number | null
  monthly_rent: number | null
  rahn_amount: number | null
}): string | undefined {
  if (item.is_for_sale && item.total_price != null)
    return `${formatToman(item.total_price)} تومان`
  if (item.is_for_rahn && item.rahn_amount != null)
    return `رهن ${formatToman(item.rahn_amount)} تومان`
  if (item.is_for_rent && item.monthly_rent != null)
    return `اجاره ${formatToman(item.monthly_rent)} / ماه`
  return undefined
}

export default function FilesScreen() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<PropertyTypeApi | undefined>()
  const [statusFilter, setStatusFilter] = useState<PropertyStatusApi | undefined>()
  const [dealFilter, setDealFilter] = useState<DealTypeApi | undefined>()
  const [page, setPage] = useState(1)

  const debounceRef = { current: 0 as ReturnType<typeof setTimeout> }
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 400)
  }, [])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['properties', debouncedSearch, typeFilter, statusFilter, dealFilter, page],
    queryFn: () =>
      getProperties({
        search: debouncedSearch || undefined,
        type: typeFilter,
        status: statusFilter,
        deal_type: dealFilter,
        page,
        page_size: 20,
      }),
    placeholderData: (prev) => prev,
  })

  function toggleType(v: PropertyTypeApi) {
    setTypeFilter((cur) => (cur === v ? undefined : v))
    setPage(1)
  }
  function toggleStatus(v: PropertyStatusApi) {
    setStatusFilter((cur) => (cur === v ? undefined : v))
    setPage(1)
  }
  function toggleDeal(v: DealTypeApi) {
    setDealFilter((cur) => (cur === v ? undefined : v))
    setPage(1)
  }

  const items = data?.results ?? []
  const totalCount = data?.count ?? 0
  const hasNext = Boolean(data?.next)
  const hasPrev = Boolean(data?.previous)
  const filtersActive = !!(typeFilter || statusFilter || dealFilter || debouncedSearch)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Search */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            insetInlineEnd: 14,
            color: 'var(--text-muted)',
            display: 'flex',
            pointerEvents: 'none',
          }}
        >
          <Search size={16} />
        </span>
        <input
          type="search"
          placeholder="جستجو در فایل‌ها…"
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
          }}
        />
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none',
        }}
      >
        {TYPE_OPTIONS.map((o) => (
          <FilterChip
            key={o.value}
            label={o.label}
            active={typeFilter === o.value}
            onClick={() => toggleType(o.value)}
          />
        ))}
        <div
          style={{
            width: 1,
            flexShrink: 0,
            background: 'var(--border-default)',
            margin: '4px 2px',
          }}
        />
        {DEAL_OPTIONS.map((o) => (
          <FilterChip
            key={o.value}
            label={o.label}
            active={dealFilter === o.value}
            onClick={() => toggleDeal(o.value)}
          />
        ))}
        <div
          style={{
            width: 1,
            flexShrink: 0,
            background: 'var(--border-default)',
            margin: '4px 2px',
          }}
        />
        {STATUS_OPTIONS.map((o) => (
          <FilterChip
            key={o.value}
            label={o.label}
            active={statusFilter === o.value}
            onClick={() => toggleStatus(o.value)}
          />
        ))}
      </div>

      {/* Count + clear */}
      {!isLoading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <span>
            {toPersianDigits(totalCount)} فایل
          </span>
          {filtersActive && (
            <button
              onClick={() => {
                setSearch('')
                setDebouncedSearch('')
                setTypeFilter(undefined)
                setStatusFilter(undefined)
                setDealFilter(undefined)
                setPage(1)
              }}
              style={{
                border: 'none',
                background: 'none',
                color: 'var(--color-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              پاک کردن فیلترها
            </button>
          )}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div
          data-testid="loading"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 112,
                borderRadius: 14,
                background: 'var(--surface-card)',
                border: '1px solid var(--border-default)',
                animation: 'pulse 1.4s ease-in-out infinite',
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
            fontSize: 14,
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
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            ملکی با این مشخصات یافت نشد.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item) => {
            const areaNum = item.area ? Math.round(parseFloat(item.area)) : null
            const areaMeta = areaNum
              ? [{ icon: <span style={{ fontSize: 11 }}>م²</span>, label: toPersianDigits(areaNum) }]
              : []

            return (
              <PropertyCard
                key={item.id}
                title={item.title || `${PROPERTY_TYPE_LABEL[item.type]} ${item.region.name}`}
                district={item.region.name}
                price={buildPrice(item)}
                status={item.status === 'vacant' ? 'available' : 'occupied'}
                image={item.cover_photo ?? undefined}
                meta={areaMeta}
                onClick={() => navigate(`/files/${item.id}`)}
              />
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {(hasPrev || hasNext) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            padding: '8px 0',
          }}
        >
          {hasPrev && (
            <button
              onClick={() => setPage((p) => p - 1)}
              style={{
                padding: '8px 20px',
                borderRadius: 10,
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
              fontSize: 13,
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
                borderRadius: 10,
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
    </div>
  )
}
