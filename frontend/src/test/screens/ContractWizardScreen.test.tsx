import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import ContractWizardScreen from '../../screens/ContractWizardScreen'
import ContractsScreen from '../../screens/ContractsScreen'
import type { PaginatedResponse, PropertyListItem, PersonApi, Region } from '../../api/types'
import type { ContractApi } from '../../api/contracts'
import { ToastProvider } from '../../components/common/Toast'

vi.mock('../../api/properties', () => ({ getProperties: vi.fn() }))
vi.mock('../../api/people', () => ({ getPeople: vi.fn(), createPerson: vi.fn() }))
vi.mock('../../api/contracts', () => ({ getContracts: vi.fn(), createContract: vi.fn() }))
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => vi.fn() }
})

import { getProperties } from '../../api/properties'
import { getPeople } from '../../api/people'
import { getContracts, createContract } from '../../api/contracts'

const mockGetProperties = vi.mocked(getProperties)
const mockGetPeople = vi.mocked(getPeople)
const mockGetContracts = vi.mocked(getContracts)
const mockCreateContract = vi.mocked(createContract)

const EMPTY_PROPS: PaginatedResponse<PropertyListItem> = { count: 0, next: null, previous: null, results: [] }
const EMPTY_PEOPLE: PaginatedResponse<PersonApi> = { count: 0, next: null, previous: null, results: [] }
const EMPTY_CONTRACTS: PaginatedResponse<ContractApi> = { count: 0, next: null, previous: null, results: [] }

function makeRegion(id: number, name: string): Region {
  return { id, name }
}

function makeProperty(id: number): PropertyListItem {
  return {
    id,
    title: `آپارتمان مولوی پلاک ${id}`,
    type: 'apartment',
    region: makeRegion(1, 'مولوی'),
    address: 'خ احمدی',
    plak: String(id),
    status: 'vacant',
    area: '100.00',
    is_for_sale: true,
    is_for_rent: false,
    is_for_rahn: false,
    total_price: 2_000_000_000,
    monthly_rent: null,
    rahn_amount: null,
    cover_photo: null,
    created_at: '2026-01-01T00:00:00Z',
  }
}

function makePerson(id: number): PersonApi {
  return {
    id,
    first_name: 'علی',
    last_name: 'احمدی',
    full_name: 'علی احمدی',
    phone: '09120000001',
    national_id: null,
    birth_date: null,
    role: 'owner',
    created_at: '2026-01-01T00:00:00Z',
  }
}

function makeContract(id: number): ContractApi {
  return {
    id,
    property: { id: 1, address: 'خ احمدی', type: 'apartment', region: makeRegion(1, 'مولوی') },
    contract_type: 'sale',
    party_a: { id: 1, full_name: 'علی احمدی', phone: '09120000001' },
    party_b: { id: 2, full_name: 'رضا کریمی', phone: '09120000002' },
    start_date: '2026-01-01',
    end_date: null,
    sale_price: 2_000_000_000,
    deposit_amount: null,
    monthly_rent: null,
    rahn_amount: null,
    photos: [],
    notes: '',
    created_at: '2026-01-01T00:00:00Z',
  }
}

function renderWizard() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter>
          <ContractWizardScreen />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

function renderList() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter>
          <ContractsScreen />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetProperties.mockResolvedValue(EMPTY_PROPS)
  mockGetPeople.mockResolvedValue(EMPTY_PEOPLE)
  mockGetContracts.mockResolvedValue(EMPTY_CONTRACTS)
})

// ── Contracts list ──

describe('ContractsScreen', () => {
  it('renders empty state when no contracts', async () => {
    renderList()
    await waitFor(() =>
      expect(screen.getByText('قراردادی با این مشخصات یافت نشد.')).toBeInTheDocument()
    )
  })

  it('shows contract count with Persian digits', async () => {
    mockGetContracts.mockResolvedValue({
      count: 3,
      next: null,
      previous: null,
      results: [makeContract(1), makeContract(2), makeContract(3)],
    })
    renderList()
    await waitFor(() => expect(screen.getByText(/۳ قرارداد/)).toBeInTheDocument())
  })

  it('renders contract card with type pill and amount', async () => {
    mockGetContracts.mockResolvedValue({
      count: 1, next: null, previous: null, results: [makeContract(1)],
    })
    renderList()
    await waitFor(() => {
      expect(screen.getAllByText('فروش').length).toBeGreaterThan(0)
      expect(screen.getByText('رضا کریمی')).toBeInTheDocument()
    })
  })

  it('filter chips render for all three types', async () => {
    renderList()
    expect(screen.getByRole('button', { name: 'همه' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'فروش' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'اجاره' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'رهن' })).toBeInTheDocument()
  })

  it('shows ثبت قرارداد button', () => {
    renderList()
    expect(screen.getByRole('button', { name: /ثبت قرارداد/ })).toBeInTheDocument()
  })

  it('filters by type when chip clicked', async () => {
    renderList()
    const saleChip = screen.getAllByRole('button', { name: 'فروش' })[0]
    fireEvent.click(saleChip)
    await waitFor(() => {
      expect(mockGetContracts).toHaveBeenCalledWith(
        expect.objectContaining({ contract_type: 'sale' })
      )
    })
  })
})

