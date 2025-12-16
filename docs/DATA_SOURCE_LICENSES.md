# 데이터 소스 라이선스 검증 체크리스트

> **작성일**: 2025-12-16
> **상태**: 검증 필요 (P0 게이트)
> **책임자**: Product/Legal Team

---

## 검증 필요성

HEPHAITOS는 다음 외부 데이터 소스를 사용하여 서비스를 제공합니다:
1. **Unusual Whales** - 의원 거래 데이터 (Nancy Pelosi 포트폴리오 등)
2. **Polygon** - 실시간/과거 가격 데이터
3. **SEC EDGAR** - 공시 데이터 (Public Domain)

**리스크**: 상업적 이용/재배포 위반 시 법적 분쟁, 서비스 중단, 데이터 소스 차단 가능

---

## 1. Unusual Whales

### 현재 사용 현황
- **구독 플랜**: (확인 필요)
- **사용 목적**:
  - Nancy Pelosi 등 의원 포트폴리오 데이터 표시
  - "따라하기(COPY)" 기능의 핵심 데이터
  - 마케팅 훅: "낸시 펠로시 포트폴리오 따라하기"

### 검증 항목 체크리스트

#### ✅ 필수 확인 사항
- [ ] **상업적 이용(Commercial Use) 허용 여부**
  - ToS 확인 위치: https://unusualwhales.com/terms
  - 허용 범위: B2C SaaS 서비스에서 사용 가능한지
  - 제한사항: 특정 산업/용도 제외 조항 확인

- [ ] **재배포(Redistribution) 허용 여부**
  - 사용자에게 데이터를 보여주는 것이 "재배포"로 간주되는지
  - API를 통한 간접 제공이 허용되는지
  - Raw 데이터 다운로드 제공 금지 여부

- [ ] **Attribution(출처 표기) 의무**
  - "Data provided by Unusual Whales" 표기 필요 여부
  - 로고 사용 가이드라인
  - 링크백(Link-back) 요구사항

- [ ] **Rate Limiting & API 제한**
  - API 호출 한도 (월/일/시간당)
  - 동시 접속 제한
  - 데이터 캐싱 정책 (몇 시간까지 허용되는지)

- [ ] **데이터 정확성 면책**
  - Unusual Whales가 데이터 오류에 대해 책임지지 않음을 명시하는지
  - HEPHAITOS도 동일한 면책조항을 사용자에게 전달해야 함

#### ⚠️ 추가 확인 사항
- [ ] 구독 플랜별 제한 (개인용 vs 기업용)
- [ ] 가격 인상/플랜 변경 통지 기간
- [ ] 서비스 중단 시 대체 소스 존재 여부

### 조치 사항 (검증 전까지)
1. **즉시 조치**: Nancy 포트폴리오 기능 베타 전까지 "준비중" 처리
2. **대체 방안**: SEC Form 4 (공개 데이터)로 Fallback 설계
3. **법무 검토**: Unusual Whales 담당자와 상업적 이용 명시적 허가 요청

---

## 2. Polygon

### 현재 사용 현황
- **구독 플랜**: (확인 필요)
- **사용 목적**:
  - 백테스팅용 과거 가격 데이터
  - 실시간 시세 표시 (차트)
  - 주문 전 현재가 조회

### 검증 항목 체크리스트

#### ✅ 필수 확인 사항
- [ ] **상업적 이용 허용 여부**
  - ToS 확인 위치: https://polygon.io/terms
  - 무료 티어에서 상업적 사용 금지 여부
  - Starter/Developer 플랜이 B2C SaaS에서 사용 가능한지

- [ ] **재배포 제한**
  - 차트 표시가 "재배포"로 간주되는지
  - API를 통한 백테스팅 결과 공유 허용 여부
  - 사용자에게 Raw 가격 데이터 제공 금지 여부

- [ ] **Attribution 의무**
  - "Market data by Polygon.io" 표기 필요 여부
  - 로고/링크 요구사항

