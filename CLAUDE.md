# HEPHAITOS 프로젝트 Claude Code 가이드

> **세션 시작 시 반드시 읽을 것**
> **마지막 업데이트**: 2025-12-18

---

## ⚠️ CRITICAL - 반드시 준수 사항

**IMPORTANT: YOU MUST follow these rules in every response:**

1. **투자 조언 절대 금지** - 어떤 상황에서도 투자 권유 표현 사용 금지
2. **any 타입 사용 금지** - TypeScript strict mode 필수, unknown 사용
3. **면책조항 필수** - 모든 트레이딩 UI에 면책조항 포함
4. **Planning-First** - 코드 작성 전 반드시 관련 파일 읽고 계획 수립

**YOU MUST NOT:**
- 사용자의 명시적 요청 없이 바로 코딩 시작
- "수익 보장", "확실한 수익", "~하세요" 표현 사용
- any 타입, 타입 단언(as any) 사용
- 하드코딩된 컬러값, 인라인 스타일 사용

**YOU MUST:**
- 새 기능 구현 전 관련 파일 먼저 읽기
- 계획을 세우고 승인받은 후 구현
- TypeScript strict mode, Tailwind 토큰 사용
- 테스트 작성 후 빌드 확인

---

## 핵심 각인 (매 세션 시작 시)

