import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'

// Default matchMedia mock (from setup.ts) simulates mobile (min-width: 920px) = false

const mobileMock = (query: string) => ({
  matches: query.includes('920') ? false : true,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})

const desktopMock = (query: string) => ({
  matches: query.includes('920') ? true : false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})

function renderWithRouter(
  ui: React.ReactElement,
  { initialEntries = ['/'] }: { initialEntries?: string[] } = {}
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  )
}

describe('AppShell', () => {
  describe('mobile layout (<920px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'matchMedia', { writable: true, value: mobileMock })
    })

    it('renders bottom nav on mobile', () => {
      renderWithRouter(<AppShell title="داشبورد"><div>content</div></AppShell>)
      expect(screen.getByRole('navigation', { name: 'منوی پایین' })).toBeInTheDocument()
    })

    it('renders all nav item labels', () => {
      // Use a neutral title so nav labels don't clash
      renderWithRouter(<AppShell title="تست"><div>content</div></AppShell>)
      expect(screen.getAllByText('داشبورد').length).toBeGreaterThan(0)
      expect(screen.getByText('فایل‌ها')).toBeInTheDocument()
      expect(screen.getByText('قراردادها')).toBeInTheDocument()
      expect(screen.getByText('پروفایل')).toBeInTheDocument()
    })

    it('active route highlights matching nav item', () => {
      renderWithRouter(
        <AppShell title="تست"><div>content</div></AppShell>,
        { initialEntries: ['/files'] }
      )
      const buttons = screen.getAllByRole('button')
      const activeBtn = buttons.find(b => b.getAttribute('aria-current') === 'page')
      expect(activeBtn).toBeTruthy()
    })

    it('hideNav hides bottom nav', () => {
      renderWithRouter(<AppShell hideNav><div>content</div></AppShell>)
      expect(screen.queryByRole('navigation', { name: 'منوی پایین' })).not.toBeInTheDocument()
    })

    it('hideNav hides top bar', () => {
      renderWithRouter(<AppShell hideNav title="داشبورد"><div>only content</div></AppShell>)
      expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    })

    it('renders TopBar with title', () => {
      // Use a title that is not a nav label to avoid multiple-match errors
      renderWithRouter(
        <AppShell title="مشخصات ملک"><div>content</div></AppShell>,
        { initialEntries: ['/contracts'] }
      )
      expect(screen.getByText('مشخصات ملک')).toBeInTheDocument()
    })

    it('renders children inside main', () => {
      renderWithRouter(
        <AppShell title="داشبورد"><p data-testid="child">محتوا</p></AppShell>
      )
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })
  })

  describe('desktop layout (≥920px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'matchMedia', { writable: true, value: desktopMock })
    })

    afterEach(() => {
      // Restore mobile mock so other describes are not affected
      Object.defineProperty(window, 'matchMedia', { writable: true, value: mobileMock })
    })

    it('renders sidebar on desktop', () => {
      renderWithRouter(<AppShell title="داشبورد"><div>content</div></AppShell>)
      expect(screen.getByRole('complementary', { name: 'منوی کناری' })).toBeInTheDocument()
    })

    it('hides bottom nav on desktop', () => {
      renderWithRouter(<AppShell title="داشبورد"><div>content</div></AppShell>)
      expect(screen.queryByRole('navigation', { name: 'منوی پایین' })).not.toBeInTheDocument()
    })
  })
})
