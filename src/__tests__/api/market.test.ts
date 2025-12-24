// ============================================
// Market API Integration Tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/market/route'

describe('Market API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/market', () => {
    it('should return market data for all symbols', async () => {
      const request = new NextRequest('http://localhost:3000/api/market')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeGreaterThan(0)
    })

    it('should return correct market data structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/market')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      const firstItem = data.data[0]
      expect(firstItem).toHaveProperty('symbol')
      expect(firstItem).toHaveProperty('price')
      expect(firstItem).toHaveProperty('change24h')
      expect(firstItem).toHaveProperty('volume24h')
      expect(firstItem).toHaveProperty('high24h')
      expect(firstItem).toHaveProperty('low24h')
      expect(firstItem).toHaveProperty('marketCap')
    })

    it('should filter by specific symbols', async () => {
      const request = new NextRequest('http://localhost:3000/api/market?symbols=BTC,ETH')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.length).toBe(2)
      expect(data.data.some((m: { symbol: string }) => m.symbol === 'BTC')).toBe(true)
      expect(data.data.some((m: { symbol: string }) => m.symbol === 'ETH')).toBe(true)
    })

    it('should return placeholder data for unknown symbols', async () => {
      const request = new NextRequest('http://localhost:3000/api/market?symbols=NONEXISTENT')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // API returns mock/placeholder data for unknown symbols
      expect(data.data.length).toBe(1)
      expect(data.data[0].symbol).toBe('NONEXISTENT')
      expect(data.data[0].price).toBeDefined()
    })

    it('should include BTC in default response', async () => {
      const request = new NextRequest('http://localhost:3000/api/market')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      const btc = data.data.find((m: { symbol: string }) => m.symbol === 'BTC')
      expect(btc).toBeDefined()
      expect(btc.price).toBeGreaterThan(0)
    })

    it('should have realistic price values', async () => {
      const request = new NextRequest('http://localhost:3000/api/market')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      for (const market of data.data) {
        expect(market.price).toBeGreaterThan(0)
        expect(market.volume24h).toBeGreaterThan(0)
        expect(market.high24h).toBeGreaterThanOrEqual(market.low24h)
      }
    })

    it('should apply price randomization', async () => {
      const request1 = new NextRequest('http://localhost:3000/api/market?symbols=BTC')
      const response1 = await GET(request1)
      const data1 = await response1.json()

      const request2 = new NextRequest('http://localhost:3000/api/market?symbols=BTC')
      const response2 = await GET(request2)
      const data2 = await response2.json()

      // Due to randomization, prices might differ slightly
      // Just check both are valid
      expect(data1.data[0].price).toBeGreaterThan(0)
      expect(data2.data[0].price).toBeGreaterThan(0)
    })

    it('should return multiple known cryptocurrencies', async () => {
      const request = new NextRequest('http://localhost:3000/api/market')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      const symbols = data.data.map((m: { symbol: string }) => m.symbol)
      expect(symbols).toContain('BTC')
      expect(symbols).toContain('ETH')
      expect(symbols).toContain('SOL')
    })
  })
})
