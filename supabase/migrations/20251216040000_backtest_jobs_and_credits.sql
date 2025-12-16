-- ============================================
-- Backtest Jobs 테이블 및 크레딧 차감 RPC
-- Loop 12: 백테스트 큐 시스템
-- ============================================

-- 1. backtest_jobs 테이블
create table if not exists backtest_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  strategy_id uuid not null,
  job_id text not null unique, -- BullMQ job ID

  -- 파라미터
  timeframe text not null,
  start_date date not null,
  end_date date not null,
  symbol text not null,

  -- 상태
  status text not null check (status in ('queued','processing','completed','failed')),
  credits_deducted boolean default false,

  -- 결과
  result jsonb,

  created_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists idx_backtest_jobs_user on backtest_jobs(user_id);
create index if not exists idx_backtest_jobs_status on backtest_jobs(status);
create index if not exists idx_backtest_jobs_job_id on backtest_jobs(job_id);

comment on table backtest_jobs is '백테스트 잡 큐 (BullMQ 통합)';

-- ============================================
-- 2. 크레딧 차감 RPC (멱등성 보장)
-- ============================================

create or replace function deduct_backtest_credits(
  p_user_id uuid,
  p_credits integer,
  p_job_id text
) returns void
language plpgsql
security definer
as $$
declare
  v_wallet credit_wallets%rowtype;
  v_job backtest_jobs%rowtype;
begin
  -- 1. 잡 조회 (없으면 생성)
  select * into v_job
  from backtest_jobs
  where job_id = p_job_id;

  if not found then
    raise exception 'JOB_NOT_FOUND: %', p_job_id;
  end if;

  -- 2. 이미 차감됐으면 멱등 성공
  if v_job.credits_deducted = true then
    return;
  end if;

  -- 3. 지갑 락
  select * into v_wallet
  from credit_wallets
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'WALLET_NOT_FOUND';
  end if;

  -- 4. 잔액 확인
  if v_wallet.balance < p_credits then
    raise exception 'INSUFFICIENT_CREDITS: balance=%, required=%', v_wallet.balance, p_credits;
  end if;

  -- 5. 크레딧 차감
  insert into credit_transactions (
    user_id,
    type,
    amount,
    metadata,
    created_at
  )
  values (
    p_user_id,
    'backtest',
    -p_credits,
    jsonb_build_object('job_id', p_job_id),
    now()
  );

  update credit_wallets
  set balance = balance - p_credits,
      lifetime_spent = lifetime_spent + p_credits,
      updated_at = now()
  where user_id = p_user_id;

  -- 6. 차감 플래그
  update backtest_jobs
  set credits_deducted = true,
      status = 'processing'
  where job_id = p_job_id;

exception
  when others then
    raise notice 'Backtest credit deduction failed: %', sqlerrm;
    raise;
end;
$$;

comment on function deduct_backtest_credits is '백테스트 크레딧 차감 (멱등성 보장)';

-- ============================================
-- 3. 백테스트 잡 생성 RPC
-- ============================================

create or replace function create_backtest_job(
  p_user_id uuid,
  p_strategy_id uuid,
  p_job_id text,
  p_timeframe text,
  p_start_date date,
  p_end_date date,
  p_symbol text
) returns uuid
language plpgsql
security definer
as $$
declare
  v_job_uuid uuid;
begin
  insert into backtest_jobs (
    user_id,
    strategy_id,
    job_id,
    timeframe,
    start_date,
    end_date,
    symbol,
    status
  )
  values (
    p_user_id,
    p_strategy_id,
    p_job_id,
    p_timeframe,
    p_start_date,
    p_end_date,
    p_symbol,
    'queued'
  )
  returning id into v_job_uuid;

  return v_job_uuid;
end;
$$;

comment on function create_backtest_job is '백테스트 잡 생성 (큐 추가 전 DB 기록)';

-- ============================================
-- 4. 백테스트 통계 뷰
-- ============================================

create or replace view backtest_stats as
select
  user_id,
  count(*) as total_backtests,
  count(case when status = 'completed' then 1 end) as completed_count,
  count(case when status = 'failed' then 1 end) as failed_count,
  count(case when status in ('queued','processing') then 1 end) as pending_count,

  avg(extract(epoch from (completed_at - created_at))) as avg_duration_sec,
  max(completed_at) as last_backtest_at
from backtest_jobs
group by user_id;

comment on view backtest_stats is '사용자별 백테스트 통계';

-- ============================================
-- 5. 실패한 잡 재시도 함수
-- ============================================

create or replace function retry_failed_backtest(
  p_job_id text
) returns boolean
language plpgsql
security definer
as $$
declare
  v_job backtest_jobs%rowtype;
begin
  select * into v_job
  from backtest_jobs
  where job_id = p_job_id;

  if not found then
    raise exception 'JOB_NOT_FOUND';
  end if;

  if v_job.status != 'failed' then
    raise exception 'JOB_NOT_FAILED: current status is %', v_job.status;
  end if;

  -- 상태를 queued로 되돌림
  update backtest_jobs
  set status = 'queued',
      result = null
  where job_id = p_job_id;

  return true;
end;
$$;

comment on function retry_failed_backtest is '실패한 백테스트 재시도';
