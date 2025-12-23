/**
 * @hephaitos/core - RiskManagementService Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RiskManagementService } from '../services/risk-management-service.js';
import type { IRiskConfig, IPosition } from '@hephaitos/types';

describe('RiskManagementService', () => {
  let service: RiskManagementService;

  const defaultConfig: Partial<IRiskConfig> = {
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

  beforeEach(() => {
    service = new RiskManagementService(defaultConfig);
  });

  describe('updateConfig', () => {
    it('should update risk config successfully', () => {
      const result = service.updateConfig({ maxRiskPerTrade: 3 });

      expect(result.success).toBe(true);
      expect(result.data!.maxRiskPerTrade).toBe(3);
    });

    it('should merge with existing config', () => {
      service.updateConfig({ maxRiskPerTrade: 3 });
      const configResult = service.getConfig();

      expect(configResult.data!.maxRiskPerTrade).toBe(3);
      expect(configResult.data!.accountEquity).toBe(10000); // 기존 값 유지
    });
  });

  describe('getConfig', () => {
    it('should return current config', () => {
      const result = service.getConfig();

      expect(result.success).toBe(true);
      expect(result.data!.accountEquity).toBe(10000);
    });
  });

  describe('calculatePositionSize', () => {
    describe('percent_risk method', () => {
      it('should calculate position size based on risk percent', () => {
        const result = service.calculatePositionSize({
          symbol: 'AAPL',
          currentPrice: 150,
          stopLossPrice: 147, // 2% 손절
        });

        expect(result.success).toBe(true);
        expect(result.data!.method).toBe('percent_risk');

        // maxRiskPerTrade = 2% of 10000 = 200
        // riskPerShare = 150 - 147 = 3
        // quantity = 200 / 3 = 66.66
        expect(result.data!.quantity).toBeCloseTo(66.66, 1);
        expect(result.data!.riskPercent).toBeCloseTo(2, 0);
      });

      it('should use default stop loss if not provided', () => {
        const result = service.calculatePositionSize({
          symbol: 'AAPL',
          currentPrice: 150,
        });

        expect(result.success).toBe(true);
        // defaultStopLossPercent = 2%이므로 자동으로 147로 계산
        expect(result.data!.quantity).toBeGreaterThan(0);
      });
    });

    describe('fixed_amount method', () => {
      it('should calculate position size with fixed amount', () => {
        service.updateConfig({ sizingMethod: 'fixed_amount' });

        const result = service.calculatePositionSize({
          symbol: 'AAPL',
          currentPrice: 100,
        });

        expect(result.success).toBe(true);
        // maxPositionSize = 20% of 10000 = 2000
        // quantity = 2000 / 100 = 20
        expect(result.data!.quantity).toBe(20);
      });
    });

    describe('percent_equity method', () => {
      it('should calculate position size based on equity percent', () => {
        service.updateConfig({ sizingMethod: 'percent_equity' });

        const result = service.calculatePositionSize({
          symbol: 'TSLA',
          currentPrice: 200,
        });

        expect(result.success).toBe(true);
        // maxPositionSize = 20% of 10000 = 2000
        // quantity = 2000 / 200 = 10
        expect(result.data!.quantity).toBe(10);
        expect(result.data!.positionValue).toBe(2000);
      });
    });

    describe('kelly_criterion method', () => {
      it('should calculate position size using Kelly formula', () => {
        service.updateConfig({ sizingMethod: 'kelly_criterion' });

        const result = service.calculatePositionSize({
          symbol: 'BTC',
          currentPrice: 50000,
          winRate: 0.6,
          avgWinLossRatio: 2,
        });

        expect(result.success).toBe(true);
        // Kelly = 0.6 - (0.4 / 2) = 0.4 (40%)
        expect(result.data!.quantity).toBeGreaterThan(0);
      });
    });

    describe('volatility_adjusted method', () => {
      it('should calculate position size based on ATR', () => {
        service.updateConfig({ sizingMethod: 'volatility_adjusted' });

        const result = service.calculatePositionSize({
          symbol: 'SPY',
          currentPrice: 400,
          atr: 5,
        });

        expect(result.success).toBe(true);
        // riskAmount = 2% of 10000 = 200
        // riskPerShare = 5 * 2 = 10
        // quantity = 200 / 10 = 20
        expect(result.data!.quantity).toBe(20);
      });

      it('should fallback to percent_risk if no ATR provided', () => {
        service.updateConfig({ sizingMethod: 'volatility_adjusted' });

        const result = service.calculatePositionSize({
          symbol: 'SPY',
          currentPrice: 400,
        });

        expect(result.success).toBe(true);
        expect(result.data!.quantity).toBeGreaterThan(0);
      });
    });

    it('should enforce max position size limit', () => {
      const result = service.calculatePositionSize({
        symbol: 'PENNY',
        currentPrice: 1,
        stopLossPrice: 0.99,
      });

      expect(result.success).toBe(true);
      // maxPositionSize = 20% of 10000 = 2000
      expect(result.data!.positionValue).toBeLessThanOrEqual(2000);
    });

    it('should include metadata', () => {
      const result = service.calculatePositionSize({
        symbol: 'AAPL',
        currentPrice: 150,
      });

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.timestamp).toBeDefined();
      expect(result.metadata!.duration_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateTrade', () => {
    it('should allow valid trade', () => {
      const result = service.validateTrade({
        symbol: 'AAPL',
        positionValue: 1000,
        riskAmount: 100,
      });

      expect(result.success).toBe(true);
      expect(result.data!.allowed).toBe(true);
      expect(result.data!.reasons).toHaveLength(0);
    });

    it('should reject trade exceeding position size limit', () => {
      const result = service.validateTrade({
        symbol: 'AAPL',
        positionValue: 3000, // maxPositionSize = 20% = 2000
        riskAmount: 100,
      });

      expect(result.success).toBe(true);
      expect(result.data!.allowed).toBe(false);
      expect(result.data!.reasons).toContain('Position size exceeds limit (20% of equity)');
    });

    it('should reject trade exceeding risk limit', () => {
      const result = service.validateTrade({
        symbol: 'AAPL',
        positionValue: 1000,
        riskAmount: 300, // maxRiskPerTrade = 2% = 200
      });

      expect(result.success).toBe(true);
      expect(result.data!.allowed).toBe(false);
      expect(result.data!.reasons).toContain('Risk amount exceeds limit (2% of equity)');
    });

    it('should reject trade when daily limit reached', () => {
      // Simulate daily loss limit
      service.updateRiskStatus([], -600, 5); // -6% loss

      const result = service.validateTrade({
        symbol: 'AAPL',
        positionValue: 1000,
        riskAmount: 100,
      });

      expect(result.success).toBe(true);
      expect(result.data!.allowed).toBe(false);
      expect(result.data!.reasons).toContain('Daily loss limit reached (5%)');
    });

    it('should reject trade when daily trade limit reached', () => {
      service.updateRiskStatus([], 0, 10); // 10 trades (limit)

      const result = service.validateTrade({
        symbol: 'AAPL',
        positionValue: 1000,
        riskAmount: 100,
      });

      expect(result.success).toBe(true);
      expect(result.data!.allowed).toBe(false);
      expect(result.data!.reasons).toContain('Daily trade limit reached (10 trades)');
    });

    it('should reject trade when max open positions reached', () => {
      const mockPositions: IPosition[] = Array(5).fill(null).map((_, i) => ({
        id: `pos-${i}`,
        symbol: 'AAPL',
        side: 'buy',
        quantity: 10,
        entryPrice: 150,
        currentPrice: 151,
        unrealizedPnL: 10,
        unrealizedPnLPercent: 0.67,
        enteredAt: new Date().toISOString(),
      }));

      service.updateRiskStatus(mockPositions, 0, 0);

      const result = service.validateTrade({
        symbol: 'TSLA',
        positionValue: 1000,
        riskAmount: 100,
      });

      expect(result.success).toBe(true);
      expect(result.data!.allowed).toBe(false);
      expect(result.data!.reasons).toContain('Maximum open positions reached (5)');
    });

    it('should include risk status in result', () => {
      const result = service.validateTrade({
        symbol: 'AAPL',
        positionValue: 1000,
        riskAmount: 100,
      });

      expect(result.data!.riskStatus).toBeDefined();
      expect(result.data!.riskStatus.currentEquity).toBe(10000);
    });
  });

  describe('calculateStopLossTakeProfit', () => {
    describe('stop loss calculations', () => {
      it('should calculate fixed price stop loss', () => {
        const result = service.calculateStopLossTakeProfit({
          entryPrice: 150,
          side: 'buy',
          quantity: 10,
          stopLoss: { type: 'fixed_price', price: 147 },
        });

        expect(result.success).toBe(true);
        expect(result.data!.stopLossPrice).toBe(147);
        expect(result.data!.riskAmount).toBe(30); // (150-147) * 10
      });

      it('should calculate percent-based stop loss for buy', () => {
        const result = service.calculateStopLossTakeProfit({
          entryPrice: 100,
          side: 'buy',
          quantity: 10,
          stopLoss: { type: 'percent', percent: 5 },
        });

        expect(result.success).toBe(true);
        expect(result.data!.stopLossPrice).toBe(95);
      });

      it('should calculate percent-based stop loss for sell', () => {
        const result = service.calculateStopLossTakeProfit({
          entryPrice: 100,
          side: 'sell',
          quantity: 10,
          stopLoss: { type: 'percent', percent: 5 },
        });

        expect(result.success).toBe(true);
        expect(result.data!.stopLossPrice).toBe(105);
      });

      it('should calculate ATR-based stop loss', () => {
        const result = service.calculateStopLossTakeProfit({
          entryPrice: 150,
          side: 'buy',
          quantity: 10,
          atr: 3,
          stopLoss: { type: 'atr_based', atrMultiplier: 2 },
        });

        expect(result.success).toBe(true);
        expect(result.data!.stopLossPrice).toBe(144); // 150 - (3 * 2)
      });

      it('should calculate trailing stop loss', () => {
        const result = service.calculateStopLossTakeProfit({
          entryPrice: 100,
          side: 'buy',
          quantity: 10,
          stopLoss: { type: 'trailing', trailingPercent: 3 },
        });

        expect(result.success).toBe(true);
        expect(result.data!.stopLossPrice).toBe(97);
      });

      it('should use default stop loss if not provided', () => {
        const result = service.calculateStopLossTakeProfit({
          entryPrice: 100,
          side: 'buy',
          quantity: 10,
        });

        expect(result.success).toBe(true);
        // defaultStopLossPercent = 2%
        expect(result.data!.stopLossPrice).toBe(98);
      });
    });

    describe('take profit calculations', () => {
      it('should calculate fixed price take profit', () => {
        const result = service.calculateStopLossTakeProfit({
          entryPrice: 100,
          side: 'buy',
          quantity: 10,
          takeProfit: { type: 'fixed_price', price: 110 },
        });

        expect(result.success).toBe(true);
        expect(result.data!.takeProfitPrice).toBe(110);
        expect(result.data!.rewardAmount).toBe(100);
      });

      it('should calculate percent-based take profit', () => {
        const result = service.calculateStopLossTakeProfit({
          entryPrice: 100,
          side: 'buy',
          quantity: 10,
          takeProfit: { type: 'percent', percent: 10 },
        });

        expect(result.success).toBe(true);
        expect(result.data!.takeProfitPrice).toBe(110);
      });

      it('should calculate risk-reward based take profit', () => {
        const result = service.calculateStopLossTakeProfit({
          entryPrice: 100,
          side: 'buy',
          quantity: 10,
          stopLoss: { type: 'fixed_price', price: 95 },
          takeProfit: { type: 'risk_reward', riskRewardRatio: 2 },
        });

        expect(result.success).toBe(true);
        // Risk = 100 - 95 = 5
        // Reward = 5 * 2 = 10
        // TP = 100 + 10 = 110
        expect(result.data!.takeProfitPrice).toBe(110);
        expect(result.data!.riskRewardRatio).toBe(2);
      });

      it('should calculate trailing take profit', () => {
        const result = service.calculateStopLossTakeProfit({
          entryPrice: 100,
          side: 'buy',
          quantity: 10,
          takeProfit: { type: 'trailing', trailingPercent: 5 },
        });

        expect(result.success).toBe(true);
        expect(result.data!.takeProfitPrice).toBe(105);
      });

      it('should calculate partial exit take profit', () => {
        const result = service.calculateStopLossTakeProfit({
          entryPrice: 100,
          side: 'buy',
          quantity: 10,
          takeProfit: {
            type: 'partial',
            partialExits: [
              { targetPercent: 5, exitPercent: 50 },
              { targetPercent: 10, exitPercent: 50 },
            ],
          },
        });

        expect(result.success).toBe(true);
        // 첫 번째 타겟만 반환
        expect(result.data!.takeProfitPrice).toBe(105);
      });

      it('should use default take profit if not provided', () => {
        const result = service.calculateStopLossTakeProfit({
          entryPrice: 100,
          side: 'buy',
          quantity: 10,
        });

        expect(result.success).toBe(true);
        // defaultTakeProfitPercent = 4%
        expect(result.data!.takeProfitPrice).toBe(104);
      });
    });

    it('should calculate risk-reward ratio correctly', () => {
      const result = service.calculateStopLossTakeProfit({
        entryPrice: 100,
        side: 'buy',
        quantity: 10,
        stopLoss: { type: 'fixed_price', price: 95 },
        takeProfit: { type: 'fixed_price', price: 110 },
      });

      expect(result.success).toBe(true);
      expect(result.data!.riskAmount).toBe(50); // (100-95) * 10
      expect(result.data!.rewardAmount).toBe(100); // (110-100) * 10
      expect(result.data!.riskRewardRatio).toBe(2);
    });
  });

  describe('updateRiskStatus', () => {
    it('should update risk status with positions', () => {
      const positions: IPosition[] = [
        {
          id: 'pos1',
          symbol: 'AAPL',
          side: 'buy',
          quantity: 10,
          entryPrice: 150,
          currentPrice: 155,
          unrealizedPnL: 50,
          unrealizedPnLPercent: 3.33,
          status: 'open',
          enteredAt: new Date().toISOString(),
        },
      ];

      const result = service.updateRiskStatus(positions, 100, 3);

      expect(result.success).toBe(true);
      expect(result.data!.openPositionCount).toBe(1);
      expect(result.data!.dailyPnL).toBe(100);
      expect(result.data!.dailyTradeCount).toBe(3);
      expect(result.data!.currentEquity).toBe(10100);
      expect(result.data!.canTrade).toBe(true);
    });

    it('should calculate total margin used', () => {
      const positions: IPosition[] = [
        {
          id: 'pos1',
          symbol: 'AAPL',
          side: 'buy',
          quantity: 10,
          entryPrice: 150,
          currentPrice: 155,
          unrealizedPnL: 50,
          unrealizedPnLPercent: 3.33,
          status: 'open',
          enteredAt: new Date().toISOString(),
        },
      ];

      const result = service.updateRiskStatus(positions, 0, 0);

      expect(result.data!.totalMarginUsed).toBe(1500); // 10 * 150 / 1 (leverage)
      expect(result.data!.availableMargin).toBe(8500); // 10000 - 1500
    });

    it('should block trading when daily loss limit reached', () => {
      const result = service.updateRiskStatus([], -600, 5); // -6% loss

      expect(result.data!.dailyLimitReached).toBe(true);
      expect(result.data!.canTrade).toBe(false);
      expect(result.data!.blockReason).toBe('Daily loss limit reached');
    });

    it('should block trading when daily trade limit reached', () => {
      const result = service.updateRiskStatus([], 0, 10);

      expect(result.data!.canTrade).toBe(false);
      expect(result.data!.blockReason).toBe('Daily trade limit reached');
    });

    it('should block trading when max positions reached', () => {
      const positions: IPosition[] = Array(5).fill(null).map((_, i) => ({
        id: `pos-${i}`,
        symbol: 'AAPL',
        side: 'buy',
        quantity: 10,
        entryPrice: 150,
        currentPrice: 151,
        unrealizedPnL: 10,
        unrealizedPnLPercent: 0.67,
        enteredAt: new Date().toISOString(),
      }));

      const result = service.updateRiskStatus(positions, 0, 0);

      expect(result.data!.canTrade).toBe(false);
      expect(result.data!.blockReason).toBe('Maximum open positions reached');
    });
  });

  describe('getRiskStatus', () => {
    it('should return current risk status', () => {
      const result = service.getRiskStatus();

      expect(result.success).toBe(true);
      expect(result.data!.currentEquity).toBe(10000);
      expect(result.data!.canTrade).toBe(true);
    });

    it('should reflect updated status', () => {
      service.updateRiskStatus([], 500, 5);
      const result = service.getRiskStatus();

      expect(result.data!.dailyPnL).toBe(500);
      expect(result.data!.dailyTradeCount).toBe(5);
    });
  });

  describe('factory function', () => {
    it('should create service via createRiskManagementService', async () => {
      const { createRiskManagementService } = await import('../services/risk-management-service.js');
      const service = createRiskManagementService({ accountEquity: 5000 });

      const config = service.getConfig();
      expect(config.data!.accountEquity).toBe(5000);
    });
  });
});
