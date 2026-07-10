import React, { useState } from 'react'
import { MapPin } from 'lucide-react'
import { Badge } from './Badge'

interface MetaItem {
  icon: React.ReactNode
  label: string
}

interface PropertyCardProps {
  title: string
  district?: string
  price?: string
  meta?: MetaItem[]
  status?: 'available' | 'occupied'
  image?: string
  code?: string
  onClick?: () => void
}

function ImagePlaceholder() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--surface-sunken)',
        color: 'var(--text-muted)',
      }}
    >
      <svg
        width={32}
        height={32}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    </div>
  )
}

export function PropertyCard({
  title,
  district,
  price,
  meta,
  status,
  image,
  code,
  onClick,
}: PropertyCardProps) {
  const [hovered, setHovered] = useState(false)
  const isInteractive = Boolean(onClick)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 'var(--space-3)',
        padding: 'var(--space-3)',
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: isInteractive && hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transform: isInteractive && hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'box-shadow 160ms ease, transform 160ms ease',
        cursor: isInteractive ? 'pointer' : 'default',
        fontFamily: 'var(--font-sans)',
      }}
      onClick={onClick}
      onMouseEnter={isInteractive ? () => setHovered(true) : undefined}
      onMouseLeave={isInteractive ? () => setHovered(false) : undefined}
    >
      {/* Image block */}
      <div
        style={{
          width: 92,
          height: 92,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          flexShrink: 0,
          backgroundColor: 'var(--surface-sunken)',
        }}
      >
        {image ? (
          <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <ImagePlaceholder />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        {/* Title + status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span
            style={{
              fontSize: 'var(--text-md)',
              fontWeight: 'var(--weight-semibold)' as React.CSSProperties['fontWeight'],
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {title}
          </span>
          {status && (
            <Badge
              tone={status === 'available' ? 'success' : 'danger'}
              size="sm"
            >
              {status === 'available' ? 'خالی' : 'پر'}
            </Badge>
          )}
        </div>

        {/* District */}
        {district && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            <MapPin size={12} strokeWidth={2} />
            <span>{district}</span>
          </div>
        )}

        {/* Meta chips */}
        {meta && meta.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {meta.map((item, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                }}
              >
                <span style={{ display: 'inline-flex' }}>{item.icon}</span>
                {item.label}
              </span>
            ))}
          </div>
        )}

        {/* Price + code */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {price && (
            <span
              style={{
                fontSize: 'var(--text-md)',
                fontWeight: 'var(--weight-bold)' as React.CSSProperties['fontWeight'],
                color: 'var(--color-primary)',
              }}
            >
              {price}
            </span>
          )}
          {code && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                marginInlineStart: 'auto',
              }}
            >
              {code}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
