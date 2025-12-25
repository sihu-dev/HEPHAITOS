import type { Meta, StoryObj } from '@storybook/react'
import { Select } from './Select'

const meta = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'glass'],
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

const sampleOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Orange' },
]

const strategyOptions = [
  { value: 'momentum', label: 'Momentum Strategy' },
  { value: 'mean-reversion', label: 'Mean Reversion' },
  { value: 'trend-following', label: 'Trend Following' },
  { value: 'arbitrage', label: 'Arbitrage' },
]

const timeframeOptions = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
]

// 기본 Select
export const Default: Story = {
  args: {
    options: sampleOptions,
    placeholder: 'Select a fruit',
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Fruit Selection',
    options: sampleOptions,
    placeholder: 'Choose one',
  },
}

export const WithHint: Story = {
  args: {
    label: 'Trading Strategy',
    options: strategyOptions,
    placeholder: 'Select strategy',
    hint: 'Choose the strategy type for your backtest',
  },
}

export const WithError: Story = {
  args: {
    label: 'Strategy Type',
    options: strategyOptions,
    error: 'Please select a strategy',
    placeholder: 'Select strategy',
  },
}

// Variants
export const GlassVariant: Story = {
  args: {
    label: 'Timeframe',
    variant: 'glass',
    options: timeframeOptions,
    placeholder: 'Select timeframe',
  },
}

// States
export const Disabled: Story = {
  args: {
    label: 'Disabled Select',
    options: sampleOptions,
    disabled: true,
    value: 'apple',
  },
}

export const WithDefaultValue: Story = {
  args: {
    label: 'Strategy Type',
    options: strategyOptions,
    value: 'momentum',
  },
}

// Real-world Examples
export const StrategyBuilder: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Select
        label="Strategy Type"
        options={strategyOptions}
        placeholder="Select strategy"
        hint="Choose your trading strategy"
      />
      <Select
        label="Timeframe"
        options={timeframeOptions}
        placeholder="Select timeframe"
      />
      <Select
        label="Risk Level"
        options={[
          { value: 'low', label: 'Low Risk' },
          { value: 'medium', label: 'Medium Risk' },
          { value: 'high', label: 'High Risk' },
        ]}
        placeholder="Select risk level"
      />
    </div>
  ),
}

export const BacktestConfiguration: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Select
        label="Symbol"
        options={[
          { value: 'AAPL', label: 'Apple Inc. (AAPL)' },
          { value: 'MSFT', label: 'Microsoft (MSFT)' },
          { value: 'GOOGL', label: 'Alphabet (GOOGL)' },
          { value: 'TSLA', label: 'Tesla (TSLA)' },
        ]}
        placeholder="Select stock"
      />
      <Select
        label="Timeframe"
        options={timeframeOptions}
        value="1d"
      />
      <Select
        label="Initial Capital"
        options={[
          { value: '10000', label: '$10,000' },
          { value: '50000', label: '$50,000' },
          { value: '100000', label: '$100,000' },
        ]}
        placeholder="Select capital"
      />
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        label="Default Variant"
        variant="default"
        options={sampleOptions}
        placeholder="Select option"
      />
      <Select
        label="Glass Variant"
        variant="glass"
        options={sampleOptions}
        placeholder="Select option"
      />
    </div>
  ),
}
