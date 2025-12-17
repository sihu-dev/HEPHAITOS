// ============================================
// Data Source Adapters
// Loop 19: 데이터 Fallback 설계
// ============================================

import { safeLogger } from '@/lib/utils/safe-logger'

// ============================================
// Types
// ============================================

export interface CongressTrade {
  id: string
  politician: string
  party: string
  chamber: string
  ticker: string
  company: string
  transactionType: 'buy' | 'sell'
  amount: string
  transactionDate: string
  disclosureDate: string
  source: string
}

export interface InsiderTrade {
  id: string
  insider: string
  title: string
  ticker: string
  company: string
  transactionType: string
  shares: number
  pricePerShare: number
  totalValue: number
  transactionDate: string
  filingDate: string
  source: string
}

export interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: Date
  source: string
}

export interface SecFiling {
  accessionNumber: string
  cik: string
  company: string
  formType: string
  filingDate: string
  description: string
  documentUrl: string
  source: string
}

// ============================================
// Unusual Whales Adapter
// ============================================

export async function fetchUnusualWhalesCongressTrades(): Promise<CongressTrade[]> {
  const apiKey = process.env.UNUSUAL_WHALES_API_KEY
  if (!apiKey) {
    throw new Error('UNUSUAL_WHALES_API_KEY not configured')
  }

  const response = await fetch(
    'https://api.unusualwhales.com/api/congress-trades',
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Unusual Whales API error: ${response.status}`)
  }

  const data = await response.json()

  return (data.trades || []).map((trade: Record<string, unknown>) => ({
    id: `uw-${trade.id || crypto.randomUUID()}`,
    politician: trade.politician_name as string,
    party: trade.party as string,
    chamber: trade.chamber as string,
    ticker: trade.ticker as string,
    company: trade.issuer as string,
    transactionType: (trade.transaction_type as string)?.toLowerCase().includes('purchase')
      ? 'buy'
      : 'sell',
    amount: trade.amount as string,
    transactionDate: trade.transaction_date as string,
    disclosureDate: trade.disclosure_date as string,
    source: 'unusual_whales',
  }))
}

// ============================================
// Quiver Adapter
// ============================================

export async function fetchQuiverCongressTrades(): Promise<CongressTrade[]> {
  const apiKey = process.env.QUIVER_API_KEY
  if (!apiKey) {
    throw new Error('QUIVER_API_KEY not configured')
  }

  const response = await fetch(
    'https://api.quiverquant.com/beta/live/congresstrading',
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Quiver API error: ${response.status}`)
  }

  const data = await response.json()

  return (data || []).map((trade: Record<string, unknown>) => ({
    id: `qv-${trade.ReportDate}-${trade.Ticker}-${trade.Representative}`,
    politician: trade.Representative as string,
    party: trade.Party as string,
    chamber: trade.House as string,
    ticker: trade.Ticker as string,
    company: '', // Quiver doesn't provide company name
    transactionType: (trade.Transaction as string)?.toLowerCase().includes('purchase')
      ? 'buy'
      : 'sell',
    amount: trade.Range as string,
    transactionDate: trade.TransactionDate as string,
    disclosureDate: trade.ReportDate as string,
    source: 'quiver',
  }))
}

// ============================================
// SEC EDGAR Adapter (Free)
// ============================================

export async function fetchSecEdgarFilings(cik?: string): Promise<SecFiling[]> {
  const baseUrl = 'https://data.sec.gov/submissions'
  const url = cik
    ? `${baseUrl}/CIK${cik.padStart(10, '0')}.json`
    : `${baseUrl}/recent.json`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'HEPHAITOS/1.0 (contact@hephaitos.com)',
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`SEC EDGAR API error: ${response.status}`)
  }

  const data = await response.json()
  const filings = data.filings?.recent || data.recent || {}

  const result: SecFiling[] = []
  const count = Math.min(filings.accessionNumber?.length || 0, 50)

  for (let i = 0; i < count; i++) {
    result.push({
      accessionNumber: filings.accessionNumber[i],
      cik: data.cik || cik || '',
      company: data.name || '',
      formType: filings.form[i],
      filingDate: filings.filingDate[i],
      description: filings.primaryDocument[i] || '',
      documentUrl: `https://www.sec.gov/Archives/edgar/data/${data.cik}/${filings.accessionNumber[i].replace(/-/g, '')}/${filings.primaryDocument[i]}`,
      source: 'sec_edgar',
    })
  }

  return result
}

