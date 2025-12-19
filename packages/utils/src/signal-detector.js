/**
 * @ioblock/utils - Signal Detection Utilities
 * L1 (Molecules) - 전략 시그널 감지
 *
 * 순수 함수 기반 - 부작용 없음
 */
// ═══════════════════════════════════════════════════════════════
// 지표 계산
// ═══════════════════════════════════════════════════════════════
/**
 * 단순 이동 평균 (SMA)
 */
export function calculateSMA(closes, period) {
    const result = [];
    for (let i = 0; i < closes.length; i++) {
        if (i < period - 1) {
            result.push(NaN);
        }
        else {
            const sum = closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
    }
    return result;
}
/**
 * 지수 이동 평균 (EMA)
 */
export function calculateEMA(closes, period) {
    const result = [];
    const multiplier = 2 / (period + 1);
    for (let i = 0; i < closes.length; i++) {
        if (i === 0) {
            result.push(closes[0]);
        }
        else {
            const ema = (closes[i] - result[i - 1]) * multiplier + result[i - 1];
            result.push(ema);
        }
    }
    // 처음 period-1개는 불안정
    for (let i = 0; i < period - 1; i++) {
        result[i] = NaN;
    }
    return result;
}
/**
 * RSI (Relative Strength Index)
 */
export function calculateRSI(closes, period = 14) {
    const result = [];
    const gains = [];
    const losses = [];
    // 변화량 계산
    for (let i = 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? -change : 0);
    }
    // 초기 평균
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    // 첫 번째 RSI
    result.push(...Array(period).fill(NaN));
    for (let i = period; i < gains.length; i++) {
        if (i === period) {
            // 첫 RSI 계산
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            result.push(100 - 100 / (1 + rs));
        }
        else {
            // Smoothed RSI
            avgGain = (avgGain * (period - 1) + gains[i]) / period;
            avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            result.push(100 - 100 / (1 + rs));
        }
    }
    return result;
}
/**
 * MACD
 */
export function calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEMA = calculateEMA(closes, fastPeriod);
    const slowEMA = calculateEMA(closes, slowPeriod);
    // MACD 라인
    const macd = [];
    for (let i = 0; i < closes.length; i++) {
        if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
            macd.push(NaN);
        }
        else {
            macd.push(fastEMA[i] - slowEMA[i]);
        }
    }
    // 시그널 라인 (MACD의 EMA)
    const validMacd = macd.filter(v => !isNaN(v));
    const signalEMA = calculateEMA(validMacd, signalPeriod);
    // 원래 길이에 맞춤
    const signal = [];
    let signalIdx = 0;
    for (let i = 0; i < closes.length; i++) {
        if (isNaN(macd[i])) {
            signal.push(NaN);
        }
        else {
            signal.push(signalEMA[signalIdx++] ?? NaN);
        }
    }
    // 히스토그램
    const histogram = [];
    for (let i = 0; i < closes.length; i++) {
        if (isNaN(macd[i]) || isNaN(signal[i])) {
            histogram.push(NaN);
        }
        else {
            histogram.push(macd[i] - signal[i]);
        }
    }
    return { macd, signal, histogram };
}
/**
 * 볼린저 밴드
 */
export function calculateBollingerBands(closes, period = 20, stdDevMultiplier = 2) {
    const middle = calculateSMA(closes, period);
    const upper = [];
    const lower = [];
    for (let i = 0; i < closes.length; i++) {
        if (i < period - 1) {
            upper.push(NaN);
            lower.push(NaN);
        }
        else {
            const slice = closes.slice(i - period + 1, i + 1);
            const mean = middle[i];
            const variance = slice.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / period;
            const stdDev = Math.sqrt(variance);
            upper.push(mean + stdDevMultiplier * stdDev);
            lower.push(mean - stdDevMultiplier * stdDev);
        }
    }
    return { upper, middle, lower };
}
/**
 * ATR (Average True Range)
 */
export function calculateATR(candles, period = 14) {
    if (candles.length < 2)
        return [];
    const trueRanges = [];
    for (let i = 0; i < candles.length; i++) {
        const candle = candles[i];
        if (i === 0) {
            trueRanges.push(candle.high - candle.low);
        }
        else {
            const prevClose = candles[i - 1].close;
            const tr = Math.max(candle.high - candle.low, Math.abs(candle.high - prevClose), Math.abs(candle.low - prevClose));
            trueRanges.push(tr);
        }
    }
    // ATR은 TR의 EMA
    return calculateEMA(trueRanges, period);
}
// ═══════════════════════════════════════════════════════════════
// 지표 값 조회
// ═══════════════════════════════════════════════════════════════
/**
 * 지표 설정에 따른 값 시리즈 계산
 */
