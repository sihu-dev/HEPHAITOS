'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BacktestRunner } from '@/components/backtest'
import { BacktestWarning, DisclaimerInline } from '@/components/ui/Disclaimer'
import { SimulationWidget } from '@/components/widgets'
import { useI18n } from '@/i18n/client'
import {
  BeakerIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
  ChartBarIcon,
  PlayIcon,
  DocumentChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

// Backtest result type
interface BacktestResult {
  id: string
  strategyName: string
  runDate: Date
  period: { start: string; end: string }
  totalReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  totalTrades: number
  equity: number[]
}

// Sample backtest results (demo)
const sampleResults: BacktestResult[] = [
  {
    id: '1',
    strategyName: 'RSI + MACD Crossover',
    runDate: new Date(Date.now() - 1000 * 60 * 60 * 2),
    period: { start: '2023-01-01', end: '2024-01-01' },
    totalReturn: 23.5,
    sharpeRatio: 1.82,
    maxDrawdown: -12.3,
    winRate: 58.2,
    totalTrades: 127,
    equity: [100, 103, 101, 108, 112, 109, 115, 118, 114, 120, 123.5]
  },
  {
    id: '2',
    strategyName: 'Bollinger Band Mean Reversion',
    runDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
    period: { start: '2023-01-01', end: '2024-01-01' },
    totalReturn: 18.2,
    sharpeRatio: 1.45,
    maxDrawdown: -15.7,
    winRate: 62.1,
    totalTrades: 89,
    equity: [100, 102, 99, 104, 106, 103, 108, 111, 108, 114, 118.2]
  }
]

export default function BacktestPage() {
  const { t } = useI18n()
  const [historyCount] = useState(sampleResults.length)
  const [selectedResult, setSelectedResult] = useState<BacktestResult | null>(null)
  const [showSimulation, setShowSimulation] = useState(false)
  const [activeTab, setActiveTab] = useState<'runner' | 'history' | 'simulation'>('runner')

  const handleResultSelect = useCallback((result: BacktestResult) => {
    setSelectedResult(result)
  }, [])

  const averageReturn = sampleResults.length > 0
    ? sampleResults.reduce((sum, r) => sum + r.totalReturn, 0) / sampleResults.length
    : 0

  const lastRun = sampleResults.length > 0
    ? new Date(Math.max(...sampleResults.map(r => r.runDate.getTime())))
    : null

  const tabs = [
    { id: 'runner', labelKey: 'dashboard.backtest.tabs.runner', icon: PlayIcon },
    { id: 'history', labelKey: 'dashboard.backtest.tabs.history', icon: ClockIcon },
    { id: 'simulation', labelKey: 'dashboard.backtest.tabs.simulation', icon: ChartBarIcon }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-white">{t('dashboard.backtest.title') as string}</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{t('dashboard.backtest.description') as string}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowSimulation(!showSimulation)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-500 hover:to-purple-500 transition-all"
        >
          <SparklesIcon className="w-4 h-4" />
          {showSimulation ? t('dashboard.backtest.closeSimulation') as string : t('dashboard.backtest.aiSimulation') as string}
        </button>
      </div>

      {/* Backtest Warning */}
      <BacktestWarning />

      {/* Simulation Panel */}
      <AnimatePresence>
        {showSimulation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border border-violet-500/20 rounded-lg bg-violet-500/5 p-4">
              <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="w-5 h-5 text-violet-400" />
                <h3 className="text-sm font-medium text-white">{t('dashboard.backtest.aiPortfolioSimulation') as string}</h3>
                <span className="px-2 py-0.5 text-[10px] bg-violet-500/20 text-violet-300 rounded">BETA</span>
              </div>
              <SimulationWidget
                strategyName={selectedResult?.strategyName || (t('dashboard.backtest.defaultStrategy') as string)}
                className="bg-transparent"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-px bg-white/[0.06]" />

      {/* Quick Stats - Flat Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
        <motion.div
          className="space-y-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <BeakerIcon className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-400">{t('dashboard.backtest.stats.totalBacktests') as string}</span>
          </div>
          <p className="text-base font-medium text-white">{(t('dashboard.backtest.stats.runs') as string).replace('{count}', String(historyCount))}</p>
        </motion.div>

        <motion.div
          className="space-y-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-400">{t('dashboard.backtest.stats.avgReturn') as string}</span>
          </div>
          <p className={`text-base font-medium ${averageReturn > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
            {averageReturn > 0 ? '+' : ''}{averageReturn.toFixed(1)}%
          </p>
        </motion.div>

        <motion.div
          className="space-y-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-400">{t('dashboard.backtest.stats.avgSharpe') as string}</span>
          </div>
          <p className="text-base font-medium text-white">
            {sampleResults.length > 0
              ? (sampleResults.reduce((sum, r) => sum + r.sharpeRatio, 0) / sampleResults.length).toFixed(2)
              : '-'}
          </p>
        </motion.div>

        <motion.div
          className="space-y-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-400">{t('dashboard.backtest.stats.lastRun') as string}</span>
          </div>
          <p className="text-base font-medium text-zinc-400">
            {lastRun
              ? (t('dashboard.backtest.stats.hoursAgo') as string).replace('{hours}', String(Math.floor((Date.now() - lastRun.getTime()) / (1000 * 60 * 60))))
              : '-'}
          </p>
        </motion.div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-all ${
              activeTab === tab.id
                ? 'bg-white/[0.08] text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {t(tab.labelKey) as string}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'runner' && (
          <motion.div
            key="runner"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Backtest Runner */}
            <BacktestRunner strategyId="default" />

            {/* Selected Result Preview */}
            <div className="border border-white/[0.06] rounded-lg">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <DocumentChartBarIcon className="w-4 h-4 text-zinc-500" />
                <h3 className="text-sm font-medium text-white">{t('dashboard.backtest.preview.title') as string}</h3>
              </div>

              {selectedResult ? (
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">{t('dashboard.backtest.preview.strategy') as string}</p>
                    <p className="text-sm text-white font-medium">{selectedResult.strategyName}</p>
                  </div>

                  {/* Mini Equity Chart */}
                  <div className="h-24 relative">
                    <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`M 0 ${40 - ((selectedResult.equity[0] - 100) / 30) * 40} ${selectedResult.equity.map((v, i) =>
                          `L ${(i / (selectedResult.equity.length - 1)) * 100} ${40 - ((v - 100) / 30) * 40}`
                        ).join(' ')} L 100 40 L 0 40 Z`}
                        fill="url(#equityGradient)"
                      />
                      <path
                        d={`M 0 ${40 - ((selectedResult.equity[0] - 100) / 30) * 40} ${selectedResult.equity.map((v, i) =>
                          `L ${(i / (selectedResult.equity.length - 1)) * 100} ${40 - ((v - 100) / 30) * 40}`
                        ).join(' ')}`}
                        fill="none"
                        stroke="rgb(16, 185, 129)"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-white/[0.02] rounded">
                      <p className="text-[10px] text-zinc-500">{t('dashboard.backtest.preview.totalReturn') as string}</p>
                      <p className={`text-sm font-medium ${selectedResult.totalReturn > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {selectedResult.totalReturn > 0 ? '+' : ''}{selectedResult.totalReturn}%
                      </p>
                    </div>
                    <div className="p-2 bg-white/[0.02] rounded">
                      <p className="text-[10px] text-zinc-500">{t('dashboard.backtest.preview.sharpe') as string}</p>
                      <p className="text-sm font-medium text-white">{selectedResult.sharpeRatio}</p>
                    </div>
                    <div className="p-2 bg-white/[0.02] rounded">
                      <p className="text-[10px] text-zinc-500">{t('dashboard.backtest.preview.maxDrawdown') as string}</p>
                      <p className="text-sm font-medium text-red-400">{selectedResult.maxDrawdown}%</p>
                    </div>
                    <div className="p-2 bg-white/[0.02] rounded">
                      <p className="text-[10px] text-zinc-500">{t('dashboard.backtest.preview.winRate') as string}</p>
                      <p className="text-sm font-medium text-white">{selectedResult.winRate}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 px-4 text-center">
                  <div className="w-10 h-10 mx-auto mb-4 rounded bg-white/[0.04] flex items-center justify-center">
                    <ChartBarIcon className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-sm text-zinc-400 mb-1">{t('dashboard.backtest.preview.selectResult') as string}</p>
                  <p className="text-xs text-zinc-400">{t('dashboard.backtest.preview.selectResultDesc') as string}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border border-white/[0.06] rounded-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-zinc-500" />
                  <h3 className="text-sm font-medium text-white">{t('dashboard.backtest.history.title') as string}</h3>
                  <span className="text-xs text-zinc-400 ml-1">{(t('dashboard.backtest.history.count') as string).replace('{count}', String(historyCount))}</span>
                </div>
              </div>

              {sampleResults.length > 0 ? (
                <div className="divide-y divide-white/[0.06]">
                  {sampleResults.map((result) => (
                    <motion.div
                      key={result.id}
                      onClick={() => handleResultSelect(result)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedResult?.id === result.id
                          ? 'bg-white/[0.04]'
                          : 'hover:bg-white/[0.02]'
                      }`}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-white">{result.strategyName}</p>
                        <span className={`text-sm font-medium ${result.totalReturn > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {result.totalReturn > 0 ? '+' : ''}{result.totalReturn}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-400">
                        <span>{result.period.start} ~ {result.period.end}</span>
                        <span>•</span>
                        <span>{t('dashboard.backtest.history.sharpe') as string} {result.sharpeRatio}</span>
                        <span>•</span>
                        <span>{(t('dashboard.backtest.history.trades') as string).replace('{count}', String(result.totalTrades))}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-12 px-4 text-center">
                  <div className="w-10 h-10 mx-auto mb-4 rounded bg-white/[0.04] flex items-center justify-center">
                    <BeakerIcon className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-sm text-zinc-400 mb-1">{t('dashboard.backtest.history.empty') as string}</p>
                  <p className="text-xs text-zinc-400 mb-6">{t('dashboard.backtest.history.emptyDesc') as string}</p>
                  <Link
                    href="/dashboard/strategy-builder"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded transition-colors"
                  >
                    {t('dashboard.backtest.history.newStrategy') as string}
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'simulation' && (
          <motion.div
            key="simulation"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <SimulationWidget
              strategyName={selectedResult?.strategyName || (t('dashboard.backtest.portfolioSimulation') as string)}
              className="border border-white/[0.06] rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 면책조항 */}
      <div className="pt-4">
        <DisclaimerInline />
      </div>
    </div>
  )
}
