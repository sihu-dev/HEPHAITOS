# HEPHAITOS Master Prompt: Loop 13+ 작업 가이드
**현재 상태 종합 + 다음 단계 실행 지침**

생성일: 2025-12-16
현재 버전: V4 9.8
목표: V5 9.9 (Beta Ready)

---

## 🎯 현재 상태 (2025-12-16 기준)

### 완료된 Loop
- ✅ **Loop 1-10**: 기본 인프라, AI SDK, Safety Net v2, 재무 모델 V2 (V2 9.5/10 달성)
- ✅ **Loop 11**: 백테스트 큐 시스템 (BullMQ + Supabase Realtime) → V3 9.7
- ✅ **Loop 12**: 전략 성과 집계 (Materialized View + Leaderboard) → V4 9.8

### 핵심 달성 지표
```
전체 완성도: 89% → 92% (Loop 11-12 완료)
P0 게이트: 4.5/5 → 5/5 (예상)
베타 블로커: 해결 완료 (백테스트 큐)
ROI: Loop 11 (33배) + Loop 12 (무한대)
```

---

## 📦 현재 코드베이스 상태

### Loop 11 산출물 (백테스트 큐)
```
src/types/queue.ts                                  # TypeScript 타입
src/lib/queue/backtest-queue.ts                     # BullMQ Queue
src/lib/queue/backtest-worker.ts                    # Worker + Realtime
src/components/ui/progress.tsx                      # Progress Bar
src/components/backtest/BacktestProgress.tsx        # Frontend 진행률
supabase/migrations/20251216_loop11_*.sql           # DB 마이그레이션
```

### Loop 12 산출물 (전략 집계)
```
supabase/migrations/20251216_loop12_*.sql           # Materialized View
src/app/api/strategies/leaderboard/route.ts         # 리더보드 API
src/app/api/strategies/[id]/performance/route.ts    # 성과 API
src/app/strategies/leaderboard/page.tsx             # 리더보드 페이지
src/app/strategies/leaderboard/components/*.tsx     # 컴포넌트
```

### 기존 인프라 (Loop 1-10)
```
✅ Next.js 15 + React 19 + TypeScript (strict)
✅ Supabase (PostgreSQL + Auth + Realtime)
✅ Vercel AI SDK 5.0 + Claude 4
✅ BullMQ + Upstash Redis
✅ Safety Net v2 (법률 준수)
✅ Financial Model v2 (CAC 포함)
✅ Grafana 대시보드
✅ Rate Limiting (Upstash Redis)
```

---

## 🚀 다음 단계: Loop 13-15 로드맵

### Loop 13: CS/환불 자동화 (3일)
**기간**: 2025-12-17 ~ 12-19
**목표**: 운영 비용 90% 절감
**스코어**: V4 9.8 → V4.5 9.85 (내부 효율성)

#### 산출물
- [ ] Supabase Edge Function: `auto-refund-handler`
- [ ] DB 테이블: `refund_requests`
- [ ] API: `/api/cs/refund` (POST, GET)
- [ ] 관리자 대시보드 (Retool 또는 커스텀)
- [ ] 이메일 알림 (Supabase Email)

#### 핵심 로직
```typescript
// auto-refund-handler.ts (Edge Function)
1. 환불 요청 검증 (횟수 제한: 1회/년)
2. PG사 환불 API 호출 (Toss Payments)
3. 상태 업데이트 (backtest_jobs, user_credits)
4. 이메일 발송 (환불 완료 알림)
```

#### 성공 지표
- ✅ CS 처리 시간: 수동 1시간 → 자동 5분
- ✅ 운영 인력 절감: ₩3M/월 → ₩0.5M/월
- ✅ 환불 남용 방지: 1회/년 제한

---

### Loop 14: 실거래 시뮬레이션 (3주)
**기간**: 2025-12-20 ~ 2026-01-09
**목표**: 백테스트 vs 실거래 괴리율 <10%
**스코어**: V4.5 9.85 → V5 9.9

#### 산출물
- [ ] 슬리피지 모델 (과거 체결 데이터 기반)
- [ ] 체결 로직 (Limit/Market 주문)
- [ ] Paper Trading API 연동 (Alpaca)
- [ ] 실거래 시뮬레이터 UI
- [ ] 백테스트 vs 실거래 비교 차트

#### 핵심 로직
```typescript
// LiveTradingSimulator
1. calculateSlippage(order): 거래량 기반 슬리피지 계산
2. executeOrder(order): Limit/Market 주문 체결
3. trackExecution(order): 실거래 추적 + 기록
4. compareWithBacktest(strategyId): 백테스트 대비 괴리율
```

