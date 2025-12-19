/**
 * @hephaitos/utils - Order Calculation Utilities
 * L1 (Molecules) - 주문 계산 유틸리티
 *
 * 포지션 사이징, 리스크 계산, 손익 계산 등
 */

import type {
  OrderSide,
  PositionSizingMethod,
  IRiskConfig,
  IOrderRequest,
} from '@hephaitos/types';

// ═══════════════════════════════════════════════════════════════
// 포지션 사이징
// ═══════════════════════════════════════════════════════════════

/**
 * 포지션 사이징 입력
 */
export interface IPositionSizeInput {
  /** 계정 자본금 */
  accountEquity: number;
  /** 현재 가격 */
  currentPrice: number;
  /** 손절가 */
  stopLossPrice: number;
  /** 사이징 방법 */
  method: PositionSizingMethod;
  /** 리스크 비율 (%) - percent_risk */
  riskPercent?: number;
  /** 고정 금액 - fixed_amount */
  fixedAmount?: number;
  /** 고정 수량 - fixed_quantity */
  fixedQuantity?: number;
  /** 자본금 비율 (%) - percent_equity */
  equityPercent?: number;
  /** 승률 (Kelly용) */
  winRate?: number;
  /** 평균 수익/손실 비율 (Kelly용) */
  avgWinLossRatio?: number;
  /** ATR (변동성 조정용) */
  atr?: number;
  /** ATR 배수 (변동성 조정용) */
  atrMultiplier?: number;
}

/**
 * 포지션 사이징 결과
 */
export interface IPositionSizeResult {
  /** 계산된 수량 */
  quantity: number;
  /** 포지션 금액 */
  positionValue: number;
  /** 리스크 금액 */
  riskAmount: number;
  /** 리스크 비율 (%) */
  riskPercent: number;
  /** 사용된 방법 */
  method: PositionSizingMethod;
}

/**
 * 포지션 크기 계산
 */
export function calculatePositionSize(
  input: IPositionSizeInput
): IPositionSizeResult {
  const { accountEquity, currentPrice, stopLossPrice, method } = input;

  // 리스크 거리 계산 (손절까지 거리)
  const riskPerUnit = Math.abs(currentPrice - stopLossPrice);

  let quantity = 0;
  let riskAmount = 0;

  switch (method) {
    case 'fixed_amount': {
      const amount = input.fixedAmount ?? 1000;
      quantity = amount / currentPrice;
      riskAmount = quantity * riskPerUnit;
      break;
    }

    case 'fixed_quantity': {
      quantity = input.fixedQuantity ?? 1;
      riskAmount = quantity * riskPerUnit;
      break;
    }

    case 'percent_equity': {
      const percent = input.equityPercent ?? 10;
      const amount = accountEquity * (percent / 100);
      quantity = amount / currentPrice;
      riskAmount = quantity * riskPerUnit;
      break;
    }

    case 'percent_risk': {
      const riskPercent = input.riskPercent ?? 2;
      riskAmount = accountEquity * (riskPercent / 100);
      quantity = riskPerUnit > 0 ? riskAmount / riskPerUnit : 0;
      break;
    }

    case 'kelly_criterion': {
      const winRate = input.winRate ?? 0.5;
      const avgRatio = input.avgWinLossRatio ?? 1.5;

      // Kelly formula: f* = (p * b - q) / b
      // where p = win probability, q = loss probability, b = win/loss ratio
      const kellyFraction = (winRate * avgRatio - (1 - winRate)) / avgRatio;

      // Half-Kelly for safety
      const adjustedFraction = Math.max(0, kellyFraction * 0.5);
      const amount = accountEquity * adjustedFraction;
      quantity = amount / currentPrice;
      riskAmount = quantity * riskPerUnit;
      break;
    }

    case 'volatility_adjusted': {
      const atr = input.atr ?? riskPerUnit;
      const atrMultiplier = input.atrMultiplier ?? 2;
      const riskPercent = input.riskPercent ?? 2;

      riskAmount = accountEquity * (riskPercent / 100);
      const adjustedRisk = atr * atrMultiplier;
      quantity = adjustedRisk > 0 ? riskAmount / adjustedRisk : 0;
      break;
    }
  }

  // 수량은 최소 0
  quantity = Math.max(0, quantity);

  const positionValue = quantity * currentPrice;
  const riskPercent = accountEquity > 0 ? (riskAmount / accountEquity) * 100 : 0;

  return {
    quantity,
    positionValue,
    riskAmount,
    riskPercent,
    method,
  };
}

// ═══════════════════════════════════════════════════════════════
// 마진 및 레버리지
// ═══════════════════════════════════════════════════════════════

/**
 * 필요 마진 계산
 */
export function calculateRequiredMargin(
  positionValue: number,
  leverage: number
): number {
  if (leverage <= 0) return positionValue;
  return positionValue / leverage;
}

/**
 * 현재 레버리지 계산
 */
export function calculateLeverage(
  positionValue: number,
  equity: number
): number {
  if (equity <= 0) return 0;
  return positionValue / equity;
}

