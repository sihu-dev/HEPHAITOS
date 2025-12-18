---
name: implement
description: 기능/컴포넌트/API 구현
tags: [implementation, development]
arguments: feature_name
---

# /implement $ARGUMENTS - 기능 구현

기능, 컴포넌트, 또는 API를 구현합니다.

## 사용법

```
/implement "셀럽 포트폴리오 미러링"
/implement "실시간 가격 알림"
/implement "AI 멘토 코칭"
```

## 작업 프로세스

### 1. 요구사항 분석
```
🎯 구현 대상: $ARGUMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 요구사항 분석:
- 핵심 기능: ...
- 사용자 스토리: ...
- 의존성: ...
```

### 2. 기존 코드 분석
- 유사 기능 찾기
- 사용 가능한 유틸리티
- 타입 정의 확인

### 3. 설계
```
📐 구현 설계:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗂️ 파일 구조:
├── src/lib/$ARGUMENTS/
│   ├── index.ts
│   ├── types.ts
│   └── utils.ts
├── src/app/api/$ARGUMENTS/route.ts
└── src/components/$ARGUMENTS/

📊 데이터 모델:
- interface ...
- type ...

🔗 API 설계:
- GET /api/...
- POST /api/...
```

### 4. 구현 (단계별)
```
📦 구현 진행:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1: 타입 정의 ✓
Step 2: 핵심 로직 ✓
Step 3: API 라우트 ✓
Step 4: 컴포넌트 ✓
Step 5: 테스트 작성 ⏳
Step 6: 문서화 ⏳
```

### 5. 검증
```bash
# 타입 체크
npx tsc --noEmit

# 테스트 실행
npm test -- --filter=$ARGUMENTS

# 빌드 확인
npm run build
```

### 6. 법률 준수 체크
```
✅ 법률 준수 체크:
- 면책조항: 포함됨
- 금지 표현: 없음
- 투자 조언: 없음
```

## 예시

```
/implement "AI 멘토 코칭"

→ 요구사항 분석 완료
→ 설계 승인 대기...

[승인]

→ Step 1: 타입 정의
  ✓ src/lib/coaching/types.ts 생성

→ Step 2: 핵심 로직
  ✓ src/lib/coaching/index.ts 생성
  ✓ Claude API 연동

→ Step 3: API 라우트
  ✓ src/app/api/coaching/route.ts 생성

→ Step 4: 컴포넌트
  ✓ src/components/Coaching/CoachingChat.tsx
  ✓ src/components/Coaching/CoachingMessage.tsx

→ Step 5: 테스트
  ✓ src/__tests__/lib/coaching.test.ts (8 tests)

→ Step 6: 문서화
  ✓ README 업데이트

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 구현 완료!
- 생성 파일: 6개
- 테스트: 8/8 passed
- 빌드: SUCCESS
```

---

당신은 HEPHAITOS 기능 구현 전문가입니다.

**구현 대상**: $ARGUMENTS

**작업 순서:**
1. 요구사항 분석 → 확인 요청
2. 기존 코드 분석
3. 설계 → 승인 요청
4. 단계별 구현
5. 테스트 작성
6. 법률 준수 체크
7. 문서화

**필수 규칙:**
- TypeScript strict mode
- any 타입 금지
- 면책조항 필수 (투자 관련)
- 테스트 커버리지 80% 이상
