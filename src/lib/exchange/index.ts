// ============================================
// Exchange Module Exports
// ============================================

export * from './types'
export * from './base'
export { BinanceExchange, binance, binanceTestnet } from './binance'
export { UpbitExchange, upbit } from './upbit'

import { binance, binanceTestnet } from './binance'
import { upbit } from './upbit'
import type { ExchangeId } from '@/types'
import type { IExchange } from './types'

// Exchange Factory
export function getExchange(exchangeId: ExchangeId, testnet: boolean = false): IExchange {
  switch (exchangeId) {
    case 'binance':
      return testnet ? binanceTestnet : binance
    case 'upbit':
      return upbit
    default:
      throw new Error(`Exchange ${exchangeId} is not supported`)
  }
}

// Available Exchanges
export const availableExchanges: { id: ExchangeId; name: string; enabled: boolean }[] = [
  { id: 'binance', name: 'Binance', enabled: true },
  { id: 'upbit', name: 'Upbit', enabled: true },
  { id: 'bithumb', name: 'Bithumb', enabled: false },
  { id: 'coinbase', name: 'Coinbase', enabled: false },
]

// Exchange Utils
export function formatPrice(price: number, precision: number = 2): string {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(2)}M`
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(2)}K`
  }
  if (price < 0.01) {
    return price.toFixed(8)
  }
  return price.toFixed(precision)
}

export function formatVolume(volume: number): string {
  if (volume >= 1000000000) {
    return `${(volume / 1000000000).toFixed(2)}B`
  }
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(2)}M`
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(2)}K`
  }
  return volume.toFixed(2)
}

export function formatKRW(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}
