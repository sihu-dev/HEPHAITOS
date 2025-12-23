/**
 * HEPHAITOS - Order Executor Agent
 * L3 (Tissues) - 주문 실행 에이전트
 * P1 FIX: Mutex 도입으로 Race Condition 방지
 *
 * ⚠️ 면책조항 (DISCLAIMER)
 * 본 시스템은 교육 및 시뮬레이션 목적입니다.
 * 실제 투자 조언이 아니며, 투자 결정에 따른 손실은 본인 책임입니다.
 *
 * ┌────────────────────────────────────────────────────────────────┐
 * │                   주문 실행 워크플로우                           │
 * ├────────────────────────────────────────────────────────────────┤
 * │                                                                │
 * │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
 * │  │   VALIDATE  │───▶│   SUBMIT    │───▶│   EXECUTE   │        │
 * │  │  주문 검증   │    │  주문 제출   │    │  주문 체결   │        │
 * │  └─────────────┘    └─────────────┘    └─────────────┘        │
 * │                                               │                │
 * │                     ┌─────────────┐           │                │
 * │                     │   UPDATE    │◀──────────┘                │
 * │                     │ 포지션 갱신  │                            │
 * │                     └─────────────┘                            │
 * │                            │                                   │
 * │                     ┌─────────────┐                            │
 * │                     │   MONITOR   │                            │
 * │                     │  SL/TP 감시  │                            │
 * │                     └─────────────┘                            │
 * │                                                                │
 * └────────────────────────────────────────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════════
// P1 FIX: Simple Mutex for Race Condition Prevention
// ═══════════════════════════════════════════════════════════════════

/**
 * 심볼 기반 Mutex 클래스
 * 동일 심볼에 대한 동시 주문/청산 방지
 */
class SymbolMutex {
  private locks: Map<string, Promise<void>> = new Map();

  /**
   * 심볼에 대한 잠금 획득
   * @param symbol 잠금할 심볼 (또는 'global' 전체 잠금)
   * @returns 잠금 해제 함수
   */
  async acquire(symbol: string): Promise<() => void> {
    // 기존 잠금이 있으면 대기
    while (this.locks.has(symbol)) {
      await this.locks.get(symbol);
    }

    // 새 잠금 생성
    let release: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.locks.set(symbol, lockPromise);

    // 잠금 해제 함수 반환
    return () => {
      this.locks.delete(symbol);
      release!();
    };
  }

  /**
   * 잠금 상태 확인
   */
  isLocked(symbol: string): boolean {
    return this.locks.has(symbol);
  }

  /**
   * 잠금된 심볼 목록
   */
  getLockedSymbols(): string[] {
    return Array.from(this.locks.keys());
  }
}

import type {
  IOrderRequest,
  IOrderWithMeta,
  IOrderExecution,
  IPositionWithMeta,
  IRiskConfig,
  IRiskStatus,
  IExecutionStats,
  ExecutionMode,
  OrderSide,
  ITrade,
} from '@hephaitos/types';
import { DEFAULT_RISK_CONFIG } from '@hephaitos/types';
import {
  calculateUnrealizedPnL,
  calculateAvgEntryPrice,
  updateTrailingStopPrice,
  validateOrder,
  simulateSlippage,
  calculateSlippage,
  type IOrderValidation,
} from '@hephaitos/utils';

// ═══════════════════════════════════════════════════════════════════
// Temporary Repository Interfaces (until core package is fully extended)
// Agent expects raw values, not IResult wrappers
// ═══════════════════════════════════════════════════════════════════

interface IOrderStatusCounts {
  filled: number;
  cancelled: number;
  rejected: number;
  partial: number;
  pending: number;
}

interface IOrderRepository {
  createOrder(order: IOrderWithMeta): Promise<IOrderWithMeta>;
  getOrderById(id: string): Promise<IOrderWithMeta | null>;
  updateOrder(id: string, updates: Partial<IOrderWithMeta>): Promise<IOrderWithMeta>;
  addExecution(orderId: string, execution: IOrderExecution): Promise<IOrderWithMeta>;
  getOpenOrders(symbol?: string): Promise<IOrderWithMeta[]>;
  countOrdersByStatus(): Promise<IOrderStatusCounts>;
}