// ── Wizard Step 1 ──

describe('ContractWizardScreen — Step 1', () => {
  it('renders progress bar with 4 steps', () => {
    renderWizard()
    expect(screen.getByText('ملک')).toBeInTheDocument()
    expect(screen.getByText('طرفین')).toBeInTheDocument()
    expect(screen.getByText('مبالغ')).toBeInTheDocument()
    expect(screen.getByText('اسناد')).toBeInTheDocument()
  })

  it('renders property search input', () => {
    renderWizard()
    expect(
      screen.getByPlaceholderText('جستجوی آدرس، منطقه یا مالک...')
    ).toBeInTheDocument()
  })

  it('renders contract type buttons', () => {
    renderWizard()
    expect(screen.getByRole('button', { name: 'فروش' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'اجاره' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'رهن' })).toBeInTheDocument()
  })

  it('shows validation errors when next clicked without filling', async () => {
    renderWizard()
    fireEvent.click(screen.getByRole('button', { name: 'مرحله بعد' }))
    await waitFor(() => {
      expect(screen.getByText('ملک را انتخاب کنید')).toBeInTheDocument()
      expect(screen.getByText('نوع قرارداد را انتخاب کنید')).toBeInTheDocument()
    })
  })

  it('searches properties on input', async () => {
    mockGetProperties.mockResolvedValue({
      count: 1, next: null, previous: null, results: [makeProperty(1)],
    })
    renderWizard()
    const input = screen.getByPlaceholderText('جستجوی آدرس، منطقه یا مالک...')
    fireEvent.change(input, { target: { value: 'مولوی' } })
    await waitFor(() => {
      expect(mockGetProperties).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'مولوی' })
      )
    })
  })

  it('shows property search results in dropdown', async () => {
    mockGetProperties.mockResolvedValue({
      count: 1, next: null, previous: null, results: [makeProperty(1)],
    })
    renderWizard()
    const input = screen.getByPlaceholderText('جستجوی آدرس، منطقه یا مالک...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'مولوی' } })
    await waitFor(() =>
      expect(screen.getByText('آپارتمان مولوی پلاک 1')).toBeInTheDocument()
    )
  })

  it('shows empty dropdown when no properties found', async () => {
    renderWizard()
    const input = screen.getByPlaceholderText('جستجوی آدرس، منطقه یا مالک...')
    fireEvent.focus(input)
    await waitFor(() =>
      expect(screen.getByText('ملکی یافت نشد.')).toBeInTheDocument()
    )
  })

  it('selecting a property shows the property card', async () => {
    mockGetProperties.mockResolvedValue({
      count: 1, next: null, previous: null, results: [makeProperty(5)],
    })
    renderWizard()
    const input = screen.getByPlaceholderText('جستجوی آدرس، منطقه یا مالک...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'مولوی' } })
    await waitFor(() => screen.getByText('آپارتمان مولوی پلاک 5'))
    fireEvent.click(screen.getByText('آپارتمان مولوی پلاک 5'))
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('جستجوی آدرس، منطقه یا مالک...')).not.toBeInTheDocument()
      expect(screen.getByText('آپارتمان مولوی پلاک 5')).toBeInTheDocument()
    })
  })
})

// ── Wizard Step 2 ──

