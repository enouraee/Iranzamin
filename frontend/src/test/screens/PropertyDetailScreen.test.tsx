import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import axios from 'axios'
import PropertyDetailScreen from '../../screens/PropertyDetailScreen'
import type { PropertyDetail } from '../../api/types'

vi.mock('../../api/properties', () => ({
  getProperty: vi.fn(),
}))

import { getProperty } from '../../api/properties'
const mockGetProperty = vi.mocked(getProperty)

function renderDetail(id = '1') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/files/${id}`]}>
        <Routes>
          <Route path="/files/:id" element={<PropertyDetailScreen />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function makeProperty(overrides: Partial<PropertyDetail> = {}): PropertyDetail {
  return {
    id: 1,
    title: 'آپارتمان منطقه ۳',
    type: 'apartment',
    region: { id: 3, name: 'منطقه ۳' },
    address: 'خیابان ولیعصر، پلاک ۱۲',
    plak: '12',
    status: 'vacant',
    area: '120.00',
    is_for_sale: true,
    is_for_rent: false,
    is_for_rahn: false,
    total_price: 5_000_000_000,
    monthly_rent: null,
    rahn_amount: null,
    cover_photo: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    agent: { id: 10, first_name: 'علی', last_name: 'رضایی' },
    owner: { id: 5, first_name: 'محمد', last_name: 'احمدی', phone: '09121234567' },
    tenant: null,
    occupancy_start: null,
    occupancy_end: null,
    occupancy_deposit: null,
    occupancy_monthly_rent: null,
    occupancy_rahn: null,
    price_per_meter: 40_000_000,
    deposit: null,
    floor: 3,
    unit: '۱۲',
    beds: 2,
    has_parking: true,
    has_obstructive_parking: false,
    has_balcony: true,
    has_backyard: false,
    has_elevator: false,
    cabinet_material: 'mdf',
    build_year: 1398,
    has_storage: false,
    storage_deed: false,
    storage_area: null,
    has_tobdil: false,
    has_aqab_neshini: false,
    aqab_neshini_desc: null,
    taadad_bar: null,
    gozar_kooche: null,
    taadad_tabaghat: null,
    has_hayat: false,
    hayat_area: null,
    photos: [],
    videos: [],
    history: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PropertyDetailScreen', () => {
  it('renders loading skeleton while fetching', () => {
    mockGetProperty.mockReturnValue(new Promise(() => {}))
    renderDetail()
    expect(screen.getByTestId('detail-loading')).toBeInTheDocument()
  })

  it('renders property title with type and region', async () => {
    mockGetProperty.mockResolvedValue(makeProperty())
    renderDetail()
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('آپارتمان منطقه ۳')
    })
  })

  it('renders area with Persian digits', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({ area: '120.00' }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('۱۲۰ متر')).toBeInTheDocument()
    })
  })

  it('renders floor with Persian digits', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({ floor: 3 }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('۳')).toBeInTheDocument()
    })
  })

  it('renders build year with Persian digits', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({ build_year: 1398 }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('۱۳۹۸')).toBeInTheDocument()
    })
  })

  it('renders beds count with Persian digits', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({ beds: 2 }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('۲')).toBeInTheDocument()
    })
  })

  it('renders amenity chips when amenities are true', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({ has_parking: true, has_balcony: true }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByTestId('amenity-chips')).toBeInTheDocument()
      expect(screen.getByText('پارکینگ')).toBeInTheDocument()
      expect(screen.getByText('بالکن')).toBeInTheDocument()
    })
  })

  it('does not render amenity chips when all amenities are false', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({
      has_parking: false, has_balcony: false, has_backyard: false,
      has_elevator: false, has_storage: false, has_tobdil: false,
    }))
    renderDetail()
    await waitFor(() => {
      expect(screen.queryByTestId('amenity-chips')).not.toBeInTheDocument()
    })
  })

  it('renders owner card with name and phone', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({
      owner: { id: 5, first_name: 'محمد', last_name: 'احمدی', phone: '09121234567' },
    }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('محمد احمدی')).toBeInTheDocument()
      expect(screen.getByText('۰۹۱۲۱۲۳۴۵۶۷')).toBeInTheDocument()
    })
  })

  it('shows cabinet MDF label', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({ cabinet_material: 'mdf' }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('MDF')).toBeInTheDocument()
    })
  })

  it('shows cabinet open label', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({ cabinet_material: 'open' }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('اوپن')).toBeInTheDocument()
    })
  })

  it('does not show cabinet field when cabinet_material is empty', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({ cabinet_material: '' }))
    renderDetail()
    await waitFor(() => {
      expect(screen.queryByText('کابینت')).not.toBeInTheDocument()
    })
  })

  it('renders occupied section when status is occupied and tenant exists', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({
      status: 'occupied',
      tenant: { id: 7, first_name: 'سارا', last_name: 'موسوی', phone: '09359876543' },
      occupancy_start: '2025-01-01',
      occupancy_end: '2026-01-01',
      occupancy_monthly_rent: 10_000_000,
      occupancy_deposit: 200_000_000,
      occupancy_rahn: null,
    }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('وضعیت اشغال')).toBeInTheDocument()
      expect(screen.getByText('سارا موسوی')).toBeInTheDocument()
    })
  })

  it('does not show occupied section when status is vacant', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({ status: 'vacant', tenant: null }))
    renderDetail()
    await waitFor(() => {
      expect(screen.queryByText('وضعیت اشغال')).not.toBeInTheDocument()
    })
  })

  it('renders deal pills', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({
      is_for_sale: true,
      is_for_rent: true,
      is_for_rahn: false,
    }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('فروش')).toBeInTheDocument()
      expect(screen.getByText('اجاره')).toBeInTheDocument()
    })
  })

  it('renders total price with formatted toman and words', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({ total_price: 5_000_000_000 }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText(/۵ میلیارد/)).toBeInTheDocument()
      expect(screen.getByText(/پنج میلیارد/)).toBeInTheDocument()
    })
  })

  it('renders history empty state when no history', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({ history: [] }))
    renderDetail()
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /تاریخچه/i })
      fireEvent.click(btn)
    })
    await waitFor(() => {
      expect(screen.getByText('تاریخچه‌ای ثبت نشده.')).toBeInTheDocument()
    })
  })

  it('renders history entries when available', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({
      history: [
        {
          id: 1,
          change_type: 'price',
          field: 'total_price',
          old_value: '4000000000',
          new_value: '5000000000',
          source: 'manual',
          contract_id: null,
          changed_by: null,
          created_at: '2026-05-01T10:00:00Z',
        },
      ],
    }))
    renderDetail()
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /تاریخچه/i })
      fireEvent.click(btn)
    })
    await waitFor(() => {
      expect(screen.getAllByText(/قیمت/).length).toBeGreaterThan(0)
      expect(screen.getByText(/قیمت — total_price/)).toBeInTheDocument()
    })
  })

  it('shows error state on generic fetch failure', async () => {
    mockGetProperty.mockRejectedValue(new Error('network error'))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('shows 404 state when property not found', async () => {
    const err = new axios.AxiosError('Not found', '404', undefined, undefined, {
      status: 404,
      data: { detail: 'Not found' },
      statusText: 'Not Found',
      headers: {},
      config: {} as never,
    })
    mockGetProperty.mockRejectedValue(err)
    renderDetail('999')
    await waitFor(() => {
      expect(screen.getByText('ملک یافت نشد')).toBeInTheDocument()
    })
  })

  it('renders status badge: خالی for vacant', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({ status: 'vacant' }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('خالی')).toBeInTheDocument()
    })
  })

  it('renders status badge: پر for occupied', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({
      status: 'occupied',
      tenant: { id: 2, first_name: 'علی', last_name: 'رضایی', phone: '09111111111' },
    }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('پر')).toBeInTheDocument()
    })
  })

  it('renders ثبت قرارداد button', async () => {
    mockGetProperty.mockResolvedValue(makeProperty())
    renderDetail()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'ثبت قرارداد' })).toBeInTheDocument()
    })
  })

  it('renders ویرایش button', async () => {
    mockGetProperty.mockResolvedValue(makeProperty())
    renderDetail()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'ویرایش' })).toBeInTheDocument()
    })
  })

  it('renders photo count chip when photos exist', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({
      photos: [
        { id: 1, file: '/photo1.jpg', is_cover: true },
        { id: 2, file: '/photo2.jpg', is_cover: false },
      ],
    }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText(/۲ عکس/)).toBeInTheDocument()
    })
  })

  it('does not show photo chip when no photos', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({ photos: [] }))
    renderDetail()
    await waitFor(() => {
      expect(screen.queryByText(/عکس/)).not.toBeInTheDocument()
    })
  })

  it('renders kalnagi specs (taadad_bar, gozar_kooche) for kalnagi type', async () => {
    mockGetProperty.mockResolvedValue(makeProperty({
      type: 'kalnagi',
      taadad_bar: 2,
      gozar_kooche: 'کوچه مرجان',
      taadad_tabaghat: 3,
    }))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('۲')).toBeInTheDocument()
      expect(screen.getByText('کوچه مرجان')).toBeInTheDocument()
      expect(screen.getByText('۳')).toBeInTheDocument()
    })
  })
})
