import { apiPost } from './client'
import type { AuthTokens } from './types'

export interface LoginPayload {
  phone: string
  password: string
}

export function authLogin(payload: LoginPayload): Promise<AuthTokens> {
  return apiPost<AuthTokens>('auth/login/', payload)
}