describe('ContractWizardScreen — Step 2 (parties)', () => {
  async function advanceToStep2(contractType: 'فروش' | 'اجاره' | 'رهن' = 'فروش') {
    mockGetProperties.mockResolvedValue({
      count: 1, next: null, previous: null, results: [makeProperty(1)],
    })
    renderWizard()
    const input = screen.getByPlaceholderText('جستجوی آدرس، منطقه یا مالک...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'مولوی' } })
    await waitFor(() => screen.getByText('آپارتمان مولوی پلاک 1'))
    fireEvent.click(screen.getByText('آپارتمان مولوی پلاک 1'))
    fireEvent.click(screen.getByRole('button', { name: contractType }))
    fireEvent.click(screen.getByRole('button', { name: 'مرحله بعد' }))
    await waitFor(() => expect(screen.getByText('مالک / فروشنده')).toBeInTheDocument())
  }

  it('shows مالک/فروشنده and خریدار labels for sale', async () => {
    await advanceToStep2('فروش')
    expect(screen.getByText('مالک / فروشنده')).toBeInTheDocument()
    expect(screen.getByText('خریدار')).toBeInTheDocument()
  })

  it('shows مالک/فروشنده and مستأجر labels for rent', async () => {
    await advanceToStep2('اجاره')
    expect(screen.getByText('مالک / فروشنده')).toBeInTheDocument()
    expect(screen.getByText('مستأجر')).toBeInTheDocument()
  })

  it('shows validation errors for missing parties', async () => {
    await advanceToStep2('فروش')
    fireEvent.click(screen.getByRole('button', { name: 'مرحله بعد' }))
    await waitFor(() => {
      expect(screen.getByText('مالک / فروشنده الزامی است')).toBeInTheDocument()
      expect(screen.getByText('خریدار الزامی است')).toBeInTheDocument()
    })
  })

  it('قبلی button goes back to step 1', async () => {
    await advanceToStep2('فروش')
    fireEvent.click(screen.getByRole('button', { name: 'قبلی' }))
    await waitFor(() =>
      expect(screen.getByText(/نوع قرارداد/)).toBeInTheDocument()
    )
    expect(screen.queryByText('مالک / فروشنده')).not.toBeInTheDocument()
  })
})

// ── Wizard Step 3 ──

describe('ContractWizardScreen — Step 3 (amounts)', () => {
  it('renders مبلغ معامله for فروش', async () => {
    // Simulate being on step 3 for sale by rendering with mock
    // (step navigation already covered in step 2 tests)
    // Test ContractStep3 in isolation for amount field rendering
    const { ContractStep3 } = await import('../../screens/wizard/ContractStep3')
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { CONTRACT_INITIAL } = await import('../../screens/wizard/ContractStep1')
    const data = { ...CONTRACT_INITIAL, contract_type: 'sale' as const }
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ContractStep3
            data={data}
            onChange={vi.fn()}
            onNext={vi.fn()}
            onBack={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )
    expect(screen.getByText(/مبلغ معامله/)).toBeInTheDocument()
    expect(screen.queryByText(/پول پیش/)).not.toBeInTheDocument()
    expect(screen.queryByText(/مبلغ رهن/)).not.toBeInTheDocument()
  })

  it('renders پول پیش + اجاره fields for rent', async () => {
    const { ContractStep3 } = await import('../../screens/wizard/ContractStep3')
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { CONTRACT_INITIAL } = await import('../../screens/wizard/ContractStep1')
    const data = { ...CONTRACT_INITIAL, contract_type: 'rent' as const }
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ContractStep3
            data={data}
            onChange={vi.fn()}
            onNext={vi.fn()}
            onBack={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )
    expect(screen.getByText(/پول پیش/)).toBeInTheDocument()
    expect(screen.getByText(/اجاره ماهیانه/)).toBeInTheDocument()
    expect(screen.queryByText(/مبلغ معامله/)).not.toBeInTheDocument()
  })

  it('renders پول رهن for rahn', async () => {
    const { ContractStep3 } = await import('../../screens/wizard/ContractStep3')
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { CONTRACT_INITIAL } = await import('../../screens/wizard/ContractStep1')
    const data = { ...CONTRACT_INITIAL, contract_type: 'rahn' as const }
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ContractStep3
            data={data}
            onChange={vi.fn()}
            onNext={vi.fn()}
            onBack={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )
    expect(screen.getByText(/مبلغ رهن/)).toBeInTheDocument()
    expect(screen.queryByText(/پول پیش/)).not.toBeInTheDocument()
  })

  it('validates missing start_date', async () => {
    const { ContractStep3 } = await import('../../screens/wizard/ContractStep3')
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { CONTRACT_INITIAL } = await import('../../screens/wizard/ContractStep1')
    const data = { ...CONTRACT_INITIAL, contract_type: 'sale' as const }
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ContractStep3
            data={data}
            onChange={vi.fn()}
            onNext={vi.fn()}
            onBack={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'مرحله بعد' }))
    await waitFor(() =>
      expect(screen.getByText('تاریخ شروع الزامی است')).toBeInTheDocument()
    )
  })

  it('rejects invalid Jalali date format', async () => {
    const { ContractStep3 } = await import('../../screens/wizard/ContractStep3')
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { CONTRACT_INITIAL } = await import('../../screens/wizard/ContractStep1')
    const data = { ...CONTRACT_INITIAL, contract_type: 'sale' as const, start_date: '1403-01-01' }
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ContractStep3
            data={data}
            onChange={vi.fn()}
            onNext={vi.fn()}
            onBack={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'مرحله بعد' }))
    await waitFor(() =>
      expect(screen.getByText(/فرمت تاریخ صحیح نیست/)).toBeInTheDocument()
    )
  })

  it('rejects end_date <= start_date for rent', async () => {
    const { ContractStep3 } = await import('../../screens/wizard/ContractStep3')
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { CONTRACT_INITIAL } = await import('../../screens/wizard/ContractStep1')
    const data = {
      ...CONTRACT_INITIAL,
      contract_type: 'rent' as const,
      start_date: '1403/06/01',
      end_date: '1403/05/01',
      deposit_amount: '500000000',
      monthly_rent: '20000000',
    }
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ContractStep3 data={data} onChange={vi.fn()} onNext={vi.fn()} onBack={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'مرحله بعد' }))
    await waitFor(() =>
      expect(screen.getByText('تاریخ پایان باید بعد از تاریخ شروع باشد')).toBeInTheDocument()
    )
  })

  it('requires sale_price for فروش', async () => {
    const { ContractStep3 } = await import('../../screens/wizard/ContractStep3')
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { CONTRACT_INITIAL } = await import('../../screens/wizard/ContractStep1')
    const data = { ...CONTRACT_INITIAL, contract_type: 'sale' as const, start_date: '1403/01/01' }
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ContractStep3 data={data} onChange={vi.fn()} onNext={vi.fn()} onBack={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'مرحله بعد' }))
    await waitFor(() =>
      expect(screen.getByText('مبلغ معامله الزامی است')).toBeInTheDocument()
    )
  })
})

