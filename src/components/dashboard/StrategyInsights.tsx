'use client'

// ============================================
// Strategy Insights Component (Network Effect)
// Loop 16: 전략 성과 네트워크 효과
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { safeLogger } from '@/lib/utils/safe-logger';

interface PopularStrategy {
  strategy_hash: string
  strategy_type: string
  strategy_tags: string[]
  market_condition: string
  timeframe: string
  total_runs: number
  total_users: number
  avg_return: number
  win_rate: number
  sharpe_ratio: number
  confidence_score: number
  rank: number
}

interface MarketInsight {
  market_condition: string
  strategy_count: number
  avg_return: number
  avg_win_rate: number
  avg_sharpe: number
  best_return: number
  worst_return: number
  total_runs: number
  total_users: number
}

interface TypePerformance {
  strategy_type: string
  market_condition: string
  strategy_count: number
  avg_return: number
  avg_win_rate: number
  avg_sharpe: number
  total_runs: number
}

type TimeframeType = '1d' | '1w' | '1m' | '3m'
type ConditionType = 'all' | 'bull' | 'bear' | 'sideways' | 'volatile'

const CONDITION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  bull: { label: '상승장', color: 'text-green-400', icon: '📈' },
  bear: { label: '하락장', color: 'text-red-400', icon: '📉' },
  sideways: { label: '횡보장', color: 'text-yellow-400', icon: '➡️' },
  volatile: { label: '변동장', color: 'text-purple-400', icon: '🌊' },
}

const TYPE_LABELS: Record<string, string> = {
  momentum: '모멘텀',
  mean_reversion: '평균회귀',
  breakout: '돌파',
  ai_generated: 'AI 생성',
  trend_following: '추세추종',
  value: '가치투자',
}

const TIMEFRAME_LABELS: Record<string, string> = {
  '1d': '1일',
  '1w': '1주',
  '1m': '1개월',
  '3m': '3개월',
}

