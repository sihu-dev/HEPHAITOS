#!/usr/bin/env bash

# ============================================
# Forbidden Wording Check
# P0 게이트: "AI" 워딩 및 "키움 지원" 문구 차단
# ============================================

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🔍 Forbidden Wording Check..."

# 검사 대상 디렉토리
TARGETS=("src" "public" "docs")

# 오류 카운터
ERRORS=0

# ============================================
# 1. "AI" 워딩 체크 (Loop 5-7에서 제거 완료)
# ============================================
echo ""
echo "📌 Checking for AI wording..."

AI_PATTERN='(\bAI\b|인공지능|Artificial Intelligence|ChatGPT|GPT-4)'

for TARGET in "${TARGETS[@]}"; do
  if [ -d "$TARGET" ]; then
    if rg -n "$AI_PATTERN" "$TARGET" 2>/dev/null; then
      echo -e "${RED}❌ Error: AI wording found in $TARGET${NC}"
      echo "   Forbidden: AI, 인공지능, Artificial Intelligence, ChatGPT, GPT-4"
      echo "   Use instead: 엔진, 전략 엔진, 데스크 컨센서스, 리서치 엔진"
      ERRORS=$((ERRORS + 1))
    fi
  fi
done

# ============================================
# 2. "키움 지원" 문구 체크 (P0-2)
# ============================================
echo ""
echo "📌 Checking for Kiwoom support claims..."

KIWOOM_SUPPORT_PATTERN='키움.{0,10}지원|키움.{0,10}연동.{0,10}완료|Kiwoom.{0,10}support|키움증권.{0,10}사용.{0,10}가능'

for TARGET in "${TARGETS[@]}"; do
  if [ -d "$TARGET" ]; then
    if rg -n "$KIWOOM_SUPPORT_PATTERN" "$TARGET" 2>/dev/null; then
      echo -e "${RED}❌ Error: Kiwoom support claim found in $TARGET${NC}"
      echo "   Forbidden: 키움 지원, 키움 연동 완료, Kiwoom support, 키움증권 사용 가능"
      echo "   Use instead: 키움증권 준비중, 한국투자증권(KIS)만 지원"
      ERRORS=$((ERRORS + 1))
    fi
  fi
done

# ============================================
# 3. 투자 조언성 문구 체크 (법률 준수)
# ============================================
echo ""
echo "📌 Checking for investment advice wording..."

ADVICE_PATTERN='수익\s*보장|확실한\s*수익|반드시\s*오른다|무조건\s*수익|100%\s*수익'

for TARGET in "${TARGETS[@]}"; do
  if [ -d "$TARGET" ]; then
    if rg -n "$ADVICE_PATTERN" "$TARGET" 2>/dev/null; then
      echo -e "${RED}❌ Error: Investment advice wording found in $TARGET${NC}"
      echo "   Forbidden: 수익 보장, 확실한 수익, 반드시 오른다, 무조건 수익, 100% 수익"
      echo "   Use instead: 과거 성과는 미래를 보장하지 않습니다, 참고용, 교육 목적"
      ERRORS=$((ERRORS + 1))
    fi
  fi
done

# ============================================
# 4. 권유형 표현 체크 (법률 준수)
# ============================================
echo ""
echo "📌 Checking for imperative expressions..."

IMPERATIVE_PATTERN='사세요|팔세요|매수하세요|매도하세요|투자하세요|~하라|~해라'

for TARGET in "${TARGETS[@]}"; do
  if [ -d "$TARGET" ]; then
    if rg -n "$IMPERATIVE_PATTERN" "$TARGET" 2>/dev/null; then
      echo -e "${YELLOW}⚠️  Warning: Imperative expression found in $TARGET${NC}"
      echo "   Avoid: 사세요, 팔세요, 매수하세요, 매도하세요, 투자하세요"
      echo "   Use instead: ~할 수 있습니다, ~하는 방법, ~참고하세요"
      # ERRORS=$((ERRORS + 1))  # Warning only, not blocking
    fi
  fi
done

# ============================================
# 결과 출력
# ============================================
echo ""
echo "========================================"

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  echo "No forbidden wording found."
  exit 0
else
  echo -e "${RED}❌ $ERRORS error(s) found!${NC}"
  echo ""
  echo "Please fix the forbidden wording before committing."
  echo "See above for details."
  exit 1
fi
