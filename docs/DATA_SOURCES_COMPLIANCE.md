# 데이터 소스 라이선스 및 ToS 준수 현황

> GPT V1 피드백 P0-5: 데이터 소스 라이선스/ToS 준수 확인
> 최종 업데이트: 2025-12-17

---

## 요약

| 데이터 소스 | 라이선스 유형 | 상업적 이용 | ToS 준수 | 상태 |
|------------|-------------|------------|---------|------|
| SEC EDGAR | 공개 데이터 | O | O | ✅ 완료 |
| Unusual Whales | 유료 API | O (구독) | △ 검토필요 | ⚠️ 검토중 |
| Quiver Quantitative | 유료 API | O (구독) | △ 검토필요 | ⚠️ 검토중 |
| KIS Developers | 무료 API | O | O | ✅ 완료 |
| TradingView | 위젯 | O (출처표시) | O | ✅ 완료 |

---

## 1. SEC EDGAR

### 라이선스
- **유형**: Public Domain (미국 정부 공개 데이터)
- **URL**: https://www.sec.gov/os/accessing-edgar-data
- **비용**: 무료

### ToS 핵심 조항
```
- 데이터 재배포 가능
- 출처 명시 권장
- Rate Limit: 10 requests/second per user
- User-Agent 헤더 필수
```

### 준수 현황
- [x] User-Agent 헤더 설정: `HEPHAITOS/1.0 (support@ioblock.io)`
- [x] Rate Limit 준수 (10 req/s)
- [x] 출처 명시: "Data provided by SEC EDGAR"

### 관련 코드
- `src/lib/data/sec-edgar.ts`
- `src/lib/api/external/sec-client.ts`

---

## 2. Unusual Whales

### 라이선스
- **유형**: 유료 구독 API
- **URL**: https://unusualwhales.com/api
- **비용**: $999/월 (Congress Trading Data)

### ToS 핵심 조항 (검토 필요)
```
⚠️ 아래 조항 법무 검토 필요:

1. 재배포 제한
   - 원본 데이터 직접 노출 금지 (가공 후 표시 가능)
   - 경쟁 서비스에 데이터 제공 금지

2. 귀속 요구사항
   - "Data provided by Unusual Whales" 문구 필수
   - 로고 사용 시 별도 승인 필요

3. 사용량 제한
   - API 호출 제한: 계약에 따라 다름
   - 캐싱 허용: 최대 24시간
```

### 준수 조치
- [ ] **법무팀 ToS 검토** (2025-12-20 예정)
- [x] 출처 명시 문구 추가
- [x] 데이터 캐싱 24시간 제한 설정
- [ ] 재배포 제한 관련 기술적 조치

### 관련 코드
- `src/lib/data/unusual-whales.ts`
- `src/components/congress/CongressTradesTable.tsx`

---

## 3. Quiver Quantitative

### 라이선스
- **유형**: 유료 구독 API
- **URL**: https://www.quiverquant.com/api
- **비용**: $499/월

### ToS 핵심 조항 (검토 필요)
```
⚠️ 아래 조항 법무 검토 필요:

1. 데이터 사용 범위
   - 내부 분석 목적: 허용
   - 최종 사용자 표시: 조건부 허용

2. 귀속 요구사항
   - API 데이터 출처 표시 필수
   - "Powered by Quiver Quantitative" 권장

3. 경쟁 제한
   - 데이터 재판매 금지
   - 유사 서비스 구축 목적 사용 제한 가능
```

### 준수 조치
- [ ] **법무팀 ToS 검토** (2025-12-20 예정)
- [x] 출처 명시 문구 추가
- [ ] 사용 범위 명확화 협의

### 관련 코드
- `src/lib/data/quiver.ts`
- `src/components/alternative/AlternativeDataDashboard.tsx`

---

## 4. KIS Developers (한국투자증권)

### 라이선스
- **유형**: 무료 API (계좌 보유 필요)
- **URL**: https://apiportal.koreainvestment.com/
- **비용**: 무료

### ToS 핵심 조항
```
1. 사용 조건
   - 한국투자증권 계좌 보유 필수
   - 개인/법인 모두 이용 가능

2. 기술 요구사항
   - OAuth 2.0 인증
   - Rate Limit: 1초당 20건

3. 금지 사항
   - API 키 공유 금지
   - 자동매매 봇 과도한 호출 금지
```

### 준수 현황
- [x] OAuth 2.0 구현
- [x] Rate Limit 준수 (자체 리미터 적용)
- [x] API 키 보안 (환경변수 + 암호화)
- [x] 사용자별 인증 분리

### 관련 코드
- `src/lib/broker/adapters/kis.ts`
- `src/lib/broker/auth/kis-oauth.ts`

---

## 5. TradingView

### 라이선스
- **유형**: 위젯 라이선스 (Lightweight Charts)
- **URL**: https://www.tradingview.com/lightweight-charts/
- **비용**: 무료 (Apache 2.0)

