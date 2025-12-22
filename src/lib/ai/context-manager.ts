// ============================================
// Context Manager for Claude Extended Context (200K tokens)
// 토큰 추정, 컨텍스트 윈도우 관리, 우선순위 기반 데이터 선택
// ============================================

import { safeLogger } from '@/lib/utils/safe-logger'

/**
 * Context Manager Configuration
 */
export interface ContextManagerConfig {
  maxTokens?: number // Default: 200,000 (Claude Sonnet 4.5)
  safetyMargin?: number // Default: 0.9 (90% of max)
  charsPerToken?: number // Default: 4 (1 token ≈ 4 characters)
}

/**
 * Data item with priority for context selection
 */
export interface PrioritizedData {
  text: string
  priority: number // Higher = more important
  metadata?: Record<string, unknown>
}

/**
 * Token estimation result
 */
export interface TokenEstimate {
  tokens: number
  characters: number
  canFit: boolean
  utilizationPercent: number
}

/**
 * Context Manager
 *
 * @description
 * Claude Extended Context (200K tokens)를 효율적으로 관리합니다.
 * - 토큰 수 추정 (1 토큰 ≈ 4 글자)
 * - 컨텍스트 윈도우 확인
 * - 우선순위 기반 데이터 선택
 *
 * @example
 * ```typescript
 * const manager = new ContextManager()
 *
 * // 토큰 수 추정
 * const estimate = manager.estimate(backtestData)
 * console.log(`토큰: ${estimate.tokens}, 사용률: ${estimate.utilizationPercent}%`)
 *
 * // 컨텍스트에 맞는지 확인
 * if (manager.canFit([data1, data2, data3])) {
 *   // 모두 컨텍스트에 포함 가능
 * }
 *
 * // 우선순위 기반 선택
 * const selected = manager.selectByPriority([
 *   { text: recentData, priority: 100 },
 *   { text: oldData, priority: 50 }
 * ])
 * ```
 */
export class ContextManager {
  private readonly maxTokens: number
  private readonly safetyMargin: number
  private readonly charsPerToken: number
  private readonly effectiveMaxTokens: number

  constructor(config: ContextManagerConfig = {}) {
    this.maxTokens = config.maxTokens || 200000 // Claude Sonnet 4.5 limit
    this.safetyMargin = config.safetyMargin || 0.9 // 90% safety margin
    this.charsPerToken = config.charsPerToken || 4 // 1 token ≈ 4 chars
    this.effectiveMaxTokens = Math.floor(this.maxTokens * this.safetyMargin)

    safeLogger.info('[ContextManager] Initialized', {
      maxTokens: this.maxTokens,
      effectiveMaxTokens: this.effectiveMaxTokens,
      safetyMargin: `${this.safetyMargin * 100}%`,
    })
  }

  /**
   * Estimate token count for text
   *
   * @param text - Text to estimate
   * @returns Token estimate
   */
  estimate(text: string): TokenEstimate {
    const characters = text.length
    const tokens = Math.ceil(characters / this.charsPerToken)
    const canFit = tokens <= this.effectiveMaxTokens
    const utilizationPercent = (tokens / this.maxTokens) * 100

    return {
      tokens,
      characters,
      canFit,
      utilizationPercent,
    }
  }

  /**
   * Estimate total tokens for multiple texts
   *
   * @param texts - Array of texts
   * @returns Total token estimate
   */
  estimateMultiple(texts: string[]): TokenEstimate {
    const totalText = texts.join('\n')
    return this.estimate(totalText)
  }

  /**
   * Check if items can fit in context window
   *
   * @param items - Array of text items
   * @returns True if all items fit within context
   */
  canFit(items: string[]): boolean {
    const estimate = this.estimateMultiple(items)
    return estimate.canFit
  }

