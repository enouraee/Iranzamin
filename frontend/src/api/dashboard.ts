import { apiGet } from './client'
import type { DashboardStats, UserProfile } from './types'

export function getDashboardStats(): Promise<DashboardStats> {
  return apiGet<DashboardStats>('dashboard/stats/')
}

export function getProfile(): Promise<UserProfile> {
  return apiGet<UserProfile>('me/')
}
