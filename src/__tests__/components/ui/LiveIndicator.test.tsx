// ============================================
// LiveIndicator Component Tests
// ============================================

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LiveIndicator } from '@/components/ui/LiveIndicator'

describe('LiveIndicator', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<LiveIndicator />)
      expect(document.querySelector('.inline-flex')).toBeInTheDocument()
    })

    it('renders with label', () => {
      render(<LiveIndicator label="Live" />)
      expect(screen.getByText('Live')).toBeInTheDocument()
    })

    it('renders default label when label is empty string', () => {
      render(<LiveIndicator label="" status="live" />)
      expect(screen.getByText('Live')).toBeInTheDocument()
    })
  })

  describe('status', () => {
    it('renders live status by default', () => {
      render(<LiveIndicator label="" />)
      expect(screen.getByText('Live')).toBeInTheDocument()
    })

    it('renders connecting status', () => {
      render(<LiveIndicator status="connecting" label="" />)
      expect(screen.getByText('Connecting')).toBeInTheDocument()
    })

    it('renders offline status', () => {
      render(<LiveIndicator status="offline" label="" />)
      expect(screen.getByText('Offline')).toBeInTheDocument()
    })

    it('applies correct color for live status', () => {
      render(<LiveIndicator status="live" label="Test" />)
      const label = screen.getByText('Test')
      expect(label).toHaveClass('text-emerald-400')
    })

    it('applies correct color for connecting status', () => {
      render(<LiveIndicator status="connecting" label="Test" />)
      const label = screen.getByText('Test')
      expect(label).toHaveClass('text-amber-400')
    })

    it('applies correct color for offline status', () => {
      render(<LiveIndicator status="offline" label="Test" />)
      const label = screen.getByText('Test')
      expect(label).toHaveClass('text-zinc-500')
    })
  })

  describe('sizes', () => {
    it('renders sm size', () => {
      const { container } = render(<LiveIndicator size="sm" />)
      expect(container.querySelector('.w-1\\.5')).toBeInTheDocument()
    })

    it('renders md size by default', () => {
      const { container } = render(<LiveIndicator />)
      expect(container.querySelector('.w-2')).toBeInTheDocument()
    })

    it('renders lg size', () => {
      const { container } = render(<LiveIndicator size="lg" />)
      expect(container.querySelector('.w-2\\.5')).toBeInTheDocument()
    })
  })

  describe('custom props', () => {
    it('applies custom className', () => {
      const { container } = render(<LiveIndicator className="custom-class" />)
      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })

    it('uses custom label over default', () => {
      render(<LiveIndicator status="live" label="Custom Label" />)
      expect(screen.getByText('Custom Label')).toBeInTheDocument()
    })
  })
})
