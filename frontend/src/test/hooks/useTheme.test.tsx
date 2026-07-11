import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTheme } from '../../hooks/useTheme'
import type { UserProfile } from '../../api/types'

const makeProfile = (dark_mode: boolean): UserProfile =>
  ({
    id: 1,
    mobile: '09121112233',
    full_name: 'تست کاربر',
    first_name: 'تست',
    last_name: 'کاربر',
    notifications_enabled: true,
    dark_mode,
  }) as UserProfile

function wrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  localStorage.setItem('access_token', 'tok')
  document.documentElement.removeAttribute('data-theme')
})

afterEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  vi.restoreAllMocks()
})

describe('useTheme', () => {
  it('sets data-theme=dark when me.dark_mode is true', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qc.setQueryData<UserProfile>(['me'], makeProfile(true))

    renderHook(() => useTheme(), { wrapper: wrapper(qc) })

    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('sets data-theme=light when me.dark_mode is false', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qc.setQueryData<UserProfile>(['me'], makeProfile(false))

    renderHook(() => useTheme(), { wrapper: wrapper(qc) })

    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('falls back to system preference when not authenticated', () => {
    localStorage.clear()
    const mqLight = (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
    vi.spyOn(window, 'matchMedia').mockImplementation(mqLight)

    const qc = new QueryClient()
    renderHook(() => useTheme(), { wrapper: wrapper(qc) })

    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('responds to system preference change when no user data', () => {
    localStorage.clear()
    let changeHandler: ((e: Partial<MediaQueryListEvent>) => void) | null = null
    const mq = {
      matches: false,
      media: '',
      addEventListener: vi.fn((_: string, h: (e: Partial<MediaQueryListEvent>) => void) => {
        changeHandler = h
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    vi.spyOn(window, 'matchMedia').mockReturnValue(mq as unknown as MediaQueryList)

    const qc = new QueryClient()
    renderHook(() => useTheme(), { wrapper: wrapper(qc) })

    expect(document.documentElement.dataset.theme).toBe('light')

    act(() => {
      changeHandler?.({ matches: true } as Partial<MediaQueryListEvent>)
    })
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('user preference overrides system preference', () => {
    const mqDark = (query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
    vi.spyOn(window, 'matchMedia').mockImplementation(mqDark)

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    // System says dark but user wants light
    qc.setQueryData<UserProfile>(['me'], makeProfile(false))

    renderHook(() => useTheme(), { wrapper: wrapper(qc) })

    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