interface IPositionRepository {
  createPosition(position: IPositionWithMeta): Promise<IPositionWithMeta>;
  getPositionById(id: string): Promise<IPositionWithMeta | null>;
  getPositionBySymbol(symbol: string): Promise<IPositionWithMeta | null>;
  getOpenPositions(): Promise<IPositionWithMeta[]>;
  updatePosition(id: string, updates: Partial<IPositionWithMeta>): Promise<IPositionWithMeta>;
  closePosition(id: string, exitPrice: number, exitTime: string): Promise<IPositionWithMeta>;
  addPartialExit(positionId: string, price: number, quantity: number, timestamp: string): Promise<IPositionWithMeta>;
  countOpenPositions(): Promise<number>;
  updateCurrentPrice(symbol: string, price: number): Promise<void>;
  getTotalUnrealizedPnL(): Promise<number>;
}

/**
 * 주문 실행기 설정
 */
export interface IOrderExecutorAgentConfig {
  /** 실행 모드 */
  mode: ExecutionMode;
  /** 리스크 설정 */
  riskConfig: IRiskConfig;
  /** 시뮬레이션 슬리피지 (%) */
  simulationSlippagePercent: number;
  /** 시뮬레이션 수수료 (%) */
  simulationFeePercent: number;
  /** 시뮬레이션 지연 (ms) */
  simulationLatencyMs: number;
}

/**
 * 주문 제출 결과
 */
export interface IOrderSubmitResult {
  /** 성공 여부 */
  success: boolean;
  /** 주문 (성공 시) */
  order?: IOrderWithMeta;
  /** 포지션 (생성/업데이트 시) */
  position?: IPositionWithMeta;
  /** 검증 결과 */
  validation: IOrderValidation;
  /** 오류 메시지 */
  error?: string;
}

/**
 * 포지션 청산 결과
 */
export interface IClosePositionResult {
  /** 성공 여부 */
  success: boolean;
  /** 청산된 포지션 */
  position?: IPositionWithMeta;
  /** 실현 손익 */
  realizedPnL?: number;
  /** 오류 메시지 */
  error?: string;
}

/**
 * 주문 실행 에이전트
 */
export class OrderExecutorAgent {
  private readonly config: IOrderExecutorAgentConfig;
  private readonly orderRepo: IOrderRepository;
  private readonly positionRepo: IPositionRepository;

  /** P1 FIX: 심볼 기반 Mutex로 Race Condition 방지 */
  private readonly symbolMutex: SymbolMutex = new SymbolMutex();

  /** 일일 통계 */
  private dailyPnL: number = 0;
  private dailyTradeCount: number = 0;
  private dailyStartDate: string = '';

  constructor(
    orderRepo: IOrderRepository,
    positionRepo: IPositionRepository,
    config: Partial<IOrderExecutorAgentConfig> = {}
  ) {
    this.orderRepo = orderRepo;
    this.positionRepo = positionRepo;
    this.config = {
      mode: 'simulation',
      riskConfig: DEFAULT_RISK_CONFIG,
      simulationSlippagePercent: 0.1,
      simulationFeePercent: 0.1,
      simulationLatencyMs: 50,
      ...config,
    };

    this.resetDailyStats();
  }

  // ═══════════════════════════════════════════════════════════════
  // 주문 관리
  // ═══════════════════════════════════════════════════════════════

  /**
   * 주문 제출
   * P1 FIX: Mutex로 동일 심볼 동시 주문 방지
   */
  async submitOrder(request: IOrderRequest): Promise<IOrderSubmitResult> {
    // P1 FIX: 심볼 잠금 획득
    const release = await this.symbolMutex.acquire(request.symbol);

    try {
      // 일일 한도 체크
      this.checkDailyReset();

      // 현재 가격 (시뮬레이션에서는 요청 가격 사용)
      const currentPrice = request.price ?? 0;

      // 포지션 수 조회
      const openPositionCount = await this.positionRepo.countOpenPositions();

      // 주문 검증
      const validation = validateOrder(
        request,
        this.config.riskConfig,
        currentPrice,
        this.config.riskConfig.accountEquity + this.dailyPnL,
        openPositionCount
      );

      if (!validation.valid) {
        return {
          success: false,
          validation,
          error: validation.errors.join(', '),
        };
      }

      // 일일 거래 한도 체크
      if (this.dailyTradeCount >= this.config.riskConfig.dailyTradeLimit) {
        validation.errors.push('일일 거래 횟수 한도 초과');
        return {
          success: false,
          validation,
          error: '일일 거래 횟수 한도 초과',
        };
      }

      // 일일 손실 한도 체크
      const dailyLossPercent =
        (this.dailyPnL / this.config.riskConfig.accountEquity) * 100;
      if (dailyLossPercent <= -this.config.riskConfig.dailyLossLimit) {
        validation.errors.push('일일 손실 한도 도달');
        return {
          success: false,
          validation,
          error: '일일 손실 한도 도달',
        };
      }

      // 주문 생성
      const order = this.createOrderFromRequest(request);
      await this.orderRepo.createOrder(order);

      // 시뮬레이션 즉시 체결
      if (this.config.mode === 'simulation' || this.config.mode === 'paper') {
        const execution = await this.simulateExecution(order, currentPrice);
        await this.orderRepo.addExecution(order.id, execution);

        // 포지션 업데이트
        const position = await this.updatePositionFromExecution(order, execution);

        this.dailyTradeCount++;

        return {
          success: true,
          order: await this.orderRepo.getOrderById(order.id) ?? order,
          position,
          validation,
        };
      }

      return {
        success: true,
        order,
        validation,
      };
    } finally {
      // P1 FIX: 반드시 잠금 해제
      release();
    }
  }

