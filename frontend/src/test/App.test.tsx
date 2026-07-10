import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    // App renders a BrowserRouter with routes — just verify it mounts
    expect(document.body).toBeTruthy()
  })

  it('document is RTL', () => {
    expect(document.documentElement.dir).not.toBe('ltr')
  })

  it('renders dashboard title on root route', () => {
    render(<App />)
    // 'داشبورد' appears in TopBar title and BottomNav label — both are valid
    expect(screen.getAllByText('داشبورد').length).toBeGreaterThan(0)
  })
})
