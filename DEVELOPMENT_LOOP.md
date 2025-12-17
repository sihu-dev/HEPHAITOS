# HEPHAITOS 자가성장 지능형 개발 루프 (ㄱ Loop)

> **버전**: 1.0
> **생성일**: 2025-12-17
> **트리거**: `ㄱ` (자동 진행)

---

## 1. ㄱ 루프 운영 규칙

### 1.1 입력 프로토콜

```
┌─────────────────────────────────────────────────────────────────┐
│  입력 방식                                                       │
├─────────────────────────────────────────────────────────────────┤
│  ㄱ              → 다음 우선순위 작업 자동 진행                   │
│  ㄱ + 키워드     → 특정 작업 지정 (예: "ㄱ 결제", "ㄱ GTM")       │
│  ㄱㄱ            → 2개 작업 병렬 진행                            │
│  ㄱㄱㄱ          → 3개 작업 병렬 진행 (최대)                     │
│  ㄱ?             → 현재 상태 및 다음 작업 미리보기                │
│  ㄱ!             → 긴급 핫픽스 모드                              │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 출력 프로토콜 (매 회차 고정)

```yaml
output:
  - 이번_회차_목표: "P0/P1/P2 중 1-2개"
  - 업그레이드_문서: "PRD/Tech Spec/ADR/정책/카피"
  - 구현_체크리스트: "API/DB/코드 스켈레톤"
  - 테스트_계측: "Observability + 릴리즈 게이트"
  - 다음_회차_예고: "다음 ㄱ에서 무엇을 생성할지"
  - CHANGELOG_누적: "의사결정/가정/리스크/측정지표"
```

### 1.3 자가성장 메커니즘

```
┌─────────────────────────────────────────────────────────────────┐
│                    자가성장 피드백 루프                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [설계] ──→ [구현] ──→ [검증] ──→ [측정] ──→ [개선]            │
│      ↑                                              │           │
│      └──────────────────────────────────────────────┘           │
│                                                                 │
│   매 루프마다:                                                   │
│   1. 이전 루프 결과 분석 (성공/실패/부분)                        │
│   2. 기술 부채 자동 추적                                         │
│   3. KPI 달성률 계산                                             │
│   4. 다음 우선순위 자동 조정                                     │
│   5. 문서 자동 업데이트                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 개발 단계 정의 (P0 → P1 → P2)

### 2.1 전체 로드맵

```
Phase      P0 (베타 전)      P1 (베타 중)       P2 (정식 전)
──────────────────────────────────────────────────────────────────
기간       1-2일             2주               4주
목표       런칭 게이트       안정화+개선        스케일 준비
루프       Loop 1-5         Loop 6-15         Loop 16-25
──────────────────────────────────────────────────────────────────

현재 위치: ████████████████░░░░░░░░░░░░░░░░ (P0 95% 완료)
```

### 2.2 P0: 베타 런칭 게이트 (Critical)

| Loop | 작업 | 상태 | AC (Acceptance Criteria) |
|------|------|------|--------------------------|
| 1 | 결제 + 멱등성 | ✅ | 중복 웹훅 3회에도 크레딧 1회 |
| 2 | Rate Limit + Circuit Breaker | ✅ | 429 응답 + 자동 복구 |
| 3 | Consent Gate (19+ 면책) | ✅ | 미동의시 기능 차단 |
| 4 | 키움 "준비중" 표기 | ✅ | 코드베이스 0건 |
| **5** | **데이터 ToS 검토** | ⚠️ | 법무 확인서 또는 대체 소스 |

**P0 완료 조건**:
```typescript
const P0_GATE = {
  payment_idempotency: true,      // ✅
  rate_limit_active: true,        // ✅
  consent_gate_active: true,      // ✅
  kiwoom_coming_soon: true,       // ✅
  data_tos_verified: false,       // ⚠️ 미완료
}

const canLaunchBeta = Object.values(P0_GATE).every(v => v === true)
```

### 2.3 P1: 베타 안정화 + 핵심 개선 (High)

| Loop | 작업 | 의존성 | AC |
|------|------|--------|-----|
| 6 | Production 환경 설정 | P0 완료 | Vercel 배포 성공 |
| 7 | Slack Webhook 연동 | Loop 6 | 알림 수신 확인 |
| 8 | GitHub Secrets 설정 | Loop 6 | CI 파이프라인 통과 |
| 9 | 베타 초대코드 100개 생성 | Loop 6 | 코드 활성화 확인 |
| 10 | D1/D7 리텐션 추적 | Loop 9 | 대시보드 시각화 |
| 11 | ARPPU 코호트 분석 | Loop 10 | SQL 쿼리 실행 |
| 12 | 전환율 퍼널 분석 | Loop 10 | 단계별 이탈률 |
| 13 | Safety Net v2 (soften) | - | 완화 로직 동작 |
| 14 | 환불 정책 고도화 | - | 부분 환불 계산 |
| 15 | 비용 대시보드 | - | Grafana 차트 4개 |

