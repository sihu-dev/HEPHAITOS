'use client'

// ============================================
// Korean Stock Widget Component
// Loop 22: 한국 주식 데이터 연동
// ============================================

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Search,
  Star,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  BarChart2,
  Activity,
  DollarSign,
} from 'lucide-react'

// ============================================
// Types
// ============================================

interface StockPrice {
  symbol: string
  name: string
  currentPrice: number
  previousClose: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: number
  tradingValue: number
  marketCap: number
  per: number | null
  pbr: number | null
  timestamp: Date
}

interface MarketIndex {
  name: string
  code: string
  currentValue: number
  previousClose: number
  change: number
  changePercent: number
  high: number
  low: number
  volume: number
  timestamp: Date
}

interface StockQuote {
  symbol: string
  bidPrice: number
  askPrice: number
  bidQuantity: number
  askQuantity: number
  bidPrices: number[]
  askPrices: number[]
  bidQuantities: number[]
  askQuantities: number[]
}

// ============================================
// Popular Stocks
// ============================================

const POPULAR_STOCKS = [
  { symbol: '005930', name: '삼성전자', market: 'KOSPI' },
  { symbol: '000660', name: 'SK하이닉스', market: 'KOSPI' },
  { symbol: '373220', name: 'LG에너지솔루션', market: 'KOSPI' },
  { symbol: '005380', name: '현대차', market: 'KOSPI' },
  { symbol: '035420', name: 'NAVER', market: 'KOSPI' },
  { symbol: '035720', name: '카카오', market: 'KOSPI' },
  { symbol: '068270', name: '셀트리온', market: 'KOSPI' },
  { symbol: '247540', name: '에코프로비엠', market: 'KOSDAQ' },
]

// ============================================
// Main Component
// ============================================

