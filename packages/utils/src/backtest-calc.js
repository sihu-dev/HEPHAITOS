/**
 * @ioblock/utils - Backtest Calculation Utilities
 * L1 (Molecules) - 백테스트 성과 지표 계산
 *
 * 순수 함수 기반 - 부작용 없음
 */
/**
 * 연간 거래일 수
 */
const TRADING_DAYS_PER_YEAR = 252;
/**
 * 무위험 수익률 (연 2%)
 */
const RISK_FREE_RATE = 0.02;
// ═══════════════════════════════════════════════════════════════
// 수익률 계산
// ═══════════════════════════════════════════════════════════════
/**
 * 총 수익률 계산
 */
export function calculateTotalReturn(initialCapital, finalCapital) {
    if (initialCapital <= 0)
        return 0;
    return ((finalCapital - initialCapital) / initialCapital) * 100;
}
/**
 * 연환산 수익률 (CAGR)
 */
export function calculateAnnualizedReturn(totalReturn, tradingDays) {
    if (tradingDays <= 0)
        return 0;
    const years = tradingDays / TRADING_DAYS_PER_YEAR;
    if (years <= 0)
        return 0;
    const totalMultiplier = 1 + totalReturn / 100;
    if (totalMultiplier <= 0)
        return -100;
    return (Math.pow(totalMultiplier, 1 / years) - 1) * 100;
}
/**
 * 일별 수익률 계산
 */
export function calculateDailyReturns(equityCurve) {
    if (equityCurve.length < 2)
        return [];
    const returns = [];
    for (let i = 1; i < equityCurve.length; i++) {
        const prevEquity = equityCurve[i - 1].equity;
        const currentEquity = equityCurve[i].equity;
        if (prevEquity > 0) {
            returns.push((currentEquity - prevEquity) / prevEquity);
        }
    }
    return returns;
}
// ═══════════════════════════════════════════════════════════════
// 리스크 조정 수익률
// ═══════════════════════════════════════════════════════════════
/**
 * 샤프 비율 계산
 *
 * (연환산 수익률 - 무위험수익률) / 연환산 변동성
 */
export function calculateSharpeRatio(dailyReturns) {
    if (dailyReturns.length < 2)
        return 0;
    const avgReturn = mean(dailyReturns);
    const stdDev = standardDeviation(dailyReturns);
    if (stdDev === 0)
        return 0;
    // 연환산
    const annualizedReturn = avgReturn * TRADING_DAYS_PER_YEAR;
    const annualizedStdDev = stdDev * Math.sqrt(TRADING_DAYS_PER_YEAR);
    return (annualizedReturn - RISK_FREE_RATE) / annualizedStdDev;
}
/**
 * 소르티노 비율 계산
 *
 * 하방 변동성만 고려 (손실만)
 */
export function calculateSortinoRatio(dailyReturns) {
    if (dailyReturns.length < 2)
        return 0;
    const avgReturn = mean(dailyReturns);
    // 하방 편차 계산 (음수 수익률만)
    const negativeReturns = dailyReturns.filter(r => r < 0);
    if (negativeReturns.length === 0)
        return Infinity; // 손실 없음
    const downsideDeviation = standardDeviation(negativeReturns);
    if (downsideDeviation === 0)
        return Infinity;
    // 연환산
    const annualizedReturn = avgReturn * TRADING_DAYS_PER_YEAR;
    const annualizedDownside = downsideDeviation * Math.sqrt(TRADING_DAYS_PER_YEAR);
    return (annualizedReturn - RISK_FREE_RATE) / annualizedDownside;
}
/**
 * 칼마 비율 계산
 *
 * 연환산 수익률 / 최대 낙폭
 */
export function calculateCalmarRatio(annualizedReturn, maxDrawdown) {
    if (maxDrawdown === 0)
        return Infinity;
    return annualizedReturn / Math.abs(maxDrawdown);
}
// ═══════════════════════════════════════════════════════════════
// 낙폭 계산
// ═══════════════════════════════════════════════════════════════
/**
 * 낙폭 시리즈 계산
 */
export function calculateDrawdownSeries(equityCurve) {
    if (equityCurve.length === 0)
        return [];
    let peak = equityCurve[0].equity;
    return equityCurve.map(point => {
        if (point.equity > peak) {
            peak = point.equity;
        }
        return peak > 0 ? ((peak - point.equity) / peak) * 100 : 0;
    });
}
/**
 * 최대 낙폭 계산
 */
export function calculateMaxDrawdown(equityCurve) {
    const drawdowns = calculateDrawdownSeries(equityCurve);
    return drawdowns.length > 0 ? Math.max(...drawdowns) : 0;
}
/**
 * 평균 낙폭 계산
 */
