// ============================================
// Tabs Component Tests
// ============================================

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'

describe('Tabs', () => {
  const renderTabs = (props = {}) => {
    return render(
      <Tabs defaultValue="tab1" {...props}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    )
  }

  describe('rendering', () => {
    it('renders tabs', () => {
      renderTabs()
      expect(screen.getByRole('tablist')).toBeInTheDocument()
      expect(screen.getAllByRole('tab')).toHaveLength(3)
    })

    it('renders tab triggers', () => {
      renderTabs()
      expect(screen.getByText('Tab 1')).toBeInTheDocument()
      expect(screen.getByText('Tab 2')).toBeInTheDocument()
      expect(screen.getByText('Tab 3')).toBeInTheDocument()
    })

    it('renders default tab content', () => {
      renderTabs()
      expect(screen.getByText('Content 1')).toBeInTheDocument()
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('switches tabs on click', () => {
      renderTabs()

      fireEvent.click(screen.getByText('Tab 2'))

      expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
      expect(screen.getByText('Content 2')).toBeInTheDocument()
    })

    it('calls onValueChange when tab changes', () => {
      const handleChange = vi.fn()
      renderTabs({ onValueChange: handleChange })

      fireEvent.click(screen.getByText('Tab 2'))

      expect(handleChange).toHaveBeenCalledWith('tab2')
    })

    it('supports controlled value', () => {
      const handleChange = vi.fn()
      const { rerender } = render(
        <Tabs defaultValue="tab1" value="tab1" onValueChange={handleChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      expect(screen.getByText('Content 1')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Tab 2'))
      expect(handleChange).toHaveBeenCalledWith('tab2')

      // Still shows tab 1 because controlled
      expect(screen.getByText('Content 1')).toBeInTheDocument()

      // Update controlled value
      rerender(
        <Tabs defaultValue="tab1" value="tab2" onValueChange={handleChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      expect(screen.getByText('Content 2')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has correct ARIA attributes on triggers', () => {
      renderTabs()
      const tab1 = screen.getByText('Tab 1')
      const tab2 = screen.getByText('Tab 2')

      expect(tab1).toHaveAttribute('role', 'tab')
      expect(tab1).toHaveAttribute('aria-selected', 'true')
      expect(tab2).toHaveAttribute('aria-selected', 'false')
    })

    it('has correct tabIndex', () => {
      renderTabs()
      const tab1 = screen.getByText('Tab 1')
      const tab2 = screen.getByText('Tab 2')

      expect(tab1).toHaveAttribute('tabIndex', '0')
      expect(tab2).toHaveAttribute('tabIndex', '-1')
    })

    it('has tabpanel role on content', () => {
      renderTabs()
      expect(screen.getByRole('tabpanel')).toBeInTheDocument()
    })

    it('connects trigger to panel via aria-controls', () => {
      renderTabs()
      const tab1 = screen.getByText('Tab 1')
      const panel = screen.getByRole('tabpanel')

      expect(tab1).toHaveAttribute('aria-controls', panel.id)
      expect(panel).toHaveAttribute('aria-labelledby', tab1.id)
    })
  })

  describe('disabled state', () => {
    it('can disable individual tabs', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      const tab2 = screen.getByText('Tab 2')
      expect(tab2).toBeDisabled()

      fireEvent.click(tab2)
      // Content should not change
      expect(screen.getByText('Content 1')).toBeInTheDocument()
    })
  })

  describe('variants', () => {
    it('renders default variant', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList variant="default" data-testid="tablist">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )

      const tablist = screen.getByTestId('tablist')
      expect(tablist).toHaveClass('bg-white/[0.02]')
    })

    it('renders pills variant', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList variant="pills" data-testid="tablist">
            <TabsTrigger value="tab1" variant="pills">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )

      const tablist = screen.getByTestId('tablist')
      expect(tablist).toHaveClass('gap-2')
    })

    it('renders underline variant', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList variant="underline" data-testid="tablist">
            <TabsTrigger value="tab1" variant="underline">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )

      const tablist = screen.getByTestId('tablist')
      expect(tablist).toHaveClass('border-b')
    })
  })
})