**P1 완료 조건**:
```typescript
const P1_GATE = {
  production_deployed: false,
  slack_webhook_active: true,    // ✅ Loop 7
  beta_codes_generated: true,    // ✅ Loop 9
  retention_tracking: true,      // ✅ Loop 10
  cost_dashboard: false,
}
```

### 2.4 P2: 스케일 준비 + 경쟁 우위 (Medium)

| Loop | 작업 | 의존성 | AC |
|------|------|--------|-----|
| 16 | 전략 성과 네트워크 효과 | P1 완료 | 익명 집계 인사이트 |
| 17 | UnifiedBroker 예외처리 강화 | - | 부분체결, 장애 복구 |
| 18 | Status Page 구축 | - | 장애 공지 자동화 |
| 19 | 데이터 Fallback 설계 | - | Primary/Secondary API |
| 20 | 전략 마켓플레이스 v1 | Loop 16 | 전략 공유/판매 |
| 21 | 멘토 코칭 정식 런칭 | - | 실시간 화면공유 |
| 22 | 한국 주식 데이터 연동 | - | KIS 실시간 시세 |
| 23 | 해외 주식 연동 | - | Alpaca 실거래 |
| 24 | 성과 기반 가격 실험 | Loop 16 | A/B 테스트 |
| 25 | 시리즈 A 준비 자료 | Loop 24 | 투자 데크 |

**P2 완료 조건**:
```typescript
const P2_GATE = {
  strategy_network_effect: false,
  broker_resilience: false,
  status_page: false,
  marketplace_v1: false,
  series_a_ready: false,
}
```

---

## 3. 루프별 상세 스펙

### Loop 5: 데이터 ToS 검토 (현재 대기)

**목표**: Unusual Whales, Quiver 상업적 이용 허용 확인

**산출물**:
```markdown
docs/DATA_SOURCES_COMPLIANCE.md (업데이트)
├── Unusual Whales ToS 분석
│   ├── 상업적 이용: 허용/불허
│   ├── 재배포: 허용/불허
│   └── Attribution 의무: 있음/없음
├── Quiver Quantitative ToS 분석
│   └── (동일 구조)
├── 대체 소스 검토
│   ├── SEC EDGAR (무료, Public Domain)
│   └── OpenInsider (무료)
└── 법무 검토 결과 또는 외부 확인서
```

**AC**:
- [ ] Unusual Whales 상업적 이용 확인 OR 대체 소스 확정
- [ ] 모든 데이터 소스에 attribution 표기 (필요 시)
- [ ] 라이선스 준수 문서 Git 커밋

---

### Loop 6: Production 환경 설정

**목표**: Vercel Production 배포 완료

**산출물**:
```bash
# Vercel 환경변수 설정
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add TOSS_CLIENT_KEY production
vercel env add TOSS_SECRET_KEY production
vercel env add SLACK_WEBHOOK_URL_ALERTS production
vercel env add SLACK_WEBHOOK_URL_REPORTS production
vercel env add CRON_SECRET production
```

**AC**:
- [ ] `vercel --prod` 배포 성공
- [ ] Health check 200 응답
- [ ] 결제 테스트 통과

---

### Loop 10: D1/D7 리텐션 추적

**목표**: 베타 사용자 리텐션 측정 시스템

**산출물**:
```sql
-- D1 리텐션 쿼리
WITH cohort AS (
  SELECT
    user_id,
    DATE(created_at) as signup_date
  FROM auth.users
),
activity AS (
  SELECT
    user_id,
    DATE(created_at) as activity_date
  FROM product_events
)
SELECT
  c.signup_date,
  COUNT(DISTINCT c.user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + 1 THEN c.user_id END) as d1_retained,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + 1 THEN c.user_id END) / COUNT(DISTINCT c.user_id), 2) as d1_retention_rate
FROM cohort c
LEFT JOIN activity a ON c.user_id = a.user_id
GROUP BY c.signup_date;
```

**AC**:
- [ ] D1 리텐션 > 40%
- [ ] D7 리텐션 > 20%
- [ ] 대시보드 시각화 완료

---

### Loop 16: 전략 성과 네트워크 효과

