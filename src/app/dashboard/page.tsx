'use client'

import dynamicImport from 'next/dynamic'
import Link from 'next/link'
import {
  RocketLaunchIcon,
  ChartBarIcon,
  LinkIcon,
  Cog6ToothIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { PortfolioHero } from '@/components/dashboard/PortfolioHero'
import { DisclaimerInline } from '@/components/ui/Disclaimer'
import { LiveIndicator } from '@/components/ui/LiveIndicator'
import { useI18n } from '@/i18n/client'
import { clsx } from 'clsx'

export const dynamic = 'force-dynamic'

// ============================================
// CINEMATIC TRADING TERMINAL DASHBOARD
// Supabase + Linear + Bloomberg Inspired
// ============================================

const ActiveStrategies = dynamicImport(
  () => import('@/components/dashboard/ActiveStrategies').then(m => m.ActiveStrategies),
  { ssr: false, loading: () => <div className="skeleton-shimmer h-48 rounded-xl" /> }
)
const PerformanceMetrics = dynamicImport(
  () => import('@/components/dashboard/PerformanceMetrics').then(m => m.PerformanceMetrics),
  { ssr: false, loading: () => <div className="skeleton-shimmer h-64 rounded-xl" /> }
)
const MarketOverview = dynamicImport(
  () => import('@/components/dashboard/MarketOverview').then(m => m.MarketOverview),
  { ssr: false, loading: () => <div className="skeleton-shimmer h-64 rounded-xl" /> }
)
const RecentActivity = dynamicImport(
  () => import('@/components/dashboard/RecentActivity').then(m => m.RecentActivity),
  { ssr: false, loading: () => <div className="skeleton-shimmer h-48 rounded-xl" /> }
)

export default function DashboardProPage() {
  const { t } = useI18n()

  // Demo data - replace with real data from Supabase
  const mockPortfolio = {
    totalValue: 12345.67,
    change: 567.89,
    changePercent: 4.82,
    sparklineData: [100, 102, 98, 105, 110, 108, 115, 120, 118, 125, 130, 128, 135, 140, 138],
  }

  const quickActions = [
    {
      icon: SparklesIcon,
      label: 'AI Strategy',
      description: 'Create with AI',
      href: '/dashboard/ai-strategy',
      shortcut: 'A',
      highlight: true,
    },
    {
      icon: RocketLaunchIcon,
      label: 'New Strategy',
      description: 'Visual Builder',
      href: '/dashboard/strategy-builder',
      shortcut: 'N',
    },
    {
      icon: ChartBarIcon,
      label: 'Run Backtest',
      description: 'Test strategy',
      href: '/dashboard/backtest',
      shortcut: 'B',
    },
    {
      icon: LinkIcon,
      label: 'Connect Broker',
      description: '3-min setup',
      href: '/dashboard/settings/broker',
      shortcut: 'C',
    },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#5E6AD2]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <LiveIndicator status="live" label="Live" />
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              Real-time portfolio monitoring and strategy management
            </p>
          </div>
        </div>

        {/* Hero Section - Portfolio Value */}
        <div
          className="card-cinematic p-8 animate-fade-in"
          style={{ animationDelay: '100ms' }}
        >
          <PortfolioHero
            totalValue={mockPortfolio.totalValue}
            change={mockPortfolio.change}
            changePercent={mockPortfolio.changePercent}
            sparklineData={mockPortfolio.sparklineData}
          />
        </div>

        {/* Quick Actions Bar */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in"
          style={{ animationDelay: '200ms' }}
        >
          {quickActions.map((action, index) => (
            <Link
              key={action.label}
              href={action.href}
              className={clsx(
                'group relative flex items-center gap-3 p-4 rounded-xl',
                'transition-all duration-300',
                'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30',
                action.highlight
                  ? 'bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 hover:border-[#5E6AD2]/50'
                  : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]'
              )}
              style={{ animationDelay: `${(index + 3) * 50}ms` }}
            >
              <div className={clsx(
                'flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300',
                action.highlight
                  ? 'bg-[#5E6AD2]/20 group-hover:bg-[#5E6AD2]/30'
                  : 'bg-white/[0.06] group-hover:bg-white/[0.12]'
              )}>
                <action.icon className={clsx(
                  'w-5 h-5 transition-colors',
                  action.highlight
                    ? 'text-[#5E6AD2] group-hover:text-[#7C8AEA]'
                    : 'text-zinc-400 group-hover:text-white'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx(
                  'text-sm font-medium truncate',
                  action.highlight ? 'text-[#7C8AEA]' : 'text-white'
                )}>
                  {action.label}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {action.description}
                </p>
              </div>
              <kbd className={clsx(
                'hidden sm:block px-1.5 py-0.5 rounded text-[10px] font-mono',
                action.highlight
                  ? 'bg-[#5E6AD2]/20 text-[#7C8AEA]'
                  : 'bg-white/[0.06] text-zinc-500'
              )}>
                {action.shortcut}
              </kbd>
            </Link>
          ))}
        </div>

        {/* Main Content Grid */}
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in"
          style={{ animationDelay: '300ms' }}
        >
          {/* Left Column - Active Strategies (55%) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="card-cinematic p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Active Strategies</h2>
                <Link
                  href="/dashboard/strategies"
                  className="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  View All →
                </Link>
              </div>
              <ActiveStrategies />
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-base font-semibold text-white mb-4">Recent Activity</h2>
              <RecentActivity />
            </div>
          </div>

          {/* Right Column - Performance & Market (45%) */}
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

        {/* Disclaimer */}
        <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <DisclaimerInline />
        </div>
      </div>
    </div>
  )
}