export function getIndicatorValues(candles, config) {
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const opens = candles.map(c => c.open);
    const volumes = candles.map(c => c.volume);
    switch (config.type) {
        case 'price': {
            const source = config.source ?? 'close';
            switch (source) {
                case 'open':
                    return opens;
                case 'high':
                    return highs;
                case 'low':
                    return lows;
                case 'close':
                default:
                    return closes;
            }
        }
        case 'sma':
            return calculateSMA(closes, config.period ?? 20);
        case 'ema':
            return calculateEMA(closes, config.period ?? 20);
        case 'rsi':
            return calculateRSI(closes, config.period ?? 14);
        case 'macd': {
            const { macd } = calculateMACD(closes, config.params?.fastPeriod ?? 12, config.params?.slowPeriod ?? 26, config.params?.signalPeriod ?? 9);
            return macd;
        }
        case 'bollinger': {
            const band = config.params?.band ?? 0; // 0=middle, 1=upper, -1=lower
            const { upper, middle, lower } = calculateBollingerBands(closes, config.params?.period ?? 20, config.params?.stdDev ?? 2);
            if (band > 0)
                return upper;
            if (band < 0)
                return lower;
            return middle;
        }
        case 'atr':
            return calculateATR(candles, config.period ?? 14);
        case 'volume':
            return volumes;
        default:
            return closes;
    }
}
// ═══════════════════════════════════════════════════════════════
// 조건 평가
// ═══════════════════════════════════════════════════════════════
/**
 * 비교 연산자 평가
 */
export function evaluateComparison(leftValue, operator, rightValue, prevLeftValue, prevRightValue) {
    switch (operator) {
        case 'gt':
            return leftValue > rightValue;
        case 'gte':
            return leftValue >= rightValue;
        case 'lt':
            return leftValue < rightValue;
        case 'lte':
            return leftValue <= rightValue;
        case 'eq':
            return Math.abs(leftValue - rightValue) < 0.0001;
        case 'neq':
            return Math.abs(leftValue - rightValue) >= 0.0001;
        case 'cross_above':
            // 이전에는 아래, 지금은 위
            if (prevLeftValue === undefined || prevRightValue === undefined) {
                return false;
            }
            return prevLeftValue <= prevRightValue && leftValue > rightValue;
        case 'cross_below':
            // 이전에는 위, 지금은 아래
            if (prevLeftValue === undefined || prevRightValue === undefined) {
                return false;
            }
            return prevLeftValue >= prevRightValue && leftValue < rightValue;
        default:
            return false;
    }
}
/**
 * 단일 조건 평가
 */
export function evaluateCondition(candles, condition, index) {
    if (index < 1 || index >= candles.length)
        return false;
    // 좌변 값
    const leftValues = getIndicatorValues(candles, condition.left);
    const leftValue = leftValues[index];
    const prevLeftValue = leftValues[index - 1];
    // 우변 값 (지표 또는 상수)
    let rightValue;
    let prevRightValue;
    if (typeof condition.right === 'number') {
        rightValue = condition.right;
        prevRightValue = condition.right;
    }
    else {
        const rightValues = getIndicatorValues(candles, condition.right);
        rightValue = rightValues[index];
        prevRightValue = rightValues[index - 1];
    }
    // NaN 체크
    if (isNaN(leftValue) || isNaN(rightValue)) {
        return false;
    }
    return evaluateComparison(leftValue, condition.operator, rightValue, prevLeftValue, prevRightValue);
}
/**
 * 조건 그룹 평가 (재귀)
 */
export function evaluateConditionGroup(candles, group, index) {
    const results = group.conditions.map(cond => {
        // 중첩 그룹인지 체크
        if ('logic' in cond) {
            return evaluateConditionGroup(candles, cond, index);
        }
        else {
            return evaluateCondition(candles, cond, index);
        }
    });
    if (group.logic === 'and') {
        return results.every(r => r);
    }
    else {
        return results.some(r => r);
    }
}
// ═══════════════════════════════════════════════════════════════
// 시그널 감지
// ═══════════════════════════════════════════════════════════════
/**
 * 진입 시그널 감지
 */
export function detectEntrySignal(candles, entryConditions, currentIndex) {
    return evaluateConditionGroup(candles, entryConditions, currentIndex);
}
/**
 * 청산 시그널 감지
 */
export function detectExitSignal(candles, exitConditions, currentIndex, entryPrice, stopLossPercent, takeProfitPercent) {
    const currentPrice = candles[currentIndex].close;
    // 손절 체크
    if (stopLossPercent !== undefined) {
        const stopLossPrice = entryPrice * (1 - stopLossPercent / 100);
        if (currentPrice <= stopLossPrice) {
            return { exit: true, reason: 'stop_loss' };
        }
    }
    // 익절 체크
    if (takeProfitPercent !== undefined) {
        const takeProfitPrice = entryPrice * (1 + takeProfitPercent / 100);
        if (currentPrice >= takeProfitPrice) {
            return { exit: true, reason: 'take_profit' };
        }
    }
    // 조건 체크
    if (evaluateConditionGroup(candles, exitConditions, currentIndex)) {
        return { exit: true, reason: 'condition' };
    }
    return null;
}
//# sourceMappingURL=signal-detector.js.map