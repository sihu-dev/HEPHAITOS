# HEPHAITOS Master Roadmap: V2 → Beta 런칭
**울트라씽킹 분석 기반 전체 작업 설계**

생성일: 2025-12-16
분석 기반: GPT V1 피드백 (5,548줄) + Loop 10 완료 상태 (V2 9.5/10)

---

## 🎯 Executive Summary

### 현재 상태 (2025-12-16)
- **V2 완성도**: 9.5/10 (목표 8.9 초과 달성)
- **전체 완성도**: 89% (GPT 피드백 기준)
- **P0 게이트**: 4.5/5 완료 (90%)
- **Loop 진행**: Loop 1-10 완료 (90%)

### 핵심 인사이트
```
89% 완성도의 진짜 의미:
- 표면적: 11% 미완성
- 실질적: 베타 런칭 블로커는 단 1개 (백테스트 큐 시스템)
- 나머지는 "운영 효율성" 개선 또는 "선택적 기능"
```

### 전략적 결론
**"Loop 11에 올인하고, 나머지는 베타 런칭 후 개선한다"**

- Week 1-2: Loop 11 완료 (백테스트 큐 = 베타 블로커)
- Week 3: Private Beta 시작 (초대 50명)
- Week 4+: 베타 피드백 받으며 Loop 12-13 개선
- 가설 검증(PMF)이 기술 완성도보다 우선

---

## 📊 Gap Analysis: 미완성 11%의 정체

### P0 게이트 분석 (4.5/5 완료)

| 게이트 | 상태 | 완성도 | 블로커 여부 | 타임라인 |
|--------|------|--------|-------------|----------|
| 법률 준수 검증 | ✅ 완료 | 100% | N/A | Loop 10 |
| 재무 모델 검증 | ✅ 완료 | 100% | N/A | Loop 10 |
| 보안 감사 | ✅ 완료 | 100% | N/A | Loop 7-9 |
| 유저 테스트 | ✅ 완료 | 100% | N/A | Loop 6-8 |
| **데이터 출처 라이선스** | ⚠️ 부분 | 50% | **Loop 15+ 블로커** | Loop 12-13 검토 |

**데이터 라이선스 상세:**
- Unusual Whales API: 개인 사용 허용, 상업적 재판매 제한
- Polygon.io: Free tier 비상업, Paid tier 상업 사용 가능
- **현재 상태**: 개인 프로토타입 단계 → 문제없음
- **수익화 시점**: 법률팀 검토 필수 (서비스 중단 리스크)

### 미완성 항목 우선순위 매트릭스

```
High Impact + High Complexity (Strategic Investments)
┌─────────────────────────────────────────────┐
│ 1. 백테스트 큐 시스템 (Loop 11) - CRITICAL │
│    - 동시 접속자 10명→100명 확장           │
│    - 베타 오픈 블로커                       │
│    - ROI: 33배 (첫 달 투자 회수)           │
│                                             │
│ 2. 전략 성과 집계 (Loop 12) - HIGH         │
│    - Copy 모드 활성화율 +30%               │
│    - ROI: 무한대 (인프라 비용 없음)        │
│                                             │
│ 3. 실행 품질 개선 (Loop 14) - HIGH         │
│    - 실거래 시뮬레이션                      │
│    - 베타 후 개선 가능                      │
└─────────────────────────────────────────────┘

High Impact + Low Complexity (Quick Wins)
┌─────────────────────────────────────────────┐
│ 4. 데이터 라이선스 검토 - QUICK WIN        │
│    - 법률팀 미팅 1회면 해결                │
│    - Loop 12-13에서 처리                   │
└─────────────────────────────────────────────┘

Low Impact + Low Complexity (Fill-ins)
┌─────────────────────────────────────────────┐
│ 5. CS/환불 자동화 (Loop 13)                │
│    - 운영 비용 90% 절감                    │
│    - 유저 100명+ 시점에 필요               │
└─────────────────────────────────────────────┘

Low Impact + High Complexity (Reconsider)
┌─────────────────────────────────────────────┐
│ 6. 전략 마켓플레이스 (Loop 16+)            │
│ 7. MoA 특허 출원                           │
│    - 우선순위 낮음, Loop 17+ 검토          │
└─────────────────────────────────────────────┘
```

---

## 🚀 Loop 11-14 로드맵

### Loop 11: 백테스트 큐 시스템 (CRITICAL)
**기간**: 2주 (12/16 - 12/29)
**V2 9.5 → V3 9.7**

