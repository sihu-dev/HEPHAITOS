// ============================================
// Card Component Tests
// ============================================

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'

describe('Card', () => {
  describe('rendering', () => {
    it('renders with default props', () => {
      render(<Card data-testid="card">Content</Card>)
      expect(screen.getByTestId('card')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('renders children correctly', () => {
      render(
        <Card>
          <span data-testid="child">Child content</span>
        </Card>
      )
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })
  })

  describe('variants', () => {
    it('renders default variant', () => {
      render(<Card data-testid="card">Default</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('bg-white/[0.02]')
    })

    it('renders glass variant', () => {
      render(<Card variant="glass" data-testid="card">Glass</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('backdrop-blur-xl')
    })

    it('renders interactive variant', () => {
      render(<Card variant="interactive" data-testid="card">Interactive</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('cursor-pointer')
    })

    it('renders elevated variant', () => {
      render(<Card variant="elevated" data-testid="card">Elevated</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('shadow-xl')
    })
  })

  describe('padding', () => {
    it('renders with default padding', () => {
      render(<Card data-testid="card">Padded</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('p-4')
    })

    it('renders with no padding', () => {
      render(<Card padding="none" data-testid="card">No padding</Card>)
      const card = screen.getByTestId('card')
      expect(card).not.toHaveClass('p-4')
    })

    it('renders with large padding', () => {
      render(<Card padding="lg" data-testid="card">Large</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('p-5')
    })
  })

  describe('accessibility', () => {
    it('supports custom className', () => {
      render(<Card className="custom-class" data-testid="card">Custom</Card>)
      expect(screen.getByTestId('card')).toHaveClass('custom-class')
    })

    it('forwards ref to div element', () => {
      const ref = { current: null } as React.RefObject<HTMLDivElement>
      render(<Card ref={ref}>Ref</Card>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })
})

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header Content</CardHeader>)
    expect(screen.getByText('Header Content')).toBeInTheDocument()
  })
})

describe('CardTitle', () => {
  it('renders as h3 by default', () => {
    render(<CardTitle>Title</CardTitle>)
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
  })

  it('renders with correct text', () => {
    render(<CardTitle>My Title</CardTitle>)
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })
})

describe('CardDescription', () => {
  it('renders description text', () => {
    render(<CardDescription>Description text</CardDescription>)
    expect(screen.getByText('Description text')).toBeInTheDocument()
  })
})

describe('CardContent', () => {
  it('renders content', () => {
    render(<CardContent>Main content</CardContent>)
    expect(screen.getByText('Main content')).toBeInTheDocument()
  })
})

describe('CardFooter', () => {
  it('renders footer content', () => {
    render(<CardFooter>Footer content</CardFooter>)
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })
})

describe('Card composition', () => {
  it('renders full card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent>Main content here</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>
    )

    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card description')).toBeInTheDocument()
    expect(screen.getByText('Main content here')).toBeInTheDocument()
    expect(screen.getByText('Footer actions')).toBeInTheDocument()
  })
})
