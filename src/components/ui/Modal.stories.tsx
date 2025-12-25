import type { Meta, StoryObj } from '@storybook/react'
import { Modal, ModalFooter } from './Modal'
import { Button } from './Button'
import { useState } from 'react'

const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
    showCloseButton: {
      control: 'boolean',
    },
    closeOnOverlayClick: {
      control: 'boolean',
    },
    closeOnEscape: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

// 기본 Modal
export const Default: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <p className="text-sm text-zinc-300">
            This is a basic modal with default settings.
          </p>
        </Modal>
      </>
    )
  },
  args: {
    title: 'Modal Title',
    description: 'This is a modal description',
  },
}

// With Title Only
export const WithTitle: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Confirm Action"
        >
          <p className="text-sm text-zinc-300">
            Are you sure you want to proceed with this action?
          </p>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">Confirm</Button>
          </ModalFooter>
        </Modal>
      </>
    )
  },
}

// With Description
export const WithDescription: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Delete Strategy"
          description="This action cannot be undone"
        >
          <p className="text-sm text-zinc-300">
            Are you sure you want to delete this trading strategy?
            All backtest results and configurations will be permanently removed.
          </p>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger">Delete</Button>
          </ModalFooter>
        </Modal>
      </>
    )
  },
}

// Sizes
export const Small: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Small Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          size="sm"
          title="Small Modal"
        >
          <p className="text-sm text-zinc-300">
            This is a small modal window.
          </p>
        </Modal>
      </>
    )
  },
}

export const Large: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Large Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          size="lg"
          title="Large Modal"
        >
          <p className="text-sm text-zinc-300 mb-4">
            This is a larger modal with more content space.
          </p>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-3 bg-white/[0.02] rounded">
                Item {i}
              </div>
            ))}
          </div>
        </Modal>
      </>
    )
  },
}

export const FullWidth: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Full Width Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          size="full"
          title="Full Width Modal"
        >
          <p className="text-sm text-zinc-300">
            This modal spans nearly the full width of the screen.
          </p>
        </Modal>
      </>
    )
  },
}

// Without Close Button
export const NoCloseButton: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="No Close Button"
          showCloseButton={false}
        >
          <p className="text-sm text-zinc-300">
            This modal has no close button in the header.
          </p>
          <ModalFooter>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </ModalFooter>
        </Modal>
      </>
    )
  },
}

// Real-world Example: Strategy Deletion
export const StrategyDeletion: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Delete Strategy
        </Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Delete Trading Strategy"
          description="This action cannot be undone"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-300">
              Are you sure you want to delete <strong className="text-white">RSI Momentum Strategy</strong>?
            </p>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
              <p className="text-xs text-red-400">
                ⚠️ This will permanently delete:
              </p>
              <ul className="mt-2 text-xs text-red-300 space-y-1 list-disc list-inside">
                <li>12 backtest results</li>
                <li>Strategy configuration</li>
                <li>Performance history</li>
              </ul>
            </div>
          </div>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setIsOpen(false)}>
              Delete Permanently
            </Button>
          </ModalFooter>
        </Modal>
      </>
    )
  },
}

// Real-world Example: Backtest Progress
export const BacktestProgress: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Run Backtest</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Running Backtest"
          description="Please wait while we process your strategy"
          closeOnEscape={false}
          closeOnOverlayClick={false}
          showCloseButton={false}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Progress</span>
                <span className="text-white">45%</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[45%] transition-all duration-300" />
              </div>
            </div>
            <div className="text-xs text-zinc-500">
              <p>Processing historical data...</p>
              <p className="mt-1">Estimated time: 2 minutes</p>
            </div>
          </div>
        </Modal>
      </>
    )
  },
}
