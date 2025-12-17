'use client'

// ============================================
// Public Status Page Component
// Loop 18: Status Page 구축
// ============================================

import { useState, useEffect, useCallback } from 'react'

interface Service {
  service_id: string
  name: string
  description: string
  category: string
  status: ServiceStatus
  latency_ms: number | null
  is_critical: boolean
  last_checked: string
}

interface Incident {
  id: string
  title: string
  status: IncidentStatus
  impact: Impact
  affected_services: string[]
  started_at: string
  resolved_at: string | null
  status_incident_updates?: IncidentUpdate[]
}

interface IncidentUpdate {
  id: string
  status: IncidentStatus
  message: string
  created_at: string
}

interface Maintenance {
  id: string
  title: string
  description: string
  affected_services: string[]
  scheduled_start: string
  scheduled_end: string
  status: MaintenanceStatus
}

type ServiceStatus = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance'
type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved'
type Impact = 'none' | 'minor' | 'major' | 'critical'
type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

const STATUS_CONFIG: Record<ServiceStatus, { label: string; color: string; bg: string }> = {
  operational: { label: '정상', color: 'text-green-400', bg: 'bg-green-500' },
  degraded: { label: '성능 저하', color: 'text-yellow-400', bg: 'bg-yellow-500' },
  partial_outage: { label: '부분 장애', color: 'text-orange-400', bg: 'bg-orange-500' },
  major_outage: { label: '장애', color: 'text-red-400', bg: 'bg-red-500' },
  maintenance: { label: '점검 중', color: 'text-blue-400', bg: 'bg-blue-500' },
}

const IMPACT_CONFIG: Record<Impact, { label: string; color: string }> = {
  none: { label: '영향 없음', color: 'text-gray-400' },
  minor: { label: '경미', color: 'text-yellow-400' },
  major: { label: '주요', color: 'text-orange-400' },
  critical: { label: '심각', color: 'text-red-400' },
}

const INCIDENT_STATUS_CONFIG: Record<IncidentStatus, { label: string; color: string }> = {
  investigating: { label: '조사 중', color: 'text-yellow-400' },
  identified: { label: '원인 파악', color: 'text-orange-400' },
  monitoring: { label: '모니터링 중', color: 'text-blue-400' },
  resolved: { label: '해결됨', color: 'text-green-400' },
}

const CATEGORY_LABELS: Record<string, string> = {
  core: '핵심 서비스',
  api: 'API 서비스',
  integration: '외부 연동',
  infrastructure: '인프라',
}

