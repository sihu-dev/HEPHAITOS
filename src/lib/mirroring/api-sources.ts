// ============================================
// Celebrity Portfolio API Sources
// SEC 13F, Congress Disclosure, Unusual Whales 연동
// ============================================

/**
 * API Source Types
 */
export interface APISource {
  id: string
  name: string
  type: 'sec_13f' | 'congress' | 'fund_daily' | 'public'
  baseUrl: string
  rateLimit: number // requests per minute
  delay: number // days of delay (13F = 45 days)
  requiresAuth: boolean
  cost: 'free' | 'paid'
}

export interface SEC13FHolding {
  cusip: string
  nameOfIssuer: string
  titleOfClass: string
  value: number // in thousands
  shares: number
  shrsOrPrnAmt: 'SH' | 'PRN'
  putCall?: 'PUT' | 'CALL'
  investmentDiscretion: 'SOLE' | 'DEFINED' | 'OTHER'
  otherManager?: string
  votingAuthority: {
    sole: number
    shared: number
    none: number
  }
}

export interface SEC13FFiling {
  accessionNumber: string
  cik: string
  filerName: string
  filingDate: string
  periodOfReport: string
  holdings: SEC13FHolding[]
  totalValue: number
}

export interface CongressTrade {
  transactionDate: string
  disclosureDate: string
  politician: string
  chamber: 'Senate' | 'House'
  party: 'D' | 'R' | 'I'
  ticker: string
  assetDescription: string
  type: 'purchase' | 'sale' | 'exchange'
  amount: string // "$1,001 - $15,000" format
  amountMin: number
  amountMax: number
  owner: 'self' | 'spouse' | 'child' | 'joint'
  comment?: string
}

// ============================================
// API Sources Registry
// ============================================

export const API_SOURCES: Record<string, APISource> = {
  SEC_EDGAR: {
    id: 'sec_edgar',
    name: 'SEC EDGAR',
    type: 'sec_13f',
    baseUrl: 'https://www.sec.gov/cgi-bin/browse-edgar',
    rateLimit: 10,
    delay: 45,
    requiresAuth: false,
    cost: 'free',
  },
  QUIVER_CONGRESS: {
    id: 'quiver_congress',
    name: 'Quiver Quantitative (Congress)',
    type: 'congress',
    baseUrl: 'https://api.quiverquant.com',
    rateLimit: 100,
    delay: 45,
    requiresAuth: true,
    cost: 'paid',
  },
  UNUSUAL_WHALES: {
    id: 'unusual_whales',
    name: 'Unusual Whales',
    type: 'congress',
    baseUrl: 'https://api.unusualwhales.com',
    rateLimit: 60,
    delay: 45,
    requiresAuth: true,
    cost: 'paid',
  },
  ARK_INVEST: {
    id: 'ark_invest',
    name: 'ARK Invest (Daily)',
    type: 'fund_daily',
    baseUrl: 'https://ark-funds.com/wp-content/uploads/funds-etf-csv',
    rateLimit: 60,
    delay: 0,
    requiresAuth: false,
    cost: 'free',
  },
}

// ============================================
// SEC EDGAR API Client
// ============================================

export class SECEdgarClient {
  private baseUrl = 'https://data.sec.gov'
  private userAgent = 'HEPHAITOS/1.0 (contact@hephaitos.com)'

  /**
   * Search for 13F filings by CIK
   */
  async search13F(cik: string): Promise<SEC13FFiling[]> {
    try {
      // Format CIK to 10 digits
      const formattedCik = cik.padStart(10, '0')

      // Get submissions
      const url = `${this.baseUrl}/submissions/CIK${formattedCik}.json`
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
      })

      if (!response.ok) {
        throw new Error(`SEC API error: ${response.status}`)
      }

      const data = await response.json()

      // Filter 13F filings
      const filings: SEC13FFiling[] = []
      const recentFilings = data.filings?.recent || {}

      for (let i = 0; i < (recentFilings.form?.length || 0); i++) {
        if (recentFilings.form[i] === '13F-HR' || recentFilings.form[i] === '13F-HR/A') {
          filings.push({
            accessionNumber: recentFilings.accessionNumber[i],
            cik: formattedCik,
            filerName: data.name,
            filingDate: recentFilings.filingDate[i],
            periodOfReport: recentFilings.reportDate?.[i] || recentFilings.filingDate[i],
            holdings: [],
            totalValue: 0,
          })
        }
      }

