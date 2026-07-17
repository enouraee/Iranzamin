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

export const PROPERTY_STATUS_LABEL: Record<PropertyStatusApi, string> = {
  vacant: 'خالی',
  occupied: 'پر',
}

export interface Region {
  id: number
  name: string
  created_at?: string
}

// ---- People (wire shape) ----
export interface PersonApi {
  id: number
  first_name: string
  last_name: string
  full_name: string
  phone: string
  national_id: string | null
  birth_date: string | null  // ISO date
  role: PersonRoleApi
  created_at: string
}

export interface PersonDetailApi extends PersonApi {
  owned_properties: Array<{ id: number; address: string; type: PropertyTypeApi; status: PropertyStatusApi }>
  rented_properties: Array<{ id: number; address: string; type: PropertyTypeApi; status: PropertyStatusApi }>
}

export type CabinetMaterialApi = 'open' | 'mdf' | ''

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

export interface PropertyPhoto {
  id: number
  file: string
  is_cover: boolean
}

export interface PropertyVideo {
  id: number
  file: string
}

export interface PropertyHistoryEntry {
  id: number
  change_type: 'owner' | 'tenant' | 'status' | 'price' | 'other'
  field: string
  old_value: string
  new_value: string
  source: 'manual' | 'contract'
  contract_id: number | null
  changed_by: { id: number; first_name: string; last_name: string } | null
  created_at: string
}

export interface PersonStub {
  id: number
  first_name: string
  last_name: string
  phone: string
}

// Full property detail — returned by GET /api/properties/{id}/
export interface PropertyDetail extends PropertyListItem {
  // Parties
  agent: { id: number; first_name: string; last_name: string }
  owner: PersonStub | null
  tenant: PersonStub | null
  // Occupancy
  occupancy_start: string | null
  occupancy_end: string | null
  occupancy_deposit: number | null
  occupancy_monthly_rent: number | null
  occupancy_rahn: number | null
  // Deal pricing
  price_per_meter: number | null
  deposit: number | null
  // Apartment specs
  floor: number | null
  unit: string | null
  beds: number | null
  has_parking: boolean
  has_obstructive_parking: boolean
  has_balcony: boolean
  has_backyard: boolean
  has_elevator: boolean
  cabinet_material: CabinetMaterialApi
  build_year: number | null
  has_storage: boolean
  storage_deed: boolean
  storage_area: string | null
  has_tobdil: boolean
  // Kalnagi + Land specs
  has_aqab_neshini: boolean
  aqab_neshini_desc: string | null
  taadad_bar: number | null
  gozar_kooche: string | null
  // Kalnagi only
  taadad_tabaghat: number | null
  has_hayat: boolean
  hayat_area: string | null
  // Media
  photos: PropertyPhoto[]
  videos: PropertyVideo[]
  history: PropertyHistoryEntry[]
  updated_at: string
}

// Payload for POST /api/properties/create/
export interface PropertyCreatePayload {
  type: PropertyTypeApi
  region_id: number
  address: string
  plak?: string
  title?: string
  owner_id?: number
  status?: PropertyStatusApi
  // occupancy
  tenant_id?: number
  occupancy_start?: string
  occupancy_end?: string
  occupancy_deposit?: number
  occupancy_monthly_rent?: number
  occupancy_rahn?: number
  // deals
  is_for_sale?: boolean
  price_per_meter?: number
  total_price?: number
  is_for_rent?: boolean
  deposit?: number
  monthly_rent?: number
  is_for_rahn?: boolean
  rahn_amount?: number
  // apt specs
  floor?: number
  unit?: string
  area?: number
  beds?: number
  has_parking?: boolean
  has_obstructive_parking?: boolean
  has_balcony?: boolean
  has_backyard?: boolean
  has_elevator?: boolean
  cabinet_material?: CabinetMaterialApi
  build_year?: number
  has_storage?: boolean
  storage_deed?: boolean
  storage_area?: number
  has_tobdil?: boolean
  // kalnagi/land
  has_aqab_neshini?: boolean
  aqab_neshini_desc?: string
  taadad_bar?: number
  gozar_kooche?: number
  taadad_tabaghat?: number
  has_hayat?: boolean
  hayat_area?: number
  // media (string arrays)
  photo_files?: string[]
  video_files?: string[]
}

export interface Contract {
  id: number
  property: PropertyListItem
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
  type: PropertyTypeApi
  address: string
  region_name: string
  status: PropertyStatusApi
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
