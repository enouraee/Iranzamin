import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Select } from '../../components/forms/Select'

const OPTIONS = [
  { value: 'apartment', label: 'آپارتمان' },
  { value: 'land',      label: 'زمین' },
  { value: 'villa',     label: 'ویلا' },
]

describe('Select', () => {
  it('renders label text', () => {
    render(<Select label="نوع ملک" options={OPTIONS} />)
    expect(screen.getByText('نوع ملک')).toBeInTheDocument()
  })

  it('renders all options', () => {
    render(<Select options={OPTIONS} />)
    expect(screen.getByRole('option', { name: 'آپارتمان' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'زمین' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'ویلا' })).toBeInTheDocument()
  })

  it('renders placeholder option', () => {
    render(<Select options={OPTIONS} placeholder="انتخاب کنید" />)
    expect(screen.getByRole('option', { name: 'انتخاب کنید' })).toBeInTheDocument()
  })

  it('calls onChange with selected value', () => {
    const onChange = vi.fn()
    render(<Select options={OPTIONS} onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'land' } })
    expect(onChange).toHaveBeenCalledWith('land')
  })

  it('renders error text', () => {
    render(<Select options={OPTIONS} error="الزامی است" />)
    expect(screen.getByText('الزامی است')).toBeInTheDocument()
  })

  it('renders hint text when no error', () => {
    render(<Select options={OPTIONS} hint="نوع ملک را انتخاب کنید" />)
    expect(screen.getByText('نوع ملک را انتخاب کنید')).toBeInTheDocument()
  })

  it('does not show hint when error is present', () => {
    render(<Select options={OPTIONS} hint="راهنما" error="خطا" />)
    expect(screen.queryByText('راهنما')).not.toBeInTheDocument()
  })

  it('disables select when disabled=true', () => {
    render(<Select options={OPTIONS} disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})
