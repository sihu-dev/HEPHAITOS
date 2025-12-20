---
description: Opus 4.5 기반 전체 작업 검수 실행
argument-hint: [scope] - all, recent, file:<path>, pr:<number>
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Task
  - LSP
  - mcp__github__*
disable-model-invocation: false
---

# /audit - HEPHAITOS 품질 검수 커맨드

## 개요

Claude 4.5 Opus 모델을 사용하여 HEPHAITOS 프로젝트의 코드 품질, 디자인 시스템 준수, 법률 준수, 보안 등을 종합 검수합니다.

## 사용법

```bash
/audit              # 최근 변경사항 검수
/audit all          # 전체 프로젝트 검수
/audit recent       # 마지막 커밋 이후 변경사항
/audit file:path    # 특정 파일 검수
/audit pr:123       # PR #123 검수
```

## 검수 항목

### 1. 코드 품질 (25점)
- [ ] TypeScript strict mode 준수
- [ ] any 타입 미사용
- [ ] 적절한 에러 핸들링
- [ ] 코드 복잡도 적정

### 2. 디자인 시스템 (20점)
- [ ] 하드코딩 컬러값 미사용
- [ ] Tailwind 토큰 사용
- [ ] Glass Morphism 패턴
- [ ] Dark Mode Only

### 3. 법률 준수 (20점) - CRITICAL
- [ ] 투자 조언 표현 미사용
- [ ] 면책조항 표시
- [ ] 권유형 표현 미사용

### 4. 아키텍처 (15점)
- [ ] 나노팩터 계층 구조
- [ ] Server/Client 분리
- [ ] Import 경로 규칙

### 5. 보안 (10점) - CRITICAL
- [ ] 하드코딩 비밀값 미사용
- [ ] Injection 취약점 없음

### 6. 성능 (10점)
- [ ] 불필요한 re-render 없음
- [ ] 번들 사이즈 적정

## 실행 프로세스

```
1. 대상 파일 식별
   - scope에 따라 검수 대상 결정
   - git diff, git log 활용

2. 병렬 분석 실행
   - 6개 검수 영역 동시 분석
   - 각 영역별 전문 에이전트 활용

3. 결과 집계
   - 점수 계산 (100점 만점)
   - 이슈 우선순위 정렬

4. 리포트 생성
   - 종합 점수
   - 세부 평가
   - 발견된 이슈
   - 권장 조치
```

## 점수 기준

| 등급 | 점수 | 상태 |
|------|------|------|
| A+ | 95-100 | 배포 가능 |
| A | 90-94 | 마이너 수정 후 배포 |
| B | 80-89 | 수정 권장 |
| C | 70-79 | 수정 필요 |
| D | 60-69 | 주요 수정 필요 |
| F | 0-59 | 배포 불가 |

## 참조

- CLAUDE.md 프로젝트 가이드
- BUSINESS_CONSTITUTION.md 사업 헌법
- DESIGN_SYSTEM.md 디자인 시스템
- .claude/rules/trading-rules.md 트레이딩 규칙
