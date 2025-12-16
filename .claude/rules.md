# HEPHAITOS 개발 규칙

## 핵심 각인 (매 세션 확인)

```text
HEPHAITOS = "Replit for Trading"
코딩 없이 자연어로 AI 트레이딩 봇을 만드는 플랫폼

COPY → LEARN → BUILD
최종 목표: 스스로 자동매매하는 나만의 AI Agent 빌드

❌ 투자 조언 절대 금지
✅ 교육 + 도구만 제공
```

## 법률 준수 (CRITICAL)

### 금지 표현

- "수익 보장", "확실한 수익"
- "~하세요" (권유형)
- 구체적 종목 추천
- 매수/매도 시점 조언

### 허용 표현

- "교육 목적", "참고용"
- "~할 수 있습니다" (설명형)
- "과거 성과는 미래를 보장하지 않습니다"

### 필수 면책조항

모든 투자 관련 화면에 표시:

```text
본 서비스는 투자 교육 및 도구 제공 목적이며,
투자 조언이 아닙니다. 투자 결정은 본인 책임입니다.
```

## 코드 스타일

### TypeScript

- strict mode 필수
- any 타입 사용 금지 (unknown 사용)
- interface 선호 (type은 유니온/인터섹션용)
- 화살표 함수 선호
- async/await 사용 (then 체인 금지)

### React/Next.js

- 함수형 컴포넌트만 사용
- Server Components 우선 (use client 최소화)
- 커스텀 훅으로 로직 분리
- Props는 interface로 정의

### 파일 명명

- 컴포넌트: `PascalCase.tsx`
- 훅: `use-kebab-case.ts`
- 유틸: `kebab-case.ts`
- 타입: `types.ts`

## 디자인 시스템

### 컬러

- Primary: `#5E6AD2` (Linear Purple) - CTA만
- Background: `#0D0D0F` (Deep Space)
- Profit: `#22C55E`
- Loss: `#EF4444`

### Glass Effect

```css
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.06);
```

## 핵심 제품 구성

| 구성요소 | 설명 |
|----------|------|
| Dashboard | 포트폴리오, 셀럽 팔로잉, AI 분석, 전략 모니터링 |
| Trading Agent | 24시간 자율 동작, 학습, Explainable AI |
| Skills | 드래그앤드롭 전략 블록 (기술지표, 패턴, AI, 리스크) |
| UnifiedBroker | 3분 내 증권사 연동 (KIS, 키움, Alpaca) |

## 참조 문서

1. `BUSINESS_CONSTITUTION.md` - 사업 헌법 (불변 원칙)
2. `BUSINESS_OVERVIEW.md` - 사업 개요서
3. `DESIGN_SYSTEM.md` - UI/UX 규칙
4. `docs/HEPHAITOS_CORE_REFERENCES.md` - 외부 API 레퍼런스
