import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../App'

describe('App', () => {
  it('renders RTL root', () => {
    render(<App />)
    expect(screen.getByText('املاک ایران زمین')).toBeInTheDocument()
  })

  it('document is RTL', () => {
    expect(document.documentElement.dir).not.toBe('ltr')
  })
})
