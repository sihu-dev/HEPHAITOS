// ============================================
// Spinner Component Tests
// ============================================

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spinner } from '@/components/ui/Spinner'

describe('Spinner', () => {
  describe('rendering', () => {
    it('renders with role status', () => {
      render(<Spinner />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('has aria-label for accessibility', () => {
      render(<Spinner />)
      expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    })

    it('has sr-only loading text', () => {
      render(<Spinner />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    it('renders xs size', () => {
      render(<Spinner size="xs" data-testid="spinner" />)
      const spinner = screen.getByTestId('spinner')
      expect(spinner).toHaveClass('h-3', 'w-3')
    })

    it('renders sm size', () => {
      render(<Spinner size="sm" data-testid="spinner" />)
      const spinner = screen.getByTestId('spinner')
      expect(spinner).toHaveClass('h-4', 'w-4')
    })

    it('renders md size by default', () => {
      render(<Spinner data-testid="spinner" />)
      const spinner = screen.getByTestId('spinner')
      expect(spinner).toHaveClass('h-6', 'w-6')
    })

    it('renders lg size', () => {
      render(<Spinner size="lg" data-testid="spinner" />)
      const spinner = screen.getByTestId('spinner')
      expect(spinner).toHaveClass('h-8', 'w-8')
    })

    it('renders xl size', () => {
      render(<Spinner size="xl" data-testid="spinner" />)
      const spinner = screen.getByTestId('spinner')
      expect(spinner).toHaveClass('h-12', 'w-12')
    })
  })

  describe('variants', () => {
    it('renders default variant', () => {
      const { container } = render(<Spinner variant="default" />)
      expect(container.querySelector('.text-zinc-400')).toBeInTheDocument()
    })

    it('renders primary variant', () => {
      const { container } = render(<Spinner variant="primary" />)
      expect(container.querySelector('.text-primary-500')).toBeInTheDocument()
    })

    it('renders white variant', () => {
      const { container } = render(<Spinner variant="white" />)
      expect(container.querySelector('.text-white')).toBeInTheDocument()
    })
  })

  describe('custom props', () => {
    it('applies custom className', () => {
      render(<Spinner className="custom-class" data-testid="spinner" />)
      expect(screen.getByTestId('spinner')).toHaveClass('custom-class')
    })

    it('forwards ref', () => {
      const ref = { current: null } as React.RefObject<HTMLDivElement>
      render(<Spinner ref={ref} />)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })
})