/**
 * 청산가 계산
 */
export function calculateLiquidationPrice(
  entryPrice: number,
  leverage: number,
  side: OrderSide,
  maintenanceMarginRate: number = 0.5
): number {
  if (leverage <= 0) return 0;

  // 청산 = 마진 손실 100%
  const direction = side === 'buy' ? -1 : 1;
  const movePercent = (1 / leverage) * (1 - maintenanceMarginRate);

  return entryPrice * (1 + direction * movePercent);
}

// ═══════════════════════════════════════════════════════════════
// 손절/익절 계산
// ═══════════════════════════════════════════════════════════════

/**
 * 손절가 계산 (비율 기반)
 */
export function calculateStopLossPrice(
  entryPrice: number,
  side: OrderSide,
  stopLossPercent: number
): number {
  const direction = side === 'buy' ? -1 : 1;
  return entryPrice * (1 + direction * (stopLossPercent / 100));
}

/**
 * ATR 기반 손절가 계산
 */
export function calculateATRStopLoss(
  entryPrice: number,
  side: OrderSide,
  atr: number,
  multiplier: number = 2
): number {
  const distance = atr * multiplier;
  const direction = side === 'buy' ? -1 : 1;
  return entryPrice + direction * distance;
}

/**
 * 익절가 계산 (비율 기반)
 */
export function calculateTakeProfitPrice(
  entryPrice: number,
  side: OrderSide,
  takeProfitPercent: number
): number {
  const direction = side === 'buy' ? 1 : -1;
  return entryPrice * (1 + direction * (takeProfitPercent / 100));
}

/**
 * R:R 비율 기반 익절가 계산
 */
export function calculateTakeProfitByRR(
  entryPrice: number,
  stopLossPrice: number,
  side: OrderSide,
  rrRatio: number
): number {
  const riskDistance = Math.abs(entryPrice - stopLossPrice);
  const rewardDistance = riskDistance * rrRatio;
  const direction = side === 'buy' ? 1 : -1;
  return entryPrice + direction * rewardDistance;
}

/**
 * 추적 손절가 업데이트
 */
export function updateTrailingStopPrice(
  currentPrice: number,
  currentStopPrice: number,
  side: OrderSide,
  trailingPercent: number
): number {
  const direction = side === 'buy' ? -1 : 1;
  const newStopPrice = currentPrice * (1 + direction * (trailingPercent / 100));

  if (side === 'buy') {
    // 롱: 손절가는 올라만 간다
    return Math.max(currentStopPrice, newStopPrice);
  } else {
    // 숏: 손절가는 내려만 간다
    return Math.min(currentStopPrice, newStopPrice);
  }
}

// ═══════════════════════════════════════════════════════════════
// 손익 계산
// ═══════════════════════════════════════════════════════════════

/**
 * 손익 계산
 */
export function calculatePnL(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  side: OrderSide
): number {
  const direction = side === 'buy' ? 1 : -1;
  return direction * (exitPrice - entryPrice) * quantity;
}

/**
 * 손익률 계산 (%)
 */
export function calculatePnLPercent(
  entryPrice: number,
  exitPrice: number,
  side: OrderSide
): number {
  if (entryPrice === 0) return 0;
  const direction = side === 'buy' ? 1 : -1;
  return direction * ((exitPrice - entryPrice) / entryPrice) * 100;
}

/**
 * 미실현 손익 계산
 */
export function calculateUnrealizedPnL(
  entryPrice: number,
  currentPrice: number,
  quantity: number,
  side: OrderSide
): { pnl: number; pnlPercent: number } {
  const pnl = calculatePnL(entryPrice, currentPrice, quantity, side);
  const pnlPercent = calculatePnLPercent(entryPrice, currentPrice, side);
  return { pnl, pnlPercent };
}

/**
 * 평균 진입가 계산 (추가 매수/매도 시)
 */
export function calculateAvgEntryPrice(
  existingQuantity: number,
  existingAvgPrice: number,
  newQuantity: number,
  newPrice: number
): number {
  const totalQuantity = existingQuantity + newQuantity;
  if (totalQuantity === 0) return 0;

  const totalValue =
    existingQuantity * existingAvgPrice + newQuantity * newPrice;
  return totalValue / totalQuantity;
}

// ═══════════════════════════════════════════════════════════════
// 리스크 계산
// ═══════════════════════════════════════════════════════════════

/**
 * R:R 비율 계산
 */
export function calculateRiskRewardRatio(
  entryPrice: number,
  stopLossPrice: number,
  takeProfitPrice: number
): number {
  const risk = Math.abs(entryPrice - stopLossPrice);
  const reward = Math.abs(takeProfitPrice - entryPrice);

  if (risk === 0) return 0;
  return reward / risk;
}

/**
 * R 단위 손익 계산 (현재 손익이 몇 R인지)
 */
