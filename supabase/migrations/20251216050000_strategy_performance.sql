-- ============================================
-- Strategy Performance Network Effect
-- Loop 13: 전략 성과 데이터 축적
-- ============================================

-- 1. strategy_performance 테이블
create table if not exists strategy_performance (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references strategies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  -- 성과 지표
  total_return decimal not null,
  sharpe_ratio decimal,
  max_drawdown decimal not null,
  win_rate decimal not null,
  total_trades integer not null,
  profitable_trades integer not null,
  losing_trades integer not null,
  avg_win decimal,
  avg_loss decimal,

  -- 시장 컨텍스트
  market_condition text check (market_condition in ('bull', 'bear', 'sideways')),
  start_date date not null,
  end_date date not null,
  symbol text not null,

  -- 익명화 공유
  is_public boolean default false,

  created_at timestamptz default now()
);

create index if not exists idx_strategy_performance_strategy on strategy_performance(strategy_id);
create index if not exists idx_strategy_performance_user on strategy_performance(user_id);
create index if not exists idx_strategy_performance_public on strategy_performance(is_public) where is_public = true;
create index if not exists idx_strategy_performance_return on strategy_performance(total_return desc);

comment on table strategy_performance is '전략 성과 기록 (네트워크 효과)';

-- ============================================
-- 2. 공개 전략 랭킹 (익명)
-- ============================================

create or replace view public_strategy_ranking as
select
  s.id as strategy_id,
  s.name,
  s.description,
  count(sp.id) as usage_count,
  avg(sp.total_return) as avg_return,
  avg(sp.sharpe_ratio) as avg_sharpe,
  avg(sp.win_rate) as avg_win_rate,
  max(sp.created_at) as last_used,
  min(sp.total_return) as min_return,
  max(sp.total_return) as max_return
from strategies s
join strategy_performance sp on sp.strategy_id = s.id
where sp.is_public = true
group by s.id, s.name, s.description
having count(sp.id) >= 3  -- 최소 3회 이상 사용된 전략만
order by avg_return desc;

comment on view public_strategy_ranking is '공개 전략 랭킹 (최소 3회 이상 사용)';

-- ============================================
-- 3. 프롬프트 인사이트 (익명 집계)
-- ============================================

create or replace view prompt_insights as
select
  md5(s.prompt) as prompt_hash,
  count(distinct sp.user_id) as unique_users,
  count(sp.id) as total_runs,
  avg(sp.total_return) as avg_return,
  avg(sp.sharpe_ratio) as avg_sharpe,
  avg(sp.win_rate) as avg_win_rate,

  -- 시장 조건별 성과
  avg(case when sp.market_condition = 'bull' then sp.total_return end) as avg_return_bull,
  avg(case when sp.market_condition = 'bear' then sp.total_return end) as avg_return_bear,
  avg(case when sp.market_condition = 'sideways' then sp.total_return end) as avg_return_sideways

from strategies s
join strategy_performance sp on sp.strategy_id = s.id
where sp.is_public = true
and s.prompt is not null
group by md5(s.prompt)
having count(sp.id) >= 5  -- 최소 5회 이상 사용
order by avg_return desc
limit 100;

comment on view prompt_insights is '프롬프트 성과 인사이트 (익명, 최소 5회 이상)';

-- ============================================
-- 4. 시장 조건별 전략 추천
-- ============================================

create or replace view strategy_by_market_condition as
select
  market_condition,
  s.id as strategy_id,
  s.name,
  count(sp.id) as usage_count,
  avg(sp.total_return) as avg_return,
  avg(sp.sharpe_ratio) as avg_sharpe
from strategy_performance sp
join strategies s on s.id = sp.strategy_id
where sp.is_public = true
and sp.market_condition is not null
group by market_condition, s.id, s.name
having count(sp.id) >= 3
order by market_condition, avg_return desc;

comment on view strategy_by_market_condition is '시장 조건별 최적 전략 추천';

-- ============================================
-- 5. 전략 복사 함수
-- ============================================

create or replace function copy_strategy(
  p_source_strategy_id uuid,
  p_user_id uuid
) returns uuid
language plpgsql
security definer
as $$
declare
  v_source strategies%rowtype;
  v_new_id uuid;
begin
  -- 원본 전략 조회
  select * into v_source
  from strategies
  where id = p_source_strategy_id;

  if not found then
    raise exception 'STRATEGY_NOT_FOUND';
  end if;

  -- 새 전략 생성 (복사)
  insert into strategies (
    user_id,
    name,
    description,
    prompt,
    config
  )
  values (
    p_user_id,
    v_source.name || ' (복사본)',
    v_source.description,
    v_source.prompt,
    v_source.config
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

comment on function copy_strategy is '전략 복사 (마켓플레이스에서 복사)';

-- ============================================
-- 6. 전략 공유 설정 함수
-- ============================================

create or replace function set_strategy_performance_public(
  p_performance_id uuid,
  p_user_id uuid,
  p_is_public boolean
) returns boolean
language plpgsql
security definer
as $$
begin
  -- 소유권 확인
  if not exists (
    select 1 from strategy_performance
    where id = p_performance_id
    and user_id = p_user_id
  ) then
    raise exception 'FORBIDDEN';
  end if;

  update strategy_performance
  set is_public = p_is_public
  where id = p_performance_id;

  return true;
end;
$$;

comment on function set_strategy_performance_public is '전략 성과 공개/비공개 설정';

-- ============================================
-- 7. 백테스트 완료 시 자동 성과 기록
-- ============================================

create or replace function record_backtest_performance()
returns trigger
language plpgsql
security definer
as $$
begin
  -- 백테스트 완료 시에만 실행
  if new.status = 'completed' and old.status != 'completed' then
    insert into strategy_performance (
      strategy_id,
      user_id,
      total_return,
      sharpe_ratio,
      max_drawdown,
      win_rate,
      total_trades,
      profitable_trades,
      losing_trades,
      avg_win,
      avg_loss,
      start_date,
      end_date,
      symbol,
      is_public
    )
    values (
      new.strategy_id,
      new.user_id,
      (new.result->>'totalReturn')::decimal,
      (new.result->>'sharpeRatio')::decimal,
      (new.result->>'maxDrawdown')::decimal,
      (new.result->>'winRate')::decimal,
      (new.result->>'totalTrades')::integer,
      (new.result->>'profitableTrades')::integer,
      (new.result->>'losingTrades')::integer,
      (new.result->>'avgWin')::decimal,
      (new.result->>'avgLoss')::decimal,
      new.start_date,
      new.end_date,
      new.symbol,
      false  -- 기본값: 비공개
    );
  end if;

  return new;
end;
$$;

-- 트리거 생성
drop trigger if exists trg_record_backtest_performance on backtest_jobs;
create trigger trg_record_backtest_performance
  after update on backtest_jobs
  for each row
  execute function record_backtest_performance();

comment on function record_backtest_performance is '백테스트 완료 시 자동 성과 기록';
