'use client'

// ============================================
// Pricing Experiments Dashboard
// Loop 24: 성과 기반 가격 실험
// ============================================

import React, { useState, useEffect, useCallback } from 'react'
import {
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BarChart3,
  Play,
  Pause,
  CheckCircle,
  Plus,
  ChevronRight,
  Target,
  Percent,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'

// ============================================
// Types
// ============================================

interface Experiment {
  id: string
  name: string
  description: string
  hypothesis: string
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled'
  start_date: string | null
  end_date: string | null
  target_sample_size: number
  confidence_level: number
  primary_metric: string
  secondary_metrics: string[]
  variants: Variant[]
  created_at: string
}

interface Variant {
  id: string
  name: string
  description: string
  traffic_allocation: number
  pricing_model: string
  pricing_config: Record<string, unknown>
  is_control: boolean
}

interface ExperimentResult {
  experiment_id: string
  experiment_name: string
  status: string
  variant_id: string
  variant_name: string
  is_control: boolean
  traffic_allocation: number
  pricing_model: string
  sample_size: number
  conversions: number
  conversion_rate: number
  total_revenue: number
  avg_revenue_per_conversion: number
  avg_revenue_per_user: number
  conversion_lift: number
}

interface ExperimentStats {
  total_experiments: number
  running_experiments: number
  completed_experiments: number
  total_participants: number
  total_conversions: number
  total_revenue: number
}

type TabType = 'overview' | 'experiments' | 'performance' | 'settings'

// ============================================
// API Functions
// ============================================

async function fetchExperiments(): Promise<Experiment[]> {
  const response = await fetch('/api/experiments?type=list')
  if (!response.ok) throw new Error('Failed to fetch experiments')
  const data = await response.json()
  return data.data || []
}

async function fetchStats(): Promise<ExperimentStats> {
  const response = await fetch('/api/experiments?type=stats')
  if (!response.ok) throw new Error('Failed to fetch stats')
  const data = await response.json()
  return data.data
}

async function fetchResults(experimentId?: string): Promise<ExperimentResult[]> {
  const url = experimentId
    ? `/api/experiments?type=results&id=${experimentId}`
    : '/api/experiments?type=results'
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch results')
  const data = await response.json()
  return data.data || []
}

async function startExperiment(experimentId: string): Promise<void> {
  const response = await fetch('/api/experiments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'start_experiment', experiment_id: experimentId }),
  })
  if (!response.ok) throw new Error('Failed to start experiment')
}

async function pauseExperiment(experimentId: string): Promise<void> {
  const response = await fetch('/api/experiments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pause_experiment', experiment_id: experimentId }),
  })
  if (!response.ok) throw new Error('Failed to pause experiment')
}

async function completeExperiment(experimentId: string): Promise<void> {
  const response = await fetch('/api/experiments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'complete_experiment', experiment_id: experimentId }),
  })
  if (!response.ok) throw new Error('Failed to complete experiment')
}