export function calculateRMultiple(
  entryPrice: number,
  stopLossPrice: number,
  currentPrice: number,
  side: OrderSide
): number {
  const riskPerUnit = Math.abs(entryPrice - stopLossPrice);
  if (riskPerUnit === 0) return 0;

  const direction = side === 'buy' ? 1 : -1;
  const pnlPerUnit = direction * (currentPrice - entryPrice);

  return pnlPerUnit / riskPerUnit;
}

// ═══════════════════════════════════════════════════════════════
// 주문 검증
// ═══════════════════════════════════════════════════════════════

/**
 * 주문 검증 결과
 */
export interface IOrderValidation {
  /** 유효 여부 */
  valid: boolean;
  /** 오류 목록 */
  errors: string[];
  /** 경고 목록 */
  warnings: string[];
}

/**
 * 주문 유효성 검증
 */
export function validateOrder(
  request: IOrderRequest,
  riskConfig: IRiskConfig,
  currentPrice: number,
  currentEquity: number,
  openPositionCount: number
): IOrderValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 기본 검증
  if (!request.symbol || request.symbol.trim() === '') {
    errors.push('심볼이 지정되지 않았습니다');
  }

  if (request.quantity <= 0) {
    errors.push('수량은 0보다 커야 합니다');
  }

  // 가격 검증
  if (request.type === 'limit' || request.type === 'stop_limit') {
    if (!request.price || request.price <= 0) {
      errors.push('지정가 주문에는 가격이 필요합니다');
    }
  }

  if (request.type === 'stop' || request.type === 'stop_limit') {
    if (!request.stopPrice || request.stopPrice <= 0) {
      errors.push('스탑 주문에는 트리거 가격이 필요합니다');
    }
  }

  // 포지션 크기 검증
  const positionValue = request.quantity * currentPrice;
  const positionPercent = (positionValue / currentEquity) * 100;

  if (positionPercent > riskConfig.maxPositionSize) {
    errors.push(
      `포지션 크기(${positionPercent.toFixed(1)}%)가 최대 허용치(${riskConfig.maxPositionSize}%)를 초과합니다`
    );
  }

  // 동시 포지션 수 검증
  if (openPositionCount >= riskConfig.maxOpenPositions) {
    errors.push(
      `최대 동시 포지션 수(${riskConfig.maxOpenPositions})에 도달했습니다`
    );
  }

  // 리스크 검증 (손절가가 있는 경우)
  if (request.stopLoss?.price) {
    const stopLossPrice = request.stopLoss.price;
    const riskPerUnit = Math.abs(currentPrice - stopLossPrice);
    const riskAmount = riskPerUnit * request.quantity;
    const riskPercent = (riskAmount / currentEquity) * 100;

    if (riskPercent > riskConfig.maxRiskPerTrade) {
      errors.push(
        `거래당 리스크(${riskPercent.toFixed(1)}%)가 최대 허용치(${riskConfig.maxRiskPerTrade}%)를 초과합니다`
      );
    }
  } else {
    warnings.push('손절가가 설정되지 않았습니다');
  }

  // 손절가 방향 검증
  if (request.stopLoss?.price) {
    const isLong = request.side === 'buy';
    const slPrice = request.stopLoss.price;

    if (isLong && slPrice >= currentPrice) {
      errors.push('롱 포지션의 손절가는 현재가보다 낮아야 합니다');
    }
    if (!isLong && slPrice <= currentPrice) {
      errors.push('숏 포지션의 손절가는 현재가보다 높아야 합니다');
    }
  }

  // 익절가 방향 검증
  if (request.takeProfit?.price) {
    const isLong = request.side === 'buy';
    const tpPrice = request.takeProfit.price;

    if (isLong && tpPrice <= currentPrice) {
      errors.push('롱 포지션의 익절가는 현재가보다 높아야 합니다');
    }
    if (!isLong && tpPrice >= currentPrice) {
      errors.push('숏 포지션의 익절가는 현재가보다 낮아야 합니다');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════════
// 슬리피지 계산
// ═══════════════════════════════════════════════════════════════

/**
 * 슬리피지 시뮬레이션
 */
export function simulateSlippage(
  requestedPrice: number,
  side: OrderSide,
  slippagePercent: number,
  volatilityMultiplier: number = 1
): number {
  // 슬리피지는 불리한 방향으로 발생
  const direction = side === 'buy' ? 1 : -1;
  const adjustedSlippage = slippagePercent * volatilityMultiplier;

  // 랜덤 요소 추가 (0 ~ 슬리피지)
  const randomFactor = Math.random();
  const actualSlippage = adjustedSlippage * randomFactor;

  return requestedPrice * (1 + direction * (actualSlippage / 100));
}

/**
 * 실제 슬리피지 계산
 */
export function calculateSlippage(
  requestedPrice: number,
  executedPrice: number
): { slippage: number; slippagePercent: number } {
  const slippage = Math.abs(executedPrice - requestedPrice);
  const slippagePercent =
    requestedPrice > 0 ? (slippage / requestedPrice) * 100 : 0;

  return { slippage, slippagePercent };
}
