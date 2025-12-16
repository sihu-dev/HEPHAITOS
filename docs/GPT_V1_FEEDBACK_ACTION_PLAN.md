# GPT V1 피드백 재분석 & 베타 출시 수정 계획

> **작성일**: 2025-12-16
> **상태**: Loop 11-15 완료 → P0 게이트 점검 → 베타 수정사항 실행

---

## 📊 현재 상태 (Loop 1-15 완료)

### ✅ 완료된 P0 게이트 (5개 중 5개)

| P0 게이트 | 상태 | 완료 Loop | 비고 |
|-----------|------|----------|------|
| **P0-1**: 결제(토스) + 웹훅/멱등성 | ✅ 완료 | Loop 1, 14 | 중복 웹훅 방지, 환불 정책 |
| **P0-2**: Rate Limit + Circuit Breaker | ✅ 완료 | Loop 2 | Redis 기반, 사용자별 쿼터 |
| **P0-3**: 연령 게이트 + 면책 동의 | ✅ 완료 | Loop 3 | 만 19세, 동의 로그 |
| **P0-4**: 키움 문구 제거 → "준비중" | ✅ 완료 | Loop 16 (방금) | BrokerStatus 시스템 추가 |
| **P0-5**: 데이터 소스 Attribution | ✅ 완료 | Loop 10 | Unusual Whales, Polygon.io 표기 |

### ✅ 완료된 추가 P0 항목 (GPT V1 권장)

| 항목 | 상태 | 완료 Loop |
|------|------|----------|
| Observability (비용/토큰 추적) | ✅ 완료 | Loop 11 |
| 백테스트 Queue/Worker | ✅ 완료 | Loop 12 |
| 전략 성과 네트워크 효과 | ✅ 완료 | Loop 13 |
| 웹훅 재처리 시스템 | ✅ 완료 | Loop 14 |
| E2E Testing (Playwright) | ✅ 완료 | Loop 15 |

---

## 🚨 베타 출시 전 대규모 수정 필요 항목

### Priority 0 (베타 전 필수)

#### 1. **"AI" 단어 완전 제거** ⭐⭐⭐⭐⭐
**GPT V1 원문**:
> "AI", "인공지능", "ChatGPT가", "모델이 추천" 전면 금지(마케팅/앱 공통)

**현재 문제**:
- i18n 파일, UI 컴포넌트, 랜딩 페이지에 "AI" 단어 존재
- "AI 전략 생성", "AI 분석", "AI 튜터" 등 표현 사용 중

**권장 대체 (GPT V1)**:
```
AI 전략 생성 → 전략 엔진 / 전략 빌더
AI 분석 → 리서치 요약 / 시장 브리핑
AI 튜터 → 학습 가이드 / 트레이딩 코치
MoA (Multi Agent) → 다중 검증 엔진
```

**작업 범위**:
- [ ] `src/i18n/messages/ko.json` 전체 치환
- [ ] `src/i18n/messages/en.json` 전체 치환
- [ ] `src/components/**/*.tsx` 검색 및 치환
- [ ] `src/app/**/*.tsx` 검색 및 치환
- [ ] 랜딩 페이지 모든 섹션
- [ ] FAQ 섹션
- [ ] CI 게이트 추가 (금지어 자동 검사)

**예상 소요**: 2-3시간

---

#### 2. **브로커 상태 배지 UI** ⭐⭐⭐⭐
**GPT V1 원문**:
> coming_soon: 버튼 비활성 + "준비중" 배지 필수 + "알림 받기"만 허용

**현재 상태**:
- ✅ `BrokerStatus` 타입 추가 완료
- ✅ 브로커 카탈로그에 status 추가 완료
- ❌ UI 배지 컴포넌트 없음
- ❌ 버튼 비활성화 로직 없음

**구현 필요**:
```tsx
// BrokerStatusBadge.tsx
<Badge variant={status}>
  {status === 'supported' && '✅ 지원'}
  {status === 'beta' && '🔬 베타'}
  {status === 'coming_soon' && '🔜 준비중'}
  {status === 'unavailable' && '❌ 미제공'}
</Badge>

// BrokerCard.tsx
{broker.status === 'coming_soon' && (
  <Button disabled>
    연동 불가 (준비중)
  </Button>
)}
{broker.status === 'supported' && (
  <Button onClick={handleConnect}>
    연동하기
  </Button>
)}
```

