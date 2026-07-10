import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { IconButton } from '../../components/forms/IconButton'

describe('IconButton', () => {
  it('renders with aria-label', () => {
    render(<IconButton aria-label="بستن">✕</IconButton>)
    expect(screen.getByRole('button', { name: 'بستن' })).toBeInTheDocument()
  })

  it('has disabled attribute when disabled=true', () => {
    render(<IconButton aria-label="بستن" disabled>✕</IconButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders children', () => {
    render(<IconButton aria-label="تست"><span data-testid="icon-child">★</span></IconButton>)
    expect(screen.getByTestId('icon-child')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<IconButton aria-label="کلیک" onClick={onClick}>★</IconButton>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn()
    render(<IconButton aria-label="غیرفعال" disabled onClick={onClick}>★</IconButton>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('has reduced opacity when disabled', () => {
    const { container } = render(<IconButton aria-label="غیرفعال" disabled>★</IconButton>)
    const btn = container.firstChild as HTMLElement
    expect(btn.style.opacity).toBe('0.5')
  })

  it('applies ghost variant transparent background', () => {
    const { container } = render(<IconButton aria-label="ghost" variant="ghost">★</IconButton>)
    const btn = container.firstChild as HTMLElement
    expect(btn.style.backgroundColor).toBe('transparent')
  })

  it('applies primary variant background', () => {
    const { container } = render(<IconButton aria-label="primary" variant="primary">★</IconButton>)
    const btn = container.firstChild as HTMLElement
    expect(btn.style.backgroundColor).toContain('color-primary')
  })
})
