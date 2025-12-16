'use client'

import { useState, useCallback } from 'react'
import { PlayIcon, StopIcon, ArrowPathIcon, ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { useBacktest, type BacktestStatus } from '@/hooks/use-backtest'
import type { BacktestResult, RiskConfig } from '@/lib/backtest'
import type { OHLCV } from '@/types'
import { useI18n } from '@/i18n/client'

interface UIBacktestConfig {
  strategyId: string
  initialCapital: number
  startDate: number
  endDate: number
  symbols: string[]
  timeframe: string
  slippage: number
  commission: number
  riskConfig?: RiskConfig
}

interface BacktestRunnerProps {
  strategyId: string
  onComplete?: (result: BacktestResult) => void
  className?: string
}

export function BacktestRunner({ strategyId, onComplete, className = '' }: BacktestRunnerProps) {
  const { t } = useI18n()
  const { status, progress, result, error, run, cancel, reset } = useBacktest()
  const [config, setConfig] = useState<UIBacktestConfig>({
    strategyId,
    initialCapital: 10000,
    startDate: Date.now() - 365 * 24 * 60 * 60 * 1000,
    endDate: Date.now(),
    symbols: ['BTC/USDT'],
    timeframe: '1h',
    slippage: 0.001,
    commission: 0.001,
    riskConfig: {
      maxPositionSize: 0.1,
      maxDrawdown: 0.2,
      stopLossPercent: 0.05,
      takeProfitPercent: 0.1,
    },
  })

  const handleRun = useCallback(async () => {
    const mockData = generateMockOHLCV(config.startDate, config.endDate, config.timeframe)
    const engineConfig = {
      symbol: config.symbols[0] || 'BTC/USDT',
      startDate: config.startDate,
      endDate: config.endDate,
      initialCapital: config.initialCapital,
      commission: config.commission,
      slippage: config.slippage,
      strategy: { id: config.strategyId, name: 'Backtest', conditions: [] } as unknown,
    }

    const backtestResult = await run(engineConfig as Parameters<typeof run>[0], mockData)
    if (backtestResult && onComplete) {
      onComplete(backtestResult)
    }
  }, [config, run, onComplete])

  return (
    <div className={`border border-white/[0.06] rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-medium text-white">{t('dashboard.backtest.title') as string}</h2>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Config Panel */}
      <div className="p-4 space-y-4">
        <ConfigPanel config={config} onChange={setConfig} disabled={status === 'running'} />
      </div>

      {/* Progress */}
      {status === 'running' && progress && (
        <div className="px-4 pb-4">
          <ProgressBar progress={progress} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 pb-4">
          <div className="py-2 px-3 border border-red-500/20 rounded text-sm text-red-400">
            {error}
          </div>
        </div>
      )}

      {/* Results Preview */}
      {result && status === 'completed' && (
        <div className="px-4 pb-4">
          <ResultPreview result={result} />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-white/[0.06] flex gap-2">
        {status === 'running' ? (
          <button
            type="button"
            onClick={cancel}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors"
          >
            <StopIcon className="w-4 h-4" />
            {t('dashboard.backtest.actions.stop') as string}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleRun}
              disabled={status === 'loading'}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-white bg-white/[0.08] hover:bg-white/[0.12] rounded transition-colors disabled:opacity-50"
            >
              <PlayIcon className="w-4 h-4" />
              {t('dashboard.backtest.actions.run') as string}
            </button>
            {(result || error) && (
              <button
                type="button"
                onClick={reset}
                className="px-3 flex items-center justify-center py-2 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] rounded transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: BacktestStatus }) {
  const { t } = useI18n()
  const statusClassNames: Record<BacktestStatus, string> = {
    idle: 'text-zinc-500',
    loading: 'text-amber-400',
    running: 'text-blue-400',
    completed: 'text-emerald-400',
    failed: 'text-red-400',
    cancelled: 'text-zinc-500',
  }

  const className = statusClassNames[status]
  const label = t(`dashboard.backtest.status.${status}`) as string
  return <span className={`text-xs ${className}`}>{label}</span>
}

interface ConfigPanelProps {
  config: UIBacktestConfig
  onChange: (config: UIBacktestConfig) => void
  disabled?: boolean
}

function ConfigPanel({ config, onChange, disabled }: ConfigPanelProps) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.backtest.config.initialCapital') as string}</label>
        <input
          type="number"
          value={config.initialCapital}
          onChange={(e) => onChange({ ...config, initialCapital: parseFloat(e.target.value) || 0 })}
          disabled={disabled}
          className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] disabled:opacity-50"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.backtest.config.symbol') as string}</label>
        <input
          type="text"
          value={config.symbols.join(', ')}
          onChange={(e) => onChange({ ...config, symbols: e.target.value.split(',').map(s => s.trim()) })}
          disabled={disabled}
          className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] disabled:opacity-50"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.backtest.config.timeframe') as string}</label>
        <select
          value={config.timeframe}
          onChange={(e) => onChange({ ...config, timeframe: e.target.value })}
          disabled={disabled}
          className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] disabled:opacity-50"
        >
          <option value="1m">{t('dashboard.backtest.timeframes.1m') as string}</option>
          <option value="5m">{t('dashboard.backtest.timeframes.5m') as string}</option>
          <option value="15m">{t('dashboard.backtest.timeframes.15m') as string}</option>
          <option value="1h">{t('dashboard.backtest.timeframes.1h') as string}</option>
          <option value="4h">{t('dashboard.backtest.timeframes.4h') as string}</option>
          <option value="1d">{t('dashboard.backtest.timeframes.1d') as string}</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">{t('dashboard.backtest.config.stopLoss') as string}</label>
        <input
          type="number"
          value={(config.riskConfig?.stopLossPercent ?? 0.05) * 100}
          onChange={(e) => onChange({
            ...config,
            riskConfig: { ...config.riskConfig!, stopLossPercent: parseFloat(e.target.value) / 100 }
          })}
          disabled={disabled}
          step={0.5}
          className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] disabled:opacity-50"
        />
      </div>
    </div>
  )
}

interface ProgressBarProps {
  progress: {
    currentBar: number
    totalBars: number
    percent: number
    trades?: number
  }
}

function ProgressBar({ progress }: ProgressBarProps) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">{t('dashboard.backtest.progress.title') as string}</span>
        <span className="text-zinc-400">{Math.round(progress.percent)}%</span>
      </div>
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-400 transition-all duration-300"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-400">
        <span>{progress.currentBar.toLocaleString()} / {progress.totalBars.toLocaleString()} {t('dashboard.backtest.progress.bars') as string}</span>
        {progress.trades !== undefined && <span>{t('dashboard.backtest.progress.trades') as string}: {progress.trades}</span>}
      </div>
    </div>
  )
}

interface ResultPreviewProps {
  result: BacktestResult
}

function ResultPreview({ result }: ResultPreviewProps) {
  const { t } = useI18n()
  const metrics = result.metrics
  const isPositiveReturn = metrics.totalReturn >= 0
  const isGoodWinRate = metrics.winRate >= 0.5

  return (
    <div className="space-y-3">
      <h3 className="text-xs text-zinc-400">{t('dashboard.backtest.results.summary') as string}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="py-2">
          <div className="flex items-center gap-1.5 mb-1">
            {isPositiveReturn ? (
              <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <ArrowTrendingDownIcon className="w-3.5 h-3.5 text-red-500" />
            )}
            <span className="text-xs text-zinc-400">{t('dashboard.backtest.results.totalReturn') as string}</span>
          </div>
          <p className={`text-base font-medium ${isPositiveReturn ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositiveReturn ? '+' : ''}{(metrics.totalReturn * 100).toFixed(2)}%
          </p>
        </div>

        <div className="py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <ChartBarIcon className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-400">{t('dashboard.backtest.results.sharpeRatio') as string}</span>
          </div>
          <p className="text-base font-medium text-zinc-300">{metrics.sharpeRatio.toFixed(2)}</p>
        </div>

        <div className="py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowTrendingDownIcon className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs text-zinc-400">{t('dashboard.backtest.results.maxDrawdown') as string}</span>
          </div>
          <p className="text-base font-medium text-red-400">{(metrics.maxDrawdown * 100).toFixed(2)}%</p>
        </div>

        <div className="py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowTrendingUpIcon className={`w-3.5 h-3.5 ${isGoodWinRate ? 'text-emerald-500' : 'text-zinc-500'}`} />
            <span className="text-xs text-zinc-400">{t('dashboard.backtest.results.winRate') as string}</span>
          </div>
          <p className={`text-base font-medium ${isGoodWinRate ? 'text-emerald-400' : 'text-zinc-400'}`}>
            {(metrics.winRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  )
}

function generateMockOHLCV(startDate: number, endDate: number, timeframe: string): OHLCV[] {
  const data: OHLCV[] = []
  const msPerBar: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  }

  const interval = msPerBar[timeframe] || msPerBar['1h']
  let currentTime = startDate
  let price = 50000

  while (currentTime <= endDate) {
    const volatility = 0.02
    const change = (Math.random() - 0.5) * 2 * volatility
    const open = price
    const close = price * (1 + change)
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5)
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5)
    const volume = 100 + Math.random() * 900

    data.push({ timestamp: currentTime, open, high, low, close, volume })
    price = close
    currentTime += interval
  }

  return data
}

export default BacktestRunner