  /**
   * 주문 취소
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    const order = await this.orderRepo.getOrderById(orderId);
    if (!order) return false;

    if (order.status === 'filled' || order.status === 'cancelled') {
      return false;
    }

    await this.orderRepo.updateOrder(orderId, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });

    return true;
  }

  /**
   * 미체결 주문 조회
   */
  async getOpenOrders(symbol?: string): Promise<IOrderWithMeta[]> {
    return this.orderRepo.getOpenOrders(symbol);
  }

  // ═══════════════════════════════════════════════════════════════
  // 포지션 관리
  // ═══════════════════════════════════════════════════════════════

  /**
   * 포지션 조회
   */
  async getPosition(symbol: string): Promise<IPositionWithMeta | null> {
    return this.positionRepo.getPositionBySymbol(symbol);
  }

  /**
   * 열린 포지션 목록
   */
  async getOpenPositions(): Promise<IPositionWithMeta[]> {
    return this.positionRepo.getOpenPositions();
  }

  /**
   * 포지션 청산
   * P1 FIX: Mutex로 동일 심볼 동시 청산 방지
   */
  async closePosition(
    positionId: string,
    exitPrice: number
  ): Promise<IClosePositionResult> {
    const position = await this.positionRepo.getPositionById(positionId);
    if (!position || position.status !== 'open') {
      return {
        success: false,
        error: '포지션을 찾을 수 없거나 이미 청산되었습니다',
      };
    }

    // P1 FIX: 심볼 잠금 획득
    const release = await this.symbolMutex.acquire(position.symbol);

    try {
      // 잠금 획득 후 상태 재확인 (다른 요청에 의해 청산되었을 수 있음)
      const currentPosition = await this.positionRepo.getPositionById(positionId);
      if (!currentPosition || currentPosition.status !== 'open') {
        return {
          success: false,
          error: '포지션이 이미 청산되었습니다',
        };
      }

      // 슬리피지 적용 (청산 방향 = 진입 반대)
      const exitSide: OrderSide = currentPosition.side === 'buy' ? 'sell' : 'buy';
      const actualExitPrice = simulateSlippage(
        exitPrice,
        exitSide,
        this.config.simulationSlippagePercent
      );

      // 청산
      const closed = await this.positionRepo.closePosition(
        positionId,
        actualExitPrice,
        new Date().toISOString()
      );

      if (closed) {
        // 일일 PnL 업데이트
        this.dailyPnL += closed.realizedPnL ?? 0;
        this.dailyTradeCount++;

        return {
          success: true,
          position: closed,
          realizedPnL: closed.realizedPnL,
        };
      }

      return {
        success: false,
        error: '포지션 청산 실패',
      };
    } finally {
      // P1 FIX: 반드시 잠금 해제
      release();
    }
  }

