import React, { useId } from 'react'

interface SwitchProps {
  checked?: boolean
  onChange?: (value: boolean) => void
  disabled?: boolean
  label?: string
  id?: string
}

export function Switch({ checked = false, onChange, disabled, label, id }: SwitchProps) {
  const autoId = useId()
  const switchId = id ?? autoId

  function handleClick() {
    if (!disabled) {
      onChange?.(!checked)
    }
  }

  const knobOffset = checked ? 21 : 3

  return (
    <label
      htmlFor={switchId}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-sans)',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
      }}
    >
      {label && (
        <span style={{ fontSize: 'var(--text-md)', color: 'var(--text-primary)' }}>
          {label}
        </span>
      )}

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        style={{
          position: 'relative',
          display: 'inline-flex',
          flexShrink: 0,
          width: 44,
          height: 26,
          borderRadius: 'var(--radius-full)',
          border: 'none',
          backgroundColor: checked ? 'var(--color-primary)' : 'var(--gray-300)',
          transition: 'background-color 160ms ease',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          padding: 0,
        }}
      >
        {/* Knob */}
        <span
          style={{
            position: 'absolute',
            top: 3,
            insetInlineStart: knobOffset,
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: 'var(--shadow-sm)',
            transition: 'inset-inline-start 160ms ease',
          }}
        />
      </button>
    </label>
  )
}
