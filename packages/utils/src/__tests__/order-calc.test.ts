/**
 * @hephaitos/utils - Order Calculation Tests
 * L1 (Molecules) - 주문 계산 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import type { OrderSide, IOrderRequest, IRiskConfig } from '@hephaitos/types';
import {
  calculatePositionSize,
  calculateRequiredMargin,
  calculateLeverage,
  calculateLiquidationPrice,
  calculateStopLossPrice,
  calculateATRStopLoss,
  calculateTakeProfitPrice,
  calculateTakeProfitByRR,
  updateTrailingStopPrice,
  calculatePnL,
  calculatePnLPercent,
  calculateUnrealizedPnL,
  calculateAvgEntryPrice,
  calculateRiskRewardRatio,
  calculateRMultiple,
  validateOrder,
  simulateSlippage,
  calculateSlippage,
} from '../order-calc';

// ═══════════════════════════════════════════════════════════════
// Position Sizing Tests
// ═══════════════════════════════════════════════════════════════

describe('calculatePositionSize', () => {
  const accountEquity = 10000;
  const currentPrice = 100;
  const stopLossPrice = 95;

  it('should calculate fixed_amount position size', () => {
    const result = calculatePositionSize({
      accountEquity,
      currentPrice,
      stopLossPrice,
      method: 'fixed_amount',
      fixedAmount: 1000,
    });

    expect(result.quantity).toBe(10); // 1000 / 100
    expect(result.positionValue).toBe(1000);
    expect(result.riskAmount).toBe(50); // 10 * 5
    expect(result.riskPercent).toBe(0.5); // (50 / 10000) * 100
    expect(result.method).toBe('fixed_amount');
  });

  it('should calculate fixed_quantity position size', () => {
    const result = calculatePositionSize({
      accountEquity,
      currentPrice,
      stopLossPrice,
      method: 'fixed_quantity',
      fixedQuantity: 5,
    });

    expect(result.quantity).toBe(5);
    expect(result.positionValue).toBe(500);
    expect(result.riskAmount).toBe(25); // 5 * 5
    expect(result.riskPercent).toBe(0.25);
  });

  it('should calculate percent_equity position size', () => {
    const result = calculatePositionSize({
      accountEquity,
      currentPrice,
      stopLossPrice,
      method: 'percent_equity',
      equityPercent: 20,
    });

    expect(result.quantity).toBe(20); // (10000 * 0.2) / 100
    expect(result.positionValue).toBe(2000);
    expect(result.riskAmount).toBe(100); // 20 * 5
    expect(result.riskPercent).toBe(1);
  });

  it('should calculate percent_risk position size', () => {
    const result = calculatePositionSize({
      accountEquity,
      currentPrice,
      stopLossPrice,
      method: 'percent_risk',
      riskPercent: 2,
    });

    const expectedRiskAmount = 200; // 10000 * 0.02
    const expectedQuantity = 40; // 200 / 5
    expect(result.quantity).toBe(expectedQuantity);
    expect(result.riskAmount).toBe(expectedRiskAmount);
    expect(result.riskPercent).toBe(2);
  });

  it('should calculate kelly_criterion position size', () => {
    const result = calculatePositionSize({
      accountEquity,
      currentPrice,
      stopLossPrice,
      method: 'kelly_criterion',
      winRate: 0.6,
      avgWinLossRatio: 2,
    });

    // Kelly: (0.6 * 2 - 0.4) / 2 = 0.4
    // Half-Kelly: 0.4 * 0.5 = 0.2
    const expectedAmount = 2000; // 10000 * 0.2
    const expectedQuantity = 20; // 2000 / 100
    expect(result.quantity).toBeCloseTo(expectedQuantity, 10);
    expect(result.positionValue).toBeCloseTo(2000, 10);
  });

  it('should calculate volatility_adjusted position size', () => {
    const result = calculatePositionSize({
      accountEquity,
      currentPrice,
      stopLossPrice,
      method: 'volatility_adjusted',
      atr: 3,
      atrMultiplier: 2,
      riskPercent: 2,
    });

    const expectedRiskAmount = 200; // 10000 * 0.02
    const adjustedRisk = 6; // 3 * 2
    const expectedQuantity = 33.333333333333336; // 200 / 6
    expect(result.quantity).toBeCloseTo(expectedQuantity, 5);
  });

  it('should handle zero risk distance (stop loss = entry)', () => {
    const result = calculatePositionSize({
      accountEquity,
      currentPrice: 100,
      stopLossPrice: 100,
      method: 'percent_risk',
      riskPercent: 2,
    });

    expect(result.quantity).toBe(0);
  });

  it('should never return negative quantity', () => {
    const result = calculatePositionSize({
      accountEquity: -1000, // negative equity
      currentPrice,
      stopLossPrice,
      method: 'fixed_quantity',
      fixedQuantity: 5,
    });

    expect(result.quantity).toBeGreaterThanOrEqual(0);
  });

  it('should handle very large numbers', () => {
    const result = calculatePositionSize({
      accountEquity: 1000000,
      currentPrice: 50000,
      stopLossPrice: 49000,
      method: 'percent_risk',
      riskPercent: 1,
    });

    const expectedRiskAmount = 10000;
    const expectedQuantity = 10; // 10000 / 1000
    expect(result.quantity).toBe(expectedQuantity);
    expect(result.riskAmount).toBe(expectedRiskAmount);
  });
});

// ═══════════════════════════════════════════════════════════════
// Margin & Leverage Tests
// ═══════════════════════════════════════════════════════════════

describe('calculateRequiredMargin', () => {
  it('should calculate required margin with leverage', () => {
    const margin = calculateRequiredMargin(10000, 10);
    expect(margin).toBe(1000);
  });

  it('should return full position value with leverage 1', () => {
    const margin = calculateRequiredMargin(10000, 1);
    expect(margin).toBe(10000);
  });

  it('should return full position value with zero or negative leverage', () => {
    expect(calculateRequiredMargin(10000, 0)).toBe(10000);
    expect(calculateRequiredMargin(10000, -5)).toBe(10000);
  });

  it('should handle very high leverage', () => {
    const margin = calculateRequiredMargin(100000, 100);
    expect(margin).toBe(1000);
  });
});

describe('calculateLeverage', () => {
  it('should calculate current leverage', () => {
    const leverage = calculateLeverage(20000, 10000);
    expect(leverage).toBe(2);
  });

  it('should return 1x with equal position and equity', () => {
    const leverage = calculateLeverage(10000, 10000);
    expect(leverage).toBe(1);
  });

  it('should return 0 with zero equity', () => {
    const leverage = calculateLeverage(10000, 0);
    expect(leverage).toBe(0);
  });

  it('should return 0 with negative equity', () => {
    const leverage = calculateLeverage(10000, -1000);
    expect(leverage).toBe(0);
  });
});

describe('calculateLiquidationPrice', () => {
  it('should calculate liquidation price for long position', () => {
    const liqPrice = calculateLiquidationPrice(100, 10, 'buy', 0.5);
    // Move: (1/10) * (1 - 0.5) = 0.05 = 5%
    // Long liquidation: 100 * (1 - 0.05) = 95
    expect(liqPrice).toBe(95);
  });

  it('should calculate liquidation price for short position', () => {
    const liqPrice = calculateLiquidationPrice(100, 10, 'sell', 0.5);
    // Short liquidation: 100 * (1 + 0.05) = 105
    expect(liqPrice).toBe(105);
  });

  it('should return 0 for zero or negative leverage', () => {
    expect(calculateLiquidationPrice(100, 0, 'buy')).toBe(0);
    expect(calculateLiquidationPrice(100, -5, 'buy')).toBe(0);
  });

  it('should handle different maintenance margin rates', () => {
    const liqPrice1 = calculateLiquidationPrice(100, 10, 'buy', 0);
    const liqPrice2 = calculateLiquidationPrice(100, 10, 'buy', 1);

    expect(liqPrice1).toBe(90); // (1/10) * 1 = 10%
    expect(liqPrice2).toBe(100); // (1/10) * 0 = 0%
  });
});

// ═══════════════════════════════════════════════════════════════
// Stop Loss / Take Profit Tests
// ═══════════════════════════════════════════════════════════════

describe('calculateStopLossPrice', () => {
  it('should calculate stop loss for long position', () => {
    const slPrice = calculateStopLossPrice(100, 'buy', 5);
    expect(slPrice).toBe(95); // 100 * (1 - 0.05)
  });

  it('should calculate stop loss for short position', () => {
    const slPrice = calculateStopLossPrice(100, 'sell', 5);
    expect(slPrice).toBe(105); // 100 * (1 + 0.05)
  });

  it('should handle zero stop loss percent', () => {
    const slPrice = calculateStopLossPrice(100, 'buy', 0);
    expect(slPrice).toBe(100);
  });

  it('should handle large stop loss percent', () => {
    const slPrice = calculateStopLossPrice(100, 'buy', 50);
    expect(slPrice).toBe(50);
  });
});

describe('calculateATRStopLoss', () => {
  it('should calculate ATR-based stop loss for long', () => {
    const slPrice = calculateATRStopLoss(100, 'buy', 2, 2);
    expect(slPrice).toBe(96); // 100 - (2 * 2)
  });

  it('should calculate ATR-based stop loss for short', () => {
    const slPrice = calculateATRStopLoss(100, 'sell', 2, 2);
    expect(slPrice).toBe(104); // 100 + (2 * 2)
  });

  it('should use default multiplier of 2', () => {
    const slPrice = calculateATRStopLoss(100, 'buy', 3);
    expect(slPrice).toBe(94); // 100 - (3 * 2)
  });
});

describe('calculateTakeProfitPrice', () => {
  it('should calculate take profit for long position', () => {
    const tpPrice = calculateTakeProfitPrice(100, 'buy', 10);
    expect(tpPrice).toBeCloseTo(110, 10); // 100 * (1 + 0.1)
  });

  it('should calculate take profit for short position', () => {
    const tpPrice = calculateTakeProfitPrice(100, 'sell', 10);
    expect(tpPrice).toBeCloseTo(90, 10); // 100 * (1 - 0.1)
  });
});

describe('calculateTakeProfitByRR', () => {
  it('should calculate take profit with 2:1 R:R for long', () => {
    const tpPrice = calculateTakeProfitByRR(100, 95, 'buy', 2);
    // Risk: 5, Reward: 10, TP: 100 + 10 = 110
    expect(tpPrice).toBe(110);
  });

  it('should calculate take profit with 3:1 R:R for short', () => {
    const tpPrice = calculateTakeProfitByRR(100, 105, 'sell', 3);
    // Risk: 5, Reward: 15, TP: 100 - 15 = 85
    expect(tpPrice).toBe(85);
  });

  it('should handle fractional R:R ratios', () => {
    const tpPrice = calculateTakeProfitByRR(100, 98, 'buy', 1.5);
    // Risk: 2, Reward: 3, TP: 100 + 3 = 103
    expect(tpPrice).toBe(103);
  });
});

describe('updateTrailingStopPrice', () => {
  it('should update trailing stop for long when price rises', () => {
    const newStop = updateTrailingStopPrice(110, 95, 'buy', 5);
    // New stop: 110 * (1 - 0.05) = 104.5
    expect(newStop).toBe(104.5);
  });

  it('should not lower trailing stop for long when price falls', () => {
    const newStop = updateTrailingStopPrice(90, 95, 'buy', 5);
    // Price fell, keep current stop
    expect(newStop).toBe(95);
  });

  it('should update trailing stop for short when price falls', () => {
    const newStop = updateTrailingStopPrice(90, 105, 'sell', 5);
    // New stop: 90 * (1 + 0.05) = 94.5
    expect(newStop).toBe(94.5);
  });

  it('should not raise trailing stop for short when price rises', () => {
    const newStop = updateTrailingStopPrice(110, 105, 'sell', 5);
    // Price rose, keep current stop
    expect(newStop).toBe(105);
  });
});

// ═══════════════════════════════════════════════════════════════
// PnL Tests
// ═══════════════════════════════════════════════════════════════

describe('calculatePnL', () => {
  it('should calculate profit for long position', () => {
    const pnl = calculatePnL(100, 110, 10, 'buy');
    expect(pnl).toBe(100); // (110 - 100) * 10
  });

  it('should calculate loss for long position', () => {
    const pnl = calculatePnL(100, 90, 10, 'buy');
    expect(pnl).toBe(-100); // (90 - 100) * 10
  });

  it('should calculate profit for short position', () => {
    const pnl = calculatePnL(100, 90, 10, 'sell');
    expect(pnl).toBe(100); // -(90 - 100) * 10
  });

  it('should calculate loss for short position', () => {
    const pnl = calculatePnL(100, 110, 10, 'sell');
    expect(pnl).toBe(-100); // -(110 - 100) * 10
  });

  it('should return zero for no price change', () => {
    expect(Math.abs(calculatePnL(100, 100, 10, 'buy'))).toBe(0);
    expect(Math.abs(calculatePnL(100, 100, 10, 'sell'))).toBe(0);
  });

  it('should handle fractional quantities', () => {
    const pnl = calculatePnL(100, 105, 1.5, 'buy');
    expect(pnl).toBe(7.5);
  });
});

describe('calculatePnLPercent', () => {
  it('should calculate profit percentage for long', () => {
    const pnlPercent = calculatePnLPercent(100, 110, 'buy');
    expect(pnlPercent).toBe(10);
  });

  it('should calculate loss percentage for long', () => {
    const pnlPercent = calculatePnLPercent(100, 95, 'buy');
    expect(pnlPercent).toBe(-5);
  });

  it('should calculate profit percentage for short', () => {
    const pnlPercent = calculatePnLPercent(100, 90, 'sell');
    expect(pnlPercent).toBe(10);
  });

  it('should calculate loss percentage for short', () => {
    const pnlPercent = calculatePnLPercent(100, 105, 'sell');
    expect(pnlPercent).toBe(-5);
  });

  it('should return 0 for zero entry price', () => {
    expect(calculatePnLPercent(0, 100, 'buy')).toBe(0);
  });
});

describe('calculateUnrealizedPnL', () => {
  it('should calculate unrealized PnL and percentage', () => {
    const result = calculateUnrealizedPnL(100, 110, 10, 'buy');
    expect(result.pnl).toBe(100);
    expect(result.pnlPercent).toBe(10);
  });

  it('should handle short positions', () => {
    const result = calculateUnrealizedPnL(100, 90, 10, 'sell');
    expect(result.pnl).toBe(100);
    expect(result.pnlPercent).toBe(10);
  });
});

describe('calculateAvgEntryPrice', () => {
  it('should calculate average entry price for adding to position', () => {
    const avgPrice = calculateAvgEntryPrice(10, 100, 5, 110);
    // (10 * 100 + 5 * 110) / 15 = 1550 / 15 = 103.333...
    expect(avgPrice).toBeCloseTo(103.333, 2);
  });

  it('should return new price for first entry', () => {
    const avgPrice = calculateAvgEntryPrice(0, 0, 10, 100);
    expect(avgPrice).toBe(100);
  });

  it('should return 0 for zero total quantity', () => {
    const avgPrice = calculateAvgEntryPrice(5, 100, -5, 90);
    expect(avgPrice).toBe(0);
  });

  it('should handle equal quantities at different prices', () => {
    const avgPrice = calculateAvgEntryPrice(10, 100, 10, 120);
    expect(avgPrice).toBe(110);
  });
});

// ═══════════════════════════════════════════════════════════════
// Risk Calculation Tests
// ═══════════════════════════════════════════════════════════════

describe('calculateRiskRewardRatio', () => {
  it('should calculate R:R ratio correctly', () => {
    const rr = calculateRiskRewardRatio(100, 95, 110);
    // Risk: 5, Reward: 10, R:R = 10/5 = 2
    expect(rr).toBe(2);
  });

  it('should return 0 for zero risk', () => {
    const rr = calculateRiskRewardRatio(100, 100, 110);
    expect(rr).toBe(0);
  });

  it('should handle fractional R:R ratios', () => {
    const rr = calculateRiskRewardRatio(100, 95, 103);
    // Risk: 5, Reward: 3, R:R = 3/5 = 0.6
    expect(rr).toBe(0.6);
  });

  it('should handle short positions', () => {
    const rr = calculateRiskRewardRatio(100, 105, 90);
    // Risk: 5, Reward: 10, R:R = 10/5 = 2
    expect(rr).toBe(2);
  });
});

describe('calculateRMultiple', () => {
  it('should calculate positive R for winning long', () => {
    const r = calculateRMultiple(100, 95, 110, 'buy');
    // Risk: 5, Current profit: 10, R = 10/5 = 2
    expect(r).toBe(2);
  });

  it('should calculate negative R for losing long', () => {
    const r = calculateRMultiple(100, 95, 90, 'buy');
    // Risk: 5, Current loss: -10, R = -10/5 = -2
    expect(r).toBe(-2);
  });

  it('should calculate 0 R at entry price', () => {
    const r = calculateRMultiple(100, 95, 100, 'buy');
    expect(r).toBe(0);
  });

  it('should calculate -1 R at stop loss', () => {
    const r = calculateRMultiple(100, 95, 95, 'buy');
    expect(r).toBe(-1);
  });

  it('should handle short positions', () => {
    const r = calculateRMultiple(100, 105, 90, 'sell');
    // Risk: 5, Profit: 10, R = 10/5 = 2
    expect(r).toBe(2);
  });

  it('should return 0 for zero risk', () => {
    const r = calculateRMultiple(100, 100, 110, 'buy');
    expect(r).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// Order Validation Tests
// ═══════════════════════════════════════════════════════════════

describe('validateOrder', () => {
  const riskConfig: IRiskConfig = {
    accountEquity: 10000,
    sizingMethod: 'percent_risk',
    maxRiskPerTrade: 2,
    maxPositionSize: 20,
    maxOpenPositions: 5,
    dailyLossLimit: 5,
    dailyTradeLimit: 10,
    defaultLeverage: 1,
    maxLeverage: 3,
    defaultStopLossPercent: 2,
    defaultTakeProfitPercent: 4,
  };

  it('should validate a correct order', () => {
    const request: IOrderRequest = {
      symbol: 'AAPL',
      side: 'buy',
      type: 'limit',
      quantity: 10,
      price: 100,
      stopLoss: { type: 'fixed_price', price: 95 },
    };

    const result = validateOrder(request, riskConfig, 100, 10000, 0);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject order with empty symbol', () => {
    const request: IOrderRequest = {
      symbol: '',
      side: 'buy',
      type: 'market',
      quantity: 10,
    };

    const result = validateOrder(request, riskConfig, 100, 10000, 0);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('심볼이 지정되지 않았습니다');
  });

  it('should reject order with zero or negative quantity', () => {
    const request: IOrderRequest = {
      symbol: 'AAPL',
      side: 'buy',
      type: 'market',
      quantity: 0,
    };

    const result = validateOrder(request, riskConfig, 100, 10000, 0);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('수량은 0보다 커야 합니다');
  });

  it('should reject limit order without price', () => {
    const request: IOrderRequest = {
      symbol: 'AAPL',
      side: 'buy',
      type: 'limit',
      quantity: 10,
    };

    const result = validateOrder(request, riskConfig, 100, 10000, 0);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('지정가 주문에는 가격이 필요합니다');
  });

  it('should reject order exceeding max position size', () => {
    const request: IOrderRequest = {
      symbol: 'AAPL',
      side: 'buy',
      type: 'market',
      quantity: 30, // 30 * 100 = 3000 = 30% of 10000
    };

    const result = validateOrder(request, riskConfig, 100, 10000, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('포지션 크기'))).toBe(true);
  });

  it('should reject order when max open positions reached', () => {
    const request: IOrderRequest = {
      symbol: 'AAPL',
      side: 'buy',
      type: 'market',
      quantity: 10,
    };

    const result = validateOrder(request, riskConfig, 100, 10000, 5);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('최대 동시 포지션'))).toBe(true);
  });

  it('should reject order exceeding max risk per trade', () => {
    const request: IOrderRequest = {
      symbol: 'AAPL',
      side: 'buy',
      type: 'market',
      quantity: 100, // Large quantity
      stopLoss: { type: 'fixed_price', price: 90 }, // 10% risk
    };

    const result = validateOrder(request, riskConfig, 100, 10000, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('거래당 리스크'))).toBe(true);
  });

  it('should warn when no stop loss is set', () => {
    const request: IOrderRequest = {
      symbol: 'AAPL',
      side: 'buy',
      type: 'market',
      quantity: 10,
    };

    const result = validateOrder(request, riskConfig, 100, 10000, 0);
    expect(result.warnings).toContain('손절가가 설정되지 않았습니다');
  });

  it('should reject long with stop loss above entry', () => {
    const request: IOrderRequest = {
      symbol: 'AAPL',
      side: 'buy',
      type: 'market',
      quantity: 10,
      stopLoss: { type: 'fixed_price', price: 105 },
    };

    const result = validateOrder(request, riskConfig, 100, 10000, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('손절가는 현재가보다 낮아야'))).toBe(true);
  });

  it('should reject short with stop loss below entry', () => {
    const request: IOrderRequest = {
      symbol: 'AAPL',
      side: 'sell',
      type: 'market',
      quantity: 10,
      stopLoss: { type: 'fixed_price', price: 95 },
    };

    const result = validateOrder(request, riskConfig, 100, 10000, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('손절가는 현재가보다 높아야'))).toBe(true);
  });

  it('should reject long with take profit below entry', () => {
    const request: IOrderRequest = {
      symbol: 'AAPL',
      side: 'buy',
      type: 'market',
      quantity: 10,
      takeProfit: { type: 'fixed_price', price: 95 },
    };

    const result = validateOrder(request, riskConfig, 100, 10000, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('익절가는 현재가보다 높아야'))).toBe(true);
  });

  it('should reject short with take profit above entry', () => {
    const request: IOrderRequest = {
      symbol: 'AAPL',
      side: 'sell',
      type: 'market',
      quantity: 10,
      takeProfit: { type: 'fixed_price', price: 105 },
    };

    const result = validateOrder(request, riskConfig, 100, 10000, 0);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('익절가는 현재가보다 낮아야'))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// Slippage Tests
// ═══════════════════════════════════════════════════════════════

describe('simulateSlippage', () => {
  it('should simulate slippage in unfavorable direction for buy', () => {
    const executedPrice = simulateSlippage(100, 'buy', 0.5, 1);
    expect(executedPrice).toBeGreaterThanOrEqual(100);
    expect(executedPrice).toBeLessThanOrEqual(100.5);
  });

  it('should simulate slippage in unfavorable direction for sell', () => {
    const executedPrice = simulateSlippage(100, 'sell', 0.5, 1);
    expect(executedPrice).toBeGreaterThanOrEqual(99.5);
    expect(executedPrice).toBeLessThanOrEqual(100);
  });

  it('should apply volatility multiplier', () => {
    const executedPrice = simulateSlippage(100, 'buy', 0.5, 2);
    expect(executedPrice).toBeGreaterThanOrEqual(100);
    expect(executedPrice).toBeLessThanOrEqual(101); // 0.5% * 2
  });

  it('should return price within expected range', () => {
    // Run multiple times to test randomness
    for (let i = 0; i < 100; i++) {
      const executedPrice = simulateSlippage(100, 'buy', 1, 1);
      expect(executedPrice).toBeGreaterThanOrEqual(100);
      expect(executedPrice).toBeLessThanOrEqual(101);
    }
  });
});

describe('calculateSlippage', () => {
  it('should calculate slippage amount and percentage', () => {
    const result = calculateSlippage(100, 100.5);
    expect(result.slippage).toBe(0.5);
    expect(result.slippagePercent).toBe(0.5);
  });

  it('should calculate absolute slippage', () => {
    const result = calculateSlippage(100, 99.5);
    expect(result.slippage).toBe(0.5);
    expect(result.slippagePercent).toBe(0.5);
  });

  it('should return 0 for no slippage', () => {
    const result = calculateSlippage(100, 100);
    expect(result.slippage).toBe(0);
    expect(result.slippagePercent).toBe(0);
  });

  it('should handle zero requested price', () => {
    const result = calculateSlippage(0, 100);
    expect(result.slippage).toBe(100);
    expect(result.slippagePercent).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// Edge Cases & Extreme Values
// ═══════════════════════════════════════════════════════════════

describe('Edge Cases', () => {
  it('should handle very small numbers', () => {
    const pnl = calculatePnL(0.00001, 0.00002, 1000000, 'buy');
    expect(pnl).toBeCloseTo(10, 5);
  });

  it('should handle very large numbers', () => {
    const pnl = calculatePnL(50000, 51000, 100, 'buy');
    expect(pnl).toBe(100000);
  });

  it('should handle zero prices safely', () => {
    expect(calculatePnLPercent(0, 100, 'buy')).toBe(0);
    expect(calculateLeverage(10000, 0)).toBe(0);
  });

  it('should handle negative values appropriately', () => {
    const margin = calculateRequiredMargin(10000, -5);
    expect(margin).toBe(10000);
  });

  it('should maintain precision with decimals', () => {
    const avgPrice = calculateAvgEntryPrice(3.5, 100.123, 2.5, 105.456);
    const expected = (3.5 * 100.123 + 2.5 * 105.456) / 6;
    expect(avgPrice).toBeCloseTo(expected, 5);
  });
});
