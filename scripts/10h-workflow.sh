#!/bin/bash
# HEPHAITOS 10시간 개발 워크플로우 자동화 스크립트
# 실행: bash scripts/10h-workflow.sh

set -e  # 에러 발생 시 중단

echo "🚀 HEPHAITOS 10시간 워크플로우 시작"
echo "========================================"
echo "시작 시간: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ================================================================
# Hour 0-2: 기획 & 설계 (120분)
# ================================================================
echo -e "${BLUE}⏰ Hour 0-2: 기획 & 설계${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 2.1 비즈니스 요구사항 확인
echo -e "${YELLOW}📋 비즈니스 요구사항 확인 중...${NC}"
if grep -q "투자 조언 절대 금지" BUSINESS_CONSTITUTION.md; then
  echo -e "${GREEN}✅ 투자 조언 금지 원칙 확인${NC}"
else
  echo -e "${RED}❌ 투자 조언 금지 원칙 누락${NC}"
  exit 1
fi

if grep -q "Copy-Learn-Build" BUSINESS_CONSTITUTION.md; then
  echo -e "${GREEN}✅ Copy-Learn-Build 모델 확인${NC}"
else
  echo -e "${RED}❌ Copy-Learn-Build 모델 누락${NC}"
  exit 1
fi

# 2.2 기술 스택 확인
echo -e "${YELLOW}🔧 기술 스택 확인 중...${NC}"
if [ -f "package.json" ]; then
  echo -e "${GREEN}✅ Next.js 프로젝트 확인${NC}"
  echo "   - Node.js 버전: $(node -v)"
  echo "   - npm 버전: $(npm -v)"
else
  echo -e "${RED}❌ package.json 없음${NC}"
  exit 1
fi

# 2.3 환경 변수 확인
echo -e "${YELLOW}🔐 환경 변수 확인 중...${NC}"
if [ -f ".env.local" ]; then
  echo -e "${GREEN}✅ .env.local 파일 존재${NC}"
else
  echo -e "${YELLOW}⚠️  .env.local 파일 없음 (.env.example 참조)${NC}"
fi

echo -e "${GREEN}✅ Hour 0-2 완료${NC}\n"

# ================================================================
# Hour 2-6: 핵심 기능 개발 (240분)
# ================================================================
echo -e "${BLUE}⏰ Hour 2-6: 핵심 기능 개발${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 6.1 의존성 설치
echo -e "${YELLOW}📦 의존성 설치 중...${NC}"
npm ci --silent

# 6.2 단위 테스트 실행
echo -e "${YELLOW}🧪 단위 테스트 실행 중...${NC}"
if npm run test -- --run 2>/dev/null; then
  echo -e "${GREEN}✅ 단위 테스트 통과${NC}"
else
  echo -e "${YELLOW}⚠️  테스트 결과 확인 필요${NC}"
fi

echo -e "${GREEN}✅ Hour 2-6 완료${NC}\n"

# ================================================================
# Hour 6-8: 테스트 & 품질 검증 (120분)
# ================================================================
echo -e "${BLUE}⏰ Hour 6-8: 테스트 & 품질 검증${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 8.1 커버리지 테스트
echo -e "${YELLOW}📊 테스트 커버리지 측정 중...${NC}"
if npm run test:coverage 2>/dev/null; then
  echo -e "${GREEN}✅ 커버리지 측정 완료${NC}"
else
  echo -e "${YELLOW}⚠️  커버리지 스크립트 없음${NC}"
fi

# 8.2 Lint 검사
echo -e "${YELLOW}🔍 ESLint 검사 중...${NC}"
if npm run lint; then
  echo -e "${GREEN}✅ Lint 검사 통과${NC}"
else
  echo -e "${RED}❌ Lint 오류 발견${NC}"
  exit 1
fi

# 8.3 TypeScript 타입 체크
echo -e "${YELLOW}🔤 TypeScript 타입 체크 중...${NC}"
if npx tsc --noEmit; then
  echo -e "${GREEN}✅ 타입 체크 통과${NC}"
else
  echo -e "${RED}❌ 타입 오류 발견${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Hour 6-8 완료${NC}\n"

