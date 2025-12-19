#!/bin/bash
# HEPHAITOS 무한 루프 드라이버
# Claude Code에서 자동 반복 개선에 사용

PROJECT_ROOT="/home/sihu2129/HEPHAITOS"
MEMORY_FILE="$PROJECT_ROOT/.claude/INFINITE_LOOP_MEMORY.md"
TASKS_FILE="$PROJECT_ROOT/TASKS.md"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 HEPHAITOS 무한 루프 시작"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 메모리 파일 확인
if [ -f "$MEMORY_FILE" ]; then
    echo "✅ 메모리 파일 발견"
    echo ""
    echo "📝 마지막 상태:"
    head -30 "$MEMORY_FILE"
else
    echo "⚠️ 메모리 파일 없음 - 새로 시작"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 2. TASKS.md에서 다음 작업 확인
if [ -f "$TASKS_FILE" ]; then
    echo "📋 현재 작업 큐:"
    grep -A 5 "진행 중 작업" "$TASKS_FILE" 2>/dev/null || echo "대기 중인 작업 확인 필요"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Claude Code에서 실행할 명령어:"
echo ""
echo "ㄱ     → 다음 우선순위 작업 자동 진행"
echo "ㄱㄱ   → 2개 작업 병렬 진행"
echo "ㄱ?    → 현재 상태 미리보기"
echo "ㄱ 검증 → 빌드/테스트/타입체크 실행"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
