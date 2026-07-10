import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LoginScreen from '../../screens/LoginScreen'

// Mock the auth API
vi.mock('../../api/auth', () => ({
  authLogin: vi.fn(),
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

import { authLogin } from '../../api/auth'
const mockAuthLogin = vi.mocked(authLogin)

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginScreen />
    </MemoryRouter>,
  )
}

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders all UI elements', () => {
    renderLogin()
    expect(screen.getByText('ورود به حساب')).toBeInTheDocument()
    expect(screen.getByText('برای ورود شماره و رمز عبور خود را وارد کنید.')).toBeInTheDocument()
    expect(screen.getByLabelText('شماره موبایل')).toBeInTheDocument()
    expect(screen.getByLabelText('رمز عبور')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ورود/ })).toBeInTheDocument()
    expect(screen.getByText('املاک ایران زمین')).toBeInTheDocument()
  })

  it('shows error when phone field is empty', async () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: /ورود/ }))
    await waitFor(() => {
      expect(screen.getByText('شماره موبایل را وارد کنید')).toBeInTheDocument()
    })
  })

  it('shows error when password field is empty but phone is valid', async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText('شماره موبایل'), { target: { value: '09121234567' } })
    fireEvent.click(screen.getByRole('button', { name: /ورود/ }))
    await waitFor(() => {
      expect(screen.getByText('رمز عبور را وارد کنید')).toBeInTheDocument()
    })
  })

  it('shows invalid phone error for wrong format', async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText('شماره موبایل'), { target: { value: '12345' } })
    fireEvent.change(screen.getByLabelText('رمز عبور'), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /ورود/ }))
    await waitFor(() => {
      expect(screen.getByText('شماره موبایل معتبر نیست')).toBeInTheDocument()
    })
  })

  it('accepts Persian digits in phone number', async () => {
    mockAuthLogin.mockResolvedValueOnce({ access: 'tok', refresh: 'ref' })
    renderLogin()
    fireEvent.change(screen.getByLabelText('شماره موبایل'), { target: { value: '۰۹۱۲۳۴۵۶۷۸۹' } })
    fireEvent.change(screen.getByLabelText('رمز عبور'), { target: { value: 'pass' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ورود/ }))
    })
    await waitFor(() => {
      expect(mockAuthLogin).toHaveBeenCalledWith({ phone: '09123456789', password: 'pass' })
    })
  })

  it('accepts phone with spaces (e.g. 0912 345 6789)', async () => {
    mockAuthLogin.mockResolvedValueOnce({ access: 'tok', refresh: 'ref' })
    renderLogin()
    fireEvent.change(screen.getByLabelText('شماره موبایل'), { target: { value: '0912 345 6789' } })
    fireEvent.change(screen.getByLabelText('رمز عبور'), { target: { value: 'pass' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ورود/ }))
    })
    await waitFor(() => {
      expect(mockAuthLogin).toHaveBeenCalledWith({ phone: '09123456789', password: 'pass' })
    })
  })

  it('shows server error on wrong credentials (401)', async () => {
    const axiosError = Object.assign(new Error('Unauthorized'), {
      isAxiosError: true,
      response: { status: 401, data: { detail: 'اطلاعات ورود اشتباه است' } },
    })
    mockAuthLogin.mockRejectedValueOnce(axiosError)

    renderLogin()
    fireEvent.change(screen.getByLabelText('شماره موبایل'), { target: { value: '09121234567' } })
    fireEvent.change(screen.getByLabelText('رمز عبور'), { target: { value: 'wrongpass' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ورود/ }))
    })
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('اطلاعات ورود اشتباه است')).toBeInTheDocument()
    })
  })

  it('shows fallback error message when server returns 401 without detail', async () => {
    const axiosError = Object.assign(new Error('Unauthorized'), {
      isAxiosError: true,
      response: { status: 401, data: {} },
    })
    mockAuthLogin.mockRejectedValueOnce(axiosError)

    renderLogin()
    fireEvent.change(screen.getByLabelText('شماره موبایل'), { target: { value: '09121234567' } })
    fireEvent.change(screen.getByLabelText('رمز عبور'), { target: { value: 'pass' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ورود/ }))
    })
    await waitFor(() => {
      expect(screen.getByText('شماره موبایل یا رمز عبور اشتباه است')).toBeInTheDocument()
    })
  })

  it('shows network error message on connection failure', async () => {
    mockAuthLogin.mockRejectedValueOnce(new Error('Network Error'))

    renderLogin()
    fireEvent.change(screen.getByLabelText('شماره موبایل'), { target: { value: '09121234567' } })
    fireEvent.change(screen.getByLabelText('رمز عبور'), { target: { value: 'pass' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ورود/ }))
    })
    await waitFor(() => {
      expect(screen.getByText('خطا در ارتباط با سرور')).toBeInTheDocument()
    })
  })

  it('stores tokens and navigates to dashboard on success', async () => {
    mockAuthLogin.mockResolvedValueOnce({ access: 'access-tok', refresh: 'refresh-tok' })

    renderLogin()
    fireEvent.change(screen.getByLabelText('شماره موبایل'), { target: { value: '09121234567' } })
    fireEvent.change(screen.getByLabelText('رمز عبور'), { target: { value: 'correctpass' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ورود/ }))
    })
    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('access-tok')
      expect(localStorage.getItem('refresh_token')).toBe('refresh-tok')
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  it('rejects phone not starting with 09', async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText('شماره موبایل'), { target: { value: '08123456789' } })
    fireEvent.change(screen.getByLabelText('رمز عبور'), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /ورود/ }))
    await waitFor(() => {
      expect(screen.getByText('شماره موبایل معتبر نیست')).toBeInTheDocument()
    })
  })

  it('clears phone error when user edits the field', async () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: /ورود/ }))
    await waitFor(() => expect(screen.getByText('شماره موبایل را وارد کنید')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('شماره موبایل'), { target: { value: '0' } })
    await waitFor(() => {
      expect(screen.queryByText('شماره موبایل را وارد کنید')).not.toBeInTheDocument()
    })
  })
})
