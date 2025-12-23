/**
 * HEPHAITOS - Backtest Agent
 * L3 (Tissues) - 백테스트 실행 에이전트
 *
 * 트레이딩 전략의 과거 성과를 시뮬레이션하고 분석
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │                  백테스트 실행 흐름                          │
 * ├─────────────────────────────────────────────────────────────┤
 * │  1. Initialize  →  전략/데이터 로드, 초기 자본 설정          │
 * │  2. Simulate    →  캔들 순회, 시그널 감지, 가상 거래         │
 * │  3. Calculate   →  거래 집계, 자산 곡선, 성과 지표           │
 * │  4. Report      →  결과 저장, 시각화 데이터 생성             │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ⚠️ 면책조항: 백테스트 결과는 과거 성과이며 미래 수익을 보장하지 않습니다.
 */

import type {
  IResult,
  IStrategy,
  IBacktestConfig,
  IBacktestResult,
  IBacktestSummary,
  IStrategyComparison,
  IRoundTrip,
  IEquityPoint,
  IOHLCV,
  ITrade,
  IPerformanceMetrics,
} from '@hephaitos/types';
import type {
  IPriceDataService,
  IStrategyRepository,
  IBacktestResultRepository,
} from '@hephaitos/core';
import {
  calculatePerformanceMetrics,
  extractDrawdownRecords,
  calculateMonthlyReturns,
  detectEntrySignal,
  detectExitSignal,
} from '@hephaitos/utils';

/**
 * 에이전트 설정
 */
export interface IBacktestAgentConfig {
  /** 진행 상황 콜백 */
  onProgress?: (progress: number, message: string) => void;
  /** 거래 발생 콜백 */
  onTrade?: (trade: IRoundTrip) => void;
}

/**
 * 백테스트 에이전트
 */
export class BacktestAgent {
  private priceDataService: IPriceDataService;
  private strategyRepo: IStrategyRepository;
  private resultRepo: IBacktestResultRepository;
  private config: IBacktestAgentConfig;

  constructor(
    priceDataService: IPriceDataService,
    strategyRepo: IStrategyRepository,
    resultRepo: IBacktestResultRepository,
    config: IBacktestAgentConfig = {}
  ) {
    this.priceDataService = priceDataService;
    this.strategyRepo = strategyRepo;
    this.resultRepo = resultRepo;
    this.config = config;
  }