// ── Wizard Step 4 ──

describe('ContractWizardScreen — Step 4 (docs)', () => {
  it('renders photo upload area and warning banner', async () => {
    const { ContractStep4 } = await import('../../screens/wizard/ContractStep4')
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { CONTRACT_INITIAL } = await import('../../screens/wizard/ContractStep1')
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ContractStep4
            data={CONTRACT_INITIAL}
            onChange={vi.fn()}
            onBack={vi.fn()}
            onSubmit={vi.fn()}
            isSubmitting={false}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )
    expect(screen.getByText(/تصویر قرارداد/)).toBeInTheDocument()
    expect(screen.getByText(/با ثبت این قرارداد/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ثبت قرارداد' })).toBeInTheDocument()
  })

  it('enforces ≥1 photo before submit', async () => {
    const { ContractStep4 } = await import('../../screens/wizard/ContractStep4')
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { CONTRACT_INITIAL } = await import('../../screens/wizard/ContractStep1')
    const onSubmit = vi.fn()
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ContractStep4
            data={{ ...CONTRACT_INITIAL, photo_files: [] }}
            onChange={vi.fn()}
            onBack={vi.fn()}
            onSubmit={onSubmit}
            isSubmitting={false}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'ثبت قرارداد' }))
    await waitFor(() =>
      expect(screen.getByText('حداقل یک تصویر برای قرارداد الزامی است')).toBeInTheDocument()
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit when ≥1 photo provided', async () => {
    const { ContractStep4 } = await import('../../screens/wizard/ContractStep4')
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { CONTRACT_INITIAL } = await import('../../screens/wizard/ContractStep1')
    const onSubmit = vi.fn()
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ContractStep4
            data={{ ...CONTRACT_INITIAL, photo_files: ['contract1.jpg'] }}
            onChange={vi.fn()}
            onBack={vi.fn()}
            onSubmit={onSubmit}
            isSubmitting={false}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'ثبت قرارداد' }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('disables submit button while submitting', async () => {
    const { ContractStep4 } = await import('../../screens/wizard/ContractStep4')
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { CONTRACT_INITIAL } = await import('../../screens/wizard/ContractStep1')
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ContractStep4
            data={{ ...CONTRACT_INITIAL, photo_files: ['x.jpg'] }}
            onChange={vi.fn()}
            onBack={vi.fn()}
            onSubmit={vi.fn()}
            isSubmitting={true}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )
    const btn = screen.getByRole('button', { name: 'در حال ثبت...' })
    expect(btn).toBeDisabled()
  })
})
