import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Avatar } from '../../components/data/Avatar'

describe('Avatar', () => {
  it('shows first chars of first two name parts for "علی محمدی"', () => {
    render(<Avatar name="علی محمدی" />)
    expect(screen.getByText('عم')).toBeInTheDocument()
  })

  it('shows ؟ when no name provided', () => {
    render(<Avatar />)
    expect(screen.getByText('؟')).toBeInTheDocument()
  })

  it('shows ؟ for empty string name', () => {
    render(<Avatar name="" />)
    expect(screen.getByText('؟')).toBeInTheDocument()
  })

  it('shows only first char when name has single word', () => {
    render(<Avatar name="علی" />)
    expect(screen.getByText('ع')).toBeInTheDocument()
  })

  it('shows at most 2 initials even with longer names', () => {
    render(<Avatar name="علی احمد محمدی" />)
    const text = screen.getByText('عا')
    expect(text).toBeInTheDocument()
  })

  it('renders img element when src is provided', () => {
    render(<Avatar name="تست" src="https://example.com/photo.jpg" />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('renders correctly with size sm', () => {
    const { container } = render(<Avatar name="تست" size="sm" />)
    const avatar = container.firstChild as HTMLElement
    expect(avatar.style.width).toBe('32px')
    expect(avatar.style.height).toBe('32px')
  })

  it('renders correctly with size lg', () => {
    const { container } = render(<Avatar name="تست" size="lg" />)
    const avatar = container.firstChild as HTMLElement
    expect(avatar.style.width).toBe('56px')
    expect(avatar.style.height).toBe('56px')
  })
})
