import { apiGet, apiPost } from './client'
import type { Region, PaginatedResponse } from './types'

export function getRegions(search?: string): Promise<PaginatedResponse<Region>> {
  return apiGet<PaginatedResponse<Region>>('regions/', search ? { search } : undefined)
}

export function createRegion(name: string): Promise<Region> {
  return apiPost<Region>('regions/create/', { name })
}