#### 목표
- 동시 100명 백테스트 처리 가능
- 평균 대기시간 <30초
- 실시간 진행률 표시

#### 기술 아키텍처
```
[현재]
Frontend → API Route → 동기 백테스트 실행 (60초 타임아웃)
                             ↓
                           실패

[목표]
Frontend → API Route (job 생성)
              ↓
         BullMQ Queue (Upstash Redis)
              ↓
         Worker 프로세스 (별도 Node.js)
              ↓
         Supabase Realtime (WebSocket)
              ↓
         Frontend (진행률 실시간 표시)
```

#### 구현 단계
1. **Day 1-3**: Redis + BullMQ 설정
   - Upstash Redis 연결 (`UPSTASH_REDIS_URL`)
   - BullMQ Queue 정의 (`backtest-queue`)
   - Job schema 설계
   ```typescript
   interface BacktestJob {
     userId: string;
     strategyId: string;
     params: BacktestParams;
     priority: number; // 유료 유저 우선
   }
   ```

2. **Day 4-7**: Worker 프로세스 구현
   - Worker 파일: `src/workers/backtest-worker.ts`
   - Job 처리 로직 이전 (기존 백테스트 엔진 재사용)
   - 진행률 업데이트 로직 (10% 단위)
   ```typescript
   await job.updateProgress(30); // 30% 완료
   ```

3. **Day 8-10**: WebSocket 통합
   - Supabase Realtime 채널 생성 (`backtest:${jobId}`)
   - Worker → Supabase 진행률 푸시
   - Frontend 구독 로직

4. **Day 11-14**: Frontend UI + 테스트
   - 진행률 컴포넌트 (`<BacktestProgress />`)
   - 큐 대시보드 (대기 중인 작업 표시)
   - 부하 테스트 (동시 100명 시뮬레이션)

#### 성공 지표
- ✅ 동시 100명 백테스트 처리 성공
- ✅ 평균 대기시간 <30초
- ✅ 진행률 업데이트 지연 <2초
- ✅ Worker 장애 복구 자동화

#### 리스크 & 완화
| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| BullMQ 통합 복잡도 과소평가 | 2주→3주 지연 | MVP 범위 축소 (우선순위 큐 Phase 2) |
| WebSocket 불안정 | UX 저하 | Polling fallback 구현 |
| Redis 비용 초과 | 인프라 비용 | Upstash Free tier (10K req/day) |

#### 산출물
- `src/workers/backtest-worker.ts`
- `src/lib/queue/backtest-queue.ts`
- `src/app/api/backtest/queue/route.ts`
- `src/components/BacktestProgress.tsx`
- `BACKTEST_QUEUE_ARCHITECTURE.md`

---

### Loop 12: 전략 성과 집계 시스템
**기간**: 1주 (12/30 - 1/5)
**V3 9.7 → V4 9.8**

#### 목표
- Copy 모드 활성화율 +30%
- 전략 리더보드 구현
- 전환율 13.55% → 17.6%

#### 기술 설계
```sql
-- Materialized View (PostgreSQL)
CREATE MATERIALIZED VIEW strategy_performance_agg AS
SELECT
  strategy_id,
  strategy_name,
  creator_id,
  AVG(sharpe_ratio) as avg_sharpe,
  AVG(cagr) as avg_cagr,
  AVG(max_drawdown) as avg_mdd,
  COUNT(*) as backtest_count,
  MAX(created_at) as last_backtest,
  RANK() OVER (ORDER BY AVG(sharpe_ratio) DESC) as rank_sharpe,
  RANK() OVER (ORDER BY AVG(cagr) DESC) as rank_cagr
FROM backtest_results
WHERE status = 'completed'
GROUP BY strategy_id, strategy_name, creator_id;

-- 1시간마다 자동 갱신
REFRESH MATERIALIZED VIEW CONCURRENTLY strategy_performance_agg;
```

#### 구현 단계
1. **Day 1-2**: SQL + API
   - Materialized View 생성
   - API Route: `/api/strategies/leaderboard`
   - 필터 지원 (기간/지표/카테고리)

2. **Day 3-5**: Frontend
   - 리더보드 페이지 (`/strategies/leaderboard`)
   - 전략 카드 컴포넌트 (Sharpe/CAGR/MDD 표시)
   - 정렬/필터 UI

3. **Day 6-7**: 테스트 + 최적화
   - 캐싱 (1시간 TTL)
   - 대용량 데이터 성능 테스트

