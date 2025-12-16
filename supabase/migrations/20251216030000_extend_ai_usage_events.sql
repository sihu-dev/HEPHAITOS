-- ============================================
-- AI 사용량 이벤트 확장 (Observability)
-- Loop 11: 비용 추적 및 성능 모니터링
-- ============================================

-- ai_usage_events 테이블 확장
alter table ai_usage_events
  add column if not exists tokens_input integer,
  add column if not exists tokens_output integer,
  add column if not exists model_used text,
  add column if not exists latency_ms integer,
  add column if not exists cost_estimate_krw decimal(10,2),
  add column if not exists success boolean default true,
  add column if not exists error_message text;

-- 인덱스 추가 (성능 쿼리용)
create index if not exists idx_ai_usage_events_feature on ai_usage_events(feature);
create index if not exists idx_ai_usage_events_success on ai_usage_events(success);
create index if not exists idx_ai_usage_events_created_at on ai_usage_events(created_at desc);

-- ============================================
-- 기능별 평균 원가 뷰
-- ============================================

create or replace view feature_cost_summary as
select
  feature,
  count(*) as usage_count,
  count(case when success = true then 1 end) as success_count,
  count(case when success = false then 1 end) as failure_count,
  round(count(case when success = false then 1 end)::decimal / count(*) * 100, 2) as failure_rate_pct,

  avg(tokens_input) as avg_tokens_in,
  avg(tokens_output) as avg_tokens_out,
  avg(latency_ms) as avg_latency_ms,

  avg(cost_estimate_krw) as avg_cost_krw,
  sum(cost_estimate_krw) as total_cost_krw,
  max(cost_estimate_krw) as max_cost_krw,
  min(cost_estimate_krw) as min_cost_krw
from ai_usage_events
where created_at > now() - interval '30 days'
group by feature
order by total_cost_krw desc;

comment on view feature_cost_summary is '기능별 AI 사용량 및 원가 요약 (최근 30일)';

-- ============================================
-- 사용자별 월 비용
-- ============================================

create or replace view user_monthly_cost as
select
  user_id,
  date_trunc('month', created_at) as month,
  count(*) as total_requests,
  count(case when success = true then 1 end) as successful_requests,

  sum(tokens_input) as total_tokens_in,
  sum(tokens_output) as total_tokens_out,

  sum(cost_estimate_krw) as total_cost,
  avg(cost_estimate_krw) as avg_cost_per_request,
  max(cost_estimate_krw) as max_cost_single_request
from ai_usage_events
where created_at > now() - interval '6 months'
group by user_id, date_trunc('month', created_at)
order by user_id, month desc;

comment on view user_monthly_cost is '사용자별 월간 AI 비용 집계';

-- ============================================
-- 실시간 비용 모니터링 (최근 24시간)
-- ============================================

create or replace view realtime_cost_monitor as
select
  date_trunc('hour', created_at) as hour,
  count(*) as request_count,
  sum(cost_estimate_krw) as hourly_cost,
  avg(latency_ms) as avg_latency,
  count(case when success = false then 1 end) as error_count
from ai_usage_events
where created_at > now() - interval '24 hours'
group by date_trunc('hour', created_at)
order by hour desc;

comment on view realtime_cost_monitor is '시간별 AI 비용 실시간 모니터링 (최근 24시간)';

-- ============================================
-- 모델별 성능 비교
-- ============================================

create or replace view model_performance_comparison as
select
  model_used,
  count(*) as usage_count,
  avg(latency_ms) as avg_latency_ms,
  avg(cost_estimate_krw) as avg_cost_krw,
  avg(tokens_output::decimal / nullif(latency_ms, 0) * 1000) as tokens_per_second,
  round(count(case when success = false then 1 end)::decimal / count(*) * 100, 2) as failure_rate_pct
from ai_usage_events
where created_at > now() - interval '7 days'
and model_used is not null
group by model_used
order by usage_count desc;

comment on view model_performance_comparison is '모델별 성능 및 비용 비교 (최근 7일)';

-- ============================================
-- 비용 알림용 함수 (Threshold 초과 감지)
-- ============================================

create or replace function check_cost_threshold(
  p_threshold_krw integer default 500000
) returns table (
  alert_type text,
  alert_message text,
  current_value decimal,
  threshold_value integer
)
language plpgsql
as $$
begin
  -- 1. 월 전체 비용 확인
  return query
  select
    'MONTHLY_TOTAL' as alert_type,
    format('월 전체 비용이 %s원을 초과했습니다 (현재: %s원)', p_threshold_krw, round(sum(cost_estimate_krw))) as alert_message,
    sum(cost_estimate_krw) as current_value,
    p_threshold_krw as threshold_value
  from ai_usage_events
  where created_at >= date_trunc('month', now())
  having sum(cost_estimate_krw) > p_threshold_krw;

  -- 2. 사용자별 월 비용 (₩500 초과)
  return query
  select
    'USER_MONTHLY' as alert_type,
    format('사용자 %s의 월 비용이 500원을 초과했습니다 (현재: %s원)', user_id, round(sum(cost_estimate_krw))) as alert_message,
    sum(cost_estimate_krw) as current_value,
    500 as threshold_value
  from ai_usage_events
  where created_at >= date_trunc('month', now())
  group by user_id
  having sum(cost_estimate_krw) > 500;

  -- 3. 시간당 비용 (비정상 급증 감지)
  return query
  select
    'HOURLY_SPIKE' as alert_type,
    format('최근 1시간 비용이 비정상적으로 높습니다 (현재: %s원)', round(sum(cost_estimate_krw))) as alert_message,
    sum(cost_estimate_krw) as current_value,
    50000 as threshold_value
  from ai_usage_events
  where created_at > now() - interval '1 hour'
  having sum(cost_estimate_krw) > 50000;
end;
$$;

comment on function check_cost_threshold is '비용 임계값 초과 알림 (월 전체, 사용자별, 시간별)';

-- ============================================
-- 사용 예시
-- ============================================

-- 기능별 원가 요약 조회
-- select * from feature_cost_summary;

-- 사용자별 월 비용 조회
-- select * from user_monthly_cost where user_id = 'xxx';

-- 실시간 비용 모니터링
-- select * from realtime_cost_monitor;

-- 모델별 성능 비교
-- select * from model_performance_comparison;

-- 비용 알림 확인
-- select * from check_cost_threshold(500000);
