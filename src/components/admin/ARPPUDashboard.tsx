'use client'

// ============================================
// ARPPU Dashboard Component
// Loop 11: 코호트별 매출 분석
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface ARPPUCohort {
  cohort_date: string
  total_users: number
  paying_users: number
  conversion_rate: number
  total_revenue: number
  arppu: number
  arpu: number
  avg_orders_per_user: number
}

interface ARPPUSummary {
  total_users: number
  paying_users: number
  total_revenue: number
  arppu: number
  arpu: number
  conversion_rate: number
}

interface ARPPUTrends {
  total_users: number
  paying_users: number
  total_revenue: number
  arppu: number
  conversion_rate: number
}

interface ARPPUData {
  summary: ARPPUSummary
  trends: ARPPUTrends
  cohorts: ARPPUCohort[]
}

export function ARPPUDashboard() {
  const [data, setData] = useState<ARPPUData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cohortType, setCohortType] = useState<'week' | 'month'>('week')
  const [activeTab, setActiveTab] = useState<'overview' | 'cohorts' | 'packages'>('overview')

  const fetchARPPUData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 요약 데이터
      const summaryRes = await fetch('/api/admin/analytics/arppu?type=summary&days=30')
      const summaryData = await summaryRes.json()

      // 코호트 데이터
      const cohortRes = await fetch(`/api/admin/analytics/arppu?type=cohort&cohort=${cohortType}&days=90`)
      const cohortData = await cohortRes.json()

      setData({
        summary: summaryData.data || {
          total_users: 0,
          paying_users: 0,
          total_revenue: 0,
          arppu: 0,
          arpu: 0,
          conversion_rate: 0,
        },
        trends: summaryData.trends || {
          total_users: 0,
          paying_users: 0,
          total_revenue: 0,
          arppu: 0,
          conversion_rate: 0,
        },
        cohorts: cohortData.data || [],
      })
    } catch (err) {
      setError('Failed to load ARPPU data')
      console.error('[ARPPU] Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [cohortType])

  useEffect(() => {
    fetchARPPUData()
  }, [fetchARPPUData])

  // 금액 포맷
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`
    }
    return amount.toLocaleString()
  }

  // 트렌드 표시
  const renderTrend = (value: number) => {
    if (value === 0 || value === null) return null
    const isPositive = value > 0
    return (
      <span className={`text-xs ml-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{value.toFixed(1)}%
      </span>
    )
  }

  // ARPPU 상태 색상
  const getARPPUColor = (arppu: number): string => {
    if (arppu >= 50000) return 'text-green-400'
    if (arppu >= 30000) return 'text-yellow-400'
    if (arppu >= 10000) return 'text-orange-400'
    return 'text-red-400'
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
          <Button onClick={fetchARPPUData} variant="outline" className="mt-4">
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
            <p className="text-xs text-gray-400 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(data?.summary.total_revenue || 0)}
            </p>
            {renderTrend(data?.trends.total_revenue || 0)}
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">ARPPU</p>
            <p className={`text-2xl font-bold ${getARPPUColor(data?.summary.arppu || 0)}`}>
              {formatCurrency(data?.summary.arppu || 0)}
            </p>
            {renderTrend(data?.trends.arppu || 0)}
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">ARPU</p>
            <p className="text-2xl font-bold">
              {formatCurrency(data?.summary.arpu || 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">Paying Users</p>
            <p className="text-2xl font-bold">{data?.summary.paying_users || 0}</p>
            {renderTrend(data?.trends.paying_users || 0)}
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">Conversion</p>
            <p className="text-2xl font-bold text-primary">
              {(data?.summary.conversion_rate || 0).toFixed(1)}%
            </p>
            {renderTrend(data?.trends.conversion_rate || 0)}
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
            <CardTitle>Revenue Overview (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* ARPPU 게이지 */}
              <div className="p-6 bg-white/5 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400">ARPPU Target: 50,000</span>
                  <span className={`text-xl font-bold ${getARPPUColor(data?.summary.arppu || 0)}`}>
                    {formatCurrency(data?.summary.arppu || 0)}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all duration-500 ${
                      (data?.summary.arppu || 0) >= 50000 ? 'bg-green-500' :
                      (data?.summary.arppu || 0) >= 30000 ? 'bg-yellow-500' :
                      'bg-orange-500'
                    }`}
                    style={{ width: `${Math.min(((data?.summary.arppu || 0) / 50000) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>0</span>
                  <span>25K</span>
                  <span>50K</span>
                </div>
              </div>

              {/* 전환율 퍼널 미리보기 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-lg text-center">
                  <p className="text-3xl font-bold">{data?.summary.total_users || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Total Users</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg text-center relative">
                  <div className="absolute left-0 top-1/2 -translate-x-1/2 text-gray-500">
                    →
                  </div>
                  <p className="text-3xl font-bold">{data?.summary.paying_users || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Paying Users</p>
                  <p className="text-xs text-primary mt-1">
                    {(data?.summary.conversion_rate || 0).toFixed(1)}% conversion
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg text-center relative">
                  <div className="absolute left-0 top-1/2 -translate-x-1/2 text-gray-500">
                    →
                  </div>
                  <p className="text-3xl font-bold text-green-400">
                    {formatCurrency(data?.summary.total_revenue || 0)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Revenue</p>
                </div>
              </div>

              {/* 인사이트 */}
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-primary">Insight:</span>{' '}
                  {(data?.summary.arppu || 0) >= 50000
                    ? 'ARPPU가 목표를 달성했습니다. 결제 사용자당 평균 매출이 양호합니다.'
                    : (data?.summary.conversion_rate || 0) < 5
                    ? '전환율이 낮습니다. 무료 → 유료 전환 흐름을 개선해보세요.'
                    : 'ARPPU 개선이 필요합니다. 고가 패키지 프로모션을 고려해보세요.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'cohorts' && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Cohort ARPPU Analysis</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setCohortType('week')}
                className={`px-3 py-1 text-xs rounded ${
                  cohortType === 'week' ? 'bg-primary text-white' : 'bg-white/10 text-gray-400'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setCohortType('month')}
                className={`px-3 py-1 text-xs rounded ${
                  cohortType === 'month' ? 'bg-primary text-white' : 'bg-white/10 text-gray-400'
                }`}
              >
                Monthly
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="text-left py-2">Cohort</th>
                    <th className="text-right py-2">Users</th>
                    <th className="text-right py-2">Paying</th>
                    <th className="text-right py-2">Conv %</th>
                    <th className="text-right py-2">Revenue</th>
                    <th className="text-right py-2">ARPPU</th>
                    <th className="text-right py-2">ARPU</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.cohorts.slice(0, 12).map(cohort => (
                    <tr key={cohort.cohort_date} className="border-b border-white/5">
                      <td className="py-2">
                        {new Date(cohort.cohort_date).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: cohortType === 'week' ? 'numeric' : undefined,
                        })}
                      </td>
                      <td className="text-right">{cohort.total_users}</td>
                      <td className="text-right">{cohort.paying_users}</td>
                      <td className="text-right text-primary">
                        {cohort.conversion_rate?.toFixed(1) || '-'}%
                      </td>
                      <td className="text-right text-green-400">
                        {formatCurrency(cohort.total_revenue || 0)}
                      </td>
                      <td className={`text-right ${getARPPUColor(cohort.arppu || 0)}`}>
                        {formatCurrency(cohort.arppu || 0)}
                      </td>
                      <td className="text-right text-gray-400">
                        {formatCurrency(cohort.arpu || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(!data?.cohorts || data.cohorts.length === 0) && (
              <p className="text-center text-gray-500 py-8">
                No cohort data available yet. Data will appear as users sign up and make purchases.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-2">
        <Button onClick={fetchARPPUData} variant="outline" size="sm">
          Refresh Data
        </Button>
      </div>
    </div>
  )
}

export default ARPPUDashboard
