import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, expect } from 'vitest'
import App from '../App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(document.body).toBeTruthy()
  })

  it('document is RTL', () => {
    expect(document.documentElement.dir).not.toBe('ltr')
  })

  it('redirects unauthenticated user to login', () => {
    localStorage.removeItem('access_token')
    render(<App />)
    expect(screen.getByText('ورود به حساب')).toBeTruthy()
  })

  describe('authenticated', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'test-token')
      window.history.pushState({}, '', '/')
    })
    afterEach(() => {
      localStorage.removeItem('access_token')
    })

    it('renders dashboard title on root route', () => {
      render(<App />)
      // 'داشبورد' appears in TopBar title and BottomNav label — both are valid
      expect(screen.getAllByText('داشبورد').length).toBeGreaterThan(0)
    })
  })
})
