import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from '../../components/data/Badge'

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>خالی</Badge>)
    expect(screen.getByText('خالی')).toBeInTheDocument()
  })

  it('renders a dot element when dot=true', () => {
    const { container } = render(<Badge tone="success" dot>خالی</Badge>)
    // The dot is a span with borderRadius 50%
    const spans = container.querySelectorAll('span')
    // outer span + dot span + text = outer wrapper has 2 children
    expect(spans.length).toBeGreaterThanOrEqual(2)
  })

  it('applies success tone styles for status خالی', () => {
    const { container } = render(<Badge tone="success">خالی</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge.style.backgroundColor).toContain('color-success-soft')
  })

  it('applies danger tone styles for status پر', () => {
    const { container } = render(<Badge tone="danger">پر</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge.style.backgroundColor).toContain('color-danger-soft')
  })

  it('applies size sm styles', () => {
    const { container } = render(<Badge size="sm">کوچک</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge.style.fontSize).toContain('text-xs')
  })

  it('applies size md styles (default)', () => {
    const { container } = render(<Badge>متوسط</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge.style.fontSize).toContain('text-sm')
  })

  it('does not have a disabled prop (Badge has no disabled)', () => {
    // Badge component has no disabled behavior — just confirm it renders normally
    render(<Badge tone="neutral">بی‌طرف</Badge>)
    expect(screen.getByText('بی‌طرف')).toBeInTheDocument()
  })
})
