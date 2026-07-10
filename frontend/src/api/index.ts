export { default as client, apiGet, apiPost, apiPatch, apiDelete } from './client'
export { queryClient } from './queryClient'
export { getDashboardStats, getProfile } from './dashboard'
export type {
  PropertyType,
  DealType,
  PropertyStatus,
  PersonRole,
  ContractType,
  Region,
  Person,
  PropertyMedia,
  Property,
  Contract,
  PropertyRequest,
  RecentPropertySummary,
  DashboardStats,
  UserProfile,
  PaginatedResponse,
  AuthTokens,
  ApiError,
} from './types'
