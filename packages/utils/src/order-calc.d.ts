/**
 * @hephaitos/utils - Order Calculation Utilities
 * L1 (Molecules) - 주문 계산 유틸리티
 *
 * 포지션 사이징, 리스크 계산, 손익 계산 등
 */
import type { OrderSide, PositionSizingMethod, IRiskConfig, IOrderRequest } from '@hephaitos/types';
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
export declare function calculatePositionSize(input: IPositionSizeInput): IPositionSizeResult;
/**
 * 필요 마진 계산
 */
export declare function calculateRequiredMargin(positionValue: number, leverage: number): number;
/**
 * 현재 레버리지 계산
 */
export declare function calculateLeverage(positionValue: number, equity: number): number;
/**
 * 청산가 계산
 */
export declare function calculateLiquidationPrice(entryPrice: number, leverage: number, side: OrderSide, maintenanceMarginRate?: number): number;
/**
 * 손절가 계산 (비율 기반)
 */
export declare function calculateStopLossPrice(entryPrice: number, side: OrderSide, stopLossPercent: number): number;
/**
 * ATR 기반 손절가 계산
 */
export declare function calculateATRStopLoss(entryPrice: number, side: OrderSide, atr: number, multiplier?: number): number;
/**
 * 익절가 계산 (비율 기반)
 */
export declare function calculateTakeProfitPrice(entryPrice: number, side: OrderSide, takeProfitPercent: number): number;
/**
 * R:R 비율 기반 익절가 계산
 */
export declare function calculateTakeProfitByRR(entryPrice: number, stopLossPrice: number, side: OrderSide, rrRatio: number): number;
/**
 * 추적 손절가 업데이트
 */
export declare function updateTrailingStopPrice(currentPrice: number, currentStopPrice: number, side: OrderSide, trailingPercent: number): number;
/**
 * 손익 계산
 */
export declare function calculatePnL(entryPrice: number, exitPrice: number, quantity: number, side: OrderSide): number;
/**
 * 손익률 계산 (%)
 */
export declare function calculatePnLPercent(entryPrice: number, exitPrice: number, side: OrderSide): number;
/**
 * 미실현 손익 계산
 */
export declare function calculateUnrealizedPnL(entryPrice: number, currentPrice: number, quantity: number, side: OrderSide): {
    pnl: number;
    pnlPercent: number;
};
/**
 * 평균 진입가 계산 (추가 매수/매도 시)
 */
export declare function calculateAvgEntryPrice(existingQuantity: number, existingAvgPrice: number, newQuantity: number, newPrice: number): number;
/**
 * R:R 비율 계산
 */
export declare function calculateRiskRewardRatio(entryPrice: number, stopLossPrice: number, takeProfitPrice: number): number;
/**
 * R 단위 손익 계산 (현재 손익이 몇 R인지)
 */
export declare function calculateRMultiple(entryPrice: number, stopLossPrice: number, currentPrice: number, side: OrderSide): number;
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
export declare function validateOrder(request: IOrderRequest, riskConfig: IRiskConfig, currentPrice: number, currentEquity: number, openPositionCount: number): IOrderValidation;
/**
 * 슬리피지 시뮬레이션
 */
export declare function simulateSlippage(requestedPrice: number, side: OrderSide, slippagePercent: number, volatilityMultiplier?: number): number;
/**
 * 실제 슬리피지 계산
 */
export declare function calculateSlippage(requestedPrice: number, executedPrice: number): {
    slippage: number;
    slippagePercent: number;
};
//# sourceMappingURL=order-calc.d.ts.map