import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Home, Building2 } from 'lucide-react'
import { Sidebar, SidebarNavItem } from '../../components/layout/Sidebar'

const items: SidebarNavItem[] = [
  { value: '/', label: 'داشبورد', icon: <Home size={20} /> },
  { value: '/files', label: 'فایل‌ها', icon: <Building2 size={20} /> },
]

describe('Sidebar', () => {
  it('renders nav items', () => {
    render(<Sidebar value="/" onChange={() => {}} items={items} />)
    expect(screen.getByText('داشبورد')).toBeInTheDocument()
    expect(screen.getByText('فایل‌ها')).toBeInTheDocument()
  })

  it('active item has aria-current="page"', () => {
    render(<Sidebar value="/files" onChange={() => {}} items={items} />)
    const buttons = screen.getAllByRole('button')
    const activeBtn = buttons.find(b => b.getAttribute('aria-current') === 'page')
    expect(activeBtn).toBeTruthy()
    expect(activeBtn?.textContent).toContain('فایل‌ها')
  })

  it('active item has data-active=true with primary styling', () => {
    render(<Sidebar value="/" onChange={() => {}} items={items} />)
    const buttons = screen.getAllByRole('button')
    const activeBtn = buttons.find(b => b.getAttribute('data-active') === 'true')
    expect(activeBtn).toBeTruthy()
    // active item should have primary soft background
    expect(activeBtn?.style.backgroundColor).toBe('var(--color-primary-soft)')
  })

  it('click calls onChange with correct value', () => {
    const onChange = vi.fn()
    render(<Sidebar value="/" onChange={onChange} items={items} />)
    fireEvent.click(screen.getByText('فایل‌ها'))
    expect(onChange).toHaveBeenCalledWith('/files')
  })

  it('renders brand block', () => {
    render(<Sidebar value="/" onChange={() => {}} items={items} />)
    expect(screen.getByText('DealEstate')).toBeInTheDocument()
    expect(screen.getByText('املاک ایران زمین')).toBeInTheDocument()
  })
})