#### ROI 분석
- **개발 비용**: 1주 (인프라 비용 없음)
- **매출 임팩트**: (17.6% - 13.55%) × 100명 × ₩50,000 = **₩202,500/월**
- **ROI**: 무한대

---

### Loop 13: CS/환불 자동화
**기간**: 3일 (1/6 - 1/8, Loop 12와 병렬)
**V4 유지 (내부 효율성)**

#### 목표
- CS 처리 시간 90% 감소
- 운영 인력 절감 (₩3M/월 → ₩0.5M/월)

#### 기술 설계
```typescript
// Supabase Edge Function: auto-refund-handler
export default async function handler(req: Request) {
  const { refund_request_id } = await req.json();

  // 1. 환불 요청 검증 (횟수 제한: 1회/년)
  const user = await checkRefundEligibility(refund_request_id);

  // 2. PG사 환불 API 호출
  const result = await callPgRefundApi(user.payment_id);

  // 3. 상태 업데이트
  await updateRefundStatus(refund_request_id, result.status);

  // 4. 이메일 발송
  await sendRefundEmail(user.email, result);

  return new Response(JSON.stringify({ success: true }));
}
```

#### 구현 단계
1. **Day 1**: Edge Function 구현
2. **Day 2**: 관리자 대시보드 (Retool 또는 Supabase Studio)
3. **Day 3**: 테스트 + 모니터링

#### 리스크 & 완화
- 환불 남용 → 횟수 제한 (1회/년)
- PG 연동 실패 → 수동 fallback 유지

---

### Loop 14: 실거래 시뮬레이션
**기간**: 3주 (1/9 - 1/26)
**V4 9.8 → V5 9.9**

#### 목표
- 백테스트 vs 실거래 괴리율 <10%
- Paper trading 지원

#### 기술 설계
```typescript
// 실거래 시뮬레이터
class LiveTradingSimulator {
  // 슬리피지 모델 (과거 체결 데이터 기반)
  calculateSlippage(order: Order): number {
    const volume = getHistoricalVolume(order.symbol, order.timestamp);
    const slippage = (order.quantity / volume) * 0.001; // 0.1% 예시
    return slippage;
  }

  // 체결 로직 (Limit/Market 주문)
  executeOrder(order: Order): Execution {
    const slippage = this.calculateSlippage(order);
    const executionPrice = order.type === 'market'
      ? getCurrentPrice(order.symbol) * (1 + slippage)
      : order.limitPrice;

    return {
      executedPrice: executionPrice,
      executedQuantity: order.quantity,
      timestamp: Date.now(),
    };
  }
}
```

#### 구현 단계
1. **Week 1**: 슬리피지 모델 + 체결 로직
2. **Week 2**: Paper trading API 연동 (Alpaca)
3. **Week 3**: Frontend + 테스트

#### 블로커 확인
- 실거래 시뮬레이션은 **베타 후 개선 가능**
- 백테스트만으로도 베타 런칭 충분

---

## 📅 베타 오픈 타임라인 (역산)

### 목표: 2026년 3월 첫째 주 Public Beta

```
현재: 2025-12-16
남은 기간: 10-11주

┌─────────────────────────────────────────────┐
│ Week 1-2 (12/16-12/29): Loop 11             │
│   - 백테스트 큐 시스템 개발                │
│   - BullMQ + WebSocket 통합                 │
│   - 부하 테스트 (동시 100명)                │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ Week 3 (12/30-1/5): Loop 12 + 13 (병렬)    │
│   - 전략 성과 집계 시스템                   │
│   - CS/환불 자동화                          │
│   - 데이터 라이선스 법률 검토               │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ Week 4-6 (1/6-1/26): Loop 14                │
│   - 실거래 시뮬레이션 개발                  │
│   - Paper trading 연동                      │
│   - (선택적, 베타 후 개선 가능)             │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ Week 7-8 (1/27-2/9): 내부 테스트           │
│   - 버그 수정 + 성능 최적화                 │
│   - 보안 감사 재검증                        │
│   - 런칭 체크리스트 확인                    │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ Week 9-10 (2/10-2/23): Private Beta         │
│   - 초대 유저 50명                          │
│   - 피드백 수집 + 긴급 패치                 │
│   - 온보딩 프로세스 개선                    │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ Week 11 (2/24-3/2): Public Beta 준비        │
│   - 마케팅 자료 준비                        │
│   - 서버 인프라 스케일업                    │
│   - 론칭 이벤트 기획                        │
└─────────────────────────────────────────────┘
           ↓
       🚀 3월 첫째 주: Public Beta 런칭
```