export default function KoreanStockWidget() {
  const [activeTab, setActiveTab] = useState<'indices' | 'popular' | 'search'>('indices')
  const [indices, setIndices] = useState<Record<string, MarketIndex> | null>(null)
  const [stocks, setStocks] = useState<StockPrice[]>([])
  const [selectedStock, setSelectedStock] = useState<StockPrice | null>(null)
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadIndices()
  }, [])

  useEffect(() => {
    if (activeTab === 'popular') {
      loadPopularStocks()
    }
  }, [activeTab])

  const loadIndices = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/stocks/kr?type=indices')
      if (response.ok) {
        const data = await response.json()
        setIndices(data.data)
      } else {
        const errorData = await response.json()
        setError(errorData.message || '지수를 불러올 수 없습니다')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const loadPopularStocks = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/stocks/kr?type=popular')
      if (response.ok) {
        const data = await response.json()
        setStocks(data.data || [])
      } else {
        const errorData = await response.json()
        setError(errorData.message || '종목을 불러올 수 없습니다')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const loadStockDetail = async (symbol: string) => {
    try {
      const [priceRes, quoteRes] = await Promise.all([
        fetch(`/api/stocks/kr?type=price&symbol=${symbol}`),
        fetch(`/api/stocks/kr?type=quote&symbol=${symbol}`),
      ])

      if (priceRes.ok) {
        const priceData = await priceRes.json()
        setSelectedStock(priceData.data)
      }

      if (quoteRes.ok) {
        const quoteData = await quoteRes.json()
        setQuote(quoteData.data)
      }
    } catch (err) {
      console.error('Failed to load stock detail:', err)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/stocks/kr?type=price&symbol=${searchQuery}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedStock(data.data)
        loadStockDetail(searchQuery)
      }
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0D0D0F] text-white rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            한국 주식
          </h2>
          <button
            onClick={() => {
              if (activeTab === 'indices') loadIndices()
              else if (activeTab === 'popular') loadPopularStocks()
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <TabButton
            active={activeTab === 'indices'}
            onClick={() => setActiveTab('indices')}
          >
            지수
          </TabButton>
          <TabButton
            active={activeTab === 'popular'}
            onClick={() => setActiveTab('popular')}
          >
            인기 종목
          </TabButton>
          <TabButton
            active={activeTab === 'search'}
            onClick={() => setActiveTab('search')}
          >
            검색
          </TabButton>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Indices Tab */}
        {activeTab === 'indices' && (
          <div className="space-y-3">
            {loading ? (
              <LoadingSpinner />
            ) : indices ? (
              <>
                <IndexCard index={indices.kospi} />
                <IndexCard index={indices.kosdaq} />
                <IndexCard index={indices.kospi200} />
              </>
            ) : (
              <EmptyState message="지수 데이터를 불러올 수 없습니다" />
            )}
          </div>
        )}

        {/* Popular Tab */}
        {activeTab === 'popular' && (
          <div className="space-y-2">
            {loading ? (
              <LoadingSpinner />
            ) : stocks.length > 0 ? (
              stocks.map((stock) => (
                <StockRow
                  key={stock.symbol}
                  stock={stock}
                  onClick={() => {
                    setSelectedStock(stock)
                    loadStockDetail(stock.symbol)
                  }}
                />
              ))
            ) : (
              <EmptyState message="종목 데이터를 불러올 수 없습니다" />
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="종목 코드 (예: 005930)"
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-[#4E5AC2] transition-colors text-sm"
              >
                검색
              </button>
            </div>

            {selectedStock && (
              <StockDetailCard stock={selectedStock} quote={quote} />
            )}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="p-3 bg-yellow-500/5 border-t border-yellow-500/10 text-xs text-yellow-200/60">
        본 데이터는 교육 및 참고 목적으로만 제공됩니다. 실시간 데이터가 아닐 수 있습니다.
      </div>
    </div>
  )
}

// ============================================
// Sub Components
// ============================================

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
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-primary text-white'
          : 'bg-white/5 text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-gray-400">
      <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

function IndexCard({ index }: { index: MarketIndex }) {
  const isPositive = index.change >= 0

  return (
    <div className="p-3 bg-white/5 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold">{index.name}</span>
        <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {index.changePercent.toFixed(2)}%
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold">{index.currentValue.toLocaleString()}</span>
        <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{index.change.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
        <span>고가 {index.high.toLocaleString()}</span>
        <span>저가 {index.low.toLocaleString()}</span>
      </div>
    </div>
  )
}

function StockRow({
  stock,
  onClick,
}: {
  stock: StockPrice & { name?: string; market?: string }
  onClick: () => void
}) {
  const isPositive = stock.change >= 0
  const isZero = stock.change === 0

  return (
    <button
      onClick={onClick}
      className="w-full p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{stock.name || stock.symbol}</div>
          <div className="text-xs text-gray-400">{stock.symbol}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold">
            {stock.currentPrice > 0 ? stock.currentPrice.toLocaleString() : '-'}
          </div>
          {stock.currentPrice > 0 && (
            <div className={`text-xs flex items-center justify-end gap-1 ${
              isZero ? 'text-gray-400' : isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isZero ? (
                <Minus className="w-3 h-3" />
              ) : isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isPositive && stock.change > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

function StockDetailCard({
  stock,
  quote,
}: {
  stock: StockPrice
  quote: StockQuote | null
}) {
  const isPositive = stock.change >= 0

  return (
    <div className="space-y-4">
      {/* Price Info */}
      <div className="p-4 bg-white/5 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-lg font-bold">{stock.name || stock.symbol}</div>
            <div className="text-sm text-gray-400">{stock.symbol}</div>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Star className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-2xl font-bold">{stock.currentPrice.toLocaleString()}원</span>
          <span className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {Math.abs(stock.change).toLocaleString()} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-gray-400">시가</div>
            <div>{stock.open.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-400">고가</div>
            <div className="text-red-400">{stock.high.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-400">저가</div>
            <div className="text-blue-400">{stock.low.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-400">거래량</div>
            <div>{(stock.volume / 1000).toFixed(0)}K</div>
          </div>
          <div>
            <div className="text-gray-400">PER</div>
            <div>{stock.per?.toFixed(2) || '-'}</div>
          </div>
          <div>
            <div className="text-gray-400">PBR</div>
            <div>{stock.pbr?.toFixed(2) || '-'}</div>
          </div>
        </div>
      </div>

      {/* Quote (호가) */}
      {quote && (
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="text-sm font-semibold mb-3">호가</div>
          <div className="grid grid-cols-2 gap-4">
            {/* 매도 호가 */}
            <div>
              <div className="text-xs text-gray-400 mb-2">매도 (Ask)</div>
              <div className="space-y-1">
                {quote.askPrices.slice(0, 5).reverse().map((price, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-blue-400">{price.toLocaleString()}</span>
                    <span className="text-gray-400">{quote.askQuantities[4-i].toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 매수 호가 */}
            <div>
              <div className="text-xs text-gray-400 mb-2">매수 (Bid)</div>
              <div className="space-y-1">
                {quote.bidPrices.slice(0, 5).map((price, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-red-400">{price.toLocaleString()}</span>
                    <span className="text-gray-400">{quote.bidQuantities[i].toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
