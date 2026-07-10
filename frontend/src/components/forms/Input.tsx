import React, { InputHTMLAttributes, useState } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label?: string
  hint?: string
  error?: string
  icon?: React.ReactNode
  fullWidth?: boolean
  id?: string
}

export function Input({
  label,
  hint,
  error,
  icon,
  fullWidth,
  id,
  disabled,
  style,
  ...rest
}: InputProps) {
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
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          height: 46,
          padding: '0 14px',
          gap: 8,
          backgroundColor: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius-md)',
          boxShadow,
          transition: 'border-color 140ms ease, box-shadow 140ms ease',
        }}
      >
        {icon && (
          <span
            style={{
              display: 'inline-flex',
              color: 'var(--text-muted)',
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
        )}
        <input
          id={id}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            border: 'none',
            backgroundColor: 'transparent',
            outline: 'none',
            fontFamily: 'inherit',
            fontSize: 'var(--text-md)',
            color: 'var(--text-primary)',
            cursor: disabled ? 'not-allowed' : undefined,
            direction: 'rtl',
            ...style,
          }}
          {...rest}
        />
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