### Critical Path
- **Loop 11 (백테스트 큐)** 지연 → 전체 일정 지연
- 버퍼: 각 Loop에 20% 포함 (Loop 11이 3주 걸려도 2월 베타 가능)

---

## 💰 재무적 ROI 분석

### Financial Model V2 기준
- 월 고정비: ₩19.56M (마케팅 ₩5M 포함)
- BEP 전환율: 13.55%
- 목표 ARPPU: ₩50,000

### Loop별 ROI

| Loop | 개발 비용 | 인프라 비용/월 | 매출 임팩트/월 | ROI | 우선순위 |
|------|-----------|----------------|----------------|-----|----------|
| **Loop 11** | 2주 | ₩20K (Redis) | **₩677.5K** | **33배** | CRITICAL |
| **Loop 12** | 1주 | ₩0 | **₩202.5K** | 무한대 | HIGH |
| Loop 13 | 3일 | ₩0 | ₩0 (비용 절감 ₩2.5M) | 운영 효율 | HIGH |
| Loop 14 | 3주 | ₩0 | ₩0 (UX 개선) | 장기 | MEDIUM |

### Loop 11 상세 ROI
```
비용:
- 개발 2주 (₩0, 자체 개발)
- Upstash Redis: ₩20,000/월

효과:
- 동시 접속자: 10명 → 100명
- 매출 증대: MAU 100명 × 13.55% × ₩50,000 = ₩677,500/월

ROI: ₩677,500 / ₩20,000 = 33.8배 (첫 달 투자 회수)
```

### Loop 12 상세 ROI
```
비용:
- 개발 1주 (₩0)
- 인프라: ₩0 (Supabase 내 Materialized View)

효과:
- Copy 모드 활성화율: +30%
- 전환율 증가: 13.55% → 17.6%
- 매출 증대: (17.6% - 13.55%) × 100명 × ₩50,000 = ₩202,500/월

ROI: 무한대 (비용 없음)
```

---

## 🎯 즉시 실행 계획 (이번 주)

### Day 1 (오늘): Loop 11 Spec 작성
- [ ] `LOOP_11_SPEC.md` 문서 생성
- [ ] BullMQ 아키텍처 다이어그램
- [ ] API 스펙 정의 (OpenAPI)
- [ ] DB 스키마 수정 (`job_queue` 테이블)
- [ ] WebSocket 이벤트 정의

### Day 2-14: Loop 11 개발
**Phase 1: Redis + BullMQ (Day 2-4)**
- [ ] Upstash Redis 계정 생성 + 연결
- [ ] `npm install bullmq`
- [ ] Queue 정의 (`src/lib/queue/backtest-queue.ts`)
- [ ] Job schema TypeScript 타입

**Phase 2: Worker (Day 5-8)**
- [ ] Worker 파일 생성 (`src/workers/backtest-worker.ts`)
- [ ] 기존 백테스트 로직 이전
- [ ] 진행률 업데이트 통합
- [ ] 에러 핸들링 + 재시도 로직

**Phase 3: WebSocket (Day 9-11)**
- [ ] Supabase Realtime 채널 설정
- [ ] Worker → Supabase 푸시 로직
- [ ] Frontend 구독 컴포넌트

**Phase 4: Frontend UI (Day 12-14)**
- [ ] `<BacktestProgress />` 컴포넌트
- [ ] 큐 대시보드 페이지
- [ ] 부하 테스트 (Locust/k6)

---

## 📋 체크리스트: 베타 런칭 준비

### P0 게이트 (5/5 완료 필요)
- [x] 법률 준수 검증 (Safety Net v2)
- [x] 재무 모델 검증 (CAC 포함)
- [x] 보안 감사 (XSS, SQL Injection 방어)
- [x] 유저 테스트 (Loop 6-8 완료)
- [ ] **데이터 출처 라이선스** (Loop 12-13에서 법률팀 검토)

### 기술 준비 (Loop 11-13)
- [ ] 백테스트 큐 시스템 (Loop 11)
- [ ] 전략 성과 집계 (Loop 12)
- [ ] CS/환불 자동화 (Loop 13)
- [ ] Grafana 모니터링 (이미 완료)
- [ ] Rate Limiting (이미 완료, Upstash Redis)

### 운영 준비
- [ ] Private Beta 초대 리스트 (50명)
- [ ] 온보딩 이메일 템플릿
- [ ] CS 응대 가이드
- [ ] 장애 대응 플레이북

