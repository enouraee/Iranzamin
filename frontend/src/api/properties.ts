import { apiGet, apiPost } from './client'
import type { PropertyListItem, PropertyListFilters, PropertyDetail, PropertyCreatePayload, PaginatedResponse } from './types'

export function getProperties(
  filters: PropertyListFilters = {},
): Promise<PaginatedResponse<PropertyListItem>> {
  const params: Record<string, string | number> = {}
  if (filters.search) params.search = filters.search
  if (filters.type) params.type = filters.type
  if (filters.region) params.region = filters.region
  if (filters.status) params.status = filters.status
  if (filters.deal_type) params.deal_type = filters.deal_type
  if (filters.page) params.page = filters.page
  if (filters.page_size) params.page_size = filters.page_size
  return apiGet<PaginatedResponse<PropertyListItem>>('properties/', params)
}

export function getProperty(id: number): Promise<PropertyDetail> {
  return apiGet<PropertyDetail>(`properties/${id}/`)
}

export function createProperty(payload: PropertyCreatePayload): Promise<{ id: number; type: string; status: string; created_at: string }> {
  return apiPost('properties/create/', payload)
}
