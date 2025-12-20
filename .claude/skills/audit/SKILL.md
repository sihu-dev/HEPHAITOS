---
name: audit
description: Claude 4.5 Opus 기반 프로젝트 전체 검수 스킬
model: opus
triggers:
  - 검수
  - 리뷰
  - audit
  - 검토
  - 품질 확인
  - 배포 전 확인
---

# Audit Skill - HEPHAITOS 품질 검수

## 목적

이 스킬은 Claude 4.5 Opus의 최고 수준 분석 능력을 활용하여 HEPHAITOS 프로젝트의 모든 측면을 심층 검수합니다.

## 검수 워크플로우

```
┌──────────────────────────────────────────────────────────────────┐
│                     AUDIT WORKFLOW                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐       │
│  │  SCAN   │ → │ ANALYZE │ → │  SCORE  │ → │ REPORT  │       │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘       │
│       │              │              │              │             │
│       ▼              ▼              ▼              ▼             │
│  변경 파일       6가지 관점      100점 만점     상세 리포트      │
│  식별           심층 분석       점수 계산      + 권장 조치       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 검수 항목 상세

### 1. 코드 품질 검수

```typescript
// 검수 항목
interface CodeQualityCheck {
  strictMode: boolean          // TypeScript strict mode
  noAnyType: boolean           // any 타입 미사용
  properErrorHandling: boolean // 에러 핸들링
  lowComplexity: boolean       // 코드 복잡도
  goodReadability: boolean     // 가독성
}

// 검사 명령어
// npx tsc --noEmit --strict
// npx eslint --ext .ts,.tsx src/
```

### 2. 디자인 시스템 검수

```css
/* 금지 패턴 */
color: #FF0000;              /* 하드코딩 금지 */
background-color: red;       /* 하드코딩 금지 */
style={{ color: 'blue' }}    /* 인라인 스타일 금지 */

/* 허용 패턴 */
className="text-primary"     /* Tailwind 토큰 */
className="bg-[#5E6AD2]"     /* Primary 컬러만 */
```

### 3. 법률 준수 검수

```typescript
// 금지 표현 패턴
const FORBIDDEN_PATTERNS = [
  /수익\s*보장/,
  /확실한\s*수익/,
  /~하세요/,
  /투자\s*권유/,
  /추천\s*종목/,
]

// 필수 표현 패턴
const REQUIRED_PATTERNS = [
  /면책조항/,
  /투자\s*조언이\s*아닙니다/,
  /본인\s*책임/,
]
```

### 4. 아키텍처 검수

```
나노팩터 계층 검증:
L0 (Atoms)     → packages/types/src/     # 기본 타입
L1 (Molecules) → packages/utils/src/     # 유틸리티
L2 (Cells)     → packages/core/src/      # 비즈니스 로직
L3 (Tissues)   → src/agents/             # 자율 에이전트

의존성 규칙:
- L0는 외부 의존성 없음
- L1은 L0만 의존
- L2는 L0, L1만 의존
- L3는 L0, L1, L2 의존 가능
```

### 5. 보안 검수

```typescript
// 검사 패턴
const SECURITY_PATTERNS = [
  /process\.env\.\w+/,        // 환경변수 직접 노출
  /apiKey\s*[:=]\s*['"`]/,    // 하드코딩 API 키
  /password\s*[:=]\s*['"`]/,  // 하드코딩 비밀번호
  /eval\s*\(/,                // eval 사용
  /innerHTML/,                // XSS 취약점
]
```

### 6. 성능 검수

```typescript
// 검사 항목
interface PerformanceCheck {
  noUnnecessaryRerenders: boolean  // 불필요한 re-render
  optimizedImages: boolean         // 이미지 최적화
  lazyLoading: boolean            // Lazy loading
  bundleSize: 'small' | 'medium' | 'large'
}
```

## 실행 방법

### 방법 1: 커맨드 사용
```bash
/audit              # 최근 변경사항 검수
/audit all          # 전체 프로젝트 검수
/audit file:src/... # 특정 파일 검수
```

### 방법 2: 자연어 트리거
```
"지금까지 한 작업 검수해줘"
"이 코드 괜찮아?"
"배포해도 될까?"
"디자인 시스템 잘 지켰어?"
```

### 방법 3: PR 검수
```bash
/audit pr:123       # PR #123 검수
```

## 리포트 형식

```markdown
# OPUS AUDIT REPORT
## 검수 일시: YYYY-MM-DD HH:MM:SS
## 검수 대상: [파일 목록 또는 PR 번호]

---

## 종합 점수: XX/100 (등급: A+/A/B/C/D/F)

### 세부 평가

| 항목 | 점수 | 가중치 | 상태 |
|------|------|--------|------|
| 코드 품질 | XX/25 | 25% | ✓/✗ |
| 디자인 시스템 | XX/20 | 20% | ✓/✗ |
| 법률 준수 | XX/20 | 20% | ✓/✗ |
| 아키텍처 | XX/15 | 15% | ✓/✗ |
| 보안 | XX/10 | 10% | ✓/✗ |
| 성능 | XX/10 | 10% | ✓/✗ |

### 발견된 이슈

#### Critical (즉시 수정 필요)
- [ ] 이슈 설명 (파일:라인)

#### High (배포 전 수정 필요)
- [ ] 이슈 설명 (파일:라인)

#### Medium (수정 권장)
- [ ] 이슈 설명 (파일:라인)

#### Low (개선 가능)
- [ ] 이슈 설명 (파일:라인)

### 권장 조치

1. [수정 방법 1]
2. [수정 방법 2]

### 자동 수정 가능 항목

```diff
- 수정 전 코드
+ 수정 후 코드
```

---

*이 리포트는 Claude 4.5 Opus에 의해 생성되었습니다.*
```

## 참조 문서

| 문서 | 용도 |
|------|------|
| CLAUDE.md | 프로젝트 가이드 |
| BUSINESS_CONSTITUTION.md | 사업 헌법 |
| DESIGN_SYSTEM.md | 디자인 시스템 |
| .claude/rules/trading-rules.md | 트레이딩 규칙 |
