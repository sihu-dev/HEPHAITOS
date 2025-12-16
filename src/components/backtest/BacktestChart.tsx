'use client'

import { memo, useMemo, useState, useCallback } from 'react'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline'
import type { BacktestResult, BacktestTrade, PortfolioSnapshot } from '@/lib/backtest'

interface BacktestChartProps {
  result: BacktestResult
  className?: string
}

type ChartType = 'equity' | 'drawdown' | 'trades'

export const BacktestChart = memo(function BacktestChart({ result, className = '' }: BacktestChartProps) {
  const [chartType, setChartType] = useState<ChartType>('equity')

  const handleChartTypeChange = useCallback((type: ChartType) => {
    setChartType(type)
  }, [])

  return (
    <div className={`border border-white/[0.06] rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-medium text-white">차트 분석</h3>
        <div className="flex gap-1">
          <ChartTypeButton
            type="equity"
            current={chartType}
            onClick={handleChartTypeChange}
            icon={PresentationChartLineIcon}
            label="자산"
          />
          <ChartTypeButton
            type="drawdown"
            current={chartType}
            onClick={handleChartTypeChange}
            icon={ArrowTrendingDownIcon}
            label="낙폭"
          />
          <ChartTypeButton
            type="trades"
            current={chartType}
            onClick={handleChartTypeChange}
            icon={ChartBarIcon}
            label="거래"
          />
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-4">
        {chartType === 'equity' && <EquityCurve snapshots={result.equityCurve} />}
        {chartType === 'drawdown' && <DrawdownChart snapshots={result.equityCurve} />}
        {chartType === 'trades' && <TradesChart trades={result.trades} />}
      </div>
    </div>
  )
})

interface ChartTypeButtonProps {
  type: ChartType
  current: ChartType
  onClick: (type: ChartType) => void
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const ChartTypeButton = memo(function ChartTypeButton({ type, current, onClick, icon: Icon, label }: ChartTypeButtonProps) {
  const isActive = type === current

  const handleClick = useCallback(() => {
    onClick(type)
  }, [onClick, type])

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
        isActive
          ? 'bg-white/[0.08] text-white'
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
})

interface EquityCurveProps {
  snapshots: PortfolioSnapshot[]
}

const EquityCurve = memo(function EquityCurve({ snapshots }: EquityCurveProps) {
  const chartData = useMemo(() => {
    if (snapshots.length === 0) return null

    const values = snapshots.map(s => s.equity)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    return {
      values,
      min,
      max,
      range,
      points: values.map((v, i) => ({
        x: (i / (values.length - 1)) * 100,
        y: 100 - ((v - min) / range) * 100,
      })),
    }
  }, [snapshots])

  if (!chartData) {
    return <EmptyChart message="데이터가 없습니다" />
  }

  const pathD = chartData.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  const areaPathD = `${pathD} L ${chartData.points[chartData.points.length - 1].x} 100 L 0 100 Z`

  const startValue = chartData.values[0]
  const endValue = chartData.values[chartData.values.length - 1]
  const changePercent = ((endValue - startValue) / startValue) * 100
  const isPositive = changePercent >= 0

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">시작 자산</span>
          <p className="text-base font-medium text-white">
            ${startValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="text-right space-y-1">
          <span className="text-xs text-zinc-400">최종 자산</span>
          <p className={`text-base font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            ${endValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-sm ml-1">({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)</span>
          </p>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative h-40">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="0.5"
            />
          ))}

          {/* Area fill */}
          <path
            d={areaPathD}
            fill={isPositive ? 'rgba(52, 211, 153, 0.08)' : 'rgba(248, 113, 113, 0.08)'}
          />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={isPositive ? '#34d399' : '#f87171'}
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-zinc-400">
          <span>${(chartData.max / 1000).toFixed(0)}k</span>
          <span>${(chartData.min / 1000).toFixed(0)}k</span>
        </div>
      </div>
    </div>
  )
})

interface DrawdownChartProps {
  snapshots: PortfolioSnapshot[]
}

const DrawdownChart = memo(function DrawdownChart({ snapshots }: DrawdownChartProps) {
  const chartData = useMemo(() => {
    if (snapshots.length === 0) return null

    let runningMax = 0
    const drawdowns = snapshots.map(s => {
      runningMax = Math.max(runningMax, s.equity)
      return (s.equity - runningMax) / runningMax
    })

    const minDrawdown = Math.min(...drawdowns)
    const maxDrawdown = Math.abs(minDrawdown)

    return {
      drawdowns,
      minDrawdown,
      maxDrawdown,
      points: drawdowns.map((d, i) => ({
        x: (i / (drawdowns.length - 1)) * 100,
        y: Math.abs(d) / (maxDrawdown || 0.01) * 100,
      })),
    }
  }, [snapshots])

  if (!chartData) {
    return <EmptyChart message="데이터가 없습니다" />
  }

  const pathD = chartData.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  const areaPathD = `M 0 0 ${pathD} L 100 0 Z`

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">최대 낙폭</span>
          <p className="text-base font-medium text-red-400">
            {(chartData.maxDrawdown * 100).toFixed(2)}%
          </p>
        </div>
        <div className="text-right space-y-1">
          <span className="text-xs text-zinc-400">현재 낙폭</span>
          <p className="text-base font-medium text-zinc-400">
            {(Math.abs(chartData.drawdowns[chartData.drawdowns.length - 1]) * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative h-40">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="0.5"
            />
          ))}

          {/* Area fill */}
          <path
            d={areaPathD}
            fill="rgba(248, 113, 113, 0.1)"
          />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#f87171"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-zinc-400">
          <span>0%</span>
          <span>{(chartData.maxDrawdown * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  )
})

interface TradesChartProps {
  trades: BacktestTrade[]
}

const TradesChart = memo(function TradesChart({ trades }: TradesChartProps) {
  const chartData = useMemo(() => {
    if (trades.length === 0) return null

    const pnls = trades.map(t => t.pnl)
    const maxPnl = Math.max(...pnls.map(Math.abs))

    return {
      trades,
      pnls,
      maxPnl: maxPnl || 1,
      wins: trades.filter(t => t.pnl > 0).length,
      losses: trades.filter(t => t.pnl <= 0).length,
      totalPnl: pnls.reduce((sum, p) => sum + p, 0),
    }
  }, [trades])

  if (!chartData) {
    return <EmptyChart message="거래 내역이 없습니다" />
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">승리</span>
          <p className="text-base font-medium text-emerald-400">{chartData.wins}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">패배</span>
          <p className="text-base font-medium text-red-400">{chartData.losses}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">총 손익</span>
          <p className={`text-base font-medium ${chartData.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${chartData.totalPnl.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-40 flex items-end gap-px">
        {chartData.pnls.slice(-50).map((pnl, i) => {
          const height = (Math.abs(pnl) / chartData.maxPnl) * 100
          const isPositive = pnl >= 0

          return (
            <div
              key={i}
              className={`flex-1 min-w-[2px] rounded-t ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ height: `${height}%` }}
            />
          )
        })}
      </div>

      <p className="text-xs text-zinc-400 text-center">
        최근 {Math.min(50, chartData.trades.length)}개 거래 손익
      </p>
    </div>
  )
})

const EmptyChart = memo(function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-40 flex items-center justify-center">
      <div className="text-center">
        <PresentationChartLineIcon className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
        <p className="text-sm text-zinc-400">{message}</p>
      </div>
    </div>
  )
})

export default BacktestChart