**작업 범위**:
- [ ] `src/components/broker/BrokerStatusBadge.tsx` 생성
- [ ] `src/components/broker/BrokerCard.tsx` 수정
- [ ] 브로커 연동 위자드에 상태 체크 추가
- [ ] "알림 받기" 기능 (coming_soon일 때)

**예상 소요**: 1-2시간

---

#### 3. **Safety Net v2 (정책 엔진)** ⭐⭐⭐⭐
**GPT V1 원문**:
> allow/soften/block 3단계 + 섹션별 개입 + 감사로그

**현재 상태**:
- ✅ Loop 3에서 금지문구 필터 구현
- ❌ soften (완화) 로직 없음
- ❌ 섹션별 정책 없음
- ❌ safety_events 감사로그 없음

**구현 필요**:
```sql
-- safety_events 테이블
create table safety_events (
  id uuid primary key,
  user_id uuid not null,
  feature text not null,  -- 'strategy_generate', 'report_create'
  section text,           -- 'title', 'summary', 'rules'
  input_excerpt text,
  output_before text,     -- 원문 (최소화)
  output_after text,      -- 완화 후
  decision text check (decision in ('allow','soften','block')),
  policy_matched text[],  -- ['NO_GUARANTEE', 'NO_BUY_SELL_IMPERATIVE']
  created_at timestamptz default now()
);
```

```typescript
// safety-net-v2.ts
export async function applySafetyNet(
  content: string,
  section: 'title' | 'summary' | 'rules' | 'risks',
  userId: string
): Promise<{ decision: 'allow' | 'soften' | 'block', content: string }> {
  const policies = SAFETY_POLICIES[section]

  for (const policy of policies) {
    if (policy.pattern.test(content)) {
      if (policy.action === 'block') {
        await logSafetyEvent({ decision: 'block', policy })
        throw new Error('SAFETY_BLOCK')
      }

      if (policy.action === 'soften') {
        const softened = await softenContent(content, policy)
        await logSafetyEvent({ decision: 'soften', before: content, after: softened })
        return { decision: 'soften', content: softened }
      }
    }
  }

  return { decision: 'allow', content }
}
```

**작업 범위**:
- [ ] `supabase/migrations/safety_events.sql` 생성
- [ ] `src/lib/safety/safety-net-v2.ts` 구현
- [ ] `src/lib/safety/policies.ts` (섹션별 정책)
- [ ] `src/lib/safety/softener.ts` (완화 로직, LLM 기반)
- [ ] 모든 AI 생성 엔드포인트에 적용

**예상 소요**: 4-6시간

---

#### 4. **환불 정책 RPC 구현** ⭐⭐⭐
**GPT V1 원문**:
> 환불 정책 동작 (부분 사용 시 차등 환불)

**현재 상태**:
- ✅ Loop 10에서 환불 정책 문서 작성
- ❌ RPC 구현 없음
- ❌ API 엔드포인트 없음

**구현 필요**:
```sql
-- refund_requests 테이블
create table refund_requests (
  id uuid primary key,
  user_id uuid not null,
  order_id text not null,
  reason text not null,
  credits_used integer not null,
  credits_total integer not null,
  refund_amount integer,  -- 계산된 환불액
  status text check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- calculate_refund RPC
create or replace function calculate_refund(
  p_order_id text,
  p_user_id uuid
) returns jsonb as $$
declare
  v_order payment_orders%rowtype;
  v_used_credits integer;
  v_refund_amount integer;
begin
  -- 주문 조회
  select * into v_order from payment_orders where order_id = p_order_id;

  -- 사용한 크레딧 계산
  select coalesce(sum(abs(amount)), 0) into v_used_credits
  from credit_transactions
  where user_id = p_user_id
  and created_at > v_order.paid_at;

  -- 환불액 계산 (10% 이하 사용 → 전액, 50% 이하 → 50%, 그 이상 → 불가)
  if v_used_credits::decimal / v_order.credits <= 0.1 then
    v_refund_amount := v_order.amount;  -- 전액
  elsif v_used_credits::decimal / v_order.credits <= 0.5 then
    v_refund_amount := v_order.amount / 2;  -- 50%
  else
    v_refund_amount := 0;  -- 환불 불가
  end if;

  return jsonb_build_object(
    'eligible', v_refund_amount > 0,
    'refund_amount', v_refund_amount,
    'credits_used', v_used_credits,
    'usage_rate', round(v_used_credits::decimal / v_order.credits * 100, 2)
  );
end;
$$;
```

