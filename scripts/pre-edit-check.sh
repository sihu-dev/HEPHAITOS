#!/bin/bash
# PreToolUse Hook: Write/Edit 도구 사용 전 검증
# 금지 표현 체크

FILE_PATH="$1"
CONTENT="$2"

# TypeScript/TSX 파일만 체크
if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.tsx ]]; then
    exit 0
fi

# 금지 표현 체크
FORBIDDEN=("수익 보장" "확실한 수익" "투자하세요" "매수하세요" "매도하세요")

for phrase in "${FORBIDDEN[@]}"; do
    if echo "$CONTENT" | grep -q "$phrase"; then
        echo "⚠️ 금지 표현 발견: '$phrase'"
        echo "법률 준수를 위해 해당 표현을 수정해주세요."
        exit 1
    fi
done

# any 타입 체크 (src/ 하위만)
if [[ "$FILE_PATH" == *src/* ]]; then
    if echo "$CONTENT" | grep -qE ":\s*any\b|as\s+any\b"; then
        echo "⚠️ any 타입 사용 발견"
        echo "unknown 또는 구체적 타입을 사용해주세요."
        # 경고만 출력, 차단하지 않음
    fi
fi

exit 0
