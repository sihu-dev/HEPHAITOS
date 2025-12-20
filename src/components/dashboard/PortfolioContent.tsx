'use client'


import { useState, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartPieIcon,
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  ScaleIcon,
  ChartBarIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { DisclaimerInline } from '@/components/ui/Disclaimer'
import { useI18n } from '@/i18n/client'
import { useHoldings, type HoldingItem, type PortfolioStats } from '@/hooks/useHoldings'
import { usePortfolioHistory, type Transaction, type PortfolioHistoryPoint } from '@/hooks/usePortfolioHistory'


// ============================================
// Constants
// ============================================

import { CHART_COLORS } from '@/constants/design-tokens'

const COLORS = CHART_COLORS.palette

// ============================================
// Components
// ============================================

const StatCard = memo(function StatCard({
  label,
  value,
  change,
  isPositive,
  icon: Icon,
  iconColor = 'text-zinc-500',
}: {
  label: string
  value: string
  change?: string
  isPositive?: boolean
  icon?: React.ComponentType<{ className?: string }>
  iconColor?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-zinc-400">{label}</p>
        {Icon && <Icon className={clsx('w-4 h-4', iconColor)} />}
      </div>
      <p className="text-xl font-semibold text-white">{value}</p>
      {change && (
        <div className={clsx(
          'flex items-center gap-1 mt-1',
          isPositive ? 'text-emerald-400' : 'text-red-400'
        )}>
          {isPositive ? <ArrowTrendingUpIcon className="w-3.5 h-3.5" /> : <ArrowTrendingDownIcon className="w-3.5 h-3.5" />}
          <span className="text-xs font-medium">{change}</span>
        </div>
      )}
    </motion.div>
  )
})

const EquityChart = memo(function EquityChart({ data }: { data: PortfolioHistoryPoint[] }) {
  const isPositive = data[data.length - 1].value > data[0].value

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? '#34d399' : '#f87171'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isPositive ? '#34d399' : '#f87171'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 10 }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(24, 24, 27, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, '자산']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={isPositive ? '#34d399' : '#f87171'}
            strokeWidth={2}
            fill="url(#portfolioGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})

const AllocationPieChart = memo(function AllocationPieChart({ holdings }: { holdings: HoldingItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <div className="flex items-center gap-6">
      <div className="w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={holdings}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              dataKey="weight"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {holdings.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                  style={{ transition: 'opacity 0.2s' }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-2">
        {holdings.map((h, i) => (
          <div
            key={h.symbol}
            className={clsx(
              'flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer',
              activeIndex === i ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
            )}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: h.color }} />
            <span className="text-xs text-white font-medium">{h.symbol}</span>
            <span className="text-xs text-zinc-400 ml-auto">{h.weight.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
})

const HoldingCard = memo(function HoldingCard({ holding }: { holding: HoldingItem }) {
  const isPositive = holding.profit >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:border-white/[0.12] transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: `${holding.color}20`, borderColor: `${holding.color}40`, borderWidth: 1 }}
          >
            {holding.symbol.slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{holding.symbol}</p>
            <p className="text-xs text-zinc-500">{holding.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-white">${holding.value.toLocaleString()}</p>
          <p className={clsx('text-xs font-medium', isPositive ? 'text-emerald-400' : 'text-red-400')}>
            {isPositive ? '+' : ''}{holding.profitPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">{holding.quantity} @ ${holding.avgPrice.toLocaleString()}</span>
        <span className="text-zinc-400">{holding.sector}</span>
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${holding.weight}%`, backgroundColor: holding.color }}
        />
      </div>
    </motion.div>
  )
})

const TransactionItem = memo(function TransactionItem({ tx }: { tx: Transaction }) {
  const isBuy = tx.type === 'buy'
  const timeAgo = Math.floor((Date.now() - tx.date.getTime()) / (1000 * 60 * 60))

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-3">
        <div className={clsx(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          isBuy ? 'bg-emerald-500/20' : 'bg-red-500/20'
        )}>
          {isBuy ? (
            <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-400" />
          ) : (
            <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />
          )}
        </div>
        <div>
          <p className="text-sm text-white">
            <span className={isBuy ? 'text-emerald-400' : 'text-red-400'}>{isBuy ? '매수' : '매도'}</span>
            {' '}{tx.symbol}
          </p>
          <p className="text-xs text-zinc-500">{tx.quantity}개 @ ${tx.price.toLocaleString()}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-white">${(tx.quantity * tx.price).toLocaleString()}</p>
        <p className="text-xs text-zinc-500">{timeAgo}시간 전</p>
      </div>
    </div>
  )
})

const PerformanceMetric = memo(function PerformanceMetric({
  label,
  value,
  description,
  status,
}: {
  label: string
  value: string
  description: string
  status: 'good' | 'warning' | 'neutral'
}) {
  const statusColors = {
    good: 'text-emerald-400 bg-emerald-500/10',
    warning: 'text-amber-400 bg-amber-500/10',
    neutral: 'text-zinc-400 bg-white/[0.06]',
  }

  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className={clsx('text-xs px-2 py-0.5 rounded', statusColors[status])}>
          {status === 'good' ? '양호' : status === 'warning' ? '주의' : '보통'}
        </span>
      </div>
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{description}</p>
    </div>
  )
})

// ============================================
// Main Page
// ============================================

export function PortfolioContent() {
  const { t } = useI18n()
  const { holdings, stats, isLoading: holdingsLoading, refresh: refreshHoldings } = useHoldings()
  const { history, transactions, isLoading: historyLoading, refresh: refreshHistory } = usePortfolioHistory({ days: 30 })
  const [activeTab, setActiveTab] = useState<'holdings' | 'performance' | 'history'>('holdings')

  const isLoading = holdingsLoading || historyLoading

  const handleRefresh = async () => {
    await Promise.all([refreshHoldings(), refreshHistory()])
  }

  const sectorData = useMemo(() => {
    const sectors: Record<string, number> = {}
    holdings.forEach(h => {
      sectors[h.sector] = (sectors[h.sector] || 0) + h.weight
    })
    return Object.entries(sectors).map(([name, value]) => ({ name, value }))
  }, [holdings])

  const tabs = [
    { id: 'holdings', label: '보유 자산', icon: ChartPieIcon },
    { id: 'performance', label: '성과 분석', icon: ChartBarIcon },
    { id: 'history', label: '거래 내역', icon: ClockIcon },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-white flex items-center gap-2">
            <ChartPieIcon className="w-5 h-5 text-[#7C8AEA]" />
            포트폴리오
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">자산 현황 및 성과 분석</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-50 rounded-lg transition-colors"
        >
          <ArrowPathIcon className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
          새로고침
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-3 w-16 bg-white/[0.06] rounded" />
                  <div className="h-4 w-4 bg-white/[0.06] rounded" />
                </div>
                <div className="h-6 w-24 bg-white/[0.08] rounded mb-1" />
                <div className="h-3 w-16 bg-white/[0.04] rounded" />
              </div>
            ))}
          </>
        ) : (
          <>
            <StatCard
              label="총 자산"
              value={`$${stats.totalValue.toLocaleString()}`}
              change={`${stats.totalProfitPercent >= 0 ? '+' : ''}${stats.totalProfitPercent.toFixed(2)}%`}
              isPositive={stats.totalProfit >= 0}
              icon={BanknotesIcon}
              iconColor="text-emerald-400"
            />
            <StatCard
              label="오늘 수익"
              value={`$${stats.todayProfit.toLocaleString()}`}
              change={`${stats.todayProfitPercent >= 0 ? '+' : ''}${stats.todayProfitPercent.toFixed(2)}%`}
              isPositive={stats.todayProfit >= 0}
              icon={ArrowTrendingUpIcon}
              iconColor={stats.todayProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}
            />
            <StatCard
              label="투자금"
              value={`$${stats.invested.toLocaleString()}`}
              icon={ArrowsRightLeftIcon}
              iconColor="text-blue-400"
            />
            <StatCard
              label="현금"
              value={`$${stats.cash.toLocaleString()}`}
              icon={ScaleIcon}
              iconColor="text-amber-400"
            />
          </>
        )}
      </div>

      {/* Equity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-medium text-white">자산 추이</h2>
            <p className="text-xs text-zinc-500">최근 30일</p>
          </div>
          <div className="flex items-center gap-2">
            {['1W', '1M', '3M', '1Y'].map(period => (
              <button
                key={period}
                type="button"
                className={clsx(
                  'px-2.5 py-1 text-xs rounded transition-colors',
                  period === '1M' ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-white'
                )}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : history.length > 0 ? (
          <EquityChart data={history} />
        ) : (
          <div className="h-64 flex items-center justify-center text-sm text-zinc-500">
            데이터가 없습니다
          </div>
        )}
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-lg w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-all',
              activeTab === tab.id
                ? 'bg-white/[0.08] text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'holdings' && (
          <motion.div
            key="holdings"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Holdings Grid */}
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
              {holdings.map(holding => (
                <HoldingCard key={holding.symbol} holding={holding} />
              ))}
            </div>

            {/* Allocation */}
            <div className="space-y-4">
              <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <h3 className="text-sm font-medium text-white mb-4">자산 배분</h3>
                <AllocationPieChart holdings={holdings} />
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <h3 className="text-sm font-medium text-white mb-3">섹터 분포</h3>
                <div className="space-y-2">
                  {sectorData.map(sector => (
                    <div key={sector.name} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">{sector.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${sector.value}%` }}
                          />
                        </div>
                        <span className="text-xs text-white w-12 text-right">{sector.value.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'performance' && (
          <motion.div
            key="performance"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <PerformanceMetric
              label="샤프 비율"
              value={stats.sharpeRatio.toFixed(2)}
              description="위험 대비 수익률 지표"
              status={stats.sharpeRatio > 2 ? 'good' : stats.sharpeRatio > 1 ? 'neutral' : 'warning'}
            />
            <PerformanceMetric
              label="변동성"
              value={`${stats.volatility.toFixed(1)}%`}
              description="연환산 표준편차"
              status={stats.volatility < 15 ? 'good' : stats.volatility < 25 ? 'neutral' : 'warning'}
            />
            <PerformanceMetric
              label="베타"
              value={stats.beta.toFixed(2)}
              description="시장 대비 민감도"
              status={stats.beta < 1 ? 'good' : stats.beta < 1.5 ? 'neutral' : 'warning'}
            />
            <PerformanceMetric
              label="총 수익"
              value={`$${stats.totalProfit.toLocaleString()}`}
              description="전체 기간 누적 수익"
              status={stats.totalProfit > 0 ? 'good' : 'warning'}
            />
            <PerformanceMetric
              label="수익률"
              value={`+${stats.totalProfitPercent.toFixed(2)}%`}
              description="투자금 대비 수익"
              status={stats.totalProfitPercent > 20 ? 'good' : stats.totalProfitPercent > 0 ? 'neutral' : 'warning'}
            />
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-4 h-4 text-[#7C8AEA]" />
                <span className="text-xs text-[#7C8AEA]">AI 분석</span>
              </div>
              <p className="text-sm text-white mb-1">포트폴리오 건강도</p>
              <p className="text-xs text-zinc-400">
                현재 포트폴리오는 양호한 샤프 비율을 보이고 있으며,
                크립토 자산 비중이 높아 변동성이 다소 큽니다.
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">최근 거래</h3>
              <button type="button" className="text-xs text-[#7C8AEA] hover:text-[#9AA5EF]">
                전체 보기
              </button>
            </div>
            <div>
              {transactions.length > 0 ? (
                transactions.map(tx => (
                  <TransactionItem key={tx.id} tx={tx} />
                ))
              ) : (
                <div className="py-8 text-center text-sm text-zinc-500">
                  거래 내역이 없습니다
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <DisclaimerInline />
    </div>
  )
}
