import type { Meta, StoryObj } from '@storybook/react'
import { Tooltip } from './Tooltip'
import { Button } from './Button'
import { QuestionMarkCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
    delay: {
      control: 'number',
    },
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

// 기본 Tooltip
export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    children: <Button variant="secondary">Hover me</Button>,
  },
}

// Positions
export const Top: Story = {
  args: {
    content: 'Tooltip on top',
    position: 'top',
    children: <Button variant="secondary">Top</Button>,
  },
}

export const Bottom: Story = {
  args: {
    content: 'Tooltip on bottom',
    position: 'bottom',
    children: <Button variant="secondary">Bottom</Button>,
  },
}

export const Left: Story = {
  args: {
    content: 'Tooltip on left',
    position: 'left',
    children: <Button variant="secondary">Left</Button>,
  },
}

export const Right: Story = {
  args: {
    content: 'Tooltip on right',
    position: 'right',
    children: <Button variant="secondary">Right</Button>,
  },
}

// With Icon
export const IconTooltip: Story = {
  args: {
    content: 'Click for more information',
    children: (
      <button className="p-2 text-zinc-500 hover:text-white transition-colors">
        <QuestionMarkCircleIcon className="w-5 h-5" />
      </button>
    ),
  },
}

// Long Content
export const LongContent: Story = {
  args: {
    content: 'This is a longer tooltip with more detailed information',
    children: <Button variant="secondary">Hover for details</Button>,
  },
}

// No Delay
export const NoDelay: Story = {
  args: {
    content: 'Appears instantly',
    delay: 0,
    children: <Button variant="secondary">No delay</Button>,
  },
}

// Long Delay
export const LongDelay: Story = {
  args: {
    content: 'Takes 1 second',
    delay: 1000,
    children: <Button variant="secondary">Long delay</Button>,
  },
}

// Real-world: Help Icon
export const HelpIcon: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-300">Strategy Type</span>
      <Tooltip content="Select your trading strategy type">
        <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <InformationCircleIcon className="w-4 h-4" />
        </button>
      </Tooltip>
    </div>
  ),
}

// Real-world: Form Field
export const FormFieldTooltip: Story = {
  render: () => (
    <div className="w-64 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-zinc-400">Initial Capital</label>
        <Tooltip content="The amount you start trading with" position="left">
          <button className="text-zinc-500 hover:text-zinc-300">
            <QuestionMarkCircleIcon className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
      <input
        type="text"
        className="w-full h-11 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white"
        placeholder="$10,000"
      />
    </div>
  ),
}

// All Positions Demo
export const AllPositions: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-8">
      <Tooltip content="Top tooltip" position="top">
        <Button variant="secondary">Top</Button>
      </Tooltip>
      <div className="flex items-center gap-8">
        <Tooltip content="Left tooltip" position="left">
          <Button variant="secondary">Left</Button>
        </Tooltip>
        <Tooltip content="Right tooltip" position="right">
          <Button variant="secondary">Right</Button>
        </Tooltip>
      </div>
      <Tooltip content="Bottom tooltip" position="bottom">
        <Button variant="secondary">Bottom</Button>
      </Tooltip>
    </div>
  ),
}
