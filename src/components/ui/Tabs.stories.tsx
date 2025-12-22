import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'
import { ChartBarIcon, ClockIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

// 기본 Tabs
export const Default: Story = {
  render: () => (
    <div className="w-96">
      <Tabs defaultValue="overview">
        <TabsList variant="default">
          <TabsTrigger value="overview" variant="default">Overview</TabsTrigger>
          <TabsTrigger value="code" variant="default">Code</TabsTrigger>
          <TabsTrigger value="settings" variant="default">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <p className="text-sm text-zinc-300">Overview content goes here</p>
        </TabsContent>
        <TabsContent value="code">
          <p className="text-sm text-zinc-300">Code content goes here</p>
        </TabsContent>
        <TabsContent value="settings">
          <p className="text-sm text-zinc-300">Settings content goes here</p>
        </TabsContent>
      </Tabs>
    </div>
  ),
}

// Pills Variant
export const Pills: Story = {
  render: () => (
    <div className="w-96">
      <Tabs defaultValue="performance">
        <TabsList variant="pills">
          <TabsTrigger value="performance" variant="pills">Performance</TabsTrigger>
          <TabsTrigger value="trades" variant="pills">Trades</TabsTrigger>
          <TabsTrigger value="risk" variant="pills">Risk</TabsTrigger>
        </TabsList>
        <TabsContent value="performance">
          <div className="p-4 bg-white/[0.02] rounded-lg">
            <p className="text-sm text-zinc-300">Performance metrics</p>
          </div>
        </TabsContent>
        <TabsContent value="trades">
          <div className="p-4 bg-white/[0.02] rounded-lg">
            <p className="text-sm text-zinc-300">Trade history</p>
          </div>
        </TabsContent>
        <TabsContent value="risk">
          <div className="p-4 bg-white/[0.02] rounded-lg">
            <p className="text-sm text-zinc-300">Risk analysis</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  ),
}

// Underline Variant
export const Underline: Story = {
  render: () => (
    <div className="w-96">
      <Tabs defaultValue="strategy">
        <TabsList variant="underline">
          <TabsTrigger value="strategy" variant="underline">Strategy</TabsTrigger>
          <TabsTrigger value="backtest" variant="underline">Backtest</TabsTrigger>
          <TabsTrigger value="live" variant="underline">Live</TabsTrigger>
        </TabsList>
        <TabsContent value="strategy">
          <p className="text-sm text-zinc-300">Strategy configuration</p>
        </TabsContent>
        <TabsContent value="backtest">
          <p className="text-sm text-zinc-300">Backtest results</p>
        </TabsContent>
        <TabsContent value="live">
          <p className="text-sm text-zinc-300">Live trading</p>
        </TabsContent>
      </Tabs>
    </div>
  ),
}

// With Icons
export const WithIcons: Story = {
  render: () => (
    <div className="w-96">
      <Tabs defaultValue="chart">
        <TabsList variant="default">
          <TabsTrigger
            value="chart"
            variant="default"
            icon={<ChartBarIcon className="w-4 h-4" />}
          >
            Chart
          </TabsTrigger>
          <TabsTrigger
            value="history"
            variant="default"
            icon={<ClockIcon className="w-4 h-4" />}
          >
            History
          </TabsTrigger>
          <TabsTrigger
            value="config"
            variant="default"
            icon={<Cog6ToothIcon className="w-4 h-4" />}
          >
            Config
          </TabsTrigger>
        </TabsList>
        <TabsContent value="chart">
          <p className="text-sm text-zinc-300">Chart view</p>
        </TabsContent>
        <TabsContent value="history">
          <p className="text-sm text-zinc-300">Trade history</p>
        </TabsContent>
        <TabsContent value="config">
          <p className="text-sm text-zinc-300">Configuration</p>
        </TabsContent>
      </Tabs>
    </div>
  ),
}

// Real-world: Strategy Dashboard
export const StrategyDashboard: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <Tabs defaultValue="overview">
        <TabsList variant="underline">
          <TabsTrigger value="overview" variant="underline">Overview</TabsTrigger>
          <TabsTrigger value="performance" variant="underline">Performance</TabsTrigger>
          <TabsTrigger value="trades" variant="underline">Trades</TabsTrigger>
          <TabsTrigger value="settings" variant="underline">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white/[0.02] rounded-lg">
                <p className="text-xs text-zinc-500">Total Return</p>
                <p className="text-2xl font-semibold text-green-400">+24.5%</p>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-lg">
                <p className="text-xs text-zinc-500">Win Rate</p>
                <p className="text-2xl font-semibold text-white">67.3%</p>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-lg">
                <p className="text-xs text-zinc-500">Max Drawdown</p>
                <p className="text-2xl font-semibold text-red-400">-12.8%</p>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="performance">
          <p className="text-sm text-zinc-300">Performance metrics and charts</p>
        </TabsContent>
        <TabsContent value="trades">
          <p className="text-sm text-zinc-300">List of all trades</p>
        </TabsContent>
        <TabsContent value="settings">
          <p className="text-sm text-zinc-300">Strategy settings</p>
        </TabsContent>
      </Tabs>
    </div>
  ),
}
