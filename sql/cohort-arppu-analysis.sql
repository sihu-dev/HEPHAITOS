-- ============================================
-- 코호트 ARPPU 분석 SQL
-- Loop 10: 재무 모델 v2 검증용
-- ============================================

-- 1. 가입 코호트 정의
create or replace view cohort_base as
select
  user_id,
  date_trunc('month', created_at) as cohort_month,
  created_at as signup_at
from auth.users
where created_at >= '2025-01-01'  -- Year 1 시작
order by signup_at;

-- 2. 월별 ARPPU (Average Revenue Per Paying User)
create or replace view monthly_arppu as
select
  date_trunc('month', po.created_at) as purchase_month,
  count(distinct po.user_id) as paying_users,
  sum(po.amount) as total_revenue,
  avg(po.amount) as avg_purchase_amount,
  sum(po.amount)::decimal / count(distinct po.user_id) as arppu
from payment_orders po
where po.status = 'paid'
group by date_trunc('month', po.created_at)
order by purchase_month;

-- 3. 코호트별 ARPPU (가입월별 추적)
create or replace view cohort_arppu as
select
  c.cohort_month,
  date_trunc('month', po.created_at) as purchase_month,
  extract(month from age(po.created_at, c.signup_at)) as months_since_signup,
  count(distinct po.user_id) as paying_users_in_cohort,
  sum(po.amount) as cohort_revenue,
  sum(po.amount)::decimal / count(distinct po.user_id) as arppu
from cohort_base c
join payment_orders po on po.user_id = c.user_id
where po.status = 'paid'
group by c.cohort_month, date_trunc('month', po.created_at), months_since_signup
order by c.cohort_month, months_since_signup;

-- 4. 사용자 세그먼트 분류 (헤비/미들/라이트)
create or replace view user_segments as
with user_purchase_summary as (
  select
    user_id,
    count(*) as purchase_count,
    sum(credits) as total_credits_purchased,
    sum(amount) as total_spent,
    avg(amount) as avg_purchase_amount
  from payment_orders
  where status = 'paid'
  and created_at > now() - interval '30 days'
  group by user_id
)
select
  user_id,
  purchase_count,
  total_credits_purchased,
  total_spent,
  avg_purchase_amount,
  case
    when total_credits_purchased >= 200 then 'heavy'
    when total_credits_purchased >= 100 then 'middle'
    else 'light'
  end as segment
from user_purchase_summary;

-- 5. 세그먼트별 ARPPU
create or replace view segment_arppu as
select
  us.segment,
  count(distinct us.user_id) as user_count,
  avg(us.total_spent) as avg_total_spent,
  avg(us.total_credits_purchased) as avg_credits_purchased,
  sum(us.total_spent) / count(distinct us.user_id) as arppu
from user_segments us
group by us.segment
order by
  case us.segment
    when 'heavy' then 1
    when 'middle' then 2
    when 'light' then 3
  end;

-- 6. 전환율 추적 (Free → Paid)
create or replace view conversion_funnel as
select
  date_trunc('month', au.created_at) as cohort_month,
  count(distinct au.id) as total_signups,
  count(distinct po.user_id) as paid_users,
  count(distinct po.user_id)::decimal / count(distinct au.id) * 100 as conversion_rate_pct
from auth.users au
left join payment_orders po on po.user_id = au.id and po.status = 'paid'
where au.created_at >= '2025-01-01'
group by date_trunc('month', au.created_at)
order by cohort_month;

-- 7. LTV (Lifetime Value) 계산
create or replace view user_ltv as
select
  user_id,
  min(created_at) as first_purchase_at,
  max(created_at) as last_purchase_at,
  count(*) as total_purchases,
  sum(amount) as lifetime_revenue,
  sum(credits) as lifetime_credits,
  extract(days from max(created_at) - min(created_at)) as days_active,
  sum(amount) / nullif(extract(days from max(created_at) - min(created_at)), 0) * 30 as estimated_monthly_revenue
from payment_orders
where status = 'paid'
group by user_id;

