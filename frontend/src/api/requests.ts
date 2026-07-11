import { apiGet, apiPost } from './client'
import type { PaginatedResponse, PropertyTypeApi, Region } from './types'

// ---- Request-specific types (kept here per conflict rules) ----
export type RequestTypeApi = 'rent' | 'rahn' | 'sale'
export type RequestStatusApi = 'open' | 'done'

export const REQUEST_TYPE_LABEL: Record<RequestTypeApi, string> = {
  rent: 'اجاره',
  rahn: 'رهن کامل',
  sale: 'فروش',
}

export interface RequestCustomerStub {
  id: number
  full_name: string
  phone: string
}

export interface RequestPropertyStub {
  id: number
  address: string
}

export interface RequestApi {
  id: number
  customer: RequestCustomerStub
  region: Region | null
  matched_property: RequestPropertyStub | null
  request_type: RequestTypeApi
  status: RequestStatusApi
  target_property_type: PropertyTypeApi | null
  units_count: number | null
  persons_count: number | null
  beds: number | null
  needs: string | null
  preferred_floor: string | null
  min_area: string | null
  max_area: string | null
  min_build_year: number | null
  max_build_year: number | null
  wants_parking: boolean
  wants_elevator: boolean
  wants_storage: boolean
  max_deposit: number | null
  max_rent: number | null
  budget: number | null
  deadline: string | null
  notes: string | null
  created_at: string
}

export interface RequestMatchItem {
  id: number
  title: string
  type: PropertyTypeApi
  region: Region
  address: string
  status: 'vacant' | 'occupied'
  area: string | null
  beds: number | null
  floor: number | null
  build_year: number | null
  is_for_sale: boolean
  is_for_rent: boolean
  is_for_rahn: boolean
  total_price: number | null
  monthly_rent: number | null
  rahn_amount: number | null
  cover_photo: string | null
}

export interface RequestCreatePayload {
  request_type: RequestTypeApi
  // Customer — one of these two options
  customer_id?: number
  customer_first_name?: string
  customer_last_name?: string
  customer_phone?: string
  // Common optional
  region_id?: number
  persons_count?: number
  beds?: number
  needs?: string
  preferred_floor?: string
  min_area?: number
  max_area?: number
  wants_parking?: boolean
  wants_elevator?: boolean
  wants_storage?: boolean
  deadline?: string
  notes?: string
  // Rent / Rahn
  max_deposit?: number
  max_rent?: number
  // Sale
  target_property_type?: PropertyTypeApi
  min_build_year?: number
  max_build_year?: number
  units_count?: number
  budget?: number
}

export interface RequestListFilters {
  request_type?: RequestTypeApi
  status?: RequestStatusApi
  customer?: number
  region?: number
  search?: string
  page?: number
  page_size?: number
}

export function getRequests(filters: RequestListFilters = {}): Promise<PaginatedResponse<RequestApi>> {
  const params: Record<string, string | number> = {}
  if (filters.request_type) params.request_type = filters.request_type
  if (filters.status) params.status = filters.status
  if (filters.customer) params.customer = filters.customer
  if (filters.region) params.region = filters.region
  if (filters.search) params.search = filters.search
  if (filters.page) params.page = filters.page
  if (filters.page_size) params.page_size = filters.page_size
  return apiGet<PaginatedResponse<RequestApi>>('requests/', params)
}

export function createRequest(payload: RequestCreatePayload): Promise<RequestApi> {
  return apiPost<RequestApi>('requests/create/', payload)
}

export function getRequestMatches(id: number, page = 1): Promise<PaginatedResponse<RequestMatchItem>> {
  return apiGet<PaginatedResponse<RequestMatchItem>>(`requests/${id}/matches/`, { page })
}

export function markRequestDone(id: number, propertyId: number): Promise<{ id: number; status: RequestStatusApi }> {
  return apiPost(`requests/${id}/mark-done/`, { property_id: propertyId })
}
