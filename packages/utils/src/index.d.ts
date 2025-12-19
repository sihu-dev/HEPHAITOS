/**
 * @hephaitos/utils - L1 유틸리티 함수 (Molecules)
 *
 * HEPHAITOS 트레이딩 플랫폼용 순수 함수 기반 유틸리티 모음
 * 부작용 없이 입력에서 출력을 생성
 */
export { normalizeBalance, calculateTotalValue, sortByValue, filterDust, } from './balance.js';
export { calculateAssetPnL, calculatePortfolioPnL, calculateSnapshotReturn, calculatePeriodReturns, calculateSharpeRatio, calculateMaxDrawdown, type IPnLResult, type IPeriodReturn, } from './pnl.js';
export { validateApiKey, isValidSymbol, isValidAmount, isValidUUID, isValidTimestamp, isValidEmail, validatePortfolioName, validateRequiredFields, type IValidationResult, } from './validation.js';
export { calculateTotalReturn, calculateAnnualizedReturn, calculateDailyReturns, calculateSharpeRatio as calculateBacktestSharpe, calculateSortinoRatio, calculateCalmarRatio, calculateDrawdownSeries, calculateMaxDrawdown as calculateBacktestMaxDrawdown, calculateAvgDrawdown, extractDrawdownRecords, calculateWinRate, calculateProfitFactor, calculateAvgWinLoss, calculateConsecutiveWinsLosses, calculateExpectancy, calculateAvgHoldingPeriod, calculateMonthlyReturns, calculatePerformanceMetrics, } from './backtest-calc.js';
export { calculateSMA, calculateEMA, calculateRSI, calculateMACD, calculateBollingerBands, calculateATR, getIndicatorValues, evaluateComparison, evaluateCondition, evaluateConditionGroup, detectEntrySignal, detectExitSignal, } from './signal-detector.js';
export { calculatePositionSize, calculateRequiredMargin, calculateLeverage, calculateLiquidationPrice, calculateStopLossPrice, calculateATRStopLoss, calculateTakeProfitPrice, calculateTakeProfitByRR, updateTrailingStopPrice, calculatePnL, calculatePnLPercent, calculateUnrealizedPnL, calculateAvgEntryPrice, calculateRiskRewardRatio, calculateRMultiple, validateOrder, simulateSlippage, calculateSlippage, type IPositionSizeInput, type IPositionSizeResult, type IOrderValidation, } from './order-calc.js';
//# sourceMappingURL=index.d.ts.map