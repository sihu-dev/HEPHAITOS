import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './Badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error', 'danger', 'info', 'profit', 'loss', 'outline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    dot: {
      control: 'boolean',
    },
    outline: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

// 기본 Badges
export const Default: Story = {
  args: {
    children: 'Default',
    variant: 'default',
  },
}

export const Primary: Story = {
  args: {
    children: 'Primary',
    variant: 'primary',
  },
}

export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
}

export const Warning: Story = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
}

export const Error: Story = {
  args: {
    children: 'Error',
    variant: 'error',
  },
}

export const Info: Story = {
  args: {
    children: 'Info',
    variant: 'info',
  },
}

// Trading Variants
export const Profit: Story = {
  args: {
    children: '+24.5%',
    variant: 'profit',
  },
}

export const Loss: Story = {
  args: {
    children: '-12.3%',
    variant: 'loss',
  },
}

// With Dot
export const WithDot: Story = {
  args: {
    children: 'Live',
    variant: 'success',
    dot: true,
  },
}

export const ProfitWithDot: Story = {
  args: {
    children: 'Profitable',
    variant: 'profit',
    dot: true,
  },
}

// Sizes
export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    children: 'Medium',
    size: 'md',
  },
}

export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg',
  },
}

// Outline
export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
}

// 실전 예시
export const StrategyStatus: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge variant="success" dot>Active</Badge>
      <Badge variant="warning" dot>Paused</Badge>
      <Badge variant="error" dot>Failed</Badge>
    </div>
  ),
}

export const PerformanceMetrics: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-400 w-20">Total Return</span>
        <Badge variant="profit">+45.2%</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-400 w-20">Max DD</span>
        <Badge variant="loss">-15.8%</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-400 w-20">Win Rate</span>
        <Badge variant="success">67.3%</Badge>
      </div>
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="profit">Profit</Badge>
      <Badge variant="loss">Loss</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success" dot>With Dot</Badge>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
}
