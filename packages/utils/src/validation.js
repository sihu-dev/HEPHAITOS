/**
 * @ioblock/utils - Validation Utilities
 * L1 (Molecules) - 입력 검증 유틸리티
 */
/**
 * API 키 형식 검증 규칙
 */
const API_KEY_PATTERNS = {
    binance: {
        key: /^[A-Za-z0-9]{64}$/,
        secret: /^[A-Za-z0-9]{64}$/,
    },
    upbit: {
        key: /^[A-Za-z0-9-]{36}$/,
        secret: /^[A-Za-z0-9-]{36}$/,
    },
    bithumb: {
        key: /^[A-Za-z0-9]{32}$/,
        secret: /^[A-Za-z0-9]{32}$/,
    },
    coinbase: {
        key: /^[A-Za-z0-9]{16}$/,
        secret: /^[A-Za-z0-9+/=]{88}$/,
    },
    kraken: {
        key: /^[A-Za-z0-9/+=]{56}$/,
        secret: /^[A-Za-z0-9/+=]{88}$/,
    },
};
/**
 * API 키 형식 검증
 *
 * @param exchange - 거래소 종류
 * @param apiKey - API 키
 * @param apiSecret - API 시크릿
 * @returns 검증 결과
 *
 * @example
 * const result = validateApiKey('binance', key, secret);
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 */
export function validateApiKey(exchange, apiKey, apiSecret) {
    const errors = [];
    const patterns = API_KEY_PATTERNS[exchange];
    if (!patterns) {
        return { valid: false, errors: [`Unsupported exchange: ${exchange}`] };
    }
    if (!apiKey || apiKey.trim() === '') {
        errors.push('API key is required');
    }
    else if (!patterns.key.test(apiKey)) {
        errors.push(`Invalid API key format for ${exchange}`);
    }
    if (!apiSecret || apiSecret.trim() === '') {
        errors.push('API secret is required');
    }
    else if (!patterns.secret.test(apiSecret)) {
        errors.push(`Invalid API secret format for ${exchange}`);
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * 암호화폐 심볼 검증
 *
 * @param symbol - 심볼 (예: BTC, ETH)
 * @returns 유효 여부
 */
export function isValidSymbol(symbol) {
    // 1-10자의 대문자 영문 + 숫자
    return /^[A-Z0-9]{1,10}$/.test(symbol.toUpperCase());
}
/**
 * 양수 금액 검증
 *
 * @param amount - 금액
 * @returns 유효 여부
 */
export function isValidAmount(amount) {
    return typeof amount === 'number' && !isNaN(amount) && amount > 0 && isFinite(amount);
}
/**
 * UUID 형식 검증
 *
 * @param uuid - UUID 문자열
 * @returns 유효 여부
 */
export function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
/**
 * ISO 8601 타임스탬프 검증
 *
 * @param timestamp - 타임스탬프 문자열
 * @returns 유효 여부
 */
export function isValidTimestamp(timestamp) {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
}
/**
 * 이메일 형식 검증
 *
 * @param email - 이메일 주소
 * @returns 유효 여부
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * 포트폴리오 이름 검증
 *
 * @param name - 포트폴리오 이름
 * @returns 검증 결과
 */
export function validatePortfolioName(name) {
    const errors = [];
    if (!name || name.trim() === '') {
        errors.push('Portfolio name is required');
    }
    else {
        if (name.length < 2) {
            errors.push('Portfolio name must be at least 2 characters');
        }
        if (name.length > 50) {
            errors.push('Portfolio name must be at most 50 characters');
        }
        if (!/^[A-Za-z0-9가-힣\s-_]+$/.test(name)) {
            errors.push('Portfolio name contains invalid characters');
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * 객체 필수 필드 검증
 *
 * @param obj - 검증할 객체
 * @param requiredFields - 필수 필드 목록
 * @returns 검증 결과
 */
export function validateRequiredFields(obj, requiredFields) {
    const errors = [];
    for (const field of requiredFields) {
        if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
            errors.push(`${field} is required`);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
//# sourceMappingURL=validation.js.map