// SEC EDGAR for Congress Trades (Form 4/PTR)
export async function fetchSecCongressTrades(): Promise<CongressTrade[]> {
  // Note: SEC doesn't have direct congress trade endpoint
  // This fetches recent PTR filings that we'd need to parse
  safeLogger.info('[SEC] Congress trades via SEC not directly available')

  // Return empty - SEC doesn't have direct congress trade data
  // Would need to scrape/parse disclosure forms
  return []
}

// ============================================
// OpenInsider Adapter (Free)
// ============================================

export async function fetchOpenInsiderTrades(ticker?: string): Promise<InsiderTrade[]> {
  // OpenInsider doesn't have a public API, so this would need web scraping
  // For now, return empty with a note
  safeLogger.info('[OpenInsider] Would require web scraping')

  // Placeholder - actual implementation would scrape openinsider.com
  return []
}

// ============================================
// Finnhub Adapter
// ============================================

export async function fetchFinnhubQuote(symbol: string): Promise<StockQuote> {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    throw new Error('FINNHUB_API_KEY not configured')
  }

  const response = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
  )

  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.c) {
    throw new Error('Invalid quote data')
  }

  return {
    symbol,
    price: data.c,
    change: data.d,
    changePercent: data.dp,
    volume: data.v || 0,
    timestamp: new Date(data.t * 1000),
    source: 'finnhub',
  }
}

// ============================================
// Alpha Vantage Adapter
// ============================================

export async function fetchAlphaVantageQuote(symbol: string): Promise<StockQuote> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey) {
    throw new Error('ALPHA_VANTAGE_API_KEY not configured')
  }

  const response = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
  )

  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status}`)
  }

  const data = await response.json()
  const quote = data['Global Quote']

  if (!quote || !quote['05. price']) {
    throw new Error('Invalid quote data')
  }

  return {
    symbol,
    price: parseFloat(quote['05. price']),
    change: parseFloat(quote['09. change']),
    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
    volume: parseInt(quote['06. volume'], 10),
    timestamp: new Date(),
    source: 'alpha_vantage',
  }
}

// ============================================
// Yahoo Finance Adapter (Unofficial)
// ============================================

export async function fetchYahooFinanceQuote(symbol: string): Promise<StockQuote> {
  // Yahoo Finance doesn't have an official free API
  // This uses the unofficial chart endpoint
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Yahoo Finance error: ${response.status}`)
  }

  const data = await response.json()
  const result = data.chart?.result?.[0]

  if (!result) {
    throw new Error('Invalid quote data')
  }

  const meta = result.meta
  const quote = result.indicators?.quote?.[0]
  const lastIndex = (quote?.close?.length || 1) - 1

  return {
    symbol,
    price: meta.regularMarketPrice,
    change: meta.regularMarketPrice - meta.previousClose,
    changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
    volume: meta.regularMarketVolume || quote?.volume?.[lastIndex] || 0,
    timestamp: new Date(meta.regularMarketTime * 1000),
    source: 'yahoo_finance',
  }
}

// ============================================
// Combined Fetcher Factory
// ============================================

export function createCongressTradeFetchers() {
  return {
    unusual_whales: fetchUnusualWhalesCongressTrades,
    quiver: fetchQuiverCongressTrades,
    sec_edgar: fetchSecCongressTrades,
  }
}

export function createStockQuoteFetchers(symbol: string) {
  return {
    finnhub: () => fetchFinnhubQuote(symbol),
    alpha_vantage: () => fetchAlphaVantageQuote(symbol),
    yahoo_finance: () => fetchYahooFinanceQuote(symbol),
  }
}

export function createSecFilingsFetchers(cik?: string) {
  return {
    sec_edgar: () => fetchSecEdgarFilings(cik),
  }
}
