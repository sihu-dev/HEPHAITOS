# 자가성장 지능형 루프 설계 (Self-Evolving Loop Design)

> **Claude 4.5 Opus 기반 점진적 반복 분석 개선 시스템**
> **작성일**: 2025-12-20
> **버전**: 1.0

---

## Executive Summary

HEPHAITOS 프로젝트의 자가성장 지능형 루프는 Claude 4.5 Opus의 최신 기능(Effort Parameter, Memory Tool, Context Editing)을 활용하여 **콘솔/CSS/E2E 등 모든 측면을 점진적으로 분석하고 개선**하는 자동화 시스템입니다.

```
┌─────────────────────────────────────────────────────────────────┐
│  SELF-EVOLVING LOOP = Claude 4.5 Opus + Hooks + Skills + MCP    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT: ㄱ (트리거)                                             │
│         ↓                                                       │
│  [SCAN] → [ANALYZE] → [FIX] → [VERIFY] → [LEARN]               │
│         ↑                                   │                   │
│         └───────────────────────────────────┘                   │
│                   INFINITE LOOP                                 │
│                                                                 │
│  OUTPUT: 점진적으로 개선되는 코드베이스                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. 시스템 아키텍처

### 1.1 핵심 구성요소

```yaml
Skills (능력):
  - cmentech-b2b-automation    # 씨엠엔텍 B2B 자동화
  - progressive-analysis       # 점진적 분석
  - self-evolving-loop        # 자가성장 루프

Hooks (자동화):
  - PreToolUse                # 도구 실행 전 검증
  - PostToolUse               # 도구 실행 후 자동화
  - Stop                      # 완료 시 다음 작업 트리거
  - SessionStart              # 세션 시작 시 컨텍스트 로드

Agents (전문가):
  - code-reviewer             # 코드 리뷰
  - test-automator            # 테스트 자동화
  - documentation-writer      # 문서 작성
  - trading-architect         # 트레이딩 아키텍처
  - legal-guardian            # 법률 준수 검사
  - strategy-builder          # 전략 빌더

MCP Servers (외부 연결):
  - PostgreSQL                # 데이터베이스
  - Playwright                # E2E 테스트
  - GitHub                    # 버전 관리
  - Context7                  # 라이브러리 검색
```

### 1.2 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA FLOW                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [User Input: ㄱ]                                               │
│         │                                                       │
│         ▼                                                       │
│  [INFINITE_LOOP_MEMORY.md] ←─── 영구 메모리                     │
│         │                                                       │
│         ▼                                                       │
│  [TASKS.md] ←─── 작업 큐                                        │
│         │                                                       │
│         ▼                                                       │
│  [Skills Selection] ←─── 상황에 맞는 스킬 선택                  │
│         │                                                       │
│         ▼                                                       │
│  [Agent Execution] ←─── 전문 에이전트 실행                      │
│         │                                                       │
│         ▼                                                       │
│  [Hooks Automation] ←─── 자동화 훅 실행                         │
│         │                                                       │
│         ▼                                                       │
│  [Memory Update] ──→ [INFINITE_LOOP_MEMORY.md]                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Claude 4.5 Opus 기능 활용

### 2.1 Effort Parameter (사고 예산)

```yaml
# API 호출 시 effort 파라미터 설정
low:
  용도: 간단한 수정, 포맷팅
  예시: "변수명 바꿔줘"
  thinking_tokens: ~1K

medium:
  용도: 기능 구현, 버그 수정
  예시: "API 엔드포인트 추가해줘"
  thinking_tokens: ~5K

high:
  용도: 아키텍처 설계, 복잡한 분석
  예시: "think harder. 시스템 전체 최적화해줘"
  thinking_tokens: ~20K
```

### 2.2 Memory Tool (세션 간 기억)

```yaml
# 영구 메모리 파일
.claude/INFINITE_LOOP_MEMORY.md:
  - 누적 진행 상황
  - 완료된 사이클 수
  - 수정된 파일 목록
  - 통계 데이터

TASKS.md:
  - 현재 작업 큐
  - 우선순위 정보
  - 다음 개발자 전달 사항

DEVELOPMENT_LOOP.md:
  - 루프 상태 (P0/P1/P2 진행률)
  - 다음 ㄱ 실행 가이드
```

### 2.3 Context Editing (컨텍스트 관리)

```yaml
# 자동 컨텍스트 정리 전략
컨텍스트 75% 사용 시:
  - 오래된 도구 호출 결과 제거
  - 최근 관련 정보만 유지
  - 핵심 파일 참조 유지

