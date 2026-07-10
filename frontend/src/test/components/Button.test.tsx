import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '../../components/forms/Button'

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>ذخیره</Button>)
    expect(screen.getByText('ذخیره')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>کلیک</Button>)
    fireEvent.click(screen.getByText('کلیک'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('has disabled attribute when disabled=true', () => {
    render(<Button disabled>غیرفعال</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('has disabled attribute when loading=true', () => {
    render(<Button loading>...</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>غیرفعال</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies primary variant background color', () => {
    const { container } = render(<Button variant="primary">اصلی</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.style.backgroundColor).toContain('color-primary')
  })

  it('applies ghost variant transparent background', () => {
    const { container } = render(<Button variant="ghost">شبح</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.style.backgroundColor).toBe('transparent')
  })

  it('renders icon when icon prop provided', () => {
    render(<Button icon={<span data-testid="icon">✓</span>}>با آیکون</Button>)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('shows loading indicator and hides children text when loading', () => {
    render(<Button loading>ذخیره</Button>)
    // children replaced by loading placeholder
    expect(screen.queryByText('ذخیره')).not.toBeInTheDocument()
    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('has reduced opacity when disabled', () => {
    const { container } = render(<Button disabled>غیرفعال</Button>)
    const btn = container.firstChild as HTMLElement
    expect(btn.style.opacity).toBe('0.5')
  })
})