// ============================================
// Sub Components
// ============================================

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}) {
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{title}</span>
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {trend && trendValue && (
        <div
          className={`flex items-center gap-1 mt-1 text-xs ${
            trend === 'up'
              ? 'text-green-400'
              : trend === 'down'
              ? 'text-red-400'
              : 'text-gray-400'
          }`}
        >
          {trend === 'up' ? (
            <TrendingUp className="w-3 h-3" />
          ) : trend === 'down' ? (
            <TrendingDown className="w-3 h-3" />
          ) : null}
          {trendValue}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    draft: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: FlaskConical },
    running: { bg: 'bg-green-500/20', text: 'text-green-400', icon: Play },
    paused: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Pause },
    completed: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: CheckCircle },
    cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertTriangle },
  }

  const { bg, text, icon: Icon } = config[status] || config.draft

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${bg} ${text}`}>
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function ExperimentCard({
  experiment,
  onRefresh,
}: {
  experiment: Experiment
  onRefresh: () => void
}) {
  const [results, setResults] = useState<ExperimentResult[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const loadResults = useCallback(async () => {
    if (experiment.status === 'draft') return
    setLoading(true)
    try {
      const data = await fetchResults(experiment.id)
      setResults(data)
    } finally {
      setLoading(false)
    }
  }, [experiment.id, experiment.status])

  useEffect(() => {
    if (expanded) {
      loadResults()
    }
  }, [expanded, loadResults])

  const handleStart = async () => {
    await startExperiment(experiment.id)
    onRefresh()
  }

  const handlePause = async () => {
    await pauseExperiment(experiment.id)
    onRefresh()
  }

  const handleComplete = async () => {
    await completeExperiment(experiment.id)
    onRefresh()
  }

  const controlResult = results.find((r) => r.is_control)
  const variantResults = results.filter((r) => !r.is_control)

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-medium text-white">{experiment.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {experiment.variants.length} variants • Target: {experiment.target_sample_size.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={experiment.status} />
            <ChevronRight
              className={`w-4 h-4 text-gray-400 transition-transform ${
                expanded ? 'rotate-90' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/10">
          {/* Hypothesis */}
          {experiment.hypothesis && (
            <div className="pt-4">
              <h4 className="text-xs text-gray-400 mb-1">Hypothesis</h4>
              <p className="text-sm text-gray-300">{experiment.hypothesis}</p>
            </div>
          )}

          {/* Variants */}
          <div>
            <h4 className="text-xs text-gray-400 mb-2">Variants</h4>
            <div className="space-y-2">
              {experiment.variants.map((variant) => {
                const result = results.find((r) => r.variant_id === variant.id)
                return (
                  <div
                    key={variant.id}
                    className={`p-3 rounded-lg ${
                      variant.is_control ? 'bg-blue-500/10' : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{variant.name}</span>
                        {variant.is_control && (
                          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded">
                            Control
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {variant.traffic_allocation}% traffic
                      </span>
                    </div>

                    <div className="text-xs text-gray-400 mb-2">
                      Model: {variant.pricing_model}
                    </div>

                    {result && (
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <div className="text-lg font-bold text-white">
                            {result.sample_size}
                          </div>
                          <div className="text-[10px] text-gray-500">Users</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white">
                            {result.conversion_rate}%
                          </div>
                          <div className="text-[10px] text-gray-500">Conv.</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white">
                            ₩{(result.total_revenue / 1000).toFixed(0)}K
                          </div>
                          <div className="text-[10px] text-gray-500">Revenue</div>
                        </div>
                        <div>
                          <div
                            className={`text-lg font-bold ${
                              result.conversion_lift > 0
                                ? 'text-green-400'
                                : result.conversion_lift < 0
                                ? 'text-red-400'
                                : 'text-gray-400'
                            }`}
                          >
                            {result.conversion_lift > 0 ? '+' : ''}
                            {result.conversion_lift}%
                          </div>
                          <div className="text-[10px] text-gray-500">Lift</div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Statistical Significance */}
          {controlResult && variantResults.length > 0 && (
            <div className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg">
              <h4 className="text-xs text-gray-400 mb-2">Statistical Analysis</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-300">Control Conversion</div>
                  <div className="text-xl font-bold text-white">
                    {controlResult.conversion_rate}%
                  </div>
                </div>
                {variantResults.map((vr) => (
                  <div key={vr.variant_id}>
                    <div className="text-sm text-gray-300">{vr.variant_name} Lift</div>
                    <div
                      className={`text-xl font-bold ${
                        vr.conversion_lift > 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {vr.conversion_lift > 0 ? '+' : ''}
                      {vr.conversion_lift}%
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-2">
                * 95% 신뢰 수준 기준. 샘플 크기가 충분하면 통계적 유의성이 표시됩니다.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {experiment.status === 'draft' && (
              <button
                onClick={handleStart}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
              >
                <Play className="w-4 h-4" />
                Start
              </button>
            )}
            {experiment.status === 'running' && (
              <>
                <button
                  onClick={handlePause}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete
                </button>
              </>
            )}
            {experiment.status === 'paused' && (
              <button
                onClick={handleStart}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
            )}
            {loading && (
              <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading results...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PerformancePricingSection() {
  const [enabled, setEnabled] = useState(false)
  const [feePercent, setFeePercent] = useState(20)
  const [minProfit, setMinProfit] = useState(100000)

  const handleToggle = async () => {
    const action = enabled ? 'disable_performance_pricing' : 'enable_performance_pricing'
    const response = await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        success_fee_percent: feePercent,
        min_profit_threshold: minProfit,
      }),
    })
    if (response.ok) {
      setEnabled(!enabled)
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Percent className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Performance-based Pricing</h3>
              <p className="text-xs text-gray-400">
                수익이 발생할 때만 수수료를 지불합니다
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              enabled ? 'bg-indigo-500' : 'bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400">Success Fee</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={feePercent}
                onChange={(e) => setFeePercent(Number(e.target.value))}
                disabled={enabled}
                className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm disabled:opacity-50"
              />
              <span className="text-gray-400">%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">Min Profit Threshold</label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-400">₩</span>
              <input
                type="number"
                value={minProfit}
                onChange={(e) => setMinProfit(Number(e.target.value))}
                disabled={enabled}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <h4 className="text-xs text-gray-400 mb-2">How it works</h4>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• 기본 사용료: ₩0 (무료 시작)</li>
            <li>
              • 수익 발생 시: {feePercent}% 수수료 (최소 ₩{minProfit.toLocaleString()} 이상)
            </li>
            <li>• 월별 정산</li>
            <li>• 손실 발생 시: 수수료 없음</li>
          </ul>
        </div>
      </div>

      {/* Simulation */}
      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
        <h3 className="text-sm font-medium text-white mb-3">수수료 시뮬레이션</h3>
        <div className="space-y-3">
          {[100000, 500000, 1000000, 5000000].map((profit) => {
            const fee = profit >= minProfit ? profit * (feePercent / 100) : 0
            return (
              <div key={profit} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  ₩{profit.toLocaleString()} 수익
                </span>
                <span className="text-sm font-medium text-white">
                  → ₩{fee.toLocaleString()} 수수료
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export default function PricingExperiments() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [stats, setStats] = useState<ExperimentStats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [experimentsData, statsData] = await Promise.all([
        fetchExperiments(),
        fetchStats(),
      ])
      setExperiments(experimentsData)
      setStats(statsData)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'experiments', label: 'Experiments', icon: FlaskConical },
    { id: 'performance', label: 'Performance', icon: Percent },
    { id: 'settings', label: 'Settings', icon: Target },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pricing Experiments</h1>
          <p className="text-sm text-gray-400 mt-1">A/B 테스트 및 성과 기반 가격 실험</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              title="Total Experiments"
              value={stats?.total_experiments || 0}
              icon={FlaskConical}
            />
            <StatCard
              title="Running"
              value={stats?.running_experiments || 0}
              icon={Play}
              trend="up"
              trendValue="Active"
            />
            <StatCard
              title="Completed"
              value={stats?.completed_experiments || 0}
              icon={CheckCircle}
            />
            <StatCard
              title="Participants"
              value={(stats?.total_participants || 0).toLocaleString()}
              icon={Users}
            />
            <StatCard
              title="Conversions"
              value={(stats?.total_conversions || 0).toLocaleString()}
              icon={Target}
            />
            <StatCard
              title="Revenue"
              value={`₩${((stats?.total_revenue || 0) / 1000000).toFixed(1)}M`}
              icon={DollarSign}
            />
          </div>

          {/* Running Experiments */}
          <div>
            <h2 className="text-lg font-medium text-white mb-4">Running Experiments</h2>
            <div className="space-y-3">
              {experiments
                .filter((e) => e.status === 'running')
                .map((experiment) => (
                  <ExperimentCard
                    key={experiment.id}
                    experiment={experiment}
                    onRefresh={loadData}
                  />
                ))}
              {experiments.filter((e) => e.status === 'running').length === 0 && (
                <div className="p-8 text-center bg-white/5 rounded-xl border border-white/10">
                  <FlaskConical className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                  <p className="text-gray-400">실행 중인 실험이 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'experiments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">All Experiments</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
              <Plus className="w-4 h-4" />
              New Experiment
            </button>
          </div>

          <div className="space-y-3">
            {experiments.map((experiment) => (
              <ExperimentCard
                key={experiment.id}
                experiment={experiment}
                onRefresh={loadData}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'performance' && <PerformancePricingSection />}

      {activeTab === 'settings' && (
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <h2 className="text-lg font-medium text-white mb-4">Experiment Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Default Confidence Level</label>
              <select className="mt-1 w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                <option value="0.90">90%</option>
                <option value="0.95">95% (Recommended)</option>
                <option value="0.99">99%</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Default Sample Size</label>
              <input
                type="number"
                defaultValue={1000}
                className="mt-1 w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Minimum Detectable Effect</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  defaultValue={5}
                  className="w-20 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                />
                <span className="text-gray-400">%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
        <p className="text-xs text-gray-500 leading-relaxed">
          본 실험 시스템은 가격 전략 최적화를 위한 A/B 테스트 도구입니다. 모든 실험은
          통계적 유의성 검증을 거치며, 사용자 경험에 미치는 영향을 최소화하도록
          설계되었습니다. 실험 결과는 투자 결정에 대한 조언이 아닙니다.
        </p>
      </div>
    </div>
  )
}