      return filings.slice(0, 10) // Return last 10 filings
    } catch (error) {
      console.error('[SEC] Search 13F failed:', error)
      return []
    }
  }

  /**
   * Get 13F holdings detail
   */
  async get13FHoldings(accessionNumber: string): Promise<SEC13FHolding[]> {
    try {
      // Format accession number (e.g., 0001567619-24-012345 -> 000156761924012345)
      const formattedAccession = accessionNumber.replace(/-/g, '')
      const cik = formattedAccession.substring(0, 10)

      const url = `${this.baseUrl}/Archives/edgar/data/${parseInt(cik)}/${formattedAccession}/primary_doc.xml`

      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
      })

      if (!response.ok) {
        // Try alternative format
        return this.parse13FFromHTML(accessionNumber)
      }

      const xml = await response.text()
      return this.parseXML13F(xml)
    } catch (error) {
      console.error('[SEC] Get 13F holdings failed:', error)
      return []
    }
  }

  private parseXML13F(xml: string): SEC13FHolding[] {
    // Simple XML parsing (in production, use proper XML parser)
    const holdings: SEC13FHolding[] = []

    const infoTableRegex = /<infoTable[^>]*>([\s\S]*?)<\/infoTable>/gi
    let match

    while ((match = infoTableRegex.exec(xml)) !== null) {
      const entry = match[1]

      const getValue = (tag: string): string => {
        const tagMatch = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i').exec(entry)
        return tagMatch?.[1]?.trim() || ''
      }

      holdings.push({
        cusip: getValue('cusip'),
        nameOfIssuer: getValue('nameOfIssuer'),
        titleOfClass: getValue('titleOfClass'),
        value: parseInt(getValue('value')) || 0,
        shares: parseInt(getValue('shrsOrPrnAmt') && getValue('sshPrnamt')) || 0,
        shrsOrPrnAmt: getValue('sshPrnamtType') as 'SH' | 'PRN' || 'SH',
        investmentDiscretion: getValue('investmentDiscretion') as SEC13FHolding['investmentDiscretion'] || 'SOLE',
        votingAuthority: {
          sole: parseInt(getValue('Sole')) || 0,
          shared: parseInt(getValue('Shared')) || 0,
          none: parseInt(getValue('None')) || 0,
        },
      })
    }

    return holdings
  }

  private async parse13FFromHTML(_accessionNumber: string): Promise<SEC13FHolding[]> {
    // Fallback HTML parsing
    return []
  }
}

// ============================================
// Congress Trading Client (Mock + Real API)
// ============================================

export class CongressTradingClient {
  private apiKey: string | null = null
  private baseUrl = 'https://api.quiverquant.com/beta'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null
  }

  /**
   * Get recent congress trades
   */
  async getRecentTrades(limit: number = 50): Promise<CongressTrade[]> {
    if (this.apiKey) {
      return this.fetchFromAPI(limit)
    }
    return this.getMockTrades(limit)
  }

  /**
   * Get trades by politician
   */
  async getTradesByPolitician(politicianName: string, limit: number = 20): Promise<CongressTrade[]> {
    const allTrades = await this.getRecentTrades(200)
    return allTrades
      .filter(t => t.politician.toLowerCase().includes(politicianName.toLowerCase()))
      .slice(0, limit)
  }

  private async fetchFromAPI(limit: number): Promise<CongressTrade[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/historical/congresstrading?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        console.warn('[Congress] API call failed, using mock data')
        return this.getMockTrades(limit)
      }

      const data = await response.json()
      return data.map(this.parseQuiverTrade)
    } catch (error) {
      console.error('[Congress] API error:', error)
      return this.getMockTrades(limit)
    }
  }

  private parseQuiverTrade(raw: Record<string, unknown>): CongressTrade {
    return {
      transactionDate: raw.TransactionDate as string,
      disclosureDate: raw.DisclosureDate as string,
      politician: raw.Representative as string,
      chamber: raw.House as 'Senate' | 'House',
      party: raw.Party as 'D' | 'R' | 'I',
      ticker: raw.Ticker as string,
      assetDescription: raw.Asset as string,
      type: (raw.Transaction as string)?.toLowerCase().includes('purchase') ? 'purchase' : 'sale',
      amount: raw.Range as string,
      amountMin: 0,
      amountMax: 0,
      owner: 'self',
    }
  }

  private getMockTrades(limit: number): CongressTrade[] {
    const mockTrades: CongressTrade[] = [
      {
        transactionDate: '2025-12-10',
        disclosureDate: '2025-12-11',
        politician: 'Nancy Pelosi',
        chamber: 'House',
        party: 'D',
        ticker: 'NVDA',
        assetDescription: 'NVIDIA Corporation',
        type: 'purchase',
        amount: '$500,001 - $1,000,000',
        amountMin: 500001,
        amountMax: 1000000,
        owner: 'spouse',
      },
      {
        transactionDate: '2025-12-08',
        disclosureDate: '2025-12-10',
        politician: 'Nancy Pelosi',
        chamber: 'House',
        party: 'D',
        ticker: 'GOOGL',
        assetDescription: 'Alphabet Inc.',
        type: 'purchase',
        amount: '$250,001 - $500,000',
        amountMin: 250001,
        amountMax: 500000,
        owner: 'spouse',
      },
      {
        transactionDate: '2025-12-05',
        disclosureDate: '2025-12-07',
        politician: 'Dan Crenshaw',
        chamber: 'House',
        party: 'R',
        ticker: 'MSFT',
        assetDescription: 'Microsoft Corporation',
        type: 'purchase',
        amount: '$15,001 - $50,000',
        amountMin: 15001,
        amountMax: 50000,
        owner: 'self',
      },
      {
        transactionDate: '2025-12-03',
        disclosureDate: '2025-12-05',
        politician: 'Josh Gottheimer',
        chamber: 'House',
        party: 'D',
        ticker: 'AAPL',
        assetDescription: 'Apple Inc.',
        type: 'sale',
        amount: '$100,001 - $250,000',
        amountMin: 100001,
        amountMax: 250000,
        owner: 'joint',
      },
      {
        transactionDate: '2025-12-01',
        disclosureDate: '2025-12-03',
        politician: 'Michael Burry',
        chamber: 'House',
        party: 'R',
        ticker: 'BABA',
        assetDescription: 'Alibaba Group',
        type: 'purchase',
        amount: '$1,000,001 - $5,000,000',
        amountMin: 1000001,
        amountMax: 5000000,
        owner: 'self',
      },
    ]

    return mockTrades.slice(0, limit)
  }
}

