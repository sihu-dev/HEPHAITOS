# Migration Skill

> 대규모 코드 마이그레이션을 위한 자동화 스킬

## 트리거 조건
- "마이그레이션", "병합", "migrate", "merge" 키워드 사용 시
- forge-labs에서 코드 가져오기 요청 시
- packages/ 구조 생성 요청 시

## 핵심 원칙

### 1. 나노팩터 계층 구조
```
L0 (Atoms)     → packages/types/src/hephaitos/
L1 (Molecules) → packages/utils/src/
L2 (Cells)     → packages/core/src/
L3 (Tissues)   → src/agents/
```

### 2. 마이그레이션 순서
1. 타입 시스템 먼저 (L0)
2. 유틸리티 함수 (L1)
3. 코어 서비스/리포지토리 (L2)
4. 에이전트 (L3)

### 3. 충돌 해결 전략
- 기존 HEPHAITOS 코드 우선
- forge-labs의 정교한 타입 시스템 채택
- import 경로는 @ioblock/* 별칭 사용

## 파일 매핑

### forge-labs → HEPHAITOS
```
forge-labs/packages/types/src/hephaitos/  →  packages/types/src/
forge-labs/packages/utils/src/            →  packages/utils/src/
forge-labs/packages/core/src/             →  packages/core/src/
forge-labs/apps/hephaitos/src/agents/     →  src/agents/
```

## 검증 체크리스트
- [ ] TypeScript 컴파일 성공
- [ ] 기존 import 경로 수정 완료
- [ ] 테스트 통과
- [ ] 빌드 성공
