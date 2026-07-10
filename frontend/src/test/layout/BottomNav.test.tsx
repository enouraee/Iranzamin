import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Home, Building2 } from 'lucide-react'
import { BottomNav, BottomNavItem } from '../../components/navigation/BottomNav'

const items: BottomNavItem[] = [
  {
    value: '/',
    label: 'داشبورد',
    icon: (active) => <Home size={24} strokeWidth={active ? 2.4 : 2} data-testid="icon-home" />,
  },
  {
    value: '/files',
    label: 'فایل‌ها',
    icon: (active) => <Building2 size={24} strokeWidth={active ? 2.4 : 2} data-testid="icon-files" />,
  },
]

describe('BottomNav', () => {
  it('renders all passed items', () => {
    render(<BottomNav items={items} value="/" onChange={() => {}} />)
    expect(screen.getByText('داشبورد')).toBeInTheDocument()
    expect(screen.getByText('فایل‌ها')).toBeInTheDocument()
  })

  it('active item has aria-current="page"', () => {
    render(<BottomNav items={items} value="/files" onChange={() => {}} />)
    const buttons = screen.getAllByRole('button')
    const filesBtn = buttons.find(b => b.getAttribute('aria-current') === 'page')
    expect(filesBtn).toBeTruthy()
  })

  it('active item has data-active=true', () => {
    render(<BottomNav items={items} value="/" onChange={() => {}} />)
    const buttons = screen.getAllByRole('button')
    const activeBtn = buttons.find(b => b.getAttribute('data-active') === 'true')
    expect(activeBtn).toBeTruthy()
  })

  it('click calls onChange with correct value', () => {
    const onChange = vi.fn()
    render(<BottomNav items={items} value="/" onChange={onChange} />)
    fireEvent.click(screen.getByText('فایل‌ها'))
    expect(onChange).toHaveBeenCalledWith('/files')
  })
})