export function calculateAvgDrawdown(equityCurve) {
    const drawdowns = calculateDrawdownSeries(equityCurve);
    const nonZeroDrawdowns = drawdowns.filter(d => d > 0);
    return nonZeroDrawdowns.length > 0 ? mean(nonZeroDrawdowns) : 0;
}
/**
 * 낙폭 기록 추출
 */
export function extractDrawdownRecords(equityCurve) {
    if (equityCurve.length < 2)
        return [];
    const records = [];
    let peak = equityCurve[0].equity;
    let peakTime = equityCurve[0].timestamp;
    let inDrawdown = false;
    let currentRecord = null;
    for (let i = 0; i < equityCurve.length; i++) {
        const point = equityCurve[i];
        if (point.equity > peak) {
            // 새로운 고점
            if (inDrawdown && currentRecord) {
                // 낙폭 회복 완료
                currentRecord.recoveryTime = point.timestamp;
                currentRecord.recoveryDays = daysBetween(currentRecord.troughTime, point.timestamp);
                records.push(currentRecord);
                currentRecord = null;
            }
            peak = point.equity;
            peakTime = point.timestamp;
            inDrawdown = false;
        }
        else if (point.equity < peak) {
            const drawdownPercent = ((peak - point.equity) / peak) * 100;
            if (!inDrawdown) {
                // 낙폭 시작
                inDrawdown = true;
                currentRecord = {
                    startTime: peakTime,
                    troughTime: point.timestamp,
                    recoveryTime: null,
                    peakEquity: peak,
                    troughEquity: point.equity,
                    drawdownPercent,
                    recoveryDays: null,
                };
            }
            else if (currentRecord && point.equity < currentRecord.troughEquity) {
                // 더 깊은 낙폭
                currentRecord.troughTime = point.timestamp;
                currentRecord.troughEquity = point.equity;
                currentRecord.drawdownPercent = drawdownPercent;
            }
        }
    }
    // 마지막 미회복 낙폭 추가
    if (inDrawdown && currentRecord) {
        records.push(currentRecord);
    }
    return records;
}
// ═══════════════════════════════════════════════════════════════
// 거래 지표 계산
// ═══════════════════════════════════════════════════════════════
/**
 * 승률 계산
 */
export function calculateWinRate(trades) {
    if (trades.length === 0)
        return 0;
    const wins = trades.filter(t => t.netPnL > 0).length;
    return (wins / trades.length) * 100;
}
/**
 * 손익비 (Profit Factor) 계산
 *
 * 총 이익 / 총 손실
 */
export function calculateProfitFactor(trades) {
    const profits = trades.filter(t => t.netPnL > 0);
    const losses = trades.filter(t => t.netPnL < 0);
    const totalProfit = profits.reduce((sum, t) => sum + t.netPnL, 0);
    const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.netPnL, 0));
    if (totalLoss === 0)
        return Infinity;
    return totalProfit / totalLoss;
}
/**
 * 평균 이익/손실 계산
 */
export function calculateAvgWinLoss(trades) {
    const wins = trades.filter(t => t.netPnL > 0);
    const losses = trades.filter(t => t.netPnL < 0);
    return {
        avgWin: wins.length > 0 ? mean(wins.map(t => t.netPnL)) : 0,
        avgLoss: losses.length > 0 ? mean(losses.map(t => Math.abs(t.netPnL))) : 0,
        maxWin: wins.length > 0 ? Math.max(...wins.map(t => t.netPnL)) : 0,
        maxLoss: losses.length > 0 ? Math.max(...losses.map(t => Math.abs(t.netPnL))) : 0,
    };
}
/**
 * 연속 승/패 계산
 */
export function calculateConsecutiveWinsLosses(trades) {
    let maxWins = 0;
    let maxLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;
    for (const trade of trades) {
        if (trade.netPnL > 0) {
            currentWins++;
            currentLosses = 0;
            maxWins = Math.max(maxWins, currentWins);
        }
        else if (trade.netPnL < 0) {
            currentLosses++;
            currentWins = 0;
            maxLosses = Math.max(maxLosses, currentLosses);
        }
    }
    return {
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLosses,
    };
}
/**
 * 기대값 (Expectancy) 계산
 *
 * 승률 × 평균이익 - 패률 × 평균손실
 */
export function calculateExpectancy(trades) {
    if (trades.length === 0)
        return 0;
    const winRate = calculateWinRate(trades) / 100;
    const { avgWin, avgLoss } = calculateAvgWinLoss(trades);
    return winRate * avgWin - (1 - winRate) * avgLoss;
}
/**
 * 평균 보유 기간 계산 (일)
 */