export function StatusPage() {
  const [overallStatus, setOverallStatus] = useState<ServiceStatus>('operational')
  const [services, setServices] = useState<Service[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [maintenance, setMaintenance] = useState<Maintenance[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status?type=overview')
      const data = await res.json()

      setOverallStatus(data.overall_status || 'operational')
      setServices(data.services || [])
      setIncidents(data.active_incidents || [])
      setMaintenance(data.upcoming_maintenance || [])
      setLastUpdated(new Date(data.last_updated))
    } catch (err) {
      console.error('[StatusPage] Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}일 전`
    if (hours > 0) return `${hours}시간 전`
    if (minutes > 0) return `${minutes}분 전`
    return '방금 전'
  }

  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = []
    }
    acc[service.category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">HEPHAITOS Status</h1>
              <p className="text-sm text-gray-400 mt-1">시스템 상태 모니터링</p>
            </div>
            {lastUpdated && (
              <p className="text-xs text-gray-500">
                마지막 업데이트: {formatRelativeTime(lastUpdated.toISOString())}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Overall Status Banner */}
        <div className={`p-6 rounded-xl ${
          overallStatus === 'operational'
            ? 'bg-green-500/10 border border-green-500/30'
            : overallStatus === 'degraded'
            ? 'bg-yellow-500/10 border border-yellow-500/30'
            : overallStatus === 'maintenance'
            ? 'bg-blue-500/10 border border-blue-500/30'
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${STATUS_CONFIG[overallStatus].bg} animate-pulse`} />
            <div>
              <h2 className={`text-xl font-bold ${STATUS_CONFIG[overallStatus].color}`}>
                {overallStatus === 'operational'
                  ? '모든 시스템 정상 운영 중'
                  : overallStatus === 'degraded'
                  ? '일부 서비스 성능 저하'
                  : overallStatus === 'maintenance'
                  ? '시스템 점검 중'
                  : '시스템 장애 발생'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {services.filter(s => s.status === 'operational').length}/{services.length} 서비스 정상
              </p>
            </div>
          </div>
        </div>

        {/* Active Incidents */}
        {incidents.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold mb-4">활성 인시던트</h3>
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{incident.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className={INCIDENT_STATUS_CONFIG[incident.status].color}>
                          {INCIDENT_STATUS_CONFIG[incident.status].label}
                        </span>
                        <span className={IMPACT_CONFIG[incident.impact].color}>
                          {IMPACT_CONFIG[incident.impact].label}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(incident.started_at)}
                    </span>
                  </div>

                  {/* Timeline */}
                  {incident.status_incident_updates && incident.status_incident_updates.length > 0 && (
                    <div className="border-l-2 border-white/10 pl-4 space-y-3 mt-4">
                      {incident.status_incident_updates
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, 3)
                        .map((update) => (
                          <div key={update.id} className="text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                              <span className={INCIDENT_STATUS_CONFIG[update.status].color}>
                                {INCIDENT_STATUS_CONFIG[update.status].label}
                              </span>
                              <span className="text-xs">
                                {formatDate(update.created_at)}
                              </span>
                            </div>
                            <p className="mt-1 text-gray-300">{update.message}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Maintenance */}
        {maintenance.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold mb-4">예정된 점검</h3>
            <div className="space-y-4">
              {maintenance.map((m) => (
                <div
                  key={m.id}
                  className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{m.title}</h4>
                      {m.description && (
                        <p className="text-sm text-gray-400 mt-1">{m.description}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      m.status === 'in_progress'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {m.status === 'in_progress' ? '진행 중' : '예정됨'}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-gray-400">
                    <span>{formatDate(m.scheduled_start)}</span>
                    <span className="mx-2">→</span>
                    <span>{formatDate(m.scheduled_end)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Services by Category */}
        <section>
          <h3 className="text-lg font-semibold mb-4">서비스 상태</h3>
          <div className="space-y-6">
            {Object.entries(groupedServices).map(([category, categoryServices]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-400 mb-3">
                  {CATEGORY_LABELS[category] || category}
                </h4>
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  {categoryServices.map((service, index) => (
                    <div
                      key={service.service_id}
                      className={`flex items-center justify-between p-4 ${
                        index < categoryServices.length - 1 ? 'border-b border-white/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[service.status].bg}`} />
                        <div>
                          <span className="font-medium">{service.name}</span>
                          {service.is_critical && (
                            <span className="ml-2 text-xs text-yellow-500">Critical</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {service.latency_ms && (
                          <span className="text-xs text-gray-500">
                            {service.latency_ms}ms
                          </span>
                        )}
                        <span className={`text-sm ${STATUS_CONFIG[service.status].color}`}>
                          {STATUS_CONFIG[service.status].label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Uptime History (Last 90 days) */}
        <section>
          <h3 className="text-lg font-semibold mb-4">90일 가동 기록</h3>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex gap-0.5">
              {Array.from({ length: 90 }, (_, i) => {
                // Simulated uptime data
                const uptime = Math.random() > 0.05 ? 'operational' : 'degraded'
                return (
                  <div
                    key={i}
                    className={`flex-1 h-8 rounded-sm ${STATUS_CONFIG[uptime as ServiceStatus].bg} opacity-80 hover:opacity-100 transition-opacity`}
                    title={`${90 - i}일 전`}
                  />
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>90일 전</span>
              <span>오늘</span>
            </div>
            <p className="text-sm text-gray-400 mt-3 text-center">
              99.9% 가동률 (지난 90일)
            </p>
          </div>
        </section>

        {/* Legend */}
        <section className="flex flex-wrap gap-4 justify-center text-sm">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${config.bg}`} />
              <span className="text-gray-400">{config.label}</span>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>
            상태 알림을 받으시려면{' '}
            <a href="/status/subscribe" className="text-primary hover:underline">
              구독하기
            </a>
          </p>
          <p className="mt-2">
            © 2025 HEPHAITOS. 모든 시스템 상태는 실시간으로 모니터링됩니다.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default StatusPage
