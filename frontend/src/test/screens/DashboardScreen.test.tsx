import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import DashboardScreen from '../../screens/DashboardScreen'
import type { DashboardStats, UserProfile } from '../../api/types'

vi.mock('../../api/dashboard', () => ({
  getDashboardStats: vi.fn(),
  getProfile: vi.fn(),
}))

import { getDashboardStats, getProfile } from '../../api/dashboard'

const mockGetStats = vi.mocked(getDashboardStats)
const mockGetProfile = vi.mocked(getProfile)

function renderDashboard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <DashboardScreen />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const EMPTY_STATS: DashboardStats = {
  total_properties: 0,
  vacant_properties: 0,
  occupied_properties: 0,
  total_contracts: 0,
  open_requests: 0,
  recent_properties: [],
}

const PROFILE: UserProfile = {
  id: 1,
  mobile: '09121234567',
  first_name: 'رضا',
  last_name: 'محمدی',
  full_name: 'رضا محمدی',
  notifications_enabled: true,
  dark_mode: false,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DashboardScreen', () => {
  it('renders greeting with user first name', async () => {
    mockGetProfile.mockResolvedValue(PROFILE)
    mockGetStats.mockResolvedValue(EMPTY_STATS)
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText(/سلام، رضا/)).toBeInTheDocument()
    })
  })

  it('renders greeting without name while profile loads', () => {
    mockGetProfile.mockReturnValue(new Promise(() => {}))
    mockGetStats.mockResolvedValue(EMPTY_STATS)
    renderDashboard()
    expect(screen.getByText(/سلام/)).toBeInTheDocument()
  })

  it('renders all four stat card labels', async () => {
    mockGetProfile.mockResolvedValue(PROFILE)
    mockGetStats.mockResolvedValue(EMPTY_STATS)
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('فایل‌های فعال')).toBeInTheDocument()
      expect(screen.getByText('قرارداد این ماه')).toBeInTheDocument()
      expect(screen.getByText('درخواست در انتظار')).toBeInTheDocument()
      expect(screen.getByText('نزدیک به پایان')).toBeInTheDocument()
    })
  })

  it('displays stat values as Persian digits', async () => {
    mockGetProfile.mockResolvedValue(PROFILE)
    mockGetStats.mockResolvedValue({
      ...EMPTY_STATS,
      total_properties: 48,
      total_contracts: 7,
      open_requests: 12,
    })
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('۴۸')).toBeInTheDocument()
      expect(screen.getByText('۷')).toBeInTheDocument()
      expect(screen.getByText('۱۲')).toBeInTheDocument()
    })
  })

  it('shows empty state when no recent files', async () => {
    mockGetProfile.mockResolvedValue(PROFILE)
    mockGetStats.mockResolvedValue(EMPTY_STATS)
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('فایلی یافت نشد.')).toBeInTheDocument()
    })
  })

  it('renders recent property rows', async () => {
    mockGetProfile.mockResolvedValue(PROFILE)
    mockGetStats.mockResolvedValue({
      ...EMPTY_STATS,
      recent_properties: [
        {
          id: 1,
          type: 'آپارتمان',
          address: 'خیابان ولیعصر',
          region_name: 'منطقه ۳',
          status: 'خالی',
          created_at: '2026-07-01T10:00:00Z',
        },
        {
          id: 2,
          type: 'زمین',
          address: 'بلوار کشاورز',
          region_name: 'منطقه ۶',
          status: 'پر',
          created_at: '2026-07-02T10:00:00Z',
        },
      ],
    })
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText(/آپارتمان منطقه ۳/)).toBeInTheDocument()
      expect(screen.getByText(/زمین منطقه ۶/)).toBeInTheDocument()
      expect(screen.getByText('خالی')).toBeInTheDocument()
      expect(screen.getByText('پر')).toBeInTheDocument()
    })
  })

  it('shows loading placeholder while stats load', () => {
    mockGetProfile.mockResolvedValue(PROFILE)
    mockGetStats.mockReturnValue(new Promise(() => {}))
    renderDashboard()
    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('renders section headers', async () => {
    mockGetProfile.mockResolvedValue(PROFILE)
    mockGetStats.mockResolvedValue(EMPTY_STATS)
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('قراردادهای نزدیک به پایان')).toBeInTheDocument()
      expect(screen.getByText('آخرین فایل‌ها')).toBeInTheDocument()
    })
  })
})
