/**
 * @ioblock/utils - PnL (Profit & Loss) Utilities
 * L1 (Molecules) - 손익 계산 유틸리티
 */
/**
 * 단일 자산의 미실현 손익 계산
 *
 * @param asset - 자산 정보
 * @returns PnL 계산 결과
 */
export function calculateAssetPnL(asset) {
    const costBasis = asset.avg_buy_price
        ? asset.avg_buy_price * asset.amount
        : 0;
    const currentValue = asset.value_usd;
    const absolute = currentValue - costBasis;
    const percentage = costBasis > 0 ? (absolute / costBasis) * 100 : 0;
    return {
        absolute,
        percentage,
        cost_basis: costBasis,
        current_value: currentValue,
    };
}
/**
 * 포트폴리오 전체 손익 계산
 *
 * @param assets - 자산 목록
 * @returns PnL 계산 결과
 */
export function calculatePortfolioPnL(assets) {
    let totalCostBasis = 0;
    let totalCurrentValue = 0;
    for (const asset of assets) {
        if (asset.avg_buy_price) {
            totalCostBasis += asset.avg_buy_price * asset.amount;
        }
        totalCurrentValue += asset.value_usd;
    }
    const absolute = totalCurrentValue - totalCostBasis;
    const percentage = totalCostBasis > 0 ? (absolute / totalCostBasis) * 100 : 0;
    return {
        absolute,
        percentage,
        cost_basis: totalCostBasis,
        current_value: totalCurrentValue,
    };
}
/**
 * 두 스냅샷 간의 수익률 계산
 *
 * @param startSnapshot - 시작 시점 스냅샷
 * @param endSnapshot - 종료 시점 스냅샷
 * @returns 수익률 결과
 */
export function calculateSnapshotReturn(startSnapshot, endSnapshot) {
    const startValue = startSnapshot.total_value_usd;
    const endValue = endSnapshot.total_value_usd;
    const absolute = endValue - startValue;
    const percentage = startValue > 0 ? (absolute / startValue) * 100 : 0;
    return {
        absolute,
        percentage,
        cost_basis: startValue,
        current_value: endValue,
    };
}
/**
 * 기간별 수익률 계산
 *
 * @param snapshots - 시간순 정렬된 스냅샷 배열
 * @param currentValue - 현재 포트폴리오 가치
 * @returns 기간별 수익률 배열
 */
export function calculatePeriodReturns(snapshots, currentValue) {
    const now = new Date();
    const periods = [
        { period: '1d', days: 1 },
        { period: '7d', days: 7 },
        { period: '30d', days: 30 },
        { period: '90d', days: 90 },
        { period: '1y', days: 365 },
    ];
    const results = [];
    for (const { period, days } of periods) {
        const targetDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const snapshot = findClosestSnapshot(snapshots, targetDate);
        if (snapshot) {
            const startValue = snapshot.total_value_usd;
            const returnUsd = currentValue - startValue;
            const returnPercent = startValue > 0 ? (returnUsd / startValue) * 100 : 0;
            results.push({
                period,
                return_usd: returnUsd,
                return_percent: returnPercent,
                start_value: startValue,
                end_value: currentValue,
            });
        }
    }
    // 전체 기간
    if (snapshots.length > 0) {
        const firstSnapshot = snapshots[0];
        const startValue = firstSnapshot.total_value_usd;
        const returnUsd = currentValue - startValue;
        const returnPercent = startValue > 0 ? (returnUsd / startValue) * 100 : 0;
        results.push({
            period: 'all',
            return_usd: returnUsd,
            return_percent: returnPercent,
            start_value: startValue,
            end_value: currentValue,
        });
    }
    return results;
}
/**
 * 특정 날짜에 가장 가까운 스냅샷 찾기
 */
function findClosestSnapshot(snapshots, targetDate) {
    if (snapshots.length === 0)
        return null;
    const targetTime = targetDate.getTime();
    let closest = snapshots[0];
    let minDiff = Math.abs(new Date(closest.recorded_at).getTime() - targetTime);
    for (const snapshot of snapshots) {
        const diff = Math.abs(new Date(snapshot.recorded_at).getTime() - targetTime);
        if (diff < minDiff) {
            minDiff = diff;
            closest = snapshot;
        }
    }
    return closest;
}
/**
 * 샤프 비율 계산 (간략화)
 *
 * @param returns - 일별 수익률 배열 (%)
 * @param riskFreeRate - 무위험 이자율 (연간 %, 기본: 4%)
 * @returns 샤프 비율
 */
export function calculateSharpeRatio(returns, riskFreeRate = 4) {
    if (returns.length < 2)
        return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev === 0)
        return 0;
    // 일별 → 연환산
    const annualizedReturn = mean * 365;
    const annualizedStdDev = stdDev * Math.sqrt(365);
    return (annualizedReturn - riskFreeRate) / annualizedStdDev;
}
/**
 * 최대 낙폭 (MDD) 계산
 *
 * @param values - 시계열 가치 데이터
 * @returns 최대 낙폭 (%)
 */
export function calculateMaxDrawdown(values) {
    if (values.length < 2)
        return 0;
    let maxDrawdown = 0;
    let peak = values[0];
    for (const value of values) {
        if (value > peak) {
            peak = value;
        }
        const drawdown = ((peak - value) / peak) * 100;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    }
    return maxDrawdown;
}
//# sourceMappingURL=pnl.js.map