#!/bin/bash

# ============================================
# Upstash Redis 환경 변수 추가 헬퍼
# .env.local에 자동으로 추가
# ============================================

# 색상 코드
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║     Upstash Redis Environment Variables Setup          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# .env.local 파일 확인
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠ .env.local 파일이 없습니다.${NC}"
    echo ""
    read -p ".env.example을 복사하여 .env.local을 생성하시겠습니까? (y/n): " CREATE_ENV

    if [ "$CREATE_ENV" = "y" ]; then
        cp .env.example .env.local
        echo -e "${GREEN}✓${NC} .env.local 생성 완료"
    else
        echo -e "${YELLOW}⚠ .env.local 파일을 먼저 생성하세요.${NC}"
        exit 0
    fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}Step 1: Upstash Console 확인${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. https://console.upstash.com 접속"
echo "2. Database 선택 (hephaitos-backtest-queue)"
echo "3. 'REST API' 탭 클릭"
echo "4. 다음 2개 값 복사 준비:"
echo "   - UPSTASH_REDIS_REST_URL"
echo "   - UPSTASH_REDIS_REST_TOKEN"
echo ""
read -p "준비가 되었으면 Enter를 누르세요..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}Step 2: 환경 변수 입력${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# UPSTASH_REDIS_REST_URL 입력
echo -e "${BLUE}1. UPSTASH_REDIS_REST_URL${NC}"
echo "   Example: https://us1-merry-firefly-12345.upstash.io"
echo ""
read -p "   URL을 붙여넣으세요: " REDIS_URL

# 빈 값 체크
if [ -z "$REDIS_URL" ]; then
    echo -e "${YELLOW}⚠ URL이 입력되지 않았습니다.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}2. UPSTASH_REDIS_REST_TOKEN${NC}"
echo "   Example: AXXXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo ""
read -p "   Token을 붙여넣으세요: " REDIS_TOKEN

# 빈 값 체크
if [ -z "$REDIS_TOKEN" ]; then
    echo -e "${YELLOW}⚠ Token이 입력되지 않았습니다.${NC}"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}Step 3: .env.local 업데이트${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 백업 생성
cp .env.local .env.local.backup
echo -e "${GREEN}✓${NC} 백업 생성: .env.local.backup"

# 기존 값 확인 및 업데이트/추가
if grep -q "^UPSTASH_REDIS_REST_URL=" .env.local; then
    # 기존 값 업데이트 (Windows 호환)
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows Git Bash
        sed -i "s|^UPSTASH_REDIS_REST_URL=.*|UPSTASH_REDIS_REST_URL=$REDIS_URL|" .env.local
        sed -i "s|^UPSTASH_REDIS_REST_TOKEN=.*|UPSTASH_REDIS_REST_TOKEN=$REDIS_TOKEN|" .env.local
    else
        # Linux/Mac
        sed -i "" "s|^UPSTASH_REDIS_REST_URL=.*|UPSTASH_REDIS_REST_URL=$REDIS_URL|" .env.local
        sed -i "" "s|^UPSTASH_REDIS_REST_TOKEN=.*|UPSTASH_REDIS_REST_TOKEN=$REDIS_TOKEN|" .env.local
    fi
    echo -e "${GREEN}✓${NC} 기존 값 업데이트 완료"
else
    # 새로 추가
    echo "" >> .env.local
    echo "# Upstash Redis (Added by add-upstash-env.sh on $(date))" >> .env.local
    echo "UPSTASH_REDIS_REST_URL=$REDIS_URL" >> .env.local
    echo "UPSTASH_REDIS_REST_TOKEN=$REDIS_TOKEN" >> .env.local
    echo -e "${GREEN}✓${NC} 새 환경 변수 추가 완료"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}Step 4: 검증${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 환경 변수 확인
echo "추가된 환경 변수:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep "UPSTASH_REDIS" .env.local | sed 's/=.*/=***REDACTED***/g'
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 연결 테스트 제안
echo -e "${YELLOW}💡 연결 테스트를 실행하시겠습니까?${NC}"
echo ""
read -p "Worker 연결 테스트 실행? (y/n): " TEST_CONNECTION

if [ "$TEST_CONNECTION" = "y" ]; then
    echo ""
    echo "Worker 실행 중... (종료하려면 Ctrl+C)"
    echo ""
    npm run worker
else
    echo ""
    echo -e "${GREEN}✅ 환경 변수 설정 완료!${NC}"
    echo ""
    echo "다음 단계:"
    echo "  1. 연결 테스트: npm run worker"
    echo "  2. 전체 검증: bash scripts/beta-checklist.sh"
    echo "  3. 배포 진행: bash scripts/quick-start.sh"
fi

echo ""
