#!/bin/bash
# HEPHAITOS 원격 작업 모드 시작 스크립트

set -e

echo "🔥 HEPHAITOS 원격 작업 모드"
echo "================================"

# 프로젝트 디렉토리로 이동
cd /home/sihu2129/HEPHAITOS

# 1. Git 상태 확인
echo ""
echo "📦 Git 상태:"
git status --short
echo ""

# 2. Happy Coder 설치 확인
if ! command -v happy &> /dev/null; then
    echo "⚠️  Happy Coder 미설치. 설치 중..."
    npm install -g happy-coder
fi

# 3. 기존 데몬 정리
echo "🔄 기존 프로세스 정리..."
happy daemon stop 2>/dev/null || true

# 4. Happy Coder 데몬 시작
echo "🚀 Happy Coder 데몬 시작..."
happy daemon start &
HAPPY_PID=$!

# 5. 잠시 대기
sleep 2

echo ""
echo "================================"
echo "✅ 원격 작업 준비 완료!"
echo ""
echo "📱 모바일 연결 방법:"
echo "   1. Happy Coder 앱 설치 (iOS/Android)"
echo "   2. 앱에서 'Connect' 선택"
echo "   3. QR 코드 스캔 또는 코드 입력"
echo ""
echo "🌐 Claude Code 웹:"
echo "   https://claude.com → Claude Code → GitHub 연동"
echo "   레포: https://github.com/sihu-dev/HEPHAITOS"
echo ""
echo "🛑 종료하려면: Ctrl+C"
echo "================================"

# 프로세스 대기
wait $HAPPY_PID