export function calculateAvgHoldingPeriod(trades) {
    if (trades.length === 0)
        return 0;
    const periods = trades.map(t => t.holdingPeriodMs / (1000 * 60 * 60 * 24));
    return mean(periods);
}
// ═══════════════════════════════════════════════════════════════
// 월별 수익률
// ═══════════════════════════════════════════════════════════════
/**
 * 월별 수익률 계산
 */
export function calculateMonthlyReturns(equityCurve, trades) {
    if (equityCurve.length < 2)
        return [];
    const monthlyData = new Map();
    // 자산 곡선에서 월별 시작/종료 자산 추출
    for (const point of equityCurve) {
        const date = new Date(point.timestamp);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!monthlyData.has(key)) {
            monthlyData.set(key, {
                startEquity: point.equity,
                endEquity: point.equity,
                trades: 0,
            });
        }
        else {
            monthlyData.get(key).endEquity = point.equity;
        }
    }
    // 거래 수 집계
    for (const trade of trades) {
        const date = new Date(trade.exitedAt);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (monthlyData.has(key)) {
            monthlyData.get(key).trades++;
        }
    }
    // 결과 변환
    const results = [];
    for (const [key, data] of monthlyData) {
        const [year, month] = key.split('-').map(Number);
        const returnPct = data.startEquity > 0
            ? ((data.endEquity - data.startEquity) / data.startEquity) * 100
            : 0;
        results.push({
            year,
            month,
            return: returnPct,
            tradeCount: data.trades,
        });
    }
    return results.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
}
// ═══════════════════════════════════════════════════════════════
// 종합 지표 계산
// ═══════════════════════════════════════════════════════════════
/**
 * 전체 성과 지표 계산
 */
export function calculatePerformanceMetrics(initialCapital, finalCapital, equityCurve, trades) {
    // 수익률
    const totalReturn = calculateTotalReturn(initialCapital, finalCapital);
    const tradingDays = equityCurve.length;
    const annualizedReturn = calculateAnnualizedReturn(totalReturn, tradingDays);
    const monthlyReturn = annualizedReturn / 12;
    // 일별 수익률
    const dailyReturns = calculateDailyReturns(equityCurve);
    // 리스크 조정 수익률
    const sharpeRatio = calculateSharpeRatio(dailyReturns);
    const sortinoRatio = calculateSortinoRatio(dailyReturns);
    // 낙폭
    const maxDrawdown = calculateMaxDrawdown(equityCurve);
    const avgDrawdown = calculateAvgDrawdown(equityCurve);
    const drawdownRecords = extractDrawdownRecords(equityCurve);
    const maxDrawdownDuration = drawdownRecords.length > 0
        ? Math.max(...drawdownRecords.map(r => r.recoveryDays ?? 0))
        : 0;
    const calmarRatio = calculateCalmarRatio(annualizedReturn, maxDrawdown);
    // 거래 지표
    const winRate = calculateWinRate(trades);
    const profitFactor = calculateProfitFactor(trades);
    const { avgWin, avgLoss, maxWin, maxLoss } = calculateAvgWinLoss(trades);
    const { maxConsecutiveWins, maxConsecutiveLosses } = calculateConsecutiveWinsLosses(trades);
    const avgHoldingPeriod = calculateAvgHoldingPeriod(trades);
    const expectancy = calculateExpectancy(trades);
    // 기타
    const pnlValues = trades.map(t => t.netPnL);
    const pnlStdDev = pnlValues.length > 0 ? standardDeviation(pnlValues) : 0;
    const avgTradeReturn = pnlValues.length > 0 ? mean(pnlValues) : 0;
    return {
        totalReturn,
        annualizedReturn,
        monthlyReturn,
        sharpeRatio,
        sortinoRatio,
        calmarRatio,
        maxDrawdown,
        avgDrawdown,
        maxDrawdownDuration,
        totalTrades: trades.length,
        winRate,
        profitFactor,
        avgWin,
        avgLoss,
        maxWin,
        maxLoss,
        maxConsecutiveWins,
        maxConsecutiveLosses,
        avgHoldingPeriod,
        pnlStdDev,
        avgTradeReturn,
        expectancy,
    };
}
// ═══════════════════════════════════════════════════════════════
// 헬퍼 함수
// ═══════════════════════════════════════════════════════════════
/**
 * 평균 계산
 */
function mean(values) {
    if (values.length === 0)
        return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}
/**
 * 표준편차 계산
 */
function standardDeviation(values) {
    if (values.length < 2)
        return 0;
    const avg = mean(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(mean(squareDiffs));
}
/**
 * 두 날짜 사이의 일수 계산
 */
function daysBetween(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
//# sourceMappingURL=backtest-calc.js.map