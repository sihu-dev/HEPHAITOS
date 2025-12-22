// ============================================
// Input Component Tests
// ============================================

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  describe('rendering', () => {
    it('renders input element', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('renders label when provided', () => {
      render(<Input label="Email" />)
      expect(screen.getByText('Email')).toBeInTheDocument()
    })

    it('associates label with input via htmlFor', () => {
      render(<Input id="email-input" label="Email" />)
      const label = screen.getByText('Email')
      expect(label).toHaveAttribute('for', 'email-input')
    })
  })

  describe('states', () => {
    it('handles disabled state', () => {
      render(<Input disabled />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('shows error message when error prop is provided', () => {
      render(<Input error="This field is required" />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('marks input as invalid when error exists', () => {
      render(<Input error="Invalid input" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
    })

    it('shows hint when provided and no error', () => {
      render(<Input hint="Enter your email address" />)
      expect(screen.getByText('Enter your email address')).toBeInTheDocument()
    })

    it('hides hint when error is shown', () => {
      render(<Input hint="Some hint" error="Error message" />)
      expect(screen.queryByText('Some hint')).not.toBeInTheDocument()
      expect(screen.getByText('Error message')).toBeInTheDocument()
    })
  })

  describe('icons', () => {
    it('renders left icon', () => {
      render(<Input leftIcon={<span data-testid="left-icon">L</span>} />)
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    })

    it('renders right icon', () => {
      render(<Input rightIcon={<span data-testid="right-icon">R</span>} />)
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })

    it('adds padding for left icon', () => {
      render(<Input leftIcon={<span>L</span>} />)
      expect(screen.getByRole('textbox')).toHaveClass('pl-9')
    })

    it('adds padding for right icon', () => {
      render(<Input rightIcon={<span>R</span>} />)
      expect(screen.getByRole('textbox')).toHaveClass('pr-9')
    })
  })

  describe('interactions', () => {
    it('calls onChange when value changes', () => {
      const handleChange = vi.fn()
      render(<Input onChange={handleChange} />)
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } })
      expect(handleChange).toHaveBeenCalled()
    })

    it('calls onFocus when focused', () => {
      const handleFocus = vi.fn()
      render(<Input onFocus={handleFocus} />)
      fireEvent.focus(screen.getByRole('textbox'))
      expect(handleFocus).toHaveBeenCalled()
    })

    it('calls onBlur when blurred', () => {
      const handleBlur = vi.fn()
      render(<Input onBlur={handleBlur} />)
      fireEvent.blur(screen.getByRole('textbox'))
      expect(handleBlur).toHaveBeenCalled()
    })
  })

  describe('types', () => {
    it('renders as text input by default', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text')
    })

    it('renders as email input', () => {
      render(<Input type="email" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
    })

    it('renders as password input', () => {
      render(<Input type="password" />)
      // Password inputs don't have a textbox role
      const input = document.querySelector('input[type="password"]')
      expect(input).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('supports custom className', () => {
      render(<Input className="custom-class" />)
      expect(screen.getByRole('textbox')).toHaveClass('custom-class')
    })

    it('forwards ref to input element', () => {
      const ref = { current: null } as React.RefObject<HTMLInputElement>
      render(<Input ref={ref} />)
      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('has aria-describedby for error', () => {
      render(<Input id="test-input" error="Error message" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'test-input-error')
    })

    it('has aria-describedby for hint', () => {
      render(<Input id="test-input" hint="Hint message" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'test-input-hint')
    })
  })
})
