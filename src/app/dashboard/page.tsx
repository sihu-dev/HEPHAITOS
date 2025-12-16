'use client'

import dynamicImport from 'next/dynamic'
import Link from 'next/link'
import {
  RocketLaunchIcon,
  ChartBarIcon,
  LinkIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { PortfolioHero } from '@/components/dashboard/PortfolioHero'
import { CommandPalette } from '@/components/dashboard/CommandPalette'
import { DisclaimerInline } from '@/components/ui/Disclaimer'
import { useI18n } from '@/i18n/client'

export const dynamic = 'force-dynamic'

// ============================================
// PRO-LEVEL DASHBOARD
// Robinhood + TradingView + Linear Inspired
// ============================================

const ActiveStrategies = dynamicImport(
  () => import('@/components/dashboard/ActiveStrategies').then(m => m.ActiveStrategies),
  { ssr: false }
)
const PerformanceMetrics = dynamicImport(
  () => import('@/components/dashboard/PerformanceMetrics').then(m => m.PerformanceMetrics),
  { ssr: false }
)
const MarketOverview = dynamicImport(
  () => import('@/components/dashboard/MarketOverview').then(m => m.MarketOverview),
  { ssr: false }
)
const RecentActivity = dynamicImport(
  () => import('@/components/dashboard/RecentActivity').then(m => m.RecentActivity),
  { ssr: false }
)

export default function DashboardProPage() {
  const { t } = useI18n()

  // Mock data - replace with real data from API
  const mockPortfolio = {
    totalValue: 12345.67,
    change: 567.89,
    changePercent: 4.82,
    sparklineData: [100, 102, 98, 105, 110, 108, 115, 120, 118, 125],
  }

  const quickActions = [
    {
      icon: RocketLaunchIcon,
      label: 'New Strategy',
      href: '/dashboard/strategy-builder',
      shortcut: 'N',
    },
    {
      icon: ChartBarIcon,
      label: 'Run Backtest',
      href: '/dashboard/backtest',
      shortcut: 'B',
    },
    {
      icon: LinkIcon,
      label: 'Connect Broker',
      href: '/dashboard/settings/broker',
      shortcut: 'C',
    },
    {
      icon: Cog6ToothIcon,
      label: 'Settings',
      href: '/dashboard/settings',
      shortcut: 'S',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Command Palette (Cmd+K) */}
      <CommandPalette />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Dashboard</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Welcome back! Here's your portfolio overview.
            </p>
          </div>
          <CommandPalette />
        </div>

        {/* Hero Section - Portfolio Value */}
        <div className="bg-gradient-to-r from-[#141416] to-[#1C1C1F] border border-white/[0.08] rounded-xl p-8 backdrop-blur-xl">
          <PortfolioHero
            totalValue={mockPortfolio.totalValue}
            change={mockPortfolio.change}
            changePercent={mockPortfolio.changePercent}
            sparklineData={mockPortfolio.sparklineData}
          />
        </div>

        {/* Quick Actions Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group relative flex items-center gap-3 p-4 bg-[#141416] border border-white/[0.08] rounded-xl hover:border-white/[0.16] hover:bg-[#1C1C1F] transition-all duration-200"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/[0.06] rounded-lg group-hover:bg-white/[0.12] transition-colors">
                <action.icon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {action.label}
                </p>
                <p className="text-xs text-zinc-400">
                  Shortcut: <kbd className="px-1 py-0.5 bg-white/[0.08] rounded text-[10px]">{action.shortcut}</kbd>
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Active Strategies (60%) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Active Strategies</h2>
                <Link
                  href="/dashboard/strategies"
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  View All →
                </Link>
              </div>
              <ActiveStrategies />
            </div>
          </div>

          {/* Right Column - Performance & Market (40%) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white mb-4">Performance</h2>
              <PerformanceMetrics />
            </div>

            <div>
              <h2 className="text-base font-semibold text-white mb-4">Market Overview</h2>
              <MarketOverview />
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div>
          <h2 className="text-base font-semibold text-white mb-4">Recent Activity</h2>
          <RecentActivity />
        </div>

        {/* Disclaimer */}
        <DisclaimerInline />
      </div>
    </div>
  )
}
