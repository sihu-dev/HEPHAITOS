'use client'

// ============================================
// Cost Tracking Dashboard
// Loop 15: 비용 대시보드
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { safeLogger } from '@/lib/utils/safe-logger';

interface CostSummary {
  period_days: number
  total_cost: number
  daily_avg: number
  by_provider: Record<string, {
    total_cost: number
    total_tokens: number
    api_calls: number
    avg_latency: number
  }>
  by_feature: Record<string, {
    total_cost: number
    total_tokens: number
    count: number
  }>
  daily_trend: Array<{
    date: string
    total_cost: number
    ai_cost: number
    api_cost: number
  }>
  budget_status: Array<{
    provider: string
    budget: number
    spent: number
    percentage: number
    alert_threshold: number
  }>
}

interface CostLog {
  id: string
  provider: string
  model: string
  feature: string
  input_tokens: number
  output_tokens: number
  total_cost: number
  latency_ms: number
  success: boolean
  created_at: string
}

interface Alert {
  id: string
  alert_type: string
  provider: string
  message: string
  percentage: number
  acknowledged: boolean
  created_at: string
}

type TabType = 'overview' | 'providers' | 'features' | 'logs' | 'budgets'

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  anthropic: { label: 'Anthropic', color: 'bg-purple-500' },
  openai: { label: 'OpenAI', color: 'bg-green-500' },
  unusual_whales: { label: 'Unusual Whales', color: 'bg-blue-500' },
  quiver: { label: 'Quiver', color: 'bg-yellow-500' },
}

const FEATURE_LABELS: Record<string, string> = {
  strategy_generate: 'AI 전략 생성',
  report_create: '리포트 생성',
  tutor_answer: 'AI 튜터',
  market_analysis: '시장 분석',
  other: '기타',
}