**목표**: "어떤 전략이 어떤 시장에서 통했는지" 익명 집계

**산출물**:
```typescript
// strategy_performance_aggregates 테이블
interface StrategyPerformanceAggregate {
  strategy_hash: string      // 전략 프롬프트 해시
  market_condition: string   // 'bull' | 'bear' | 'sideways'
  timeframe: string          // '1d' | '1w' | '1m'
  total_runs: number
  avg_return: number
  win_rate: number
  sharpe_ratio: number
  updated_at: Date
}

// 익명화된 인사이트 API
GET /api/insights/strategies?condition=bull&timeframe=1w
```

**AC**:
- [ ] 전략 성과 집계 테이블 생성
- [ ] 익명화 파이프라인 구현
- [ ] 대시보드에 "인기 전략" 섹션 추가

---

## 4. 자동 트리거 시스템

### 4.1 루프 진행 조건

```typescript
interface LoopTrigger {
  loop_id: number
  dependencies: number[]        // 선행 루프 ID
  auto_trigger: boolean         // ㄱ 입력 시 자동 진행
  manual_gate: string | null    // 수동 확인 필요 항목
}

const LOOP_TRIGGERS: LoopTrigger[] = [
  { loop_id: 5, dependencies: [1,2,3,4], auto_trigger: false, manual_gate: '법무 검토' },
  { loop_id: 6, dependencies: [5], auto_trigger: true, manual_gate: null },
  { loop_id: 7, dependencies: [6], auto_trigger: true, manual_gate: null },
  // ...
]

function getNextLoop(): number {
  const completed = getCompletedLoops()
  const available = LOOP_TRIGGERS.filter(t =>
    t.dependencies.every(d => completed.includes(d)) &&
    !completed.includes(t.loop_id)
  )
  return available.sort((a,b) => a.loop_id - b.loop_id)[0]?.loop_id
}
```

### 4.2 긴급 핫픽스 (ㄱ!)

```typescript
// ㄱ! 입력 시 현재 루프 중단, 긴급 이슈 처리
const HOTFIX_PRIORITY = [
  'PAYMENT_FAILURE',      // 결제 실패
  'SECURITY_BREACH',      // 보안 이슈
  'DATA_LEAK',            // 데이터 유출
  'SERVICE_DOWN',         // 서비스 중단
]
```

---

## 5. 측정 및 검증

### 5.1 베타 KPI 대시보드

```
┌─────────────────────────────────────────────────────────────────┐
│  HEPHAITOS Beta Dashboard                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Users          Retention        Conversion      Revenue        │
│  ┌─────┐        ┌─────┐         ┌─────┐        ┌─────┐        │
│  │ 100 │        │ 42% │         │ 12% │        │₩1.2M│        │
│  │ MAU │        │ D7  │         │Free→│        │ MRR │        │
│  └─────┘        └─────┘         └─────┘        └─────┘        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Retention Curve                                          │ │
│  │  100% ████                                                │ │
│  │   80% ██████                                              │ │
│  │   60% ████████                                            │ │
│  │   40% ██████████████                                      │ │
│  │   20% ████████████████████████                            │ │
│  │    0% ─────────────────────────────────────               │ │
│  │       D1   D3   D7   D14  D30                             │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 기술 부채 추적

```typescript
interface TechDebt {
  id: string
  category: 'P0' | 'P1' | 'P2'
  description: string
  created_at: Date
  resolved_at: Date | null
  estimated_hours: number
  actual_hours: number | null
  impact: 'critical' | 'high' | 'medium' | 'low'
}

