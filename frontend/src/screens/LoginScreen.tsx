import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Input } from '../components/forms/Input'
import { Button } from '../components/forms/Button'
import { authLogin } from '../api/auth'
import { useAuth } from '../hooks/useAuth'

const PERSIAN_TO_LATIN: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
}

function normalizeDigits(str: string): string {
  return str.replace(/[۰-۹٠-٩]/g, (d) => PERSIAN_TO_LATIN[d] ?? d)
}

function isValidIranianPhone(phone: string): boolean {
  const normalized = normalizeDigits(phone).replace(/\s|-/g, '')
  return /^09\d{9}$/.test(normalized)
}

function BuildingIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
      <path d="M9 9v.01M9 13v.01M9 17v.01" />
    </svg>
  )
}

function LoginArrowIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5M15 12H3" />
    </svg>
  )
}

export default function LoginScreen() {
  const navigate = useNavigate()
  const { storeTokens } = useAuth()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  function validatePhone(): boolean {
    if (!phone.trim()) {
      setPhoneError('شماره موبایل را وارد کنید')
      return false
    }
    if (!isValidIranianPhone(phone)) {
      setPhoneError('شماره موبایل معتبر نیست')
      return false
    }
    setPhoneError('')
    return true
  }

  function validatePassword(): boolean {
    if (!password) {
      setPasswordError('رمز عبور را وارد کنید')
      return false
    }
    setPasswordError('')
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')

    const phoneOk = validatePhone()
    const passOk = validatePassword()
    if (!phoneOk || !passOk) return

    const normalizedPhone = normalizeDigits(phone).replace(/\s|-/g, '')

    setLoading(true)
    try {
      const tokens = await authLogin({ phone: normalizedPhone, password })
      storeTokens(tokens.access, tokens.refresh)
      navigate('/', { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data
        if (err.response.status === 401 || err.response.status === 400) {
          setServerError(data?.detail ?? data?.message ?? 'شماره موبایل یا رمز عبور اشتباه است')
        } else {
          setServerError('خطا در ورود. لطفاً دوباره تلاش کنید.')
        }
      } else {
        setServerError('خطا در ارتباط با سرور')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'linear-gradient(160deg, var(--blue-600), var(--blue-800))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Logo block */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'rgba(255,255,255,.14)',
              color: '#fff',
            }}
          >
            <BuildingIcon />
          </span>
          <div style={{ textAlign: 'center' }}>
            <strong style={{ display: 'block', fontSize: 20, fontWeight: 700, color: '#fff' }}>
              املاک ایران زمین
            </strong>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', letterSpacing: '.06em' }}>
              DealEstate
            </span>
          </div>
        </div>

        {/* Login card */}
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            background: 'var(--surface-card)',
            borderRadius: 20,
            boxShadow: 'var(--shadow-xl)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <strong style={{ fontSize: 18, fontWeight: 700 }}>ورود به حساب</strong>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              برای ورود شماره و رمز عبور خود را وارد کنید.
            </span>
          </div>

          <Input
            label="شماره موبایل"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setPhoneError('') }}
            error={phoneError}
            fullWidth
            aria-label="شماره موبایل"
          />

          <Input
            label="رمز عبور"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPasswordError('') }}
            error={passwordError}
            fullWidth
            aria-label="رمز عبور"
          />

          {serverError && (
            <p
              role="alert"
              style={{ margin: 0, fontSize: 13, color: 'var(--color-danger)', textAlign: 'center' }}
            >
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={<LoginArrowIcon />}
            style={{ height: 50, fontSize: 16, marginTop: 4, width: '100%' }}
          >
            ورود
          </Button>
        </form>

        {/* Footer */}
        <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
          نسخه ۲٫۴ · پشتیبانی ۰۲۱-۸۸۸۸۸۸۸۸
        </p>
      </div>
    </div>
  )
}