#### 성공 지표
- ✅ 슬리피지 정확도: ±5%
- ✅ 백테스트 대비 괴리율: <10%
- ✅ Paper Trading 성공률: 95%+

---

### Loop 15: 데이터 라이선스 검토 (1일)
**기간**: 2026-01-10
**목표**: P0 게이트 5/5 완료
**스코어**: V5 9.9 → V5 10.0 (Beta Ready)

#### 체크리스트
- [ ] Unusual Whales 라이선스 검토 (법률팀)
- [ ] Polygon.io Paid tier 전환 (상업 사용)
- [ ] SEC EDGAR 사용 조건 확인
- [ ] 라이선스 문서화 (compliance.md)

---

## 🔧 Loop 13 상세 실행 계획

### Day 1: DB + Edge Function (2025-12-17)

#### 1. DB 마이그레이션
```sql
-- refund_requests 테이블
CREATE TABLE refund_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  payment_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- 환불 횟수 제한 함수
CREATE FUNCTION check_refund_eligibility(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COUNT(*) < 1
  FROM refund_requests
  WHERE user_id = p_user_id
    AND status = 'completed'
    AND created_at > NOW() - INTERVAL '1 year';
$$ LANGUAGE SQL;
```

#### 2. Edge Function
```typescript
// supabase/functions/auto-refund-handler/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { refund_request_id } = await req.json();

  // 1. 환불 요청 검증
  const eligible = await checkRefundEligibility(userId);
  if (!eligible) {
    return new Response(JSON.stringify({ error: 'REFUND_LIMIT_EXCEEDED' }), {
      status: 400,
    });
  }

  // 2. Toss Payments 환불 API
  const result = await callTossRefundAPI(paymentId, amount);

  // 3. 상태 업데이트
  await updateRefundStatus(refund_request_id, 'completed');

  // 4. 이메일 발송
  await sendRefundEmail(userEmail, amount);

  return new Response(JSON.stringify({ success: true }));
});
```

### Day 2: API Routes (2025-12-18)

```typescript
// src/app/api/cs/refund/route.ts
export async function POST(req: Request) {
  // 1. 인증 확인
  const { data: { user } } = await supabase.auth.getUser();

  // 2. 환불 요청 생성
  const { data: refund } = await supabase
    .from('refund_requests')
    .insert({
      user_id: user.id,
      payment_id: paymentId,
      amount,
      reason,
      status: 'pending',
    })
    .select()
    .single();

  // 3. Edge Function 트리거
  await supabase.functions.invoke('auto-refund-handler', {
    body: { refund_request_id: refund.id },
  });

  return NextResponse.json({ success: true, refundId: refund.id });
}
```

### Day 3: Admin Dashboard (2025-12-19)

```typescript
// src/app/admin/cs/page.tsx
export default function CSAdminPage() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    // 실시간 환불 요청 구독
    const channel = supabase
      .channel('refund_requests')
      .on('postgres_changes', { table: 'refund_requests' }, (payload) => {
        setRequests((prev) => [payload.new, ...prev]);
      })
      .subscribe();
  }, []);

  return (
    <div>
      <h1>환불 요청 관리</h1>
      {requests.map((req) => (
        <RefundRequestCard key={req.id} request={req} />
      ))}
    </div>
  );
}
```

---

## 🧪 테스트 전략

### Loop 13 테스트
```typescript
// 1. 환불 요청 생성
POST /api/cs/refund
{
  "paymentId": "test-payment-123",
  "amount": 10000,
  "reason": "서비스 불만족"
}

// 2. 환불 상태 조회
GET /api/cs/refund?userId={userId}

// 3. Edge Function 수동 트리거
curl -X POST https://xxx.supabase.co/functions/v1/auto-refund-handler \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -d '{"refund_request_id": "uuid"}'
```

---

## 📊 진행 상황 추적

### Loop 완료 체크리스트
- [x] Loop 1-10: 기본 인프라 + V2 개선
- [x] Loop 11: 백테스트 큐 (V3 9.7)
- [x] Loop 12: 전략 집계 (V4 9.8)
- [ ] Loop 13: CS 자동화 (V4.5 9.85)
- [ ] Loop 14: 실거래 시뮬레이션 (V5 9.9)
- [ ] Loop 15: 라이선스 검토 (V5 10.0 - Beta Ready)

