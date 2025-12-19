#!/bin/bash
# HEPHAITOS Session Start Hook

# Set environment variables
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export PROJECT_NAME=HEPHAITOS' >> "$CLAUDE_ENV_FILE"
  echo 'export PROJECT_TYPE=trading' >> "$CLAUDE_ENV_FILE"
  echo 'export NODE_ENV=development' >> "$CLAUDE_ENV_FILE"
fi

# Output context for Claude
echo "=== HEPHAITOS 트레이딩 플랫폼 ==="
echo "경로: $(pwd)"
echo "Git 브랜치: $(git branch --show-current 2>/dev/null || echo 'N/A')"
echo "최근 커밋: $(git log -1 --oneline 2>/dev/null || echo 'N/A')"
echo ""
echo "핵심 규칙:"
echo "- 투자 조언 금지"
echo "- 면책조항 필수"
echo "- @hephaitos 네임스페이스 사용"
echo ""
echo "세션 준비 완료!"

exit 0
