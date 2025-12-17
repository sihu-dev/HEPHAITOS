'use client'

// ============================================
// Investor Dashboard Component
// Loop 25: 시리즈 A 준비 자료
// ============================================

import React, { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Building2,
  Calendar,
  ChevronRight,
  RefreshCw,
  Briefcase,
  PieChart,
  BarChart3,
  LineChart,
  Globe,
  ArrowUpRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'

// ============================================
// Types
// ============================================

interface MetricsSnapshot {
  snapshot_date: string
  total_users: number
  mau: number
  wau: number
  dau: number
  new_users_mtd: number
  mrr: number
  arr: number
  arpu: number
  arppu: number
  ltv: number
  cac: number
  ltv_cac_ratio: number
  d1_retention: number
  d7_retention: number
  d30_retention: number
  free_to_paid_rate: number
  addressable_market_size: number
  serviceable_market_size: number
  obtainable_market_size: number
}

interface FundingRound {
  id: string
  round_name: string
  status: string
  target_amount: number
  raised_amount: number
  pre_money_valuation: number
  post_money_valuation: number
  target_close_date: string
  use_of_funds: Record<string, { percent: number; amount: number; description: string }>
}

interface Investor {
  id: string
  name: string
  type: string
  relationship_status: string
  typical_check_size_min: number
  typical_check_size_max: number
  last_contact_date: string
  next_followup_date: string
  meetings_count: number
}

interface KPITarget {
  id: string
  kpi_name: string
  category: string
  period_start: string
  period_end: string
  target_value: number
  actual_value: number | null
  achievement_rate: number | null
  unit: string
}

interface Competitor {
  id: string
  name: string
  website: string
  description: string
  target_market: string
  key_features: string[]
  our_advantages: string[]
  estimated_market_share: number
}

type TabType = 'overview' | 'metrics' | 'pipeline' | 'kpis' | 'competition'

// ============================================
// API Functions
// ============================================

async function fetchMetrics(): Promise<MetricsSnapshot | null> {
  const response = await fetch('/api/investor?type=metrics')
  if (!response.ok) return null
  const data = await response.json()
  return data.data
}

async function fetchFundingRounds(): Promise<FundingRound[]> {
  const response = await fetch('/api/investor?type=funding_rounds')
  if (!response.ok) return []
  const data = await response.json()
  return data.data || []
}

async function fetchPipeline(): Promise<Investor[]> {
  const response = await fetch('/api/investor?type=pipeline')
  if (!response.ok) return []
  const data = await response.json()
  return data.data || []
}

async function fetchKPIs(): Promise<KPITarget[]> {
  const response = await fetch('/api/investor?type=kpi_targets')
  if (!response.ok) return []
  const data = await response.json()
  return data.data || []
}

async function fetchCompetitors(): Promise<Competitor[]> {
  const response = await fetch('/api/investor?type=competitors')
  if (!response.ok) return []
  const data = await response.json()
  return data.data || []
}

// ============================================
// Sub Components
// ============================================

function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  format = 'number',
}: {
  title: string
  value: number
  change?: number
  changeLabel?: string
  icon: React.ElementType
  format?: 'number' | 'currency' | 'percent'
}) {
  const formatValue = (v: number) => {
    if (format === 'currency') {
      if (v >= 100000000) return `₩${(v / 100000000).toFixed(1)}억`
      if (v >= 10000) return `₩${(v / 10000).toFixed(0)}만`
      return `₩${v.toLocaleString()}`
    }
    if (format === 'percent') return `${v.toFixed(1)}%`
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
    return v.toLocaleString()
  }

  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{title}</span>
        <Icon className="w-4 h-4 text-indigo-400" />
      </div>
      <div className="text-2xl font-bold text-white">{formatValue(value)}</div>
      {change !== undefined && (
        <div
          className={`flex items-center gap-1 mt-1 text-xs ${
            change >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change >= 0 ? '+' : ''}{change}% {changeLabel || 'MoM'}
        </div>
      )}
    </div>
  )
}

function MarketSizeChart({ tam, sam, som }: { tam: number; sam: number; som: number }) {
  const formatSize = (v: number) => {
    if (v >= 1000000000000) return `₩${(v / 1000000000000).toFixed(0)}조`
    if (v >= 100000000) return `₩${(v / 100000000).toFixed(0)}억`
    return `₩${v.toLocaleString()}`
  }

  return (
    <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Market Size (TAM/SAM/SOM)</h3>
      <div className="relative flex items-center justify-center h-48">
        {/* TAM Circle */}
        <div className="absolute w-44 h-44 rounded-full bg-indigo-500/20 flex items-center justify-center">
          <span className="absolute top-2 text-xs text-indigo-400">TAM</span>
        </div>
        {/* SAM Circle */}
        <div className="absolute w-32 h-32 rounded-full bg-purple-500/30 flex items-center justify-center">
          <span className="absolute top-2 text-xs text-purple-400">SAM</span>
        </div>
        {/* SOM Circle */}
        <div className="absolute w-20 h-20 rounded-full bg-pink-500/40 flex items-center justify-center">
          <span className="text-xs text-pink-400">SOM</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="text-center">
          <div className="text-lg font-bold text-indigo-400">{formatSize(tam)}</div>
          <div className="text-[10px] text-gray-500">Total Addressable</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400">{formatSize(sam)}</div>
          <div className="text-[10px] text-gray-500">Serviceable</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-pink-400">{formatSize(som)}</div>
          <div className="text-[10px] text-gray-500">Obtainable</div>
        </div>
      </div>
    </div>
  )
}

function FundingRoundCard({ round }: { round: FundingRound }) {
  const progress = round.target_amount > 0
    ? (round.raised_amount / round.target_amount) * 100
    : 0

  const statusColors: Record<string, string> = {
    planned: 'text-yellow-400 bg-yellow-500/20',
    in_progress: 'text-blue-400 bg-blue-500/20',
    completed: 'text-green-400 bg-green-500/20',
    cancelled: 'text-red-400 bg-red-500/20',
  }

  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-white">{round.round_name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[round.status]}`}>
          {round.status.charAt(0).toUpperCase() + round.status.slice(1)}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Target</span>
            <span className="text-white">₩{(round.target_amount / 100000000).toFixed(0)}억</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {progress.toFixed(0)}% raised
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-400">Pre-money</div>
            <div className="font-medium text-white">
              ₩{(round.pre_money_valuation / 100000000).toFixed(0)}억
            </div>
          </div>
          <div>
            <div className="text-gray-400">Target Close</div>
            <div className="font-medium text-white">
              {round.target_close_date ? new Date(round.target_close_date).toLocaleDateString() : '-'}
            </div>
          </div>
        </div>

        {round.use_of_funds && Object.keys(round.use_of_funds).length > 0 && (
          <div className="pt-3 border-t border-white/10">
            <div className="text-xs text-gray-400 mb-2">Use of Funds</div>
            <div className="space-y-1">
              {Object.entries(round.use_of_funds).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-gray-300">{value.description}</span>
                  <span className="text-white">{value.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InvestorPipelineCard({ investor }: { investor: Investor }) {
  const statusColors: Record<string, string> = {
    cold: 'text-gray-400 bg-gray-500/20',
    warm: 'text-yellow-400 bg-yellow-500/20',
    hot: 'text-orange-400 bg-orange-500/20',
    term_sheet: 'text-blue-400 bg-blue-500/20',
    committed: 'text-green-400 bg-green-500/20',
    passed: 'text-red-400 bg-red-500/20',
  }

  const typeIcons: Record<string, React.ElementType> = {
    vc: Building2,
    angel: Users,
    corporate: Briefcase,
    accelerator: Target,
  }

  const Icon = typeIcons[investor.type] || Building2

  return (
    <div className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="font-medium text-white">{investor.name}</div>
            <div className="text-xs text-gray-400">
              {investor.typical_check_size_min && investor.typical_check_size_max
                ? `₩${(investor.typical_check_size_min / 100000000).toFixed(0)}-${(investor.typical_check_size_max / 100000000).toFixed(0)}억`
                : 'Check size TBD'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-2 py-1 rounded-full text-xs ${statusColors[investor.relationship_status]}`}>
            {investor.relationship_status.replace('_', ' ')}
          </span>
          <div className="text-xs text-gray-500 mt-1">
            {investor.meetings_count} meetings
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({ kpi }: { kpi: KPITarget }) {
  const achievement = kpi.achievement_rate || 0
  const isAchieved = achievement >= 100

  const formatValue = (v: number) => {
    if (kpi.unit === 'currency') {
      if (v >= 100000000) return `₩${(v / 100000000).toFixed(1)}억`
      if (v >= 10000) return `₩${(v / 10000).toFixed(0)}만`
      return `₩${v.toLocaleString()}`
    }
    if (kpi.unit === 'percent') return `${v}%`
    return v.toLocaleString()
  }

  return (
    <div className="p-3 bg-white/5 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-white">{kpi.kpi_name}</span>
        {isAchieved ? (
          <CheckCircle className="w-4 h-4 text-green-400" />
        ) : kpi.actual_value !== null ? (
          <Clock className="w-4 h-4 text-yellow-400" />
        ) : (
          <AlertCircle className="w-4 h-4 text-gray-500" />
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-gray-400">Target</div>
          <div className="text-lg font-bold text-white">{formatValue(kpi.target_value)}</div>
        </div>
        {kpi.actual_value !== null && (
          <div className="text-right">
            <div className="text-xs text-gray-400">Actual</div>
            <div className={`text-lg font-bold ${isAchieved ? 'text-green-400' : 'text-yellow-400'}`}>
              {formatValue(kpi.actual_value)}
            </div>
          </div>
        )}
      </div>
      {kpi.actual_value !== null && (
        <div className="mt-2">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isAchieved ? 'bg-green-500' : 'bg-yellow-500'}`}
              style={{ width: `${Math.min(achievement, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">{achievement.toFixed(0)}%</div>
        </div>
      )}
    </div>
  )
}

function CompetitorCard({ competitor }: { competitor: Competitor }) {
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-white">{competitor.name}</h3>
        <a
          href={competitor.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white"
        >
          <Globe className="w-4 h-4" />
        </a>
      </div>

      <p className="text-sm text-gray-400 mb-3">{competitor.description}</p>

      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">Key Features</div>
          <div className="flex flex-wrap gap-1">
            {competitor.key_features.slice(0, 3).map((feature, i) => (
              <span key={i} className="px-2 py-0.5 bg-white/5 text-gray-300 text-xs rounded">
                {feature}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1">Our Advantages</div>
          <div className="space-y-1">
            {competitor.our_advantages.slice(0, 3).map((adv, i) => (
              <div key={i} className="flex items-center gap-1 text-xs text-green-400">
                <ArrowUpRight className="w-3 h-3" />
                {adv}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export default function InvestorDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null)
  const [fundingRounds, setFundingRounds] = useState<FundingRound[]>([])
  const [pipeline, setPipeline] = useState<Investor[]>([])
  const [kpis, setKpis] = useState<KPITarget[]>([])
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [metricsData, roundsData, pipelineData, kpisData, competitorsData] =
        await Promise.all([
          fetchMetrics(),
          fetchFundingRounds(),
          fetchPipeline(),
          fetchKPIs(),
          fetchCompetitors(),
        ])
      setMetrics(metricsData)
      setFundingRounds(roundsData)
      setPipeline(pipelineData)
      setKpis(kpisData)
      setCompetitors(competitorsData)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'metrics', label: 'Metrics', icon: LineChart },
    { id: 'pipeline', label: 'Pipeline', icon: Building2 },
    { id: 'kpis', label: 'KPIs', icon: Target },
    { id: 'competition', label: 'Competition', icon: BarChart3 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Investor Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Series A 준비 및 투자자 관리</p>
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
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <MetricCard
              title="MRR"
              value={metrics?.mrr || 0}
              change={15}
              icon={DollarSign}
              format="currency"
            />
            <MetricCard
              title="ARR"
              value={metrics?.arr || 0}
              icon={TrendingUp}
              format="currency"
            />
            <MetricCard
              title="MAU"
              value={metrics?.mau || 0}
              change={25}
              icon={Users}
            />
            <MetricCard
              title="D7 Retention"
              value={metrics?.d7_retention || 0}
              icon={Target}
              format="percent"
            />
            <MetricCard
              title="LTV/CAC"
              value={metrics?.ltv_cac_ratio || 0}
              icon={BarChart3}
            />
            <MetricCard
              title="Free→Paid"
              value={metrics?.free_to_paid_rate || 0}
              icon={ChevronRight}
              format="percent"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Market Size */}
            <MarketSizeChart
              tam={metrics?.addressable_market_size || 500000000000000}
              sam={metrics?.serviceable_market_size || 50000000000000}
              som={metrics?.obtainable_market_size || 500000000000}
            />

            {/* Funding Round */}
            {fundingRounds[0] && <FundingRoundCard round={fundingRounds[0]} />}
          </div>

          {/* Pipeline Summary */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <h3 className="font-medium text-white mb-4">Investor Pipeline</h3>
            <div className="grid grid-cols-5 gap-4 text-center">
              {['cold', 'warm', 'hot', 'term_sheet', 'committed'].map((status) => {
                const count = pipeline.filter((i) => i.relationship_status === status).length
                return (
                  <div key={status} className="p-3 bg-white/5 rounded-lg">
                    <div className="text-2xl font-bold text-white">{count}</div>
                    <div className="text-xs text-gray-400 capitalize">
                      {status.replace('_', ' ')}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'metrics' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <MetricCard title="Total Users" value={metrics.total_users} icon={Users} />
            <MetricCard title="MAU" value={metrics.mau} icon={Users} />
            <MetricCard title="WAU" value={metrics.wau} icon={Users} />
            <MetricCard title="DAU" value={metrics.dau} icon={Users} />
            <MetricCard title="MRR" value={metrics.mrr} icon={DollarSign} format="currency" />
            <MetricCard title="ARR" value={metrics.arr} icon={DollarSign} format="currency" />
            <MetricCard title="ARPU" value={metrics.arpu} icon={DollarSign} format="currency" />
            <MetricCard title="ARPPU" value={metrics.arppu} icon={DollarSign} format="currency" />
            <MetricCard title="LTV" value={metrics.ltv} icon={TrendingUp} format="currency" />
            <MetricCard title="CAC" value={metrics.cac} icon={TrendingDown} format="currency" />
            <MetricCard title="LTV/CAC" value={metrics.ltv_cac_ratio} icon={Target} />
            <MetricCard title="D1 Retention" value={metrics.d1_retention} icon={Target} format="percent" />
            <MetricCard title="D7 Retention" value={metrics.d7_retention} icon={Target} format="percent" />
            <MetricCard title="D30 Retention" value={metrics.d30_retention} icon={Target} format="percent" />
            <MetricCard title="Free→Paid" value={metrics.free_to_paid_rate} icon={ChevronRight} format="percent" />
          </div>
        </div>
      )}

      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Investor Pipeline</h2>
            <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors">
              + Add Investor
            </button>
          </div>

          <div className="space-y-2">
            {pipeline.map((investor) => (
              <InvestorPipelineCard key={investor.id} investor={investor} />
            ))}
            {pipeline.length === 0 && (
              <div className="p-8 text-center bg-white/5 rounded-xl">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                <p className="text-gray-400">등록된 투자자가 없습니다</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'kpis' && (
        <div className="space-y-6">
          {['growth', 'revenue', 'retention', 'efficiency'].map((category) => {
            const categoryKpis = kpis.filter((k) => k.category === category)
            if (categoryKpis.length === 0) return null

            return (
              <div key={category}>
                <h3 className="text-sm font-medium text-gray-400 mb-3 capitalize">{category}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categoryKpis.map((kpi) => (
                    <KPICard key={kpi.id} kpi={kpi} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'competition' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitors.map((competitor) => (
            <CompetitorCard key={competitor.id} competitor={competitor} />
          ))}
          {competitors.length === 0 && (
            <div className="col-span-full p-8 text-center bg-white/5 rounded-xl">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-500" />
              <p className="text-gray-400">경쟁사 분석 데이터가 없습니다</p>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
        <p className="text-xs text-gray-500 leading-relaxed">
          이 대시보드는 내부 관리 및 투자자 커뮤니케이션 목적으로 작성되었습니다. 모든 지표는
          추정치이며, 실제 성과와 다를 수 있습니다. 투자 결정 시 별도의 실사가 필요합니다.
        </p>
      </div>
    </div>
  )
}
