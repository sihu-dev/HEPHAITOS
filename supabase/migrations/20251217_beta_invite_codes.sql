-- ============================================
-- Beta Invite Codes System
-- Loop 9: 베타 초대코드 100개 생성
-- ============================================

-- 1) 베타 초대코드 테이블
create table if not exists beta_invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  campaign text not null default 'general',  -- 캠페인 분류 (general, influencer, early_bird 등)
  bonus_credits integer not null default 100, -- 가입 시 보너스 크레딧
  max_uses integer default null,              -- 최대 사용 횟수 (null = 무제한)
  used_count integer not null default 0,      -- 현재 사용 횟수
  expires_at timestamptz,                      -- 만료일
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- 인덱스
create index if not exists idx_beta_invite_codes_code on beta_invite_codes(code);
create index if not exists idx_beta_invite_codes_campaign on beta_invite_codes(campaign);
create index if not exists idx_beta_invite_codes_active on beta_invite_codes(is_active, expires_at);

-- 2) 초대코드 사용 로그
create table if not exists beta_invite_uses (
  id uuid primary key default gen_random_uuid(),
  invite_code_id uuid not null references beta_invite_codes(id),
  user_id uuid not null references auth.users(id),
  credits_granted integer not null,
  used_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

-- 인덱스
create index if not exists idx_beta_invite_uses_code on beta_invite_uses(invite_code_id);
create index if not exists idx_beta_invite_uses_user on beta_invite_uses(user_id);

-- 3) 초대코드 사용 함수 (원자적)
create or replace function use_beta_invite_code(
  p_code text,
  p_user_id uuid,
  p_ip_address text default null,
  p_user_agent text default null
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_invite beta_invite_codes%rowtype;
  v_already_used boolean;
  v_credits_granted integer;
begin
  -- 1) 초대코드 조회 (FOR UPDATE로 동시성 제어)
  select * into v_invite
  from beta_invite_codes
  where code = upper(p_code)
    and is_active = true
    and (expires_at is null or expires_at > now())
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'INVALID_OR_EXPIRED_CODE'
    );
  end if;

  -- 2) 최대 사용 횟수 체크
  if v_invite.max_uses is not null and v_invite.used_count >= v_invite.max_uses then
    return jsonb_build_object(
      'success', false,
      'error', 'CODE_FULLY_USED'
    );
  end if;

  -- 3) 이미 사용한 사용자인지 체크
  select exists(
    select 1 from beta_invite_uses
    where invite_code_id = v_invite.id
      and user_id = p_user_id
  ) into v_already_used;

  if v_already_used then
    return jsonb_build_object(
      'success', false,
      'error', 'ALREADY_USED_BY_USER'
    );
  end if;

  -- 4) 사용 횟수 증가
  update beta_invite_codes
  set used_count = used_count + 1
  where id = v_invite.id;

  -- 5) 사용 로그 기록
  insert into beta_invite_uses (
    invite_code_id, user_id, credits_granted, ip_address, user_agent
  ) values (
    v_invite.id, p_user_id, v_invite.bonus_credits, p_ip_address, p_user_agent
  );

  -- 6) 크레딧 지급
  v_credits_granted := v_invite.bonus_credits;

  insert into credit_transactions (
    user_id, amount, type, description, metadata
  ) values (
    p_user_id,
    v_credits_granted,
    'bonus',
    'Beta invite code: ' || v_invite.code,
    jsonb_build_object('invite_code', v_invite.code, 'campaign', v_invite.campaign)
  );

  -- 7) 지갑 업데이트
  insert into credit_wallets (user_id, balance)
  values (p_user_id, v_credits_granted)
  on conflict (user_id) do update
  set balance = credit_wallets.balance + v_credits_granted,
      updated_at = now();

  return jsonb_build_object(
    'success', true,
    'credits_granted', v_credits_granted,
    'campaign', v_invite.campaign
  );
end;
$$;

-- 4) 베타 초대코드 100개 생성 (초기 데이터)
-- 코드 형식: HEPHA-XXXX-XXXX (영숫자 8자리)
do $$
declare
  i integer;
  v_code text;
begin
  for i in 1..100 loop
    -- 랜덤 코드 생성
    v_code := 'HEPHA-' ||
              upper(substr(md5(random()::text), 1, 4)) || '-' ||
              upper(substr(md5(random()::text), 1, 4));

    -- 중복 방지
    if not exists(select 1 from beta_invite_codes where code = v_code) then
      insert into beta_invite_codes (code, campaign, bonus_credits, max_uses)
      values (v_code, 'beta_launch', 100, 1);
    end if;
  end loop;
end;
$$;

-- 5) 특별 캠페인 코드 (인플루언서용)
insert into beta_invite_codes (code, campaign, bonus_credits, max_uses) values
  ('HEPHA-INFLUENCER-2025', 'influencer', 200, 50),
  ('HEPHA-EARLYBIRD-2025', 'early_bird', 150, 100),
  ('HEPHA-PARTNER-2025', 'partner', 300, 20)
on conflict (code) do nothing;

-- 6) RLS 정책
alter table beta_invite_codes enable row level security;
alter table beta_invite_uses enable row level security;

-- 초대코드 조회는 인증된 사용자만
create policy "Anyone can view active invite codes"
  on beta_invite_codes for select
  to authenticated
  using (is_active = true and (expires_at is null or expires_at > now()));

-- 사용 로그는 본인만 조회
create policy "Users can view own invite uses"
  on beta_invite_uses for select
  to authenticated
  using (user_id = auth.uid());

-- 코멘트
comment on table beta_invite_codes is '베타 초대코드 관리 테이블';
comment on table beta_invite_uses is '초대코드 사용 로그';
comment on function use_beta_invite_code is '초대코드 사용 및 크레딧 지급 (원자적 트랜잭션)';
