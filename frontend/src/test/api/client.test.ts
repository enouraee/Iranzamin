/**
 * Tests for the axios client interceptors defined in src/api/client.ts.
 *
 * Strategy: import the client module, then drive the interceptors directly
 * by calling the registered request/response handler functions through
 * axios's internal interceptor manager — avoiding a real HTTP server or msw.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'

// --- helpers to pull registered interceptors off an axios instance --------

type FulfilledFn<T> = (value: T) => T | Promise<T>
type RejectedFn = (error: unknown) => unknown

interface InterceptorEntry<T> {
  fulfilled?: FulfilledFn<T>
  rejected?: RejectedFn
}

function getRequestInterceptors(
  instance: ReturnType<typeof axios.create>,
): InterceptorEntry<Parameters<FulfilledFn<object>>[0]>[] {
  // axios stores interceptors on the instance manager
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mgr = (instance as any).interceptors.request
  const handlers: InterceptorEntry<object>[] = []
  mgr.forEach((h: InterceptorEntry<object>) => handlers.push(h))
  return handlers
}

function getResponseInterceptors(
  instance: ReturnType<typeof axios.create>,
): InterceptorEntry<object>[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mgr = (instance as any).interceptors.response
  const handlers: InterceptorEntry<object>[] = []
  mgr.forEach((h: InterceptorEntry<object>) => handlers.push(h))
  return handlers
}

// ---- localStorage mock setup ---------------------------------------------

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(),
    removeItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn(),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

// ---- import the client after mocks are in place --------------------------

async function importClient() {
  // Dynamic import so we get a fresh module each time (vitest re-uses the
  // same module instance in a single test file — that's fine here)
  const mod = await import('../../api/client')
  return mod.default
}

// ==========================================================================
// 1. Request interceptor: attaches Bearer token when present
// ==========================================================================
describe('request interceptor', () => {
  it('attaches Authorization header when access_token is in localStorage', async () => {
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) =>
      key === 'access_token' ? 'test-jwt-token' : null,
    )

    const client = await importClient()
    const [interceptor] = getRequestInterceptors(client)

    // Simulate a config object the interceptor receives
    const config = { headers: {} as Record<string, string> }
    const result = await interceptor.fulfilled!(config)

    expect((result as typeof config).headers.Authorization).toBe('Bearer test-jwt-token')
  })

  it('does not attach Authorization header when no token is stored', async () => {
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null)

    const client = await importClient()
    const [interceptor] = getRequestInterceptors(client)

    const config = { headers: {} as Record<string, string> }
    const result = await interceptor.fulfilled!(config)

    expect((result as typeof config).headers.Authorization).toBeUndefined()
  })
})

// ==========================================================================
// 2. Response interceptor: 401 clears tokens + redirects
// ==========================================================================
describe('response interceptor — 401 handling', () => {
  it('clears both tokens and redirects to /login on 401', async () => {
    // Stub window.location so we can assert on href
    const locationMock = { href: '' }
    Object.defineProperty(window, 'location', { value: locationMock, writable: true })

    const client = await importClient()
    const [interceptor] = getResponseInterceptors(client)

    const error401 = {
      isAxiosError: true,
      response: { status: 401 },
    }

    // Mark as an axios error so our check works
    Object.setPrototypeOf(error401, Object.getPrototypeOf(axios.create().interceptors))
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true)

    await expect(interceptor.rejected!(error401)).rejects.toBe(error401)

    expect(localStorage.removeItem).toHaveBeenCalledWith('access_token')
    expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token')
    expect(window.location.href).toBe('/login')
  })
})

// ==========================================================================
// 3. Response interceptor: network error → ApiError with Persian message
// ==========================================================================
describe('response interceptor — network error', () => {
  it('rejects with ApiError containing Persian message on network error', async () => {
    const client = await importClient()
    const [interceptor] = getResponseInterceptors(client)

    // A network error has no .response property
    const networkError = new Error('Network Error')
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(false)

    let caught: unknown
    try {
      await interceptor.rejected!(networkError)
    } catch (e) {
      caught = e
    }

    expect(caught).toEqual({ message: 'خطا در ارتباط با سرور' })
  })

  it('does NOT convert axios errors with a response to ApiError', async () => {
    const client = await importClient()
    const [interceptor] = getResponseInterceptors(client)

    const axiosError = { response: { status: 500 }, isAxiosError: true }
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true)

    await expect(interceptor.rejected!(axiosError)).rejects.toBe(axiosError)
  })
})
