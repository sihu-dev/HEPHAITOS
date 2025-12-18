'use client'

// ============================================
// Safety Net Monitoring Dashboard
// Loop 13: 안전 정책 모니터링 UI
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface SafetyStats {
  total_events: number
  allow_count: number
  soften_count: number
  block_count: number
  by_feature: Record<string, number>
  by_policy: Record<string, number>
  trend: Array<{
    date: string
    count: number
    soften: number
    block: number
  }>
}

interface SafetySummary {
  total: number
  soften_rate: number
  block_rate: number
  top_policy: string
  top_feature: string
}

interface SafetyConfig {
  strictness: string
  enableLLMSoftening: boolean
  logAllEvents: boolean
  maxSoftenAttempts: number
  blockOnSoftenFailure: boolean
  addDisclaimerToAll: boolean
}

interface SafetyData {
  stats: SafetyStats
  summary: SafetySummary
  config: SafetyConfig
}

const POLICY_LABELS: Record<string, string> = {
  INVESTMENT_ADVICE: '투자 조언 금지',
  NO_GUARANTEE: '수익 보장 금지',
  NO_BUY_SELL_IMPERATIVE: '매매 권유 금지',
  TITLE_NO_EXTREME: '극단적 표현 금지',
  RULES_EDUCATIONAL_ONLY: '교육적 표현',
  SUMMARY_DISCLAIMER: '면책조항',
}

const FEATURE_LABELS: Record<string, string> = {
  strategy_generate: 'AI 전략 생성',
  report_create: '리포트 생성',
  tutor_answer: 'AI 튜터',
}

