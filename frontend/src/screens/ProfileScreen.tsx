import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '../components/forms/Input'
import { Switch } from '../components/forms/Switch'
import { useAuth } from '../hooks/useAuth'
import { getMe, patchMe } from '../api/me'
import { toPersianDigits } from '../lib/fmt'
import type { UserProfile } from '../api/types'

function getInitials(profile: UserProfile): string {
  const f = profile.first_name?.trim()
  const l = profile.last_name?.trim()
  if (f && l) return `${f[0]}.${l[0]}`
  if (f) return f[0]
  if (profile.full_name?.trim()) return profile.full_name.trim()[0]
  return '؟'
}

export default function ProfileScreen() {
  const navigate = useNavigate()
  const { clearTokens } = useAuth()
  const qc = useQueryClient()

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['me'],
    queryFn: getMe,
  })

  const mutation = useMutation({
    mutationFn: patchMe,
    onSuccess: (updated) => {
      qc.setQueryData<UserProfile>(['me'], updated)
    },
  })

  // Local state for name editing
  const [nameValue, setNameValue] = useState('')
  const [nameDirty, setNameDirty] = useState(false)

  useEffect(() => {
    if (profile) {
      setNameValue(profile.full_name ?? '')
      setNameDirty(false)
    }
  }, [profile])

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNameValue(e.target.value)
    setNameDirty(true)
  }

  function handleSaveName() {
    const parts = nameValue.trim().split(/\s+/)
    const first_name = parts[0] ?? ''
    const last_name = parts.slice(1).join(' ')
    mutation.mutate({ first_name, last_name })
    setNameDirty(false)
  }

  // Optimistic toggle for notifications
  function handleToggleNotif(val: boolean) {
    const prev = qc.getQueryData<UserProfile>(['me'])
    qc.setQueryData<UserProfile>(['me'], (old) =>
      old ? { ...old, notifications_enabled: val } : old,
    )
    mutation.mutate(
      { notifications_enabled: val },
      {
        onError: () => {
          qc.setQueryData<UserProfile>(['me'], prev)
        },
      },
    )
  }

  // Optimistic toggle for dark mode — UI only, DOM wiring is task 19
  function handleToggleDark(val: boolean) {
    const prev = qc.getQueryData<UserProfile>(['me'])
    qc.setQueryData<UserProfile>(['me'], (old) =>
      old ? { ...old, dark_mode: val } : old,
    )
    mutation.mutate(
      { dark_mode: val },
      {
        onError: () => {
          qc.setQueryData<UserProfile>(['me'], prev)
        },
      },
    )
  }

  function handleLogout() {
    clearTokens()
    navigate('/login', { replace: true })
  }

  if (isLoading || !profile) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        در حال بارگذاری...
      </div>
    )
  }

  const initials = getInitials(profile)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Avatar card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          padding: 18,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'var(--color-primary-soft)',
            color: 'var(--blue-700)',
            fontWeight: 700,
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {initials}
        </span>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <strong style={{ fontSize: 18, fontWeight: 700 }}>{profile.full_name}</strong>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            مشاور املاک · املاک ایران زمین
          </span>
        </div>
      </div>

      {/* Account info card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          padding: 18,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <strong style={{ fontSize: 15, fontWeight: 600 }}>اطلاعات حساب</strong>
        <Input
          label="نام و نام خانوادگی"
          value={nameValue}
          onChange={handleNameChange}
        />
        <Input
          label="شماره تماس"
          value={toPersianDigits(profile.mobile)}
          readOnly
          disabled
        />
        <button
          onClick={handleSaveName}
          disabled={!nameDirty || mutation.isPending}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            height: 42,
            padding: '0 18px',
            border: 'none',
            borderRadius: 10,
            background: nameDirty ? 'var(--color-primary)' : 'var(--gray-200)',
            color: nameDirty ? '#fff' : 'var(--text-muted)',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 600,
            cursor: nameDirty ? 'pointer' : 'not-allowed',
            transition: 'background 160ms',
          }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          ذخیره تغییرات
        </button>
      </div>

      {/* Settings toggles card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          padding: '6px 18px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '14px 0',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 500 }}>اعلان‌ها</span>
          <Switch
            checked={profile.notifications_enabled}
            onChange={handleToggleNotif}
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '14px 0',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 500 }}>حالت تاریک</span>
          <Switch
            checked={profile.dark_mode}
            onChange={handleToggleDark}
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '14px 0',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 500 }}>زبان</span>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>فارسی</span>
        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          height: 50,
          border: '1px solid var(--red-100)',
          background: 'var(--color-danger-soft)',
          color: 'var(--color-danger-text)',
          borderRadius: 12,
          fontFamily: 'var(--font-sans)',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5M21 12H9" />
        </svg>
        خروج از حساب
      </button>

      {/* Footer */}
      <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
        نسخه ۲٫۴ · پشتیبانی ۰۲۱-۸۸۸۸۸۸۸۸
      </p>
    </div>
  )
}
