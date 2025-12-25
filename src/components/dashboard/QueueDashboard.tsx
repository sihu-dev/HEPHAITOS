'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BacktestProgress } from '@/components/backtest/BacktestProgress'
import { DisclaimerInline } from '@/components/ui/Disclaimer'
import { createClient } from '@/lib/supabase/client'
import {
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline'

interface QueueMetrics {
  waiting: number
  active: number
  completed: number
  failed: number
}

interface BacktestJob {
  id: string
  job_id: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  progress: number
  message: string | null
  created_at: string
  completed_at: string | null
  result: {
    totalReturn?: number
    sharpeRatio?: number
    error?: string
  } | null
}

export function QueueDashboard() {
  const [metrics, setMetrics] = useState<QueueMetrics>({ waiting: 0, active: 0, completed: 0, failed: 0 })
  const [jobs, setJobs] = useState<BacktestJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  const supabase = createClient()

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user's jobs
        const { data: jobsData, error } = await supabase
          .from('backtest_jobs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error

        setJobs(jobsData || [])

        // Calculate metrics
        const waiting = jobsData?.filter(j => j.status === 'pending').length || 0
        const active = jobsData?.filter(j => j.status === 'active').length || 0
        const completed = jobsData?.filter(j => j.status === 'completed').length || 0
        const failed = jobsData?.filter(j => j.status === 'failed').length || 0

        setMetrics({ waiting, active, completed, failed })
      } catch (error) {
        console.error('[QueueDashboard] Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('queue-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'backtest_jobs',
        },
        (payload) => {
          console.log('[QueueDashboard] Realtime update:', payload)
          // Refresh data on any change
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const activeJobs = jobs.filter(j => j.status === 'active')
  const historyJobs = jobs.filter(j => j.status === 'completed' || j.status === 'failed')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-white">백테스트 큐 대시보드</h1>
          <p className="text-sm text-zinc-400 mt-0.5">실시간 백테스트 작업 모니터링</p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-all"
        >
          <ArrowPathIcon className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* Queue Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <motion.div
          className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-zinc-400">대기 중</span>
          </div>
          {isLoading ? (
            <div className="h-6 w-12 bg-white/[0.06] rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-semibold text-yellow-400">{metrics.waiting}</p>
          )}
        </motion.div>

        <motion.div
          className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <PlayIcon className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-zinc-400">실행 중</span>
          </div>
          {isLoading ? (
            <div className="h-6 w-12 bg-white/[0.06] rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-semibold text-blue-400">{metrics.active}</p>
          )}
        </motion.div>

        <motion.div
          className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-zinc-400">완료</span>
          </div>
          {isLoading ? (
            <div className="h-6 w-12 bg-white/[0.06] rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-semibold text-emerald-400">{metrics.completed}</p>
          )}
        </motion.div>

        <motion.div
          className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <XCircleIcon className="w-4 h-4 text-red-400" />
            <span className="text-sm text-zinc-400">실패</span>
          </div>
          {isLoading ? (
            <div className="h-6 w-12 bg-white/[0.06] rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-semibold text-red-400">{metrics.failed}</p>
          )}
        </motion.div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-all ${
            activeTab === 'active'
              ? 'bg-white/[0.08] text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Cog6ToothIcon className="w-4 h-4" />
          실행 중 ({activeJobs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-all ${
            activeTab === 'history'
              ? 'bg-white/[0.08] text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <QueueListIcon className="w-4 h-4" />
          작업 기록 ({historyJobs.length})
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] animate-pulse">
                    <div className="h-4 w-48 bg-white/[0.06] rounded mb-2" />
                    <div className="h-2 w-full bg-white/[0.06] rounded" />
                  </div>
                ))}
              </div>
            ) : activeJobs.length > 0 ? (
              activeJobs.map((job) => (
                <BacktestProgress
                  key={job.job_id}
                  jobId={job.job_id}
                  onComplete={(result) => {
                    console.log('[QueueDashboard] Job completed:', result)
                  }}
                  onError={(error) => {
                    console.error('[QueueDashboard] Job failed:', error)
                  }}
                />
              ))
            ) : (
              <div className="py-12 px-4 text-center border border-white/[0.06] rounded-lg">
                <div className="w-10 h-10 mx-auto mb-4 rounded bg-white/[0.04] flex items-center justify-center">
                  <Cog6ToothIcon className="w-5 h-5 text-zinc-400" />
                </div>
                <p className="text-sm text-zinc-400 mb-1">실행 중인 작업이 없습니다</p>
                <p className="text-xs text-zinc-400">새로운 백테스트를 시작하세요</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border border-white/[0.06] rounded-lg">
              {isLoading ? (
                <div className="divide-y divide-white/[0.06]">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 animate-pulse">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 w-40 bg-white/[0.06] rounded" />
                        <div className="h-4 w-16 bg-white/[0.06] rounded" />
                      </div>
                      <div className="h-3 w-full bg-white/[0.04] rounded" />
                    </div>
                  ))}
                </div>
              ) : historyJobs.length > 0 ? (
                <div className="divide-y divide-white/[0.06]">
                  {historyJobs.map((job) => (
                    <motion.div
                      key={job.id}
                      className="p-4 hover:bg-white/[0.02] transition-colors"
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-zinc-500">
                            {job.job_id.slice(0, 16)}...
                          </span>
                          <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                            job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            job.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                            'bg-zinc-500/10 text-zinc-400'
                          }`}>
                            {job.status === 'completed' ? '완료' : job.status === 'failed' ? '실패' : job.status}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400">
                          {formatDate(job.completed_at || job.created_at)}
                        </span>
                      </div>

                      {job.status === 'completed' && job.result && (
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5">
                            <ChartBarIcon className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-zinc-400">수익률:</span>
                            <span className={`font-medium ${(job.result.totalReturn ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {(job.result.totalReturn ?? 0) > 0 ? '+' : ''}{job.result.totalReturn?.toFixed(2)}%
                            </span>
                          </div>
                          <span className="text-zinc-600">•</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-400">Sharpe:</span>
                            <span className="font-medium text-white">{job.result.sharpeRatio?.toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      {job.status === 'failed' && job.result?.error && (
                        <p className="text-xs text-red-400">{job.result.error}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-12 px-4 text-center">
                  <div className="w-10 h-10 mx-auto mb-4 rounded bg-white/[0.04] flex items-center justify-center">
                    <QueueListIcon className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-sm text-zinc-400 mb-1">작업 기록이 없습니다</p>
                  <p className="text-xs text-zinc-400">백테스트를 실행하면 여기에 표시됩니다</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 면책조항 */}
      <div className="pt-4">
        <DisclaimerInline />
      </div>
    </div>
  )
}
