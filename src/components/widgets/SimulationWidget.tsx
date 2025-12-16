'use client'

// ============================================
// Portfolio Simulation Widget
// ============================================

import { useState, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

// ============================================
// Types
// ============================================

interface Position {
  symbol: string
  name: string
  quantity: number
  avgPrice: number
  currentPrice: number
  allocation: number
}

interface SimulationConfig {
  initialCapital: number
  timeframe: '1M' | '3M' | '6M' | '1Y' | '3Y'
  rebalanceFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  dividendReinvest: boolean
  feeRate: number
  positions: Position[]
}

interface SimulationResult {
  date: string
  portfolioValue: number
  returns: number
  benchmark: number
  alpha: number
}

export interface SimulationWidgetProps {
  initialPositions?: Position[]
  strategyName?: string
  className?: string
  onClose?: () => void
}

// ============================================
// Simulation Engine Hook
// ============================================

function useSimulation(config: SimulationConfig) {
  const [results, setResults] = useState<SimulationResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(1) // 1x, 2x, 4x

  const runSimulation = useCallback(async () => {
    setIsRunning(true)
    setProgress(0)
    setResults([])

    const totalDays = {
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      '3Y': 1095,
    }[config.timeframe]

    const newResults: SimulationResult[] = []
    let currentValue = config.initialCapital
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - totalDays)

    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)

      // Simulate daily returns with realistic volatility
      const dailyReturn = (Math.random() - 0.48) * 0.03 // Slight positive bias
      const benchmarkReturn = (Math.random() - 0.49) * 0.025

      currentValue *= 1 + dailyReturn
      const totalReturn = ((currentValue - config.initialCapital) / config.initialCapital) * 100
      const benchmarkTotal = benchmarkReturn * i * 3 // Simplified benchmark

      newResults.push({
        date: date.toISOString().split('T')[0],
        portfolioValue: currentValue,
        returns: totalReturn,
        benchmark: benchmarkTotal,
        alpha: totalReturn - benchmarkTotal,
      })

      setProgress((i / totalDays) * 100)
      setResults([...newResults])

      // Speed control
      if (i % (10 / speed) === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10 / speed))
      }
    }

    setIsRunning(false)
    setProgress(100)
  }, [config, speed])

  const resetSimulation = useCallback(() => {
    setResults([])
    setProgress(0)
    setIsRunning(false)
  }, [])

  return { results, isRunning, progress, speed, setSpeed, runSimulation, resetSimulation }
}

// ============================================
// Main Component
// ============================================