- [ ] **Data Delay (지연 시간)**
  - 무료/저가 플랜에서 데이터 지연 (15분? 실시간?)
  - 백테스팅용 과거 데이터 범위 (최대 몇 년?)

- [ ] **Rate Limiting**
  - API 호출 한도 (월/일/분당)
  - WebSocket 동시 연결 제한
  - 초과 시 과금 또는 차단

#### ⚠️ 추가 확인 사항
- [ ] NASDAQ/NYSE 데이터 별도 라이선스 필요 여부
- [ ] 한국 시장 데이터 제공 여부 (KRX)
- [ ] 데이터 품질 보증 (SLA)

### 조치 사항 (검증 전까지)
1. **즉시 조치**: 백테스팅 페이지에 "데이터 제공: Polygon.io" attribution 추가
2. **대체 방안**: Yahoo Finance (무료, 제한적) 또는 Alpha Vantage
3. **비용 최적화**: 캐싱 전략으로 API 호출 최소화

---

## 3. SEC EDGAR (안전)

### 라이선스 상태
- ✅ **Public Domain**: 미국 연방 정부 데이터로 자유롭게 사용 가능
- ✅ **상업적 이용**: 허용
- ✅ **재배포**: 허용 (출처 표기 권장이나 필수 아님)

### 준수 사항
- ⚠️ **Rate Limit**:
  - 초당 10 requests 제한
  - User-Agent 헤더 필수 (이름/이메일 포함)
  - 예: `User-Agent: HEPHAITOS/1.0 (contact@hephaitos.io)`

### 구현 체크리스트
- [ ] SEC API 호출 시 User-Agent 헤더 추가
- [ ] Rate limiting 구현 (10 req/sec 준수)
- [ ] 캐싱으로 중복 호출 최소화

---

## 4. 데이터 소스 Fallback 전략

### Primary → Secondary 매핑

| 기능 | Primary | Secondary | Tertiary |
|------|---------|-----------|----------|
| 의원 거래 | Unusual Whales | SEC Form 4 (직접 파싱) | - |
| 미국 주식 시세 | Polygon | Yahoo Finance | Alpha Vantage |
| 한국 주식 시세 | 한국투자증권 API | - | - |
| 공시 데이터 | SEC EDGAR | - | - |

### Fallback 구현 가이드
```typescript
// src/lib/data-sources/stock-price.ts
export async function getStockPrice(symbol: string): Promise<number> {
  try {
    // Primary: Polygon
    return await polygonClient.getPrice(symbol);
  } catch (error) {
    console.warn('[Fallback] Polygon failed, trying Yahoo Finance');

    try {
      // Secondary: Yahoo Finance
      return await yahooFinanceClient.getPrice(symbol);
    } catch (secondaryError) {
      // Tertiary: Alpha Vantage
      return await alphaVantageClient.getPrice(symbol);
    }
  }
}
```

---

## 5. Attribution 구현 체크리스트

### UI 표시 위치
- [ ] **랜딩 페이지 Footer**
  - "Market data provided by Polygon.io and SEC EDGAR"

- [ ] **차트 컴포넌트**
  - 우측 하단에 작은 텍스트: "Data: Polygon.io"

- [ ] **Nancy 포트폴리오 페이지** (Unusual Whales 사용 시)
  - 상단 안내: "Congressional trade data by Unusual Whales"
  - 링크: https://unusualwhales.com

- [ ] **면책조항에 추가**
  ```
  데이터 정확성: 본 서비스는 Polygon.io, SEC EDGAR, Unusual Whales 등
  외부 데이터를 사용하며, 데이터 오류나 지연에 대해 책임지지 않습니다.
  ```

### 코드 구현 예시
```tsx
// src/components/layout/Footer.tsx
<div className="text-xs text-zinc-500">
  Market data provided by{' '}
  <a href="https://polygon.io" className="underline">Polygon.io</a>
  {' and '}
  <a href="https://sec.gov" className="underline">SEC EDGAR</a>
</div>
```

