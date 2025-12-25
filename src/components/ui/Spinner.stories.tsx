import type { Meta, StoryObj } from '@storybook/react'
import { Spinner } from './Spinner'

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'white'],
    },
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

// 기본 Spinner
export const Default: Story = {
  args: {
    size: 'md',
    variant: 'default',
  },
}

export const Primary: Story = {
  args: {
    size: 'md',
    variant: 'primary',
  },
}

export const White: Story = {
  args: {
    size: 'md',
    variant: 'white',
  },
}

// Sizes
export const ExtraSmall: Story = {
  args: {
    size: 'xs',
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    size: 'md',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
  },
}

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
}

// Real-world: Button with Spinner
export const ButtonLoading: Story = {
  render: () => (
    <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg">
      <Spinner size="sm" variant="white" />
      <span>Loading...</span>
    </button>
  ),
}

// Real-world: Centered Loading
export const CenteredLoading: Story = {
  render: () => (
    <div className="flex items-center justify-center p-12 bg-white/[0.02] rounded-lg">
      <div className="text-center space-y-3">
        <Spinner size="lg" variant="primary" />
        <p className="text-sm text-zinc-400">Processing your request...</p>
      </div>
    </div>
  ),
}

// Real-world: Inline Text
export const InlineText: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-sm text-zinc-300">
      <Spinner size="xs" variant="default" />
      <span>Loading data...</span>
    </div>
  ),
}

// All Sizes Comparison
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="xs" />
        <span className="text-xs text-zinc-500">xs</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="sm" />
        <span className="text-xs text-zinc-500">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" />
        <span className="text-xs text-zinc-500">md</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" />
        <span className="text-xs text-zinc-500">lg</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="xl" />
        <span className="text-xs text-zinc-500">xl</span>
      </div>
    </div>
  ),
}

// All Variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" variant="default" />
        <span className="text-xs text-zinc-500">default</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" variant="primary" />
        <span className="text-xs text-zinc-500">primary</span>
      </div>
      <div className="flex flex-col items-center gap-2 p-4 bg-zinc-800 rounded-lg">
        <Spinner size="lg" variant="white" />
        <span className="text-xs text-zinc-500">white</span>
      </div>
    </div>
  ),
}

// Real-world: Backtest Progress
export const BacktestProgress: Story = {
  render: () => (
    <div className="w-80 p-6 bg-white/[0.02] border border-white/[0.06] rounded-xl">
      <div className="flex items-center justify-center mb-4">
        <Spinner size="xl" variant="primary" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-sm font-medium text-white">Running Backtest</h3>
        <p className="text-xs text-zinc-500">Processing 10 years of data...</p>
        <div className="mt-4">
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-primary-500 animate-pulse" />
          </div>
          <p className="mt-2 text-xs text-zinc-400">67% complete</p>
        </div>
      </div>
    </div>
  ),
}
