'use client'

// ============================================
// Strategy Marketplace Component
// Loop 20: 전략 마켓플레이스 v1
// ============================================

import { useCallback, useState, useEffect } from 'react'
import Image from 'next/image'
import {
  TrendingUp,
  Star,
  Download,
  Search,
  Filter,
  ShoppingCart,
  Heart,
  User,
  Award,
  Sparkles,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Bookmark,
  Share2,
  ExternalLink,
} from 'lucide-react'

// ============================================
// Types
// ============================================

interface StrategyListing {
  id: string
  title: string
  description: string
  category: string
  risk_level: string
  timeframe: string
  tags: string[]
  pricing_type: string
  price_credits: number
  monthly_credits: number
  verified_return: number | null
  verified_win_rate: number | null
  verified_sharpe: number | null
  copy_count: number
  rating_avg: number
  rating_count: number
  creator_name: string
  creator_verified: boolean
  featured: boolean
  created_at: string
}

interface MarketplaceStats {
  total_listings: number
  active_listings: number
  total_creators: number
  total_copies: number
  total_revenue: number
  avg_rating: number
  free_listings: number
  paid_listings: number
}

interface CategoryStats {
  category: string
  listing_count: number
  total_copies: number
  avg_rating: number
  avg_return: number
  avg_win_rate: number
}

interface Creator {
  user_id: string
  display_name: string
  verified: boolean
  avatar_url: string | null
  total_listings: number
  total_sales: number
  total_revenue: number
  follower_count: number
  avg_rating: number
  revenue_rank: number
  sales_rank: number
}

// ============================================
// Category Config
// ============================================

const CATEGORIES = [
  { id: 'all', label: '전체', icon: Sparkles },
  { id: 'momentum', label: '모멘텀', icon: TrendingUp },
  { id: 'value', label: '가치투자', icon: Target },
  { id: 'dividend', label: '배당', icon: Award },
  { id: 'growth', label: '성장주', icon: TrendingUp },
  { id: 'swing', label: '스윙', icon: Clock },
  { id: 'daytrading', label: '데이트레이딩', icon: Sparkles },
  { id: 'options', label: '옵션', icon: Target },
  { id: 'crypto', label: '암호화폐', icon: Sparkles },
]

const RISK_LEVELS = {
  low: { label: '저위험', color: 'text-green-400' },
  medium: { label: '중위험', color: 'text-yellow-400' },
  high: { label: '고위험', color: 'text-orange-400' },
  extreme: { label: '초고위험', color: 'text-red-400' },
}

const TIMEFRAMES = {
  scalping: '스캘핑',
  intraday: '일중',
  swing: '스윙',
  position: '포지션',
  long_term: '장기',
}

// ============================================
// Main Component
// ============================================

