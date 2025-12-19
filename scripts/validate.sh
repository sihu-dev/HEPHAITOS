#!/bin/bash
# HEPHAITOS 자동 검증 스크립트
# 반복 개선 루프에서 사용

set -e

PROJECT_ROOT="/home/sihu2129/HEPHAITOS"
cd "$PROJECT_ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 HEPHAITOS 자동 검증 시작"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. TypeScript 타입 체크
echo ""
echo "📋 [1/4] TypeScript 타입 체크..."
if npx tsc --noEmit 2>&1; then
    echo "✅ 타입 체크 통과"
    TYPE_OK=1
else
    echo "❌ 타입 오류 발견"
    TYPE_OK=0
fi

# 2. 패키지 빌드 확인
echo ""
echo "📦 [2/4] 패키지 빌드 확인..."
BUILD_OK=1
for pkg in types utils core; do
    if [ -d "packages/$pkg" ]; then
        echo "  - packages/$pkg..."
        if cd "packages/$pkg" && npx tsc --noEmit 2>/dev/null; then
            echo "    ✅ $pkg OK"
        else
            echo "    ❌ $pkg 빌드 실패"
            BUILD_OK=0
        fi
        cd "$PROJECT_ROOT"
    fi
done

# 3. 린트 체크 (있을 경우)
echo ""
echo "🔬 [3/4] ESLint 체크..."
if command -v npx &> /dev/null && [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
    if npx eslint src/ --max-warnings 0 2>/dev/null; then
        echo "✅ 린트 통과"
        LINT_OK=1
    else
        echo "⚠️ 린트 경고 있음"
        LINT_OK=0
    fi
else
    echo "ℹ️ ESLint 설정 없음 - 건너뜀"
    LINT_OK=1
fi

# 4. 법률 준수 체크
echo ""
echo "⚖️ [4/4] 법률 준수 체크..."
FORBIDDEN=("수익 보장" "확실한 수익" "투자하세요" "매수하세요" "매도하세요")
LEGAL_OK=1

for phrase in "${FORBIDDEN[@]}"; do
    found=$(grep -r "$phrase" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
    if [ "$found" -gt 0 ]; then
        echo "❌ 금지 표현 발견: '$phrase' ($found개)"
        LEGAL_OK=0
    fi
done

if [ "$LEGAL_OK" -eq 1 ]; then
    echo "✅ 법률 준수 통과"
fi

# 결과 요약
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 검증 결과 요약"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  타입 체크:  $([ $TYPE_OK -eq 1 ] && echo '✅' || echo '❌')"
echo "  패키지 빌드: $([ $BUILD_OK -eq 1 ] && echo '✅' || echo '❌')"
echo "  린트:       $([ $LINT_OK -eq 1 ] && echo '✅' || echo '❌')"
echo "  법률 준수:  $([ $LEGAL_OK -eq 1 ] && echo '✅' || echo '❌')"
echo ""

# 전체 결과
if [ $TYPE_OK -eq 1 ] && [ $BUILD_OK -eq 1 ] && [ $LINT_OK -eq 1 ] && [ $LEGAL_OK -eq 1 ]; then
    echo "🎉 모든 검증 통과!"
    exit 0
else
    echo "⚠️ 일부 검증 실패 - 수정 필요"
    exit 1
fi
