---
name: stop
event: Stop
description: 작업 완료/중단 시 자동 검증 및 정리
enabled: true
---

# Stop Hook - 작업 완료 시 검증

## 트리거 조건
Claude가 작업을 완료하거나 중단할 때

## 자동 실행 작업

### 1. 완료 검증 체크리스트
```
📋 작업 완료 검증:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ TypeScript 타입 체크: PASS
✅ ESLint: PASS (0 warnings)
⚠️ 테스트: 234/236 passed (2 skipped)
✅ 빌드: SUCCESS
✅ 법률 준수: COMPLIANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. 변경 사항 요약
```
📝 변경 사항 요약:
- 수정된 파일: 7개
- 추가된 파일: 2개
- 삭제된 파일: 0개
- 코드 라인: +234 / -45

주요 변경:
1. src/lib/ai/strategy-generator.ts - AI 전략 생성 로직 개선
2. src/components/Strategy/StrategyCard.tsx - UI 개선
3. src/__tests__/lib/strategy.test.ts - 테스트 추가
```

### 3. 커밋 제안
```
💡 커밋 제안:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

feat(ai): AI 전략 생성 로직 개선

- 자연어 파싱 정확도 향상
- 백테스팅 연동 개선
- 타입 안전성 강화

Generated with [Claude Code]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
커밋하시겠습니까? [y/n]
```

### 4. 다음 작업 제안
```
🎯 다음 작업 제안:
1. [ ] 테스트 커버리지 확인 (현재: 78%)
2. [ ] 성능 테스트 실행
3. [ ] 배포 전 검증 (/deploy-check)
```

### 5. 세션 메모 저장
```
📝 세션 메모 저장:
- 파일: .claude/sessions/2025-12-18-ai-strategy.md
- 작업 내용 자동 기록
- 다음 세션에서 참조 가능
```

## 경고 상황

### 미완료 작업 감지
```
⚠️ Stop Hook 경고:
작업이 완료되지 않았습니다.

미완료 항목:
- [ ] 테스트 작성
- [ ] 문서화

중단하시겠습니까? [y/n]
```

### 빌드 실패 시
```
❌ Stop Hook 차단:
빌드가 실패했습니다.

오류:
- src/lib/strategy.ts:42 - Type error

수정 후 다시 시도해주세요.
자동 수정을 시도합니까? [y/n]
```

## 자동 정리

### 임시 파일 정리
```bash
# 테스트 결과 정리
rm -rf test-results/
rm -rf playwright-report/

# 빌드 캐시 정리 (필요시)
rm -rf .next/cache/
```

### 세션 히스토리 저장
```
📁 세션 저장:
- .claude/sessions/2025-12-18-ai-strategy.md
- 작업 시간: 2시간 34분
- 변경 파일: 9개
- 커밋: 3개
```
