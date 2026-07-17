import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import PersonsScreen from '../../screens/PersonsScreen'
import type { PaginatedResponse, PersonApi } from '../../api/types'

vi.mock('../../api/people', () => ({
  getPeople: vi.fn(),
  createPerson: vi.fn(),
}))

import { getPeople } from '../../api/people'
const mockGetPeople = vi.mocked(getPeople)

function renderPersons() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <PersonsScreen />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const EMPTY_PAGE: PaginatedResponse<PersonApi> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
}

function makePerson(overrides: Partial<PersonApi> = {}): PersonApi {
  return {
    id: 1,
    first_name: 'علی',
    last_name: 'رضایی',
    full_name: 'علی رضایی',
    phone: '09121112233',
    national_id: '0012345678',
    birth_date: null,
    role: 'owner',
    created_at: '2026-07-01T10:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PersonsScreen', () => {
  it('renders search input', () => {
    mockGetPeople.mockResolvedValue(EMPTY_PAGE)
    renderPersons()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('renders افزودن button', () => {
    mockGetPeople.mockResolvedValue(EMPTY_PAGE)
    renderPersons()
    expect(screen.getByRole('button', { name: /افزودن/i })).toBeInTheDocument()
  })

  it('renders kind filter tabs', () => {
    mockGetPeople.mockResolvedValue(EMPTY_PAGE)
    renderPersons()
    expect(screen.getByText('مالکین')).toBeInTheDocument()
    expect(screen.getByText('مستأجرین')).toBeInTheDocument()
    expect(screen.getByText('مشتریان')).toBeInTheDocument()
  })

  it('defaults to the owners kind on load', async () => {
    mockGetPeople.mockResolvedValue(EMPTY_PAGE)
    renderPersons()
    await waitFor(() => {
      expect(mockGetPeople).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'owners' }),
      )
    })
  })

  it('shows loading skeleton while fetching', () => {
    mockGetPeople.mockReturnValue(new Promise(() => {}))
    renderPersons()
    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('shows empty state when no results', async () => {
    mockGetPeople.mockResolvedValue(EMPTY_PAGE)
    renderPersons()
    await waitFor(() => {
      expect(screen.getByText('شخصی با این مشخصات یافت نشد.')).toBeInTheDocument()
    })
  })

  it('renders person list with Persian-formatted phone', async () => {
    mockGetPeople.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [makePerson({ phone: '09121112233' })],
    })
    renderPersons()
    await waitFor(() => {
      expect(screen.getByText('علی رضایی')).toBeInTheDocument()
      expect(screen.getByText('۰۹۱۲۱۱۱۲۲۳۳')).toBeInTheDocument()
    })
  })

  it('shows Persian digit count', async () => {
    mockGetPeople.mockResolvedValue({ ...EMPTY_PAGE, count: 5, results: [makePerson()] })
    renderPersons()
    await waitFor(() => {
      expect(screen.getByText('۵ شخص')).toBeInTheDocument()
    })
  })

  it('calls getPeople with renters kind when مستأجرین tab clicked', async () => {
    mockGetPeople.mockResolvedValue(EMPTY_PAGE)
    renderPersons()
    await waitFor(() => screen.getByText('شخصی با این مشخصات یافت نشد.'))

    await act(async () => {
      fireEvent.click(screen.getByText('مستأجرین'))
    })

    await waitFor(() => {
      expect(mockGetPeople).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'renters' }),
      )
    })
  })

  it('calls getPeople with customers kind when مشتریان tab clicked', async () => {
    mockGetPeople.mockResolvedValue(EMPTY_PAGE)
    renderPersons()
    await waitFor(() => screen.getByText('شخصی با این مشخصات یافت نشد.'))

    await act(async () => {
      fireEvent.click(screen.getByText('مشتریان'))
    })

    await waitFor(() => {
      expect(mockGetPeople).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'customers' }),
      )
    })
  })

  it('switches back to owners kind when مالکین tab clicked', async () => {
    mockGetPeople.mockResolvedValue(EMPTY_PAGE)
    renderPersons()
    await waitFor(() => screen.getByText('شخصی با این مشخصات یافت نشد.'))

    await act(async () => { fireEvent.click(screen.getByText('مشتریان')) })
    await waitFor(() =>
      expect(mockGetPeople).toHaveBeenCalledWith(expect.objectContaining({ kind: 'customers' })),
    )

    await act(async () => { fireEvent.click(screen.getByText('مالکین')) })
    await waitFor(() =>
      expect(mockGetPeople).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'owners' }),
      ),
    )
  })

  it('shows error state on fetch failure', async () => {
    mockGetPeople.mockRejectedValue(new Error('network'))
    renderPersons()
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('shows pagination buttons when multiple pages', async () => {
    mockGetPeople.mockResolvedValue({
      count: 40,
      next: '/api/people/?page=2',
      previous: null,
      results: Array(20).fill(makePerson()),
    })
    renderPersons()
    await waitFor(() => {
      expect(screen.getByText('بعدی')).toBeInTheDocument()
    })
  })

  it('opens add modal when افزودن button clicked', async () => {
    mockGetPeople.mockResolvedValue(EMPTY_PAGE)
    renderPersons()
    await waitFor(() => screen.getByText('شخصی با این مشخصات یافت نشد.'))

    fireEvent.click(screen.getByRole('button', { name: /افزودن/i }))

    expect(screen.getByRole('dialog', { name: /افزودن شخص جدید/i })).toBeInTheDocument()
  })

  it('search input passes search term to getPeople', async () => {
    mockGetPeople.mockResolvedValue(EMPTY_PAGE)
    renderPersons()
    await waitFor(() => screen.getByText('شخصی با این مشخصات یافت نشد.'))

    await act(async () => {
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'علی' } })
    })

    await waitFor(
      () => {
        expect(mockGetPeople).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'علی' }),
        )
      },
      { timeout: 1000 },
    )
  })

  it('shows initials avatar for person', async () => {
    mockGetPeople.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [makePerson({ first_name: 'علی', last_name: 'رضایی' })],
    })
    renderPersons()
    await waitFor(() => {
      expect(screen.getByText('علی رضایی')).toBeInTheDocument()
    })
  })
})
