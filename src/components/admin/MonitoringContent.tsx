'use client'


// ============================================
// Admin Monitoring Dashboard
// GPT V1 피드백: 시스템 상태 모니터링 UI
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface CircuitStatus {
  state: 'closed' | 'open' | 'half-open'
  failures: number
  lastFailure: number | null
  openUntil: number | null
}

interface MonitoringData {
  timestamp: string
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: string
  }
  circuits: {
    redis: boolean
    circuits: {
      ai: CircuitStatus
      payment: CircuitStatus
      broker: CircuitStatus
      external: CircuitStatus
    }
    summary: {
      total: number
      open: number
      halfOpen: number
      closed: number
    }
  }
  dlq: {
    total: number
    pending: number
    retrying: number
    resolved: number
    abandoned: number
    by_provider?: Record<string, number>
  }
  rateLimiter: {
    backend: 'redis' | 'memory'
    connected: boolean
  }
  webhooks: {
    total: number
    pending: number
    processed: number
    failed: number
    dlq: number
    ignored: number
    last24h: number
  }
  credits: {
    last24h: {
      purchased: number
      spent: number
      refunded: number
      bonus: number
    }
    activeUsers: number
  }
  performance: {
    totalRequests: number
    avgDuration: number
    errorRate: number
    slowRequests: number
    topErrors: Array<{ path: string; count: number }>
  }
}

function StatusBadge({ status }: { status: 'healthy' | 'warning' | 'error' }) {
  const colors = {
    healthy: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const labels = {
    healthy: 'Healthy',
    warning: 'Warning',
    error: 'Error',
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs border ${colors[status]}`}>
      {labels[status]}
    </span>
  )
}

function CircuitCard({ name, status }: { name: string; status: CircuitStatus }) {
  const stateColors = {
    closed: 'text-green-400',
    open: 'text-red-400',
    'half-open': 'text-yellow-400',
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{name}</span>
        <span className={`text-sm font-medium ${stateColors[status.state]}`}>
          {status.state.toUpperCase()}
        </span>
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        <div>Failures: {status.failures}</div>
        {status.openUntil && (
          <div>
            Resets: {new Date(status.openUntil).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  subValue,
  trend,
}: {
  label: string
  value: number | string
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subValue && (
        <div className={`text-xs mt-1 ${trend ? trendColors[trend] : 'text-gray-400'}`}>
          {subValue}
        </div>
      )}
    </div>
  )
}

export function MonitoringContent() {
  const router = useRouter()
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/monitoring')

      if (response.status === 401) {
        router.push('/auth/login?redirect=/admin/monitoring')
        return
      }

      if (response.status === 403) {
        setError('관리자 권한이 필요합니다.')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch monitoring data')
      }

      const result = await response.json()
      setData(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()

    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000) // 30초마다 갱신
      return () => clearInterval(interval)
    }
    return undefined
  }, [fetchData, autoRefresh])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    )
  }

  if (!data) return null

  const overallHealth =
    data.health?.status === 'unhealthy' || data.circuits.summary.open > 0
      ? 'error'
      : data.health?.status === 'degraded' || data.dlq.pending > 0 || data.circuits.summary.halfOpen > 0
      ? 'warning'
      : 'healthy'

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">System Monitoring</h1>
            <p className="text-sm text-gray-400">
              Last updated: {new Date(data.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={overallHealth} />
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto Refresh (30s)
            </label>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-primary hover:bg-[#6B78E5] rounded-lg text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Circuit Breakers */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Circuit Breakers
            <span className={`w-2 h-2 rounded-full ${data.circuits.redis ? 'bg-green-400' : 'bg-red-400'}`} />
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CircuitCard name="AI (Claude)" status={data.circuits.circuits.ai} />
            <CircuitCard name="Payment (Toss)" status={data.circuits.circuits.payment} />
            <CircuitCard name="Broker (KIS)" status={data.circuits.circuits.broker} />
            <CircuitCard name="External API" status={data.circuits.circuits.external} />
          </div>
        </section>

        {/* DLQ */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Dead Letter Queue</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              label="Total"
              value={data.dlq.total}
            />
            <StatCard
              label="Pending"
              value={data.dlq.pending}
              trend={data.dlq.pending > 0 ? 'down' : 'neutral'}
            />
            <StatCard
              label="Retrying"
              value={data.dlq.retrying}
            />
            <StatCard
              label="Resolved"
              value={data.dlq.resolved}
              trend="up"
            />
            <StatCard
              label="Abandoned"
              value={data.dlq.abandoned}
              trend={data.dlq.abandoned > 0 ? 'down' : 'neutral'}
            />
          </div>
        </section>

        {/* Webhooks */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Webhook Events</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <StatCard label="Total" value={data.webhooks.total} />
            <StatCard label="Last 24h" value={data.webhooks.last24h} />
            <StatCard
              label="Processed"
              value={data.webhooks.processed}
              trend="up"
            />
            <StatCard
              label="Pending"
              value={data.webhooks.pending}
              trend={data.webhooks.pending > 0 ? 'down' : 'neutral'}
            />
            <StatCard
              label="Failed"
              value={data.webhooks.failed}
              trend={data.webhooks.failed > 0 ? 'down' : 'neutral'}
            />
            <StatCard label="Ignored" value={data.webhooks.ignored} />
          </div>
        </section>

        {/* Credits */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Credits (Last 24h)</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              label="Active Users"
              value={data.credits.activeUsers}
            />
            <StatCard
              label="Purchased"
              value={data.credits.last24h.purchased.toLocaleString()}
              trend="up"
            />
            <StatCard
              label="Spent"
              value={data.credits.last24h.spent.toLocaleString()}
            />
            <StatCard
              label="Refunded"
              value={data.credits.last24h.refunded.toLocaleString()}
            />
            <StatCard
              label="Bonus"
              value={data.credits.last24h.bonus.toLocaleString()}
            />
          </div>
        </section>

        {/* Performance */}
        {data.performance && (
          <section>
            <h2 className="text-lg font-semibold mb-4">API Performance</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Requests"
                value={data.performance.totalRequests.toLocaleString()}
              />
              <StatCard
                label="Avg Response Time"
                value={`${data.performance.avgDuration}ms`}
                trend={data.performance.avgDuration > 500 ? 'down' : 'up'}
              />
              <StatCard
                label="Error Rate"
                value={`${data.performance.errorRate.toFixed(1)}%`}
                trend={data.performance.errorRate > 5 ? 'down' : 'up'}
              />
              <StatCard
                label="Slow Requests"
                value={data.performance.slowRequests}
                trend={data.performance.slowRequests > 0 ? 'down' : 'neutral'}
              />
            </div>
            {data.performance.topErrors.length > 0 && (
              <div className="mt-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="text-sm text-gray-400 mb-2">Top Error Paths</div>
                <div className="space-y-1">
                  {data.performance.topErrors.map((err, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-300 font-mono truncate">{err.path}</span>
                      <span className="text-red-400">{err.count} errors</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Rate Limiter */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Rate Limiter</h2>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${data.rateLimiter.connected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm text-gray-400">
                  Backend: {data.rateLimiter.backend.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                Status: {data.rateLimiter.connected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
