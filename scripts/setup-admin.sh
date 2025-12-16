#!/bin/bash

# ============================================
# Admin Account Setup Helper
# Admin 계정 설정을 위한 SQL 생성
# ============================================

# 색상 코드
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║          HEPHAITOS Admin Setup Helper                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "Admin 계정을 설정하는 방법을 선택하세요:"
echo ""
echo "1. 이메일 화이트리스트 (코드 수정) - 권장"
echo "2. User Metadata (SQL 실행)"
echo "3. 둘 다 확인"
echo ""

read -p "선택 (1/2/3): " METHOD

case $METHOD in
    1)
        echo ""
        echo -e "${BLUE}━━━ 방법 1: 이메일 화이트리스트 ━━━${NC}"
        echo ""
        read -p "Admin 이메일을 입력하세요: " ADMIN_EMAIL

        echo ""
        echo "다음 파일을 수정하세요:"
        echo -e "${YELLOW}src/app/admin/layout.tsx${NC}"
        echo ""
        echo "수정할 부분:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "const adminEmails = ["
        echo "  'admin@hephaitos.io',"
        echo -e "  ${GREEN}'$ADMIN_EMAIL',${NC}  // ← 이 줄 추가"
        echo "];"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "자동 수정을 실행하시겠습니까? (y/n): "
        read AUTO_EDIT

        if [ "$AUTO_EDIT" = "y" ]; then
            # 백업 생성
            cp src/app/admin/layout.tsx src/app/admin/layout.tsx.backup

            # 이메일 추가
            sed -i "/const adminEmails = \[/a\    '$ADMIN_EMAIL'," src/app/admin/layout.tsx

            echo -e "${GREEN}✓${NC} src/app/admin/layout.tsx 수정 완료"
            echo ""
            echo "변경사항 확인:"
            grep -A 3 "const adminEmails" src/app/admin/layout.tsx
            echo ""
            echo -e "${YELLOW}주의:${NC} Git commit 후 배포해야 적용됩니다."
            echo ""
            echo "  git add src/app/admin/layout.tsx"
            echo "  git commit -m 'feat(admin): Add $ADMIN_EMAIL to admin whitelist'"
            echo "  git push origin main"
        fi
        ;;

    2)
        echo ""
        echo -e "${BLUE}━━━ 방법 2: User Metadata (SQL) ━━━${NC}"
        echo ""
        read -p "Admin 이메일을 입력하세요: " ADMIN_EMAIL

        echo ""
        echo "다음 SQL을 Supabase SQL Editor에서 실행하세요:"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "${GREEN}"
        cat << SQL
-- Admin role 부여
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = '$ADMIN_EMAIL';

-- 확인
SELECT
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE email = '$ADMIN_EMAIL';
SQL
        echo -e "${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "실행 방법:"
        echo "1. Supabase Dashboard 접속"
        echo "2. SQL Editor 탭 열기"
        echo "3. 위 SQL 복사 & 붙여넣기"
        echo "4. 'Run' 클릭"
        echo ""

        # SQL 파일로 저장
        cat > /tmp/setup-admin-$ADMIN_EMAIL.sql << SQL
-- Admin Setup for $ADMIN_EMAIL
-- Generated: $(date)

-- 1. Admin role 부여
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = '$ADMIN_EMAIL';

-- 2. 확인
SELECT
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE email = '$ADMIN_EMAIL';
SQL

        echo -e "${GREEN}✓${NC} SQL 파일 저장됨: /tmp/setup-admin-$ADMIN_EMAIL.sql"
        echo ""
        echo "또는 Supabase CLI로 실행:"
        echo "  supabase db execute --file /tmp/setup-admin-$ADMIN_EMAIL.sql"
        ;;

    3)
        echo ""
        echo -e "${BLUE}━━━ 현재 Admin 설정 확인 ━━━${NC}"
        echo ""

        # 1. 코드 확인
        echo "1. 이메일 화이트리스트 (코드):"
        echo ""
        if [ -f "src/app/admin/layout.tsx" ]; then
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            grep -A 5 "const adminEmails" src/app/admin/layout.tsx
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        else
            echo -e "${YELLOW}⚠ Admin layout 파일을 찾을 수 없습니다.${NC}"
        fi

        # 2. DB 확인
        echo ""
        echo "2. User Metadata (DB):"
        echo ""
        echo "다음 SQL을 실행하여 확인하세요:"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        cat << SQL
-- Admin 계정 조회
SELECT
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin';
SQL
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ;;

    *)
        echo ""
        echo -e "${YELLOW}⚠ 잘못된 선택입니다.${NC}"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Admin 설정 완료!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "다음 단계:"
echo "  1. 배포 후 /admin/cs 페이지 접속"
echo "  2. Admin 이메일로 로그인"
echo "  3. Admin Dashboard 정상 접근 확인"
echo ""
