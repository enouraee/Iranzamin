import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../../components/common/Toast'
import RequestsScreen from '../../screens/RequestsScreen'
import RequestWizardScreen from '../../screens/RequestWizardScreen'
import type { PaginatedResponse } from '../../api/types'
import type { RequestApi } from '../../api/requests'

// ---- Mocks ----
vi.mock('../../api/requests', () => ({
  getRequests: vi.fn(),
  createRequest: vi.fn(),
  getRequestMatches: vi.fn(),
  markRequestDone: vi.fn(),
  REQUEST_TYPE_LABEL: { rent: 'اجاره', rahn: 'رهن کامل', sale: 'فروش' },
}))

vi.mock('../../api/people', () => ({
  getPeople: vi.fn(),
  createPerson: vi.fn(),
}))

vi.mock('../../api/regions', () => ({
  getRegions: vi.fn(),
  createRegion: vi.fn(),
}))

import { getRequests, createRequest, getRequestMatches } from '../../api/requests'
import { getPeople } from '../../api/people'
import { getRegions } from '../../api/regions'

const mockGetRequests = vi.mocked(getRequests)
const mockCreateRequest = vi.mocked(createRequest)
const mockGetMatches = vi.mocked(getRequestMatches)
const mockGetPeople = vi.mocked(getPeople)
const mockGetRegions = vi.mocked(getRegions)

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderRequests() {
  const qc = makeQC()
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter>
          <RequestsScreen />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

function renderWizard() {
  const qc = makeQC()
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter>
          <RequestWizardScreen />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const EMPTY_PAGE: PaginatedResponse<RequestApi> = { count: 0, next: null, previous: null, results: [] }

function makeRequest(overrides: Partial<RequestApi> = {}): RequestApi {
  return {
    id: 1,
    customer: { id: 10, full_name: 'علی رضایی', phone: '09121112233' },
    region: null,
    matched_property: null,
    request_type: 'rent',
    status: 'open',
    target_property_type: null,
    units_count: null,
    persons_count: 2,
    beds: 2,
    needs: null,
    preferred_floor: null,
    min_area: '60',
    max_area: '120',
    min_build_year: null,
    max_build_year: null,
    wants_parking: true,
    wants_elevator: false,
    wants_storage: false,
    max_deposit: 500_000_000,
    max_rent: 20_000_000,
    budget: null,
    deadline: '2026-12-01',
    notes: null,
    created_at: '2026-07-11T10:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetPeople.mockResolvedValue(EMPTY_PAGE as never)
  mockGetRegions.mockResolvedValue(EMPTY_PAGE as never)
  mockGetMatches.mockResolvedValue(EMPTY_PAGE as never)
})

// ---- RequestsScreen ----
describe('RequestsScreen', () => {
  it('renders search input', () => {
    mockGetRequests.mockResolvedValue(EMPTY_PAGE)
    renderRequests()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('renders ثبت درخواست button', () => {
    mockGetRequests.mockResolvedValue(EMPTY_PAGE)
    renderRequests()
    expect(screen.getByText('ثبت درخواست')).toBeInTheDocument()
  })

  it('shows empty state when no requests', async () => {
    mockGetRequests.mockResolvedValue(EMPTY_PAGE)
    renderRequests()
    await waitFor(() => {
      expect(screen.getByText(/درخواستی با این مشخصات یافت نشد/)).toBeInTheDocument()
    })
  })

  it('renders request cards with customer name', async () => {
    mockGetRequests.mockResolvedValue({ count: 1, next: null, previous: null, results: [makeRequest()] })
    renderRequests()
    await waitFor(() => {
      expect(screen.getByText('علی رضایی')).toBeInTheDocument()
      // multiple اجاره elements (filter chip + pill) — just assert card is present
      expect(screen.getAllByText('اجاره').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows رهن type pill correctly', async () => {
    mockGetRequests.mockResolvedValue({ count: 1, next: null, previous: null, results: [makeRequest({ request_type: 'rahn' })] })
    renderRequests()
    await waitFor(() => {
      expect(screen.getByText('رهن کامل')).toBeInTheDocument()
    })
  })

  it('shows فروش type pill correctly', async () => {
    mockGetRequests.mockResolvedValue({ count: 1, next: null, previous: null, results: [makeRequest({ request_type: 'sale' })] })
    renderRequests()
    await waitFor(() => {
      expect(screen.getByText('فروش')).toBeInTheDocument()
    })
  })

  it('filters client-side by customer name', async () => {
    mockGetRequests.mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [
        makeRequest({ id: 1, customer: { id: 1, full_name: 'علی رضایی', phone: '0911' } }),
        makeRequest({ id: 2, customer: { id: 2, full_name: 'مریم احمدی', phone: '0912' } }),
      ],
    })
    renderRequests()
    await waitFor(() => expect(screen.getByText('علی رضایی')).toBeInTheDocument())

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'مریم' } })
    await waitFor(() => {
      expect(screen.getByText('مریم احمدی')).toBeInTheDocument()
      expect(screen.queryByText('علی رضایی')).not.toBeInTheDocument()
    })
  })
})

// ---- RequestWizardScreen ----
describe('RequestWizardScreen', () => {
  it('renders step 1 (customer) initially', () => {
    renderWizard()
    expect(screen.getByText('مشتری')).toBeInTheDocument()
    expect(screen.getByText('یا افزودن سریع')).toBeInTheDocument()
  })

  it('shows step progress indicators', () => {
    renderWizard()
    expect(screen.getByText('نوع درخواست')).toBeInTheDocument()
    expect(screen.getByText('مشخصات')).toBeInTheDocument()
    expect(screen.getByText('تأیید')).toBeInTheDocument()
  })

  it('validates step 1 — requires customer info', async () => {
    renderWizard()
    fireEvent.click(screen.getByText('ادامه'))
    await waitFor(() => {
      expect(screen.getByText(/مشتری را انتخاب یا اطلاعات افزودن سریع را وارد کنید/)).toBeInTheDocument()
    })
  })

  it('validates step 1 — quick-add requires name + phone', async () => {
    renderWizard()
    fireEvent.change(screen.getByPlaceholderText('نام'), { target: { value: 'علی' } })
    // no last name or phone entered
    fireEvent.click(screen.getByText('ادامه'))
    await waitFor(() => {
      expect(screen.getByText(/نام خانوادگی الزامی است/)).toBeInTheDocument()
      expect(screen.getByText(/شماره تلفن الزامی است/)).toBeInTheDocument()
    })
  })

  it('advances to step 2 when quick-add has name + last name + phone', async () => {
    renderWizard()
    fireEvent.change(screen.getByPlaceholderText('نام'), { target: { value: 'علی' } })
    fireEvent.change(screen.getByPlaceholderText('نام خانوادگی'), { target: { value: 'رضایی' } })
    fireEvent.change(screen.getByPlaceholderText('۰۹۱۲ ۰۰۰ ۰۰۰۰'), { target: { value: '09121112233' } })
    fireEvent.click(screen.getByText('ادامه'))
    await waitFor(() => {
      expect(screen.getByText('نوع درخواست را انتخاب کنید')).toBeInTheDocument()
    })
  })

  it('step 2 shows 3 type options', async () => {
    renderWizard()
    // advance to step 2
    fireEvent.change(screen.getByPlaceholderText('نام'), { target: { value: 'علی' } })
    fireEvent.change(screen.getByPlaceholderText('نام خانوادگی'), { target: { value: 'رضایی' } })
    fireEvent.change(screen.getByPlaceholderText('۰۹۱۲ ۰۰۰ ۰۰۰۰'), { target: { value: '09121112233' } })
    fireEvent.click(screen.getByText('ادامه'))
    await waitFor(() => expect(screen.getByText('اجاره')).toBeInTheDocument())
    expect(screen.getByText('رهن کامل')).toBeInTheDocument()
    expect(screen.getByText('خرید')).toBeInTheDocument()
  })

  it('step 3 rent branch shows money fields', async () => {
    renderWizard()
    fireEvent.change(screen.getByPlaceholderText('نام'), { target: { value: 'علی' } })
    fireEvent.change(screen.getByPlaceholderText('نام خانوادگی'), { target: { value: 'رضایی' } })
    fireEvent.change(screen.getByPlaceholderText('۰۹۱۲ ۰۰۰ ۰۰۰۰'), { target: { value: '09121112233' } })
    fireEvent.click(screen.getByText('ادامه'))
    await waitFor(() => expect(screen.getByText('نوع درخواست را انتخاب کنید')).toBeInTheDocument())
    fireEvent.click(screen.getByText('اجاره'))
    const allContinueButtons = screen.getAllByText('ادامه')
    fireEvent.click(allContinueButtons[allContinueButtons.length - 1])
    await waitFor(() => {
      expect(screen.getByText(/حداکثر پول پیش/)).toBeInTheDocument()
      expect(screen.getByText(/حداکثر اجاره ماهیانه/)).toBeInTheDocument()
    })
  })

  it('step 3 rahn branch shows max deposit but no rent field', async () => {
    renderWizard()
    fireEvent.change(screen.getByPlaceholderText('نام'), { target: { value: 'علی' } })
    fireEvent.change(screen.getByPlaceholderText('نام خانوادگی'), { target: { value: 'رضایی' } })
    fireEvent.change(screen.getByPlaceholderText('۰۹۱۲ ۰۰۰ ۰۰۰۰'), { target: { value: '09121112233' } })
    fireEvent.click(screen.getByText('ادامه'))
    await waitFor(() => expect(screen.getByText('رهن کامل')).toBeInTheDocument())
    fireEvent.click(screen.getByText('رهن کامل'))
    const allContinueButtons = screen.getAllByText('ادامه')
    fireEvent.click(allContinueButtons[allContinueButtons.length - 1])
    await waitFor(() => {
      expect(screen.getByText(/حداکثر مبلغ رهن/)).toBeInTheDocument()
      expect(screen.queryByText(/حداکثر اجاره ماهیانه/)).not.toBeInTheDocument()
    })
  })

  it('step 3 sale branch shows budget and property type chips', async () => {
    renderWizard()
    fireEvent.change(screen.getByPlaceholderText('نام'), { target: { value: 'علی' } })
    fireEvent.change(screen.getByPlaceholderText('نام خانوادگی'), { target: { value: 'رضایی' } })
    fireEvent.change(screen.getByPlaceholderText('۰۹۱۲ ۰۰۰ ۰۰۰۰'), { target: { value: '09121112233' } })
    fireEvent.click(screen.getByText('ادامه'))
    await waitFor(() => expect(screen.getByText('خرید')).toBeInTheDocument())
    fireEvent.click(screen.getByText('خرید'))
    const allContinueButtons = screen.getAllByText('ادامه')
    fireEvent.click(allContinueButtons[allContinueButtons.length - 1])
    await waitFor(() => {
      expect(screen.getByText(/بودجه خریدار/)).toBeInTheDocument()
      expect(screen.getByText('آپارتمان')).toBeInTheDocument()
    })
  })

  it('step 3 validates area min > max', async () => {
    renderWizard()
    fireEvent.change(screen.getByPlaceholderText('نام'), { target: { value: 'علی' } })
    fireEvent.change(screen.getByPlaceholderText('نام خانوادگی'), { target: { value: 'رضایی' } })
    fireEvent.change(screen.getByPlaceholderText('۰۹۱۲ ۰۰۰ ۰۰۰۰'), { target: { value: '09121112233' } })
    fireEvent.click(screen.getByText('ادامه'))
    await waitFor(() => expect(screen.getByText('اجاره')).toBeInTheDocument())
    fireEvent.click(screen.getByText('اجاره'))
    const cont1 = screen.getAllByText('ادامه')
    fireEvent.click(cont1[cont1.length - 1])
    await waitFor(() => expect(screen.getByText(/حداقل متراژ/)).toBeInTheDocument())
    fireEvent.change(screen.getByPlaceholderText('۵۰'), { target: { value: '150' } })
    fireEvent.change(screen.getByPlaceholderText('۱۵۰'), { target: { value: '50' } })
    const cont2 = screen.getAllByText('ادامه')
    fireEvent.click(cont2[cont2.length - 1])
    await waitFor(() => {
      expect(screen.getByText(/حداقل متراژ باید کمتر از حداکثر باشد/)).toBeInTheDocument()
    })
  })

  it('submits and shows matches in step 4', async () => {
    mockCreateRequest.mockResolvedValue({
      id: 99,
      request_type: 'rent',
      status: 'open',
      customer: { id: 10, full_name: 'علی رضایی', phone: '09121112233' },
      region: null,
      matched_property: null,
      target_property_type: null,
      units_count: null,
      persons_count: null,
      beds: 1,
      needs: null,
      preferred_floor: null,
      min_area: null,
      max_area: null,
      min_build_year: null,
      max_build_year: null,
      wants_parking: false,
      wants_elevator: false,
      wants_storage: false,
      max_deposit: null,
      max_rent: null,
      budget: null,
      deadline: null,
      notes: null,
      created_at: '2026-07-11T10:00:00Z',
    })
    mockGetMatches.mockResolvedValue(EMPTY_PAGE as never)

    renderWizard()
    // Step 1
    fireEvent.change(screen.getByPlaceholderText('نام'), { target: { value: 'علی' } })
    fireEvent.change(screen.getByPlaceholderText('نام خانوادگی'), { target: { value: 'رضایی' } })
    fireEvent.change(screen.getByPlaceholderText('۰۹۱۲ ۰۰۰ ۰۰۰۰'), { target: { value: '09121112233' } })
    fireEvent.click(screen.getByText('ادامه'))
    // Step 2
    await waitFor(() => expect(screen.getByText('نوع درخواست را انتخاب کنید')).toBeInTheDocument())
    fireEvent.click(screen.getByText('اجاره'))
    const cont1 = screen.getAllByText('ادامه')
    fireEvent.click(cont1[cont1.length - 1])
    // Step 3
    await waitFor(() => expect(screen.getByText(/حداکثر پول پیش/)).toBeInTheDocument())
    const cont2 = screen.getAllByText('ادامه')
    fireEvent.click(cont2[cont2.length - 1])
    // Step 4 preview
    await waitFor(() => expect(screen.getByText('ثبت درخواست')).toBeInTheDocument())
    fireEvent.click(screen.getByText('ثبت درخواست'))
    // After submit
    await waitFor(() => {
      expect(screen.getByText(/فایل‌های پیشنهادی/)).toBeInTheDocument()
      expect(screen.getByText(/ملکی با این مشخصات یافت نشد/)).toBeInTheDocument()
    })
  })
})
