#!/bin/bash
# PostToolUse Hook: 파일 수정 후 자동 포맷팅
# Write/Edit 완료 후 실행

FILE_PATH="$1"
PROJECT_ROOT="/home/sihu2129/HEPHAITOS"

# TypeScript/TSX 파일만 처리
if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.tsx ]]; then
    exit 0
fi

# 파일이 프로젝트 내에 있는지 확인
if [[ "$FILE_PATH" != "$PROJECT_ROOT"* ]]; then
    exit 0
fi

# Prettier 포맷팅 (있을 경우)
if command -v npx &> /dev/null && [ -f "$PROJECT_ROOT/.prettierrc" ] || [ -f "$PROJECT_ROOT/prettier.config.js" ]; then
    npx prettier --write "$FILE_PATH" 2>/dev/null
fi

exit 0