```
┌─────────────────────────────────────────────────────────────────┐
│  HEPHAITOS = "Replit for Trading"                               │
│                                                                 │
│  코딩 없이 자연어로 AI 트레이딩 봇을 만드는 플랫폼               │
│                                                                 │
│  COPY  → LEARN → BUILD                                          │
│  (따라하기)  (배우기)  (만들기)                                    │
│                                                                 │
│  최종 목표: 스스로 자동매매하는 나만의 AI Agent 빌드             │
│                                                                 │
│  ❌ 투자 조언 절대 금지                                          │
│  ✅ 교육 + 도구만 제공                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 핵심 제품 구성

| 구성요소 | 설명 |
|----------|------|
| **Dashboard** | 포트폴리오, 셀럽 팔로잉, AI 분석, 전략 모니터링 |
| **Trading Agent** | 24시간 자율 동작, 학습, Explainable AI |
| **Skills** | 드래그앤드롭 전략 블록 (기술지표, 패턴, AI, 리스크) |
| **UnifiedBroker** | 3분 내 증권사 연동 (KIS, 키움, Alpaca) |

---

## 필수 참조 문서

| 우선순위 | 문서 | 경로 | 용도 |
|---------|------|------|------|
| **1** | 사업 헌법 | `./BUSINESS_CONSTITUTION.md` | 불변의 사업 원칙 |
| **2** | 사업 개요 | `./BUSINESS_OVERVIEW.md` | 투자자용 사업 설명서 |
| **3** | 디자인 시스템 | `./DESIGN_SYSTEM.md` | UI/UX 규칙 |
| **4** | API 레퍼런스 | `./docs/HEPHAITOS_CORE_REFERENCES.md` | 외부 API 가이드 |
| **5** | 분석 리포트 | `./docs/HEPHAITOS_DEEP_ANALYSIS_REPORT.md` | 코드 분석 |

---

## 기술 스택 (확정)

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4.0 + Custom Design System
- **Charts**: TradingView Lightweight Charts v5 / Recharts
- **State**: Zustand + TanStack Query

### Backend
- **Database**: Supabase (PostgreSQL + Realtime)
- **Auth**: Supabase Auth
- **AI**: Vercel AI SDK 4.2 + Claude 4
- **Payments**: Tosspayments

### External APIs
| API | 용도 | 비용 |
|-----|------|------|
| Unusual Whales | 의원 거래 데이터 | $999/월 |
| Quiver Quantitative | 대안 데이터 | $499/월 |
| SEC EDGAR | 공시 데이터 | 무료 |
| KIS Developers | 한국 증권사 연동 | 무료 |

---

## 디자인 원칙 (절대 준수)

### 1. Dark Mode Only
```css
--bg-primary: #0D0D0F;
--primary: #5E6AD2;  /* Linear Purple */
```

### 2. Glass Morphism
```css
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.06);
```

### 3. 컬러 사용
- Primary (#5E6AD2): CTA, 중요 액션만
- Profit (#22C55E): 수익/상승
- Loss (#EF4444): 손실/하락

---

## 코드 패턴

### UnifiedBroker (증권사 연동)
```typescript
interface UnifiedBroker {
  connect(credentials): Promise<ConnectionResult>;
  getBalance(): Promise<Balance>;
  getHoldings(): Promise<Holding[]>;
  buy(stockCode, quantity, price?): Promise<OrderResult>;
  sell(stockCode, quantity, price?): Promise<OrderResult>;
  subscribePrice(stockCode, callback): void;
}
```

### AI 전략 생성
```typescript
const strategy = await generateStrategy({
  model: 'claude-4',
  prompt: user.naturalLanguageInput,
  context: {
    riskProfile: user.riskProfile,
    targetReturn: user.targetReturn,
  }
});
```

---

## ⚠️ 법률 준수 (CRITICAL - 위반 시 법적 문제 발생)

**IMPORTANT: 금융 규제 준수는 필수입니다.**

### 모든 화면에 표시할 면책조항
```
본 서비스는 투자 교육 및 도구 제공 목적이며,
투자 조언이 아닙니다. 투자 결정은 본인 책임입니다.
```

### ❌ YOU MUST NOT use these phrases (금지 표현)
- "수익 보장", "확실한 수익" → **법적 문제**
- "~하세요" (권유형) → **투자 권유로 해석**
- 구체적 종목 추천 → **미등록 투자자문**
- "이 전략을 사용하세요" → **투자 조언**

### ✅ YOU MUST use these phrases (허용 표현)
- "교육 목적", "참고용"
- "~할 수 있습니다" (설명형)
- "과거 성과는 미래를 보장하지 않습니다"
- "이 전략은 ~한 특징이 있습니다" (설명)

---

## 디렉토리 구조

```text
HEPHAITOS/
├── .claude/              # Claude Code 프로젝트 설정
│   ├── settings.local.json
│   └── rules.md
├── docs/                 # 분석 리포트 및 레퍼런스
│   ├── HEPHAITOS_CORE_REFERENCES.md
│   ├── HEPHAITOS_DEEP_ANALYSIS_REPORT.md
│   └── HEPHAITOS_IMPLEMENTATION_COMPLETE.md
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API 라우트 (strategies, exchange, etc.)
│   │   ├── auth/         # 인증 페이지
│   │   └── dashboard/    # 대시보드 페이지
│   ├── components/
│   │   ├── ui/           # 기본 UI (Button, Card, etc.)
│   │   ├── strategy-builder/  # 전략 빌더
│   │   ├── dashboard/    # 대시보드 컴포넌트
│   │   └── layout/       # 레이아웃
│   ├── hooks/            # 커스텀 훅
│   ├── lib/              # 핵심 라이브러리
│   │   ├── agent/        # 자연어 → 전략 Agent
│   │   ├── trading/      # Trade Executor, Crypto
│   │   ├── broker/       # UnifiedBroker
│   │   ├── mirroring/    # 셀럽 포트폴리오 미러링
│   │   ├── coaching/     # 실시간 멘토 코칭
│   │   ├── ai/           # AI 리포트 생성
│   │   └── simulation/   # 시뮬레이션 계좌
│   ├── stores/           # Zustand 스토어
│   └── types/            # 타입 정의
├── supabase/             # Supabase 설정
├── BUSINESS_CONSTITUTION.md  # 사업 헌법 (불변)
├── BUSINESS_OVERVIEW.md      # 사업 개요서
├── DESIGN_SYSTEM.md          # 디자인 시스템
└── CLAUDE.md (이 파일)
```

---

## 개발 체크리스트

### 기능 개발 전
- [ ] BUSINESS_CONSTITUTION.md의 핵심 각인 확인
- [ ] 해당 기능이 Copy/Learn/Build 중 어디에 해당하는지 확인
- [ ] 법률 준수 사항 확인

### 코드 작성 시
- [ ] TypeScript strict mode 준수
- [ ] 디자인 시스템 토큰 사용 (하드코딩 금지)
- [ ] Glass Morphism 패턴 적용
- [ ] 에러 핸들링 완료

### 배포 전
- [ ] 면책조항 표시 확인
- [ ] 투자 조언 표현 없음 확인
- [ ] 반응형 테스트 완료

---

## 커밋 메시지 규칙

```
feat(copy): 셀럽 포트폴리오 미러링 기능
feat(learn): AI 멘토 코칭 시스템
feat(build): 자연어 전략 빌더
fix(trading): 주문 실행 오류 수정
docs: 사업 헌법 업데이트
```

---

## ⚠️ 중요 주의사항 (IMPORTANT)

**CRITICAL RULES - YOU MUST follow:**

1. **투자 조언 금지**: 코드/UI에서 투자를 권유하는 표현 절대 금지
2. **면책조항 필수**: 모든 트레이딩 관련 화면에 표시
3. **디자인 일관성**: DESIGN_SYSTEM.md 토큰만 사용
4. **타입 안전성**: any 타입 사용 금지, unknown 사용

---

## 🚀 권장 워크플로우

### Planning-First (IMPORTANT)
```
1. 관련 파일 먼저 읽기 (코드 작성 금지)
2. 계획 수립 → 승인 요청
3. 구현 (작은 단위로)
4. 테스트 + 빌드 확인
5. 법률 준수 체크
```

### 커스텀 명령어 활용
```bash
/spec [기능명]      # Spec 작성 (Planning-First)
/implement [기능]   # 구현 (파라미터 지원)
/analyze [대상]     # 심층 분석
/fix-issue [번호]   # GitHub 이슈 자동 수정
/type-check --fix   # 타입 오류 자동 수정
/deploy-check       # 배포 전 최종 검증
```

### Extended Thinking (복잡한 문제)
```
"think"         # 기본 사고
"think hard"    # 더 깊은 사고
"think harder"  # 가장 깊은 사고
```

---

*이 파일은 HEPHAITOS 프로젝트 전용입니다.*
*마지막 업데이트: 2025-12-18*
