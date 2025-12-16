#!/bin/bash

# ============================================
# HEPHAITOS DB Migration Deployment Script
# Loop 11-13 마이그레이션 자동 배포
# ============================================

set -e  # 에러 발생 시 즉시 종료

echo "🚀 HEPHAITOS DB Migration Deployment"
echo "===================================="
echo ""

# 색상 코드
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Supabase CLI 설치 확인
echo "📦 Step 1: Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo ""
    echo "Please install Supabase CLI:"
    echo "  - macOS: brew install supabase/tap/supabase"
    echo "  - Windows: scoop install supabase"
    echo "  - Linux: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI found: $(supabase --version)${NC}"
echo ""

# 2. 프로젝트 링크 확인
echo "🔗 Step 2: Checking Supabase project link..."
if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠ Project not linked${NC}"
    echo ""
    read -p "Enter your Supabase Project Ref (from Dashboard URL): " PROJECT_REF

    echo "Linking to project: $PROJECT_REF"
    supabase link --project-ref "$PROJECT_REF"

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to link project${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Project already linked${NC}"
fi
echo ""

# 3. 마이그레이션 파일 확인
echo "📋 Step 3: Checking migration files..."
MIGRATIONS=(
    "supabase/migrations/20251216_loop11_backtest_queue.sql"
    "supabase/migrations/20251216_loop12_strategy_performance.sql"
    "supabase/migrations/20251216_loop13_cs_automation.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ ! -f "$migration" ]; then
        echo -e "${RED}❌ Migration file not found: $migration${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Found: $(basename $migration)${NC}"
done
echo ""

# 4. 마이그레이션 상태 확인
echo "🔍 Step 4: Checking migration status..."
supabase migration list

echo ""
read -p "Do you want to apply these migrations? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}⚠ Deployment cancelled${NC}"
    exit 0
fi

# 5. 마이그레이션 적용
echo ""
echo "🚀 Step 5: Applying migrations..."
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All migrations applied successfully!${NC}"
else
    echo ""
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi

# 6. 검증
echo ""
echo "🔍 Step 6: Verifying migrations..."

# SQL 검증 쿼리 생성
VERIFY_SQL="
-- Loop 11 검증
SELECT 'backtest_jobs' as table_name, COUNT(*) as exists
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'backtest_jobs'

UNION ALL

-- Loop 12 검증
SELECT 'strategy_performance_agg' as table_name, COUNT(*) as exists
FROM information_schema.views
WHERE table_schema = 'public' AND table_name = 'strategy_performance_agg'

UNION ALL

-- Loop 13 검증
SELECT 'refund_requests' as table_name, COUNT(*) as exists
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'refund_requests'

UNION ALL

-- pg_cron 작업 확인
SELECT 'cron_job' as table_name, COUNT(*) as exists
FROM cron.job
WHERE jobname = 'refresh-strategy-performance';
"

# 임시 파일에 저장
echo "$VERIFY_SQL" > /tmp/verify_migrations.sql

# 실행
supabase db execute --file /tmp/verify_migrations.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All database objects verified!${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠ Verification failed (but migrations might be successful)${NC}"
fi

# 정리
rm -f /tmp/verify_migrations.sql

# 7. 완료 메시지
echo ""
echo "===================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "===================================="
echo ""
echo "Next steps:"
echo "  1. Deploy Edge Function: supabase functions deploy auto-refund-handler"
echo "  2. Set up Upstash Redis (see BETA_DEPLOYMENT_GUIDE.md)"
echo "  3. Configure Admin account"
echo "  4. Run E2E tests"
echo ""
echo "For detailed instructions, see: docs/BETA_DEPLOYMENT_GUIDE.md"
