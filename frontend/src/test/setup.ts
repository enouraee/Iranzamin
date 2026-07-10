import '@testing-library/jest-dom'
import { vi } from 'vitest'

// jsdom does not implement window.matchMedia; provide a default mock (simulates mobile)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: query.includes('920') ? false : true,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
})
