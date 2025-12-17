'use client'

// ============================================
// Enhanced Refund Management Dashboard
// Loop 14: 환불 정책 고도화
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface RefundRequest {
  id: string
  user_id: string
  order_id: string
  reason: string
  credits_used: number
  credits_total: number
  usage_rate: number
  refund_amount: number
  refund_rate: number
  days_since_purchase: number
  policy_rule: string
  auto_approved: boolean
  abuse_flag: boolean
  abuse_score: number
  status: string
  admin_note?: string
  created_at: string
  reviewed_at?: string
}

interface RefundStats {
  date: string
  total_requests: number
  approved: number
  rejected: number
  completed: number
  pending: number
  auto_approved: number
  abuse_flagged: number
  avg_refund_amount: number
  avg_usage_rate: number
  avg_refund_rate: number
  total_refunded: number
}

interface PolicyRule {
  id: number
  name: string
  description: string
  min_usage_rate: number
  max_usage_rate: number
  min_days: number
  max_days: number
  refund_rate: number
  requires_approval: boolean
  is_active: boolean
  priority: number
}

interface AbuseCandidate {
  user_id: string
  email: string
  refund_count: number
  total_refunded: number
  avg_abuse_score: number
  max_abuse_score: number
  policies_used: string[]
}

type TabType = 'requests' | 'stats' | 'policies' | 'abuse'
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'completed'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '대기', color: 'bg-yellow-500/20 text-yellow-400' },
  approved: { label: '승인', color: 'bg-green-500/20 text-green-400' },
  rejected: { label: '거절', color: 'bg-red-500/20 text-red-400' },
  completed: { label: '완료', color: 'bg-blue-500/20 text-blue-400' },
}

const POLICY_LABELS: Record<string, string> = {
  instant_unused: '즉시 환불 (미사용)',
  week_low_usage: '7일 이내 저사용',
  week_medium_usage: '7일 이내 중사용',
  week_high_usage: '7일 이내 고사용',
  month_low_usage: '30일 이내 저사용',
  month_medium_usage: '30일 이내 중사용',
  month_high_usage: '30일 이내 고사용',
  over_month_low: '30일 초과 저사용',
  over_month_medium: '30일 초과 중사용',
  special_case: '특수 케이스',
  no_refund: '환불 불가',
}

