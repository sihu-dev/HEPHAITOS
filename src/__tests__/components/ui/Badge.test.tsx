// ============================================
// Badge Component Tests
// ============================================

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  describe('rendering', () => {
    it('renders with default props', () => {
      render(<Badge>Default</Badge>)
      expect(screen.getByText('Default')).toBeInTheDocument()
    })

    it('renders with default variant styling', () => {
      render(<Badge>Default</Badge>)
      const badge = screen.getByText('Default')
      expect(badge).toHaveClass('bg-white/[0.06]')
    })
  })

  describe('variants', () => {
    it('renders primary variant', () => {
      render(<Badge variant="primary">Primary</Badge>)
      expect(screen.getByText('Primary')).toHaveClass('bg-white/[0.08]')
    })

    it('renders success variant', () => {
      render(<Badge variant="success">Success</Badge>)
      expect(screen.getByText('Success')).toHaveClass('bg-emerald-500/10')
    })

    it('renders warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>)
      expect(screen.getByText('Warning')).toHaveClass('bg-amber-500/10')
    })

    it('renders error variant', () => {
      render(<Badge variant="error">Error</Badge>)
      expect(screen.getByText('Error')).toHaveClass('bg-red-500/10')
    })

    it('renders profit variant', () => {
      render(<Badge variant="profit">+15%</Badge>)
      expect(screen.getByText('+15%')).toHaveClass('text-emerald-400')
    })

    it('renders loss variant', () => {
      render(<Badge variant="loss">-10%</Badge>)
      expect(screen.getByText('-10%')).toHaveClass('text-red-400')
    })

    it('renders outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>)
      const badge = screen.getByText('Outline')
      expect(badge).toHaveClass('border')
    })
  })

  describe('sizes', () => {
    it('renders small size', () => {
      render(<Badge size="sm">Small</Badge>)
      expect(screen.getByText('Small')).toHaveClass('h-5')
    })

    it('renders medium size by default', () => {
      render(<Badge>Medium</Badge>)
      expect(screen.getByText('Medium')).toHaveClass('h-5')
    })

    it('renders large size', () => {
      render(<Badge size="lg">Large</Badge>)
      expect(screen.getByText('Large')).toHaveClass('h-6')
    })
  })

  describe('dot indicator', () => {
    it('does not render dot by default', () => {
      render(<Badge>No Dot</Badge>)
      const badge = screen.getByText('No Dot')
      expect(badge.querySelector('.rounded-full')).not.toBeInTheDocument()
    })

    it('renders dot when dot prop is true', () => {
      render(<Badge dot>With Dot</Badge>)
      const badge = screen.getByText('With Dot')
      expect(badge.querySelector('.rounded-full')).toBeInTheDocument()
    })

    it('dot has correct color for success variant', () => {
      render(<Badge variant="success" dot>Success</Badge>)
      const badge = screen.getByText('Success')
      const dot = badge.querySelector('.rounded-full')
      expect(dot).toHaveClass('bg-emerald-500')
    })

    it('dot has correct color for error variant', () => {
      render(<Badge variant="error" dot>Error</Badge>)
      const badge = screen.getByText('Error')
      const dot = badge.querySelector('.rounded-full')
      expect(dot).toHaveClass('bg-red-500')
    })
  })

  describe('accessibility', () => {
    it('supports custom className', () => {
      render(<Badge className="custom-class">Custom</Badge>)
      expect(screen.getByText('Custom')).toHaveClass('custom-class')
    })

    it('forwards ref to span element', () => {
      const ref = { current: null } as React.RefObject<HTMLSpanElement>
      render(<Badge ref={ref}>Ref</Badge>)
      expect(ref.current).toBeInstanceOf(HTMLSpanElement)
    })
  })
})