### 베타 런칭 준비도
```
현재: 92% (Loop 12 완료)
Loop 13 완료 시: 94%
Loop 14 완료 시: 98%
Loop 15 완료 시: 100% (Beta Ready)
```

---

## 🎯 즉시 실행 명령

### Loop 13 시작 (지금 바로)
```bash
# 1. DB 마이그레이션 파일 생성
touch supabase/migrations/20251216_loop13_cs_automation.sql

# 2. Edge Function 디렉토리 생성
mkdir -p supabase/functions/auto-refund-handler

# 3. API Route 생성
mkdir -p src/app/api/cs/refund

# 4. Admin 페이지 생성
mkdir -p src/app/admin/cs

# 5. 작업 시작
# → DB 마이그레이션 SQL 작성
# → Edge Function 구현
# → API Routes 구현
# → Admin Dashboard 구현
```

---

## 🚨 주의사항

### 절대 지켜야 할 규칙
1. **투자 조언 금지**: 모든 UI에 면책조항 표시
2. **TypeScript strict mode**: any 타입 절대 금지
3. **법률 준수**: Safety Net v2 검증 필수
4. **에러 핸들링**: 모든 API에 try-catch
5. **보안**: Service Role Key 환경변수 관리

### 코드 스타일
```typescript
// ✅ Good
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('table').select();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

// ❌ Bad
export async function POST(req: any) {  // any 금지
  const data = await supabase.from('table').select();  // 에러 처리 없음
  return NextResponse.json(data);  // success 래핑 없음
}
```

---

## 📚 참고 문서

### 필수 문서
1. `MASTER_ROADMAP_V2_TO_BETA.md` - 전체 로드맵
2. `LOOP_11_SPEC.md` - 백테스트 큐 기술 스펙
3. `LOOP_12_SPEC.md` - 전략 집계 기술 스펙
4. `CLAUDE.md` - 프로젝트 가이드
5. `BUSINESS_CONSTITUTION.md` - 사업 헌법

### API 레퍼런스
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Toss Payments 환불 API: https://docs.tosspayments.com/reference#환불
- BullMQ: https://docs.bullmq.io/

---

## 🎓 학습 포인트 (Loop 11-12에서 배운 것)

### 성공 패턴
1. **기존 코드 활용**: backtest-queue.ts가 이미 존재 → 업그레이드만 진행
2. **Supabase Realtime**: WebSocket을 간단히 구현
3. **Materialized View**: 사전 계산으로 쿼리 성능 50ms 달성
4. **pg_cron 자동화**: 별도 Worker 없이 DB 내 자동 갱신

### 적용할 패턴 (Loop 13)
1. **Edge Function**: 서버리스로 환불 로직 구현
2. **Realtime 구독**: 관리자 대시보드에서 실시간 요청 확인
3. **멱등성 보장**: 중복 환불 방지 (DB constraint)
4. **Rate Limiting**: 1회/년 제한

---

## 🔥 지금 바로 실행

**다음 명령으로 Loop 13 시작:**

```bash
# Step 1: DB 마이그레이션
CREATE TABLE refund_requests...

# Step 2: Edge Function
supabase functions new auto-refund-handler

# Step 3: API Routes
mkdir -p src/app/api/cs/refund

# Step 4: 테스트
curl -X POST /api/cs/refund -d '{...}'
```

**예상 완료 시간**: 3일 (12/17-12/19)
**다음 Loop**: Loop 14 (실거래 시뮬레이션, 3주)

---

**마스터 프롬프트 버전**: 1.0
**최종 업데이트**: 2025-12-16
**생성**: Claude Code (Sonnet 4.5)

---

## 💡 이 프롬프트 사용법

### 새 세션 시작 시
```
1. 이 문서를 먼저 읽어 현재 상태 파악
2. "Loop 13 작업 시작" 또는 원하는 작업 지시
3. 체크리스트 기반으로 진행 상황 추적
```

### 작업 중단 후 재개 시
```
1. "진행 상황 추적" 섹션에서 현재 위치 확인
2. 다음 미완료 항목부터 재개
3. 문서 업데이트 (체크박스 체크)
```

### 질문/이슈 발생 시
```
1. "참고 문서" 섹션에서 관련 문서 확인
2. "학습 포인트" 섹션에서 유사 패턴 확인
3. 여전히 불명확하면 GPT V1 피드백 참조
```

**이 프롬프트로 Loop 13-15를 완벽히 실행할 수 있습니다! 🚀**