export function CostDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [summary, setSummary] = useState<CostSummary | null>(null)
  const [logs, setLogs] = useState<CostLog[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [days, setDays] = useState(30)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // 요약 데이터
      const summaryRes = await fetch(`/api/admin/costs?type=summary&days=${days}`)
      const summaryData = await summaryRes.json()
      setSummary(summaryData.data || null)

      // 로그 데이터
      const logsRes = await fetch(`/api/admin/costs?type=logs&days=${days}`)
      const logsData = await logsRes.json()
      setLogs(logsData.data || [])

      // 알림 데이터
      const alertsRes = await fetch('/api/admin/costs?type=alerts')
      const alertsData = await alertsRes.json()
      setAlerts(alertsData.data || [])
    } catch (err) {
      safeLogger.error('[Cost] Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAcknowledge = async (alertId: string) => {
    try {
      await fetch('/api/admin/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'acknowledge_alert',
          alertId,
        }),
      })
      fetchData()
    } catch (err) {
      safeLogger.error('[Cost] Acknowledge error:', err)
    }
  }

  const formatCurrency = (amount: number, currency: 'USD' | 'KRW' = 'USD') => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }).format(amount)
    }
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount * 1400) // 대략적 환율
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getProviderInfo = (provider: string) => {
    return PROVIDER_LABELS[provider] || { label: provider, color: 'bg-gray-500' }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged)

  return (
    <div className="space-y-6">
      {/* 알림 배너 */}
      {unacknowledgedAlerts.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-red-400 text-xl">!</span>
                <div>
                  <p className="font-medium text-red-400">
                    {unacknowledgedAlerts.length}개의 비용 알림
                  </p>
                  <p className="text-sm text-gray-400">
                    {unacknowledgedAlerts[0]?.message}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAcknowledge(unacknowledgedAlerts[0]?.id)}
              >
                확인
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">Total Cost ({days}일)</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(summary?.total_cost || 0)}
            </p>
            <p className="text-xs text-gray-500">
              {formatCurrency(summary?.total_cost || 0, 'KRW')}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">Daily Average</p>
            <p className="text-2xl font-bold">
              {formatCurrency(summary?.daily_avg || 0)}
            </p>
            <p className="text-xs text-gray-500">
              {formatCurrency(summary?.daily_avg || 0, 'KRW')}/일
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">AI API Cost</p>
            <p className="text-2xl font-bold text-purple-400">
              {formatCurrency(
                Object.values(summary?.by_provider || {})
                  .filter((_, i) => ['anthropic', 'openai'].includes(Object.keys(summary?.by_provider || {})[i]))
                  .reduce((sum, p) => sum + (p.total_cost || 0), 0)
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">External API Cost</p>
            <p className="text-2xl font-bold text-blue-400">
              {formatCurrency(
                Object.values(summary?.by_provider || {})
                  .filter((_, i) => !['anthropic', 'openai'].includes(Object.keys(summary?.by_provider || {})[i]))
                  .reduce((sum, p) => sum + (p.total_cost || 0), 0)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 기간 선택 */}
      <div className="flex gap-2">
        {[7, 14, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              days === d
                ? 'bg-primary text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {d}일
          </button>
        ))}
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {(['overview', 'providers', 'features', 'logs', 'budgets'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
              activeTab === tab
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'providers' && 'Providers'}
            {tab === 'features' && 'Features'}
            {tab === 'logs' && `Logs (${logs.length})`}
            {tab === 'budgets' && 'Budgets'}
          </button>
        ))}
      </div>

      {/* Overview 탭 */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* 일별 트렌드 */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle>Daily Cost Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-end gap-1">
                {summary?.daily_trend?.slice(-14).map((day, i) => {
                  const maxCost = Math.max(...(summary?.daily_trend || []).map(d => d.total_cost || 1))
                  const height = ((day.total_cost || 0) / maxCost) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                      <div
                        className="bg-purple-500 rounded-t"
                        style={{ height: `${(day.ai_cost / (day.total_cost || 1)) * height}px` }}
                        title={`AI: ${formatCurrency(day.ai_cost)}`}
                      />
                      <div
                        className="bg-blue-500 rounded-b"
                        style={{ height: `${(day.api_cost / (day.total_cost || 1)) * height}px` }}
                        title={`API: ${formatCurrency(day.api_cost)}`}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>14일 전</span>
                <span>오늘</span>
              </div>
              <div className="flex gap-4 mt-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-purple-500 rounded" />
                  AI Cost
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500 rounded" />
                  API Cost
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 예산 상태 */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle>Budget Status (This Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary?.budget_status?.map((budget) => {
                  const info = getProviderInfo(budget.provider)
                  const isOver = budget.percentage >= budget.alert_threshold
                  return (
                    <div key={budget.provider} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{info.label}</span>
                        <span className={isOver ? 'text-red-400' : ''}>
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isOver ? 'bg-red-500' : info.color
                          }`}
                          style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 text-right">
                        {budget.percentage.toFixed(1)}%
                        {isOver && <span className="text-red-400 ml-2">임계값 초과</span>}
                      </div>
                    </div>
                  )
                })}
                {(!summary?.budget_status || summary.budget_status.length === 0) && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    설정된 예산이 없습니다.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Providers 탭 */}
      {activeTab === 'providers' && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>Cost by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(summary?.by_provider || {}).map(([provider, data]) => {
                const info = getProviderInfo(provider)
                const percentage = ((data.total_cost || 0) / (summary?.total_cost || 1)) * 100
                return (
                  <div key={provider} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded ${info.color}`} />
                        <span className="font-medium">{info.label}</span>
                      </div>
                      <span className="text-lg font-bold">
                        {formatCurrency(data.total_cost || 0)}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 mb-3">
                      <div
                        className={`h-1.5 rounded-full ${info.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs text-gray-400">
                      <div>
                        <p className="text-gray-500">Tokens</p>
                        <p>{formatNumber(data.total_tokens || 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">API Calls</p>
                        <p>{formatNumber(data.api_calls || 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Avg Latency</p>
                        <p>{data.avg_latency || 0}ms</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features 탭 */}
      {activeTab === 'features' && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>Cost by Feature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary?.by_feature || {})
                .sort(([, a], [, b]) => (b.total_cost || 0) - (a.total_cost || 0))
                .map(([feature, data]) => {
                  const percentage = ((data.total_cost || 0) / (summary?.total_cost || 1)) * 100
                  return (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="w-32 text-sm truncate">
                        {FEATURE_LABELS[feature] || feature}
                      </div>
                      <div className="flex-1 bg-white/5 rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-24 text-right text-sm">
                        {formatCurrency(data.total_cost || 0)}
                      </div>
                      <div className="w-16 text-right text-xs text-gray-500">
                        {data.count}회
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs 탭 */}
      {activeTab === 'logs' && (
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          <CardHeader>
            <CardTitle>Recent API Logs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-400">Time</th>
                    <th className="px-4 py-3 text-left text-gray-400">Provider</th>
                    <th className="px-4 py-3 text-left text-gray-400">Model</th>
                    <th className="px-4 py-3 text-left text-gray-400">Feature</th>
                    <th className="px-4 py-3 text-right text-gray-400">Tokens</th>
                    <th className="px-4 py-3 text-right text-gray-400">Cost</th>
                    <th className="px-4 py-3 text-right text-gray-400">Latency</th>
                    <th className="px-4 py-3 text-center text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.slice(0, 100).map((log) => {
                    const info = getProviderInfo(log.provider)
                    return (
                      <tr key={log.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded ${info.color}`} />
                            {info.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono">
                          {log.model || '-'}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {FEATURE_LABELS[log.feature] || log.feature || '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-xs">
                          {log.input_tokens > 0 && (
                            <span className="text-gray-500">
                              {formatNumber(log.input_tokens)} in / {formatNumber(log.output_tokens)} out
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {formatCurrency(log.total_cost)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-gray-400">
                          {log.latency_ms}ms
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              log.success ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                        </td>
                      </tr>
                    )
                  })}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        로그가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budgets 탭 */}
      {activeTab === 'budgets' && (
        <div className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle>Monthly Budgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary?.budget_status?.map((budget) => {
                  const info = getProviderInfo(budget.provider)
                  return (
                    <div
                      key={budget.provider}
                      className="p-4 bg-white/5 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded ${info.color}`} />
                        <span>{info.label}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(budget.budget)}/월</p>
                        <p className="text-xs text-gray-500">
                          Alert at {budget.alert_threshold}%
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 알림 기록 */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg ${
                      alert.acknowledged
                        ? 'bg-white/5'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={alert.acknowledged ? 'text-gray-400' : 'text-red-400'}>
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(alert.created_at)}
                        </p>
                      </div>
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAcknowledge(alert.id)}
                        >
                          확인
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    알림 기록이 없습니다.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 새로고침 버튼 */}
      <div className="flex justify-end">
        <Button onClick={fetchData} variant="outline" size="sm">
          Refresh Data
        </Button>
      </div>
    </div>
  )
}

export default CostDashboard