**작업 범위**:
- [ ] `supabase/migrations/refund_policy.sql` 생성
- [ ] `src/app/api/payments/refund/route.ts` 구현
- [ ] 환불 요청 UI (설정 페이지)
- [ ] 환불 승인 관리자 대시보드 (나중에)

**예상 소요**: 2-3시간

---

### Priority 1 (베타 중 개선)

#### 5. **리포트 재현성 & 버전관리**
**GPT V1 원문**:
> strategy_reports + input_hash로 재현성 확보

- [ ] `strategy_reports` 테이블 생성
- [ ] `input_hash` 기반 중복 실행 방지
- [ ] 재실행 API

#### 6. **실험 시스템 (AB 테스트)**
**GPT V1 원문**:
> experiment_assignments + variant별 분기

- [ ] `experiments` 테이블
- [ ] `experiment_assignments` 테이블
- [ ] 크레딧 가격 실험 (A/B)

#### 7. **베타 초대코드 시스템**
**GPT V1 원문**:
> beta_invite_codes + 사용 추적

- [ ] `beta_invite_codes` 테이블
- [ ] 초대코드 입력 UI
- [ ] 보너스 크레딧 지급

---

## 🎯 우선순위별 실행 계획

### Phase 1: P0 완료 (베타 전, 1-2일)
```bash
1. AI 단어 완전 제거 (2-3h)
   - i18n 파일 치환
   - 컴포넌트 검색 및 수정
   - CI 게이트 추가

2. 브로커 상태 배지 UI (1-2h)
   - BrokerStatusBadge 컴포넌트
   - BrokerCard 수정
   - 연동 위자드 상태 체크

3. Safety Net v2 (4-6h)
   - safety_events 테이블
   - 정책 엔진 구현
   - 완화(soften) 로직

4. 환불 정책 RPC (2-3h)
   - refund RPC 구현
   - API 엔드포인트
   - 환불 요청 UI
```

**총 예상**: 9-14시간 (1-2일)

### Phase 2: P1 완료 (베타 중, 2-3일)
```bash
5. 리포트 재현성 (3-4h)
6. 실험 시스템 (4-5h)
7. 베타 초대코드 (2-3h)
```

**총 예상**: 9-12시간 (2-3일)

---

## 📋 체크리스트 (베타 출시 전)

### P0 게이트 (필수)
- [x] P0-1: 결제 + 웹훅 + 멱등성
- [x] P0-2: Rate Limit + Circuit Breaker
- [x] P0-3: 연령 게이트 + 면책 동의
- [x] P0-4: 키움 "지원" → "준비중"
- [x] P0-5: 데이터 소스 Attribution
- [ ] **P0-6: "AI" 단어 완전 제거** ← 필수
- [ ] **P0-7: 브로커 상태 배지 UI** ← 필수
- [ ] **P0-8: Safety Net v2** ← 필수
- [ ] **P0-9: 환불 정책 RPC** ← 필수

### 운영 준비 (권장)
- [ ] Grafana 대시보드 설정 (비용 모니터링)
- [ ] Sentry 에러 추적 설정
- [ ] PostHog 퍼널 이벤트 설정
- [ ] 베타 초대코드 100개 생성
- [ ] CS 템플릿 작성 (채널톡)

---

## 🚀 다음 단계

**즉시 실행 (지금부터)**:
1. AI 단어 완전 제거 (가장 중요)
2. 브로커 상태 배지 UI
3. Safety Net v2
4. 환불 정책 RPC

**베타 출시 조건**:
- P0 게이트 9개 모두 완료
- E2E 테스트 통과
- 환불 정책 동작 확인
- 키움 "준비중" 배지 표시 확인

**예상 베타 출시일**: P0 완료 후 2-3일 (최종 테스트 포함)

---

*문서 버전: 1.0*
*최종 수정: 2025-12-16*
