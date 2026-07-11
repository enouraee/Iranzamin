import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { MapPin, Camera, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { getProperty } from '../api/properties'
import { PROPERTY_TYPE_LABEL } from '../api/types'
import type { PropertyDetail, PropertyHistoryEntry } from '../api/types'
import { toPersianDigits, formatToman, toJalali } from '../lib/fmt'
import { Avatar, Button, Card, Badge } from '../components'

function cabinetLabel(v: string): string | null {
  if (v === 'open') return 'اوپن'
  if (v === 'mdf') return 'MDF'
  return null
}

function changeTypeLabel(t: PropertyHistoryEntry['change_type']): string {
  const MAP: Record<PropertyHistoryEntry['change_type'], string> = {
    owner: 'مالک',
    tenant: 'مستاجر',
    status: 'وضعیت',
    price: 'قیمت',
    other: 'سایر',
  }
  return MAP[t] ?? t
}

function toWords(n: number): string {
  if (n === 0) return 'صفر'
  const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه',
    'ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده',
    'هفده', 'هجده', 'نوزده']
  const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود']
  const hundreds = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد']

  function belowThousand(x: number): string {
    const h = Math.floor(x / 100)
    const rem = x % 100
    const parts: string[] = []
    if (h > 0) parts.push(hundreds[h])
    if (rem >= 20) {
      const t = Math.floor(rem / 10)
      const o = rem % 10
      parts.push(tens[t])
      if (o > 0) parts.push(ones[o])
    } else if (rem > 0) {
      parts.push(ones[rem])
    }
    return parts.join(' و ')
  }

  let rest = n
  const chunks: string[] = []

  if (rest >= 1_000_000_000) {
    chunks.push(belowThousand(Math.floor(rest / 1_000_000_000)) + ' میلیارد')
    rest = rest % 1_000_000_000
  }
  if (rest >= 1_000_000) {
    chunks.push(belowThousand(Math.floor(rest / 1_000_000)) + ' میلیون')
    rest = rest % 1_000_000
  }
  if (rest >= 1_000) {
    chunks.push(belowThousand(Math.floor(rest / 1_000)) + ' هزار')
    rest = rest % 1_000
  }
  if (rest > 0) chunks.push(belowThousand(rest))
  return chunks.join(' و ')
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p style={{
      margin: 0,
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--text-secondary)',
      fontFamily: 'var(--font-sans)',
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
    }}>
      {children}
    </p>
  )
}

function SectionTitleEl({ children }: { children: string }) {
  return (
    <span style={{
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--text-secondary)',
      fontFamily: 'var(--font-sans)',
    }}>
      {children}
    </span>
  )
}

function DealPill({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 14px',
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 500,
      fontFamily: 'var(--font-sans)',
      border: '1.5px solid var(--border-strong)',
      background: 'var(--surface-card)',
      color: 'var(--text-primary)',
    }}>
      {label}
    </span>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>{value}</span>
    </div>
  )
}

function PriceRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 0', borderBottom: '1px solid var(--border-default)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
        {formatToman(value)} تومان
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
        {toWords(value)} تومان
      </span>
    </div>
  )
}

function OccupancyItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: 'var(--color-danger-text)', fontFamily: 'var(--font-sans)', opacity: 0.7 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-danger-text)', fontFamily: 'var(--font-sans)' }}>{value}</span>
    </div>
  )
}

