-- ============================================
-- Refund Policy Implementation
-- GPT V1 피드백 P0-9: 부분 사용 시 차등 환불
-- ============================================

-- Refund requests 테이블 생성
create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  order_id text not null,
  reason text not null,
  credits_used integer not null,
  credits_total integer not null,
  usage_rate numeric(5,2) not null,  -- 사용률 (%)
  refund_amount integer,  -- 계산된 환불액 (원)
  status text not null check (status in ('pending', 'approved', 'rejected', 'completed')),
  admin_note text,  -- 관리자 메모
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),

  constraint fk_user
    foreign key (user_id)
    references auth.users(id)
    on delete cascade,

  constraint fk_reviewed_by
    foreign key (reviewed_by)
    references auth.users(id)
    on delete set null
);

-- 인덱스 생성
create index if not exists idx_refund_requests_user_id on public.refund_requests(user_id);
create index if not exists idx_refund_requests_order_id on public.refund_requests(order_id);
create index if not exists idx_refund_requests_status on public.refund_requests(status);
create index if not exists idx_refund_requests_created_at on public.refund_requests(created_at desc);

-- RLS 활성화
alter table public.refund_requests enable row level security;

-- RLS 정책: 본인 요청만 조회
create policy "Users can view their own refund requests"
  on public.refund_requests
  for select
  using (auth.uid() = user_id);

-- RLS 정책: 본인이 요청 생성
create policy "Users can create their own refund requests"
  on public.refund_requests
  for insert
  with check (auth.uid() = user_id);

-- RLS 정책: 관리자는 모든 요청 조회 및 수정
create policy "Admins can view all refund requests"
  on public.refund_requests
  for select
  using (auth.jwt() ->> 'role' = 'admin');

create policy "Admins can update refund requests"
  on public.refund_requests
  for update
  using (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- Calculate Refund RPC
-- ============================================

create or replace function public.calculate_refund(
  p_order_id text,
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_order_amount integer;
  v_order_credits integer;
  v_paid_at timestamptz;
  v_used_credits integer;
  v_usage_rate numeric(5,2);
  v_refund_amount integer;
  v_eligible boolean;
begin
  -- 주문 정보 조회 (payment_orders 테이블 사용)
  select amount, credits, paid_at into v_order_amount, v_order_credits, v_paid_at
  from public.payment_orders
  where order_id = p_order_id
    and user_id = p_user_id
    and status = 'completed';

  if not found then
    return jsonb_build_object(
      'eligible', false,
      'error', 'Order not found or not completed'
    );
  end if;

  -- 사용한 크레딧 계산 (주문 이후 사용분)
  -- type = 'spend' 이고 feature가 있는 모든 소비 기록
  select coalesce(sum(abs(amount)), 0) into v_used_credits
  from public.credit_transactions
  where user_id = p_user_id
    and type = 'spend'
    and feature is not null
    and created_at >= v_paid_at;

  -- 사용률 계산
  v_usage_rate := round((v_used_credits::numeric / v_order_credits) * 100, 2);

  -- 환불액 계산 (GPT V1 환불 정책)
  -- 10% 이하 사용: 전액 환불
  -- 10~50% 사용: 50% 환불
  -- 50% 이상 사용: 환불 불가
  if v_usage_rate <= 10 then
    v_refund_amount := v_order_amount;  -- 전액
    v_eligible := true;
  elsif v_usage_rate <= 50 then
    v_refund_amount := v_order_amount / 2;  -- 50%
    v_eligible := true;
  else
    v_refund_amount := 0;  -- 환불 불가
    v_eligible := false;
  end if;

  return jsonb_build_object(
    'eligible', v_eligible,
    'refund_amount', v_refund_amount,
    'order_amount', v_order_amount,
    'credits_used', v_used_credits,
    'credits_total', v_order_credits,
    'usage_rate', v_usage_rate,
    'refund_rate', case
      when v_usage_rate <= 10 then 100
      when v_usage_rate <= 50 then 50
      else 0
    end
  );
end;
$$;

-- 코멘트 추가
comment on table public.refund_requests is '환불 요청 테이블 - 부분 사용 시 차등 환불 정책 적용';
comment on function public.calculate_refund is '환불액 계산 RPC - 사용률에 따른 차등 환불';
