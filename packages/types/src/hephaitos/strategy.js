/**
 * @ioblock/types - HEPHAITOS Strategy Types
 * L0 (Atoms) - 트레이딩 전략 타입 정의
 */
/**
 * 기본 전략 템플릿
 */
export const STRATEGY_TEMPLATES = {
    /** 골든 크로스 전략 */
    golden_cross: {
        name: '골든 크로스',
        type: 'trend_following',
        timeframe: '1d',
        entryConditions: {
            logic: 'and',
            conditions: [
                {
                    left: { type: 'sma', period: 50 },
                    operator: 'cross_above',
                    right: { type: 'sma', period: 200 },
                },
            ],
        },
        exitConditions: {
            logic: 'or',
            conditions: [
                {
                    left: { type: 'sma', period: 50 },
                    operator: 'cross_below',
                    right: { type: 'sma', period: 200 },
                },
            ],
        },
    },
    /** RSI 과매도 반등 */
    rsi_oversold: {
        name: 'RSI 과매도 반등',
        type: 'mean_reversion',
        timeframe: '4h',
        entryConditions: {
            logic: 'and',
            conditions: [
                {
                    left: { type: 'rsi', period: 14 },
                    operator: 'cross_above',
                    right: 30,
                },
            ],
        },
        exitConditions: {
            logic: 'or',
            conditions: [
                {
                    left: { type: 'rsi', period: 14 },
                    operator: 'gt',
                    right: 70,
                },
            ],
        },
    },
    /** 볼린저밴드 돌파 */
    bollinger_breakout: {
        name: '볼린저밴드 돌파',
        type: 'breakout',
        timeframe: '1h',
        entryConditions: {
            logic: 'and',
            conditions: [
                {
                    left: { type: 'price', source: 'close' },
                    operator: 'cross_above',
                    right: { type: 'bollinger', params: { period: 20, stdDev: 2, band: 1 } }, // upper
                },
            ],
        },
        exitConditions: {
            logic: 'or',
            conditions: [
                {
                    left: { type: 'price', source: 'close' },
                    operator: 'cross_below',
                    right: { type: 'bollinger', params: { period: 20, stdDev: 2, band: 0 } }, // middle
                },
            ],
        },
    },
};
//# sourceMappingURL=strategy.js.map