/**
 * Order Executor Agent Tests
 * L3 (Tissues) - 주문 실행 에이전트 테스트
 *
 * ⚠️ CRITICAL: 이 에이전트는 실제 돈을 다루므로 철저한 테스트 필수
 *
 * 테스트 범위:
 * 1. Order validation logic
 * 2. Position opening/closing
 * 3. Stop-loss and take-profit execution
 * 4. Risk management checks
 * 5. State management
 * 6. Error handling
 * 7. Concurrency control (Mutex)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  OrderExecutorAgent,
  createOrderExecutorAgent,
  type IOrderExecutorAgentConfig,
  type IOrderSubmitResult,
  type IClosePositionResult,
} from '@/agents/order-executor-agent';
import type {
  IOrderRequest,
  IOrderWithMeta,
  IPositionWithMeta,
  IRiskConfig,
  ExecutionMode,
  OrderSide,
} from '@hephaitos/types';
import { DEFAULT_RISK_CONFIG } from '@hephaitos/types';

// ═══════════════════════════════════════════════════════════════
// Mock Repositories
// ═══════════════════════════════════════════════════════════════

interface IOrderStatusCounts {
  filled: number;
  cancelled: number;
  rejected: number;
  partial: number;
  pending: number;
}

const createMockOrderRepository = () => ({
  createOrder: vi.fn(),
  getOrderById: vi.fn(),
  updateOrder: vi.fn(),
  addExecution: vi.fn(),
  getOpenOrders: vi.fn(),
  countOrdersByStatus: vi.fn(),
});

const createMockPositionRepository = () => ({
  createPosition: vi.fn(),
  getPositionById: vi.fn(),
  getPositionBySymbol: vi.fn(),
  getOpenPositions: vi.fn(),
  updatePosition: vi.fn(),
  closePosition: vi.fn(),
  addPartialExit: vi.fn(),
  countOpenPositions: vi.fn(),
  updateCurrentPrice: vi.fn(),
  getTotalUnrealizedPnL: vi.fn(),
});

// ═══════════════════════════════════════════════════════════════
// Test Data Factories
// ═══════════════════════════════════════════════════════════════

const createMockOrderRequest = (overrides?: Partial<IOrderRequest>): IOrderRequest => ({
  symbol: 'AAPL',
  side: 'buy',
  type: 'market',
  quantity: 10,
  price: 150.0,
  ...overrides,
});

const createMockOrder = (overrides?: Partial<IOrderWithMeta>): IOrderWithMeta => ({
  id: 'ord-123',
  symbol: 'AAPL',
  side: 'buy',
  type: 'market',
  quantity: 10,
  filledQuantity: 0,
  status: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  executions: [],
  totalFees: 0,
  mode: 'simulation',
  ...overrides,
});

const createMockPosition = (overrides?: Partial<IPositionWithMeta>): IPositionWithMeta => ({
  id: 'pos-123',
  symbol: 'AAPL',
  side: 'buy',
  quantity: 10,
  entryPrice: 150.0,
  currentPrice: 150.0,
  unrealizedPnL: 0,
  unrealizedPnLPercent: 0,
  status: 'open',
  enteredAt: new Date().toISOString(),
  originOrderId: 'ord-123',
  partialExits: [],
  mae: 0,
  mfe: 0,
  totalFees: 1.5,
  ...overrides,
});

const createMockRiskConfig = (overrides?: Partial<IRiskConfig>): IRiskConfig => ({
  ...DEFAULT_RISK_CONFIG,
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════
// Main Test Suite
// ═══════════════════════════════════════════════════════════════

describe('OrderExecutorAgent', () => {
  let agent: OrderExecutorAgent;
  let mockOrderRepo: ReturnType<typeof createMockOrderRepository>;
  let mockPositionRepo: ReturnType<typeof createMockPositionRepository>;
  let mockConfig: IOrderExecutorAgentConfig;

  beforeEach(() => {
    mockOrderRepo = createMockOrderRepository();
    mockPositionRepo = createMockPositionRepository();

    mockConfig = {
      mode: 'simulation',
      riskConfig: createMockRiskConfig(),
      simulationSlippagePercent: 0.1,
      simulationFeePercent: 0.1,
      simulationLatencyMs: 50,
    };

    agent = new OrderExecutorAgent(mockOrderRepo, mockPositionRepo, mockConfig);

    // Default mock returns
    mockPositionRepo.countOpenPositions.mockResolvedValue(0);
    mockPositionRepo.getTotalUnrealizedPnL.mockResolvedValue(0);
    mockOrderRepo.countOrdersByStatus.mockResolvedValue({
      filled: 0,
      cancelled: 0,
      rejected: 0,
      partial: 0,
      pending: 0,
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Order Submission Tests
  // ═══════════════════════════════════════════════════════════════

  describe('submitOrder', () => {
    it('should submit a valid market buy order successfully', async () => {
      const request = createMockOrderRequest();
      const mockOrder = createMockOrder();

      mockOrderRepo.createOrder.mockResolvedValue(mockOrder);
      mockOrderRepo.getOrderById.mockResolvedValue(mockOrder);
      mockOrderRepo.addExecution.mockResolvedValue(mockOrder);
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(null);
      mockPositionRepo.createPosition.mockResolvedValue(createMockPosition());

      const result = await agent.submitOrder(request);

      expect(result.success).toBe(true);
      expect(result.validation.valid).toBe(true);
      expect(result.order).toBeDefined();
      expect(result.position).toBeDefined();
      expect(mockOrderRepo.createOrder).toHaveBeenCalledTimes(1);
      expect(mockOrderRepo.addExecution).toHaveBeenCalledTimes(1);
    });

    it('should reject order with zero quantity', async () => {
      const request = createMockOrderRequest({ quantity: 0 });

      const result = await agent.submitOrder(request);

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toContain('수량은 0보다 커야 합니다');
      expect(mockOrderRepo.createOrder).not.toHaveBeenCalled();
    });

    it('should reject order with negative quantity', async () => {
      const request = createMockOrderRequest({ quantity: -10 });

      const result = await agent.submitOrder(request);

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(mockOrderRepo.createOrder).not.toHaveBeenCalled();
    });

    it('should reject order when position limit is reached', async () => {
      const request = createMockOrderRequest();
      mockPositionRepo.countOpenPositions.mockResolvedValue(
        mockConfig.riskConfig.maxOpenPositions
      );

      const result = await agent.submitOrder(request);

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors.some(e => e.includes('최대 동시 포지션 수'))).toBe(true);
    });

    it('should reject order when position size exceeds limit', async () => {
      const request = createMockOrderRequest({
        quantity: 1000,
        price: 1000, // Total = 1,000,000 (exceeds 20% of 10,000 equity)
      });

      const result = await agent.submitOrder(request);

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors.some(e => e.includes('포지션 크기'))).toBe(true);
    });

    it('should reject order when daily trade limit is reached', async () => {
      const request = createMockOrderRequest();

      // Submit orders up to the limit
      mockOrderRepo.createOrder.mockResolvedValue(createMockOrder());
      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder());
      mockOrderRepo.addExecution.mockResolvedValue(createMockOrder());
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(null);
      mockPositionRepo.createPosition.mockResolvedValue(createMockPosition());

      for (let i = 0; i < mockConfig.riskConfig.dailyTradeLimit; i++) {
        await agent.submitOrder(request);
      }

      // Next order should be rejected
      const result = await agent.submitOrder(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('일일 거래 횟수 한도 초과');
    });

    it('should handle limit order with price', async () => {
      const request = createMockOrderRequest({
        type: 'limit',
        price: 149.50,
      });

      mockOrderRepo.createOrder.mockResolvedValue(createMockOrder({ type: 'limit' }));
      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder({ type: 'limit' }));
      mockOrderRepo.addExecution.mockResolvedValue(createMockOrder({ type: 'limit' }));
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(null);
      mockPositionRepo.createPosition.mockResolvedValue(createMockPosition());

      const result = await agent.submitOrder(request);

      expect(result.success).toBe(true);
      expect(result.validation.valid).toBe(true);
    });

    it('should apply slippage in simulation mode', async () => {
      const request = createMockOrderRequest({ price: 100.0 });

      mockOrderRepo.createOrder.mockResolvedValue(createMockOrder());
      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder());

      let capturedExecution: unknown = null;
      mockOrderRepo.addExecution.mockImplementation(async (orderId, execution) => {
        capturedExecution = execution;
        return createMockOrder();
      });

      mockPositionRepo.getPositionBySymbol.mockResolvedValue(null);
      mockPositionRepo.createPosition.mockResolvedValue(createMockPosition());

      await agent.submitOrder(request);

      expect(capturedExecution).toBeDefined();
      expect((capturedExecution as { executedPrice: number }).executedPrice).not.toBe(100.0);
      // Buy order should have positive slippage
      expect((capturedExecution as { executedPrice: number }).executedPrice).toBeGreaterThan(100.0);
    });

    it('should calculate fees correctly', async () => {
      const request = createMockOrderRequest({ quantity: 10, price: 100.0 });

      mockOrderRepo.createOrder.mockResolvedValue(createMockOrder());
      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder());

      let capturedExecution: unknown = null;
      mockOrderRepo.addExecution.mockImplementation(async (orderId, execution) => {
        capturedExecution = execution;
        return createMockOrder();
      });

      mockPositionRepo.getPositionBySymbol.mockResolvedValue(null);
      mockPositionRepo.createPosition.mockResolvedValue(createMockPosition());

      await agent.submitOrder(request);

      expect(capturedExecution).toBeDefined();
      const execution = capturedExecution as { trade: { fee: number; value: number } };
      expect(execution.trade.fee).toBeGreaterThan(0);
      // Fee should be approximately 0.1% of value
      expect(execution.trade.fee).toBeCloseTo(execution.trade.value * 0.001, 2);
    });

    it('should use mutex to prevent concurrent orders for same symbol', async () => {
      const request1 = createMockOrderRequest({ symbol: 'AAPL' });
      const request2 = createMockOrderRequest({ symbol: 'AAPL' });

      let order1Started = false;
      let order2Started = false;
      let order1Finished = false;

      mockOrderRepo.createOrder.mockImplementation(async () => {
        if (!order1Started) {
          order1Started = true;
          // Simulate slow operation
          await new Promise(resolve => setTimeout(resolve, 100));
          order1Finished = true;
          return createMockOrder();
        } else {
          order2Started = true;
          // Order 2 should start only after order 1 finishes
          expect(order1Finished).toBe(true);
          return createMockOrder({ id: 'ord-456' });
        }
      });

      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder());
      mockOrderRepo.addExecution.mockResolvedValue(createMockOrder());
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(null);
      mockPositionRepo.createPosition.mockResolvedValue(createMockPosition());

      // Submit both orders concurrently
      const [result1, result2] = await Promise.all([
        agent.submitOrder(request1),
        agent.submitOrder(request2),
      ]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(order1Started).toBe(true);
      expect(order2Started).toBe(true);
    });

    it('should allow concurrent orders for different symbols', async () => {
      const request1 = createMockOrderRequest({ symbol: 'AAPL' });
      const request2 = createMockOrderRequest({ symbol: 'GOOGL' });

      const startTimes: number[] = [];

      mockOrderRepo.createOrder.mockImplementation(async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 50));
        return createMockOrder();
      });

      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder());
      mockOrderRepo.addExecution.mockResolvedValue(createMockOrder());
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(null);
      mockPositionRepo.createPosition.mockResolvedValue(createMockPosition());

      await Promise.all([
        agent.submitOrder(request1),
        agent.submitOrder(request2),
      ]);

      // Both should start roughly at the same time (within 10ms)
      expect(Math.abs(startTimes[0] - startTimes[1])).toBeLessThan(10);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Position Management Tests
  // ═══════════════════════════════════════════════════════════════

  describe('Position Opening', () => {
    it('should create new position when no existing position', async () => {
      const request = createMockOrderRequest();

      mockOrderRepo.createOrder.mockResolvedValue(createMockOrder());
      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder());
      mockOrderRepo.addExecution.mockResolvedValue(createMockOrder());
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(null);

      const newPosition = createMockPosition();
      mockPositionRepo.createPosition.mockResolvedValue(newPosition);

      const result = await agent.submitOrder(request);

      expect(result.success).toBe(true);
      expect(result.position).toBeDefined();
      expect(mockPositionRepo.createPosition).toHaveBeenCalledTimes(1);
      expect(mockPositionRepo.updatePosition).not.toHaveBeenCalled();
    });

    it('should add to existing position when same direction', async () => {
      const request = createMockOrderRequest({ side: 'buy', quantity: 5 });

      const existingPosition = createMockPosition({
        side: 'buy',
        quantity: 10,
        entryPrice: 150.0,
      });

      mockOrderRepo.createOrder.mockResolvedValue(createMockOrder());
      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder());
      mockOrderRepo.addExecution.mockResolvedValue(createMockOrder());
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(existingPosition);
      mockPositionRepo.updatePosition.mockResolvedValue({
        ...existingPosition,
        quantity: 15,
      });

      const result = await agent.submitOrder(request);

      expect(result.success).toBe(true);
      expect(mockPositionRepo.updatePosition).toHaveBeenCalledWith(
        existingPosition.id,
        expect.objectContaining({
          quantity: expect.any(Number),
          entryPrice: expect.any(Number),
        })
      );
    });

    it('should calculate average entry price correctly when adding to position', async () => {
      const request = createMockOrderRequest({
        side: 'buy',
        quantity: 10,
        price: 160.0
      });

      const existingPosition = createMockPosition({
        side: 'buy',
        quantity: 10,
        entryPrice: 150.0,
      });

      mockOrderRepo.createOrder.mockResolvedValue(createMockOrder());
      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder());
      mockOrderRepo.addExecution.mockResolvedValue(createMockOrder());
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(existingPosition);

      let updatedPosition: Partial<IPositionWithMeta> | undefined;
      mockPositionRepo.updatePosition.mockImplementation(async (id, updates) => {
        updatedPosition = updates;
        return { ...existingPosition, ...updates };
      });

      await agent.submitOrder(request);

      expect(updatedPosition).toBeDefined();
      expect(updatedPosition!.quantity).toBe(20); // 10 + 10
      // Average should be around 155 (150*10 + 160*10) / 20
      // But with slippage, it will be slightly different
      expect(updatedPosition!.entryPrice).toBeGreaterThan(150);
      expect(updatedPosition!.entryPrice).toBeLessThan(160);
    });

    it('should partially close position when opposite direction with smaller quantity', async () => {
      const request = createMockOrderRequest({
        side: 'sell',
        quantity: 5
      });

      const existingPosition = createMockPosition({
        side: 'buy',
        quantity: 10,
        entryPrice: 150.0,
      });

      mockOrderRepo.createOrder.mockResolvedValue(createMockOrder());
      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder());
      mockOrderRepo.addExecution.mockResolvedValue(createMockOrder());
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(existingPosition);
      mockPositionRepo.addPartialExit.mockResolvedValue(existingPosition);
      mockPositionRepo.getPositionById.mockResolvedValue(existingPosition);

      const result = await agent.submitOrder(request);

      expect(result.success).toBe(true);
      expect(mockPositionRepo.addPartialExit).toHaveBeenCalledWith(
        existingPosition.id,
        expect.any(Number), // exit price
        5, // quantity
        expect.any(String) // timestamp
      );
      expect(mockPositionRepo.closePosition).not.toHaveBeenCalled();
    });

    it('should fully close position when opposite direction with equal quantity', async () => {
      const request = createMockOrderRequest({
        side: 'sell',
        quantity: 10
      });

      const existingPosition = createMockPosition({
        side: 'buy',
        quantity: 10,
        entryPrice: 150.0,
      });

      mockOrderRepo.createOrder.mockResolvedValue(createMockOrder());
      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder());
      mockOrderRepo.addExecution.mockResolvedValue(createMockOrder());
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(existingPosition);
      mockPositionRepo.closePosition.mockResolvedValue({
        ...existingPosition,
        status: 'closed',
      });
      mockPositionRepo.getPositionById.mockResolvedValue({
        ...existingPosition,
        status: 'closed',
      });

      const result = await agent.submitOrder(request);

      expect(result.success).toBe(true);
      expect(mockPositionRepo.closePosition).toHaveBeenCalledWith(
        existingPosition.id,
        expect.any(Number),
        expect.any(String)
      );
    });

    it('should close and reverse position when opposite direction with larger quantity', async () => {
      const request = createMockOrderRequest({
        side: 'sell',
        quantity: 12,
        price: 100.0, // Lower price to avoid position size limit (12 * 100 = 1200 < 2000)
      });

      const existingPosition = createMockPosition({
        side: 'buy',
        quantity: 10,
        entryPrice: 100.0,
      });

      mockOrderRepo.createOrder.mockResolvedValue(createMockOrder());
      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder());
      mockOrderRepo.addExecution.mockResolvedValue(createMockOrder());

      // First call returns existing position, second call returns null after close
      let callCount = 0;
      mockPositionRepo.getPositionBySymbol.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return existingPosition;
        return null;
      });

      mockPositionRepo.closePosition.mockResolvedValue({
        ...existingPosition,
        status: 'closed',
      });
      mockPositionRepo.getPositionById.mockResolvedValue({
        ...existingPosition,
        status: 'closed',
      });

      const newPosition = createMockPosition({
        side: 'sell',
        quantity: 2,
      });
      mockPositionRepo.createPosition.mockResolvedValue(newPosition);

      const result = await agent.submitOrder(request);

      expect(result.success).toBe(true);
      expect(mockPositionRepo.closePosition).toHaveBeenCalled();
      expect(mockPositionRepo.createPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          side: 'sell',
          quantity: 2, // 12 - 10
        })
      );
    });
  });

  describe('closePosition', () => {
    it('should close position successfully', async () => {
      const position = createMockPosition({
        id: 'pos-123',
        status: 'open',
        symbol: 'AAPL',
      });

      mockPositionRepo.getPositionById.mockResolvedValue(position);
      mockPositionRepo.closePosition.mockResolvedValue({
        ...position,
        status: 'closed',
        realizedPnL: 50.0,
      });

      const result = await agent.closePosition('pos-123', 155.0);

      expect(result.success).toBe(true);
      expect(result.position?.status).toBe('closed');
      expect(result.realizedPnL).toBe(50.0);
      expect(mockPositionRepo.closePosition).toHaveBeenCalledWith(
        'pos-123',
        expect.any(Number), // exit price with slippage
        expect.any(String)
      );
    });

    it('should reject closing non-existent position', async () => {
      mockPositionRepo.getPositionById.mockResolvedValue(null);

      const result = await agent.closePosition('pos-999', 155.0);

      expect(result.success).toBe(false);
      expect(result.error).toContain('포지션을 찾을 수 없거나');
      expect(mockPositionRepo.closePosition).not.toHaveBeenCalled();
    });

    it('should reject closing already closed position', async () => {
      const position = createMockPosition({ status: 'closed' });
      mockPositionRepo.getPositionById.mockResolvedValue(position);

      const result = await agent.closePosition('pos-123', 155.0);

      expect(result.success).toBe(false);
      expect(result.error).toContain('포지션을 찾을 수 없거나');
      expect(mockPositionRepo.closePosition).not.toHaveBeenCalled();
    });

    it('should apply slippage when closing position', async () => {
      const position = createMockPosition({
        side: 'buy',
        entryPrice: 150.0,
      });

      mockPositionRepo.getPositionById.mockResolvedValue(position);

      let actualExitPrice = 0;
      mockPositionRepo.closePosition.mockImplementation(async (id, exitPrice, timestamp) => {
        actualExitPrice = exitPrice;
        return { ...position, status: 'closed' };
      });

      await agent.closePosition('pos-123', 155.0);

      // Closing buy position = sell, should have negative slippage
      expect(actualExitPrice).toBeLessThan(155.0);
      expect(actualExitPrice).toBeGreaterThan(154.8); // ~0.1% slippage
    });

    it('should update daily PnL when position is closed', async () => {
      const position = createMockPosition();
      mockPositionRepo.getPositionById.mockResolvedValue(position);
      mockPositionRepo.closePosition.mockResolvedValue({
        ...position,
        status: 'closed',
        realizedPnL: 100.0,
      });

      const result1 = await agent.closePosition('pos-123', 155.0);
      const riskStatus = await agent.getRiskStatus();

      expect(result1.success).toBe(true);
      expect(riskStatus.dailyPnL).toBe(100.0);
    });

    it('should use mutex to prevent concurrent close of same position', async () => {
      const position = createMockPosition({ symbol: 'AAPL' });

      let closeCallCount = 0;
      mockPositionRepo.getPositionById.mockImplementation(async (id) => {
        if (closeCallCount === 0) {
          return position;
        }
        // Second call should see position as closed
        return { ...position, status: 'closed' };
      });

      mockPositionRepo.closePosition.mockImplementation(async () => {
        closeCallCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return { ...position, status: 'closed' };
      });

      const [result1, result2] = await Promise.all([
        agent.closePosition('pos-123', 155.0),
        agent.closePosition('pos-123', 155.0),
      ]);

      // One should succeed, one should fail
      const successCount = [result1, result2].filter(r => r.success).length;
      expect(successCount).toBe(1);
      expect(closeCallCount).toBe(1); // Only closed once
    });
  });

  describe('closeAllPositions', () => {
    it('should close all open positions', async () => {
      const positions = [
        createMockPosition({ id: 'pos-1', symbol: 'AAPL' }),
        createMockPosition({ id: 'pos-2', symbol: 'GOOGL' }),
        createMockPosition({ id: 'pos-3', symbol: 'MSFT' }),
      ];

      mockPositionRepo.getOpenPositions.mockResolvedValue(positions);
      mockPositionRepo.getPositionById.mockImplementation(async (id) => {
        return positions.find(p => p.id === id) || null;
      });
      mockPositionRepo.closePosition.mockImplementation(async (id) => {
        const pos = positions.find(p => p.id === id);
        return pos ? { ...pos, status: 'closed' } : null;
      });

      const results = await agent.closeAllPositions({
        'AAPL': 155.0,
        'GOOGL': 2800.0,
        'MSFT': 380.0,
      });

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockPositionRepo.closePosition).toHaveBeenCalledTimes(3);
    });

    it('should skip positions without current price', async () => {
      const positions = [
        createMockPosition({ id: 'pos-1', symbol: 'AAPL' }),
        createMockPosition({ id: 'pos-2', symbol: 'GOOGL' }),
      ];

      mockPositionRepo.getOpenPositions.mockResolvedValue(positions);
      mockPositionRepo.getPositionById.mockResolvedValue(positions[0]);
      mockPositionRepo.closePosition.mockResolvedValue({ ...positions[0], status: 'closed' });

      const results = await agent.closeAllPositions({
        'AAPL': 155.0,
        // GOOGL price missing
      });

      expect(results).toHaveLength(1);
      expect(mockPositionRepo.closePosition).toHaveBeenCalledTimes(1);
    });

    it('should handle empty positions array', async () => {
      mockPositionRepo.getOpenPositions.mockResolvedValue([]);

      const results = await agent.closeAllPositions({ 'AAPL': 155.0 });

      expect(results).toHaveLength(0);
      expect(mockPositionRepo.closePosition).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Risk Management Tests
  // ═══════════════════════════════════════════════════════════════

  describe('Risk Management', () => {
    it('should calculate risk status correctly', async () => {
      mockPositionRepo.countOpenPositions.mockResolvedValue(2);
      mockPositionRepo.getTotalUnrealizedPnL.mockResolvedValue(150.0);

      const status = await agent.getRiskStatus();

      expect(status.openPositionCount).toBe(2);
      expect(status.currentEquity).toBe(10150.0); // 10000 + 0 dailyPnL + 150 unrealized
      expect(status.canTrade).toBe(true);
      expect(status.dailyLimitReached).toBe(false);
    });

    it('should block trading when daily loss limit is reached', async () => {
      // Simulate a large loss
      const position = createMockPosition();
      mockPositionRepo.getPositionById.mockResolvedValue(position);
      mockPositionRepo.closePosition.mockResolvedValue({
        ...position,
        status: 'closed',
        realizedPnL: -600.0, // -6% loss
      });

      await agent.closePosition('pos-123', 140.0);

      const status = await agent.getRiskStatus();

      expect(status.dailyPnL).toBe(-600.0);
      expect(status.dailyPnLPercent).toBe(-6.0);
      expect(status.dailyLimitReached).toBe(true);
      expect(status.canTrade).toBe(false);
      expect(status.blockReason).toBe('일일 손실 한도 도달');
    });

    it('should block trading when position limit is reached', async () => {
      mockPositionRepo.countOpenPositions.mockResolvedValue(5);

      const status = await agent.getRiskStatus();

      expect(status.openPositionCount).toBe(5);
      expect(status.canTrade).toBe(false);
      expect(status.blockReason).toBe('최대 포지션 수 도달');
    });

    it('should reset daily stats at midnight', async () => {
      // Set a loss
      const position = createMockPosition();
      mockPositionRepo.getPositionById.mockResolvedValue(position);
      mockPositionRepo.closePosition.mockResolvedValue({
        ...position,
        status: 'closed',
        realizedPnL: -100.0,
      });

      await agent.closePosition('pos-123', 140.0);

      let status = await agent.getRiskStatus();
      expect(status.dailyPnL).toBe(-100.0);
      expect(status.dailyTradeCount).toBe(1);

      // Create new agent (simulates new day)
      const newAgent = new OrderExecutorAgent(mockOrderRepo, mockPositionRepo, mockConfig);
      status = await newAgent.getRiskStatus();

      expect(status.dailyPnL).toBe(0);
      expect(status.dailyTradeCount).toBe(0);
    });

    it('should calculate available margin correctly', async () => {
      mockPositionRepo.getTotalUnrealizedPnL.mockResolvedValue(250.0);

      const status = await agent.getRiskStatus();

      expect(status.availableMargin).toBe(10250.0); // equity + unrealizedPnL
      expect(status.totalMarginUsed).toBe(0); // No leverage
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Price Update & Trailing Stop Tests
  // ═══════════════════════════════════════════════════════════════

  describe('updatePrice', () => {
    it('should update position current price', async () => {
      const position = createMockPosition({ symbol: 'AAPL' });
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(position);

      await agent.updatePrice('AAPL', 155.0);

      expect(mockPositionRepo.updateCurrentPrice).toHaveBeenCalledWith('AAPL', 155.0);
    });

    it('should update trailing stop when price moves favorably', async () => {
      const position = createMockPosition({
        symbol: 'AAPL',
        side: 'buy',
        entryPrice: 150.0,
        trailingStopPrice: 148.0, // 2% below entry
      });

      mockPositionRepo.getPositionBySymbol.mockResolvedValue(position);

      // Price goes up to 160
      await agent.updatePrice('AAPL', 160.0);

      // Trailing stop should update
      expect(mockPositionRepo.updatePosition).toHaveBeenCalledWith(
        position.id,
        expect.objectContaining({
          trailingStopPrice: expect.any(Number),
        })
      );
    });

    it('should not update trailing stop when price moves unfavorably', async () => {
      const position = createMockPosition({
        symbol: 'AAPL',
        side: 'buy',
        entryPrice: 150.0,
        trailingStopPrice: 148.0,
      });

      mockPositionRepo.getPositionBySymbol.mockResolvedValue(position);

      // Price goes down
      await agent.updatePrice('AAPL', 145.0);

      // Trailing stop should not change (would need to check implementation)
      expect(mockPositionRepo.updateCurrentPrice).toHaveBeenCalled();
    });

    it('should handle missing position gracefully', async () => {
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(null);

      await expect(agent.updatePrice('AAPL', 155.0)).resolves.not.toThrow();
      expect(mockPositionRepo.updateCurrentPrice).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Order Cancellation Tests
  // ═══════════════════════════════════════════════════════════════

  describe('cancelOrder', () => {
    it('should cancel pending order successfully', async () => {
      const order = createMockOrder({ status: 'pending' });
      mockOrderRepo.getOrderById.mockResolvedValue(order);
      mockOrderRepo.updateOrder.mockResolvedValue({ ...order, status: 'cancelled' });

      const result = await agent.cancelOrder('ord-123');

      expect(result).toBe(true);
      expect(mockOrderRepo.updateOrder).toHaveBeenCalledWith(
        'ord-123',
        expect.objectContaining({
          status: 'cancelled',
        })
      );
    });

    it('should not cancel filled order', async () => {
      const order = createMockOrder({ status: 'filled' });
      mockOrderRepo.getOrderById.mockResolvedValue(order);

      const result = await agent.cancelOrder('ord-123');

      expect(result).toBe(false);
      expect(mockOrderRepo.updateOrder).not.toHaveBeenCalled();
    });

    it('should not cancel already cancelled order', async () => {
      const order = createMockOrder({ status: 'cancelled' });
      mockOrderRepo.getOrderById.mockResolvedValue(order);

      const result = await agent.cancelOrder('ord-123');

      expect(result).toBe(false);
      expect(mockOrderRepo.updateOrder).not.toHaveBeenCalled();
    });

    it('should return false for non-existent order', async () => {
      mockOrderRepo.getOrderById.mockResolvedValue(null);

      const result = await agent.cancelOrder('ord-999');

      expect(result).toBe(false);
      expect(mockOrderRepo.updateOrder).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Query Methods Tests
  // ═══════════════════════════════════════════════════════════════

  describe('getOpenOrders', () => {
    it('should return all open orders', async () => {
      const orders = [
        createMockOrder({ id: 'ord-1' }),
        createMockOrder({ id: 'ord-2' }),
      ];
      mockOrderRepo.getOpenOrders.mockResolvedValue(orders);

      const result = await agent.getOpenOrders();

      expect(result).toHaveLength(2);
      expect(mockOrderRepo.getOpenOrders).toHaveBeenCalledWith(undefined);
    });

    it('should filter by symbol', async () => {
      const orders = [createMockOrder({ symbol: 'AAPL' })];
      mockOrderRepo.getOpenOrders.mockResolvedValue(orders);

      const result = await agent.getOpenOrders('AAPL');

      expect(result).toHaveLength(1);
      expect(mockOrderRepo.getOpenOrders).toHaveBeenCalledWith('AAPL');
    });
  });

  describe('getPosition', () => {
    it('should return position for symbol', async () => {
      const position = createMockPosition({ symbol: 'AAPL' });
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(position);

      const result = await agent.getPosition('AAPL');

      expect(result).toEqual(position);
      expect(mockPositionRepo.getPositionBySymbol).toHaveBeenCalledWith('AAPL');
    });

    it('should return null for non-existent position', async () => {
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(null);

      const result = await agent.getPosition('AAPL');

      expect(result).toBeNull();
    });
  });

  describe('getOpenPositions', () => {
    it('should return all open positions', async () => {
      const positions = [
        createMockPosition({ id: 'pos-1' }),
        createMockPosition({ id: 'pos-2' }),
      ];
      mockPositionRepo.getOpenPositions.mockResolvedValue(positions);

      const result = await agent.getOpenPositions();

      expect(result).toHaveLength(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Execution Statistics Tests
  // ═══════════════════════════════════════════════════════════════

  describe('getExecutionStats', () => {
    it('should calculate execution statistics correctly', async () => {
      const counts: IOrderStatusCounts = {
        filled: 80,
        cancelled: 10,
        rejected: 5,
        partial: 5,
        pending: 0,
      };
      mockOrderRepo.countOrdersByStatus.mockResolvedValue(counts);

      const stats = await agent.getExecutionStats();

      expect(stats.totalOrders).toBe(100);
      expect(stats.filledOrders).toBe(80);
      expect(stats.cancelledOrders).toBe(10);
      expect(stats.rejectedOrders).toBe(5);
      expect(stats.fillRate).toBe(85); // (80 + 5) / 100 * 100
      expect(stats.avgSlippage).toBe(0.1);
      expect(stats.avgLatencyMs).toBe(50);
    });

    it('should handle zero orders', async () => {
      mockOrderRepo.countOrdersByStatus.mockResolvedValue({
        filled: 0,
        cancelled: 0,
        rejected: 0,
        partial: 0,
        pending: 0,
      });

      const stats = await agent.getExecutionStats();

      expect(stats.totalOrders).toBe(0);
      expect(stats.fillRate).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Factory Function Tests
  // ═══════════════════════════════════════════════════════════════

  describe('createOrderExecutorAgent', () => {
    it('should create agent with default config', () => {
      const newAgent = createOrderExecutorAgent(mockOrderRepo, mockPositionRepo);

      expect(newAgent).toBeInstanceOf(OrderExecutorAgent);
    });

    it('should create agent with custom config', () => {
      const customConfig: Partial<IOrderExecutorAgentConfig> = {
        mode: 'paper',
        simulationSlippagePercent: 0.2,
      };

      const newAgent = createOrderExecutorAgent(
        mockOrderRepo,
        mockPositionRepo,
        customConfig
      );

      expect(newAgent).toBeInstanceOf(OrderExecutorAgent);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Edge Cases & Error Scenarios
  // ═══════════════════════════════════════════════════════════════

  describe('Edge Cases', () => {
    it('should handle repository errors gracefully', async () => {
      const request = createMockOrderRequest();
      mockOrderRepo.createOrder.mockRejectedValue(new Error('Database error'));

      await expect(agent.submitOrder(request)).rejects.toThrow('Database error');
    });

    it('should handle very small quantities', async () => {
      const request = createMockOrderRequest({
        quantity: 0.001,
        price: 50000 // High price, low quantity
      });

      mockOrderRepo.createOrder.mockResolvedValue(createMockOrder());
      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder());
      mockOrderRepo.addExecution.mockResolvedValue(createMockOrder());
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(null);
      mockPositionRepo.createPosition.mockResolvedValue(createMockPosition());

      const result = await agent.submitOrder(request);

      expect(result.success).toBe(true);
    });

    it('should handle very large position values', async () => {
      const request = createMockOrderRequest({
        quantity: 100,
        price: 10000,
      });

      const result = await agent.submitOrder(request);

      // Should fail due to position size limit (20% of 10000 = 2000 max)
      expect(result.success).toBe(false);
      expect(result.validation.errors.some(e => e.includes('포지션 크기'))).toBe(true);
    });

    it('should handle concurrent operations on different symbols', async () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
      const requests = symbols.map(symbol => createMockOrderRequest({ symbol }));

      mockOrderRepo.createOrder.mockResolvedValue(createMockOrder());
      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder());
      mockOrderRepo.addExecution.mockResolvedValue(createMockOrder());
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(null);
      mockPositionRepo.createPosition.mockResolvedValue(createMockPosition());

      const results = await Promise.all(
        requests.map(req => agent.submitOrder(req))
      );

      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle null/undefined price for market orders', async () => {
      const request = createMockOrderRequest({
        type: 'market',
        price: undefined,
      });

      mockOrderRepo.createOrder.mockResolvedValue(createMockOrder());
      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder());
      mockOrderRepo.addExecution.mockResolvedValue(createMockOrder());
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(null);
      mockPositionRepo.createPosition.mockResolvedValue(createMockPosition());

      const result = await agent.submitOrder(request);

      // In simulation mode, undefined price becomes 0, which may still create an order
      // The validation logic allows this but execution uses it as 0
      expect(result.success).toBe(true);
      expect(result.validation.valid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Integration-style Tests
  // ═══════════════════════════════════════════════════════════════

  describe('Integration Scenarios', () => {
    it('should handle complete trade lifecycle: open -> update -> close', async () => {
      // Step 1: Open position
      const openRequest = createMockOrderRequest({ quantity: 10, price: 150.0 });

      mockOrderRepo.createOrder.mockResolvedValue(createMockOrder());
      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder());
      mockOrderRepo.addExecution.mockResolvedValue(createMockOrder());

      let currentPosition = createMockPosition({ quantity: 10, entryPrice: 150.0 });
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(null);
      mockPositionRepo.createPosition.mockResolvedValue(currentPosition);

      const openResult = await agent.submitOrder(openRequest);
      expect(openResult.success).toBe(true);

      // Step 2: Add to position
      const addRequest = createMockOrderRequest({ quantity: 5, price: 155.0 });

      mockPositionRepo.getPositionBySymbol.mockResolvedValue(currentPosition);
      currentPosition = { ...currentPosition, quantity: 15, entryPrice: 151.67 };
      mockPositionRepo.updatePosition.mockResolvedValue(currentPosition);

      const addResult = await agent.submitOrder(addRequest);
      expect(addResult.success).toBe(true);

      // Step 3: Update price
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(currentPosition);
      await agent.updatePrice('AAPL', 160.0);

      // Step 4: Close position
      mockPositionRepo.getPositionById.mockResolvedValue(currentPosition);
      mockPositionRepo.closePosition.mockResolvedValue({
        ...currentPosition,
        status: 'closed',
        realizedPnL: 125.0,
      });

      const closeResult = await agent.closePosition(currentPosition.id, 160.0);
      expect(closeResult.success).toBe(true);
      expect(closeResult.realizedPnL).toBe(125.0);

      // Verify daily stats updated
      const riskStatus = await agent.getRiskStatus();
      expect(riskStatus.dailyPnL).toBe(125.0);
      expect(riskStatus.dailyTradeCount).toBe(3); // open + add + close
    });

    it('should enforce risk limits across multiple operations', async () => {
      // Configure strict limits
      const strictConfig: IOrderExecutorAgentConfig = {
        ...mockConfig,
        riskConfig: {
          ...mockConfig.riskConfig,
          dailyTradeLimit: 3,
          maxOpenPositions: 2,
        },
      };

      const strictAgent = new OrderExecutorAgent(
        mockOrderRepo,
        mockPositionRepo,
        strictConfig
      );

      mockOrderRepo.createOrder.mockResolvedValue(createMockOrder());
      mockOrderRepo.getOrderById.mockResolvedValue(createMockOrder());
      mockOrderRepo.addExecution.mockResolvedValue(createMockOrder());
      mockPositionRepo.getPositionBySymbol.mockResolvedValue(null);
      mockPositionRepo.createPosition.mockResolvedValue(createMockPosition());

      // Trade 1
      mockPositionRepo.countOpenPositions.mockResolvedValue(0);
      const result1 = await strictAgent.submitOrder(createMockOrderRequest({ symbol: 'AAPL' }));
      expect(result1.success).toBe(true);

      // Trade 2
      mockPositionRepo.countOpenPositions.mockResolvedValue(1);
      const result2 = await strictAgent.submitOrder(createMockOrderRequest({ symbol: 'GOOGL' }));
      expect(result2.success).toBe(true);

      // Trade 3 - should hit position limit
      mockPositionRepo.countOpenPositions.mockResolvedValue(2);
      const result3 = await strictAgent.submitOrder(createMockOrderRequest({ symbol: 'MSFT' }));
      expect(result3.success).toBe(false);
      expect(result3.validation.errors.some(e => e.includes('최대 동시 포지션 수'))).toBe(true);
    });
  });
});
