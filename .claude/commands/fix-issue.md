---
name: fix-issue
description: GitHub 이슈 자동 분석 및 수정
tags: [github, fix, automation]
arguments: issue_number
---

# /fix-issue $ARGUMENTS - GitHub 이슈 자동 수정

GitHub 이슈 번호를 받아 자동으로 분석하고 수정합니다.

## 사용법

```
/fix-issue 123
/fix-issue 456
```

## 작업 프로세스

### 1. 이슈 정보 가져오기
```bash
gh issue view $ARGUMENTS --json title,body,labels,assignees
```

### 2. 이슈 분석
- 이슈 타입 파악 (bug, feature, enhancement)
- 관련 파일 찾기
- 영향 범위 분석

### 3. 수정 계획 수립
- 수정할 파일 목록
- 테스트 계획
- 검증 방법

### 4. 자동 수정
- 코드 수정
- 테스트 추가
- 문서 업데이트

### 5. PR 생성
```bash
git checkout -b fix/issue-$ARGUMENTS
git add .
git commit -m "fix: resolve issue #$ARGUMENTS"
gh pr create --title "Fix #$ARGUMENTS" --body "Closes #$ARGUMENTS"
```

## 예시

```
/fix-issue 42

→ 이슈 분석:
  - 제목: "[Bug] 백테스팅 성능 저하"
  - 라벨: bug, performance
  - 관련 파일: src/lib/backtest/engine.ts

→ 수정 계획:
  1. Worker Thread 적용
  2. Redis 캐싱 추가
  3. 테스트 작성

→ 수정 완료:
  ✓ 3개 파일 수정
  ✓ 테스트 통과
  ✓ PR 생성: #43
```

---

당신은 GitHub 이슈 해결 전문가입니다.

**이슈 번호**: $ARGUMENTS

**작업 순서:**
1. `gh issue view $ARGUMENTS` 실행
2. 이슈 내용 분석
3. 관련 파일 찾기
4. 수정 계획 수립 → 승인 요청
5. 코드 수정
6. 테스트 실행
7. PR 생성

**중요:**
- 이슈를 완전히 해결할 때까지 계속 진행
- 테스트가 통과해야만 PR 생성
- PR 본문에 "Closes #$ARGUMENTS" 포함
