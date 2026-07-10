import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PropertyCard } from '../../components/data/PropertyCard'

describe('PropertyCard', () => {
  it('renders title', () => {
    render(<PropertyCard title="آپارتمان ۸۵ متری" />)
    expect(screen.getByText('آپارتمان ۸۵ متری')).toBeInTheDocument()
  })

  it('renders status badge خالی for status=available', () => {
    render(<PropertyCard title="ملک" status="available" />)
    expect(screen.getByText('خالی')).toBeInTheDocument()
  })

  it('renders status badge پر for status=occupied', () => {
    render(<PropertyCard title="ملک" status="occupied" />)
    expect(screen.getByText('پر')).toBeInTheDocument()
  })

  it('does not render status badge when status not provided', () => {
    render(<PropertyCard title="ملک" />)
    expect(screen.queryByText('خالی')).not.toBeInTheDocument()
    expect(screen.queryByText('پر')).not.toBeInTheDocument()
  })

  it('renders district with map pin icon', () => {
    render(<PropertyCard title="ملک" district="سعادت‌آباد" />)
    expect(screen.getByText('سعادت‌آباد')).toBeInTheDocument()
  })

  it('renders price', () => {
    render(<PropertyCard title="ملک" price="۵٬۰۰۰٬۰۰۰ تومان" />)
    expect(screen.getByText('۵٬۰۰۰٬۰۰۰ تومان')).toBeInTheDocument()
  })

  it('renders code', () => {
    render(<PropertyCard title="ملک" code="F-۱۲۳۴" />)
    expect(screen.getByText('F-۱۲۳۴')).toBeInTheDocument()
  })

  it('renders meta chips', () => {
    const meta = [
      { icon: <span>★</span>, label: '۳ خواب' },
      { icon: <span>★</span>, label: '۸۵ متر' },
    ]
    render(<PropertyCard title="ملک" meta={meta} />)
    expect(screen.getByText('۳ خواب')).toBeInTheDocument()
    expect(screen.getByText('۸۵ متر')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<PropertyCard title="ملک" onClick={onClick} />)
    fireEvent.click(screen.getByText('ملک'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders image when src provided', () => {
    render(<PropertyCard title="ملک" image="https://example.com/img.jpg" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/img.jpg')
  })
})
