import { apiGet, apiPost } from './client'
import type { ContractTypeApi, PaginatedResponse, Region, PropertyTypeApi } from './types'

// ---- Wire types for contracts (task 16) ----

export interface ContractParty {
  id: number
  full_name: string
  phone: string
}

export interface ContractPropertyRef {
  id: number
  address: string
  type: PropertyTypeApi
  region: Region
}

export interface ContractPhoto {
  id: number
  file: string
  order: number
}

export interface ContractApi {
  id: number
  property: ContractPropertyRef
  contract_type: ContractTypeApi
  party_a: ContractParty | null
  party_b: ContractParty | null
  start_date: string
  end_date: string | null
  sale_price: number | null
  deposit_amount: number | null
  monthly_rent: number | null
  rahn_amount: number | null
  photos: ContractPhoto[]
  notes: string
  created_at: string
  updated_at?: string
}

export interface ContractCreatePayload {
  property_id: number
  contract_type: ContractTypeApi
  start_date: string     // ISO YYYY-MM-DD
  party_a_id?: number
  party_b_id?: number
  end_date?: string
  sale_price?: number
  deposit_amount?: number
  monthly_rent?: number
  rahn_amount?: number
  notes?: string
  photo_files?: string[]
}

export interface ContractListFilters {
  contract_type?: ContractTypeApi
  property?: number
  start_date__gte?: string
  start_date__lte?: string
  page?: number
  page_size?: number
}

export function getContracts(
  filters: ContractListFilters = {},
): Promise<PaginatedResponse<ContractApi>> {
  const params: Record<string, string | number> = {}
  if (filters.contract_type) params.contract_type = filters.contract_type
  if (filters.property) params.property = filters.property
  if (filters.start_date__gte) params.start_date__gte = filters.start_date__gte
  if (filters.start_date__lte) params.start_date__lte = filters.start_date__lte
  if (filters.page) params.page = filters.page
  if (filters.page_size) params.page_size = filters.page_size
  return apiGet<PaginatedResponse<ContractApi>>('contracts/', params)
}

export function createContract(payload: ContractCreatePayload): Promise<ContractApi> {
  return apiPost<ContractApi>('contracts/create/', payload)
}