export function SafetyDashboard() {
  const [data, setData] = useState<SafetyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'test'>('overview')
  const [testContent, setTestContent] = useState('')
  const [testResult, setTestResult] = useState<unknown>(null)

  const fetchSafetyData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 통계 데이터
      const statsRes = await fetch('/api/admin/safety?type=stats&days=30')
      const statsData = await statsRes.json()

      // 설정 데이터
      const configRes = await fetch('/api/admin/safety?type=config')
      const configData = await configRes.json()

      setData({
        stats: statsData.data || {
          total_events: 0,
          allow_count: 0,
          soften_count: 0,
          block_count: 0,
          by_feature: {},
          by_policy: {},
          trend: [],
        },
        summary: statsData.summary || {
          total: 0,
          soften_rate: 0,
          block_rate: 0,
          top_policy: 'none',
          top_feature: 'none',
        },
        config: configData.data || {
          strictness: 'moderate',
          enableLLMSoftening: true,
          logAllEvents: false,
          maxSoftenAttempts: 3,
          blockOnSoftenFailure: false,
          addDisclaimerToAll: true,
        },
      })
    } catch (err) {
      setError('Failed to load safety data')
      console.error('[Safety] Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSafetyData()
  }, [fetchSafetyData])

  const handleTestSoften = async () => {
    if (!testContent.trim()) return

    try {
      const res = await fetch('/api/admin/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_soften',
          content: testContent,
          section: 'summary',
        }),
      })
      const result = await res.json()
      setTestResult(result)
    } catch (err) {
      console.error('[Safety] Test error:', err)
    }
  }

  // 색상 헬퍼
  const getDecisionColor = (decision: string): string => {
    switch (decision) {
      case 'allow': return 'text-green-400'
      case 'soften': return 'text-yellow-400'
      case 'block': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStrictnessColor = (strictness: string): string => {
    switch (strictness) {
      case 'strict': return 'bg-red-500/20 text-red-400'
      case 'moderate': return 'bg-yellow-500/20 text-yellow-400'
      case 'lenient': return 'bg-green-500/20 text-green-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="py-8 text-center">
          <p className="text-red-400">{error}</p>
          <Button onClick={fetchSafetyData} variant="outline" className="mt-4">
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">Total Events</p>
            <p className="text-2xl font-bold">{data?.stats.total_events || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">Allow</p>
            <p className="text-2xl font-bold text-green-400">
              {data?.stats.allow_count || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">Soften</p>
            <p className="text-2xl font-bold text-yellow-400">
              {data?.stats.soften_count || 0}
            </p>
            <p className="text-xs text-gray-500">{data?.summary.soften_rate}%</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">Block</p>
            <p className="text-2xl font-bold text-red-400">
              {data?.stats.block_count || 0}
            </p>
            <p className="text-xs text-gray-500">{data?.summary.block_rate}%</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">Strictness</p>
            <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getStrictnessColor(data?.config.strictness || '')}`}>
              {data?.config.strictness || 'moderate'}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
            activeTab === 'overview'
              ? 'bg-white/10 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
            activeTab === 'policies'
              ? 'bg-white/10 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Policies
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
            activeTab === 'test'
              ? 'bg-white/10 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Test
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* 트렌드 */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle>Daily Trend (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-end gap-1">
                {data?.stats.trend.slice(-14).map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                    {day.block > 0 && (
                      <div
                        className="bg-red-500 rounded-t"
                        style={{ height: `${Math.min(day.block * 20, 60)}px` }}
                        title={`Block: ${day.block}`}
                      />
                    )}
                    {day.soften > 0 && (
                      <div
                        className="bg-yellow-500"
                        style={{ height: `${Math.min(day.soften * 10, 80)}px` }}
                        title={`Soften: ${day.soften}`}
                      />
                    )}
                    <div
                      className="bg-green-500/50 rounded-b"
                      style={{ height: `${Math.min((day.count - day.soften - day.block) * 5, 40)}px` }}
                      title={`Allow: ${day.count - day.soften - day.block}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>14일 전</span>
                <span>오늘</span>
              </div>
            </CardContent>
          </Card>

          {/* 설정 요약 */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle>Current Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Strictness</span>
                  <span className={getStrictnessColor(data?.config.strictness || '')}>
                    {data?.config.strictness}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">LLM Softening</span>
                  <span className={data?.config.enableLLMSoftening ? 'text-green-400' : 'text-red-400'}>
                    {data?.config.enableLLMSoftening ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Soften Attempts</span>
                  <span>{data?.config.maxSoftenAttempts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Block on Failure</span>
                  <span className={data?.config.blockOnSoftenFailure ? 'text-red-400' : 'text-gray-400'}>
                    {data?.config.blockOnSoftenFailure ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Auto Disclaimer</span>
                  <span className={data?.config.addDisclaimerToAll ? 'text-green-400' : 'text-gray-400'}>
                    {data?.config.addDisclaimerToAll ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'policies' && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>Policy Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 정책별 히트 수 */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">By Policy</h4>
                <div className="space-y-2">
                  {Object.entries(data?.stats.by_policy || {})
                    .sort(([, a], [, b]) => b - a)
                    .map(([policy, count]) => (
                      <div key={policy} className="flex items-center gap-3">
                        <div className="w-40 text-sm truncate">
                          {POLICY_LABELS[policy] || policy}
                        </div>
                        <div className="flex-1 bg-white/5 rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{
                              width: `${Math.min((count / (data?.stats.total_events || 1)) * 100, 100)}%`
                            }}
                          />
                        </div>
                        <div className="w-12 text-right text-sm">{count}</div>
                      </div>
                    ))}
                </div>
              </div>

              {/* 기능별 히트 수 */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">By Feature</h4>
                <div className="space-y-2">
                  {Object.entries(data?.stats.by_feature || {})
                    .sort(([, a], [, b]) => b - a)
                    .map(([feature, count]) => (
                      <div key={feature} className="flex items-center gap-3">
                        <div className="w-40 text-sm truncate">
                          {FEATURE_LABELS[feature] || feature}
                        </div>
                        <div className="flex-1 bg-white/5 rounded-full h-2">
                          <div
                            className="bg-green-500 rounded-full h-2 transition-all"
                            style={{
                              width: `${Math.min((count / (data?.stats.total_events || 1)) * 100, 100)}%`
                            }}
                          />
                        </div>
                        <div className="w-12 text-right text-sm">{count}</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'test' && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>Test Content Softening</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <textarea
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                placeholder="테스트할 콘텐츠를 입력하세요... (예: 이 종목을 반드시 사세요! 100% 수익 보장합니다.)"
                className="w-full h-32 p-3 bg-white/5 border border-white/10 rounded-lg text-sm resize-none focus:outline-none focus:border-primary"
              />
              <Button onClick={handleTestSoften} variant="primary" size="sm">
                Test Soften
              </Button>

              {testResult !== null && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Result:</h4>
                  <pre className="text-xs overflow-auto max-h-64">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-2">
        <Button onClick={fetchSafetyData} variant="outline" size="sm">
          Refresh Data
        </Button>
      </div>
    </div>
  )
}

export default SafetyDashboard
