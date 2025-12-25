/**
 * @hephaitos/core - Risk Management Service
 * L2 (Cells) - 리스크 관리 및 포지션 사이징 서비스
 */

import type {
  IResult,
  IRiskConfig,
  IRiskStatus,
  PositionSizingMethod,
  IStopLossOrder,
  ITakeProfitOrder,
  IPosition,
  DEFAULT_RISK_CONFIG,
} from '@hephaitos/types';

/**
 * 포지션 사이즈 계산 입력
 */
export interface IPositionSizeInput {
  /** 심볼 */
  symbol: string;
  /** 현재가 */
  currentPrice: number;
  /** 손절가 (옵션) */
  stopLossPrice?: number;
  /** ATR (Average True Range) */
  atr?: number;
  /** 승률 (Kelly criterion용) */
  winRate?: number;
  /** 평균 승패 비율 (Kelly criterion용) */
  avgWinLossRatio?: number;
}

/**
 * 포지션 사이즈 계산 결과
 */
export interface IPositionSizeResult {
  /** 권장 수량 */
  quantity: number;
  /** 포지션 가치 (USD) */
  positionValue: number;
  /** 리스크 금액 */
  riskAmount: number;
  /** 리스크 비율 (%) */
  riskPercent: number;
  /** 사용 마진 */
  marginUsed: number;
  /** 계산 방법 */
  method: PositionSizingMethod;
}

/**
 * 거래 검증 입력
 */
export interface ITradeValidationInput {
  /** 심볼 */
  symbol: string;
  /** 포지션 가치 */
  positionValue: number;
  /** 리스크 금액 */
  riskAmount: number;
}

/**
 * 거래 검증 결과
 */
export interface ITradeValidationResult {
  /** 거래 가능 여부 */
  allowed: boolean;
  /** 거부 사유 목록 */
  reasons: string[];
  /** 현재 리스크 상태 */
  riskStatus: IRiskStatus;
}

/**
 * 손절/익절 계산 입력
 */
export interface IStopLossTakeProfitInput {
  /** 진입가 */
  entryPrice: number;
  /** 방향 */
  side: 'buy' | 'sell';
  /** 수량 */
  quantity: number;
  /** ATR (trailing/ATR 기반용) */
  atr?: number;
  /** 손절 설정 */
  stopLoss?: IStopLossOrder;
  /** 익절 설정 */
  takeProfit?: ITakeProfitOrder;
}

/**
 * 손절/익절 계산 결과
 */
export interface IStopLossTakeProfitResult {
  /** 손절가 */
  stopLossPrice?: number;
  /** 익절가 */
  takeProfitPrice?: number;
  /** 리스크 금액 */
  riskAmount: number;
  /** 보상 금액 */
  rewardAmount: number;
  /** R:R 비율 */
  riskRewardRatio: number;
}

/**
 * 리스크 관리 서비스 인터페이스
 */
export interface IRiskManagementService {
  /** 리스크 설정 업데이트 */
  updateConfig(config: Partial<IRiskConfig>): IResult<IRiskConfig>;

  /** 현재 리스크 설정 조회 */
  getConfig(): IResult<IRiskConfig>;

  /** 포지션 사이즈 계산 */
  calculatePositionSize(input: IPositionSizeInput): IResult<IPositionSizeResult>;

  /** 거래 가능 여부 검증 */
  validateTrade(input: ITradeValidationInput): IResult<ITradeValidationResult>;

  /** 손절/익절가 계산 */
  calculateStopLossTakeProfit(input: IStopLossTakeProfitInput): IResult<IStopLossTakeProfitResult>;

  /** 리스크 상태 업데이트 (포지션/거래 변경 시 호출) */
  updateRiskStatus(positions: IPosition[], dailyPnL: number, dailyTradeCount: number): IResult<IRiskStatus>;

  /** 현재 리스크 상태 조회 */
  getRiskStatus(): IResult<IRiskStatus>;
}

/**
 * 리스크 관리 서비스 구현
 */
export class RiskManagementService implements IRiskManagementService {
  private config: IRiskConfig;
  private riskStatus: IRiskStatus;