export function StrategyInsights() {
  const [popularStrategies, setPopularStrategies] = useState<PopularStrategy[]>([])
  const [insights, setInsights] = useState<MarketInsight[]>([])
  const [typePerformance, setTypePerformance] = useState<TypePerformance[]>([])
  const [timeframe, setTimeframe] = useState<TimeframeType>('1w')
  const [condition, setCondition] = useState<ConditionType>('all')
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // 인기 전략
      const popularRes = await fetch(
        `/api/insights/strategies?type=popular&timeframe=${timeframe}${condition !== 'all' ? `&condition=${condition}` : ''}`
      )
      const popularData = await popularRes.json()
      setPopularStrategies(popularData.data || [])

      // 시장 조건별 인사이트
      const insightsRes = await fetch('/api/insights/strategies?type=insights')
      const insightsData = await insightsRes.json()
      setInsights(insightsData.data || [])

      // 전략 타입별 성과
      const typeRes = await fetch('/api/insights/strategies?type=type_performance')
      const typeData = await typeRes.json()
      setTypePerformance(typeData.data || [])
    } catch (err) {
      safeLogger.error('[StrategyInsights] Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [timeframe, condition])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatPercent = (value: number) => {
    const formatted = value?.toFixed(2) || '0.00'
    const isPositive = value > 0
    return (
      <span className={isPositive ? 'text-green-400' : value < 0 ? 'text-red-400' : ''}>
        {isPositive ? '+' : ''}{formatted}%
      </span>
    )
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const getConditionInfo = (cond: string) => {
    return CONDITION_LABELS[cond] || { label: cond, color: 'text-gray-400', icon: '📊' }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Strategy Insights</h2>
          <p className="text-sm text-gray-400">
            커뮤니티 전략 성과 (익명 집계)
          </p>
        </div>
        <div className="flex gap-2">
          {(['1d', '1w', '1m', '3m'] as TimeframeType[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                timeframe === tf
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {TIMEFRAME_LABELS[tf]}
            </button>
          ))}
        </div>
      </div>

      {/* 시장 조건별 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {insights.map((insight) => {
          const info = getConditionInfo(insight.market_condition)
          return (
            <Card
              key={insight.market_condition}
              className={`bg-white/5 border-white/10 cursor-pointer transition-all hover:bg-white/10 ${
                condition === insight.market_condition ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setCondition(
                condition === insight.market_condition ? 'all' : insight.market_condition as ConditionType
              )}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span>{info.icon}</span>
                  <span className={`font-medium ${info.color}`}>{info.label}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">평균 수익</span>
                    {formatPercent(insight.avg_return)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">승률</span>
                    <span>{insight.avg_win_rate?.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">전략 수</span>
                    <span>{insight.strategy_count}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 인기 전략 */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔥</span>
            인기 전략 Top 10
            {condition !== 'all' && (
              <span className={`text-sm font-normal ${getConditionInfo(condition).color}`}>
                ({getConditionInfo(condition).label})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-400">Rank</th>
                  <th className="px-4 py-3 text-left text-gray-400">Type</th>
                  <th className="px-4 py-3 text-left text-gray-400">Market</th>
                  <th className="px-4 py-3 text-right text-gray-400">Return</th>
                  <th className="px-4 py-3 text-right text-gray-400">Win Rate</th>
                  <th className="px-4 py-3 text-right text-gray-400">Sharpe</th>
                  <th className="px-4 py-3 text-right text-gray-400">Runs</th>
                  <th className="px-4 py-3 text-right text-gray-400">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {popularStrategies.map((strategy) => {
                  const condInfo = getConditionInfo(strategy.market_condition)
                  return (
                    <tr key={`${strategy.strategy_hash}-${strategy.market_condition}`} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          strategy.rank <= 3 ? 'bg-primary text-white' : 'bg-white/10'
                        }`}>
                          {strategy.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-white/10 rounded text-xs">
                          {TYPE_LABELS[strategy.strategy_type] || strategy.strategy_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={condInfo.color}>
                          {condInfo.icon} {condInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatPercent(strategy.avg_return)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {strategy.win_rate?.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <span className={strategy.sharpe_ratio > 1 ? 'text-green-400' : strategy.sharpe_ratio > 0 ? 'text-yellow-400' : 'text-red-400'}>
                          {strategy.sharpe_ratio?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {formatNumber(strategy.total_runs)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-white/10 rounded-full h-1.5">
                            <div
                              className="bg-primary rounded-full h-1.5"
                              style={{ width: `${strategy.confidence_score}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{strategy.confidence_score?.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {popularStrategies.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      충분한 데이터가 없습니다. 더 많은 전략이 실행되면 인사이트가 표시됩니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 전략 타입별 성과 */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📊</span>
            전략 타입별 성과
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(
              typePerformance.reduce((acc, item) => {
                if (!acc[item.strategy_type]) {
                  acc[item.strategy_type] = []
                }
                acc[item.strategy_type].push(item)
                return acc
              }, {} as Record<string, TypePerformance[]>)
            ).map(([type, items]) => {
              const avgReturn = items.reduce((sum, i) => sum + i.avg_return, 0) / items.length
              const avgWinRate = items.reduce((sum, i) => sum + i.avg_win_rate, 0) / items.length
              const totalRuns = items.reduce((sum, i) => sum + i.total_runs, 0)

              return (
                <div key={type} className="p-4 bg-white/5 rounded-lg">
                  <h4 className="font-medium mb-3">
                    {TYPE_LABELS[type] || type}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">평균 수익</span>
                      {formatPercent(avgReturn)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">평균 승률</span>
                      <span>{avgWinRate?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">총 실행</span>
                      <span>{formatNumber(totalRuns)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {items.map((item) => {
                        const info = getConditionInfo(item.market_condition)
                        return (
                          <span
                            key={item.market_condition}
                            className={`px-2 py-0.5 text-xs rounded ${info.color} bg-white/5`}
                            title={`${info.label}: ${item.avg_return?.toFixed(2)}%`}
                          >
                            {info.icon}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 면책조항 */}
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-sm text-yellow-400/80">
          <strong>면책조항:</strong> 본 데이터는 교육 목적의 익명화된 집계 데이터입니다.
          과거 성과는 미래 수익을 보장하지 않으며, 투자 조언이 아닙니다.
          모든 투자 결정은 본인의 책임하에 이루어져야 합니다.
        </p>
      </div>
    </div>
  )
}

export default StrategyInsights