// ============================================
// ARK Invest Client (Daily Holdings)
// ============================================

export class ARKInvestClient {
  private baseUrl = 'https://ark-funds.com/wp-content/uploads/funds-etf-csv'

  /**
   * Get ARK ETF holdings
   */
  async getHoldings(etf: 'ARKK' | 'ARKW' | 'ARKG' | 'ARKF' | 'ARKQ'): Promise<{
    ticker: string
    company: string
    cusip: string
    shares: number
    marketValue: number
    weight: number
  }[]> {
    try {
      const url = `${this.baseUrl}/ARK_${etf}_ETF_HOLDINGS.csv`
      const response = await fetch(url)

      if (!response.ok) {
        return this.getMockARKHoldings(etf)
      }

      const csv = await response.text()
      return this.parseCSV(csv)
    } catch (error) {
      console.error('[ARK] Failed to get holdings:', error)
      return this.getMockARKHoldings(etf)
    }
  }

  private parseCSV(csv: string): {
    ticker: string
    company: string
    cusip: string
    shares: number
    marketValue: number
    weight: number
  }[] {
    const lines = csv.split('\n').slice(1) // Skip header
    const holdings = []

    for (const line of lines) {
      const cols = line.split(',')
      if (cols.length >= 7 && cols[3]) {
        holdings.push({
          ticker: cols[3].replace(/"/g, '').trim(),
          company: cols[2].replace(/"/g, '').trim(),
          cusip: cols[4].replace(/"/g, '').trim(),
          shares: parseInt(cols[5].replace(/[",]/g, '')) || 0,
          marketValue: parseFloat(cols[6].replace(/[",]/g, '').replace('$', '')) || 0,
          weight: parseFloat(cols[7].replace(/["%,]/g, '')) || 0,
        })
      }
    }

    return holdings
  }

  private getMockARKHoldings(_etf: string): {
    ticker: string
    company: string
    cusip: string
    shares: number
    marketValue: number
    weight: number
  }[] {
    return [
      { ticker: 'TSLA', company: 'Tesla Inc', cusip: '88160R101', shares: 2500000, marketValue: 625000000, weight: 12.5 },
      { ticker: 'COIN', company: 'Coinbase Global', cusip: '19260Q107', shares: 3000000, marketValue: 540000000, weight: 8.2 },
      { ticker: 'ROKU', company: 'Roku Inc', cusip: '77543R102', shares: 4000000, marketValue: 340000000, weight: 6.8 },
      { ticker: 'SQ', company: 'Block Inc', cusip: '852234103', shares: 3500000, marketValue: 280000000, weight: 5.5 },
      { ticker: 'PLTR', company: 'Palantir Technologies', cusip: '69608A108', shares: 5000000, marketValue: 110000000, weight: 5.2 },
    ]
  }
}

// ============================================
// CIK Lookup (Company → CIK)
// ============================================

export const FAMOUS_INVESTOR_CIKS: Record<string, { cik: string; name: string }> = {
  warren_buffett: { cik: '0001067983', name: 'BERKSHIRE HATHAWAY INC' },
  michael_burry: { cik: '0001649339', name: 'SCION ASSET MANAGEMENT, LLC' },
  bill_ackman: { cik: '0001336528', name: 'PERSHING SQUARE CAPITAL MANAGEMENT, L.P.' },
  ray_dalio: { cik: '0001350694', name: 'BRIDGEWATER ASSOCIATES, LP' },
  carl_icahn: { cik: '0000921669', name: 'ICAHN CARL C' },
  david_tepper: { cik: '0001006249', name: 'APPALOOSA LP' },
  daniel_loeb: { cik: '0001040273', name: 'THIRD POINT LLC' },
  stan_druckenmiller: { cik: '0001536411', name: 'DUQUESNE FAMILY OFFICE LLC' },
}

// ============================================
// Exports
// ============================================

export const secClient = new SECEdgarClient()
export const congressClient = new CongressTradingClient()
export const arkClient = new ARKInvestClient()
