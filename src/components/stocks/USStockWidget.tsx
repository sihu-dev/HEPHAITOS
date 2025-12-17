'use client'

// ============================================
// US Stock Widget Component
// Loop 23: 해외 주식 연동
// ============================================

import React, { useState, useEffect, useCallback } from 'react'
import { Search, TrendingUp, TrendingDown, Clock, RefreshCw, Globe, DollarSign } from 'lucide-react'

// ============================================
// Types
// ============================================

interface StockData {
  symbol: string
  name: string
  sector?: string
  price: number
  change: number
  changePercent: number
  volume?: number
  high?: number
  low?: number
  open?: number
}

interface MarketClock {
  timestamp: string
  isOpen: boolean
  nextOpen: string
  nextClose: string
}

interface SearchResult {
  id: string
  symbol: string
  name: string
  exchange: string
  tradable: boolean
  fractionable: boolean
}

interface StockSnapshot {
  latestTrade: {
    price: number
    size: number
    timestamp: string
  }
  latestQuote: {
    bidPrice: number
    bidSize: number
    askPrice: number
    askSize: number
  }
  dailyBar: {
    o: number
    h: number
    l: number
    c: number
    v: number
  }
  prevDailyBar: {
    c: number
  }
}

type TabType = 'popular' | 'search' | 'market'

// ============================================
// API Functions
// ============================================

async function fetchPopularStocks(): Promise<StockData[]> {
  const response = await fetch('/api/stocks/us?type=popular')
  if (!response.ok) throw new Error('Failed to fetch popular stocks')
  const data = await response.json()
  return data.data || []
}

async function fetchMarketClock(): Promise<MarketClock | null> {
  const response = await fetch('/api/stocks/us?type=clock')
  if (!response.ok) return null
  const data = await response.json()
  return data.data
}

async function searchStocks(query: string): Promise<SearchResult[]> {
  const response = await fetch(`/api/stocks/us?type=search&q=${encodeURIComponent(query)}`)
  if (!response.ok) throw new Error('Search failed')
  const data = await response.json()
  return data.data || []
}

async function fetchSnapshot(symbol: string): Promise<StockSnapshot | null> {
  const response = await fetch(`/api/stocks/us?type=snapshot&symbol=${symbol}`)
  if (!response.ok) return null
  const data = await response.json()
  return data.data
}

// ============================================
// Sub Components
// ============================================

function MarketStatusBadge({ clock }: { clock: MarketClock | null }) {
  if (!clock) return null

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/New_York',
    })
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          clock.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}
      />
      <span className="text-xs text-gray-400">
        {clock.isOpen ? 'Market Open' : 'Market Closed'}
      </span>
      <span className="text-xs text-gray-500">
        {clock.isOpen
          ? `Close: ${formatTime(clock.nextClose)}`
          : `Open: ${formatTime(clock.nextOpen)}`}
      </span>
    </div>
  )
}