  /**
   * 백테스트 실행
   */
  async runBacktest(
    backtestConfig: IBacktestConfig
  ): Promise<IResult<IBacktestResult>> {
    const startTime = Date.now();
    const resultId = crypto.randomUUID();

    // 초기 결과 객체
    const result: IBacktestResult = {
      id: resultId,
      configId: backtestConfig.id,
      strategyId: backtestConfig.strategyId,
      status: 'running',
      startedAt: new Date().toISOString(),
      initialCapital: backtestConfig.initialCapital,
      finalCapital: backtestConfig.initialCapital,
      peakCapital: backtestConfig.initialCapital,
      trades: [],
      equityCurve: [],
      drawdowns: [],
      monthlyReturns: [],
      metrics: this.getEmptyMetrics(),
    };

    try {
      this.reportProgress(0, '전략 로드 중...');

      // 1. 전략 로드
      const strategyResult = await this.strategyRepo.getById(
        backtestConfig.strategyId
      );
      if (!strategyResult.success || !strategyResult.data) {
        throw new Error(`Strategy not found: ${backtestConfig.strategyId}`);
      }
      const strategy = strategyResult.data;

      this.reportProgress(10, '가격 데이터 로드 중...');

      // 2. 가격 데이터 로드
      const symbols =
        backtestConfig.symbols.length > 0
          ? backtestConfig.symbols
          : strategy.symbols;

      if (symbols.length === 0) {
        throw new Error('No symbols specified for backtest');
      }

      // 단일 심볼만 지원 (확장 가능)
      const symbol = symbols[0];
      const priceResult = await this.priceDataService.getHistoricalPrices(
        symbol,
        backtestConfig.timeframe,
        backtestConfig.startDate,
        backtestConfig.endDate
      );

      if (!priceResult.success || !priceResult.data) {
        throw new Error('Failed to load price data');
      }

      const candles = priceResult.data.candles;
      if (candles.length < 50) {
        throw new Error('Insufficient price data for backtest');
      }

      this.reportProgress(20, '시뮬레이션 실행 중...');

      // 3. 시뮬레이션 실행
      const { trades, equityCurve, finalCapital, peakCapital } =
        await this.simulate(
          candles,
          strategy,
          backtestConfig.initialCapital,
          backtestConfig.feeRate,
          backtestConfig.slippage,
          symbol
        );

      result.trades = trades;
      result.equityCurve = equityCurve;
      result.finalCapital = finalCapital;
      result.peakCapital = peakCapital;

      this.reportProgress(80, '지표 계산 중...');

      // 4. 성과 지표 계산
      result.metrics = calculatePerformanceMetrics(
        backtestConfig.initialCapital,
        finalCapital,
        equityCurve,
        trades
      );

      result.drawdowns = extractDrawdownRecords(equityCurve);
      result.monthlyReturns = calculateMonthlyReturns(equityCurve, trades);

      // 5. 결과 완료 처리
      result.status = 'completed';
      result.completedAt = new Date().toISOString();
      result.executionTimeMs = Date.now() - startTime;

      this.reportProgress(90, '결과 저장 중...');

      // 6. 결과 저장
      await this.resultRepo.save(result);

      this.reportProgress(100, '완료!');

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      result.status = 'failed';
      result.errorMessage =
        error instanceof Error ? error.message : String(error);

      await this.resultRepo.save(result);

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * 시뮬레이션 실행
   */
  private async simulate(
    candles: IOHLCV[],
    strategy: IStrategy,
    initialCapital: number,
    feeRate: number,
    slippage: number,
    symbol: string
  ): Promise<{
    trades: IRoundTrip[];
    equityCurve: IEquityPoint[];
    finalCapital: number;
    peakCapital: number;
  }> {
    const trades: IRoundTrip[] = [];
    const equityCurve: IEquityPoint[] = [];

    let cash = initialCapital;
    let position: {
      side: 'buy';
      quantity: number;
      entryPrice: number;
      entryTrade: ITrade;
      enteredAt: string;
      entryBarIndex: number;
    } | null = null;

    let peakCapital = initialCapital;

    // 최소 lookback 기간 (지표 계산용)
    const lookback = 50;

    for (let i = lookback; i < candles.length; i++) {
      const candle = candles[i];
      const currentPrice = candle.close;

      // 현재 자산 계산
      const positionValue = position ? position.quantity * currentPrice : 0;
      const equity = cash + positionValue;

      // 고점 갱신
      if (equity > peakCapital) {
        peakCapital = equity;
      }

      // 낙폭 계산
      const drawdown =
        peakCapital > 0 ? ((peakCapital - equity) / peakCapital) * 100 : 0;

      // 자산 곡선 기록
      equityCurve.push({
        timestamp: candle.timestamp,
        equity,
        cash,
        positionValue,
        drawdown,
      });

      // 진행률 보고 (매 100개 캔들마다)
      if (i % 100 === 0) {
        const progress = 20 + Math.floor(((i - lookback) / (candles.length - lookback)) * 60);
        this.reportProgress(progress, `시뮬레이션: ${i}/${candles.length} 캔들`);
      }

      // 포지션 있을 때: 청산 체크
      if (position) {
        const exitSignal = detectExitSignal(
          candles.slice(0, i + 1),
          strategy.exitConditions,
          i,
          position.entryPrice,
          strategy.riskManagement.stopLossPercent,
          strategy.riskManagement.takeProfitPercent
        );

        if (exitSignal) {
          // 청산 실행
          const exitPrice = this.applySlippage(currentPrice, -1, slippage);
          const exitValue = position.quantity * exitPrice;
          const exitFee = exitValue * (feeRate / 100);

          const exitTrade: ITrade = {
            id: crypto.randomUUID(),
            orderId: crypto.randomUUID(),
            symbol,
            side: 'sell',
            quantity: position.quantity,
            price: exitPrice,
            value: exitValue,
            fee: exitFee,
            feeCurrency: 'USD',
            executedAt: candle.timestamp,
          };

          // 라운드 트립 생성
          const roundTrip: IRoundTrip = {
            id: crypto.randomUUID(),
            symbol,
            side: 'buy',
            entryTrade: position.entryTrade,
            exitTrade,
            entryPrice: position.entryPrice,
            exitPrice,
            quantity: position.quantity,
            totalFees: position.entryTrade.fee + exitFee,
            netPnL:
              exitValue -
              position.entryTrade.value -
              position.entryTrade.fee -
              exitFee,
            netPnLPercent:
              ((exitPrice - position.entryPrice) / position.entryPrice) * 100 -
              feeRate * 2,
            holdingPeriodMs:
              new Date(candle.timestamp).getTime() -
              new Date(position.enteredAt).getTime(),
            holdingPeriodBars: i - position.entryBarIndex,
            enteredAt: position.enteredAt,
            exitedAt: candle.timestamp,
          };

          trades.push(roundTrip);
          this.config.onTrade?.(roundTrip);

          // 현금 업데이트
          cash += exitValue - exitFee;
          position = null;
        }
      }

      // 포지션 없을 때: 진입 체크
      if (!position) {
        const entrySignal = detectEntrySignal(
          candles.slice(0, i + 1),
          strategy.entryConditions,
          i
        );

        if (entrySignal) {
          // 포지션 사이징
          const positionSize = this.calculatePositionSize(
            cash,
            currentPrice,
            strategy.positionSizing,
            strategy.riskManagement
          );

          if (positionSize > 0) {
            // 진입 실행
            const entryPrice = this.applySlippage(currentPrice, 1, slippage);
            const quantity = positionSize / entryPrice;
            const entryValue = quantity * entryPrice;
            const entryFee = entryValue * (feeRate / 100);

            const entryTrade: ITrade = {
              id: crypto.randomUUID(),
              orderId: crypto.randomUUID(),
              symbol,
              side: 'buy',
              quantity,
              price: entryPrice,
              value: entryValue,
              fee: entryFee,
              feeCurrency: 'USD',
              executedAt: candle.timestamp,
            };

            // 현금 차감
            cash -= entryValue + entryFee;

            // 포지션 생성
            position = {
              side: 'buy',
              quantity,
              entryPrice,
              entryTrade,
              enteredAt: candle.timestamp,
              entryBarIndex: i,
            };
          }
        }
      }
    }

    // 마지막 포지션 강제 청산
    if (position) {
      const lastCandle = candles[candles.length - 1];
      const exitPrice = lastCandle.close;
      const exitValue = position.quantity * exitPrice;
      const exitFee = exitValue * (feeRate / 100);

      const exitTrade: ITrade = {
        id: crypto.randomUUID(),
        orderId: crypto.randomUUID(),
        symbol,
        side: 'sell',
        quantity: position.quantity,
        price: exitPrice,
        value: exitValue,
        fee: exitFee,
        feeCurrency: 'USD',
        executedAt: lastCandle.timestamp,
      };

      const roundTrip: IRoundTrip = {
        id: crypto.randomUUID(),
        symbol,
        side: 'buy',
        entryTrade: position.entryTrade,
        exitTrade,
        entryPrice: position.entryPrice,
        exitPrice,
        quantity: position.quantity,
        totalFees: position.entryTrade.fee + exitFee,
        netPnL:
          exitValue -
          position.entryTrade.value -
          position.entryTrade.fee -
          exitFee,
        netPnLPercent:
          ((exitPrice - position.entryPrice) / position.entryPrice) * 100 -
          feeRate * 2,
        holdingPeriodMs:
          new Date(lastCandle.timestamp).getTime() -
          new Date(position.enteredAt).getTime(),
        holdingPeriodBars: (candles.length - 1) - position.entryBarIndex,
        enteredAt: position.enteredAt,
        exitedAt: lastCandle.timestamp,
      };

      trades.push(roundTrip);
      cash += exitValue - exitFee;
    }

    // 최종 자산
    const finalCapital = cash;

    return {
      trades,
      equityCurve,
      finalCapital,
      peakCapital,
    };
  }

  /**
   * 포지션 크기 계산
   * P1 FIX: 0 또는 음수 자본금 처리 추가
   */
  private calculatePositionSize(
    availableCash: number,
    currentPrice: number,
    positionSizing: IStrategy['positionSizing'],
    riskManagement: IStrategy['riskManagement']
  ): number {
    // P1 FIX: 0 또는 음수 자본금 조기 리턴
    if (availableCash <= 0 || currentPrice <= 0) {
      return 0;
    }

    const maxUsage = riskManagement.maxCapitalUsage ?? 100;
    const maxCash = availableCash * (maxUsage / 100);

    switch (positionSizing.type) {
      case 'fixed_amount':
        return Math.min(positionSizing.amount ?? 1000, maxCash);

      case 'fixed_percent':
        return (availableCash * (positionSizing.percent ?? 10)) / 100;

      case 'risk_based': {
        // ATR 기반 리스크 관리 (간략화)
        const riskPercent = positionSizing.maxRiskPercent ?? 2;
        const stopLoss = riskManagement.stopLossPercent ?? 5;
        const riskAmount = availableCash * (riskPercent / 100);
        const positionSize = riskAmount / (stopLoss / 100);
        return Math.min(positionSize, maxCash);
      }

      default:
        return Math.min(availableCash * 0.1, maxCash); // 기본 10%
    }
  }

  /**
   * 슬리피지 적용
   */
  private applySlippage(
    price: number,
    direction: 1 | -1,
    slippagePercent: number
  ): number {
    // 매수 시 가격 상승, 매도 시 가격 하락
    return price * (1 + (direction * slippagePercent) / 100);
  }

  /**
   * 진행 상황 보고
   */
  private reportProgress(progress: number, message: string): void {
    this.config.onProgress?.(progress, message);
  }

  /**
   * 빈 지표 생성
   */
  private getEmptyMetrics(): IPerformanceMetrics {
    return {
      totalReturn: 0,
      annualizedReturn: 0,
      monthlyReturn: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      maxDrawdown: 0,
      avgDrawdown: 0,
      maxDrawdownDuration: 0,
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      maxWin: 0,
      maxLoss: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      avgHoldingPeriod: 0,
      pnlStdDev: 0,
      avgTradeReturn: 0,
      expectancy: 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 추가 기능
  // ═══════════════════════════════════════════════════════════════

  /**
   * 결과 분석 (인사이트 생성)
   */
  async analyzeResult(
    resultId: string
  ): Promise<IResult<{ insights: string[] }>> {
    const startTime = Date.now();

    const resultData = await this.resultRepo.getById(resultId);
    if (!resultData.success || !resultData.data) {
      return {
        success: false,
        error: new Error('Result not found'),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }

    const result = resultData.data;
    const insights: string[] = [];

    // 수익률 분석
    if (result.metrics.totalReturn > 0) {
      insights.push(
        `✅ 총 수익률 ${result.metrics.totalReturn.toFixed(2)}% 달성`
      );
    } else {
      insights.push(
        `❌ 총 손실률 ${Math.abs(result.metrics.totalReturn).toFixed(2)}%`
      );
    }

    // 샤프 비율 분석
    if (result.metrics.sharpeRatio > 1) {
      insights.push(
        `✅ 샤프 비율 ${result.metrics.sharpeRatio.toFixed(2)} - 양호한 리스크 대비 수익`
      );
    } else if (result.metrics.sharpeRatio < 0) {
      insights.push(`⚠️ 샤프 비율 음수 - 무위험 수익률보다 낮은 성과`);
    }

    // 최대 낙폭 분석
    if (result.metrics.maxDrawdown > 20) {
      insights.push(
        `⚠️ 최대 낙폭 ${result.metrics.maxDrawdown.toFixed(2)}% - 높은 리스크`
      );
    }

    // 승률 분석
    if (result.metrics.winRate > 50) {
      insights.push(`✅ 승률 ${result.metrics.winRate.toFixed(1)}%`);
    } else {
      insights.push(
        `⚠️ 승률 ${result.metrics.winRate.toFixed(1)}% - 손익비 확인 필요`
      );
    }

    // 손익비 분석
    if (result.metrics.profitFactor > 1.5) {
      insights.push(
        `✅ 손익비 ${result.metrics.profitFactor.toFixed(2)} - 수익 거래가 손실을 상회`
      );
    }

    return {
      success: true,
      data: { insights },
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  /**
   * 전략 비교
   */
  async compareStrategies(
    backtestIds: string[]
  ): Promise<IResult<IStrategyComparison>> {
    return this.resultRepo.compareStrategies(backtestIds);
  }

  /**
   * 최근 백테스트 목록 조회
   */
  async getRecentResults(limit?: number): Promise<IResult<IBacktestSummary[]>> {
    return this.resultRepo.listRecent(limit);
  }
}

/**
 * 백테스트 에이전트 팩토리
 */
export function createBacktestAgent(
  priceDataService: IPriceDataService,
  strategyRepo: IStrategyRepository,
  resultRepo: IBacktestResultRepository,
  config?: IBacktestAgentConfig
): BacktestAgent {
  return new BacktestAgent(priceDataService, strategyRepo, resultRepo, config);
}
