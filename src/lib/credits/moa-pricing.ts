/**
 * MoA Pricing Configuration
 *
 * 3-Tier 크레딧 가격 정책
 */

export const MOA_PRICING = {
  draft: {
    credits: 5,
    label: '초안',
    description: '빠른 초안 생성',
    features: ['기술적 분석가 1명', '기본 리스크 관리', '5분 이내 생성'],
  },
  refined: {
    credits: 10,
    label: '정제',
    description: '2명 전문가 협업',
    features: [
      '기술적 분석가 + 리스크 관리자',
      '균형잡힌 전략',
      '안전성 검증',
      '10분 이내 생성',
    ],
  },
  comprehensive: {
    credits: 20,
    label: '종합',
    description: '4명 전문가 + 안전성 검증',
    features: [
      '4명 전문가 (기술/리스크/패턴/펀더멘털)',
      '다각도 분석',
      '충돌 해결 알고리즘',
      '이중 안전성 검증',
      '백테스팅 권장사항',
    ],
  },
} as const;

export type MoATier = keyof typeof MOA_PRICING;

/**
 * 크레딧 필요 여부 확인
 */
export function getRequiredCredits(tier: MoATier): number {
  return MOA_PRICING[tier].credits;
}

/**
 * 가격 계산 (₩ 기준)
 * 1 크레딧 = ₩71 (베이직 패키지 기준)
 */
export function calculatePrice(tier: MoATier): number {
  const creditPrice = 71; // ₩ per credit
  return MOA_PRICING[tier].credits * creditPrice;
}

/**
 * 티어 업그레이드 추천
 */
export function recommendTierUpgrade(
  userInput: string,
  currentTier: MoATier
): { shouldUpgrade: boolean; reason?: string; recommendedTier?: MoATier } {
  const complexityIndicators = [
    '복잡한',
    '정교한',
    '다양한',
    '종합적인',
    '펀더멘털',
    '패턴',
    '장기',
    '포트폴리오',
  ];

  const hasComplexity = complexityIndicators.some((indicator) =>
    userInput.includes(indicator)
  );

  if (currentTier === 'draft' && hasComplexity) {
    return {
      shouldUpgrade: true,
      reason: '복잡한 전략은 2명 이상의 전문가가 필요합니다.',
      recommendedTier: 'refined',
    };
  }

  if (currentTier === 'refined' && userInput.length > 200) {
    return {
      shouldUpgrade: true,
      reason: '상세한 요구사항은 4명 전문가의 종합 분석이 유리합니다.',
      recommendedTier: 'comprehensive',
    };
  }

  return { shouldUpgrade: false };
}
