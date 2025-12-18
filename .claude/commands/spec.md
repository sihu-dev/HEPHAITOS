---
name: spec
description: Spec-Driven Development - 기능 명세 작성 및 단계별 구현
tags: [planning, spec, workflow]
---

# /spec - Spec-Driven Development

커뮤니티 베스트 프랙티스: "12단계 스펙을 2시간에 작성하면 Claude가 6-10시간 절약"

## 사용법

```
/spec [기능명]                    # 새 스펙 작성
/spec implement [기능명]          # 스펙 기반 구현
/spec review [기능명]             # 스펙 리뷰
```

## Spec 문서 구조

```markdown
# Feature: [기능명]

## 1. 목표 (Goal)
- 무엇을 만들 것인가?
- 왜 필요한가?
- 성공 기준은?

## 2. 사용자 스토리 (User Stories)
- As a [역할], I want to [행동], so that [목적]

## 3. 데이터베이스 스키마 (Database Schema)
- 새 테이블 or 기존 테이블 수정
- 관계 (Foreign Keys)
- 인덱스

## 4. API 엔드포인트 (API Endpoints)
- GET /api/...
- POST /api/...
- 요청/응답 포맷

## 5. 프론트엔드 컴포넌트 (Frontend Components)
- 페이지 구조
- 컴포넌트 목록
- 상태 관리

## 6. 백엔드 로직 (Backend Logic)
- 비즈니스 로직
- 유효성 검사
- 에러 핸들링

## 7. 타입 정의 (Type Definitions)
- TypeScript 인터페이스
- Zod 스키마

## 8. 테스트 시나리오 (Test Scenarios)
- 단위 테스트
- 통합 테스트
- E2E 테스트

## 9. 법률 준수 (Legal Compliance)
- 면책조항 필요 여부
- 투자 조언 표현 검사

## 10. 보안 고려사항 (Security)
- 인증/인가
- Rate limiting
- Input validation

## 11. 성능 최적화 (Performance)
- 캐싱 전략
- 쿼리 최적화
- Lazy loading

## 12. 구현 단계 (Implementation Steps)
- Step 1: ...
- Step 2: ...
- Step 3: ...
```

## 예시

```
/spec 셀럽 포트폴리오 미러링

→ specs/celebrity-mirroring.md 생성
→ 12단계 스펙 작성
→ 검토 후 승인

/spec implement 셀럽 포트폴리오 미러링

→ Step 1: DB 스키마 생성
   ✓ celebrity_portfolios 테이블 생성

→ Step 2: API 엔드포인트 구현
   ✓ GET /api/celebrities
   ✓ POST /api/celebrities/mirror

→ Step 3: 프론트엔드 컴포넌트
   ✓ CelebrityCard.tsx
   ✓ MirroringModal.tsx

→ Step 4: 테스트 작성
   ✓ celebrity.test.ts (8개 테스트)

→ Step 5: 문서화
   ✓ README 업데이트
```

## 장점

✅ **명확한 범위**: 구현할 것과 하지 않을 것이 명확
✅ **단계별 진행**: 작은 단위로 나눠서 검증
✅ **타입 안전성**: 타입 먼저 정의 → 구현
✅ **테스트 가능**: 테스트 시나리오 미리 작성
✅ **협업 용이**: 팀원과 스펙 공유 및 리뷰

## 파일 구조

```
specs/
├── celebrity-mirroring.md
├── ai-strategy-generator.md
├── backtest-optimization.md
└── ...
```

---

당신은 Spec-Driven Development 전문가입니다.

**Spec 작성 시:**
1. 관련 파일 먼저 읽기 (기존 구조 파악)
2. 유사 기능 참고 (일관성 유지)
3. 12단계 모두 작성
4. 검토 요청

**Spec 구현 시:**
1. Spec 문서 읽기
2. Step by Step 진행
3. 각 단계마다 테스트
4. 완료 후 다음 단계

**주의사항:**
- 스펙 작성 시간 > 구현 시간 (정상!)
- 스펙이 명확할수록 구현 빠름
- 법률 준수 항상 체크
