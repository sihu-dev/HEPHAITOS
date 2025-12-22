// ============================================
// Select Component Tests
// ============================================

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Select } from '@/components/ui/Select'

const mockOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Orange' },
]

describe('Select', () => {
  describe('rendering', () => {
    it('renders with options', () => {
      render(<Select options={mockOptions} />)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('renders all options', () => {
      render(<Select options={mockOptions} />)
      expect(screen.getByText('Apple')).toBeInTheDocument()
      expect(screen.getByText('Banana')).toBeInTheDocument()
      expect(screen.getByText('Orange')).toBeInTheDocument()
    })

    it('renders with label', () => {
      render(<Select options={mockOptions} label="Fruit" />)
      expect(screen.getByText('Fruit')).toBeInTheDocument()
    })

    it('renders with placeholder', () => {
      render(<Select options={mockOptions} placeholder="Select a fruit" defaultValue="" />)
      expect(screen.getByText('Select a fruit')).toBeInTheDocument()
    })
  })

  describe('states', () => {
    it('shows error message', () => {
      render(<Select options={mockOptions} error="Please select a fruit" />)
      expect(screen.getByText('Please select a fruit')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('shows hint when no error', () => {
      render(<Select options={mockOptions} hint="Choose your favorite" />)
      expect(screen.getByText('Choose your favorite')).toBeInTheDocument()
    })

    it('hides hint when error exists', () => {
      render(<Select options={mockOptions} error="Error" hint="Hint" />)
      expect(screen.queryByText('Hint')).not.toBeInTheDocument()
    })

    it('can be disabled', () => {
      render(<Select options={mockOptions} disabled />)
      expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('supports disabled options', () => {
      const optionsWithDisabled = [
        ...mockOptions,
        { value: 'grape', label: 'Grape', disabled: true },
      ]
      render(<Select options={optionsWithDisabled} />)
      const grapeOption = screen.getByText('Grape')
      expect(grapeOption).toHaveAttribute('disabled')
    })
  })

  describe('variants', () => {
    it('renders default variant', () => {
      render(<Select options={mockOptions} variant="default" data-testid="select" />)
      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('bg-white/[0.04]')
    })

    it('renders glass variant', () => {
      render(<Select options={mockOptions} variant="glass" />)
      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('bg-white/[0.02]')
    })
  })

  describe('interactions', () => {
    it('calls onChange when selection changes', () => {
      const handleChange = vi.fn()
      render(<Select options={mockOptions} onChange={handleChange} />)

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'banana' } })
      expect(handleChange).toHaveBeenCalled()
    })

    it('updates value on selection', () => {
      render(<Select options={mockOptions} defaultValue="apple" />)
      const select = screen.getByRole('combobox') as HTMLSelectElement

      fireEvent.change(select, { target: { value: 'banana' } })
      expect(select.value).toBe('banana')
    })
  })

  describe('accessibility', () => {
    it('connects label to select', () => {
      render(<Select options={mockOptions} label="Fruit" />)
      const select = screen.getByRole('combobox')
      const label = screen.getByText('Fruit')
      expect(label).toHaveAttribute('for', select.id)
    })

    it('sets aria-invalid when error', () => {
      render(<Select options={mockOptions} error="Error" />)
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
    })

    it('connects aria-describedby to error', () => {
      render(<Select options={mockOptions} error="Error message" />)
      const select = screen.getByRole('combobox')
      const error = screen.getByRole('alert')
      expect(select).toHaveAttribute('aria-describedby', error.id)
    })

    it('forwards ref', () => {
      const ref = { current: null } as React.RefObject<HTMLSelectElement>
      render(<Select ref={ref} options={mockOptions} />)
      expect(ref.current).toBeInstanceOf(HTMLSelectElement)
    })
  })
})
