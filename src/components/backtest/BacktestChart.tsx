'use client'

import { memo, useMemo, useState, useCallback, useRef } from 'react'
import { CHART_COLORS } from "@/constants/design-tokens"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  ReferenceLine,
  Cell,
} from 'recharts'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import html2canvas from 'html2canvas'
import { ChartAnalysisPanel } from '@/components/charts/ChartAnalysisPanel'
import type { BacktestResult, BacktestTrade, PortfolioSnapshot } from '@/lib/backtest'
import type { ChartAnalysisResponse } from '@/types'

interface BacktestChartProps {
  result: BacktestResult
  symbol?: string
  className?: string
}

type ChartType = 'equity' | 'drawdown' | 'trades' | 'monthly'

export const BacktestChart = memo(function BacktestChart({ result, symbol = 'BACKTEST', className = '' }: BacktestChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [chartType, setChartType] = useState<ChartType>('equity')

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [analysisResult, setAnalysisResult] = useState<ChartAnalysisResponse | null>(null)
  const [showAnalysisPanel, setShowAnalysisPanel] = useState<boolean>(false)

  const handleChartTypeChange = useCallback((type: ChartType) => {
    setChartType(type)
  }, [])

  // ============================================
  // AI Chart Analysis Functions
  // ============================================

  /**
   * 차트를 캡처하여 base64 이미지로 변환
   */
  const captureChart = useCallback(async (): Promise<string> => {
    if (!chartContainerRef.current) {
      throw new Error('Chart container not found')
    }

    try {
      const canvas = await html2canvas(chartContainerRef.current, {
        backgroundColor: '#0D0D0F',
        scale: 2, // Higher quality
        logging: false,
      })

      return canvas.toDataURL('image/png')
    } catch (error) {
      console.error('[BacktestChart] Failed to capture chart:', error)
      throw new Error('차트 캡처에 실패했습니다')
    }
  }, [])

  /**
   * AI 차트 분석 실행
   */
  const handleAIAnalysis = useCallback(async () => {
    try {
      setIsAnalyzing(true)
      setShowAnalysisPanel(true)

      // Capture chart
      const chartImage = await captureChart()

      // Call API
      const response = await fetch('/api/ai/chart-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chartImage,
          symbol,
          timeframe: 'backtest',
        }),
      })

      if (!response.ok) {
        throw new Error('AI 분석 요청에 실패했습니다')
      }

      const data = await response.json()

      if (data.success && data.data) {
        setAnalysisResult(data.data)
      } else {
        throw new Error(data.error?.message || 'AI 분석에 실패했습니다')
      }
    } catch (error) {
      console.error('[BacktestChart] AI analysis failed:', error)
      alert(error instanceof Error ? error.message : 'AI 분석에 실패했습니다')
      setShowAnalysisPanel(false)
    } finally {
      setIsAnalyzing(false)
    }
  }, [captureChart, symbol])

  /**
   * 분석 패널 닫기
   */
  const handleCloseAnalysis = useCallback(() => {
    setShowAnalysisPanel(false)
  }, [])

  return (
    <div className={`relative border border-white/[0.06] rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-medium text-white">차트 분석</h3>
        <div className="flex gap-2">
          {/* AI Analysis Button */}
          <button
            onClick={handleAIAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="AI 차트 분석"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {isAnalyzing ? '분석중...' : 'AI 분석'}
          </button>

          <div className="w-px h-full bg-white/[0.06]" />

          {/* Chart Type Buttons */}
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
            <ChartTypeButton
              type="monthly"
              current={chartType}
              onClick={handleChartTypeChange}
              icon={CalendarIcon}
              label="월별"
            />
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div ref={chartContainerRef} className="p-4">
        {chartType === 'equity' && <EquityCurve snapshots={result.equityCurve} trades={result.trades} />}
        {chartType === 'drawdown' && <DrawdownChart snapshots={result.equityCurve} />}
        {chartType === 'trades' && <TradesChart trades={result.trades} />}
        {chartType === 'monthly' && <MonthlyReturnsChart snapshots={result.equityCurve} />}
      </div>

      {/* AI Analysis Panel */}
      {showAnalysisPanel && (
        <ChartAnalysisPanel
          analysis={analysisResult}
          isLoading={isAnalyzing}
          onClose={handleCloseAnalysis}
        />
      )}
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

// Custom Tooltip Component
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color?: string }>
  label?: string
  formatter?: (value: number) => string
  labelFormatter?: (label: string) => string
}

const CustomTooltip = memo(function CustomTooltip({
  active,
  payload,
  label,
  formatter = (v) => `$${v.toLocaleString()}`,
  labelFormatter = (l) => l,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-zinc-900/95 backdrop-blur border border-white/[0.08] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400 mb-1">{labelFormatter(label || '')}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-medium" style={{ color: entry.color || '#fff' }}>
          {formatter(entry.value)}
        </p>
      ))}
    </div>
  )
})

interface EquityCurveProps {
  snapshots: PortfolioSnapshot[]
  trades: BacktestTrade[]
}

const EquityCurve = memo(function EquityCurve({ snapshots, trades }: EquityCurveProps) {
  const chartData = useMemo(() => {
    if (snapshots.length === 0) return null

    const data = snapshots.map((s, i) => ({
      index: i,
      date: new Date(s.timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      equity: s.equity,
      benchmark: s.equity * (1 + (Math.random() - 0.5) * 0.02), // Mock benchmark for demo
    }))

    const startValue = snapshots[0].equity
    const endValue = snapshots[snapshots.length - 1].equity
    const changePercent = ((endValue - startValue) / startValue) * 100
    const isPositive = changePercent >= 0

    return { data, startValue, endValue, changePercent, isPositive }
  }, [snapshots])

  if (!chartData) {
    return <EmptyChart message="데이터가 없습니다" />
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">시작 자산</span>
          <p className="text-base font-medium text-white">
            ${chartData.startValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="text-right space-y-1">
          <span className="text-xs text-zinc-400">최종 자산</span>
          <p className={`text-base font-medium ${chartData.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            ${chartData.endValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-sm ml-1">
              ({chartData.isPositive ? '+' : ''}{chartData.changePercent.toFixed(2)}%)
            </span>
          </p>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={chartData.isPositive ? '#34d399' : '#f87171'}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={chartData.isPositive ? '#34d399' : '#f87171'}
                  stopOpacity={0}
                />
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
              domain={['dataMin - 1000', 'dataMax + 1000']}
            />
            <Tooltip
              content={<CustomTooltip formatter={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke={chartData.isPositive ? '#34d399' : '#f87171'}
              strokeWidth={2}
              fill="url(#equityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Trade count indicator */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          총 {trades.length}건의 거래
        </span>
        <span>•</span>
        <span className="text-emerald-400">{trades.filter(t => t.pnl > 0).length} 승</span>
        <span className="text-red-400">{trades.filter(t => t.pnl <= 0).length} 패</span>
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
    const data = snapshots.map((s, i) => {
      runningMax = Math.max(runningMax, s.equity)
      const drawdown = ((s.equity - runningMax) / runningMax) * 100
      return {
        index: i,
        date: new Date(s.timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        drawdown,
      }
    })

    const maxDrawdown = Math.min(...data.map(d => d.drawdown))
    const currentDrawdown = data[data.length - 1].drawdown

    return { data, maxDrawdown, currentDrawdown }
  }, [snapshots])

  if (!chartData) {
    return <EmptyChart message="데이터가 없습니다" />
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">최대 낙폭</span>
          <p className="text-base font-medium text-red-400">
            {chartData.maxDrawdown.toFixed(2)}%
          </p>
        </div>
        <div className="text-right space-y-1">
          <span className="text-xs text-zinc-400">현재 낙폭</span>
          <p className="text-base font-medium text-zinc-400">
            {chartData.currentDrawdown.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
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
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              domain={['dataMin - 5', 0]}
            />
            <Tooltip
              content={<CustomTooltip formatter={(v) => `${v.toFixed(2)}%`} />}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="drawdown"
              stroke="#f87171"
              strokeWidth={2}
              fill="url(#drawdownGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Drawdown distribution */}
      <div className="grid grid-cols-4 gap-2">
        {[5, 10, 15, 20].map(threshold => {
          const periods = chartData.data.filter(d => d.drawdown <= -threshold).length
          const percent = (periods / chartData.data.length * 100).toFixed(1)
          return (
            <div key={threshold} className="text-center">
              <p className="text-xs text-zinc-500">&gt;{threshold}% 낙폭</p>
              <p className="text-sm font-medium text-zinc-400">{percent}%</p>
            </div>
          )
        })}
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

    const data = trades.slice(-50).map((t, i) => ({
      index: i,
      pnl: t.pnl,
      isPositive: t.pnl >= 0,
    }))

    const wins = trades.filter(t => t.pnl > 0).length
    const losses = trades.filter(t => t.pnl <= 0).length
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0)
    const avgWin = wins > 0 ? trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0) / wins : 0
    const avgLoss = losses > 0 ? trades.filter(t => t.pnl <= 0).reduce((s, t) => s + t.pnl, 0) / losses : 0

    return { data, wins, losses, totalPnl, avgWin, avgLoss }
  }, [trades])

  if (!chartData) {
    return <EmptyChart message="거래 내역이 없습니다" />
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">승리</span>
          <p className="text-base font-medium text-emerald-400">{chartData.wins}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">패배</span>
          <p className="text-base font-medium text-red-400">{chartData.losses}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">평균 수익</span>
          <p className="text-sm font-medium text-emerald-400">${chartData.avgWin.toFixed(2)}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">평균 손실</span>
          <p className="text-sm font-medium text-red-400">${chartData.avgLoss.toFixed(2)}</p>
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="index"
              axisLine={false}
              tickLine={false}
              tick={false}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10 }}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              content={<CustomTooltip formatter={(v) => `$${v.toFixed(2)}`} />}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
            <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
              {chartData.data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isPositive ? '#34d399' : '#f87171'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400">
          최근 {Math.min(50, trades.length)}개 거래 손익
        </p>
        <p className={`text-sm font-medium ${chartData.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          총 손익: ${chartData.totalPnl.toFixed(2)}
        </p>
      </div>
    </div>
  )
})

interface MonthlyReturnsChartProps {
  snapshots: PortfolioSnapshot[]
}

const MonthlyReturnsChart = memo(function MonthlyReturnsChart({ snapshots }: MonthlyReturnsChartProps) {
  const chartData = useMemo(() => {
    if (snapshots.length === 0) return null

    // Group by month
    const monthlyData: Record<string, { start: number; end: number }> = {}

    snapshots.forEach(s => {
      const date = new Date(s.timestamp)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData[key]) {
        monthlyData[key] = { start: s.equity, end: s.equity }
      } else {
        monthlyData[key].end = s.equity
      }
    })

    const data = Object.entries(monthlyData)
      .map(([month, values]) => ({
        month,
        return: ((values.end - values.start) / values.start) * 100,
      }))
      .slice(-12) // Last 12 months

    const positiveMonths = data.filter(d => d.return > 0).length
    const negativeMonths = data.filter(d => d.return <= 0).length
    const avgReturn = data.reduce((s, d) => s + d.return, 0) / data.length

    return { data, positiveMonths, negativeMonths, avgReturn }
  }, [snapshots])

  if (!chartData) {
    return <EmptyChart message="월별 데이터가 없습니다" />
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">수익 월</span>
          <p className="text-base font-medium text-emerald-400">{chartData.positiveMonths}개월</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">손실 월</span>
          <p className="text-base font-medium text-red-400">{chartData.negativeMonths}개월</p>
        </div>
        <div className="text-right space-y-1">
          <span className="text-xs text-zinc-400">평균 월 수익</span>
          <p className={`text-base font-medium ${chartData.avgReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {chartData.avgReturn >= 0 ? '+' : ''}{chartData.avgReturn.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Monthly Returns Bar Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10 }}
              tickFormatter={(v) => v.split('-')[1] + '월'}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10 }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={<CustomTooltip formatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`} />}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
            <Bar dataKey="return" radius={[4, 4, 0, 0]}>
              {chartData.data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.return >= 0 ? '#34d399' : '#f87171'}
                />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="return"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Returns Heatmap */}
      <div className="space-y-2">
        <span className="text-xs text-zinc-400">월별 수익률 분포</span>
        <div className="grid grid-cols-6 gap-1">
          {chartData.data.map((d, i) => {
            const intensity = Math.min(Math.abs(d.return) / 10, 1) // Normalize to max 10%
            const bgColor = d.return >= 0
              ? `rgba(52, 211, 153, ${0.2 + intensity * 0.6})`
              : `rgba(248, 113, 113, ${0.2 + intensity * 0.6})`

            return (
              <div
                key={i}
                className="aspect-square rounded flex items-center justify-center text-[10px] font-medium text-white"
                style={{ backgroundColor: bgColor }}
                title={`${d.month}: ${d.return.toFixed(2)}%`}
              >
                {d.return.toFixed(0)}%
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

const EmptyChart = memo(function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-48 flex items-center justify-center">
      <div className="text-center">
        <PresentationChartLineIcon className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
        <p className="text-sm text-zinc-400">{message}</p>
      </div>
    </div>
  )
})

export default BacktestChart
