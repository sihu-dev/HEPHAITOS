---
name: self-evolving-loop
description: Claude 4.5 Opus 기반 자가성장 지능형 루프. Effort Parameter, Memory Tool, 병렬 작업 관리에 사용.
allowed-tools: Read, Write, Edit, Bash, Task, TodoWrite
---

# 자가성장 지능형 루프 스킬

## 사용 시점
- 복잡한 다단계 작업 수행 시
- 병렬 작업 관리 필요 시
- 세션 간 컨텍스트 유지 필요 시
- 자동화된 개선 사이클 구축 시

## Claude 4.5 Opus 핵심 기능 활용

### 1. Effort Parameter (사고 예산 조절)

```yaml
effort_levels:
  low:
    용도: 간단한 코드 수정, 포맷팅
    토큰: ~1K thinking tokens
    예시: "변수명 변경해줘"

  medium:
    용도: 기능 구현, 버그 수정
    토큰: ~5K thinking tokens
    예시: "API 엔드포인트 추가해줘"

  high:
    용도: 아키텍처 설계, 복잡한 리팩토링
    토큰: ~20K thinking tokens
    예시: "think harder. 시스템 전체 최적화해줘"
```

### 2. ㄱ 루프 시스템 (자가성장 트리거)

```
입력 방식:
ㄱ       → 다음 우선순위 작업 자동 진행
ㄱㄱ     → 2개 작업 병렬 진행
ㄱㄱㄱ   → 3개 작업 병렬 진행 (최대)
ㄱ?      → 현재 상태 미리보기
ㄱ!      → 긴급 핫픽스 모드
ㄱ 배포  → Production 배포
ㄱ 검증  → 빌드/테스트/타입체크
```

### 3. 세션 간 메모리 유지

```yaml
영구 메모리 파일:
  - .claude/INFINITE_LOOP_MEMORY.md   # 누적 진행 상황
  - TASKS.md                          # 작업 큐
  - DEVELOPMENT_LOOP.md               # 루프 상태

세션 시작 시 필수 읽기:
  1. INFINITE_LOOP_MEMORY.md
  2. TASKS.md
  3. 마지막 작업 이어서 진행
```

## 자가성장 루프 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    자가성장 지능형 루프                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐   │
│  │  SCAN   │ ──► │ ANALYZE │ ──► │   FIX   │ ──► │ VERIFY  │   │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘   │
│       │                                               │         │
│       │              INFINITE LOOP                    │         │
│       └───────────────────────────────────────────────┘         │
│                                                                 │
│  [Hooks]                      [Skills]                          │
│  ├─ PreToolUse: 검증          ├─ progressive-analysis           │
│  ├─ PostToolUse: 자동화       ├─ cmentech-b2b-automation        │
│  └─ Stop: 다음 작업 트리거    └─ self-evolving-loop             │
│                                                                 │
│  [Agents]                     [Commands]                        │
│  ├─ code-reviewer             ├─ /analyze                       │
│  ├─ test-automator            ├─ /type-check --fix              │
│  └─ documentation-writer      └─ /deploy-check                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 병렬 작업 관리

### Task Tool 활용 (병렬 에이전트)

```typescript
// 3개 작업 병렬 실행 예시
const tasks = await Promise.all([
  Task({ subagent_type: 'Explore', prompt: '코드베이스 구조 분석' }),
  Task({ subagent_type: 'general-purpose', prompt: '의존성 취약점 검사' }),
  Task({ subagent_type: 'Plan', prompt: '다음 기능 구현 계획' }),
]);
```

### 병렬 작업 우선순위

```yaml
P0 (Critical):
  - 보안 취약점 수정
  - 빌드 실패 수정
  - 프로덕션 버그 수정

P1 (High):
  - 타입 에러 수정
  - 테스트 실패 수정
  - 성능 최적화

P2 (Medium):
  - 코드 리팩토링
  - 문서화
  - 린트 경고 수정

P3 (Low):
  - 코드 스타일 개선
  - 주석 추가
  - README 업데이트
```

## Continuous Mode (무한 루프)

```bash
#!/bin/bash
# infinite-loop.sh

while true; do
  claude --dangerously-skip-permissions \
    "Read TASKS.md and INFINITE_LOOP_MEMORY.md.
     Continue next priority task.
     Update progress in both files."

  # 성공 시 1초 대기, 실패 시 10초 대기
  if [ $? -eq 0 ]; then
    sleep 1
  else
    sleep 10
  fi
done
```

## 자가 개선 피드백 루프

```yaml
Phase 1 - 스캔:
  - 타입 에러 수집 (tsc --noEmit)
  - 린트 경고 수집 (eslint)
  - 테스트 실패 수집 (vitest)
  - 빌드 에러 수집 (next build)

Phase 2 - 분석:
  - 에러 패턴 분류
  - 우선순위 자동 지정
  - 수정 전략 수립

Phase 3 - 수정:
  - 자동 수정 가능한 것 먼저
  - 수동 수정 필요한 것 큐에 추가
  - 각 수정 후 즉시 검증

Phase 4 - 검증:
  - 수정 후 빌드 확인
  - 테스트 실행
  - 새로운 에러 없는지 확인
```

## 통계 추적

```json
{
  "totalIterations": 0,
  "cyclesCompleted": 0,
  "typeErrorsFixed": 0,
  "lintWarningsFixed": 0,
  "testsAdded": 0,
  "filesModified": 0,
  "coverageBefore": 0,
  "coverageAfter": 0,
  "buildTimeImprovement": "0%",
  "lastUpdated": "2025-12-20"
}
```

## 사용 예시

```bash
# 자가성장 루프 시작
ㄱ

# 병렬 작업 (2개)
ㄱㄱ

# 상태 확인
ㄱ?

# 긴급 수정
ㄱ!

# 배포 전 검증
ㄱ 검증
```
