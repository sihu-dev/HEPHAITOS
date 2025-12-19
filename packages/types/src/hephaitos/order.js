/**
 * @ioblock/types - HEPHAITOS Order Execution Types
 * L0 (Atoms) - 주문 실행 관련 확장 타입 정의
 *
 * 기본 주문/포지션 타입은 trade.ts에 정의됨
 * 여기서는 실행 관련 확장 타입만 정의
 */
// ═══════════════════════════════════════════════════════════════
// 기본 설정
// ═══════════════════════════════════════════════════════════════
/**
 * 기본 리스크 설정
 */
export const DEFAULT_RISK_CONFIG = {
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
/**
 * 시뮬레이션 기본 설정
 */
export const DEFAULT_SIMULATION_CONFIG = {
    /** 기본 슬리피지 (%) */
    slippagePercent: 0.1,
    /** 기본 수수료 (%) */
    feePercent: 0.1,
    /** 기본 지연 (ms) */
    latencyMs: 50,
    /** 부분 체결 확률 */
    partialFillProbability: 0.1,
};
//# sourceMappingURL=order.js.map