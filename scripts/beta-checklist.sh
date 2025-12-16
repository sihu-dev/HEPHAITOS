#!/bin/bash

# ============================================
# HEPHAITOS Beta Deployment Checklist
# 배포 전 자동 검증 스크립트
# ============================================

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 체크 상태
PASS=0
FAIL=0
WARN=0

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   HEPHAITOS V2 Beta Deployment Checklist              ║"
echo "║   Version: 2.0.0-beta                                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 유틸리티 함수
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

# ============================================
# Section 1: 코드 상태
# ============================================
echo -e "${BLUE}━━━ Section 1: Code Status ━━━${NC}"

# 1.1 Build 성공 여부
if [ -d ".next" ]; then
    check_pass "Next.js build output exists"
else
    check_fail "No build output (.next directory missing)"
    echo "       Run: npm run build"
fi

# 1.2 Git 상태
if git rev-parse --git-dir > /dev/null 2>&1; then
    check_pass "Git repository initialized"

    # Uncommitted changes
    if [ -z "$(git status --porcelain)" ]; then
        check_pass "No uncommitted changes"
    else
        check_warn "You have uncommitted changes"
        echo "       Run: git status"
    fi

    # Remote configured
    if git remote -v | grep -q origin; then
        check_pass "Git remote configured"
    else
        check_warn "No git remote configured"
    fi
else
    check_fail "Not a git repository"
fi

echo ""

# ============================================
# Section 2: 환경 변수
# ============================================
echo -e "${BLUE}━━━ Section 2: Environment Variables ━━━${NC}"

# .env.local 파일 존재
if [ -f ".env.local" ]; then
    check_pass ".env.local file exists"

    # 필수 환경 변수 체크
    ENV_VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "UPSTASH_REDIS_REST_URL"
        "UPSTASH_REDIS_REST_TOKEN"
        "ANTHROPIC_API_KEY"
    )

    for var in "${ENV_VARS[@]}"; do
        if grep -q "^$var=" .env.local 2>/dev/null; then
            check_pass "$var is set"
        else
            check_fail "$var is missing"
        fi
    done
else
    check_fail ".env.local file not found"
fi

echo ""

# ============================================
# Section 3: Dependencies
# ============================================
echo -e "${BLUE}━━━ Section 3: Dependencies ━━━${NC}"

# 3.1 node_modules 존재
if [ -d "node_modules" ]; then
    check_pass "node_modules installed"
else
    check_fail "node_modules not found"
    echo "       Run: npm install"
fi

# 3.2 핵심 패키지 확인
PACKAGES=("next" "@supabase/supabase-js" "bullmq" "ioredis" "@anthropic-ai/sdk")
for pkg in "${PACKAGES[@]}"; do
    if [ -d "node_modules/$pkg" ]; then
        check_pass "$pkg installed"
    else
        check_fail "$pkg not installed"
    fi
done

echo ""

# ============================================
# Section 4: Database (Supabase)
# ============================================
echo -e "${BLUE}━━━ Section 4: Database (Supabase) ━━━${NC}"

# 4.1 Supabase CLI 설치
if command -v supabase &> /dev/null; then
    check_pass "Supabase CLI installed ($(supabase --version))"

    # 4.2 프로젝트 링크
    if [ -f ".supabase/config.toml" ]; then
        check_pass "Supabase project linked"
    else
        check_warn "Supabase project not linked"
        echo "       Run: supabase link --project-ref YOUR_PROJECT_REF"
    fi
else
    check_warn "Supabase CLI not installed"
    echo "       Install: https://supabase.com/docs/guides/cli/getting-started"
fi

# 4.3 마이그레이션 파일
MIGRATIONS=(
    "supabase/migrations/20251216_loop11_backtest_queue.sql"
    "supabase/migrations/20251216_loop12_strategy_performance.sql"
    "supabase/migrations/20251216_loop13_cs_automation.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        check_pass "$(basename $migration)"
    else
        check_fail "$(basename $migration) not found"
    fi
done

echo ""

# ============================================
# Section 5: Edge Functions
# ============================================
echo -e "${BLUE}━━━ Section 5: Edge Functions ━━━${NC}"

# 5.1 Edge Function 파일
if [ -f "supabase/functions/auto-refund-handler/index.ts" ]; then
    check_pass "auto-refund-handler function exists"
else
    check_fail "auto-refund-handler function not found"
fi

echo ""

# ============================================
# Section 6: Worker & Scripts
# ============================================
echo -e "${BLUE}━━━ Section 6: Worker & Scripts ━━━${NC}"

# 6.1 Worker 파일
if [ -f "src/lib/queue/backtest-worker.ts" ]; then
    check_pass "Backtest worker exists"
else
    check_fail "Backtest worker not found"
fi

# 6.2 package.json scripts
if grep -q '"worker":' package.json; then
    check_pass "Worker script defined in package.json"
else
    check_warn "Worker script not defined"
fi

echo ""

# ============================================
# Section 7: Admin Dashboard
# ============================================
echo -e "${BLUE}━━━ Section 7: Admin Dashboard ━━━${NC}"

# 7.1 Admin 페이지
if [ -f "src/app/admin/cs/page.tsx" ]; then
    check_pass "Admin CS page exists"
else
    check_fail "Admin CS page not found"
fi

# 7.2 Admin 레이아웃
if [ -f "src/app/admin/layout.tsx" ]; then
    check_pass "Admin layout exists"
else
    check_fail "Admin layout not found"
fi

echo ""

# ============================================
# Section 8: Documentation
# ============================================
echo -e "${BLUE}━━━ Section 8: Documentation ━━━${NC}"

DOCS=(
    "docs/BETA_DEPLOYMENT_GUIDE.md"
    "docs/COMPREHENSIVE_AUDIT_LOOP_1_TO_13.md"
    "docs/PROJECT_STATUS_V2_95_PERCENT.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        check_pass "$(basename $doc)"
    else
        check_warn "$(basename $doc) not found"
    fi
done

echo ""

# ============================================
# Summary
# ============================================
echo "╔════════════════════════════════════════════════════════╗"
echo "║                     SUMMARY                            ║"
echo "╠════════════════════════════════════════════════════════╣"
echo -e "║  ${GREEN}✓ Passed:${NC}  $PASS checks                                  ║"
echo -e "║  ${RED}✗ Failed:${NC}  $FAIL checks                                  ║"
echo -e "║  ${YELLOW}⚠ Warnings:${NC} $WARN checks                                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 배포 준비 상태 판단
if [ $FAIL -eq 0 ]; then
    if [ $WARN -eq 0 ]; then
        echo -e "${GREEN}🎉 Perfect! Ready for Beta deployment!${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Run migrations: bash scripts/deploy-migrations.sh"
        echo "  2. Deploy Edge Function: supabase functions deploy auto-refund-handler"
        echo "  3. Set up Admin account (see BETA_DEPLOYMENT_GUIDE.md)"
        echo "  4. Deploy to Vercel: git push origin main"
        exit 0
    else
        echo -e "${YELLOW}⚠ Ready with warnings. Please review warnings above.${NC}"
        exit 0
    fi
else
    echo -e "${RED}❌ Not ready for deployment. Please fix failed checks.${NC}"
    exit 1
fi
