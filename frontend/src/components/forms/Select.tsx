import React, { SelectHTMLAttributes, useState } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'onChange'> {
  label?: string
  hint?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
  fullWidth?: boolean
  id?: string
  value?: string
  onChange?: (value: string) => void
}

export function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  fullWidth,
  id,
  disabled,
  value,
  onChange,
  style,
  ...rest
}: SelectProps) {
  const [focused, setFocused] = useState(false)

  const borderColor = error
    ? 'var(--color-danger)'
    : focused
    ? 'var(--color-primary)'
    : 'var(--border-default)'

  const boxShadow = focused
    ? error
      ? 'var(--ring-danger)'
      : 'var(--ring-focus)'
    : 'none'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        width: fullWidth ? '100%' : undefined,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)' as React.CSSProperties['fontWeight'],
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </label>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          height: 46,
          backgroundColor: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius-md)',
          boxShadow,
          transition: 'border-color 140ms ease, box-shadow 140ms ease',
        }}
      >
        <select
          id={id}
          disabled={disabled}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            height: '100%',
            padding: '0 14px',
            border: 'none',
            backgroundColor: 'transparent',
            outline: 'none',
            fontFamily: 'inherit',
            fontSize: 'var(--text-md)',
            color: 'var(--text-primary)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            direction: 'rtl',
            paddingInlineEnd: 32, // space for caret
            ...style,
          }}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Chevron caret — positioned on logical-start (right in RTL) */}
        <span
          style={{
            position: 'absolute',
            insetInlineStart: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--text-muted)',
            display: 'inline-flex',
          }}
          aria-hidden="true"
        >
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4l4 4 4-4" />
          </svg>
        </span>
      </div>

      {error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>
          {error}
        </span>
      )}
      {!error && hint && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {hint}
        </span>
      )}
    </div>
  )
}
