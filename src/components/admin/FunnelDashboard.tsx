'use client'

// ============================================
// Conversion Funnel Dashboard Component
// Loop 12: 전환율 퍼널 시각화
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { safeLogger } from '@/lib/utils/safe-logger';

interface FunnelStage {
  stage_name: string
  stage_order: number
  total_users: number
  converted_users: number
  conversion_rate: number
  cumulative_rate: number
  drop_off_rate: number
  avg_days_to_convert: number | null
}

interface FunnelCohort {
  cohort_date: string
  signups: number
  activated: number
  activation_rate: number
  purchased: number
  purchase_rate: number
  repeated: number
  repeat_rate: number
}

interface FunnelData {
  stages: FunnelStage[]
  cohorts: FunnelCohort[]
  summary: {
    total_signups: number
    total_purchases: number
    overall_conversion: number
    biggest_drop_off: string
  }
}

const STAGE_LABELS: Record<string, string> = {
  signup: '회원가입',
  first_activity: '첫 활동',
  first_purchase: '첫 결제',
  repeat_purchase: '재결제',
}

const STAGE_COLORS: Record<string, string> = {
  signup: 'bg-blue-500',
  first_activity: 'bg-purple-500',
  first_purchase: 'bg-green-500',
  repeat_purchase: 'bg-yellow-500',
}

