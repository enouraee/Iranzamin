import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import FilesScreen from '../../screens/FilesScreen'
import type { PaginatedResponse, PropertyListItem } from '../../api/types'

vi.mock('../../api/properties', () => ({
  getProperties: vi.fn(),
}))

import { getProperties } from '../../api/properties'
const mockGetProperties = vi.mocked(getProperties)

function renderFiles() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <FilesScreen />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const EMPTY_PAGE: PaginatedResponse<PropertyListItem> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
}

function makeItem(overrides: Partial<PropertyListItem> = {}): PropertyListItem {
  return {
    id: 1,
    title: 'آپارتمان منطقه ۳',
    type: 'apartment',
    region: { id: 3, name: 'منطقه ۳' },
    address: 'خیابان ولیعصر',
    plak: null,
    status: 'vacant',
    area: '90.00',
    is_for_sale: true,
    is_for_rent: false,
    is_for_rahn: false,
    total_price: 5000000000,
    monthly_rent: null,
    rahn_amount: null,
    cover_photo: null,
    created_at: '2026-07-01T10:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('FilesScreen', () => {
  it('renders search input', () => {
    mockGetProperties.mockResolvedValue(EMPTY_PAGE)
    renderFiles()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('renders type filter chips', () => {
    mockGetProperties.mockResolvedValue(EMPTY_PAGE)
    renderFiles()
    expect(screen.getByText('آپارتمان')).toBeInTheDocument()
    expect(screen.getByText('کلنگی')).toBeInTheDocument()
    expect(screen.getByText('زمین')).toBeInTheDocument()
  })

  it('renders deal type filter chips', () => {
    mockGetProperties.mockResolvedValue(EMPTY_PAGE)
    renderFiles()
    expect(screen.getByText('فروش')).toBeInTheDocument()
    expect(screen.getByText('اجاره')).toBeInTheDocument()
    expect(screen.getByText('رهن کامل')).toBeInTheDocument()
  })

  it('renders status filter chips', () => {
    mockGetProperties.mockResolvedValue(EMPTY_PAGE)
    renderFiles()
    expect(screen.getByText('خالی')).toBeInTheDocument()
    expect(screen.getByText('پر')).toBeInTheDocument()
  })

  it('shows loading skeleton while fetching', () => {
    mockGetProperties.mockReturnValue(new Promise(() => {}))
    renderFiles()
    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('shows empty state when no results', async () => {
    mockGetProperties.mockResolvedValue(EMPTY_PAGE)
    renderFiles()
    await waitFor(() => {
      expect(screen.getByText('ملکی با این مشخصات یافت نشد.')).toBeInTheDocument()
    })
  })

  it('shows Persian digit count', async () => {
    mockGetProperties.mockResolvedValue({ ...EMPTY_PAGE, count: 7, results: [makeItem()] })
    renderFiles()
    await waitFor(() => {
      expect(screen.getByText(/۷ فایل/)).toBeInTheDocument()
    })
  })

  it('renders property cards for results', async () => {
    mockGetProperties.mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [
        makeItem({ id: 1, title: 'آپارتمان منطقه ۳', status: 'vacant' }),
        makeItem({
          id: 2,
          title: 'زمین منطقه ۶',
          type: 'land',
          status: 'occupied',
          region: { id: 6, name: 'منطقه ۶' },
        }),
      ],
    })
    renderFiles()
    await waitFor(() => {
      expect(screen.getByText('آپارتمان منطقه ۳')).toBeInTheDocument()
      expect(screen.getByText('زمین منطقه ۶')).toBeInTheDocument()
      // خالی/پر appear in filter chips + badges → use getAllByText
      expect(screen.getAllByText('خالی').length).toBeGreaterThan(0)
      expect(screen.getAllByText('پر').length).toBeGreaterThan(0)
    })
  })

  it('formats sale price with Persian digits', async () => {
    mockGetProperties.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [makeItem({ total_price: 5_000_000_000, is_for_sale: true })],
    })
    renderFiles()
    await waitFor(() => {
      // 5 billion Toman → "۵ میلیارد تومان"
      expect(screen.getByText(/۵ میلیارد/)).toBeInTheDocument()
    })
  })

  it('formats rent price with Persian digits', async () => {
    mockGetProperties.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [makeItem({ is_for_sale: false, is_for_rent: true, monthly_rent: 15_000_000, total_price: null })],
    })
    renderFiles()
    await waitFor(() => {
      expect(screen.getByText(/۱۵ میلیون/)).toBeInTheDocument()
    })
  })

  it('calls getProperties with type filter when chip clicked', async () => {
    mockGetProperties.mockResolvedValue(EMPTY_PAGE)
    renderFiles()
    await waitFor(() => screen.getByText('ملکی با این مشخصات یافت نشد.'))

    await act(async () => {
      fireEvent.click(screen.getByText('آپارتمان'))
    })

    await waitFor(() => {
      expect(mockGetProperties).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'apartment' }),
      )
    })
  })

  it('calls getProperties with status filter when chip clicked', async () => {
    mockGetProperties.mockResolvedValue(EMPTY_PAGE)
    renderFiles()
    await waitFor(() => screen.getByText('ملکی با این مشخصات یافت نشد.'))

    await act(async () => {
      fireEvent.click(screen.getByText('خالی'))
    })

    await waitFor(() => {
      expect(mockGetProperties).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'vacant' }),
      )
    })
  })

  it('toggles filter off when clicking active chip', async () => {
    mockGetProperties.mockResolvedValue(EMPTY_PAGE)
    renderFiles()
    await waitFor(() => screen.getByText('ملکی با این مشخصات یافت نشد.'))

    await act(async () => { fireEvent.click(screen.getByText('زمین')) })
    await waitFor(() =>
      expect(mockGetProperties).toHaveBeenCalledWith(expect.objectContaining({ type: 'land' })),
    )

    await act(async () => { fireEvent.click(screen.getByText('زمین')) })
    await waitFor(() =>
      expect(mockGetProperties).toHaveBeenCalledWith(
        expect.objectContaining({ type: undefined }),
      ),
    )
  })

  it('shows error state on fetch failure', async () => {
    mockGetProperties.mockRejectedValue(new Error('network'))
    renderFiles()
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('shows next/prev pagination buttons when multiple pages', async () => {
    mockGetProperties.mockResolvedValue({
      count: 40,
      next: '/api/properties/?page=2',
      previous: null,
      results: Array(20).fill(makeItem()),
    })
    renderFiles()
    await waitFor(() => {
      expect(screen.getByText('بعدی')).toBeInTheDocument()
    })
  })

  it('shows clear button when filter is active', async () => {
    mockGetProperties.mockResolvedValue(EMPTY_PAGE)
    renderFiles()
    await waitFor(() => screen.getByText('ملکی با این مشخصات یافت نشد.'))

    await act(async () => { fireEvent.click(screen.getByText('کلنگی')) })
    await waitFor(() => {
      expect(screen.getByText('پاک کردن فیلترها')).toBeInTheDocument()
    })
  })

  it('clear button removes all filters', async () => {
    mockGetProperties.mockResolvedValue(EMPTY_PAGE)
    renderFiles()
    await waitFor(() => screen.getByText('ملکی با این مشخصات یافت نشد.'))

    await act(async () => { fireEvent.click(screen.getByText('فروش')) })
    await waitFor(() => screen.getByText('پاک کردن فیلترها'))

    await act(async () => { fireEvent.click(screen.getByText('پاک کردن فیلترها')) })
    await waitFor(() =>
      expect(mockGetProperties).toHaveBeenLastCalledWith(
        expect.objectContaining({ deal_type: undefined, type: undefined, status: undefined }),
      ),
    )
  })
})
