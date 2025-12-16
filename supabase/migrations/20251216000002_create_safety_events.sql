-- ============================================
-- Safety Events Table
-- GPT V1 피드백 P0-8: Safety Net v2 감사 로그
-- ============================================

-- Safety events 테이블 생성
create table if not exists public.safety_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  feature text not null,  -- 'strategy_generate', 'report_create', 'tutor_answer'
  section text,           -- 'title', 'summary', 'rules', 'risks', null
  input_excerpt text,     -- 사용자 입력 일부 (개인정보 제외)
  output_before text,     -- 원본 출력 (최소화)
  output_after text,      -- 완화 후 출력
  decision text not null check (decision in ('allow', 'soften', 'block')),
  policy_matched text[],  -- 매칭된 정책 이름들 ['NO_GUARANTEE', 'NO_BUY_SELL_IMPERATIVE']
  created_at timestamptz not null default now(),

  constraint fk_user
    foreign key (user_id)
    references auth.users(id)
    on delete cascade
);

-- 인덱스 생성
create index if not exists idx_safety_events_user_id on public.safety_events(user_id);
create index if not exists idx_safety_events_feature on public.safety_events(feature);
create index if not exists idx_safety_events_decision on public.safety_events(decision);
create index if not exists idx_safety_events_created_at on public.safety_events(created_at desc);

-- RLS 활성화
alter table public.safety_events enable row level security;

-- RLS 정책: 관리자만 조회 가능
create policy "Admins can view all safety events"
  on public.safety_events
  for select
  using (
    auth.jwt() ->> 'role' = 'admin'
  );

-- RLS 정책: 시스템이 삽입 가능 (service_role)
create policy "Service role can insert safety events"
  on public.safety_events
  for insert
  with check (true);

-- 코멘트 추가
comment on table public.safety_events is 'Safety Net v2 감사 로그 - 법률 준수 모니터링';
comment on column public.safety_events.feature is '기능: strategy_generate, report_create, tutor_answer 등';
comment on column public.safety_events.section is '섹션: title, summary, rules, risks (없을 수도 있음)';
comment on column public.safety_events.decision is '결정: allow (통과), soften (완화), block (차단)';
comment on column public.safety_events.policy_matched is '매칭된 정책 목록';
