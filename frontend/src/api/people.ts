import { apiGet, apiPost, apiPatch } from './client'
import type { PersonApi, PersonDetailApi, PaginatedResponse } from './types'

export type PersonKind = 'owners' | 'renters' | 'customers'

export interface PeopleListFilters {
  role?: 'owner' | 'customer'
  kind?: PersonKind
  search?: string
  page?: number
  page_size?: number
}

export interface PersonCreatePayload {
  first_name: string
  last_name?: string
  phone: string
  role: 'owner' | 'customer'
  national_id?: string
  birth_date?: string  // ISO date YYYY-MM-DD
}

export function getPeople(filters: PeopleListFilters = {}): Promise<PaginatedResponse<PersonApi>> {
  const params: Record<string, string | number> = {}
  if (filters.role) params.role = filters.role
  if (filters.kind) params.kind = filters.kind
  if (filters.search) params.search = filters.search
  if (filters.page) params.page = filters.page
  if (filters.page_size) params.page_size = filters.page_size
  return apiGet<PaginatedResponse<PersonApi>>('people/', params)
}

export function getPerson(id: number): Promise<PersonDetailApi> {
  return apiGet<PersonDetailApi>(`people/${id}/`)
}

export function createPerson(payload: PersonCreatePayload): Promise<PersonApi> {
  return apiPost<PersonApi>('people/create/', payload)
}

export function updatePerson(id: number, payload: Partial<PersonCreatePayload>): Promise<PersonApi> {
  return apiPatch<PersonApi>(`people/${id}/update/`, payload)
}

export interface PersonHistoryEntry {
  id: number
  field: string
  field_label: string
  old_value: string
  new_value: string
  changed_by: string | null
  created_at: string
}

export function getPersonHistory(id: number): Promise<PersonHistoryEntry[]> {
  return apiGet<PersonHistoryEntry[]>(`people/${id}/history/`)
}