---

## 6. 즉시 조치 사항 (오늘 내)

### Priority 1: 라이선스 문서 확인
- [ ] Unusual Whales ToS 정독 (https://unusualwhales.com/terms)
- [ ] Polygon ToS 정독 (https://polygon.io/terms)
- [ ] 상업적 이용 조항 스크린샷 저장

### Priority 2: Attribution 추가
- [ ] Footer에 데이터 제공자 명시
- [ ] 차트 컴포넌트에 "Data by Polygon.io" 추가
- [ ] Nancy 포트폴리오에 "Data by Unusual Whales" 추가

### Priority 3: Rate Limiting 구현
- [ ] SEC EDGAR API에 User-Agent 헤더 추가
- [ ] 10 req/sec rate limiter 구현
- [ ] Polygon API 호출 한도 모니터링

### Priority 4: 법무 문의
- [ ] Unusual Whales 담당자 이메일: support@unusualwhales.com
- [ ] 상업적 이용 명시적 허가 요청
- [ ] 응답 대기 기간 동안 Nancy 기능 "준비중" 처리

---

## 7. 검증 완료 기준

### P0 게이트 통과 조건
- ✅ Unusual Whales 상업적 이용 명시적 허가 OR 대체 소스 확정
- ✅ Polygon 상업적 이용 확인 (플랜 업그레이드 필요 시 예산 확보)
- ✅ 모든 데이터 소스에 Attribution 구현 (UI 배포)
- ✅ SEC EDGAR rate limit 준수 구현
- ✅ Fallback 로직 구현 및 테스트

### 문서화 완료
- ✅ 이 문서에 검증 결과 기록
- ✅ Git에 커밋 (추적 가능하도록)
- ✅ V2 검수 자료에 반영

---

## 8. 검증 결과 기록 (작성 대기)

### Unusual Whales
- **검증일**: (미정)
- **상업적 이용**: (허용/불허/조건부)
- **재배포**: (허용/불허/조건부)
- **Attribution 요구**: (예/아니오)
- **비고**:

### Polygon
- **검증일**: (미정)
- **상업적 이용**: (허용/불허/조건부)
- **재배포**: (허용/불허/조건부)
- **Attribution 요구**: (예/아니오)
- **비고**:

### SEC EDGAR
- ✅ **검증 완료**: Public Domain, 자유 사용
- ✅ **Rate Limit**: 초당 10 requests 준수 필요
- ✅ **User-Agent**: 필수

---

## 9. 리스크 평가

### High Risk (즉시 조치 필요)
- ❗ **Unusual Whales 무단 상업 사용**
  - 영향: 법적 분쟁, Nancy 기능 중단
  - 완화: 명시적 허가 요청 OR 베타에서 Nancy 기능 제외

### Medium Risk (베타 중 해결)
- ⚠️ **Polygon 무료 플랜 상업 사용 제한**
  - 영향: API 차단, 백테스팅 불가
  - 완화: 유료 플랜 업그레이드 ($200/월)

### Low Risk (운영 최적화)
- ⚠️ **SEC EDGAR Rate Limit 초과**
  - 영향: 일시적 IP 차단 (10분)
  - 완화: Rate limiter 구현

---

## 10. 다음 단계

1. **오늘 (2025-12-16)**:
   - [ ] Unusual Whales ToS 확인
   - [ ] Polygon ToS 확인
   - [ ] Attribution UI 구현

2. **내일 (2025-12-17)**:
   - [ ] 법무팀 또는 Unusual Whales에 이메일 발송
   - [ ] Fallback 로직 설계

3. **2일 내 (2025-12-18)**:
   - [ ] P0 게이트 완료 확인
   - [ ] V2 검수 자료 생성 시작

---

*이 문서는 베타 런칭 전 필수 완료 항목(P0 게이트)입니다.*
