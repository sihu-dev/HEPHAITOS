'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BacktestRunner } from '@/components/backtest'
import { BacktestWarning, DisclaimerInline } from '@/components/ui/Disclaimer'
import { SimulationWidget } from '@/components/widgets'
import { useI18n } from '@/i18n/client'
import { useBacktestResults, type BacktestResult } from '@/hooks/useBacktestResults'
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

export function BacktestContent() {
  const { t } = useI18n()
  const { results, isLoading, stats } = useBacktestResults({ status: 'completed', limit: 20 })
  const [selectedResult, setSelectedResult] = useState<BacktestResult | null>(null)
  const [showSimulation, setShowSimulation] = useState(false)
  const [activeTab, setActiveTab] = useState<'runner' | 'history' | 'simulation'>('runner')

  const handleResultSelect = useCallback((result: BacktestResult) => {
    setSelectedResult(result)
  }, [])

  const tabs = [
    { id: 'runner', labelKey: 'dashboard.backtest.tabs.runner', icon: PlayIcon },
    { id: 'history', labelKey: 'dashboard.backtest.tabs.history', icon: ClockIcon },
    { id: 'simulation', labelKey: 'dashboard.backtest.tabs.simulation', icon: ChartBarIcon }
  ]

  // Format relative time
  const formatRelativeTime = (date: Date | null) => {
    if (!date) return '-'
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60))
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

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
          {isLoading ? (
            <div className="h-5 w-16 bg-white/[0.06] rounded animate-pulse" />
          ) : (
            <p className="text-base font-medium text-white">{(t('dashboard.backtest.stats.runs') as string).replace('{count}', String(stats.totalRuns))}</p>
          )}
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
          {isLoading ? (
            <div className="h-5 w-16 bg-white/[0.06] rounded animate-pulse" />
          ) : (
            <p className={`text-base font-medium ${stats.avgReturn > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
              {stats.avgReturn > 0 ? '+' : ''}{stats.avgReturn.toFixed(1)}%
            </p>
          )}
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
          {isLoading ? (
            <div className="h-5 w-16 bg-white/[0.06] rounded animate-pulse" />
          ) : (
            <p className="text-base font-medium text-white">
              {stats.avgSharpe > 0 ? stats.avgSharpe.toFixed(2) : '-'}
            </p>
          )}
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
          {isLoading ? (
            <div className="h-5 w-16 bg-white/[0.06] rounded animate-pulse" />
          ) : (
            <p className="text-base font-medium text-zinc-400">
              {formatRelativeTime(stats.lastRunAt)}
            </p>
          )}
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
                  {selectedResult.equityCurve.length > 0 && (
                    <div className="h-24 relative">
                      <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d={`M 0 ${40 - ((selectedResult.equityCurve[0] - 100) / 30) * 40} ${selectedResult.equityCurve.map((v, i) =>
                            `L ${(i / (selectedResult.equityCurve.length - 1)) * 100} ${40 - ((v - 100) / 30) * 40}`
                          ).join(' ')} L 100 40 L 0 40 Z`}
                          fill="url(#equityGradient)"
                        />
                        <path
                          d={`M 0 ${40 - ((selectedResult.equityCurve[0] - 100) / 30) * 40} ${selectedResult.equityCurve.map((v, i) =>
                            `L ${(i / (selectedResult.equityCurve.length - 1)) * 100} ${40 - ((v - 100) / 30) * 40}`
                          ).join(' ')}`}
                          fill="none"
                          stroke="rgb(16, 185, 129)"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-white/[0.02] rounded">
                      <p className="text-[10px] text-zinc-500">{t('dashboard.backtest.preview.totalReturn') as string}</p>
                      <p className={`text-sm font-medium ${(selectedResult.performance?.totalReturn ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(selectedResult.performance?.totalReturn ?? 0) > 0 ? '+' : ''}{selectedResult.performance?.totalReturn?.toFixed(1) ?? 0}%
                      </p>
                    </div>
                    <div className="p-2 bg-white/[0.02] rounded">
                      <p className="text-[10px] text-zinc-500">{t('dashboard.backtest.preview.sharpe') as string}</p>
                      <p className="text-sm font-medium text-white">{selectedResult.performance?.sharpeRatio?.toFixed(2) ?? '-'}</p>
                    </div>
                    <div className="p-2 bg-white/[0.02] rounded">
                      <p className="text-[10px] text-zinc-500">{t('dashboard.backtest.preview.maxDrawdown') as string}</p>
                      <p className="text-sm font-medium text-red-400">{selectedResult.performance?.maxDrawdown?.toFixed(1) ?? 0}%</p>
                    </div>
                    <div className="p-2 bg-white/[0.02] rounded">
                      <p className="text-[10px] text-zinc-500">{t('dashboard.backtest.preview.winRate') as string}</p>
                      <p className="text-sm font-medium text-white">{selectedResult.performance?.winRate?.toFixed(1) ?? 0}%</p>
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
                  <span className="text-xs text-zinc-400 ml-1">{(t('dashboard.backtest.history.count') as string).replace('{count}', String(results.length))}</span>
                </div>
              </div>

              {isLoading ? (
                <div className="divide-y divide-white/[0.06]">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 animate-pulse">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 w-40 bg-white/[0.06] rounded" />
                        <div className="h-4 w-16 bg-white/[0.06] rounded" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-3 w-32 bg-white/[0.04] rounded" />
                        <div className="h-3 w-20 bg-white/[0.04] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div className="divide-y divide-white/[0.06]">
                  {results.map((result) => (
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
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{result.strategyName}</p>
                          <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                            result.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            result.status === 'processing' ? 'bg-blue-500/10 text-blue-400' :
                            result.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                            'bg-zinc-500/10 text-zinc-400'
                          }`}>
                            {result.status}
                          </span>
                        </div>
                        <span className={`text-sm font-medium ${(result.performance?.totalReturn ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {(result.performance?.totalReturn ?? 0) > 0 ? '+' : ''}{result.performance?.totalReturn?.toFixed(1) ?? 0}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-400">
                        <span>{result.config.startDate} ~ {result.config.endDate}</span>
                        <span>•</span>
                        <span>{t('dashboard.backtest.history.sharpe') as string} {result.performance?.sharpeRatio?.toFixed(2) ?? '-'}</span>
                        <span>•</span>
                        <span>{(t('dashboard.backtest.history.trades') as string).replace('{count}', String(result.performance?.totalTrades ?? 0))}</span>
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