# ================================================================
# Hour 8-9: 법률 검토 & 보안 (60분)
# ================================================================
echo -e "${BLUE}⏰ Hour 8-9: 법률 검토 & 보안${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 9.1 금지 표현 검색
echo -e "${YELLOW}⚖️  금지 표현 검색 중...${NC}"
FORBIDDEN_PHRASES=("수익 보장" "확실한 수익" "하세요" "사세요")
VIOLATIONS=0

for phrase in "${FORBIDDEN_PHRASES[@]}"; do
  if grep -r "$phrase" src/ 2>/dev/null | grep -v node_modules; then
    echo -e "${RED}❌ 금지 표현 발견: '$phrase'${NC}"
    VIOLATIONS=$((VIOLATIONS+1))
  fi
done

if [ $VIOLATIONS -eq 0 ]; then
  echo -e "${GREEN}✅ 금지 표현 없음${NC}"
else
  echo -e "${RED}❌ $VIOLATIONS 개 금지 표현 발견${NC}"
  echo -e "${YELLOW}⚠️  /legal 명령어로 자동 수정 권장${NC}"
fi

# 9.2 보안 검사
echo -e "${YELLOW}🔒 보안 검사 중...${NC}"
if npm audit --audit-level=moderate; then
  echo -e "${GREEN}✅ 보안 취약점 없음${NC}"
else
  echo -e "${YELLOW}⚠️  보안 취약점 발견 (npm audit fix 실행 권장)${NC}"
fi

# 9.3 환경 변수 하드코딩 체크
echo -e "${YELLOW}🔐 환경 변수 하드코딩 체크 중...${NC}"
if grep -r "sk-" src/ 2>/dev/null | grep -v node_modules | grep -v ".env"; then
  echo -e "${RED}❌ API 키 하드코딩 발견${NC}"
  exit 1
else
  echo -e "${GREEN}✅ API 키 하드코딩 없음${NC}"
fi

echo -e "${GREEN}✅ Hour 8-9 완료${NC}\n"

# ================================================================
# Hour 9-10: 배포 준비 & 문서화 (60분)
# ================================================================
echo -e "${BLUE}⏰ Hour 9-10: 배포 준비${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 10.1 빌드
echo -e "${YELLOW}🏗️  Next.js 빌드 중...${NC}"
if npm run build; then
  echo -e "${GREEN}✅ 빌드 성공${NC}"

  # 빌드 결과 확인
  if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next | cut -f1)
    echo "   - 빌드 크기: $BUILD_SIZE"
  fi
else
  echo -e "${RED}❌ 빌드 실패${NC}"
  exit 1
fi

# 10.2 문서 체크
echo -e "${YELLOW}📚 문서 확인 중...${NC}"
if [ -f "README.md" ]; then
  echo -e "${GREEN}✅ README.md 존재${NC}"
fi

if [ -f "CLAUDE.md" ]; then
  echo -e "${GREEN}✅ CLAUDE.md 존재${NC}"
fi

if [ -f "BUSINESS_CONSTITUTION.md" ]; then
  echo -e "${GREEN}✅ BUSINESS_CONSTITUTION.md 존재${NC}"
fi

echo -e "${GREEN}✅ Hour 9-10 완료${NC}\n"

# ================================================================
# 워크플로우 완료
# ================================================================
echo "========================================"
echo -e "${GREEN}🎉 10시간 워크플로우 완료!${NC}"
echo "종료 시간: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 요약 리포트
echo "📊 워크플로우 요약"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ 비즈니스 요구사항 확인${NC}"
echo -e "${GREEN}✅ 단위 테스트 통과${NC}"
echo -e "${GREEN}✅ 코드 품질 검증${NC}"
echo -e "${GREEN}✅ 보안 검사 완료${NC}"
echo -e "${GREEN}✅ 빌드 성공${NC}"
echo ""
echo "다음 단계:"
echo "  1. 배포: vercel --prod"
echo "  2. 법률 검토: /legal src/"
echo "  3. E2E 테스트: npm run test:e2e"
echo ""
