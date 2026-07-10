import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Card } from '../../components/data/Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>محتوای کارت</p></Card>)
    expect(screen.getByText('محتوای کارت')).toBeInTheDocument()
  })

  it('non-interactive card has default cursor', () => {
    const { container } = render(<Card>محتوا</Card>)
    const card = container.firstChild as HTMLElement
    // default cursor (not pointer) — style.cursor will be empty string or 'default'
    expect(card.style.cursor).not.toBe('pointer')
  })

  it('interactive card has pointer cursor', () => {
    const { container } = render(<Card interactive>محتوا</Card>)
    const card = container.firstChild as HTMLElement
    expect(card.style.cursor).toBe('pointer')
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Card interactive onClick={onClick}>محتوا</Card>)
    fireEvent.click(screen.getByText('محتوا'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies correct padding for none', () => {
    const { container } = render(<Card padding="none">محتوا</Card>)
    const card = container.firstChild as HTMLElement
    expect(card.style.padding).toBe('0px')
  })

  it('applies correct padding for lg', () => {
    const { container } = render(<Card padding="lg">محتوا</Card>)
    const card = container.firstChild as HTMLElement
    expect(card.style.padding).toContain('space-6')
  })
})
