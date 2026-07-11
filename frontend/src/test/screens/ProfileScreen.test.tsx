import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import ProfileScreen from '../../screens/ProfileScreen'
import type { UserProfile } from '../../api/types'

vi.mock('../../api/me', () => ({
  getMe: vi.fn(),
  patchMe: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

import { getMe, patchMe } from '../../api/me'
const mockGetMe = vi.mocked(getMe)
const mockPatchMe = vi.mocked(patchMe)

const PROFILE: UserProfile = {
  id: 1,
  mobile: '09121112233',
  first_name: 'رضا',
  last_name: 'کریمی',
  full_name: 'رضا کریمی',
  notifications_enabled: true,
  dark_mode: false,
}

function renderProfile() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ProfileScreen />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('ProfileScreen', () => {
  it('shows loading state initially', () => {
    mockGetMe.mockResolvedValue(PROFILE)
    renderProfile()
    expect(screen.getByText('در حال بارگذاری...')).toBeInTheDocument()
  })

  it('renders profile data after load', async () => {
    mockGetMe.mockResolvedValue(PROFILE)
    renderProfile()
    await waitFor(() => {
      expect(screen.getByText('رضا کریمی')).toBeInTheDocument()
    })
    expect(screen.getByText('مشاور املاک · املاک ایران زمین')).toBeInTheDocument()
    expect(screen.getByText('اطلاعات حساب')).toBeInTheDocument()
  })

  it('shows Persian initials in avatar', async () => {
    mockGetMe.mockResolvedValue(PROFILE)
    renderProfile()
    await waitFor(() => {
      expect(screen.getByText('ر.ک')).toBeInTheDocument()
    })
  })

  it('shows Persian phone digits', async () => {
    mockGetMe.mockResolvedValue(PROFILE)
    renderProfile()
    await waitFor(() => {
      expect(screen.getByDisplayValue('۰۹۱۲۱۱۱۲۲۳۳')).toBeInTheDocument()
    })
  })

  it('phone input is disabled', async () => {
    mockGetMe.mockResolvedValue(PROFILE)
    renderProfile()
    await waitFor(() => {
      const phoneInput = screen.getByDisplayValue('۰۹۱۲۱۱۱۲۲۳۳')
      expect(phoneInput).toBeDisabled()
    })
  })

  it('save button disabled when name unchanged', async () => {
    mockGetMe.mockResolvedValue(PROFILE)
    renderProfile()
    await waitFor(() => {
      const saveBtn = screen.getByRole('button', { name: /ذخیره تغییرات/ })
      expect(saveBtn).toBeDisabled()
    })
  })

  it('save button enabled after name change', async () => {
    mockGetMe.mockResolvedValue(PROFILE)
    mockPatchMe.mockResolvedValue(PROFILE)
    renderProfile()
    await waitFor(() => screen.getByDisplayValue('رضا کریمی'))

    const nameInput = screen.getByDisplayValue('رضا کریمی')
    fireEvent.change(nameInput, { target: { value: 'علی احمدی' } })

    const saveBtn = screen.getByRole('button', { name: /ذخیره تغییرات/ })
    expect(saveBtn).not.toBeDisabled()
  })

  it('calls patchMe with split first/last name on save', async () => {
    mockGetMe.mockResolvedValue(PROFILE)
    mockPatchMe.mockResolvedValue({ ...PROFILE, first_name: 'علی', last_name: 'احمدی', full_name: 'علی احمدی' })
    renderProfile()
    await waitFor(() => screen.getByDisplayValue('رضا کریمی'))

    const nameInput = screen.getByDisplayValue('رضا کریمی')
    fireEvent.change(nameInput, { target: { value: 'علی احمدی' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /ذخیره تغییرات/ }))
    })

    expect(mockPatchMe).toHaveBeenCalledWith(
      expect.objectContaining({ first_name: 'علی', last_name: 'احمدی' }),
      expect.anything(),
    )
  })

  it('notifications toggle calls patchMe with new value', async () => {
    mockGetMe.mockResolvedValue(PROFILE)
    mockPatchMe.mockResolvedValue({ ...PROFILE, notifications_enabled: false })
    renderProfile()
    await waitFor(() => screen.getByText('اعلان‌ها'))

    const switches = screen.getAllByRole('switch')
    // first switch = notifications
    await act(async () => {
      fireEvent.click(switches[0])
    })

    expect(mockPatchMe).toHaveBeenCalledWith(
      expect.objectContaining({ notifications_enabled: false }),
      expect.anything(),
    )
  })

  it('dark mode toggle calls patchMe with new value', async () => {
    mockGetMe.mockResolvedValue(PROFILE)
    mockPatchMe.mockResolvedValue({ ...PROFILE, dark_mode: true })
    renderProfile()
    await waitFor(() => screen.getByText('حالت تاریک'))

    const switches = screen.getAllByRole('switch')
    // second switch = dark mode
    await act(async () => {
      fireEvent.click(switches[1])
    })

    expect(mockPatchMe).toHaveBeenCalledWith(
      expect.objectContaining({ dark_mode: true }),
      expect.anything(),
    )
  })

  it('shows static language row', async () => {
    mockGetMe.mockResolvedValue(PROFILE)
    renderProfile()
    await waitFor(() => {
      expect(screen.getByText('زبان')).toBeInTheDocument()
      expect(screen.getByText('فارسی')).toBeInTheDocument()
    })
  })

  it('logout clears tokens and navigates to login', async () => {
    localStorage.setItem('access_token', 'tok')
    localStorage.setItem('refresh_token', 'ref')
    mockGetMe.mockResolvedValue(PROFILE)
    renderProfile()
    await waitFor(() => screen.getByText('خروج از حساب'))

    await act(async () => {
      fireEvent.click(screen.getByText('خروج از حساب'))
    })

    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
  })

  it('reverts optimistic toggle on error', async () => {
    mockGetMe.mockResolvedValue(PROFILE)
    mockPatchMe.mockRejectedValue(new Error('server error'))
    renderProfile()
    await waitFor(() => screen.getByText('اعلان‌ها'))

    const switches = screen.getAllByRole('switch')
    await act(async () => {
      fireEvent.click(switches[0])
    })

    await waitFor(() => {
      // After error, switch should revert to original value (true = checked)
      expect(switches[0]).toHaveAttribute('aria-checked', 'true')
    })
  })

  it('shows version footer', async () => {
    mockGetMe.mockResolvedValue(PROFILE)
    renderProfile()
    await waitFor(() => {
      expect(screen.getByText(/نسخه/)).toBeInTheDocument()
    })
  })
})