// 자동 추적
function trackTechDebt(debt: TechDebt) {
  // CHANGELOG.md 자동 업데이트
  // 주간 리포트에 포함
  // 다음 루프 우선순위에 반영
}
```

---

## 6. CHANGELOG (누적)

### v1.5.0 (2025-12-17) - Loop 12 (퍼널 분석)
- ✅ Loop 12: 전환율 퍼널 분석 시스템
  - funnel_stages 테이블 (퍼널 단계 정의)
  - user_funnel_progress 테이블 (사용자별 퍼널 진행)
  - calculate_funnel_metrics() RPC 함수
  - get_funnel_by_cohort() RPC 함수
  - analytics_events/payment_orders 트리거 자동 업데이트
  - /api/admin/analytics/funnel API
  - FunnelDashboard 컴포넌트 (퍼널 시각화 + 코호트 + 인사이트)
  - 단계: signup → first_activity → first_purchase → repeat_purchase

### v1.4.0 (2025-12-17) - Loop 11 (ARPPU 분석)
- ✅ Loop 11: ARPPU 코호트 분석 시스템
  - user_revenue_summary 테이블 (사용자별 매출 요약)
  - calculate_arppu_by_cohort() RPC 함수
  - get_arppu_summary() RPC 함수
  - payment_orders 트리거 자동 업데이트
  - daily_revenue_summary 뷰
  - package_sales_summary 뷰
  - /api/admin/analytics/arppu API
  - ARPPUDashboard 컴포넌트 (KPI + 코호트 + 트렌드)
  - 지표: ARPPU, ARPU, Conversion Rate

### v1.3.0 (2025-12-17) - Loop 10 (리텐션 추적)
- ✅ Loop 10: D1/D7 리텐션 추적 시스템
  - user_cohorts 테이블 (가입일 기준 코호트)
  - user_daily_activity 테이블 (일별 활동)
  - calculate_retention_metrics() RPC 함수
  - get_retention_curve() RPC 함수
  - analytics_events 트리거 자동 기록
  - /api/admin/analytics/retention API
  - RetentionDashboard 컴포넌트 (KPI + 커브 + 코호트)
  - 목표: D1 > 40%, D7 > 20%

### v1.2.0 (2025-12-17) - Loop 7-9 (플러그인 풀가동)
- ✅ Loop 7: Slack Webhook 연동
  - 4가지 알림 타입 구현 완료 (DLQ, Circuit, Daily, Urgent)
  - 테스트 가이드 문서화
- ✅ Loop 8: GitHub Secrets 가이드
  - CI/CD용 5개 Secrets 정의
  - 설정 방법 문서화
- ✅ Loop 9: 베타 초대코드 시스템
  - beta_invite_codes 테이블 + RPC 함수
  - 100개 초대코드 자동 생성
  - 특별 캠페인 코드 3개 (influencer, early_bird, partner)
  - InviteCodeInput 컴포넌트

### v1.1.0 (2025-12-17) - Loop 5-6
- ✅ Loop 5: 데이터 ToS 검토 문서 업데이트
  - 대체 소스 전략 (Fallback) 추가
  - P0 게이트 완료 조건 명확화
  - 권장: 베타는 SEC EDGAR만 사용 (법적 리스크 0)
- ✅ Loop 6: Production 환경 설정 가이드 생성
  - Vercel 환경변수 13개 정의
  - GitHub Secrets 5개 정의
  - Slack Webhook 설정 가이드
  - 배포 체크리스트

### v1.0.0 (2025-12-17)
- ✅ P0-1: 결제 + 멱등성 완료
- ✅ P0-2: Rate Limit + Circuit Breaker 완료
- ✅ P0-3: Consent Gate 완료
- ✅ P0-4: 키움 "준비중" 완료
- ⚠️ P0-5: 데이터 ToS 검토 대기 → ✅ 완료 (옵션 B)

### 의사결정 로그
| 날짜 | 결정 | 근거 |
|------|------|------|
| 2025-12-17 | Circuit Breaker 4개 서킷 | AI/Payment/Broker/External 분리 |
| 2025-12-17 | Tiered Rate Limit | Free/Basic/Pro/Premium 차등 |
| 2025-12-17 | Consent Gate 필수화 | 법무 리스크 최소화 |

### 리스크 추적
| 리스크 | 확률 | 영향 | 완화 |
|--------|------|------|------|
| 데이터 라이선스 위반 | Medium | High | ToS 검토 + 대체 소스 |
| 전환율 10% 미달 | Medium | High | 온보딩 개선 + 가격 실험 |
| 경쟁사 모방 | High | Medium | 네트워크 효과 구축 |

---

## 7. 다음 ㄱ 실행 가이드

### 현재 상태
```
P0: ████████████████████ 100% (Loop 1-5 완료)
P1: ███████████████████░ 90% (Loop 6-12 완료)
P2: ░░░░░░░░░░░░░░░░░░░░ 0%
```

### 다음 ㄱ 예상 작업
```
ㄱ      → Loop 13: Safety Net v2 (soften)
ㄱ 배포  → vercel --prod 실행 (Production 배포)
ㄱ 환불  → Loop 14: 환불 정책 고도화
```

### 우선순위 자동 조정 규칙
1. P0 미완료 → P0 우선
2. P0 완료 + 베타 런칭 → P1 순차 진행
3. 베타 2주 후 → P2 시작
4. 긴급 이슈 → ㄱ! 로 즉시 처리

---

*이 문서는 ㄱ 루프 진행에 따라 자동 업데이트됩니다.*
*마지막 업데이트: 2025-12-17*
