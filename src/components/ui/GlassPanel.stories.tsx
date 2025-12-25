import type { Meta, StoryObj } from '@storybook/react'
import { GlassPanel } from './GlassPanel'

const meta = {
  title: 'UI/GlassPanel',
  component: GlassPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    intensity: {
      control: 'select',
      options: ['light', 'medium', 'strong', 'ultra'],
    },
    variant: {
      control: 'select',
      options: ['neutral', 'primary', 'profit', 'loss'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
    },
    rounded: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl', 'full'],
    },
    glow: {
      control: 'boolean',
    },
    border: {
      control: 'boolean',
    },
    hover: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof GlassPanel>

export default meta
type Story = StoryObj<typeof meta>

// 기본 Panel
export const Default: Story = {
  args: {
    children: <p className="text-sm text-zinc-300">Glass Panel Content</p>,
  },
}

// Intensity Levels
export const Light: Story = {
  args: {
    intensity: 'light',
    children: <p className="text-sm text-zinc-300">Light intensity</p>,
  },
}

export const Medium: Story = {
  args: {
    intensity: 'medium',
    children: <p className="text-sm text-zinc-300">Medium intensity</p>,
  },
}

export const Strong: Story = {
  args: {
    intensity: 'strong',
    children: <p className="text-sm text-zinc-300">Strong intensity</p>,
  },
}

export const Ultra: Story = {
  args: {
    intensity: 'ultra',
    children: <p className="text-sm text-zinc-300">Ultra intensity</p>,
  },
}

// Variants
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: <p className="text-sm text-white">Primary variant</p>,
  },
}

export const Profit: Story = {
  args: {
    variant: 'profit',
    children: <p className="text-sm text-emerald-400">+24.5% Profit</p>,
  },
}

export const Loss: Story = {
  args: {
    variant: 'loss',
    children: <p className="text-sm text-red-400">-12.3% Loss</p>,
  },
}

// With Glow
export const WithGlow: Story = {
  args: {
    variant: 'primary',
    glow: true,
    children: <p className="text-sm text-white">Panel with glow effect</p>,
  },
}

// Hover Effect
export const Hoverable: Story = {
  args: {
    hover: true,
    children: <p className="text-sm text-zinc-300">Hover over me</p>,
  },
}

// Cinematic
export const Cinematic: Story = {
  args: {
    cinematic: true,
    children: (
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Cinematic Panel</h3>
        <p className="text-sm text-zinc-400">Special glass effect with multiple layers</p>
      </div>
    ),
  },
}

// Real-world: Trading Card
export const TradingCard: Story = {
  render: () => (
    <div className="w-80">
      <GlassPanel intensity="medium" variant="neutral" padding="lg">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">AAPL</span>
            <span className="text-xs text-emerald-400">+2.5%</span>
          </div>
          <div>
            <p className="text-2xl font-semibold text-white">$142.50</p>
            <p className="text-xs text-zinc-500 mt-0.5">Apple Inc.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06]">
            <div>
              <p className="text-xs text-zinc-500">Open</p>
              <p className="text-sm text-white">$139.20</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">High</p>
              <p className="text-sm text-white">$143.10</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Low</p>
              <p className="text-sm text-white">$138.50</p>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  ),
}

// All Intensities
export const AllIntensities: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <GlassPanel intensity="light" padding="md">
        <p className="text-xs text-zinc-400">Light</p>
      </GlassPanel>
      <GlassPanel intensity="medium" padding="md">
        <p className="text-xs text-zinc-400">Medium</p>
      </GlassPanel>
      <GlassPanel intensity="strong" padding="md">
        <p className="text-xs text-zinc-400">Strong</p>
      </GlassPanel>
      <GlassPanel intensity="ultra" padding="md">
        <p className="text-xs text-zinc-400">Ultra</p>
      </GlassPanel>
    </div>
  ),
}