### 마케팅 준비
- [ ] 랜딩 페이지 개선
- [ ] 데모 비디오 제작
- [ ] SNS 채널 준비 (Twitter, LinkedIn)
- [ ] 론칭 이벤트 기획

---

## 🚨 리스크 관리

### Critical 리스크

#### 1. Loop 11 개발 지연 (2주 → 3주)
**영향**: 전체 일정 1주 지연 → Private Beta 2월 말
**완화**:
- MVP 범위 축소: 우선순위 큐는 Phase 2로 연기
- 진행률 업데이트 간격 확대 (10% → 25%)
- Daily standup으로 블로커 즉시 해결

#### 2. 동시 접속자 부하 테스트 실패
**영향**: 베타 오픈 후 서비스 장애
**완화**:
- Locust로 사전 부하 테스트 (동시 100명 시뮬레이션)
- Auto-scaling 설정 (Vercel + Supabase)
- Circuit breaker 패턴 적용

#### 3. 데이터 라이선스 위반
**영향**: 서비스 중단 + 법적 분쟁
**완화**:
- Loop 12-13에서 법률팀 검토 (우선순위 높임)
- 라이선스 위반 시 즉시 데이터 소스 전환 계획 수립
- 상업적 Paid tier로 즉시 업그레이드 옵션 확보

### High 리스크

#### 4. BullMQ 통합 복잡도 과소평가
**영향**: 개발 기간 연장
**완화**:
- BullMQ 공식 문서 + 예제 사전 학습 (1일)
- Redis 연결 실패 시 In-memory fallback

#### 5. WebSocket 불안정 (Supabase Realtime)
**영향**: UX 저하 (진행률 표시 누락)
**완화**:
- Polling fallback 구현 (5초 간격)
- WebSocket 연결 실패 시 자동 재연결

---

## 📚 문서화 계획

### 즉시 생성 (이번 주)
1. **LOOP_11_SPEC.md**
   - 기술 스펙 상세
   - API 엔드포인트 정의
   - DB 스키마 변경

2. **BACKTEST_QUEUE_ARCHITECTURE.md**
   - 아키텍처 다이어그램 (Mermaid)
   - 데이터 플로우
   - 장애 복구 시나리오

3. **API_CHANGELOG.md**
   - V2 → V3 API 변경 사항
   - Breaking changes 표시
   - 마이그레이션 가이드

### Loop 완료 시 업데이트
4. **LOOP_11_COMPLETE.md** (Loop 10 형식 따름)
5. **LOOP_12_COMPLETE.md**
6. **LOOP_13_COMPLETE.md**

---

## 🎓 핵심 교훈 (울트라씽킹 분석 결과)

### 1. 완성도의 진짜 의미
```
89% 완성도 ≠ 11%의 작업량 남음
실질적 블로커는 1개 (백테스트 큐)
나머지는 운영 효율성 개선
```

### 2. Critical Path 집중
```
Loop 11 완료 → 베타 가능
Loop 12-13 → 병렬 진행 가능
Loop 14 → 베타 후 개선 가능
```

### 3. PMF > 기술 완성도
```
가설 검증이 우선
Loop 11만으로도 베타 시작
유저 피드백으로 Loop 12-13 방향 조정
```

### 4. ROI 중심 의사결정
```
Loop 11: 33배 ROI (매출 증대)
Loop 12: 무한대 ROI (비용 없음)
Loop 13: 운영 효율 (비용 절감)
```

### 5. 리스크 완화 전략
```
각 Loop에 20% 버퍼
MVP 범위 축소 옵션 확보
Fallback 메커니즘 필수
```

---

## 📞 다음 액션

### 즉시 (오늘)
1. ✅ 이 문서 작성 완료
2. [ ] `LOOP_11_SPEC.md` 작성 시작
3. [ ] Upstash Redis 계정 생성
4. [ ] BullMQ 예제 코드 학습

### 내일 (Day 2)
1. [ ] Redis 연결 테스트
2. [ ] Queue 정의 코드 작성
3. [ ] Job schema TypeScript 타입

### 이번 주 (Day 3-7)
1. [ ] Worker 프로세스 구현
2. [ ] 기존 백테스트 로직 이전
3. [ ] 진행률 업데이트 통합

---

**생성**: Claude Code (Sonnet 4.5)
**분석 방법론**: 울트라씽킹 (Sequential Thinking)
**분석 깊이**: 15단계 사고 과정
**문서 버전**: 1.0
**최종 업데이트**: 2025-12-16
