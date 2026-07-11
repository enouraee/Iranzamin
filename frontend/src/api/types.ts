// All prices are in Toman, stored as integers
// All dates are ISO strings on the wire, Jalali on display (handled in UI layer)

// ---- Wire (API) enum values ----
export type PropertyTypeApi = 'apartment' | 'kalnagi' | 'land' | 'commercial' | 'office' | 'villa'
export type PropertyStatusApi = 'vacant' | 'occupied'
export type DealTypeApi = 'sale' | 'rent' | 'rahn'
export type PersonRoleApi = 'owner' | 'customer'
export type ContractTypeApi = 'sale' | 'rent' | 'rahn'

// ---- Display (UI) labels ----
export type PropertyType = 'آپارتمان' | 'کلنگی' | 'زمین' | 'تجاری' | 'اداری' | 'ویلا'
export type DealType = 'فروش' | 'اجاره' | 'رهن کامل'
export type PropertyStatus = 'خالی' | 'پر'
export type PersonRole = 'مالک' | 'مشتری'
export type ContractType = 'فروش' | 'اجاره' | 'رهن'

export const PROPERTY_TYPE_LABEL: Record<PropertyTypeApi, string> = {
  apartment: 'آپارتمان',
  kalnagi: 'کلنگی',
  land: 'زمین',
  commercial: 'تجاری',
  office: 'اداری',
  villa: 'ویلا',
}

export const DEAL_TYPE_LABEL: Record<DealTypeApi, string> = {
  sale: 'فروش',
  rent: 'اجاره',
  rahn: 'رهن کامل',
}

export interface Region {
  id: number
  name: string
}

// Property list item — shape returned by GET /api/properties/
export interface PropertyListItem {
  id: number
  title: string
  type: PropertyTypeApi
  region: Region
  address: string
  plak: string | null
  status: PropertyStatusApi
  area: string | null        // "120.00" decimal string
  is_for_sale: boolean
  is_for_rent: boolean
  is_for_rahn: boolean
  total_price: number | null
  monthly_rent: number | null
  rahn_amount: number | null
  cover_photo: string | null
  created_at: string
}

export interface PropertyListFilters {
  search?: string
  type?: PropertyTypeApi
  region?: number
  status?: PropertyStatusApi
  deal_type?: DealTypeApi
  page?: number
  page_size?: number
}

export interface Person {
  id: number
  firstName: string
  lastName: string
  phone: string
  nationalId?: string
  birthDate?: string  // ISO date
  role: PersonRole
}

export interface PropertyMedia {
  id: number
  url: string
  type: 'photo' | 'video'
}

export interface Property {
  id: number
  type: PropertyType
  region: Region
  address: string
  plak?: string
  status: PropertyStatus
  dealTypes: DealType[]
  owner?: Person
  tenant?: Person
  occupiedFrom?: string
  occupiedTo?: string
  // Apartment-specific
  floor?: number
  unit?: string
  area?: number
  bedrooms?: number
  buildYear?: number
  // Pricing
  salePrice?: number
  salePricePerMeter?: number
  rentDeposit?: number
  rentMonthly?: number
  mortgageAmount?: number
  media: PropertyMedia[]
  createdAt: string
  updatedAt: string
}

export interface Contract {
  id: number
  property: Property
  type: ContractType
  startDate: string
  endDate: string
  amount: number
  notes?: string
  createdAt: string
}

export interface PropertyRequest {
  id: number
  customer: Person
  type: 'rent' | 'buy'
  minArea?: number
  maxArea?: number
  minBedrooms?: number
  maxBedrooms?: number
  maxDeposit?: number
  maxRent?: number
  maxBudget?: number
  deadline?: string
  notes?: string
  createdAt: string
}

export interface RecentPropertySummary {
  id: number
  type: PropertyType
  address: string
  region_name: string
  status: PropertyStatus
  created_at: string
}

export interface DashboardStats {
  total_properties: number
  vacant_properties: number
  occupied_properties: number
  total_contracts: number
  open_requests: number
  recent_properties: RecentPropertySummary[]
}

export interface UserProfile {
  id: number
  mobile: string
  first_name: string
  last_name: string
  full_name: string
  notifications_enabled: boolean
  dark_mode: boolean
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface ApiError {
  message: string
  code?: string
  detail?: string
}
