/**
 * @ioblock/types - HEPHAITOS Exchange Types
 * L0 (Atoms) - 거래소 관련 타입 정의
 */
/**
 * 거래소별 설정 상수
 */
export const EXCHANGE_CONFIGS = {
    binance: {
        type: 'binance',
        name: 'Binance',
        baseUrl: 'https://api.binance.com',
        rateLimit: 1200,
        features: ['spot', 'futures', 'margin', 'staking'],
    },
    upbit: {
        type: 'upbit',
        name: 'Upbit',
        baseUrl: 'https://api.upbit.com',
        rateLimit: 600,
        features: ['spot'],
    },
    bithumb: {
        type: 'bithumb',
        name: 'Bithumb',
        baseUrl: 'https://api.bithumb.com',
        rateLimit: 300,
        features: ['spot'],
    },
    coinbase: {
        type: 'coinbase',
        name: 'Coinbase',
        baseUrl: 'https://api.coinbase.com',
        rateLimit: 600,
        features: ['spot', 'staking'],
    },
    kraken: {
        type: 'kraken',
        name: 'Kraken',
        baseUrl: 'https://api.kraken.com',
        rateLimit: 600,
        features: ['spot', 'futures', 'margin', 'staking'],
    },
};
//# sourceMappingURL=exchange.js.map