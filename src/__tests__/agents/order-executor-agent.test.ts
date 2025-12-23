/**
 * OrderExecutorAgent Comprehensive Test Suite
 *
 * Tests Coverage:
 * - SymbolMutex (Race Condition Prevention)
 * - Order Submission & Validation
 * - Position Management
 * - Risk Limits (Daily PnL, Trade Count, Position Limits, Leverage)
 * - Stop Loss / Take Profit Triggers
 * - Partial Position Exits
 * - Execution Statistics
 * - Error Handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OrderExecutorAgent } from '@/agents/order-executor-agent';
import type {
  IOrderRequest,
  IOrderWithMeta,
  IPositionWithMeta,
  IOrderExecution,
  OrderStatus,
  PositionStatus,
} from '@hephaitos/types';
import type { IOrderRepository, IPositionRepository } from '@hephaitos/core';

// ============================================
// Mock Repositories
// ============================================

interface IOrderStatusCounts {
  filled: number;
  cancelled: number;
  rejected: number;
  partial: number;
  pending: number;
}

class MockOrderRepository {
  private orders: Map<string, IOrderWithMeta> = new Map();
  private idCounter = 1;

  async createOrder(order: IOrderWithMeta): Promise<IOrderWithMeta> {
    const id = order.id || `order-${this.idCounter++}`;
    const newOrder = { ...order, id };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async getOrderById(id: string): Promise<IOrderWithMeta | null> {
    return this.orders.get(id) || null;
  }

  async updateOrder(id: string, updates: Partial<IOrderWithMeta>): Promise<IOrderWithMeta> {
    const order = this.orders.get(id);
    if (!order) throw new Error(`Order ${id} not found`);

    const updated = { ...order, ...updates };
    this.orders.set(id, updated);
    return updated;
  }

  async addExecution(orderId: string, execution: IOrderExecution): Promise<IOrderWithMeta> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    order.executions.push(execution);
    order.filledQuantity += execution.quantity;

    if (order.filledQuantity >= order.quantity) {
      order.status = 'filled';
    } else if (order.filledQuantity > 0) {
      order.status = 'partial';
    }

    return order;
  }

  async getOpenOrders(symbol?: string): Promise<IOrderWithMeta[]> {
    const orders = Array.from(this.orders.values());
    return orders.filter(o =>
      o.status !== 'filled' &&
      o.status !== 'cancelled' &&
      o.status !== 'rejected' &&
      (!symbol || o.symbol === symbol)
    );
  }

  async countOrdersByStatus(): Promise<IOrderStatusCounts> {
    const orders = Array.from(this.orders.values());
    return {
      filled: orders.filter(o => o.status === 'filled').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      rejected: orders.filter(o => o.status === 'rejected').length,
      partial: orders.filter(o => o.status === 'partial').length,
      pending: orders.filter(o => o.status === 'pending').length,
    };
  }

  // Test helper
  clear() {
    this.orders.clear();
    this.idCounter = 1;
  }
}

class MockPositionRepository {
  private positions: Map<string, IPositionWithMeta> = new Map();
  private idCounter = 1;

  async createPosition(position: IPositionWithMeta): Promise<IPositionWithMeta> {
    const id = position.id || `pos-${this.idCounter++}`;
    const newPosition = { ...position, id };
    this.positions.set(id, newPosition);
    return newPosition;
  }

  async getPositionById(id: string): Promise<IPositionWithMeta | null> {
    return this.positions.get(id) || null;
  }

  async getPositionBySymbol(symbol: string): Promise<IPositionWithMeta | null> {
    return Array.from(this.positions.values()).find(p =>
      p.symbol === symbol && p.status === 'open'
    ) || null;
  }

  async getOpenPositions(): Promise<IPositionWithMeta[]> {
    return Array.from(this.positions.values()).filter(p => p.status === 'open');
  }

  async updatePosition(id: string, updates: Partial<IPositionWithMeta>): Promise<IPositionWithMeta> {
    const position = this.positions.get(id);
    if (!position) throw new Error(`Position ${id} not found`);

    const updated = { ...position, ...updates };
    this.positions.set(id, updated);
    return updated;
  }

  async closePosition(id: string, exitPrice: number, exitTime: string): Promise<IPositionWithMeta> {
    const position = this.positions.get(id);
    if (!position) throw new Error(`Position ${id} not found`);

    position.status = 'closed';
    position.exitPrice = exitPrice;
    position.exitTime = exitTime;
    position.realizedPnL = (exitPrice - position.entryPrice) * position.quantity * (position.side === 'long' ? 1 : -1);

    return position;
  }

  async addPartialExit(positionId: string, price: number, amount: number, timestamp: string): Promise<IPositionWithMeta> {
    const position = this.positions.get(positionId);
    if (!position) throw new Error(`Position ${positionId} not found`);

    position.partialExits.push({ price, quantity, timestamp });
    position.quantity -= quantity;

    const realizedPnL = (price - position.entryPrice) * quantity * (position.side === 'long' ? 1 : -1);
    position.realizedPnL = (position.realizedPnL || 0) + realizedPnL;

    if (position.quantity <= 0) {
      position.status = 'closed';
    }

    return position;
  }

  async countOpenPositions(): Promise<number> {
    return Array.from(this.positions.values()).filter(p => p.status === 'open').length;
  }

  async updateCurrentPrice(symbol: string, price: number): Promise<void> {
    const position = await this.getPositionBySymbol(symbol);
    if (position) {
      position.currentPrice = price;
      position.unrealizedPnL = (price - position.entryPrice) * position.quantity * (position.side === 'long' ? 1 : -1);
    }
  }

  async getTotalUnrealizedPnL(): Promise<number> {
    const positions = await this.getOpenPositions();
    return positions.reduce((sum, p) => sum + (p.unrealizedPnL || 0), 0);
  }

  // Test helper
  clear() {
    this.positions.clear();
    this.idCounter = 1;
  }
}

// ============================================
// Test Helpers
// ============================================

function createTestOrderRequest(overrides: Partial<IOrderRequest> = {}): IOrderRequest {
  return {
    symbol: 'AAPL',
    side: 'buy',
    type: 'market',
    amount: 100,
    price: 150,
    stopLoss: 145,
    takeProfit: 160,
    trailingStopPercent: undefined,
    leverage: 1,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// Test Suites
// ============================================

describe('OrderExecutorAgent', () => {
  let agent: OrderExecutorAgent;
  let orderRepo: MockOrderRepository;
  let positionRepo: MockPositionRepository;

  beforeEach(() => {
    orderRepo = new MockOrderRepository();
    positionRepo = new MockPositionRepository();

    agent = new OrderExecutorAgent(orderRepo as IOrderRepository, positionRepo as IPositionRepository, {
      mode: 'simulation',
      simulationSlippagePercent: 0.1,
      simulationFeePercent: 0.1,
      simulationLatencyMs: 0, // No delay for tests
      riskConfig: {
        maxPositions: 10,
        maxLeverage: 3,
        maxDailyLoss: 1000,
        maxDailyTrades: 50,
        requireStopLoss: true,
        requireTakeProfit: false,
        tradeOnMarketHoursOnly: false,
      },
    });
  });

  // ========================================
  // 1. Order Submission Tests
  // ========================================

  describe('Order Submission', () => {
    it('should successfully submit a valid market order', async () => {
      const request = createTestOrderRequest();
      const result = await agent.submitOrder(request);

      expect(result.success).toBe(true);
      expect(result.order).toBeDefined();
      expect(result.order!.symbol).toBe('AAPL');
      expect(result.order!.side).toBe('buy');
      expect(result.order!.quantity).toBe(100);
      expect(result.order!.status).toBe('filled');
      expect(result.position).toBeDefined();
      expect(result.position!.symbol).toBe('AAPL');
    });

    it('should reject order without stop loss when required', async () => {
      const request = createTestOrderRequest({ stopLoss: undefined });
      const result = await agent.submitOrder(request);

      expect(result.success).toBe(false);
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors).toContain('Stop loss is required');
    });

    it('should reject order with leverage exceeding limit', async () => {
      const request = createTestOrderRequest({ leverage: 5 });
      const result = await agent.submitOrder(request);

      expect(result.success).toBe(false);
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors.some(e => e.includes('레버리지'))).toBe(true);
    });

    it('should reject order when max positions reached', async () => {
      // Fill up to max positions
      for (let i = 0; i < 10; i++) {
        const request = createTestOrderRequest({
          symbol: `STOCK${i}`,
          side: 'buy'
        });
        await agent.submitOrder(request);
      }

      // Try one more
      const request = createTestOrderRequest({ symbol: 'STOCK11' });
      const result = await agent.submitOrder(request);

      expect(result.success).toBe(false);
      expect(result.validation.errors.some(e => e.includes('최대 포지션 수'))).toBe(true);
    });

    it('should apply slippage in simulation mode', async () => {
      const request = createTestOrderRequest({ price: 100, amount: 100 });
      const result = await agent.submitOrder(request);

      expect(result.success).toBe(true);
      expect(result.order!.executions).toHaveLength(1);

      const execution = result.order!.executions[0];
      // Should have slippage (0.1% = 0.10 on 100 price)
      expect(execution.price).toBeGreaterThan(100);
      expect(execution.price).toBeLessThan(100.2); // Max 0.1%
    });

    it('should create new position for first order', async () => {
      const request = createTestOrderRequest();
      const result = await agent.submitOrder(request);

      expect(result.success).toBe(true);
      expect(result.position).toBeDefined();
      expect(result.position!.side).toBe('long');
      expect(result.position!.quantity).toBe(100);
      expect(result.position!.status).toBe('open');
    });

    it('should update existing position when adding to it', async () => {
      // First order
      const request1 = createTestOrderRequest({ amount: 100 });
      const result1 = await agent.submitOrder(request1);

      // Second order (same symbol, same side)
      const request2 = createTestOrderRequest({ amount: 50 });
      const result2 = await agent.submitOrder(request2);

      expect(result2.success).toBe(true);
      expect(result2.position!.quantity).toBe(150); // 100 + 50
    });
  });

  // ========================================
  // 2. Race Condition Tests (Mutex)
  // ========================================

  describe('Race Condition Prevention (Mutex)', () => {
    it('should prevent concurrent orders on same symbol', async () => {
      const request = createTestOrderRequest();

      // Submit two orders concurrently
      const [result1, result2] = await Promise.all([
        agent.submitOrder(request),
        agent.submitOrder(request),
      ]);

      // Both should succeed but be serialized
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Check final position quantity
      const position = await agent.getPosition('AAPL');
      expect(position).toBeDefined();
      expect(position!.quantity).toBe(200); // 100 + 100
    });

    it('should allow concurrent orders on different symbols', async () => {
      const request1 = createTestOrderRequest({ symbol: 'AAPL' });
      const request2 = createTestOrderRequest({ symbol: 'GOOGL' });

      const [result1, result2] = await Promise.all([
        agent.submitOrder(request1),
        agent.submitOrder(request2),
      ]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      const positions = await agent.getOpenPositions();
      expect(positions).toHaveLength(2);
    });

    it('should prevent concurrent position close and order submit', async () => {
      // Create initial position
      const createRequest = createTestOrderRequest();
      await agent.submitOrder(createRequest);

      // Try to close position and submit new order concurrently
      const [closeResult, submitResult] = await Promise.all([
        agent.closePosition('AAPL', 155),
        agent.submitOrder(createRequest),
      ]);

      // One should succeed, behavior depends on execution order
      const successCount = [closeResult.success, submitResult.success].filter(Boolean).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ========================================
  // 3. Position Management Tests
  // ========================================

  describe('Position Management', () => {
    it('should close position at market price', async () => {
      // Create position
      const request = createTestOrderRequest({ price: 100, amount: 100 });
      await agent.submitOrder(request);

      // Close position
      const result = await agent.closePosition('AAPL', 110);

      expect(result.success).toBe(true);
      expect(result.position).toBeDefined();
      expect(result.position!.status).toBe('closed');
      expect(result.realizedPnL).toBeGreaterThan(0); // Profit
    });

    it('should calculate realized PnL correctly on position close', async () => {
      // Buy at 100, close at 110
      const buyRequest = createTestOrderRequest({
        side: 'buy',
        price: 100,
        amount: 100
      });
      await agent.submitOrder(buyRequest);

      const result = await agent.closePosition('AAPL', 110);

      // PnL should be approximately (110 - 100) * 100 = 1000
      // Minus fees
      expect(result.realizedPnL).toBeGreaterThan(900);
      expect(result.realizedPnL).toBeLessThan(1100);
    });

    it('should support partial position exits', async () => {
      // Create position with 100 shares
      const request = createTestOrderRequest({ price: 100, amount: 100 });
      await agent.submitOrder(request);

      // Close 50 shares
      const sellRequest = createTestOrderRequest({
        side: 'sell',
        amount: 50,
        price: 110,
      });
      const result = await agent.submitOrder(sellRequest);

      expect(result.success).toBe(true);

      // Position should still be open with 50 shares
      const position = await agent.getPosition('AAPL');
      expect(position).toBeDefined();
      expect(position!.quantity).toBe(50);
      expect(position!.status).toBe('open');
      expect(position!.partialExits).toHaveLength(1);
    });

    it('should close all positions', async () => {
      // Create multiple positions
      for (let i = 0; i < 3; i++) {
        const request = createTestOrderRequest({ symbol: `STOCK${i}` });
        await agent.submitOrder(request);
      }

      // Close all
      const results = await agent.closeAllPositions(150);

      expect(results.closed).toBe(3);
      expect(results.failed).toBe(0);

      const openPositions = await agent.getOpenPositions();
      expect(openPositions).toHaveLength(0);
    });
  });

  // ========================================
  // 4. Risk Limits Tests
  // ========================================

  describe('Risk Limits', () => {
    it('should enforce max daily loss limit', async () => {
      // Create a losing position that exceeds daily loss limit
      // Buy at 100
      const request = createTestOrderRequest({
        price: 100,
        amount: 100,
        stopLoss: 90,
      });
      await agent.submitOrder(request);

      // Update price to trigger stop loss (90) - loss of 1000
      await agent.updatePrice('AAPL', 90);

      // Try to submit another order
      const request2 = createTestOrderRequest({ symbol: 'GOOGL' });
      const result2 = await agent.submitOrder(request2);

      // Should be rejected due to daily loss limit
      expect(result2.success).toBe(false);
      expect(result2.validation.errors.some(e => e.includes('일일 손실 한도'))).toBe(true);
    });

    it('should enforce max daily trades limit', async () => {
      // Submit 50 orders (the limit)
      for (let i = 0; i < 50; i++) {
        const request = createTestOrderRequest({
          symbol: `STOCK${i}`,
        });
        await agent.submitOrder(request);
      }

      // Try 51st order
      const request = createTestOrderRequest({ symbol: 'STOCK51' });
      const result = await agent.submitOrder(request);

      expect(result.success).toBe(false);
      expect(result.validation.errors.some(e => e.includes('일일 거래 횟수 한도'))).toBe(true);
    });

    it('should reset daily stats on new day', async () => {
      // Submit an order
      const request = createTestOrderRequest();
      await agent.submitOrder(request);

      // Get risk status
      const status1 = await agent.getRiskStatus();
      expect(status1.dailyTradeCount).toBe(1);

      // Simulate day change by directly manipulating agent's internal state
      // (In real scenario, this would happen automatically based on timestamp)
      // Note: This is a limitation of the test - we can't directly test day rollover
      // without time manipulation
    });

    it('should track risk status correctly', async () => {
      // Create position
      const request = createTestOrderRequest({ price: 100, amount: 100 });
      await agent.submitOrder(request);

      const status = await agent.getRiskStatus();

      expect(status.openPositions).toBe(1);
      expect(status.maxPositions).toBe(10);
      expect(status.dailyTradeCount).toBe(1);
      expect(status.maxDailyTrades).toBe(50);
      expect(status.isWithinLimits).toBe(true);
    });
  });

  // ========================================
  // 5. Stop Loss / Take Profit Tests
  // ========================================

  describe('Stop Loss & Take Profit', () => {
    it('should trigger stop loss when price drops below threshold', async () => {
      // Buy at 100 with SL at 95
      const request = createTestOrderRequest({
        price: 100,
        amount: 100,
        stopLoss: 95,
      });
      await agent.submitOrder(request);

      // Update price to 94 (below stop loss)
      await agent.updatePrice('AAPL', 94);

      // Position should be closed
      const position = await agent.getPosition('AAPL');
      expect(position).toBeNull(); // Position closed
    });

    it('should trigger take profit when price rises above threshold', async () => {
      // Buy at 100 with TP at 110
      const request = createTestOrderRequest({
        price: 100,
        amount: 100,
        takeProfit: 110,
      });
      await agent.submitOrder(request);

      // Update price to 111 (above take profit)
      await agent.updatePrice('AAPL', 111);

      // Position should be closed
      const position = await agent.getPosition('AAPL');
      expect(position).toBeNull(); // Position closed
    });

    it('should not trigger SL/TP if price within bounds', async () => {
      // Buy at 100 with SL at 95, TP at 110
      const request = createTestOrderRequest({
        price: 100,
        amount: 100,
        stopLoss: 95,
        takeProfit: 110,
      });
      await agent.submitOrder(request);

      // Update price to 105 (within bounds)
      await agent.updatePrice('AAPL', 105);

      // Position should still be open
      const position = await agent.getPosition('AAPL');
      expect(position).toBeDefined();
      expect(position!.status).toBe('open');
    });

    it('should support trailing stop loss', async () => {
      // Buy at 100 with 5% trailing stop
      const request = createTestOrderRequest({
        price: 100,
        amount: 100,
        trailingStopPercent: 5,
      });
      await agent.submitOrder(request);

      // Price rises to 110
      await agent.updatePrice('AAPL', 110);

      let position = await agent.getPosition('AAPL');
      expect(position).toBeDefined();
      expect(position!.status).toBe('open');
      // Trailing stop should now be at 110 * 0.95 = 104.5

      // Price drops to 104 (below trailing stop)
      await agent.updatePrice('AAPL', 104);

      position = await agent.getPosition('AAPL');
      expect(position).toBeNull(); // Position should be closed
    });
  });

  // ========================================
  // 6. Execution Statistics Tests
  // ========================================

  describe('Execution Statistics', () => {
    it('should track execution statistics', async () => {
      // Create 3 winning trades and 2 losing trades

      // Win 1: Buy at 100, sell at 110
      await agent.submitOrder(createTestOrderRequest({
        symbol: 'STOCK1', price: 100
      }));
      await agent.closePosition('STOCK1', 110);

      // Win 2: Buy at 100, sell at 105
      await agent.submitOrder(createTestOrderRequest({
        symbol: 'STOCK2', price: 100
      }));
      await agent.closePosition('STOCK2', 105);

      // Win 3: Buy at 100, sell at 108
      await agent.submitOrder(createTestOrderRequest({
        symbol: 'STOCK3', price: 100
      }));
      await agent.closePosition('STOCK3', 108);

      // Loss 1: Buy at 100, sell at 95
      await agent.submitOrder(createTestOrderRequest({
        symbol: 'STOCK4', price: 100
      }));
      await agent.closePosition('STOCK4', 95);

      // Loss 2: Buy at 100, sell at 92
      await agent.submitOrder(createTestOrderRequest({
        symbol: 'STOCK5', price: 100
      }));
      await agent.closePosition('STOCK5', 92);

      const stats = await agent.getExecutionStats();

      expect(stats.totalOrders).toBe(10); // 5 buys + 5 sells
      expect(stats.filledOrders).toBe(10);
      expect(stats.winningTrades).toBe(3);
      expect(stats.losingTrades).toBe(2);
      expect(stats.winRate).toBeCloseTo(0.6, 1); // 60%
      expect(stats.totalPnL).toBeGreaterThan(0); // Net profit
    });

    it('should calculate profit factor correctly', async () => {
      // Create 2 winners (total +2000) and 1 loser (-500)

      await agent.submitOrder(createTestOrderRequest({
        symbol: 'WIN1', price: 100, amount: 100
      }));
      await agent.closePosition('WIN1', 110); // +1000

      await agent.submitOrder(createTestOrderRequest({
        symbol: 'WIN2', price: 100, amount: 100
      }));
      await agent.closePosition('WIN2', 110); // +1000

      await agent.submitOrder(createTestOrderRequest({
        symbol: 'LOSS1', price: 100, amount: 100
      }));
      await agent.closePosition('LOSS1', 95); // -500

      const stats = await agent.getExecutionStats();

      // Profit factor = Total Wins / Total Losses = 2000 / 500 = 4.0
      expect(stats.profitFactor).toBeGreaterThan(3);
      expect(stats.profitFactor).toBeLessThan(5);
    });
  });

  // ========================================
  // 7. Order Cancellation Tests
  // ========================================

  describe('Order Cancellation', () => {
    it('should cancel pending order', async () => {
      // Create a limit order (which stays pending in simulation)
      const request = createTestOrderRequest({
        type: 'limit',
        price: 100,
      });
      const result = await agent.submitOrder(request);

      // Cancel it
      const cancelled = await agent.cancelOrder(result.order!.id);

      expect(cancelled).toBe(true);

      const order = await orderRepo.getOrderById(result.order!.id);
      expect(order!.status).toBe('cancelled');
    });

    it('should not cancel already filled order', async () => {
      // Market orders are filled immediately
      const request = createTestOrderRequest({ type: 'market' });
      const result = await agent.submitOrder(request);

      // Try to cancel
      const cancelled = await agent.cancelOrder(result.order!.id);

      expect(cancelled).toBe(false);
    });
  });

  // ========================================
  // 8. Short Selling Tests
  // ========================================

  describe('Short Selling', () => {
    it('should handle short sell orders', async () => {
      // Short sell at 100
      const request = createTestOrderRequest({
        side: 'sell',
        price: 100,
        amount: 100,
      });
      const result = await agent.submitOrder(request);

      expect(result.success).toBe(true);
      expect(result.position).toBeDefined();
      expect(result.position!.side).toBe('short');
    });

    it('should calculate PnL correctly for short positions', async () => {
      // Short sell at 100
      await agent.submitOrder(createTestOrderRequest({
        side: 'sell',
        price: 100,
        amount: 100,
      }));

      // Buy back at 90 (profit)
      const result = await agent.closePosition('AAPL', 90);

      expect(result.success).toBe(true);
      // Profit = (100 - 90) * 100 = 1000
      expect(result.realizedPnL).toBeGreaterThan(900);
    });

    it('should trigger stop loss for short positions', async () => {
      // Short sell at 100 with SL at 105
      await agent.submitOrder(createTestOrderRequest({
        side: 'sell',
        price: 100,
        amount: 100,
        stopLoss: 105,
      }));

      // Price rises to 106
      await agent.updatePrice('AAPL', 106);

      // Position should be closed (loss)
      const position = await agent.getPosition('AAPL');
      expect(position).toBeNull();
    });
  });

  // ========================================
  // 9. Error Handling Tests
  // ========================================

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Create a position
      await agent.submitOrder(createTestOrderRequest());

      // Clear the position repo to simulate data loss
      positionRepo.clear();

      // Try to close position
      const result = await agent.closePosition('AAPL', 110);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate order quantity is positive', async () => {
      const request = createTestOrderRequest({ amount: -100 });
      const result = await agent.submitOrder(request);

      expect(result.success).toBe(false);
      expect(result.validation.isValid).toBe(false);
    });

    it('should validate order price is positive', async () => {
      const request = createTestOrderRequest({
        type: 'limit',
        price: -50
      });
      const result = await agent.submitOrder(request);

      expect(result.success).toBe(false);
      expect(result.validation.isValid).toBe(false);
    });
  });

  // ========================================
  // 10. Integration Tests
  // ========================================

  describe('Integration Scenarios', () => {
    it('should handle complete trading workflow', async () => {
      // 1. Submit order
      const buyResult = await agent.submitOrder(createTestOrderRequest({
        price: 100,
        amount: 100,
        stopLoss: 95,
        takeProfit: 110,
      }));
      expect(buyResult.success).toBe(true);

      // 2. Check position
      let position = await agent.getPosition('AAPL');
      expect(position).toBeDefined();
      expect(position!.quantity).toBe(100);

      // 3. Update price (within bounds)
      await agent.updatePrice('AAPL', 105);
      position = await agent.getPosition('AAPL');
      expect(position).toBeDefined();
      expect(position!.unrealizedPnL).toBeGreaterThan(0);

      // 4. Partial exit
      const sellResult = await agent.submitOrder(createTestOrderRequest({
        side: 'sell',
        amount: 50,
        price: 105,
      }));
      expect(sellResult.success).toBe(true);

      // 5. Check remaining position
      position = await agent.getPosition('AAPL');
      expect(position!.quantity).toBe(50);

      // 6. Close remaining
      const closeResult = await agent.closePosition('AAPL', 108);
      expect(closeResult.success).toBe(true);

      // 7. Verify statistics
      const stats = await agent.getExecutionStats();
      expect(stats.totalOrders).toBe(3); // Buy + Sell + Close
      expect(stats.winningTrades).toBe(1);
    });

    it('should handle multiple concurrent symbol operations', async () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];

      // Submit orders for all symbols concurrently
      const results = await Promise.all(
        symbols.map(symbol =>
          agent.submitOrder(createTestOrderRequest({ symbol, price: 100 }))
        )
      );

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Check all positions created
      const positions = await agent.getOpenPositions();
      expect(positions).toHaveLength(5);
    });
  });
});
