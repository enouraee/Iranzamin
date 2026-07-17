import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PersonDetailScreen from '../../screens/PersonDetailScreen'
import type { PersonDetailApi } from '../../api/types'
import { ToastProvider } from '../../components/common/Toast'

vi.mock('../../api/people', () => ({
  getPerson: vi.fn(),
  updatePerson: vi.fn(),
  getPersonHistory: vi.fn(),
}))

import { getPerson, getPersonHistory } from '../../api/people'
const mockGetPerson = vi.mocked(getPerson)
const mockGetPersonHistory = vi.mocked(getPersonHistory)

function renderDetail(id = '1') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/persons/${id}`]}>
          <Routes>
            <Route path="/persons/:id" element={<PersonDetailScreen />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

function makePerson(overrides: Partial<PersonDetailApi> = {}): PersonDetailApi {
  return {
    id: 1,
    first_name: 'علی',
    last_name: 'رضایی',
    full_name: 'علی رضایی',
    phone: '09121112233',
    national_id: '0012345678',
    birth_date: '1985-03-20',
    role: 'owner',
    created_at: '2026-07-01T10:00:00Z',
    owned_properties: [],
    rented_properties: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PersonDetailScreen', () => {
  it('renders person name and role', async () => {
    mockGetPerson.mockResolvedValue(makePerson())
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('علی رضایی')).toBeInTheDocument()
      expect(screen.getByText('مالک')).toBeInTheDocument()
    })
  })

  it('renders info rows with formatted phone', async () => {
    mockGetPerson.mockResolvedValue(makePerson({ phone: '09121112233' }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('۰۹۱۲۱۱۱۲۲۳۳')).toBeInTheDocument()
    })
  })

  it('renders Jalali birth date', async () => {
    mockGetPerson.mockResolvedValue(makePerson({ birth_date: '1985-07-10' }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText(/۱۳۶۴/)).toBeInTheDocument()
    })
  })

  it('shows — when birth_date is null', async () => {
    mockGetPerson.mockResolvedValue(makePerson({ birth_date: null }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('تاریخ تولد')).toBeInTheDocument()
    })
  })

  it('renders national_id', async () => {
    mockGetPerson.mockResolvedValue(makePerson({ national_id: '0012345678' }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('0012345678')).toBeInTheDocument()
    })
  })

  it('shows — for missing national_id', async () => {
    mockGetPerson.mockResolvedValue(makePerson({ national_id: null }))
    renderDetail()
    await waitFor(() => {
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThan(0)
    })
  })

  it('shows linked owned properties', async () => {
    mockGetPerson.mockResolvedValue(
      makePerson({
        owned_properties: [{ id: 10, address: 'خیابان ولیعصر', type: 'apartment', status: 'vacant' }],
        rented_properties: [],
      }),
    )
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText(/آپارتمان/)).toBeInTheDocument()
      expect(screen.getByText((_, el) => el?.textContent === 'املاک مرتبط (۱)')).toBeInTheDocument()
    })
  })

  it('shows linked rented properties', async () => {
    mockGetPerson.mockResolvedValue(
      makePerson({
        owned_properties: [],
        rented_properties: [{ id: 20, address: 'بلوار اصلی', type: 'land', status: 'occupied' }],
      }),
    )
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText(/زمین/)).toBeInTheDocument()
      expect(screen.getByText('پر')).toBeInTheDocument()
    })
  })

  it('does not show linked properties section when empty', async () => {
    mockGetPerson.mockResolvedValue(makePerson({ owned_properties: [], rented_properties: [] }))
    renderDetail()
    await waitFor(() => {
      expect(screen.queryByText(/املاک مرتبط/)).not.toBeInTheDocument()
    })
  })

  it('shows empty history state when toggle clicked', async () => {
    mockGetPerson.mockResolvedValue(makePerson())
    mockGetPersonHistory.mockResolvedValue([])
    renderDetail()
    await waitFor(() => screen.getByText('تاریخچه تغییرات'))

    fireEvent.click(screen.getByText('تاریخچه تغییرات'))

    await waitFor(() => {
      expect(screen.getByText('تاریخچه‌ای ثبت نشده.')).toBeInTheDocument()
    })
  })

  it('renders history entries when present', async () => {
    mockGetPerson.mockResolvedValue(makePerson())
    mockGetPersonHistory.mockResolvedValue([
      {
        id: 1,
        field: 'first_name',
        field_label: 'نام',
        old_value: 'قبل',
        new_value: 'بعد',
        changed_by: 'مدیر سیستم',
        created_at: '2024-05-01T10:00:00Z',
      },
    ])
    renderDetail()
    await waitFor(() => screen.getByText('تاریخچه تغییرات'))

    fireEvent.click(screen.getByText('تاریخچه تغییرات'))

    await waitFor(() => {
      expect(screen.getByText(/نام: قبل ← بعد/)).toBeInTheDocument()
      expect(screen.getByText(/مدیر سیستم/)).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    mockGetPerson.mockRejectedValue(new Error('network'))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('opens edit sheet when edit button clicked', async () => {
    mockGetPerson.mockResolvedValue(makePerson())
    renderDetail()
    await waitFor(() => screen.getByText('علی رضایی'))

    fireEvent.click(screen.getByRole('button', { name: /ویرایش/i }))

    expect(screen.getByRole('dialog', { name: /ویرایش اطلاعات شخص/i })).toBeInTheDocument()
  })

  it('shows customer role badge for customer', async () => {
    mockGetPerson.mockResolvedValue(makePerson({ role: 'customer', full_name: 'سارا احمدی' }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('مشتری')).toBeInTheDocument()
    })
  })

  it('shows initials avatar', async () => {
    mockGetPerson.mockResolvedValue(makePerson({ first_name: 'علی', last_name: 'رضایی' }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('علی رضایی')).toBeInTheDocument()
    })
  })
})
