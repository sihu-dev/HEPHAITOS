import type { Meta, StoryObj } from '@storybook/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card'
import { Button } from './Button'

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'glass', 'interactive', 'primary', 'cinematic', 'metric'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
    },
    glow: {
      control: 'boolean',
    },
    hover: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

// 기본 카드
export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Strategy Performance</CardTitle>
        <CardDescription>View your strategy metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-zinc-400">Total Return</span>
            <span className="text-sm text-green-400">+24.5%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-400">Win Rate</span>
            <span className="text-sm text-white">67.3%</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="secondary" size="sm">View Details</Button>
      </CardFooter>
    </Card>
  ),
}

// 변형 스타일
export const Elevated: Story = {
  args: {
    variant: 'elevated',
  },
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Elevated Card</CardTitle>
        <CardDescription>Enhanced shadow depth</CardDescription>
      </CardHeader>
    </Card>
  ),
}

export const Glass: Story = {
  args: {
    variant: 'glass',
  },
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Glass Morphism</CardTitle>
        <CardDescription>Frosted glass effect with blur</CardDescription>
      </CardHeader>
    </Card>
  ),
}

export const Interactive: Story = {
  args: {
    variant: 'interactive',
  },
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Interactive Card</CardTitle>
        <CardDescription>Hover for animation</CardDescription>
      </CardHeader>
    </Card>
  ),
}

export const Primary: Story = {
  args: {
    variant: 'primary',
  },
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Featured Strategy</CardTitle>
        <CardDescription>Highlighted with accent color</CardDescription>
      </CardHeader>
    </Card>
  ),
}

export const Metric: Story = {
  args: {
    variant: 'metric',
  },
  render: (args) => (
    <Card {...args} className="w-80">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">Total Profit</p>
          <p className="text-2xl font-semibold text-white">$12,450</p>
        </div>
        <div className="text-green-400 text-sm">+15.3%</div>
      </div>
    </Card>
  ),
}

// 패딩 옵션
export const NoPadding: Story = {
  args: {
    padding: 'none',
  },
  render: (args) => (
    <Card {...args} className="w-80 overflow-hidden">
      <div className="h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20" />
      <div className="p-4">
        <CardTitle>Custom Layout</CardTitle>
        <CardDescription>No padding for custom content</CardDescription>
      </div>
    </Card>
  ),
}

// Glow 효과
export const WithGlow: Story = {
  args: {
    variant: 'primary',
    glow: true,
  },
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Glowing Card</CardTitle>
        <CardDescription>Enhanced shadow effect</CardDescription>
      </CardHeader>
    </Card>
  ),
}

// 전체 조합
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4">
      <Card variant="default" padding="md" className="w-60">
        <CardTitle>Default</CardTitle>
      </Card>
      <Card variant="elevated" padding="md" className="w-60">
        <CardTitle>Elevated</CardTitle>
      </Card>
      <Card variant="glass" padding="md" className="w-60">
        <CardTitle>Glass</CardTitle>
      </Card>
      <Card variant="interactive" padding="md" className="w-60">
        <CardTitle>Interactive</CardTitle>
      </Card>
      <Card variant="primary" padding="md" className="w-60">
        <CardTitle>Primary</CardTitle>
      </Card>
      <Card variant="metric" padding="md" className="w-60">
        <CardTitle>Metric</CardTitle>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
}
