'use client'

// ============================================
// Retention Dashboard Component
// Loop 10: D1/D7 리텐션 시각화
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { safeLogger } from '@/lib/utils/safe-logger';

interface RetentionCurvePoint {
  day_number: number
  retention_rate: number
  retained_users: number
  total_users: number
}

interface CohortMetric {
  cohort_date: string
  cohort_size: number
  d1_retained: number
  d1_rate: number
  d7_retained: number
  d7_rate: number
  d30_rate: number
}

interface RetentionData {
  curve: RetentionCurvePoint[]
  cohorts: CohortMetric[]
  summary: {
    d1: number
    d7: number
    d30: number
    totalUsers: number
  }
}

export function RetentionDashboard() {
  const [data, setData] = useState<RetentionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'cohorts' | 'curve'>('overview')

  const fetchRetentionData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 커브 데이터
      const curveRes = await fetch('/api/admin/analytics/retention?type=curve')
      const curveData = await curveRes.json()

      // 코호트 데이터
      const cohortRes = await fetch('/api/admin/analytics/retention?type=cohort&days=30')
      const cohortData = await cohortRes.json()

      setData({
        curve: curveData.data || [],
        cohorts: cohortData.data || [],
        summary: {
          d1: curveData.summary?.d1 || cohortData.summary?.avg_d1_rate || 0,
          d7: curveData.summary?.d7 || cohortData.summary?.avg_d7_rate || 0,
          d30: curveData.summary?.d30 || 0,
          totalUsers: cohortData.summary?.total_cohort_users || 0,
        },
      })
    } catch (err) {
      setError('Failed to load retention data')
      safeLogger.error('[Retention] Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRetentionData()
  }, [fetchRetentionData])

  // 리텐션 상태 색상
  const getRetentionColor = (rate: number): string => {
    if (rate >= 40) return 'text-green-400'
    if (rate >= 25) return 'text-yellow-400'
    if (rate >= 10) return 'text-orange-400'
    return 'text-red-400'
  }

  // 리텐션 바 렌더링
  const renderRetentionBar = (rate: number, maxRate: number = 100) => {
    const percentage = Math.min((rate / maxRate) * 100, 100)
    return (
      <div className="w-full bg-white/5 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            rate >= 40 ? 'bg-green-500' :
            rate >= 25 ? 'bg-yellow-500' :
            rate >= 10 ? 'bg-orange-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
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
          <Button onClick={fetchRetentionData} variant="outline" className="mt-4">
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">Total Users</p>
            <p className="text-2xl font-bold">{data?.summary.totalUsers || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">D1 Retention</p>
            <p className={`text-2xl font-bold ${getRetentionColor(data?.summary.d1 || 0)}`}>
              {data?.summary.d1?.toFixed(1) || 0}%
            </p>
            {renderRetentionBar(data?.summary.d1 || 0)}
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">D7 Retention</p>
            <p className={`text-2xl font-bold ${getRetentionColor(data?.summary.d7 || 0)}`}>
              {data?.summary.d7?.toFixed(1) || 0}%
            </p>
            {renderRetentionBar(data?.summary.d7 || 0)}
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">D30 Retention</p>
            <p className={`text-2xl font-bold ${getRetentionColor(data?.summary.d30 || 0)}`}>
              {data?.summary.d30?.toFixed(1) || 0}%
            </p>
            {renderRetentionBar(data?.summary.d30 || 0)}
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
          onClick={() => setActiveTab('curve')}
          className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
            activeTab === 'curve'
              ? 'bg-white/10 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Retention Curve
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
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'overview' && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>Retention Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 목표 대비 현황 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">D1 Target: 40%</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${
                      (data?.summary.d1 || 0) >= 40 ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {(data?.summary.d1 || 0) >= 40 ? 'Achieved' : 'Below Target'}
                    </span>
                    <span className="text-sm text-gray-400">
                      ({((data?.summary.d1 || 0) - 40).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">D7 Target: 20%</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${
                      (data?.summary.d7 || 0) >= 20 ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {(data?.summary.d7 || 0) >= 20 ? 'Achieved' : 'Below Target'}
                    </span>
                    <span className="text-sm text-gray-400">
                      ({((data?.summary.d7 || 0) - 20).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">D30 Benchmark: 10%</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${
                      (data?.summary.d30 || 0) >= 10 ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {(data?.summary.d30 || 0) >= 10 ? 'Good' : 'Needs Work'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 인사이트 */}
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-primary">Insight:</span>{' '}
                  {(data?.summary.d1 || 0) >= 40
                    ? 'D1 리텐션이 목표를 달성했습니다. 온보딩이 효과적입니다.'
                    : 'D1 리텐션 개선이 필요합니다. 온보딩 흐름을 점검해보세요.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'curve' && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>Retention Curve (Day 0-30)</CardTitle>
          </CardHeader>
          <CardContent>
            {/* ASCII 스타일 차트 */}
            <div className="font-mono text-xs space-y-1">
              <div className="flex items-end h-40 gap-1">
                {data?.curve.slice(0, 31).map((point, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/50 rounded-t transition-all hover:bg-primary"
                    style={{ height: `${point.retention_rate}%` }}
                    title={`Day ${point.day_number}: ${point.retention_rate}%`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-gray-500 pt-2 border-t border-white/10">
                <span>D0</span>
                <span>D7</span>
                <span>D14</span>
                <span>D21</span>
                <span>D30</span>
              </div>
            </div>

            {/* 데이터 테이블 */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="text-left py-2">Day</th>
                    <th className="text-right py-2">Rate</th>
                    <th className="text-right py-2">Retained</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 3, 7, 14, 30].map(day => {
                    const point = data?.curve.find(p => p.day_number === day)
                    return (
                      <tr key={day} className="border-b border-white/5">
                        <td className="py-2">D{day}</td>
                        <td className={`text-right ${getRetentionColor(point?.retention_rate || 0)}`}>
                          {point?.retention_rate?.toFixed(1) || '-'}%
                        </td>
                        <td className="text-right">{point?.retained_users || '-'}</td>
                        <td className="text-right text-gray-400">{point?.total_users || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'cohorts' && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>Daily Cohort Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="text-left py-2">Cohort Date</th>
                    <th className="text-right py-2">Size</th>
                    <th className="text-right py-2">D1</th>
                    <th className="text-right py-2">D7</th>
                    <th className="text-right py-2">D30</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.cohorts.slice(0, 14).map(cohort => (
                    <tr key={cohort.cohort_date} className="border-b border-white/5">
                      <td className="py-2">
                        {new Date(cohort.cohort_date).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="text-right">{cohort.cohort_size}</td>
                      <td className={`text-right ${getRetentionColor(cohort.d1_rate || 0)}`}>
                        {cohort.d1_rate?.toFixed(1) || '-'}%
                      </td>
                      <td className={`text-right ${getRetentionColor(cohort.d7_rate || 0)}`}>
                        {cohort.d7_rate?.toFixed(1) || '-'}%
                      </td>
                      <td className={`text-right ${getRetentionColor(cohort.d30_rate || 0)}`}>
                        {cohort.d30_rate?.toFixed(1) || '-'}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(!data?.cohorts || data.cohorts.length === 0) && (
              <p className="text-center text-gray-500 py-8">
                No cohort data available yet. Data will appear as users sign up.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-2">
        <Button onClick={fetchRetentionData} variant="outline" size="sm">
          Refresh Data
        </Button>
      </div>
    </div>
  )
}

export default RetentionDashboard
