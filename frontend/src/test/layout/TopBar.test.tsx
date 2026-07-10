import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TopBar } from '../../components/layout/TopBar'

describe('TopBar', () => {
  it('renders title', () => {
    render(<TopBar title="فایل‌ها" />)
    expect(screen.getByText('فایل‌ها')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<TopBar title="داشبورد" subtitle="خلاصه عملکرد" />)
    expect(screen.getByText('خلاصه عملکرد')).toBeInTheDocument()
  })

  it('does not render subtitle when not provided', () => {
    render(<TopBar title="داشبورد" />)
    expect(screen.queryByText('خلاصه عملکرد')).not.toBeInTheDocument()
  })

  it('renders leading slot', () => {
    render(<TopBar title="داشبورد" leading={<button data-testid="back-btn">برگشت</button>} />)
    expect(screen.getByTestId('back-btn')).toBeInTheDocument()
  })

  it('renders trailing slot', () => {
    render(<TopBar title="داشبورد" trailing={<button data-testid="menu-btn">منو</button>} />)
    expect(screen.getByTestId('menu-btn')).toBeInTheDocument()
  })
})