  /**
   * 모든 포지션 청산
   */
  async closeAllPositions(
    currentPrices: Record<string, number>
  ): Promise<IClosePositionResult[]> {
    const positions = await this.positionRepo.getOpenPositions();
    const results: IClosePositionResult[] = [];

    for (const position of positions) {
      const exitPrice = currentPrices[position.symbol];
      if (exitPrice) {
        const result = await this.closePosition(position.id, exitPrice);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * 가격 업데이트 (실시간 PnL 계산용)
   */
  async updatePrice(symbol: string, currentPrice: number): Promise<void> {
    await this.positionRepo.updateCurrentPrice(symbol, currentPrice);

    // 추적 손절 업데이트
    const position = await this.positionRepo.getPositionBySymbol(symbol);
    if (position?.trailingStopPrice) {
      const newStopPrice = updateTrailingStopPrice(
        currentPrice,
        position.trailingStopPrice,
        position.side,
        this.config.riskConfig.defaultStopLossPercent
      );

      if (newStopPrice !== position.trailingStopPrice) {
        await this.positionRepo.updatePosition(position.id, {
          trailingStopPrice: newStopPrice,
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 리스크 상태
  // ═══════════════════════════════════════════════════════════════

  /**
   * 리스크 상태 조회
   */
  async getRiskStatus(): Promise<IRiskStatus> {
    this.checkDailyReset();

    const openPositionCount = await this.positionRepo.countOpenPositions();
    const totalUnrealizedPnL = await this.positionRepo.getTotalUnrealizedPnL();

    const currentEquity =
      this.config.riskConfig.accountEquity + this.dailyPnL + totalUnrealizedPnL;

    const dailyPnLPercent =
      (this.dailyPnL / this.config.riskConfig.accountEquity) * 100;

    const dailyLimitReached =
      dailyPnLPercent <= -this.config.riskConfig.dailyLossLimit;

    const tradeLimitReached =
      this.dailyTradeCount >= this.config.riskConfig.dailyTradeLimit;

    const positionLimitReached =
      openPositionCount >= this.config.riskConfig.maxOpenPositions;

    const canTrade =
      !dailyLimitReached && !tradeLimitReached && !positionLimitReached;

    let blockReason: string | undefined;
    if (!canTrade) {
      if (dailyLimitReached) blockReason = '일일 손실 한도 도달';
      else if (tradeLimitReached) blockReason = '일일 거래 횟수 한도 도달';
      else if (positionLimitReached) blockReason = '최대 포지션 수 도달';
    }

    return {
      currentEquity,
      dailyPnL: this.dailyPnL,
      dailyPnLPercent,
      dailyTradeCount: this.dailyTradeCount,
      openPositionCount,
      totalMarginUsed: 0, // 레버리지 미사용 시 0
      availableMargin: currentEquity,
      dailyLimitReached,
      canTrade,
      blockReason,
      openPositions: openPositionCount,
      maxPositions: this.config.riskConfig.maxPositions,
      maxDailyTrades: this.config.riskConfig.maxDailyTrades,
      isWithinLimits: canTrade && !dailyLimitReached,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 통계
  // ═══════════════════════════════════════════════════════════════

  /**
   * 실행 통계 조회
   */
  async getExecutionStats(): Promise<IExecutionStats> {
    const counts = await this.orderRepo.countOrdersByStatus();

    const totalOrders =
      counts.filled + counts.cancelled + counts.rejected + counts.partial;
    const fillRate =
      totalOrders > 0
        ? ((counts.filled + counts.partial) / totalOrders) * 100
        : 0;

    return {
      totalOrders,
      filledOrders: counts.filled,
      cancelledOrders: counts.cancelled,
      rejectedOrders: counts.rejected,
      fillRate,
      avgSlippage: this.config.simulationSlippagePercent, // 시뮬레이션에서는 설정값
      totalFees: 0, // 별도 집계 필요
      avgLatencyMs: this.config.simulationLatencyMs,
      winningTrades: 0, // TODO: 포지션 데이터에서 계산
      losingTrades: 0, // TODO: 포지션 데이터에서 계산
      winRate: 0, // TODO: 포지션 데이터에서 계산
      bySymbol: {},
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // Private Helpers
  // ═══════════════════════════════════════════════════════════════

  private createOrderFromRequest(request: IOrderRequest): IOrderWithMeta {
    const now = new Date().toISOString();

    return {
      id: `ord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol: request.symbol,
      side: request.side,
      type: request.type,
      quantity: request.quantity,
      price: request.price,
      stopPrice: request.stopPrice,
      filledQuantity: 0,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      executions: [],
      totalFees: 0,
      mode: this.config.mode,
    };
  }

  private async simulateExecution(
    order: IOrderWithMeta,
    requestedPrice: number
  ): Promise<IOrderExecution> {
    // 슬리피지 적용
    const executedPrice = simulateSlippage(
      requestedPrice,
      order.side,
      this.config.simulationSlippagePercent
    );

    const { slippage, slippagePercent } = calculateSlippage(
      requestedPrice,
      executedPrice
    );

    // 수수료 계산
    const value = order.quantity * executedPrice;
    const fee = value * (this.config.simulationFeePercent / 100);

    const trade: ITrade = {
      id: `trd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: executedPrice,
      value,
      fee,
      feeCurrency: 'USD',
      executedAt: new Date().toISOString(),
    };

    return {
      id: `exe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.id,
      trade,
      mode: this.config.mode,
      slippage,
      slippagePercent,
      requestedPrice,
      executedPrice,
      latencyMs: this.config.simulationLatencyMs,
      executedAt: new Date().toISOString(),
      quantity: trade.quantity,
      price: trade.price,
    };
  }

  private async updatePositionFromExecution(
    order: IOrderWithMeta,
    execution: IOrderExecution
  ): Promise<IPositionWithMeta> {
    const existingPosition = await this.positionRepo.getPositionBySymbol(
      order.symbol
    );

    if (existingPosition && existingPosition.status === 'open') {
      // 기존 포지션 업데이트 (추가 매수/매도 또는 반대 방향)
      if (existingPosition.side === order.side) {
        // 같은 방향: 추가 매수/매도
        const newAvgPrice = calculateAvgEntryPrice(
          existingPosition.quantity,
          existingPosition.entryPrice,
          order.quantity,
          execution.executedPrice
        );

        const updated = await this.positionRepo.updatePosition(
          existingPosition.id,
          {
            quantity: existingPosition.quantity + order.quantity,
            entryPrice: newAvgPrice,
            totalFees: existingPosition.totalFees + execution.trade.fee,
          }
        );

        return updated ?? existingPosition;
      } else {
        // 반대 방향: 청산 또는 반전
        if (order.quantity >= existingPosition.quantity) {
          // 전량 청산 또는 초과
          await this.positionRepo.closePosition(
            existingPosition.id,
            execution.executedPrice,
            new Date().toISOString()
          );

          // 초과분이 있으면 새 포지션
          const remainingQty = order.quantity - existingPosition.quantity;
          if (remainingQty > 0) {
            return this.createNewPosition(order, execution, remainingQty);
          }

          return (await this.positionRepo.getPositionById(
            existingPosition.id
          ))!;
        } else {
          // 부분 청산
          await this.positionRepo.addPartialExit(
            existingPosition.id,
            execution.executedPrice,
            order.quantity,
            new Date().toISOString()
          );

          return (await this.positionRepo.getPositionById(
            existingPosition.id
          ))!;
        }
      }
    }

    // 새 포지션 생성
    return this.createNewPosition(order, execution, order.quantity);
  }

  private async createNewPosition(
    order: IOrderWithMeta,
    execution: IOrderExecution,
    quantity: number
  ): Promise<IPositionWithMeta> {
    const { pnl, pnlPercent } = calculateUnrealizedPnL(
      execution.executedPrice,
      execution.executedPrice,
      quantity,
      order.side
    );

    const position: IPositionWithMeta = {
      id: `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol: order.symbol,
      side: order.side,
      quantity,
      entryPrice: execution.executedPrice,
      currentPrice: execution.executedPrice,
      unrealizedPnL: pnl,
      unrealizedPnLPercent: pnlPercent,
      status: 'open',
      enteredAt: new Date().toISOString(),
      originOrderId: order.id,
      strategyId: order.strategyId,
      partialExits: [],
      mae: 0,
      mfe: 0,
      totalFees: execution.trade.fee,
    };

    return this.positionRepo.createPosition(position);
  }

  private checkDailyReset(): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.dailyStartDate !== today) {
      this.resetDailyStats();
    }
  }

  private resetDailyStats(): void {
    this.dailyPnL = 0;
    this.dailyTradeCount = 0;
    this.dailyStartDate = new Date().toISOString().split('T')[0];
  }
}

/**
 * 주문 실행 에이전트 팩토리
 */
export function createOrderExecutorAgent(
  orderRepo: IOrderRepository,
  positionRepo: IPositionRepository,
  config?: Partial<IOrderExecutorAgentConfig>
): OrderExecutorAgent {
  return new OrderExecutorAgent(orderRepo, positionRepo, config);
}
