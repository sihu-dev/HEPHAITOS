// ============================================
// Strategy Builder
// Parsed Intent → Executable Strategy
// ============================================

import type {
  ParsedIntent,
  GeneratedStrategy,
  ValidationResult,
  ExtractedEntities,
  ConditionEntity,
  IndicatorEntity,
} from './types'
import type { Strategy, StrategyConfig, Condition, RiskManagement, Timeframe } from '@/types'
import { generateId } from '@/lib/utils'
import { riskProfiler, type UserRiskProfile } from './risk-profiler'
import { LegalCompliance } from './legal-compliance'

// ============================================
// Strategy Builder Class (Enhanced with Quant 2.0)
// ============================================

export class StrategyBuilder {
  private userProfile: UserRiskProfile

  constructor(userProfile?: UserRiskProfile) {
    // Default to moderate risk if not specified
    this.userProfile = userProfile || { level: 'moderate' }
  }

  /**
   * Build strategy from parsed intent (Quant 2.0: data-driven)
   */
  build(intent: ParsedIntent): GeneratedStrategy {
    const { entities } = intent

    // Extract core components
    const symbol = this.extractSymbol(entities)
    const timeframe = this.extractTimeframe(entities)
    const entryConditions = this.buildEntryConditions(entities)
    const exitConditions = this.buildExitConditions(entities)
    const riskManagement = this.buildRiskManagement(entities, symbol) // Pass symbol for dynamic calculation
    const positionSize = this.extractPositionSize(entities)

    // Build strategy object
    const strategy: Partial<Strategy> = {
      id: generateId('strat'),
      name: this.generateName(entities),
      description: this.generateDescription(intent),
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const config: Partial<StrategyConfig> = {
      symbols: [symbol],
      timeframe,
      entryConditions,
      exitConditions,
      riskManagement,
      allocation: positionSize,
    }

    // Validate
    const validation = this.validate(strategy, config, entities)

    // Generate explanation
    const explanation = this.generateExplanation(strategy, config, validation)

    // Generate suggestions
    const suggestions = this.generateSuggestions(validation, entities)

    return {
      strategy,
      config,
      validation,
      explanation,
      suggestions,
    }
  }

  // ============================================
  // Component Extraction
  // ============================================

  private extractSymbol(entities: ExtractedEntities): string {
    if (entities.symbols.length > 0) {
      return entities.symbols[0].value
    }
    return 'BTC/USDT' // Default
  }

  private extractTimeframe(entities: ExtractedEntities): Timeframe {
    if (entities.timeframes.length > 0) {
      return entities.timeframes[0].value
    }
    return '1h' // Default
  }

  private extractPositionSize(entities: ExtractedEntities): number {
    const positionPercent = entities.percentages.find(p => p.context === 'position_size')
    return positionPercent?.value ?? 10 // Default 10%
  }

  // ============================================
  // Condition Building
  // ============================================

  private buildEntryConditions(entities: ExtractedEntities): Condition[] {
    const conditions: Condition[] = []
    const entryConditions = entities.conditions.filter(c => c.type === 'entry')

    // Improved: Use ALL indicators, not just the first one
    if (entryConditions.length > 0 && entities.indicators.length > 0) {
      for (const condition of entryConditions) {
        // Try to match condition with related indicator
        const relatedIndicator = this.findRelatedIndicator(condition, entities.indicators)

        if (relatedIndicator) {
          conditions.push(this.buildCondition(condition, relatedIndicator))
        } else {
          // Fallback: use first indicator
          conditions.push(this.buildCondition(condition, entities.indicators[0]))
        }
      }
    }

    // If no explicit entry conditions but has indicators and buy action
    if (conditions.length === 0 && entities.indicators.length > 0 && entities.actions.some(a => a.type === 'buy')) {
      // Create default conditions for ALL indicators (Quant 2.0: multi-indicator)
      for (const indicator of entities.indicators) {
        const matchingCondition = entities.conditions.find(c =>
          this.isRelated(c, indicator)
        )

        if (matchingCondition) {
          conditions.push(this.buildCondition(matchingCondition, indicator))
        } else {
          // Default condition based on indicator
          conditions.push(this.buildDefaultCondition(indicator, 'entry'))
        }
      }
    }

    return conditions
  }

  /**
   * Find indicator related to a condition (Quant 2.0: intelligent matching)
   */
  private findRelatedIndicator(
    condition: ConditionEntity,
    indicators: IndicatorEntity[]
  ): IndicatorEntity | undefined {
    // Try to find indicator mentioned in condition's original text
    for (const indicator of indicators) {
      if (condition.original.toLowerCase().includes(indicator.type.toLowerCase())) {
        return indicator
      }
    }

    // Return first indicator as fallback
    return indicators[0]
  }

  /**
   * Check if condition is related to indicator
   */
  private isRelated(condition: ConditionEntity, indicator: IndicatorEntity): boolean {
    const conditionText = condition.original.toLowerCase()
    const indicatorType = indicator.type.toLowerCase()

    return conditionText.includes(indicatorType)
  }

  private buildExitConditions(entities: ExtractedEntities): Condition[] {
    const conditions: Condition[] = []
    const exitConditions = entities.conditions.filter(c => c.type === 'exit')

    for (const condition of exitConditions) {
      const indicator = entities.indicators[0]
      if (indicator) {
        conditions.push(this.buildCondition(condition, indicator))
      }
    }

    // If no explicit exit conditions, create from inverse of entry
    if (conditions.length === 0 && entities.indicators.length > 0) {
      const indicator = entities.indicators[0]
      conditions.push(this.buildDefaultCondition(indicator, 'exit'))
    }

    return conditions
  }

  private buildCondition(condition: ConditionEntity, indicator: IndicatorEntity): Condition {
    const operatorMap: Record<string, Condition['operator']> = {
      'greater_than': 'gt',
      'less_than': 'lt',
      'equals': 'eq',
      'crosses_above': 'crosses_above',
      'crosses_below': 'crosses_below',
    }

    return {
      id: generateId('cond'),
      indicator: indicator.type,
      operator: operatorMap[condition.operator] || 'gt',
      value: condition.value,
      params: indicator.params,
    }
  }

  private buildDefaultCondition(indicator: IndicatorEntity, type: 'entry' | 'exit'): Condition {
    // Default conditions based on indicator type
    const defaults: Record<string, { entry: Partial<Condition>; exit: Partial<Condition> }> = {
      rsi: {
        entry: { operator: 'lt', value: 30 },
        exit: { operator: 'gt', value: 70 },
      },
      sma: {
        entry: { operator: 'crosses_above', value: 'price' },
        exit: { operator: 'crosses_below', value: 'price' },
      },
      ema: {
        entry: { operator: 'crosses_above', value: 'price' },
        exit: { operator: 'crosses_below', value: 'price' },
      },
      macd: {
        entry: { operator: 'crosses_above', value: 0 },
        exit: { operator: 'crosses_below', value: 0 },
      },
      bollinger: {
        entry: { operator: 'lt', value: 'lower' },
        exit: { operator: 'gt', value: 'upper' },
      },
      stochastic: {
        entry: { operator: 'lt', value: 20 },
        exit: { operator: 'gt', value: 80 },
      },
    }

    const defaultConfig = defaults[indicator.type] || { entry: { operator: 'gt', value: 0 }, exit: { operator: 'lt', value: 0 } }
    const config = type === 'entry' ? defaultConfig.entry : defaultConfig.exit

    return {
      id: generateId('cond'),
      indicator: indicator.type,
      operator: config.operator as Condition['operator'],
      value: config.value as number | string,
      params: indicator.params,
    }
  }

  // ============================================
  // Risk Management (Quant 2.0: Dynamic & Data-Driven)
  // ============================================

  private buildRiskManagement(entities: ExtractedEntities, symbol: string): RiskManagement {
    const risk: RiskManagement = {}

    // Extract user-specified values
    const stopLoss = entities.percentages.find(p => p.context === 'stop_loss')
    const takeProfit = entities.percentages.find(p => p.context === 'take_profit')

    if (stopLoss) {
      risk.stopLoss = stopLoss.value
    }

    if (takeProfit) {
      risk.takeProfit = takeProfit.value
    }

    // Quant 2.0: Dynamic calculation based on volatility if not specified
    if (!risk.stopLoss || !risk.takeProfit) {
      const dynamicRisk = riskProfiler.calculateDynamicRisk(
        symbol,
        this.userProfile,
        '1d'
      )

      // Use dynamic values only if user didn't specify
      if (!risk.stopLoss) {
        risk.stopLoss = dynamicRisk.stopLoss
        console.log(
          `[StrategyBuilder] Dynamic stop loss calculated for ${symbol}: ${dynamicRisk.stopLoss}% (based on volatility)`
        )
      }

      if (!risk.takeProfit) {
        risk.takeProfit = dynamicRisk.takeProfit
        console.log(
          `[StrategyBuilder] Dynamic take profit calculated for ${symbol}: ${dynamicRisk.takeProfit}% (risk/reward ratio)`
        )
      }
    }

    // Validate with legal compliance
    const compliance = LegalCompliance.assessStrategyRisk({
      stopLoss: risk.stopLoss,
      leverage: entities.indicators.some(i => i.type === 'leverage') ? 5 : undefined,
      positionSize: this.extractPositionSize(entities),
      indicators: entities.indicators.map(i => i.type),
    })

    // Log risk warnings
    if (compliance.warnings.length > 0) {
      console.warn('[StrategyBuilder] Risk warnings:', compliance.warnings)
    }

    return risk
  }

  // ============================================
  // Validation
  // ============================================

  private validate(
    strategy: Partial<Strategy>,
    config: Partial<StrategyConfig>,
    entities: ExtractedEntities
  ): ValidationResult {
    const errors: ValidationResult['errors'] = []
    const warnings: ValidationResult['warnings'] = []

    // Check required fields
    if (!config.symbols || config.symbols.length === 0) {
      errors.push({
        code: 'MISSING_SYMBOL',
        message: '거래 심볼이 지정되지 않았습니다.',
        field: 'symbols',
      })
    }

    if (!config.entryConditions || config.entryConditions.length === 0) {
      errors.push({
        code: 'MISSING_ENTRY',
        message: '진입 조건이 지정되지 않았습니다.',
        field: 'entryConditions',
      })
    }

    // Warnings
    if (!config.riskManagement?.stopLoss) {
      warnings.push({
        code: 'NO_STOP_LOSS',
        message: '손절가가 설정되지 않았습니다.',
        suggestion: '손절가 5%를 기본값으로 추가할 수 있습니다.',
      })
    }

    if (!config.riskManagement?.takeProfit) {
      warnings.push({
        code: 'NO_TAKE_PROFIT',
        message: '익절가가 설정되지 않았습니다.',
        suggestion: '익절가를 설정하면 수익 실현이 자동화됩니다.',
      })
    }

    if (!config.exitConditions || config.exitConditions.length === 0) {
      warnings.push({
        code: 'NO_EXIT_CONDITION',
        message: '명시적 청산 조건이 없습니다.',
        suggestion: '손절/익절 외에 지표 기반 청산 조건을 추가해보세요.',
      })
    }

    // Check indicator validity
    if (entities.indicators.length > 0) {
      for (const indicator of entities.indicators) {
        if (indicator.params.period && indicator.params.period > 200) {
          warnings.push({
            code: 'LONG_PERIOD',
            message: `지표 기간(${indicator.params.period})이 길어 신호가 느릴 수 있습니다.`,
          })
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  // ============================================
  // Text Generation
  // ============================================

  private generateName(entities: ExtractedEntities): string {
    const parts: string[] = []

    // Symbol
    if (entities.symbols.length > 0) {
      parts.push(entities.symbols[0].value.split('/')[0])
    }

    // Indicator
    if (entities.indicators.length > 0) {
      const ind = entities.indicators[0]
      parts.push(ind.type.toUpperCase())
      if (ind.params.period) {
        parts[parts.length - 1] += `(${ind.params.period})`
      }
    }

    // Action
    if (entities.actions.some(a => a.type === 'buy')) {
      parts.push('매수')
    } else if (entities.actions.some(a => a.type === 'sell')) {
      parts.push('매도')
    }

    parts.push('전략')

    return parts.join(' ')
  }

  private generateDescription(intent: ParsedIntent): string {
    return `사용자 요청 "${intent.rawText}"을 기반으로 생성된 자동 트레이딩 전략입니다.`
  }

  private generateExplanation(
    strategy: Partial<Strategy>,
    config: Partial<StrategyConfig>,
    validation: ValidationResult
  ): string {
    const lines: string[] = []

    lines.push(`📊 **${strategy.name}**`)
    lines.push('')

    // Symbol & Timeframe
    lines.push(`**거래 대상:** ${config.symbols?.[0] || 'N/A'}`)
    lines.push(`**타임프레임:** ${config.timeframe || '1h'}`)
    lines.push('')

    // Entry conditions
    lines.push('**진입 조건:**')
    if (config.entryConditions && config.entryConditions.length > 0) {
      for (const cond of config.entryConditions) {
        lines.push(`- ${this.formatCondition(cond)}`)
      }
    } else {
      lines.push('- (설정 필요)')
    }
    lines.push('')

    // Exit conditions
    lines.push('**청산 조건:**')
    if (config.exitConditions && config.exitConditions.length > 0) {
      for (const cond of config.exitConditions) {
        lines.push(`- ${this.formatCondition(cond)}`)
      }
    }
    if (config.riskManagement?.stopLoss) {
      lines.push(`- 손절: ${config.riskManagement.stopLoss}%`)
    }
    if (config.riskManagement?.takeProfit) {
      lines.push(`- 익절: ${config.riskManagement.takeProfit}%`)
    }
    lines.push('')

    // Position size
    lines.push(`**포지션 크기:** 포트폴리오의 ${config.allocation || 10}%`)
    lines.push('')

    // Validation status
    if (!validation.isValid) {
      lines.push('⚠️ **주의:** 전략에 문제가 있습니다.')
      for (const error of validation.errors) {
        lines.push(`- ❌ ${error.message}`)
      }
    }

    if (validation.warnings.length > 0) {
      lines.push('')
      lines.push('💡 **권장 사항:**')
      for (const warning of validation.warnings) {
        lines.push(`- ${warning.message}`)
      }
    }

    return lines.join('\n')
  }

  private formatCondition(condition: Condition): string {
    const operatorMap: Record<string, string> = {
      'gt': '>',
      'gte': '>=',
      'lt': '<',
      'lte': '<=',
      'eq': '=',
      'crosses_above': '상향 돌파',
      'crosses_below': '하향 돌파',
    }

    const params = condition.params
      ? Object.entries(condition.params).map(([k, v]) => `${k}=${v}`).join(', ')
      : ''

    return `${condition.indicator.toUpperCase()}${params ? `(${params})` : ''} ${operatorMap[condition.operator] || condition.operator} ${condition.value}`
  }

  private generateSuggestions(validation: ValidationResult, entities: ExtractedEntities): string[] {
    const suggestions: string[] = []

    // Based on validation warnings
    for (const warning of validation.warnings) {
      if (warning.suggestion) {
        suggestions.push(warning.suggestion)
      }
    }

    // Based on entities
    if (entities.indicators.length === 1) {
      suggestions.push('여러 지표를 조합하면 신호의 정확도를 높일 수 있습니다.')
    }

    if (!entities.timeframes.length) {
      suggestions.push('타임프레임을 명시하면 더 정확한 전략을 생성할 수 있습니다.')
    }

    // General suggestions
    suggestions.push('백테스트를 실행하여 전략의 성과를 확인해보세요.')

    return suggestions
  }
}

// ============================================
// Factory Function
// ============================================

export function createStrategyBuilder(userProfile?: UserRiskProfile): StrategyBuilder {
  return new StrategyBuilder(userProfile)
}