export function FunnelDashboard() {
  const [data, setData] = useState<FunnelData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'funnel' | 'cohorts' | 'insights'>('funnel')
  const [days, setDays] = useState(30)

  const fetchFunnelData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 퍼널 단계 데이터
      const stagesRes = await fetch(`/api/admin/analytics/funnel?type=stages&days=${days}`)
      const stagesData = await stagesRes.json()

      // 코호트 데이터
      const cohortRes = await fetch(`/api/admin/analytics/funnel?type=cohort&cohort=week&days=${days}`)
      const cohortData = await cohortRes.json()

      setData({
        stages: stagesData.data || [],
        cohorts: cohortData.data || [],
        summary: stagesData.summary || {
          total_signups: 0,
          total_purchases: 0,
          overall_conversion: 0,
          biggest_drop_off: 'unknown',
        },
      })
    } catch (err) {
      setError('Failed to load funnel data')
      safeLogger.error('[Funnel] Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchFunnelData()
  }, [fetchFunnelData])

  // 전환율 색상
  const getConversionColor = (rate: number): string => {
    if (rate >= 50) return 'text-green-400'
    if (rate >= 30) return 'text-yellow-400'
    if (rate >= 10) return 'text-orange-400'
    return 'text-red-400'
  }

  // 퍼널 바 너비 계산
  const getFunnelWidth = (users: number, maxUsers: number): number => {
    if (maxUsers === 0) return 100
    return Math.max((users / maxUsers) * 100, 10)
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
          <Button onClick={fetchFunnelData} variant="outline" className="mt-4">
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  const maxUsers = data?.stages[0]?.total_users || 1

  return (
    <div className="space-y-6">
      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">Total Signups</p>
            <p className="text-2xl font-bold">{data?.summary.total_signups || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">Purchasers</p>
            <p className="text-2xl font-bold text-green-400">
              {data?.summary.total_purchases || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">Overall Conversion</p>
            <p className={`text-2xl font-bold ${getConversionColor(data?.summary.overall_conversion || 0)}`}>
              {(data?.summary.overall_conversion || 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">Biggest Drop-off</p>
            <p className="text-2xl font-bold text-red-400">
              {STAGE_LABELS[data?.summary.biggest_drop_off || ''] || data?.summary.biggest_drop_off}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 기간 선택 */}
      <div className="flex gap-2">
        {[7, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 text-xs rounded ${
              days === d ? 'bg-primary text-white' : 'bg-white/10 text-gray-400'
            }`}
          >
            {d}일
          </button>
        ))}
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('funnel')}
          className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
            activeTab === 'funnel'
              ? 'bg-white/10 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Funnel View
        </button>
        <button
          onClick={() => setActiveTab('cohorts')}
          className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
            activeTab === 'cohorts'
              ? 'bg-white/10 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Cohort Analysis
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
            activeTab === 'insights'
              ? 'bg-white/10 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Insights
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'funnel' && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>Conversion Funnel (Last {days} Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 퍼널 시각화 */}
            <div className="space-y-4">
              {data?.stages.map((stage, index) => (
                <div key={stage.stage_name} className="relative">
                  {/* 단계 라벨 */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      {STAGE_LABELS[stage.stage_name] || stage.stage_name}
                    </span>
                    <span className="text-sm text-gray-400">
                      {stage.total_users} users
                      {index > 0 && (
                        <span className={`ml-2 ${getConversionColor(stage.cumulative_rate)}`}>
                          ({stage.cumulative_rate}%)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* 퍼널 바 */}
                  <div className="relative">
                    <div
                      className={`h-10 ${STAGE_COLORS[stage.stage_name] || 'bg-gray-500'} rounded-lg transition-all duration-500 flex items-center justify-center`}
                      style={{ width: `${getFunnelWidth(stage.total_users, maxUsers)}%` }}
                    >
                      <span className="text-xs font-bold text-white">
                        {stage.total_users}
                      </span>
                    </div>
                  </div>

                  {/* 전환율 화살표 */}
                  {index < (data?.stages.length || 0) - 1 && (
                    <div className="flex items-center justify-center py-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">↓</span>
                        <span className={getConversionColor(stage.conversion_rate)}>
                          {stage.conversion_rate}% 전환
                        </span>
                        <span className="text-red-400">
                          ({stage.drop_off_rate}% 이탈)
                        </span>
                        {stage.avg_days_to_convert && (
                          <span className="text-gray-500">
                            평균 {stage.avg_days_to_convert}일
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 데이터 없음 */}
            {(!data?.stages || data.stages.length === 0) && (
              <p className="text-center text-gray-500 py-8">
                No funnel data available yet.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'cohorts' && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>Weekly Cohort Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="text-left py-2">Cohort</th>
                    <th className="text-right py-2">Signups</th>
                    <th className="text-right py-2">Activated</th>
                    <th className="text-right py-2">Act. %</th>
                    <th className="text-right py-2">Purchased</th>
                    <th className="text-right py-2">Purch. %</th>
                    <th className="text-right py-2">Repeated</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.cohorts.slice(0, 10).map(cohort => (
                    <tr key={cohort.cohort_date} className="border-b border-white/5">
                      <td className="py-2">
                        {new Date(cohort.cohort_date).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="text-right">{cohort.signups}</td>
                      <td className="text-right">{cohort.activated}</td>
                      <td className={`text-right ${getConversionColor(cohort.activation_rate)}`}>
                        {cohort.activation_rate?.toFixed(1) || '-'}%
                      </td>
                      <td className="text-right text-green-400">{cohort.purchased}</td>
                      <td className={`text-right ${getConversionColor(cohort.purchase_rate)}`}>
                        {cohort.purchase_rate?.toFixed(1) || '-'}%
                      </td>
                      <td className="text-right text-yellow-400">{cohort.repeated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(!data?.cohorts || data.cohorts.length === 0) && (
              <p className="text-center text-gray-500 py-8">
                No cohort data available yet.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'insights' && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>Funnel Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 자동 인사이트 생성 */}
              {data?.stages.map((stage, index) => {
                if (index === 0) return null
                const prevStage = data.stages[index - 1]

                if (stage.drop_off_rate > 50) {
                  return (
                    <div key={stage.stage_name} className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                      <p className="text-sm">
                        <span className="font-semibold text-red-400">High Drop-off Alert:</span>{' '}
                        {STAGE_LABELS[prevStage.stage_name]} → {STAGE_LABELS[stage.stage_name]} 단계에서{' '}
                        <span className="font-bold">{stage.drop_off_rate}%</span>의 이탈이 발생합니다.
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        권장: {stage.stage_name === 'first_activity'
                          ? '온보딩 플로우 개선, 튜토리얼 추가'
                          : stage.stage_name === 'first_purchase'
                          ? '무료 크레딧 제공, 가격 정책 검토'
                          : '재방문 캠페인, 푸시 알림 활성화'}
                      </p>
                    </div>
                  )
                }

                if (stage.conversion_rate >= 50) {
                  return (
                    <div key={stage.stage_name} className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <p className="text-sm">
                        <span className="font-semibold text-green-400">Strong Performance:</span>{' '}
                        {STAGE_LABELS[prevStage.stage_name]} → {STAGE_LABELS[stage.stage_name]} 전환율이{' '}
                        <span className="font-bold">{stage.conversion_rate}%</span>로 양호합니다.
                      </p>
                    </div>
                  )
                }

                return null
              })}

              {/* 전체 요약 */}
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-primary">Summary:</span>{' '}
                  전체 {data?.summary.total_signups || 0}명 가입자 중{' '}
                  {data?.summary.total_purchases || 0}명이 결제({(data?.summary.overall_conversion || 0).toFixed(1)}%).{' '}
                  {(data?.summary.overall_conversion || 0) >= 10
                    ? '목표 전환율(10%)을 달성했습니다.'
                    : '목표 전환율(10%) 달성을 위해 개선이 필요합니다.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-2">
        <Button onClick={fetchFunnelData} variant="outline" size="sm">
          Refresh Data
        </Button>
      </div>
    </div>
  )
}

export default FunnelDashboard
