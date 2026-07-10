import axios from 'axios'
import type { ApiError } from './types'

const client = axios.create({
  baseURL: '/api/',
})

// Attach JWT token from localStorage to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 by clearing tokens and redirecting to login.
// Handle network errors with a Persian message.
client.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    // Network / no-response error
    const apiError: ApiError = {
      message: 'خطا در ارتباط با سرور',
    }
    return Promise.reject(apiError)
  },
)

export default client

export const apiGet = <T>(url: string, params?: object) =>
  client.get<T>(url, { params }).then((r) => r.data)

export const apiPost = <T>(url: string, data?: unknown) =>
  client.post<T>(url, data).then((r) => r.data)

export const apiPatch = <T>(url: string, data?: unknown) =>
  client.patch<T>(url, data).then((r) => r.data)

export const apiDelete = (url: string) =>
  client.delete(url).then((r) => r.data)