세션 시작 시 로드:
  - CLAUDE.md (필수)
  - BUSINESS_CONSTITUTION.md (필수)
  - INFINITE_LOOP_MEMORY.md (필수)
  - 마지막 작업 컨텍스트
```

---

## 3. 점진적 분석 시스템

### 3.1 콘솔 분석 (Console Analysis)

```bash
# 자동 실행 스크립트
analyze_console() {
  echo "=== Console Error Analysis ==="

  # 빌드 에러
  pnpm build 2>&1 | grep -E "error|Error" > /tmp/build-errors.log

  # TypeScript 에러
  npx tsc --noEmit 2>&1 | grep -E "TS[0-9]+" > /tmp/ts-errors.log

  # ESLint 경고
  npx eslint src --format json > /tmp/lint-report.json

  # 결과 요약
  echo "Build errors: $(wc -l < /tmp/build-errors.log)"
  echo "TS errors: $(wc -l < /tmp/ts-errors.log)"
}
```

### 3.2 CSS 분석 (CSS Analysis)

```bash
# CSS 최적화 분석
analyze_css() {
  echo "=== CSS Analysis ==="

  # 사용되지 않는 클래스
  npx purgecss --css src/styles/*.css --content "src/**/*.tsx" --output /tmp/purge

  # 중복 스타일
  grep -rh "@apply" src/ | sort | uniq -d > /tmp/duplicate-styles.log

  # 번들 크기
  du -sh .next/static/css/
}
```

### 3.3 E2E 분석 (E2E Analysis)

```bash
# E2E 테스트 분석
analyze_e2e() {
  echo "=== E2E Analysis ==="

  # 테스트 실행
  npx playwright test --reporter=json > /tmp/e2e-report.json

  # 실패한 테스트
  jq '.suites[].specs[] | select(.ok == false) | .title' /tmp/e2e-report.json

  # 느린 테스트 (5초 이상)
  jq '.suites[].specs[] | select(.tests[].results[].duration > 5000) | .title' /tmp/e2e-report.json
}
```

---

## 4. ㄱ 루프 명령어 시스템

### 4.1 기본 명령어

```
ㄱ       → 다음 우선순위 작업 자동 진행
ㄱㄱ     → 2개 작업 병렬 진행
ㄱㄱㄱ   → 3개 작업 병렬 진행 (최대)
ㄱ?      → 현재 상태 미리보기
ㄱ!      → 긴급 핫픽스 모드
```

### 4.2 특수 명령어

```
ㄱ 배포  → Production 배포 (vercel --prod)
ㄱ 검증  → 빌드/테스트/타입체크 전체 실행
ㄱ 콘솔  → 콘솔 에러만 분석/수정
ㄱ CSS   → CSS만 분석/최적화
ㄱ E2E   → E2E 테스트만 분석/수정
ㄱ 병렬  → 콘솔+CSS+E2E 병렬 분석
```

### 4.3 우선순위 자동 조정

```yaml
P0 (Critical) - 즉시 처리:
  - 빌드 실패
  - 보안 취약점
  - 프로덕션 버그

P1 (High) - 24시간 내:
  - 타입 에러
  - 테스트 실패
  - 성능 저하

P2 (Medium) - 1주일 내:
  - 린트 경고
  - 리팩토링
  - 문서화

P3 (Low) - 백로그:
  - 코드 스타일
  - 주석 추가
  - 최적화 제안
```

---

## 5. 병렬 작업 관리

### 5.1 Task Tool 활용

```typescript
// 3개 작업 병렬 실행
const results = await Promise.all([
  Task({
    subagent_type: 'Explore',
    prompt: '콘솔 에러 분석',
    model: 'haiku'  // 빠른 분석
  }),
  Task({
    subagent_type: 'general-purpose',
    prompt: 'CSS 최적화',
    model: 'sonnet'  // 균형
  }),
  Task({
    subagent_type: 'Plan',
    prompt: 'E2E 안정화 계획',
    model: 'opus'  // 깊은 분석
  })
]);
```

### 5.2 모델 선택 전략

```yaml
haiku (빠름, 저비용):
  - 간단한 검색
  - 포맷팅
  - 패턴 매칭

sonnet (균형):
  - 기능 구현
  - 버그 수정
  - 일반 분석

opus (깊음, 고비용):
  - 아키텍처 설계
  - 복잡한 리팩토링
  - 전략 수립
