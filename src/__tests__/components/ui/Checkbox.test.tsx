// ============================================
// Checkbox Component Tests
// ============================================

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Checkbox } from '@/components/ui/Checkbox'

describe('Checkbox', () => {
  describe('rendering', () => {
    it('renders checkbox input', () => {
      render(<Checkbox />)
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('renders with label', () => {
      render(<Checkbox label="Accept terms" />)
      expect(screen.getByText('Accept terms')).toBeInTheDocument()
    })

    it('renders with description', () => {
      render(<Checkbox description="You must accept to continue" />)
      expect(screen.getByText('You must accept to continue')).toBeInTheDocument()
    })
  })

  describe('states', () => {
    it('is unchecked by default', () => {
      render(<Checkbox />)
      expect(screen.getByRole('checkbox')).not.toBeChecked()
    })

    it('can be checked', () => {
      render(<Checkbox defaultChecked />)
      expect(screen.getByRole('checkbox')).toBeChecked()
    })

    it('handles disabled state', () => {
      render(<Checkbox disabled />)
      expect(screen.getByRole('checkbox')).toBeDisabled()
    })

    it('shows error state', () => {
      render(<Checkbox label="Terms" error="This field is required" />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls onChange when clicked', () => {
      const handleChange = vi.fn()
      render(<Checkbox onChange={handleChange} />)
      fireEvent.click(screen.getByRole('checkbox'))
      expect(handleChange).toHaveBeenCalled()
    })

    it('toggles checked state on click', () => {
      render(<Checkbox />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()
      fireEvent.click(checkbox)
      expect(checkbox).toBeChecked()
    })
  })

  describe('accessibility', () => {
    it('label is clickable', () => {
      const handleChange = vi.fn()
      render(<Checkbox label="Click me" onChange={handleChange} />)
      fireEvent.click(screen.getByText('Click me'))
      expect(handleChange).toHaveBeenCalled()
    })

    it('supports custom className', () => {
      render(<Checkbox className="custom-class" />)
      // The class is applied to wrapper, not checkbox
      expect(screen.getByRole('checkbox').closest('.custom-class')).toBeInTheDocument()
    })
  })
})