-- 8. ARPPU 분포 (히스토그램)
create or replace view arppu_distribution as
with user_monthly_arppu as (
  select
    user_id,
    date_trunc('month', created_at) as month,
    sum(amount) as monthly_spent
  from payment_orders
  where status = 'paid'
  group by user_id, date_trunc('month', created_at)
)
select
  case
    when monthly_spent < 5000 then '0-5k'
    when monthly_spent < 10000 then '5k-10k'
    when monthly_spent < 15000 then '10k-15k'
    when monthly_spent < 20000 then '15k-20k'
    else '20k+'
  end as arppu_range,
  count(*) as user_count,
  avg(monthly_spent) as avg_spent_in_range
from user_monthly_arppu
group by
  case
    when monthly_spent < 5000 then '0-5k'
    when monthly_spent < 10000 then '5k-10k'
    when monthly_spent < 15000 then '10k-15k'
    when monthly_spent < 20000 then '15k-20k'
    else '20k+'
  end
order by
  case
    when arppu_range = '0-5k' then 1
    when arppu_range = '5k-10k' then 2
    when arppu_range = '10k-15k' then 3
    when arppu_range = '15k-20k' then 4
    else 5
  end;

-- ============================================
-- 베타 검증용 즉시 실행 쿼리
-- ============================================

-- Q1. 전체 ARPPU (최근 30일)
select
  count(distinct user_id) as paying_users,
  sum(amount) as total_revenue,
  sum(amount)::decimal / count(distinct user_id) as arppu
from payment_orders
where status = 'paid'
and created_at > now() - interval '30 days';

-- Q2. 세그먼트별 ARPPU
select * from segment_arppu;

-- Q3. 코호트별 ARPPU (최근 3개월)
select * from cohort_arppu
where cohort_month >= date_trunc('month', now() - interval '3 months')
order by cohort_month, months_since_signup;

-- Q4. 전환율 (최근 3개월)
select * from conversion_funnel
where cohort_month >= date_trunc('month', now() - interval '3 months');

-- Q5. ARPPU 분포
select * from arppu_distribution;

-- Q6. LTV Top 10
select * from user_ltv
order by lifetime_revenue desc
limit 10;

-- ============================================
-- 운영 대시보드용 종합 쿼리
-- ============================================

create or replace view dashboard_summary as
select
  'Total Users' as metric,
  count(*)::text as value
from auth.users
union all
select
  'Paying Users (30d)' as metric,
  count(distinct user_id)::text
from payment_orders
where status = 'paid'
and created_at > now() - interval '30 days'
union all
select
  'Conversion Rate (30d)' as metric,
  round(
    count(distinct po.user_id)::decimal / count(distinct au.id) * 100, 2
  )::text || '%'
from auth.users au
left join payment_orders po on po.user_id = au.id
  and po.status = 'paid'
  and po.created_at > now() - interval '30 days'
where au.created_at > now() - interval '30 days'
union all
select
  'ARPPU (30d)' as metric,
  '₩' || round(sum(amount)::decimal / count(distinct user_id))::text
from payment_orders
where status = 'paid'
and created_at > now() - interval '30 days'
union all
select
  'Total Revenue (30d)' as metric,
  '₩' || sum(amount)::text
from payment_orders
where status = 'paid'
and created_at > now() - interval '30 days';

-- 사용 예시:
-- select * from dashboard_summary;

-- ============================================
-- 주석
-- ============================================

comment on view cohort_base is '가입 코호트 기본 테이블 (월별 가입자 그룹화)';
comment on view monthly_arppu is '월별 ARPPU (전체 유료 사용자 평균)';
comment on view cohort_arppu is '코호트별 ARPPU (가입월별 추적)';
comment on view user_segments is '사용자 세그먼트 분류 (헤비/미들/라이트)';
comment on view segment_arppu is '세그먼트별 ARPPU';
comment on view conversion_funnel is '전환율 추적 (Free → Paid)';
comment on view user_ltv is 'LTV (Lifetime Value) 계산';
comment on view arppu_distribution is 'ARPPU 분포 (히스토그램)';
comment on view dashboard_summary is '운영 대시보드 종합 지표';
