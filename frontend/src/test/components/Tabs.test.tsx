import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Tabs } from '../../components/navigation/Tabs'

const ITEMS = [
  { value: 'all',       label: 'همه',    count: 24 },
  { value: 'available', label: 'خالی',   count: 10 },
  { value: 'occupied',  label: 'پر',     count: 14 },
]

describe('Tabs', () => {
  it('renders all tab items', () => {
    render(<Tabs items={ITEMS} value="all" onChange={vi.fn()} />)
    expect(screen.getByRole('tab', { name: /همه/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /خالی/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /پر/ })).toBeInTheDocument()
  })

  it('active item has aria-selected=true', () => {
    render(<Tabs items={ITEMS} value="available" onChange={vi.fn()} />)
    expect(screen.getByRole('tab', { name: /خالی/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('inactive items have aria-selected=false', () => {
    render(<Tabs items={ITEMS} value="all" onChange={vi.fn()} />)
    expect(screen.getByRole('tab', { name: /خالی/ })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tab', { name: /پر/ })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onChange with correct value when tab clicked', () => {
    const onChange = vi.fn()
    render(<Tabs items={ITEMS} value="all" onChange={onChange} />)
    fireEvent.click(screen.getByRole('tab', { name: /خالی/ }))
    expect(onChange).toHaveBeenCalledWith('available')
  })

  it('renders count badges', () => {
    render(<Tabs items={ITEMS} value="all" onChange={vi.fn()} />)
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()
  })

  it('renders tablist role', () => {
    render(<Tabs items={ITEMS} value="all" onChange={vi.fn()} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })
})
