import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Input } from '../../components/forms/Input'

describe('Input', () => {
  it('renders label text', () => {
    render(<Input label="نام" />)
    expect(screen.getByText('نام')).toBeInTheDocument()
  })

  it('renders error text when error prop is provided', () => {
    render(<Input label="تلفن" error="شماره نامعتبر است" />)
    expect(screen.getByText('شماره نامعتبر است')).toBeInTheDocument()
  })

  it('renders hint text when no error', () => {
    render(<Input label="تلفن" hint="شماره ۱۱ رقمی وارد کنید" />)
    expect(screen.getByText('شماره ۱۱ رقمی وارد کنید')).toBeInTheDocument()
  })

  it('does not render hint when error is shown', () => {
    render(<Input hint="راهنما" error="خطا" />)
    expect(screen.queryByText('راهنما')).not.toBeInTheDocument()
    expect(screen.getByText('خطا')).toBeInTheDocument()
  })

  it('renders input element', () => {
    render(<Input label="نام" />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('associates label with input via htmlFor/id', () => {
    render(<Input label="نام" id="name-input" />)
    const label = screen.getByText('نام')
    expect(label).toHaveAttribute('for', 'name-input')
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'name-input')
  })

  it('renders icon when icon prop provided', () => {
    render(<Input icon={<span data-testid="search-icon">🔍</span>} />)
    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
  })

  it('input becomes disabled when disabled=true', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('accepts user input', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'تست' } })
    expect((input as HTMLInputElement).value).toBe('تست')
  })
})
