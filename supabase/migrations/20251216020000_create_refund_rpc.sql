-- ============================================
-- 환불 처리 RPC 함수
-- Loop 10: 환불 정책 구현
-- ============================================

-- 환불 처리 함수 (원자적 트랜잭션)
create or replace function process_refund(
  p_order_id text,
  p_user_id uuid,
  p_unused_credits integer,
  p_refund_amount integer,
  p_reason text,
  p_toss_response jsonb
) returns void
language plpgsql
security definer
as $$
declare
  v_order payment_orders%rowtype;
  v_wallet credit_wallets%rowtype;
begin
  -- 1. 주문 락
  select * into v_order
  from payment_orders
  where order_id = p_order_id
  and user_id = p_user_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  -- 2. 이미 환불됨 확인 (멱등성)
  if v_order.status = 'refunded' then
    -- 이미 환불된 경우 조용히 종료
    return;
  end if;

  -- 3. 결제 완료 상태 확인
  if v_order.status != 'paid' then
    raise exception 'ORDER_NOT_PAID: current status is %', v_order.status;
  end if;

  -- 4. 지갑 락
  select * into v_wallet
  from credit_wallets
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'WALLET_NOT_FOUND';
  end if;

  -- 5. 잔액 확인 (회수할 크레딧이 충분한지)
  if v_wallet.balance < p_unused_credits then
    raise exception 'INSUFFICIENT_CREDITS: balance=%, required=%', v_wallet.balance, p_unused_credits;
  end if;

  -- 6. 크레딧 회수 (credit_transactions에 refund 기록)
  insert into credit_transactions (
    user_id,
    type,
    amount,
    metadata,
    payment_order_id,
    created_at
  )
  values (
    p_user_id,
    'refund',
    -p_unused_credits,  -- 음수로 기록 (회수)
    jsonb_build_object(
      'order_id', p_order_id,
      'refund_amount', p_refund_amount,
      'reason', p_reason,
      'toss_response', p_toss_response
    ),
    v_order.id,
    now()
  );

  -- 7. 지갑 잔액 차감
  update credit_wallets
  set balance = balance - p_unused_credits,
      updated_at = now()
  where user_id = p_user_id;

  -- 8. 주문 상태 변경
  update payment_orders
  set status = 'refunded',
      refunded_at = now(),
      refund_amount = p_refund_amount,
      refund_reason = p_reason,
      raw = jsonb_set(
        coalesce(raw, '{}'::jsonb),
        '{refund}',
        p_toss_response
      )
  where order_id = p_order_id;

  -- 9. 환불 이벤트 로깅 (감사 추적)
  -- TODO: 별도 refund_events 테이블 생성 시 추가

exception
  when others then
    -- 에러 로깅
    raise notice 'Refund process failed: %', sqlerrm;
    raise;
end;
$$;

-- ============================================
-- payment_orders 테이블에 환불 관련 컬럼 추가
-- ============================================

-- refund_amount 컬럼 추가 (아직 없는 경우)
alter table payment_orders
  add column if not exists refund_amount integer,
  add column if not exists refund_reason text,
  add column if not exists refunded_at timestamptz;

-- ============================================
-- 환불 이벤트 테이블 (선택 사항)
-- ============================================

create table if not exists refund_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id text not null,
  payment_order_id uuid references payment_orders(id),

  requested_at timestamptz default now(),
  processed_at timestamptz,

  reason text not null,
  unused_credits integer not null,
  refund_amount integer not null,

  status text not null check (status in ('pending','approved','rejected','completed','failed')),

  toss_response jsonb,
  rejection_reason text,

  created_at timestamptz default now()
);

create index if not exists idx_refund_events_user on refund_events(user_id);
create index if not exists idx_refund_events_order on refund_events(order_id);
create index if not exists idx_refund_events_status on refund_events(status);

-- ============================================
-- 환불 통계 뷰 (운영 모니터링용)
-- ============================================

create or replace view refund_stats as
select
  date_trunc('day', refunded_at) as refund_date,
  count(*) as refund_count,
  sum(refund_amount) as total_refund_amount,
  avg(refund_amount) as avg_refund_amount,
  sum(credits) as total_credits_purchased,
  avg((refund_amount::decimal / amount) * 100) as avg_refund_ratio_pct
from payment_orders
where status = 'refunded'
and refunded_at is not null
group by date_trunc('day', refunded_at)
order by refund_date desc;

-- 사용 예시:
-- select * from refund_stats where refund_date > now() - interval '30 days';

-- ============================================
-- 어뷰징 감지 쿼리 (반복 환불 사용자)
-- ============================================

comment on function process_refund is
'환불 처리 RPC 함수 - 크레딧 회수 + 주문 상태 변경을 원자적으로 수행';
