#!/bin/bash

# ============================================
# HEPHAITOS Beta Quick Start Script
# 대화형 배포 가이드
# ============================================

set -e

# 색상 코드
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 진행 상태
STEP=0
TOTAL_STEPS=7

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║      HEPHAITOS V2 Beta Quick Start Guide              ║"
echo "║      대화형 배포 가이드                                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 유틸리티 함수
step_header() {
    ((STEP++))
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Step $STEP/$TOTAL_STEPS: $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

wait_for_user() {
    echo ""
    read -p "Press Enter to continue..."
}

# ============================================
# Step 1: 사전 체크
# ============================================
step_header "Pre-flight Check"

echo "배포 전 시스템 상태를 확인합니다..."
echo ""

# Node.js 확인
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js: $(node --version)"
else
    echo -e "${RED}✗${NC} Node.js not found"
    echo "Install Node.js: https://nodejs.org/"
    exit 1
fi

# npm 확인
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓${NC} npm: $(npm --version)"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Supabase CLI 확인
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✓${NC} Supabase CLI: $(supabase --version)"
else
    echo -e "${YELLOW}⚠${NC} Supabase CLI not found (will install later)"
fi

# Git 확인
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Git repository"
else
    echo -e "${RED}✗${NC} Not a git repository"
    exit 1
fi

echo ""
echo -e "${GREEN}Pre-flight check passed!${NC}"

wait_for_user

# ============================================
# Step 2: Upstash Redis 설정
# ============================================
step_header "Upstash Redis Setup"

echo "Upstash Redis를 설정합니다."
echo ""
echo -e "${YELLOW}중요:${NC} 이 단계는 수동 작업이 필요합니다."
echo ""
echo "1. 브라우저에서 https://upstash.com 접속"
echo "2. GitHub/Google 계정으로 로그인"
echo "3. 'Create Database' 클릭"
echo "4. 다음 정보 입력:"
echo "   - Name: hephaitos-backtest-queue"
echo "   - Region: Asia Pacific (ap-northeast-1) - Tokyo"
echo "   - Type: Regional (무료)"
echo "5. 'Create' 클릭"
echo ""
echo "6. 생성 후 'REST API' 탭으로 이동"
echo "7. 다음 2개 값 복사:"
echo "   - UPSTASH_REDIS_REST_URL"
echo "   - UPSTASH_REDIS_REST_TOKEN"
echo ""

read -p "Upstash Redis를 생성했습니까? (y/n): " REDIS_READY

if [ "$REDIS_READY" != "y" ]; then
    echo -e "${YELLOW}⚠ Upstash Redis 설정을 완료한 후 다시 실행하세요.${NC}"
    exit 0
fi

echo ""
read -p "UPSTASH_REDIS_REST_URL을 입력하세요: " REDIS_URL
read -p "UPSTASH_REDIS_REST_TOKEN을 입력하세요: " REDIS_TOKEN

# .env.local 파일에 추가
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo -e "${GREEN}✓${NC} .env.local created from .env.example"
fi

# Redis 환경 변수 추가
if grep -q "UPSTASH_REDIS_REST_URL=" .env.local; then
    sed -i "s|UPSTASH_REDIS_REST_URL=.*|UPSTASH_REDIS_REST_URL=$REDIS_URL|" .env.local
    sed -i "s|UPSTASH_REDIS_REST_TOKEN=.*|UPSTASH_REDIS_REST_TOKEN=$REDIS_TOKEN|" .env.local
else
    echo "" >> .env.local
    echo "# Upstash Redis (Added by quick-start.sh)" >> .env.local
    echo "UPSTASH_REDIS_REST_URL=$REDIS_URL" >> .env.local
    echo "UPSTASH_REDIS_REST_TOKEN=$REDIS_TOKEN" >> .env.local
fi

echo ""
echo -e "${GREEN}✓${NC} Redis 환경 변수가 .env.local에 추가되었습니다."

wait_for_user

# ============================================
# Step 3: Supabase 프로젝트 링크
# ============================================
step_header "Supabase Project Link"

echo "Supabase 프로젝트와 로컬을 연결합니다."
echo ""

if [ -f ".supabase/config.toml" ]; then
    echo -e "${GREEN}✓${NC} Supabase 프로젝트가 이미 연결되어 있습니다."
else
    echo "Supabase Dashboard에서 Project Ref를 확인하세요:"
    echo "URL: https://supabase.com/dashboard/project/<PROJECT_REF>"
    echo ""
    read -p "Project Ref를 입력하세요: " PROJECT_REF

    echo ""
    echo "프로젝트를 연결하는 중..."
    supabase link --project-ref "$PROJECT_REF"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Supabase 프로젝트 연결 완료"
    else
        echo -e "${RED}✗${NC} 연결 실패"
        exit 1
    fi
fi

wait_for_user

# ============================================
# Step 4: DB 마이그레이션 실행
# ============================================
step_header "Database Migration"

echo "DB 마이그레이션을 실행합니다."
echo ""
echo "마이그레이션 파일:"
echo "  - Loop 11: Backtest Queue System"
echo "  - Loop 12: Strategy Performance Aggregation"
echo "  - Loop 13: CS/환불 자동화"
echo ""

read -p "마이그레이션을 실행하시겠습니까? (y/n): " MIGRATE_CONFIRM

if [ "$MIGRATE_CONFIRM" = "y" ]; then
    echo ""
    echo "마이그레이션 실행 중..."
    supabase db push

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓${NC} 마이그레이션 완료!"
        echo ""
        echo "검증 중..."

        # 검증 SQL
        supabase db execute --sql "
SELECT 'backtest_jobs' as object, COUNT(*) as exists
FROM information_schema.tables
WHERE table_name = 'backtest_jobs'
UNION ALL
SELECT 'strategy_performance_agg', COUNT(*)
FROM information_schema.views
WHERE table_name = 'strategy_performance_agg'
UNION ALL
SELECT 'refund_requests', COUNT(*)
FROM information_schema.tables
WHERE table_name = 'refund_requests';
"

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓${NC} 데이터베이스 객체 검증 완료"
        fi
    else
        echo -e "${RED}✗${NC} 마이그레이션 실패"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ 마이그레이션을 건너뜁니다.${NC}"
fi

wait_for_user

# ============================================
# Step 5: Edge Function 배포
# ============================================
step_header "Edge Function Deployment"

echo "Supabase Edge Function을 배포합니다."
echo ""
echo "Edge Function: auto-refund-handler"
echo ""
echo -e "${YELLOW}주의:${NC} Supabase Dashboard에서 먼저 Secrets를 설정해야 합니다."
echo ""
echo "필수 Secrets (Dashboard > Edge Functions > Secrets):"
echo "  - TOSS_SECRET_KEY"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo ""

read -p "Secrets를 설정했습니까? (y/n): " SECRETS_READY

if [ "$SECRETS_READY" != "y" ]; then
    echo -e "${YELLOW}⚠ Secrets를 설정한 후 다시 실행하세요.${NC}"
    echo ""
    echo "설정 방법:"
    echo "1. Supabase Dashboard 접속"
    echo "2. Settings > Edge Functions > Secrets"
    echo "3. 위 3개 환경 변수 추가"
    exit 0
fi

read -p "Edge Function을 배포하시겠습니까? (y/n): " DEPLOY_CONFIRM

if [ "$DEPLOY_CONFIRM" = "y" ]; then
    echo ""
    echo "Edge Function 배포 중..."
    supabase functions deploy auto-refund-handler

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓${NC} Edge Function 배포 완료!"
        echo ""
        echo "배포된 URL:"
        echo "https://$(supabase status | grep 'API URL' | awk '{print $3}' | sed 's|https://||')/functions/v1/auto-refund-handler"
    else
        echo -e "${RED}✗${NC} 배포 실패"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Edge Function 배포를 건너뜁니다.${NC}"
fi

wait_for_user

# ============================================
# Step 6: Admin 계정 설정
# ============================================
step_header "Admin Account Setup"

echo "Admin 계정을 설정합니다."
echo ""
echo "방법 1 (권장): 이메일 화이트리스트"
echo "방법 2: User Metadata (SQL)"
echo ""

read -p "어떤 방법을 사용하시겠습니까? (1/2): " ADMIN_METHOD

if [ "$ADMIN_METHOD" = "1" ]; then
    echo ""
    read -p "Admin 이메일을 입력하세요: " ADMIN_EMAIL

    # src/app/admin/layout.tsx 수정
    sed -i "s|'admin@hephaitos.io',|'admin@hephaitos.io',\n  '$ADMIN_EMAIL',|" src/app/admin/layout.tsx

    echo ""
    echo -e "${GREEN}✓${NC} Admin 이메일이 화이트리스트에 추가되었습니다."
    echo ""
    echo -e "${YELLOW}주의:${NC} 변경사항을 커밋하고 배포해야 적용됩니다."
    echo "  git add src/app/admin/layout.tsx"
    echo "  git commit -m 'feat(admin): Add admin email to whitelist'"
    echo "  git push origin main"

elif [ "$ADMIN_METHOD" = "2" ]; then
    echo ""
    read -p "Admin 이메일을 입력하세요: " ADMIN_EMAIL

    echo ""
    echo "다음 SQL을 Supabase SQL Editor에서 실행하세요:"
    echo ""
    echo "UPDATE auth.users"
    echo "SET raw_user_meta_data = raw_user_meta_data || '{\"role\": \"admin\"}'::jsonb"
    echo "WHERE email = '$ADMIN_EMAIL';"
    echo ""
    echo -e "${YELLOW}⚠ SQL Editor에서 직접 실행해야 합니다.${NC}"
fi

wait_for_user

# ============================================
# Step 7: 최종 확인
# ============================================
step_header "Final Check"

echo "배포 준비 상태를 최종 확인합니다."
echo ""

# 빌드 테스트
echo "Building for production..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} Production build successful!"
else
    echo ""
    echo -e "${RED}✗${NC} Build failed"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║              🎉 Quick Start Complete!                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "다음 단계:"
echo ""
echo "1. Vercel 환경 변수 설정"
echo "   - Vercel Dashboard > Settings > Environment Variables"
echo "   - .env.local의 모든 변수 추가"
echo ""
echo "2. Git Push로 배포"
echo "   git add ."
echo "   git commit -m 'feat: Beta deployment ready'"
echo "   git push origin main"
echo ""
echo "3. Worker 실행 (별도 서버)"
echo "   npm run worker:prod"
echo "   또는"
echo "   pm2 start npm --name 'hephaitos-worker' -- run worker:prod"
echo ""
echo "4. Health Check"
echo "   curl https://hephaitos.io/api/health"
echo ""
echo "자세한 내용은 docs/BETA_DEPLOYMENT_GUIDE.md를 참조하세요."
echo ""