  constructor(config?: Partial<IRiskConfig>) {
    // Import DEFAULT_RISK_CONFIG from @hephaitos/types
    const defaultConfig: IRiskConfig = {
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

    this.config = { ...defaultConfig, ...config };
    this.riskStatus = {
      currentEquity: this.config.accountEquity,
      dailyPnL: 0,
      dailyPnLPercent: 0,
      dailyTradeCount: 0,
      openPositionCount: 0,
      totalMarginUsed: 0,
      availableMargin: this.config.accountEquity,
      dailyLimitReached: false,
      canTrade: true,
      openPositions: 0,
      maxPositions: this.config.maxOpenPositions,
      maxDailyTrades: this.config.dailyTradeLimit,
      isWithinLimits: true,
    };
  }

  updateConfig(config: Partial<IRiskConfig>): IResult<IRiskConfig> {
    const startTime = Date.now();
    try {
      this.config = { ...this.config, ...config };

      return {
        success: true,
        data: this.config,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  getConfig(): IResult<IRiskConfig> {
    return {
      success: true,
      data: this.config,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: 0,
      },
    };
  }

  calculatePositionSize(input: IPositionSizeInput): IResult<IPositionSizeResult> {
    const startTime = Date.now();
    try {
      let quantity = 0;
      const method = this.config.sizingMethod;

      switch (method) {
        case 'fixed_amount': {
          // 고정 금액 (예: $1000)
          const fixedAmount = this.config.accountEquity * (this.config.maxPositionSize / 100);
          quantity = fixedAmount / input.currentPrice;
          break;
        }

        case 'fixed_quantity': {
          // 고정 수량 (예: 항상 100주)
          quantity = 100;
          break;
        }

        case 'percent_equity': {
          // 자본금 비율 (예: 자본의 20%)
          const equityAmount = this.config.accountEquity * (this.config.maxPositionSize / 100);
          quantity = equityAmount / input.currentPrice;
          break;
        }

        case 'percent_risk': {
          // 리스크 비율 (가장 추천되는 방법)
          const riskAmount = this.config.accountEquity * (this.config.maxRiskPerTrade / 100);

          if (input.stopLossPrice) {
            const riskPerShare = Math.abs(input.currentPrice - input.stopLossPrice);
            quantity = riskAmount / riskPerShare;
          } else {
            // 손절가 없으면 기본 손절 비율 사용
            const defaultStopPercent = this.config.defaultStopLossPercent / 100;
            const riskPerShare = input.currentPrice * defaultStopPercent;
            quantity = riskAmount / riskPerShare;
          }
          break;
        }

        case 'kelly_criterion': {
          // 켈리 기준 (Kelly Criterion)
          const winRate = input.winRate ?? 0.5;
          const winLossRatio = input.avgWinLossRatio ?? 2;
          const kellyPercent = winRate - ((1 - winRate) / winLossRatio);
          const kellyAmount = this.config.accountEquity * Math.max(0, kellyPercent);
          quantity = kellyAmount / input.currentPrice;
          break;
        }

        case 'volatility_adjusted': {
          // 변동성 조정 (ATR 기반)
          if (input.atr) {
            const targetRisk = this.config.accountEquity * (this.config.maxRiskPerTrade / 100);
            const riskPerShare = input.atr * 2; // 2 ATR
            quantity = targetRisk / riskPerShare;
          } else {
            // ATR 없으면 percent_risk로 폴백
            const riskAmount = this.config.accountEquity * (this.config.maxRiskPerTrade / 100);
            const defaultStopPercent = this.config.defaultStopLossPercent / 100;
            const riskPerShare = input.currentPrice * defaultStopPercent;
            quantity = riskAmount / riskPerShare;
          }
          break;
        }
      }

      // 포지션 가치 계산
      const positionValue = quantity * input.currentPrice;

      // 최대 포지션 크기 제한 적용
      const maxPositionValue = this.config.accountEquity * (this.config.maxPositionSize / 100);
      if (positionValue > maxPositionValue) {
        quantity = maxPositionValue / input.currentPrice;
      }

      // 리스크 금액 계산
      const stopLossPrice = input.stopLossPrice ??
        input.currentPrice * (1 - this.config.defaultStopLossPercent / 100);
      const riskAmount = Math.abs(input.currentPrice - stopLossPrice) * quantity;
      const riskPercent = (riskAmount / this.config.accountEquity) * 100;

      // 마진 계산
      const marginUsed = (quantity * input.currentPrice) / this.config.defaultLeverage;

      const result: IPositionSizeResult = {
        quantity: Math.floor(quantity * 100) / 100, // 소수점 2자리
        positionValue: quantity * input.currentPrice,
        riskAmount,
        riskPercent,
        marginUsed,
        method,
      };

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  validateTrade(input: ITradeValidationInput): IResult<ITradeValidationResult> {
    const startTime = Date.now();
    try {
      const reasons: string[] = [];

      // 1. 일일 손실 한도 체크
      if (this.riskStatus.dailyLimitReached) {
        reasons.push(`Daily loss limit reached (${this.config.dailyLossLimit}%)`);
      }

      // 2. 일일 거래 횟수 한도 체크
      if (this.riskStatus.dailyTradeCount >= this.config.dailyTradeLimit) {
        reasons.push(`Daily trade limit reached (${this.config.dailyTradeLimit} trades)`);
      }

      // 3. 최대 포지션 수 체크
      if (this.riskStatus.openPositionCount >= this.config.maxOpenPositions) {
        reasons.push(`Maximum open positions reached (${this.config.maxOpenPositions})`);
      }

      // 4. 포지션 크기 체크
      const maxPositionValue = this.config.accountEquity * (this.config.maxPositionSize / 100);
      if (input.positionValue > maxPositionValue) {
        reasons.push(`Position size exceeds limit (${this.config.maxPositionSize}% of equity)`);
      }

      // 5. 리스크 비율 체크
      const maxRiskAmount = this.config.accountEquity * (this.config.maxRiskPerTrade / 100);
      if (input.riskAmount > maxRiskAmount) {
        reasons.push(`Risk amount exceeds limit (${this.config.maxRiskPerTrade}% of equity)`);
      }

      // 6. 가용 마진 체크
      const marginNeeded = input.positionValue / this.config.defaultLeverage;
      if (marginNeeded > this.riskStatus.availableMargin) {
        reasons.push('Insufficient available margin');
      }

      const result: ITradeValidationResult = {
        allowed: reasons.length === 0,
        reasons,
        riskStatus: this.riskStatus,
      };

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  calculateStopLossTakeProfit(input: IStopLossTakeProfitInput): IResult<IStopLossTakeProfitResult> {
    const startTime = Date.now();
    try {
      let stopLossPrice: number | undefined;
      let takeProfitPrice: number | undefined;

      // 손절가 계산
      if (input.stopLoss) {
        const sl = input.stopLoss;
        switch (sl.type) {
          case 'fixed_price':
            stopLossPrice = sl.price;
            break;

          case 'percent':
            if (input.side === 'buy') {
              stopLossPrice = input.entryPrice * (1 - (sl.percent ?? this.config.defaultStopLossPercent) / 100);
            } else {
              stopLossPrice = input.entryPrice * (1 + (sl.percent ?? this.config.defaultStopLossPercent) / 100);
            }
            break;

          case 'atr_based':
            if (input.atr) {
              const atrMultiplier = sl.atrMultiplier ?? 2;
              if (input.side === 'buy') {
                stopLossPrice = input.entryPrice - (input.atr * atrMultiplier);
              } else {
                stopLossPrice = input.entryPrice + (input.atr * atrMultiplier);
              }
            }
            break;

          case 'trailing':
            // Trailing stop은 실시간 가격 추적이 필요하므로 초기값만 설정
            if (input.side === 'buy') {
              stopLossPrice = input.entryPrice * (1 - (sl.trailingPercent ?? this.config.defaultStopLossPercent) / 100);
            } else {
              stopLossPrice = input.entryPrice * (1 + (sl.trailingPercent ?? this.config.defaultStopLossPercent) / 100);
            }
            break;
        }
      } else {
        // 기본 손절 비율 사용
        if (input.side === 'buy') {
          stopLossPrice = input.entryPrice * (1 - this.config.defaultStopLossPercent / 100);
        } else {
          stopLossPrice = input.entryPrice * (1 + this.config.defaultStopLossPercent / 100);
        }
      }

      // 익절가 계산
      if (input.takeProfit) {
        const tp = input.takeProfit;
        switch (tp.type) {
          case 'fixed_price':
            takeProfitPrice = tp.price;
            break;

          case 'percent':
            if (input.side === 'buy') {
              takeProfitPrice = input.entryPrice * (1 + (tp.percent ?? this.config.defaultTakeProfitPercent) / 100);
            } else {
              takeProfitPrice = input.entryPrice * (1 - (tp.percent ?? this.config.defaultTakeProfitPercent) / 100);
            }
            break;

          case 'risk_reward':
            if (stopLossPrice) {
              const riskAmount = Math.abs(input.entryPrice - stopLossPrice);
              const rrRatio = tp.riskRewardRatio ?? 2;
              if (input.side === 'buy') {
                takeProfitPrice = input.entryPrice + (riskAmount * rrRatio);
              } else {
                takeProfitPrice = input.entryPrice - (riskAmount * rrRatio);
              }
            }
            break;

          case 'trailing':
            // Trailing TP는 실시간 가격 추적이 필요하므로 초기값만 설정
            if (input.side === 'buy') {
              takeProfitPrice = input.entryPrice * (1 + (tp.trailingPercent ?? this.config.defaultTakeProfitPercent) / 100);
            } else {
              takeProfitPrice = input.entryPrice * (1 - (tp.trailingPercent ?? this.config.defaultTakeProfitPercent) / 100);
            }
            break;

          case 'partial':
            // 분할 익절은 첫 번째 타겟만 반환
            if (tp.partialExits && tp.partialExits.length > 0) {
              const firstTarget = tp.partialExits[0];
              if (input.side === 'buy') {
                takeProfitPrice = input.entryPrice * (1 + firstTarget.targetPercent / 100);
              } else {
                takeProfitPrice = input.entryPrice * (1 - firstTarget.targetPercent / 100);
              }
            }
            break;
        }
      } else {
        // 기본 익절 비율 사용
        if (input.side === 'buy') {
          takeProfitPrice = input.entryPrice * (1 + this.config.defaultTakeProfitPercent / 100);
        } else {
          takeProfitPrice = input.entryPrice * (1 - this.config.defaultTakeProfitPercent / 100);
        }
      }

      // 리스크/보상 계산
      const riskAmount = stopLossPrice ? Math.abs(input.entryPrice - stopLossPrice) * input.quantity : 0;
      const rewardAmount = takeProfitPrice ? Math.abs(takeProfitPrice - input.entryPrice) * input.quantity : 0;
      const riskRewardRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0;

      const result: IStopLossTakeProfitResult = {
        stopLossPrice,
        takeProfitPrice,
        riskAmount,
        rewardAmount,
        riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
      };

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  updateRiskStatus(positions: IPosition[], dailyPnL: number, dailyTradeCount: number): IResult<IRiskStatus> {
    const startTime = Date.now();
    try {
      // 포지션 통계 계산
      const openPositionCount = positions.length;
      const totalMarginUsed = positions.reduce((sum, pos) => {
        return sum + (Math.abs(pos.quantity * pos.entryPrice) / this.config.defaultLeverage);
      }, 0);

      // 현재 자본금 (초기 자본 + 일일 손익)
      const currentEquity = this.config.accountEquity + dailyPnL;
      const availableMargin = currentEquity - totalMarginUsed;

      // 일일 손익률
      const dailyPnLPercent = (dailyPnL / this.config.accountEquity) * 100;

      // 일일 손실 한도 체크
      const dailyLimitReached = dailyPnLPercent <= -this.config.dailyLossLimit;

      // 거래 가능 여부
      let canTrade = true;
      let blockReason: string | undefined;

      if (dailyLimitReached) {
        canTrade = false;
        blockReason = 'Daily loss limit reached';
      } else if (dailyTradeCount >= this.config.dailyTradeLimit) {
        canTrade = false;
        blockReason = 'Daily trade limit reached';
      } else if (openPositionCount >= this.config.maxOpenPositions) {
        canTrade = false;
        blockReason = 'Maximum open positions reached';
      } else if (availableMargin <= 0) {
        canTrade = false;
        blockReason = 'Insufficient margin';
      }

      this.riskStatus = {
        currentEquity,
        dailyPnL,
        dailyPnLPercent: Math.round(dailyPnLPercent * 100) / 100,
        dailyTradeCount,
        openPositionCount,
        totalMarginUsed,
        availableMargin,
        dailyLimitReached,
        canTrade,
        blockReason,
        openPositions: openPositionCount,
        maxPositions: this.config.maxOpenPositions,
        maxDailyTrades: this.config.dailyTradeLimit,
        isWithinLimits: canTrade && !dailyLimitReached,
      };

      return {
        success: true,
        data: this.riskStatus,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  getRiskStatus(): IResult<IRiskStatus> {
    return {
      success: true,
      data: this.riskStatus,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: 0,
      },
    };
  }
}

/**
 * 팩토리 함수 - RiskManagementService 생성
 */
export function createRiskManagementService(config?: Partial<IRiskConfig>): IRiskManagementService {
  return new RiskManagementService(config);
}