export default function StrategyMarketplace() {
  const [activeTab, setActiveTab] = useState<'browse' | 'featured' | 'creators'>('browse')
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [searchQuery, setSearchQuery] = useState('')
  const [listings, setListings] = useState<StrategyListing[]>([])
  const [featured, setFeatured] = useState<StrategyListing[]>([])
  const [creators, setCreators] = useState<Creator[]>([])
  const [categories, setCategories] = useState<CategoryStats[]>([])
  const [stats, setStats] = useState<MarketplaceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedListing, setSelectedListing] = useState<StrategyListing | null>(null)

  // 데이터 로드
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [listingsRes, featuredRes, creatorsRes, categoriesRes, statsRes] = await Promise.all([
        fetch(`/api/marketplace?type=listings&category=${activeCategory === 'all' ? '' : activeCategory}&sortBy=${sortBy}`),
        fetch('/api/marketplace?type=featured'),
        fetch('/api/marketplace?type=leaderboard&limit=10'),
        fetch('/api/marketplace?type=categories'),
        fetch('/api/marketplace?type=stats'),
      ])

      if (listingsRes.ok) {
        const data = await listingsRes.json()
        setListings(data.listings || [])
      }

      if (featuredRes.ok) {
        const data = await featuredRes.json()
        setFeatured(data.listings || [])
      }

      if (creatorsRes.ok) {
        const data = await creatorsRes.json()
        setCreators(data.creators || [])
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.categories || [])
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load marketplace data:', error)
    } finally {
      setLoading(false)
    }
  }, [activeCategory, sortBy])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/marketplace?type=search&q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setListings(data.listings || [])
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Strategy Marketplace</h1>
          <p className="text-gray-400">
            검증된 트레이딩 전략을 발견하고, 공유하고, 수익을 창출하세요
          </p>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatsCard
              label="등록 전략"
              value={stats.active_listings}
              icon={<Sparkles className="w-5 h-5 text-[#5E6AD2]" />}
            />
            <StatsCard
              label="크리에이터"
              value={stats.total_creators}
              icon={<User className="w-5 h-5 text-[#5E6AD2]" />}
            />
            <StatsCard
              label="총 카피"
              value={stats.total_copies}
              icon={<Download className="w-5 h-5 text-[#5E6AD2]" />}
            />
            <StatsCard
              label="평균 평점"
              value={stats.avg_rating?.toFixed(1) || '-'}
              suffix="/5.0"
              icon={<Star className="w-5 h-5 text-yellow-400" />}
            />
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="전략 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#5E6AD2]"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#5E6AD2]"
          >
            <option value="popular">인기순</option>
            <option value="rating">평점순</option>
            <option value="return">수익률순</option>
            <option value="newest">최신순</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <TabButton
            active={activeTab === 'browse'}
            onClick={() => setActiveTab('browse')}
          >
            전략 둘러보기
          </TabButton>
          <TabButton
            active={activeTab === 'featured'}
            onClick={() => setActiveTab('featured')}
          >
            추천 전략
          </TabButton>
          <TabButton
            active={activeTab === 'creators'}
            onClick={() => setActiveTab('creators')}
          >
            인기 크리에이터
          </TabButton>
        </div>

        {/* Content */}
        {activeTab === 'browse' && (
          <div className="flex gap-6">
            {/* Category Sidebar */}
            <div className="w-64 shrink-0">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">카테고리</h3>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      activeCategory === cat.id
                        ? 'bg-[#5E6AD2] text-white'
                        : 'text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    <cat.icon className="w-4 h-4" />
                    <span>{cat.label}</span>
                    {cat.id !== 'all' && categories.find((c) => c.category === cat.id) && (
                      <span className="ml-auto text-xs opacity-60">
                        {categories.find((c) => c.category === cat.id)?.listing_count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Category Stats */}
              {activeCategory !== 'all' && categories.find((c) => c.category === activeCategory) && (
                <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="text-sm font-semibold mb-3">카테고리 통계</h4>
                  {(() => {
                    const catStats = categories.find((c) => c.category === activeCategory)
                    if (!catStats) return null
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">전략 수</span>
                          <span>{catStats.listing_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">총 카피</span>
                          <span>{catStats.total_copies}</span>
                        </div>
                        {catStats.avg_return && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">평균 수익률</span>
                            <span className="text-green-400">{catStats.avg_return.toFixed(1)}%</span>
                          </div>
                        )}
                        {catStats.avg_win_rate && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">평균 승률</span>
                            <span>{catStats.avg_win_rate.toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Listings Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5E6AD2]" />
                </div>
              ) : listings.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>등록된 전략이 없습니다</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {listings.map((listing) => (
                    <StrategyCard
                      key={listing.id}
                      listing={listing}
                      onClick={() => setSelectedListing(listing)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'featured' && (
          <div className="space-y-4">
            {featured.map((listing) => (
              <FeaturedCard
                key={listing.id}
                listing={listing}
                onClick={() => setSelectedListing(listing)}
              />
            ))}
          </div>
        )}

        {activeTab === 'creators' && (
          <div className="space-y-4">
            {creators.map((creator, index) => (
              <CreatorCard key={creator.user_id} creator={creator} rank={index + 1} />
            ))}
          </div>
        )}

        {/* Strategy Detail Modal */}
        {selectedListing && (
          <StrategyDetailModal
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
          />
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200/80">
              <p className="font-semibold mb-1">면책조항</p>
              <p>
                본 마켓플레이스의 전략은 교육 및 참고 목적으로만 제공됩니다.
                과거 성과가 미래 수익을 보장하지 않으며, 모든 투자 결정에 대한 책임은 본인에게 있습니다.
                투자 전 반드시 전문가와 상담하시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Sub Components
// ============================================

function StatsCard({
  label,
  value,
  suffix,
  icon,
}: {
  label: string
  value: string | number
  suffix?: string
  icon: React.ReactNode
}) {
  return (
    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix && <span className="text-sm text-gray-400 ml-1">{suffix}</span>}
      </div>
    </div>
  )
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 border-b-2 transition-colors ${
        active
          ? 'border-[#5E6AD2] text-white'
          : 'border-transparent text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function StrategyCard({
  listing,
  onClick,
}: {
  listing: StrategyListing
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-[#5E6AD2]/50 cursor-pointer transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {listing.featured && (
              <span className="px-2 py-0.5 bg-[#5E6AD2] text-xs rounded-full">추천</span>
            )}
            <span className={`text-xs ${RISK_LEVELS[listing.risk_level as keyof typeof RISK_LEVELS]?.color || 'text-gray-400'}`}>
              {RISK_LEVELS[listing.risk_level as keyof typeof RISK_LEVELS]?.label || listing.risk_level}
            </span>
          </div>
          <h3 className="font-semibold text-lg">{listing.title}</h3>
        </div>
        <div className="flex items-center gap-1 text-yellow-400">
          <Star className="w-4 h-4 fill-current" />
          <span>{listing.rating_avg?.toFixed(1) || '-'}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{listing.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        <span className="px-2 py-0.5 bg-white/10 text-xs rounded">
          {CATEGORIES.find((c) => c.id === listing.category)?.label || listing.category}
        </span>
        <span className="px-2 py-0.5 bg-white/10 text-xs rounded">
          {TIMEFRAMES[listing.timeframe as keyof typeof TIMEFRAMES] || listing.timeframe}
        </span>
        {listing.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="px-2 py-0.5 bg-white/10 text-xs rounded">
            {tag}
          </span>
        ))}
      </div>

      {/* Metrics */}
      {(listing.verified_return || listing.verified_win_rate) && (
        <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-white/5 rounded">
          {listing.verified_return && (
            <div className="text-center">
              <div className="text-xs text-gray-400">수익률</div>
              <div className={`font-semibold ${listing.verified_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {listing.verified_return > 0 ? '+' : ''}{listing.verified_return.toFixed(1)}%
              </div>
            </div>
          )}
          {listing.verified_win_rate && (
            <div className="text-center">
              <div className="text-xs text-gray-400">승률</div>
              <div className="font-semibold">{listing.verified_win_rate.toFixed(0)}%</div>
            </div>
          )}
          {listing.verified_sharpe && (
            <div className="text-center">
              <div className="text-xs text-gray-400">Sharpe</div>
              <div className="font-semibold">{listing.verified_sharpe.toFixed(2)}</div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <User className="w-4 h-4" />
          <span>{listing.creator_name}</span>
          {listing.creator_verified && (
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <Download className="w-4 h-4" />
            <span>{listing.copy_count}</span>
          </div>
          {listing.pricing_type === 'free' ? (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">무료</span>
          ) : (
            <span className="font-semibold text-[#5E6AD2]">
              {listing.price_credits} 크레딧
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function FeaturedCard({
  listing,
  onClick,
}: {
  listing: StrategyListing
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="flex gap-6 p-6 bg-gradient-to-r from-[#5E6AD2]/20 to-transparent rounded-xl border border-[#5E6AD2]/30 hover:border-[#5E6AD2] cursor-pointer transition-all"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-[#5E6AD2]" />
          <span className="text-[#5E6AD2] text-sm font-semibold">추천 전략</span>
        </div>
        <h3 className="text-xl font-bold mb-2">{listing.title}</h3>
        <p className="text-gray-400 mb-4">{listing.description}</p>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4 text-gray-400" />
            <span>{listing.creator_name}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-4 h-4 fill-current" />
            <span>{listing.rating_avg?.toFixed(1)}</span>
            <span className="text-gray-400">({listing.rating_count})</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Download className="w-4 h-4" />
            <span>{listing.copy_count} copies</span>
          </div>
        </div>
      </div>

      <div className="w-48 flex flex-col items-end justify-between">
        {listing.verified_return && (
          <div className="text-right">
            <div className="text-xs text-gray-400">검증 수익률</div>
            <div className={`text-2xl font-bold ${listing.verified_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {listing.verified_return > 0 ? '+' : ''}{listing.verified_return.toFixed(1)}%
            </div>
          </div>
        )}
        <button className="px-4 py-2 bg-[#5E6AD2] text-white rounded-lg hover:bg-[#4E5AC2] transition-colors flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          {listing.pricing_type === 'free' ? '무료 받기' : `${listing.price_credits} 크레딧`}
        </button>
      </div>
    </div>
  )
}

function CreatorCard({ creator, rank }: { creator: Creator; rank: number }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
      <div className="w-10 text-center">
        <span className={`text-xl font-bold ${rank <= 3 ? 'text-[#5E6AD2]' : 'text-gray-400'}`}>
          #{rank}
        </span>
      </div>

      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5E6AD2] to-purple-500 flex items-center justify-center overflow-hidden">
        {creator.avatar_url ? (
          <Image src={creator.avatar_url} alt="" width={48} height={48} className="w-full h-full object-cover" />
        ) : (
          <User className="w-6 h-6" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{creator.display_name}</span>
          {creator.verified && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{creator.total_listings} 전략</span>
          <span>{creator.follower_count} 팔로워</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 text-center">
        <div>
          <div className="text-xs text-gray-400">판매</div>
          <div className="font-semibold">{creator.total_sales}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">평점</div>
          <div className="font-semibold flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            {creator.avg_rating?.toFixed(1) || '-'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">수익</div>
          <div className="font-semibold text-[#5E6AD2]">
            {creator.total_revenue.toLocaleString()}
          </div>
        </div>
      </div>

      <button className="px-4 py-2 border border-[#5E6AD2] text-[#5E6AD2] rounded-lg hover:bg-[#5E6AD2] hover:text-white transition-colors">
        팔로우
      </button>
    </div>
  )
}

function StrategyDetailModal({
  listing,
  onClose,
}: {
  listing: StrategyListing
  onClose: () => void
}) {
  const [purchasing, setPurchasing] = useState(false)

  const handlePurchase = async () => {
    setPurchasing(true)
    try {
      const response = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase',
          listingId: listing.id,
          userId: 'current-user', // TODO: 실제 사용자 ID
        }),
      })

      if (response.ok) {
        alert('전략을 성공적으로 구매했습니다!')
        onClose()
      } else {
        const data = await response.json()
        alert(data.error || '구매에 실패했습니다')
      }
    } catch (error) {
      alert('구매 처리 중 오류가 발생했습니다')
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1F] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {listing.featured && (
                  <span className="px-2 py-0.5 bg-[#5E6AD2] text-xs rounded-full">추천</span>
                )}
                <span className={RISK_LEVELS[listing.risk_level as keyof typeof RISK_LEVELS]?.color}>
                  {RISK_LEVELS[listing.risk_level as keyof typeof RISK_LEVELS]?.label}
                </span>
              </div>
              <h2 className="text-2xl font-bold">{listing.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Creator Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5E6AD2] to-purple-500 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{listing.creator_name}</span>
                {listing.creator_verified && (
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div className="text-sm text-gray-400">전략 크리에이터</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">설명</h3>
            <p className="text-gray-400">{listing.description}</p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {[listing.category, listing.timeframe, ...listing.tags].map((tag) => (
              <span key={tag} className="px-3 py-1 bg-white/10 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>

          {/* Performance Metrics */}
          {(listing.verified_return || listing.verified_win_rate) && (
            <div>
              <h3 className="font-semibold mb-3">검증된 성과</h3>
              <div className="grid grid-cols-4 gap-4">
                {listing.verified_return && (
                  <div className="p-3 bg-white/5 rounded-lg text-center">
                    <div className="text-xs text-gray-400 mb-1">수익률</div>
                    <div className={`text-xl font-bold ${listing.verified_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {listing.verified_return > 0 ? '+' : ''}{listing.verified_return.toFixed(1)}%
                    </div>
                  </div>
                )}
                {listing.verified_win_rate && (
                  <div className="p-3 bg-white/5 rounded-lg text-center">
                    <div className="text-xs text-gray-400 mb-1">승률</div>
                    <div className="text-xl font-bold">{listing.verified_win_rate.toFixed(0)}%</div>
                  </div>
                )}
                {listing.verified_sharpe && (
                  <div className="p-3 bg-white/5 rounded-lg text-center">
                    <div className="text-xs text-gray-400 mb-1">Sharpe</div>
                    <div className="text-xl font-bold">{listing.verified_sharpe.toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{listing.rating_avg?.toFixed(1) || '-'}</span>
              <span className="text-gray-400">({listing.rating_count} 리뷰)</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Download className="w-4 h-4" />
              <span>{listing.copy_count} 카피</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handlePurchase}
              disabled={purchasing}
              className="flex-1 py-3 bg-[#5E6AD2] text-white rounded-lg hover:bg-[#4E5AC2] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {purchasing ? '처리 중...' : (
                listing.pricing_type === 'free'
                  ? '무료로 받기'
                  : `${listing.price_credits} 크레딧으로 구매`
              )}
            </button>
            <button className="px-4 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
              <Bookmark className="w-5 h-5" />
            </button>
            <button className="px-4 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Disclaimer */}
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-200/80">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                이 전략의 과거 성과는 미래 수익을 보장하지 않습니다.
                투자 결정은 본인 책임이며, 투자 전 충분한 검토가 필요합니다.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
