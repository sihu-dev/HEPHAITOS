/**
 * @ioblock/types - HEPHAITOS Asset Types
 * L0 (Atoms) - 자산 관련 타입 정의
 */
/**
 * 자산 생성 헬퍼 (불변성 보장)
 */
export function createAsset(params) {
    return {
        ...params,
        value_usd: params.amount * params.price_usd,
    };
}
//# sourceMappingURL=asset.js.map