export const SimulationWidget = memo(function SimulationWidget({
  initialPositions = [],
  className = '',
  onClose,
}: SimulationWidgetProps) {
  const { t } = useI18n()
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState<SimulationConfig>({
    initialCapital: 10000000,
    timeframe: '1Y',
    rebalanceFrequency: 'monthly',
    dividendReinvest: true,
    feeRate: 0.015,
    positions: initialPositions.length > 0 ? initialPositions : defaultPositions,
  })

  const { results, isRunning, progress, speed, setSpeed, runSimulation, resetSimulation } =
    useSimulation(config)

  // Calculate statistics
  const stats = useMemo(() => {
    if (results.length === 0) return null

    const latest = results[results.length - 1]
    const maxDrawdown = Math.min(...results.map((r) => r.returns))
    const volatility =
      Math.sqrt(
        results.reduce((sum, r, i, arr) => {
          if (i === 0) return 0
          const diff = r.returns - arr[i - 1].returns
          return sum + diff * diff
        }, 0) / results.length
      ) * Math.sqrt(252)

    const sharpeRatio = (latest.returns / 100 - 0.02) / (volatility / 100) // Assume 2% risk-free rate

    return {
      totalReturn: latest.returns,
      portfolioValue: latest.portfolioValue,
      alpha: latest.alpha,
      maxDrawdown,
      volatility: volatility * 100,
      sharpeRatio,
    }
  }, [results])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg">
            <ChartBarIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{t('dashboard.simulation.title') as string}</h3>
            <p className="text-xs text-zinc-400">
              {config.timeframe} · ${config.initialCapital.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            aria-label={t('dashboard.simulation.settings.open') as string}
            title={t('dashboard.simulation.settings.open') as string}
            className={`p-2 rounded-lg transition-colors ${
              showConfig
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={t('dashboard.simulation.settings.close') as string}
              title={t('dashboard.simulation.settings.close') as string}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Config Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-zinc-800 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="initial-capital" className="text-xs text-zinc-400 mb-1 block">{t('dashboard.simulation.config.initialCapital') as string}</label>
                  <input
                    id="initial-capital"
                    type="number"
                    value={config.initialCapital}
                    onChange={(e) =>
                      setConfig({ ...config, initialCapital: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="timeframe" className="text-xs text-zinc-400 mb-1 block">{t('dashboard.simulation.config.timeframe') as string}</label>
                  <select
                    id="timeframe"
                    value={config.timeframe}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        timeframe: e.target.value as SimulationConfig['timeframe'],
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  >
                    <option value="1M">{t('dashboard.simulation.timeframes.1M') as string}</option>
                    <option value="3M">{t('dashboard.simulation.timeframes.3M') as string}</option>
                    <option value="6M">{t('dashboard.simulation.timeframes.6M') as string}</option>
                    <option value="1Y">{t('dashboard.simulation.timeframes.1Y') as string}</option>
                    <option value="3Y">3Y</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="rebalance-frequency" className="text-xs text-zinc-400 mb-1 block">{t('dashboard.simulation.config.rebalancing') as string}</label>
                  <select
                    id="rebalance-frequency"
                    value={config.rebalanceFrequency}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        rebalanceFrequency: e.target
                          .value as SimulationConfig['rebalanceFrequency'],
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  >
                    <option value="daily">{t('dashboard.simulation.rebalancing.daily') as string}</option>
                    <option value="weekly">{t('dashboard.simulation.rebalancing.weekly') as string}</option>
                    <option value="monthly">{t('dashboard.simulation.rebalancing.monthly') as string}</option>
                    <option value="quarterly">{t('dashboard.simulation.rebalancing.quarterly') as string}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="fee-rate" className="text-xs text-zinc-400 mb-1 block">{t('dashboard.simulation.config.feeRate') as string}</label>
                  <input
                    id="fee-rate"
                    type="number"
                    step="0.001"
                    value={config.feeRate}
                    onChange={(e) =>
                      setConfig({ ...config, feeRate: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.dividendReinvest}
                  onChange={(e) =>
                    setConfig({ ...config, dividendReinvest: e.target.checked })
                  }
                  className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-zinc-300">{t('dashboard.simulation.config.dividendReinvest') as string}</span>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart Area */}
      <div className="p-4">
        <div className="h-48 relative">
          {results.length > 0 ? (
            <SimulationChart results={results} t={t} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="w-12 h-12 text-zinc-500 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">{t('dashboard.simulation.status.startPrompt') as string}</p>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>{t('dashboard.simulation.status.running') as string}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-3 gap-px bg-zinc-800 border-t border-zinc-800">
          <StatCard
            label={t('dashboard.simulation.results.totalReturn') as string}
            value={`${stats.totalReturn.toFixed(2)}%`}
            icon={
              stats.totalReturn >= 0 ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />
              )
            }
            color={stats.totalReturn >= 0 ? 'emerald' : 'red'}
          />
          <StatCard
            label={t('dashboard.simulation.results.finalAssets') as string}
            value={`$${(stats.portfolioValue / 1000).toFixed(0)}K`}
            icon={<CurrencyDollarIcon className="w-4 h-4 text-blue-400" />}
            color="blue"
          />
          <StatCard
            label={t('dashboard.simulation.results.sharpeRatio') as string}
            value={stats.sharpeRatio.toFixed(2)}
            icon={<ChartBarIcon className="w-4 h-4 text-purple-400" />}
            color="purple"
          />
          <StatCard
            label={t('dashboard.simulation.results.alpha') as string}
            value={`${stats.alpha.toFixed(2)}%`}
            icon={<ArrowTrendingUpIcon className="w-4 h-4 text-amber-400" />}
            color="amber"
          />
          <StatCard
            label="MDD"
            value={`${stats.maxDrawdown.toFixed(2)}%`}
            icon={<ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />}
            color="red"
          />
          <StatCard
            label={t('dashboard.simulation.results.volatility') as string}
            value={`${stats.volatility.toFixed(1)}%`}
            icon={<ClockIcon className="w-4 h-4 text-zinc-400" />}
            color="zinc"
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">{t('dashboard.simulation.controls.speed') as string}</span>
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                speed === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {results.length > 0 && (
            <button
              type="button"
              onClick={resetSimulation}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              {t('dashboard.simulation.controls.reset') as string}
            </button>
          )}
          <button
            type="button"
            onClick={runSimulation}
            disabled={isRunning}
            className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${
              isRunning
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <PauseIcon className="w-4 h-4" />
                {t('dashboard.simulation.status.runningButton') as string}
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4" />
                {t('dashboard.simulation.controls.start') as string}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 pb-4">
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <InformationCircleIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-300/80 leading-relaxed">
            {t('dashboard.simulation.disclaimer') as string}
          </p>
        </div>
      </div>
    </motion.div>
  )
})

// ============================================
// Stat Card Component
// ============================================

const StatCard = memo(function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="bg-zinc-900 p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <p className={`text-sm font-semibold text-${color}-400`}>{value}</p>
    </div>
  )
})

// ============================================
// Simulation Chart (Simple SVG)
// ============================================

const SimulationChart = memo(function SimulationChart({ results, t }: { results: SimulationResult[]; t: (key: string) => string | string[] | Record<string, unknown> }) {
  if (results.length < 2) return null

  const width = 400
  const height = 180
  const padding = { top: 10, right: 10, bottom: 30, left: 40 }

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const minReturn = Math.min(...results.map((r) => Math.min(r.returns, r.benchmark)))
  const maxReturn = Math.max(...results.map((r) => Math.max(r.returns, r.benchmark)))
  const range = maxReturn - minReturn || 1

  const getX = (i: number) => padding.left + (i / (results.length - 1)) * chartWidth
  const getY = (value: number) =>
    padding.top + chartHeight - ((value - minReturn) / range) * chartHeight

  const portfolioPath = results
    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(r.returns)}`)
    .join(' ')

  const benchmarkPath = results
    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(r.benchmark)}`)
    .join(' ')

  // Grid lines
  const gridLines = []
  const numLines = 4
  for (let i = 0; i <= numLines; i++) {
    const y = padding.top + (i / numLines) * chartHeight
    const value = maxReturn - (i / numLines) * range
    gridLines.push({ y, value })
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      {/* Grid */}
      {gridLines.map(({ y, value }, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="#3f3f46"
            strokeWidth="1"
            strokeDasharray="4"
          />
          <text
            x={padding.left - 5}
            y={y + 3}
            textAnchor="end"
            fontSize="10"
            fill="#71717a"
          >
            {value.toFixed(0)}%
          </text>
        </g>
      ))}

      {/* Zero line */}
      {minReturn < 0 && maxReturn > 0 && (
        <line
          x1={padding.left}
          y1={getY(0)}
          x2={width - padding.right}
          y2={getY(0)}
          stroke="#52525b"
          strokeWidth="1"
        />
      )}

      {/* Benchmark line */}
      <path d={benchmarkPath} fill="none" stroke="#6b7280" strokeWidth="1.5" opacity="0.5" />

      {/* Portfolio line */}
      <path
        d={portfolioPath}
        fill="none"
        stroke="url(#portfolioGradient)"
        strokeWidth="2"
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="portfolioGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>

      {/* Legend */}
      <g transform={`translate(${padding.left}, ${height - 10})`}>
        <circle cx="0" cy="0" r="4" fill="#10b981" />
        <text x="8" y="3" fontSize="10" fill="#a1a1aa">
          {t('dashboard.simulation.legend.portfolio') as string}
        </text>
        <circle cx="80" cy="0" r="4" fill="#6b7280" />
        <text x="88" y="3" fontSize="10" fill="#a1a1aa">
          {t('dashboard.simulation.legend.benchmark') as string}
        </text>
      </g>
    </svg>
  )
})

// ============================================
// Default Positions
// ============================================

const defaultPositions: Position[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', quantity: 10, avgPrice: 150, currentPrice: 175, allocation: 25 },
  { symbol: 'MSFT', name: 'Microsoft', quantity: 8, avgPrice: 280, currentPrice: 330, allocation: 20 },
  { symbol: 'GOOGL', name: 'Alphabet', quantity: 5, avgPrice: 120, currentPrice: 140, allocation: 15 },
  { symbol: 'NVDA', name: 'NVIDIA', quantity: 6, avgPrice: 400, currentPrice: 480, allocation: 20 },
  { symbol: 'AMZN', name: 'Amazon', quantity: 12, avgPrice: 130, currentPrice: 155, allocation: 20 },
]

// ============================================
// Exports
// ============================================

export default SimulationWidget