  /**
   * Select most relevant data based on priority
   *
   * @description
   * 우선순위가 높은 데이터부터 선택하여 컨텍스트 윈도우 내에서
   * 최대한 많은 데이터를 포함합니다.
   *
   * @param items - Prioritized data items
   * @param maxTokens - Maximum tokens to use (default: effectiveMaxTokens)
   * @returns Selected items that fit in context
   *
   * @example
   * ```typescript
   * const selected = manager.selectByPriority([
   *   { text: '최근 1년 데이터', priority: 100 },
   *   { text: '2년전 데이터', priority: 50 },
   *   { text: '10년전 데이터', priority: 10 }
   * ], 50000) // 50K 토큰 제한
   * ```
   */
  selectByPriority(
    items: PrioritizedData[],
    maxTokens: number = this.effectiveMaxTokens
  ): PrioritizedData[] {
    // Sort by priority (highest first)
    const sorted = [...items].sort((a, b) => b.priority - a.priority)

    const selected: PrioritizedData[] = []
    let currentTokens = 0

    for (const item of sorted) {
      const itemTokens = this.estimate(item.text).tokens

      if (currentTokens + itemTokens <= maxTokens) {
        selected.push(item)
        currentTokens += itemTokens
      } else {
        safeLogger.debug('[ContextManager] Item skipped (token limit)', {
          priority: item.priority,
          itemTokens,
          currentTokens,
          maxTokens,
        })
        break
      }
    }

    safeLogger.info('[ContextManager] Selected by priority', {
      total: items.length,
      selected: selected.length,
      skipped: items.length - selected.length,
      totalTokens: currentTokens,
      utilizationPercent: ((currentTokens / maxTokens) * 100).toFixed(2) + '%',
    })

    return selected
  }

  /**
   * Chunk data intelligently (fallback for old API)
   *
   * @description
   * Extended Context를 지원하지 않는 구형 API를 위한 청킹 함수.
   * 가능하면 사용하지 말고 Extended Context를 사용하세요.
   *
   * @param text - Text to chunk
   * @param chunkSize - Max tokens per chunk (default: 30,000)
   * @returns Array of text chunks
   *
   * @deprecated Use Extended Context instead
   */
  chunk(text: string, chunkSize: number = 30000): string[] {
    const estimate = this.estimate(text)

    if (estimate.tokens <= chunkSize) {
      return [text]
    }

    safeLogger.warn('[ContextManager] ⚠️ Chunking required (consider Extended Context)', {
      totalTokens: estimate.tokens,
      chunkSize,
      estimatedChunks: Math.ceil(estimate.tokens / chunkSize),
    })

    const chunks: string[] = []
    const charsPerChunk = chunkSize * this.charsPerToken

    for (let i = 0; i < text.length; i += charsPerChunk) {
      chunks.push(text.slice(i, i + charsPerChunk))
    }

    return chunks
  }

  /**
   * Format backtest data for Extended Context
   *
   * @description
   * 백테스트 결과를 200K 컨텍스트에 맞게 포맷합니다.
   * - 요약 정보 우선
   * - 중요 거래만 포함
   * - 자산 곡선 샘플링
   *
   * @param result - Backtest result
   * @returns Formatted text for Claude
   */
  formatBacktestForContext(result: {
    metrics: Record<string, number | string>
    trades: Array<Record<string, unknown>>
    equityCurve: Array<Record<string, number>>
  }): string {
    const sections: string[] = []

    // 1. 성과 지표 (항상 포함)
    sections.push('## 성과 지표\n')
    sections.push(JSON.stringify(result.metrics, null, 2))

    // 2. 주요 거래 (손익 상위/하위 10개)
    const sortedTrades = [...result.trades].sort(
      (a, b) => Math.abs((b.pnl as number) || 0) - Math.abs((a.pnl as number) || 0)
    )
    const topTrades = sortedTrades.slice(0, 20) // Top 20 most significant trades

    sections.push('\n## 주요 거래 (손익 기준 상위 20개)\n')
    sections.push(JSON.stringify(topTrades, null, 2))

    // 3. 자산 곡선 (샘플링: 매 10번째 데이터)
    const sampledEquity = result.equityCurve.filter((_, i) => i % 10 === 0)
    sections.push('\n## 자산 곡선 (샘플링)\n')
    sections.push(JSON.stringify(sampledEquity, null, 2))

    const formatted = sections.join('\n')

    const estimate = this.estimate(formatted)
    safeLogger.info('[ContextManager] Formatted backtest data', {
      originalTrades: result.trades.length,
      includedTrades: topTrades.length,
      originalEquityPoints: result.equityCurve.length,
      sampledEquityPoints: sampledEquity.length,
      totalTokens: estimate.tokens,
      utilizationPercent: estimate.utilizationPercent.toFixed(2) + '%',
    })

    return formatted
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      maxTokens: this.maxTokens,
      effectiveMaxTokens: this.effectiveMaxTokens,
      safetyMargin: this.safetyMargin,
      charsPerToken: this.charsPerToken,
    }
  }
}

// ============================================
// Factory & Singleton
// ============================================

let _contextManager: ContextManager | null = null

export function getContextManager(): ContextManager {
  if (!_contextManager) {
    _contextManager = new ContextManager()
  }
  return _contextManager
}

export function createContextManager(config?: ContextManagerConfig): ContextManager {
  return new ContextManager(config)
}