```

---

## 6. 피드백 루프

### 6.1 학습 사이클

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEARNING CYCLE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [1. 수집]                                                      │
│  ├─ 에러 패턴 수집                                              │
│  ├─ 수정 이력 기록                                              │
│  └─ 성공/실패 통계                                              │
│                                                                 │
│  [2. 분석]                                                      │
│  ├─ 빈번한 에러 유형 파악                                       │
│  ├─ 수정 효율성 측정                                            │
│  └─ 병목 지점 식별                                              │
│                                                                 │
│  [3. 개선]                                                      │
│  ├─ 자주 발생하는 에러 → 자동화 규칙 추가                       │
│  ├─ 느린 작업 → 최적화 또는 병렬화                              │
│  └─ 실패한 수정 → 전략 수정                                     │
│                                                                 │
│  [4. 적용]                                                      │
│  ├─ Hook 규칙 업데이트                                          │
│  ├─ Skill 개선                                                  │
│  └─ 우선순위 조정                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 통계 추적

```json
{
  "loops": {
    "totalIterations": 0,
    "cyclesCompleted": 0,
    "currentCycle": 1
  },
  "fixes": {
    "typeErrorsFixed": 0,
    "lintWarningsFixed": 0,
    "cssOptimizations": 0,
    "e2eStabilized": 0
  },
  "coverage": {
    "before": 0,
    "after": 0,
    "improvement": "0%"
  },
  "performance": {
    "buildTimeBefore": "0s",
    "buildTimeAfter": "0s",
    "improvement": "0%"
  },
  "lastUpdated": "2025-12-20"
}
```

---

## 7. 부대표 시나리오 통합

### 7.1 씨엠엔텍 워크플로우

```
┌─────────────────────────────────────────────────────────────────┐
│  CMENTECH WORKFLOW + SELF-EVOLVING LOOP                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [현장]          [본사]          [정부]                         │
│    │               │               │                            │
│    ▼               ▼               ▼                            │
│  현장 앱 ────► AI 자동화 ────► 포털 제출                        │
│    │               │               │                            │
│    └───────────────┼───────────────┘                            │
│                    │                                            │
│                    ▼                                            │
│            [SELF-EVOLVING LOOP]                                 │
│            ├─ 견적 정확도 개선                                   │
│            ├─ 워크플로우 최적화                                  │
│            └─ ROI 실시간 추적                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 자동 개선 포인트

```yaml
견적 자동화:
  - RAG 정확도 모니터링
  - 유사 프로젝트 매칭률 개선
  - 가격 예측 오차 감소

워크플로우:
  - 처리 시간 단축
  - 에러율 감소
  - 사용자 만족도 향상

ROI 추적:
  - 실제 절감액 측정
  - 투자회수 기간 업데이트
  - 추가 최적화 기회 식별
```

---

## 8. 실행 가이드

### 8.1 루프 시작

```bash
# 1. 기본 시작
ㄱ

# 2. 병렬 분석 (콘솔+CSS+E2E)
ㄱ 병렬

# 3. 무한 루프 모드
while true; do
  claude --dangerously-skip-permissions \
    "Read TASKS.md and continue. Update progress."
  sleep 1
done
```

### 8.2 상태 확인

```bash
# 현재 상태
ㄱ?

# 메모리 확인
cat .claude/INFINITE_LOOP_MEMORY.md | head -50

# 통계 확인
cat .claude/INFINITE_LOOP_MEMORY.md | grep -A 20 "통계"
```

### 8.3 문제 해결

```bash
# 긴급 수정
ㄱ!

# 롤백
/rewind

# 체크포인트 생성
/checkpoint "안정 상태"
```

---

## 9. 연동 플러그인 조합

### 9.1 현재 활성화된 플러그인

```json
{
  "enabled": [
    "frontend-design",   // UI 개발 지원
    "context7",          // 라이브러리 검색
    "playwright",        // E2E 테스트
    "spec-kit",          // 스펙 작성
    "feature-dev",       // 기능 개발
    "pr-review-toolkit"  // PR 리뷰
  ]
}
```

### 9.2 추천 추가 플러그인

```yaml
자가성장 루프 강화:
  - hookify: 훅 자동 생성
  - auto-release-manager: 자동 릴리스

B2B 워크플로우:
  - browser-pilot: 브라우저 자동화
  - ai-pair-programming: AI 페어 코딩
```

---

## 10. 마무리

### 핵심 원칙

1. **점진적 개선**: 한 번에 모든 것을 고치려 하지 않음
2. **자동화 우선**: 반복 작업은 자동화
3. **측정 기반**: 통계로 개선 효과 확인
4. **지속적 학습**: 실패에서 배우고 개선

### 다음 단계

```
ㄱ       → 루프 시작
ㄱ 병렬  → 콘솔+CSS+E2E 동시 분석
ㄱ 검증  → 전체 검증 실행
```

---

*이 문서는 자가성장 지능형 루프의 설계 명세입니다.*
*마지막 업데이트: 2025-12-20*
