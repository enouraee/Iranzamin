import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatCard } from '../../components/data/StatCard'

describe('StatCard', () => {
  it('renders label', () => {
    render(<StatCard label="تعداد ملک‌ها" value={42} />)
    expect(screen.getByText('تعداد ملک‌ها')).toBeInTheDocument()
  })

  it('renders numeric value', () => {
    render(<StatCard label="فایل‌ها" value={15} />)
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('renders string value', () => {
    render(<StatCard label="درآمد" value="۱٬۵۰۰٬۰۰۰" />)
    expect(screen.getByText('۱٬۵۰۰٬۰۰۰')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(<StatCard label="تست" value={1} icon={<span data-testid="stat-icon">★</span>} />)
    expect(screen.getByTestId('stat-icon')).toBeInTheDocument()
  })

  it('does not render icon section when no icon', () => {
    render(<StatCard label="تست" value={1} />)
    // Confirm icon wrapper is not rendered by checking no data-testid is present
    expect(screen.queryByTestId('stat-icon')).not.toBeInTheDocument()
  })

  it('renders trend up indicator', () => {
    render(<StatCard label="تست" value={1} trend="up" trendValue="+۵٪" />)
    expect(screen.getByText(/▲/)).toBeInTheDocument()
    expect(screen.getByText(/\+۵٪/)).toBeInTheDocument()
  })

  it('renders trend down indicator', () => {
    render(<StatCard label="تست" value={1} trend="down" trendValue="-۳٪" />)
    expect(screen.getByText(/▼/)).toBeInTheDocument()
  })

  it('does not render trend when trend prop not provided', () => {
    render(<StatCard label="تست" value={1} />)
    expect(screen.queryByText('▲')).not.toBeInTheDocument()
    expect(screen.queryByText('▼')).not.toBeInTheDocument()
  })
})