function StockRow({
  stock,
  onClick,
}: {
  stock: StockData
  onClick: () => void
}) {
  const isPositive = stock.change >= 0

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {stock.symbol.slice(0, 2)}
          </span>
        </div>
        <div>
          <div className="font-medium text-white">{stock.symbol}</div>
          <div className="text-xs text-gray-400 truncate max-w-[120px]">
            {stock.name}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="font-medium text-white">
          ${stock.price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div
          className={`flex items-center justify-end gap-1 text-xs ${
            isPositive ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>
            {isPositive ? '+' : ''}
            {stock.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}

function SearchResultRow({
  result,
  onClick,
}: {
  result: SearchResult
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center">
          <Globe className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <div className="font-medium text-white">{result.symbol}</div>
          <div className="text-xs text-gray-400 truncate max-w-[150px]">
            {result.name}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-xs text-gray-400">{result.exchange}</div>
        <div className="flex gap-1 mt-1">
          {result.tradable && (
            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded">
              Tradable
            </span>
          )}
          {result.fractionable && (
            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded">
              Fractional
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function StockDetailCard({
  symbol,
  onClose,
}: {
  symbol: string
  onClose: () => void
}) {
  const [snapshot, setSnapshot] = useState<StockSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSnapshot(symbol)
      .then(setSnapshot)
      .finally(() => setLoading(false))
  }, [symbol])

  if (loading) {
    return (
      <div className="p-4 bg-white/5 rounded-xl animate-pulse">
        <div className="h-8 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-20 bg-white/10 rounded" />
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="p-4 bg-white/5 rounded-xl">
        <p className="text-gray-400 text-center">데이터를 불러올 수 없습니다</p>
        <button
          onClick={onClose}
          className="mt-2 text-sm text-indigo-400 hover:underline w-full text-center"
        >
          닫기
        </button>
      </div>
    )
  }

  const price = snapshot.latestTrade.price
  const prevClose = snapshot.prevDailyBar.c
  const change = price - prevClose
  const changePercent = (change / prevClose) * 100
  const isPositive = change >= 0

  return (
    <div className="p-4 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{symbol}</h3>
          <p className="text-xs text-gray-400">
            Last: {new Date(snapshot.latestTrade.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="text-3xl font-bold text-white">
          ${price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div
          className={`flex items-center gap-2 mt-1 ${
            isPositive ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="font-medium">
            {isPositive ? '+' : ''}
            {change.toFixed(2)} ({isPositive ? '+' : ''}
            {changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Daily Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-2 bg-white/5 rounded-lg">
          <div className="text-xs text-gray-400">Open</div>
          <div className="text-sm font-medium text-white">
            ${snapshot.dailyBar.o.toFixed(2)}
          </div>
        </div>
        <div className="p-2 bg-white/5 rounded-lg">
          <div className="text-xs text-gray-400">Volume</div>
          <div className="text-sm font-medium text-white">
            {(snapshot.dailyBar.v / 1000000).toFixed(2)}M
          </div>
        </div>
        <div className="p-2 bg-white/5 rounded-lg">
          <div className="text-xs text-gray-400">High</div>
          <div className="text-sm font-medium text-green-400">
            ${snapshot.dailyBar.h.toFixed(2)}
          </div>
        </div>
        <div className="p-2 bg-white/5 rounded-lg">
          <div className="text-xs text-gray-400">Low</div>
          <div className="text-sm font-medium text-red-400">
            ${snapshot.dailyBar.l.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Quote */}
      <div className="p-3 bg-white/5 rounded-lg">
        <div className="text-xs text-gray-400 mb-2">Quote</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-green-400">Bid</div>
            <div className="text-sm font-medium text-white">
              ${snapshot.latestQuote.bidPrice.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              x{snapshot.latestQuote.bidSize}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-red-400">Ask</div>
            <div className="text-sm font-medium text-white">
              ${snapshot.latestQuote.askPrice.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              x{snapshot.latestQuote.askSize}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectorOverview() {
  const sectors = [
    { name: 'Technology', change: 1.2, color: 'from-blue-500 to-cyan-500' },
    { name: 'Financial', change: 0.8, color: 'from-green-500 to-emerald-500' },
    { name: 'Healthcare', change: -0.3, color: 'from-purple-500 to-pink-500' },
    { name: 'Energy', change: 2.1, color: 'from-orange-500 to-red-500' },
    { name: 'Consumer', change: 0.5, color: 'from-yellow-500 to-amber-500' },
    { name: 'Industrial', change: -0.1, color: 'from-gray-500 to-slate-500' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {sectors.map((sector) => (
        <div
          key={sector.name}
          className={`p-3 rounded-lg bg-gradient-to-br ${sector.color} bg-opacity-10`}
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
          }}
        >
          <div className="text-xs text-gray-400">{sector.name}</div>
          <div
            className={`text-sm font-medium ${
              sector.change >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {sector.change >= 0 ? '+' : ''}
            {sector.change.toFixed(2)}%
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export default function USStockWidget() {
  const [activeTab, setActiveTab] = useState<TabType>('popular')
  const [popularStocks, setPopularStocks] = useState<StockData[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [marketClock, setMarketClock] = useState<MarketClock | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  // Initial load
  useEffect(() => {
    Promise.all([fetchPopularStocks(), fetchMarketClock()])
      .then(([stocks, clock]) => {
        setPopularStocks(stocks)
        setMarketClock(clock)
      })
      .finally(() => setLoading(false))
  }, [])

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const results = await searchStocks(searchQuery)
      setSearchResults(results)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [searchQuery])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(handleSearch, 300)
    return () => clearTimeout(timer)
  }, [handleSearch])

  // Refresh handler
  const handleRefresh = () => {
    setLoading(true)
    Promise.all([fetchPopularStocks(), fetchMarketClock()])
      .then(([stocks, clock]) => {
        setPopularStocks(stocks)
        setMarketClock(clock)
      })
      .finally(() => setLoading(false))
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'popular', label: 'Popular', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'search', label: 'Search', icon: <Search className="w-4 h-4" /> },
    { id: 'market', label: 'Market', icon: <Globe className="w-4 h-4" /> },
  ]

  return (
    <div className="bg-[#0D0D0F] border border-white/10 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-bold text-white">US Stocks</h2>
        </div>
        <div className="flex items-center gap-2">
          <MarketStatusBadge clock={marketClock} />
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Selected Stock Detail */}
      {selectedSymbol && (
        <div className="mb-4">
          <StockDetailCard
            symbol={selectedSymbol}
            onClose={() => setSelectedSymbol(null)}
          />
        </div>
      )}

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* Popular Tab */}
        {activeTab === 'popular' && (
          <div className="space-y-1">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-white/5 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : popularStocks.length > 0 ? (
              popularStocks.map((stock) => (
                <StockRow
                  key={stock.symbol}
                  stock={stock}
                  onClick={() => setSelectedSymbol(stock.symbol)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>데이터를 불러올 수 없습니다</p>
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks (AAPL, Tesla...)"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            <div className="space-y-1">
              {searching ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-white/5 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <SearchResultRow
                    key={result.id}
                    result={result}
                    onClick={() => setSelectedSymbol(result.symbol)}
                  />
                ))
              ) : searchQuery ? (
                <div className="text-center py-8 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>검색 결과가 없습니다</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>종목명 또는 심볼을 검색하세요</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market Tab */}
        {activeTab === 'market' && (
          <div>
            {/* Market Status */}
            <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-white">Market Hours (ET)</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Pre-Market</div>
                  <div className="text-white">4:00 AM - 9:30 AM</div>
                </div>
                <div>
                  <div className="text-gray-400">Regular</div>
                  <div className="text-white">9:30 AM - 4:00 PM</div>
                </div>
                <div>
                  <div className="text-gray-400">After-Hours</div>
                  <div className="text-white">4:00 PM - 8:00 PM</div>
                </div>
                <div>
                  <div className="text-gray-400">Status</div>
                  <div
                    className={`font-medium ${
                      marketClock?.isOpen ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {marketClock?.isOpen ? 'Open' : 'Closed'}
                  </div>
                </div>
              </div>
            </div>

            {/* Sector Overview */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Sector Performance
              </h3>
              <SectorOverview />
            </div>

            {/* Exchange Info */}
            <div className="p-3 bg-white/5 rounded-lg">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Exchanges</h3>
              <div className="flex flex-wrap gap-2">
                {['NYSE', 'NASDAQ', 'AMEX', 'ARCA'].map((exchange) => (
                  <span
                    key={exchange}
                    className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300"
                  >
                    {exchange}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          본 데이터는 교육 및 참고 목적으로 제공되며, 투자 조언이 아닙니다. 실제
          거래 시 Alpaca Securities LLC를 통해 진행되며, FINRA/SIPC 회원입니다.
          투자 결정은 본인 책임입니다.
        </p>
      </div>
    </div>
  )
}
