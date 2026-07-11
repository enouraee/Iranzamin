import { apiGet, apiPatch } from './client'
import type { UserProfile } from './types'

export interface PatchMePayload {
  first_name?: string
  last_name?: string
  notifications_enabled?: boolean
  dark_mode?: boolean
}

export function getMe(): Promise<UserProfile> {
  return apiGet<UserProfile>('me/')
}

export function patchMe(payload: PatchMePayload): Promise<UserProfile> {
  return apiPatch<UserProfile>('me/', payload)
}
