const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

export function useAuth() {
  const isAuthenticated = !!localStorage.getItem(ACCESS_KEY)

  function storeTokens(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  }

  function clearTokens() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  }

  return { isAuthenticated, storeTokens, clearTokens }
}
