---
name: session-start
event: SessionStart
description: 세션 시작 시 자동 컨텍스트 로드 및 상태 체크
enabled: true
---

# SessionStart Hook - 세션 초기화

## 자동 실행 작업

### 1. 컨텍스트 자동 로드
```
📂 자동 로드 파일:
✅ CLAUDE.md
✅ BUSINESS_CONSTITUTION.md
✅ .claude/rules.md
```

### 2. 프로젝트 상태 체크
```bash
# Git 상태
git status --short

# 미완료 TODO 확인
grep -r "TODO:" src/ | wc -l

# 빌드 상태
npm run build --dry-run 2>&1 | tail -n 5
```

**출력 예시:**
```
🚀 HEPHAITOS 세션 시작
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 프로젝트: HEPHAITOS v2.0.0
🌿 브랜치: feature/ai-coaching
📝 미커밋 변경: 3개 파일
⚠️ TODO: 12개 발견
✅ 빌드 상태: OK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. 환경 변수 체크
```
🔑 환경 변수 상태:
✅ NEXT_PUBLIC_SUPABASE_URL
✅ ANTHROPIC_API_KEY
⚠️ REDIS_URL (Mock 모드)
```

### 4. 최근 작업 히스토리
```
📋 최근 작업 (최근 3개 커밋):
- feat(strategy): AI 전략 생성 개선
- fix(backtest): 타입 오류 수정
- chore(deps): 의존성 업데이트
```

### 5. 핵심 각인 표시
```
┌─────────────────────────────────────────┐
│  HEPHAITOS = "Replit for Trading"       │
│                                         │
│  COPY → LEARN → BUILD                   │
│                                         │
│  ❌ 투자 조언 절대 금지                   │
│  ✅ 교육 + 도구만 제공                    │
└─────────────────────────────────────────┘
```

## 자동 제안

### 미완료 작업 감지 시
```
💡 이전 세션에서 미완료 작업 발견:
- [ ] AI 멘토 코칭 시스템 구현 (3/5 단계)
- [ ] 백테스팅 성능 최적화

계속하시겠습니까?
```

### 브랜치 오래된 경우
```
⚠️ 현재 브랜치가 main보다 15 커밋 뒤처져 있습니다.
rebase를 권장합니다.
```
