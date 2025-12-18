// ============================================
// Broker Manager Unit Tests
// ============================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getBrokerInfo,
  getBrokersByMarket,
  createBroker,
  SUPPORTED_BROKERS,
} from '@/lib/broker'
import type { BrokerId } from '@/lib/broker/types'

// ============================================
// Tests
// ============================================

describe('Broker Registry', () => {
  describe('SUPPORTED_BROKERS', () => {
    it('should have broker list', () => {
      expect(SUPPORTED_BROKERS).toBeDefined()
      expect(SUPPORTED_BROKERS.length).toBeGreaterThan(0)
    })

    it('should have required fields for each broker', () => {
      SUPPORTED_BROKERS.forEach((broker) => {
        expect(broker.id).toBeDefined()
        expect(broker.name).toBeDefined()
        expect(broker.nameKr).toBeDefined()
        expect(broker.status).toBeDefined()
        expect(broker.difficulty).toBeDefined()
        expect(broker.setupTime).toBeDefined()
        expect(broker.features).toBeDefined()
        expect(broker.apiType).toBeDefined()
        expect(broker.markets).toBeDefined()
        expect(Array.isArray(broker.features)).toBe(true)
        expect(Array.isArray(broker.markets)).toBe(true)
      })
    })

    it('should have unique broker IDs', () => {
      const ids = SUPPORTED_BROKERS.map((b) => b.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have valid status values', () => {
      const validStatuses = ['supported', 'beta', 'coming_soon', 'maintenance']
      SUPPORTED_BROKERS.forEach((broker) => {
        expect(validStatuses).toContain(broker.status)
      })
    })

    it('should have valid difficulty levels', () => {
      const validDifficulties = ['very_easy', 'easy', 'medium', 'hard']
      SUPPORTED_BROKERS.forEach((broker) => {
        expect(validDifficulties).toContain(broker.difficulty)
      })
    })

    it('should have valid API types', () => {
      const validApiTypes = ['rest', 'websocket', 'hybrid']
      SUPPORTED_BROKERS.forEach((broker) => {
        expect(validApiTypes).toContain(broker.apiType)
      })
    })
  })

  describe('getBrokerInfo', () => {
    it('should return broker info for valid ID', () => {
      const kisBroker = getBrokerInfo('kis')
      expect(kisBroker).toBeDefined()
      expect(kisBroker?.id).toBe('kis')
      expect(kisBroker?.name).toBe('Korea Investment & Securities')
    })

    it('should return undefined for invalid ID', () => {
      const invalidBroker = getBrokerInfo('invalid' as BrokerId)
      expect(invalidBroker).toBeUndefined()
    })

    it('should return correct broker for all supported IDs', () => {
      const brokerIds: BrokerId[] = ['kis', 'alpaca', 'binance', 'upbit', 'kiwoom']
      brokerIds.forEach((id) => {
        const info = getBrokerInfo(id)
        if (info) {
          expect(info.id).toBe(id)
        }
      })
    })
  })

  describe('getBrokersByMarket', () => {
    it('should return Korean stock brokers', () => {
      const krBrokers = getBrokersByMarket('kr_stock')
      expect(krBrokers.length).toBeGreaterThan(0)
      krBrokers.forEach((broker) => {
        expect(broker.markets).toContain('kr_stock')
      })
    })

    it('should return US stock brokers', () => {
      const usBrokers = getBrokersByMarket('us_stock')
      expect(usBrokers.length).toBeGreaterThan(0)
      usBrokers.forEach((broker) => {
        expect(broker.markets).toContain('us_stock')
      })
    })

    it('should return crypto brokers', () => {
      const cryptoBrokers = getBrokersByMarket('crypto')
      expect(cryptoBrokers.length).toBeGreaterThan(0)
      cryptoBrokers.forEach((broker) => {
        expect(broker.markets).toContain('crypto')
      })
    })

    it('should return different brokers for different markets', () => {
      const krBrokers = getBrokersByMarket('kr_stock')
      const usBrokers = getBrokersByMarket('us_stock')
      const cryptoBrokers = getBrokersByMarket('crypto')

      const krIds = krBrokers.map((b) => b.id)
      const usIds = usBrokers.map((b) => b.id)
      const cryptoIds = cryptoBrokers.map((b) => b.id)

      // Should have at least one unique broker per market
      expect(krIds.some((id) => !usIds.includes(id))).toBe(true)
    })
  })

  describe('createBroker', () => {
    it('should create KIS broker', () => {
      const broker = createBroker('kis')
      expect(broker).toBeDefined()
      expect(broker.connect).toBeDefined()
      expect(broker.disconnect).toBeDefined()
    })

    it('should create Alpaca broker', () => {
      const broker = createBroker('alpaca')
      expect(broker).toBeDefined()
      expect(broker.connect).toBeDefined()
    })

    it('should create Binance broker with testnet option', () => {
      const broker = createBroker('binance', { testnet: true })
      expect(broker).toBeDefined()
    })

    it('should create Binance broker without testnet', () => {
      const broker = createBroker('binance', { testnet: false })
      expect(broker).toBeDefined()
    })

    it('should create Upbit broker', () => {
      const broker = createBroker('upbit')
      expect(broker).toBeDefined()
    })

    it('should create Kiwoom broker', () => {
      const broker = createBroker('kiwoom')
      expect(broker).toBeDefined()
    })

    it('should throw error for unimplemented broker', () => {
      expect(() => createBroker('samsung')).toThrow(/not yet implemented/)
      expect(() => createBroker('mirae')).toThrow(/not yet implemented/)
      expect(() => createBroker('nh')).toThrow(/not yet implemented/)
    })

    it('should throw error for unknown broker', () => {
      expect(() => createBroker('unknown' as BrokerId)).toThrow(/Unknown broker/)
    })

    it('should create broker with all required methods', () => {
      const broker = createBroker('kis')

      // Check required UnifiedBroker interface methods
      expect(typeof broker.connect).toBe('function')
      expect(typeof broker.disconnect).toBe('function')
      expect(typeof broker.getBalance).toBe('function')
      expect(typeof broker.getHoldings).toBe('function')
      expect(typeof broker.buy).toBe('function')
      expect(typeof broker.sell).toBe('function')
    })
  })

  describe('Broker Features', () => {
    it('should have paper trading support for development brokers', () => {
      const kisBroker = getBrokerInfo('kis')
      const alpacaBroker = getBrokerInfo('alpaca')

      expect(kisBroker?.paperTrading).toBe(true)
      expect(alpacaBroker?.paperTrading).toBe(true)
    })

    it('should have correct market assignments', () => {
      const kisBroker = getBrokerInfo('kis')
      const alpacaBroker = getBrokerInfo('alpaca')
      const binanceBroker = getBrokerInfo('binance')

      expect(kisBroker?.markets).toContain('kr_stock')
      expect(alpacaBroker?.markets).toContain('us_stock')
      expect(binanceBroker?.markets).toContain('crypto')
    })

    it('should have guide URLs for all brokers', () => {
      SUPPORTED_BROKERS.forEach((broker) => {
        expect(broker.guideUrl).toBeDefined()
        expect(broker.guideUrl).toMatch(/^https?:\/\//)
      })
    })
  })

  describe('Broker Status', () => {
    it('should have at least one supported broker', () => {
      const supportedBrokers = SUPPORTED_BROKERS.filter(
        (b) => b.status === 'supported'
      )
      expect(supportedBrokers.length).toBeGreaterThan(0)
    })

    it('should have KIS as supported', () => {
      const kisBroker = getBrokerInfo('kis')
      expect(kisBroker?.status).toBe('supported')
    })

    it('should have Alpaca as supported', () => {
      const alpacaBroker = getBrokerInfo('alpaca')
      expect(alpacaBroker?.status).toBe('supported')
    })
  })
})

describe('Broker Configuration', () => {
  describe('Setup Time', () => {
    it('should have reasonable setup times', () => {
      SUPPORTED_BROKERS.forEach((broker) => {
        const setupTime = broker.setupTime
        expect(setupTime).toMatch(/\d+분/)
      })
    })

    it('should categorize by difficulty correctly', () => {
      const veryEasyBrokers = SUPPORTED_BROKERS.filter(
        (b) => b.difficulty === 'very_easy'
      )
      const easyBrokers = SUPPORTED_BROKERS.filter((b) => b.difficulty === 'easy')

      // Very easy brokers should have shorter setup time
      veryEasyBrokers.forEach((broker) => {
        const minutes = parseInt(broker.setupTime)
        expect(minutes).toBeLessThanOrEqual(3)
      })
    })
  })

  describe('Features', () => {
    it('should have REST API feature for most brokers', () => {
      const restBrokers = SUPPORTED_BROKERS.filter((b) =>
        b.features.includes('REST API')
      )
      expect(restBrokers.length).toBeGreaterThan(0)
    })

    it('should have Paper Trading feature for supported brokers', () => {
      const paperTradingBrokers = SUPPORTED_BROKERS.filter(
        (b) => b.features.includes('Paper Trading') || b.features.includes('모의투자')
      )
      expect(paperTradingBrokers.length).toBeGreaterThan(0)
    })
  })
})