### ToS 핵심 조항
```
1. Lightweight Charts (오픈소스)
   - Apache 2.0 라이선스
   - 상업적 이용 가능
   - 출처 명시 권장

2. 내장 위젯 사용 시
   - "Powered by TradingView" 로고 필수
   - 위젯 수정 금지
```

### 준수 현황
- [x] Lightweight Charts 사용 (Apache 2.0)
- [x] 라이선스 파일 포함
- [x] 출처 명시

### 관련 코드
- `src/components/charts/TradingViewChart.tsx`
- `package.json` (lightweight-charts 의존성)

---

## 법무 검토 체크리스트

### 완료 항목
- [x] SEC EDGAR 이용약관 검토
- [x] KIS Developers 이용약관 검토
- [x] TradingView 라이선스 검토
- [x] 출처 명시 문구 전체 적용

### 검토 필요 항목
- [ ] Unusual Whales 재배포 제한 조항
- [ ] Quiver Quantitative 사용 범위 협의
- [ ] 면책조항 법적 유효성 검토

---

## 기술적 준수 조치

### 1. 데이터 캐싱 정책
```typescript
// src/lib/cache/data-cache-policy.ts
export const DATA_CACHE_POLICY = {
  SEC_EDGAR: 3600,        // 1시간
  UNUSUAL_WHALES: 86400,  // 24시간 (ToS 최대치)
  QUIVER: 86400,          // 24시간
  KIS_MARKET: 60,         // 1분 (실시간 데이터)
}
```

### 2. 출처 표시 컴포넌트
```typescript
// src/components/ui/DataAttribution.tsx
export function DataAttribution({ source }: { source: DataSource }) {
  // Unusual Whales, Quiver 등 출처 자동 표시
}
```

### 3. Rate Limit 설정
```typescript
// src/lib/redis/external-api-limits.ts
export const EXTERNAL_API_LIMITS = {
  SEC_EDGAR: { perSecond: 10 },
  UNUSUAL_WHALES: { perMinute: 60 },
  QUIVER: { perMinute: 100 },
  KIS: { perSecond: 20 },
}
```

---

## 대체 소스 전략 (Fallback)

### Unusual Whales 대체 옵션

| 대체 소스 | 데이터 | 비용 | 라이선스 |
|----------|--------|------|---------|
| **SEC EDGAR** (Primary Fallback) | 13F 공시 | 무료 | Public Domain ✅ |
| **OpenInsider** | 내부자 거래 | 무료 | 웹 스크래핑 주의 |
| **Capitol Trades** | 의회 거래 | $49/월 | 검토 필요 |

### Quiver 대체 옵션

| 대체 소스 | 데이터 | 비용 | 라이선스 |
|----------|--------|------|---------|
| **SEC EDGAR** | 공시 데이터 | 무료 | Public Domain ✅ |
| **Alpha Vantage** | 펀더멘털 | $49/월 | 상업적 이용 가능 |
| **Financial Modeling Prep** | 대안 데이터 | $29/월 | 상업적 이용 가능 |

### Fallback 구현 전략

```typescript
// src/lib/data/data-source-fallback.ts
export async function getCongressTrades(params: TradeParams) {
  try {
    // Primary: Unusual Whales
    return await unusualWhalesClient.getCongressTrades(params);
  } catch (error) {
    // Fallback: SEC EDGAR
    console.warn('Unusual Whales unavailable, using SEC EDGAR');
    return await secEdgarClient.get13FFilings(params);
  }
}
```

---

## P0 게이트 완료 조건

### 옵션 A: 현재 소스 유지 (법무 승인 필요)
- [ ] Unusual Whales ToS 법무 검토 완료
- [ ] Quiver ToS 법무 검토 완료
- [ ] Attribution 표시 전체 적용
- [ ] 계약서 서명 완료

### 옵션 B: 대체 소스로 전환 (즉시 가능)
- [x] SEC EDGAR만 사용 (Public Domain)
- [x] Attribution 불필요
- [ ] Fallback 코드 구현
- [ ] UI에서 유료 데이터 소스 제거

### 권장: 옵션 B (베타 런칭) → 옵션 A (정식 런칭)

베타 기간에는 SEC EDGAR (무료, 법적 리스크 0)만 사용하고,
정식 런칭 전에 유료 API 라이선스 확보

---

## 담당자

| 역할 | 담당 | 연락처 |
|------|------|--------|
| 기술 검토 | 개발팀 | dev@ioblock.io |
| 법무 검토 | 법무팀 | legal@ioblock.io |
| 계약 관리 | 경영지원 | admin@ioblock.io |

---

## CHANGELOG

### 2025-12-17
- 대체 소스 전략 (Fallback) 섹션 추가
- P0 게이트 완료 조건 명확화
- 권장: 베타는 SEC EDGAR만 사용

---

*이 문서는 정기적으로 업데이트되어야 합니다.*
*다음 검토 예정일: 2025-12-20*