export function RefundDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('requests')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [requests, setRequests] = useState<RefundRequest[]>([])
  const [stats, setStats] = useState<RefundStats[]>([])
  const [policies, setPolicies] = useState<PolicyRule[]>([])
  const [abuseCandidates, setAbuseCandidates] = useState<AbuseCandidate[]>([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, completed: 0 })
  const [summary, setSummary] = useState({
    total_requests: 0,
    total_approved: 0,
    total_refunded: 0,
    avg_refund_rate: 0,
    abuse_flagged: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const status = statusFilter !== 'all' ? statusFilter : undefined

      // 요청 목록
      const listRes = await fetch(
        `/api/admin/refunds?type=list&days=30${status ? `&status=${status}` : ''}`
      )
      const listData = await listRes.json()
      setRequests(listData.data || [])
      setCounts(listData.counts || { pending: 0, approved: 0, rejected: 0, completed: 0 })

      // 통계
      const statsRes = await fetch('/api/admin/refunds?type=stats&days=30')
      const statsData = await statsRes.json()
      setStats(statsData.data || [])
      setSummary(statsData.summary || {})

      // 정책
      const policiesRes = await fetch('/api/admin/refunds?type=policies')
      const policiesData = await policiesRes.json()
      setPolicies(policiesData.data || [])

      // 어뷰징
      const abuseRes = await fetch('/api/admin/refunds?type=abuse')
      const abuseData = await abuseRes.json()
      setAbuseCandidates(abuseData.data || [])
    } catch (err) {
      console.error('[Refund] Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAction = async (action: 'approve' | 'reject' | 'complete') => {
    if (!selectedRequest) return
    setProcessing(true)

    try {
      const res = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          requestId: selectedRequest.id,
          adminNote,
        }),
      })
      const result = await res.json()

      if (result.success) {
        setSelectedRequest(null)
        setAdminNote('')
        fetchData()
      }
    } catch (err) {
      console.error('[Refund] Action error:', err)
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">총 요청</p>
            <p className="text-2xl font-bold">{summary.total_requests}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">승인</p>
            <p className="text-2xl font-bold text-green-400">{summary.total_approved}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">총 환불액</p>
            <p className="text-xl font-bold text-blue-400">
              {formatCurrency(summary.total_refunded || 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">평균 환불률</p>
            <p className="text-2xl font-bold">{summary.avg_refund_rate?.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-4">
            <p className="text-xs text-gray-400 mb-1">어뷰징 플래그</p>
            <p className="text-2xl font-bold text-red-400">{summary.abuse_flagged}</p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {(['requests', 'stats', 'policies', 'abuse'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
              activeTab === tab
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'requests' && `요청 (${counts.pending} 대기)`}
            {tab === 'stats' && '통계'}
            {tab === 'policies' && '정책'}
            {tab === 'abuse' && `어뷰징 (${abuseCandidates.length})`}
          </button>
        ))}
      </div>

      {/* 요청 목록 탭 */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* 필터 */}
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected', 'completed'] as StatusFilter[]).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    statusFilter === status
                      ? 'bg-primary text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {status === 'all' ? '전체' : STATUS_LABELS[status]?.label}
                  {status !== 'all' && ` (${counts[status]})`}
                </button>
              )
            )}
          </div>

          {/* 요청 테이블 */}
          <Card className="bg-white/5 border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-400">주문</th>
                    <th className="px-4 py-3 text-left text-gray-400">사용률</th>
                    <th className="px-4 py-3 text-left text-gray-400">환불액</th>
                    <th className="px-4 py-3 text-left text-gray-400">정책</th>
                    <th className="px-4 py-3 text-left text-gray-400">상태</th>
                    <th className="px-4 py-3 text-left text-gray-400">요청일</th>
                    <th className="px-4 py-3 text-left text-gray-400">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs">{req.order_id.slice(0, 8)}...</div>
                        <div className="text-xs text-gray-500">
                          {req.credits_used}/{req.credits_total} 크레딧
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-white/10 rounded-full h-1.5">
                            <div
                              className="bg-primary rounded-full h-1.5"
                              style={{ width: `${Math.min(req.usage_rate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs">{req.usage_rate?.toFixed(1)}%</span>
                        </div>
                        <div className="text-xs text-gray-500">{req.days_since_purchase}일</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{formatCurrency(req.refund_amount)}</div>
                        <div className="text-xs text-gray-500">{req.refund_rate}% 환불률</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">{POLICY_LABELS[req.policy_rule] || req.policy_rule}</div>
                        {req.abuse_flag && (
                          <span className="inline-block px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded mt-1">
                            어뷰징 {req.abuse_score?.toFixed(0)}점
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded ${
                            STATUS_LABELS[req.status]?.color || 'bg-gray-500/20'
                          }`}
                        >
                          {STATUS_LABELS[req.status]?.label || req.status}
                        </span>
                        {req.auto_approved && (
                          <div className="text-xs text-green-500 mt-1">자동승인</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {req.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(req)
                              setAdminNote('')
                            }}
                          >
                            처리
                          </Button>
                        )}
                        {req.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedRequest(req)
                              setAdminNote('')
                            }}
                          >
                            완료
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        환불 요청이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 통계 탭 */}
      {activeTab === 'stats' && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>일별 환불 통계 (30일)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 트렌드 차트 */}
              <div className="h-40 flex items-end gap-1">
                {stats.slice(-14).map((day, i) => {
                  const total = day.total_requests || 1
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                      <div
                        className="bg-green-500 rounded-t"
                        style={{
                          height: `${Math.min((day.completed / total) * 100, 100)}px`,
                        }}
                        title={`완료: ${day.completed}`}
                      />
                      <div
                        className="bg-yellow-500"
                        style={{
                          height: `${Math.min((day.pending / total) * 50, 50)}px`,
                        }}
                        title={`대기: ${day.pending}`}
                      />
                      <div
                        className="bg-red-500 rounded-b"
                        style={{
                          height: `${Math.min((day.rejected / total) * 30, 30)}px`,
                        }}
                        title={`거절: ${day.rejected}`}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>14일 전</span>
                <span>오늘</span>
              </div>

              {/* 통계 테이블 */}
              <div className="overflow-x-auto mt-6">
                <table className="w-full text-xs">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-400">날짜</th>
                      <th className="px-3 py-2 text-right text-gray-400">요청</th>
                      <th className="px-3 py-2 text-right text-gray-400">승인</th>
                      <th className="px-3 py-2 text-right text-gray-400">완료</th>
                      <th className="px-3 py-2 text-right text-gray-400">거절</th>
                      <th className="px-3 py-2 text-right text-gray-400">자동승인</th>
                      <th className="px-3 py-2 text-right text-gray-400">환불액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.slice(0, 14).map((day) => (
                      <tr key={day.date}>
                        <td className="px-3 py-2">{day.date}</td>
                        <td className="px-3 py-2 text-right">{day.total_requests}</td>
                        <td className="px-3 py-2 text-right text-green-400">{day.approved}</td>
                        <td className="px-3 py-2 text-right text-blue-400">{day.completed}</td>
                        <td className="px-3 py-2 text-right text-red-400">{day.rejected}</td>
                        <td className="px-3 py-2 text-right">{day.auto_approved}</td>
                        <td className="px-3 py-2 text-right">
                          {formatCurrency(day.total_refunded || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 정책 탭 */}
      {activeTab === 'policies' && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>환불 정책 규칙</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">
                        {POLICY_LABELS[policy.name] || policy.name}
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">{policy.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {policy.refund_rate}%
                      </div>
                      <div className="text-xs text-gray-500">환불률</div>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-gray-400">
                    <span>
                      사용률: {policy.min_usage_rate}% ~ {policy.max_usage_rate}%
                    </span>
                    <span>
                      기간: {policy.min_days}일 ~ {policy.max_days}일
                    </span>
                    {policy.requires_approval && (
                      <span className="text-yellow-400">관리자 승인 필요</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 어뷰징 탭 */}
      {activeTab === 'abuse' && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>어뷰징 의심 사용자 (90일)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-400">사용자</th>
                    <th className="px-4 py-3 text-right text-gray-400">환불 횟수</th>
                    <th className="px-4 py-3 text-right text-gray-400">총 환불액</th>
                    <th className="px-4 py-3 text-right text-gray-400">평균 점수</th>
                    <th className="px-4 py-3 text-right text-gray-400">최고 점수</th>
                    <th className="px-4 py-3 text-left text-gray-400">사용 정책</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {abuseCandidates.map((user) => (
                    <tr key={user.user_id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs">{user.email}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`${
                            user.refund_count >= 3 ? 'text-red-400' : 'text-yellow-400'
                          }`}
                        >
                          {user.refund_count}회
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(user.total_refunded)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`${
                            user.avg_abuse_score >= 50 ? 'text-red-400' : 'text-yellow-400'
                          }`}
                        >
                          {user.avg_abuse_score?.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`${
                            user.max_abuse_score >= 80 ? 'text-red-400' : 'text-yellow-400'
                          }`}
                        >
                          {user.max_abuse_score?.toFixed(0)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.policies_used?.slice(0, 3).map((p) => (
                            <span
                              key={p}
                              className="px-1.5 py-0.5 text-xs bg-white/10 rounded"
                            >
                              {POLICY_LABELS[p]?.slice(0, 6) || p.slice(0, 6)}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {abuseCandidates.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        어뷰징 의심 사용자가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 처리 모달 */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 bg-gray-900 border-white/10">
            <CardHeader>
              <CardTitle>환불 요청 처리</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-white/5 rounded-lg text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">주문 ID</span>
                  <span className="font-mono">{selectedRequest.order_id.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">환불 금액</span>
                  <span className="font-medium">
                    {formatCurrency(selectedRequest.refund_amount)}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">사용률</span>
                  <span>{selectedRequest.usage_rate?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">적용 정책</span>
                  <span>
                    {POLICY_LABELS[selectedRequest.policy_rule] || selectedRequest.policy_rule}
                  </span>
                </div>
                {selectedRequest.abuse_flag && (
                  <div className="mt-2 p-2 bg-red-500/10 rounded text-red-400 text-xs">
                    어뷰징 의심 (점수: {selectedRequest.abuse_score?.toFixed(0)})
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">관리자 메모</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="처리 사유를 입력하세요..."
                  className="w-full h-20 p-2 bg-white/5 border border-white/10 rounded text-sm resize-none focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-2">
                {selectedRequest.status === 'pending' && (
                  <>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => handleAction('approve')}
                      disabled={processing}
                    >
                      {processing ? '처리 중...' : '승인'}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                      onClick={() => handleAction('reject')}
                      disabled={processing}
                    >
                      거절
                    </Button>
                  </>
                )}
                {selectedRequest.status === 'approved' && (
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => handleAction('complete')}
                    disabled={processing}
                  >
                    {processing ? '환불 처리 중...' : '환불 완료 처리'}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => setSelectedRequest(null)}
                  disabled={processing}
                >
                  취소
                </Button>
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

export default RefundDashboard