function HistoryItem({ entry, isLast }: { entry: PropertyHistoryEntry; isLast: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 16, position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: 'var(--color-primary)', marginTop: 3, flexShrink: 0,
        }} />
        {!isLast && (
          <div style={{ width: 1, flex: 1, background: 'var(--border-default)', marginTop: 4 }} />
        )}
      </div>
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
          {changeTypeLabel(entry.change_type)} — {entry.field}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
          {entry.old_value} ← {entry.new_value}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
          {toJalali(entry.created_at.slice(0, 10))}
        </p>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div data-testid="detail-loading" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[200, 160, 120].map((h, i) => (
        <div
          key={i}
          style={{
            height: h,
            borderRadius: 16,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            animation: 'pulse 1.4s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  )
}

function buildSpecs(property: PropertyDetail, isApartment: boolean, isKalnagi: boolean, isLand: boolean) {
  const rows: { label: string; value: string }[] = []
  const areaNum = property.area ? Math.round(parseFloat(property.area)) : null
  if (areaNum) rows.push({ label: 'متراژ', value: `${toPersianDigits(areaNum)} متر` })

  if (isApartment) {
    if (property.floor != null) rows.push({ label: 'طبقه', value: toPersianDigits(property.floor) })
    if (property.unit) rows.push({ label: 'واحد', value: toPersianDigits(property.unit) })
    if (property.beds != null) rows.push({ label: 'تعداد خواب', value: toPersianDigits(property.beds) })
    if (property.build_year != null) rows.push({ label: 'سال ساخت', value: toPersianDigits(property.build_year) })
    const cab = cabinetLabel(property.cabinet_material)
    if (cab) rows.push({ label: 'کابینت', value: cab })
  }

  if (isKalnagi || isLand) {
    if (property.taadad_bar != null) rows.push({ label: 'تعداد بر', value: toPersianDigits(property.taadad_bar) })
    if (property.gozar_kooche) rows.push({ label: 'گذر کوچه', value: property.gozar_kooche })
    if (property.taadad_tabaghat != null) rows.push({ label: 'تعداد طبقات', value: toPersianDigits(property.taadad_tabaghat) })
  }

  return rows
}

export default function PropertyDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [historyOpen, setHistoryOpen] = useState(false)

  const numId = id ? parseInt(id, 10) : 0

  const { data: property, isLoading, error } = useQuery({
    queryKey: ['property', numId],
    queryFn: () => getProperty(numId),
    enabled: !!numId,
    retry: false,
  })

  const is404 = axios.isAxiosError(error) && error.response?.status === 404

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (is404) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '48px 0' }}>
        <p style={{ margin: 0, fontSize: 16, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
          ملک یافت نشد
        </p>
        <Button variant="secondary" onClick={() => navigate(-1)}>بازگشت</Button>
      </div>
    )
  }

  if (error && !is404) {
    return (
      <div role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 0' }}>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-danger)', fontFamily: 'var(--font-sans)' }}>
          خطا در دریافت اطلاعات ملک
        </p>
        <Button variant="secondary" onClick={() => window.location.reload()}>تلاش مجدد</Button>
      </div>
    )
  }

  if (!property) return null

  const typeLabel = PROPERTY_TYPE_LABEL[property.type]
  const isOccupied = property.status === 'occupied'
  const isApartment = property.type === 'apartment'
  const isKalnagi = property.type === 'kalnagi'
  const isLand = property.type === 'land'

  const specs = buildSpecs(property, isApartment, isKalnagi, isLand)

  const AMENITY_KEYS: Array<{ key: keyof PropertyDetail; label: string }> = [
    { key: 'has_parking', label: 'پارکینگ' },
    { key: 'has_balcony', label: 'بالکن' },
    { key: 'has_backyard', label: 'حیاط خلوت' },
    { key: 'has_elevator', label: 'آسانسور' },
    { key: 'has_storage', label: 'انباری' },
    { key: 'has_tobdil', label: 'تبدیل' },
  ]
  const amenities = AMENITY_KEYS.filter((a) => property[a.key] === true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 96 }}>

      {/* Hero */}
      <div style={{
        position: 'relative', height: 200, borderRadius: 16, overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--blue-500), var(--blue-800))',
        flexShrink: 0,
      }}>
        {property.cover_photo && (
          <img
            src={property.cover_photo}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={1.2}
          style={{
            position: 'absolute', top: '35%', left: '50%',
            transform: 'translate(-50%, -35%)',
            width: 80, height: 80, opacity: 0.35,
          }}
          aria-hidden="true"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>

        {property.photos.length > 0 && (
          <div style={{
            position: 'absolute', top: 12, insetInlineStart: 12,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
            borderRadius: 999, padding: '5px 12px',
            color: '#fff', fontSize: 13, fontFamily: 'var(--font-sans)',
          }}>
            <Camera size={14} />
            <span>{toPersianDigits(property.photos.length)} عکس</span>
          </div>
        )}

        <div style={{
          position: 'absolute', bottom: 12, insetInlineEnd: 12,
          background: isOccupied ? 'rgba(239,68,68,.15)' : 'rgba(16,185,129,.15)',
          color: isOccupied ? '#dc2626' : '#059669',
          padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
          fontFamily: 'var(--font-sans)', backdropFilter: 'blur(4px)',
        }}>
          {isOccupied ? 'پر' : 'خالی'}
        </div>
      </div>

      {/* Thumbnail strip */}
      {property.photos.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {property.photos.map((photo) => (
            <div
              key={photo.id}
              style={{
                flexShrink: 0, width: 72, height: 72, borderRadius: 10, overflow: 'hidden',
                background: 'linear-gradient(135deg, var(--blue-500), var(--blue-800))',
                border: photo.is_cover ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
              }}
            >
              <img
                src={photo.file}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h2 style={{
          margin: 0, fontSize: 18, fontWeight: 700,
          color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', flex: 1,
        }}>
          {typeLabel} {property.region.name}
        </h2>
        <Badge tone="primary" size="sm">{typeLabel}</Badge>
      </div>

      {/* Address row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'var(--font-sans)',
      }}>
        <MapPin size={14} />
        <span>{property.address}</span>
      </div>

      {/* Deal pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {property.is_for_sale && <DealPill label="فروش" />}
        {property.is_for_rent && <DealPill label="اجاره" />}
        {property.is_for_rahn && <DealPill label="رهن" />}
      </div>

      {/* مشخصات */}
      <Card>
        <SectionTitle>مشخصات</SectionTitle>
        {specs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginTop: 12 }}>
            {specs.map((s) => (
              <SpecRow key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
        )}
        {amenities.length > 0 && (
          <div data-testid="amenity-chips" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            {amenities.map((a) => (
              <span
                key={String(a.key)}
                style={{
                  background: 'var(--color-primary-soft)', color: 'var(--blue-700)',
                  borderRadius: 999, padding: '4px 12px', fontSize: 12,
                  fontFamily: 'var(--font-sans)', fontWeight: 500,
                }}
              >
                {a.label}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* قیمت */}
      {(property.is_for_sale || property.is_for_rent || property.is_for_rahn) && (
        <Card>
          <SectionTitle>قیمت</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
            {property.is_for_sale && property.total_price != null && (
              <PriceRow label="قیمت کل" value={property.total_price} />
            )}
            {property.is_for_sale && property.price_per_meter != null && (
              <PriceRow label="قیمت هر متر" value={property.price_per_meter} />
            )}
            {property.is_for_rent && property.deposit != null && (
              <PriceRow label="ودیعه" value={property.deposit} />
            )}
            {property.is_for_rent && property.monthly_rent != null && (
              <PriceRow label="اجاره ماهانه" value={property.monthly_rent} />
            )}
            {property.is_for_rahn && property.rahn_amount != null && (
              <PriceRow label="مبلغ رهن" value={property.rahn_amount} />
            )}
          </div>
        </Card>
      )}

      {/* مالک */}
      {property.owner && (
        <Card
          interactive
          onClick={() => navigate(`/persons/${property.owner!.id}`)}
          aria-label="مالک"
        >
          <SectionTitle>مالک</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <Avatar
              name={`${property.owner.first_name} ${property.owner.last_name}`}
              size="md"
            />
            <div style={{ flex: 1 }}>
              <p style={{
                margin: 0, fontSize: 14, fontWeight: 600,
                color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
              }}>
                {property.owner.first_name} {property.owner.last_name}
              </p>
              <p style={{
                margin: '2px 0 0', fontSize: 13,
                color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)',
              }}>
                {toPersianDigits(property.owner.phone)}
              </p>
            </div>
            <ChevronLeft size={18} color="var(--text-muted)" />
          </div>
        </Card>
      )}

      {/* وضعیت اشغال */}
      {isOccupied && property.tenant && (
        <Card style={{ background: 'var(--color-danger-soft)', borderColor: 'rgba(190,58,45,0.3)' }}>
          <SectionTitle>وضعیت اشغال</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <OccupancyItem
              label="مستاجر"
              value={`${property.tenant.first_name} ${property.tenant.last_name}`}
            />
            {property.occupancy_monthly_rent != null && (
              <OccupancyItem
                label="اجاره ماهانه"
                value={`${formatToman(property.occupancy_monthly_rent)} تومان`}
              />
            )}
            {property.occupancy_deposit != null && (
              <OccupancyItem
                label="ودیعه"
                value={`${formatToman(property.occupancy_deposit)} تومان`}
              />
            )}
            {property.occupancy_rahn != null && (
              <OccupancyItem
                label="مبلغ رهن"
                value={`${formatToman(property.occupancy_rahn)} تومان`}
              />
            )}
            {property.occupancy_start && (
              <OccupancyItem label="شروع" value={toJalali(property.occupancy_start)} />
            )}
            {property.occupancy_end && (
              <OccupancyItem label="پایان" value={toJalali(property.occupancy_end)} />
            )}
          </div>
        </Card>
      )}

      {/* تاریخچه */}
      <Card>
        <button
          onClick={() => setHistoryOpen((o) => !o)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, fontFamily: 'var(--font-sans)',
          }}
          aria-expanded={historyOpen}
        >
          <SectionTitleEl>تاریخچه</SectionTitleEl>
          {historyOpen
            ? <ChevronUp size={18} color="var(--text-muted)" />
            : <ChevronDown size={18} color="var(--text-muted)" />
          }
        </button>

        {historyOpen && (
          <div style={{ marginTop: 16 }}>
            {property.history.length === 0 ? (
              <p style={{
                margin: 0, fontSize: 13, color: 'var(--text-muted)',
                fontFamily: 'var(--font-sans)', textAlign: 'center', padding: '8px 0',
              }}>
                تاریخچه‌ای ثبت نشده.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {property.history.map((entry, idx) => (
                  <HistoryItem
                    key={entry.id}
                    entry={entry}
                    isLast={idx === property.history.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Bottom actions */}
      <div style={{
        position: 'fixed', bottom: 0, insetInlineStart: 0, insetInlineEnd: 0,
        display: 'flex', gap: 12, padding: '12px 16px 24px',
        background: 'var(--surface-card)',
        borderTop: '1px solid var(--border-default)',
        zIndex: 30,
      }}>
        <Button
          variant="secondary"
          style={{ flex: 1 }}
          onClick={() => navigate(`/files/${numId}/edit`)}
        >
          ویرایش
        </Button>
        <Button
          variant="primary"
          style={{ flex: 1 }}
          onClick={() => navigate(`/contracts/new?property=${numId}`)}
        >
          ثبت قرارداد
        </Button>
      </div>
    </div>
  )
}
