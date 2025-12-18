---
name: analyze
description: 파일/폴더/기능 심층 분석
tags: [analysis, exploration]
arguments: target
---

# /analyze $ARGUMENTS - 심층 분석

파일, 폴더, 또는 기능을 심층 분석합니다.

## 사용법

```
/analyze src/lib/backtest/engine.ts    # 파일 분석
/analyze src/lib/broker/               # 폴더 분석
/analyze "AI 전략 생성"                 # 기능 분석
```

## 분석 항목

### 파일 분석
```
📁 파일: $ARGUMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 기본 정보:
- 크기: 245 lines
- 타입: TypeScript
- 최종 수정: 2025-12-17

🔗 의존성:
- Import: 12개 모듈
- Export: 5개 함수/타입
- 사용처: 8개 파일

📈 복잡도:
- 함수: 8개
- 클래스: 1개
- 사이클로매틱 복잡도: 15

⚠️ 잠재적 이슈:
- TODO: 2개
- FIXME: 1개
- any 타입: 0개

💡 개선 제안:
1. 함수 분리 권장 (runBacktest: 50줄)
2. 타입 강화 가능 (line 42)
3. 테스트 커버리지: 65%
```

### 폴더 분석
```
📁 폴더: $ARGUMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 구조:
├── engine.ts (245 lines)
├── types.ts (228 lines)
├── indicators.ts (156 lines)
└── metrics.ts (89 lines)

📈 통계:
- 총 파일: 4개
- 총 라인: 718줄
- 평균 복잡도: 12

🔗 외부 의존성:
- @/types (4회)
- @/lib/trading (2회)
- trading-signals (1회)

💡 아키텍처 분석:
- 패턴: Strategy Pattern
- 응집도: 높음
- 결합도: 낮음

⚠️ 잠재적 이슈:
- 순환 의존성: 없음
- 미사용 export: 2개
```

### 기능 분석
```
🎯 기능: $ARGUMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 관련 파일:
- src/lib/ai/strategy-generator.ts
- src/app/api/ai/strategy/route.ts
- src/components/Strategy/StrategyBuilder.tsx

🔄 데이터 플로우:
1. 사용자 입력 (자연어)
2. Claude API 호출
3. 전략 JSON 생성
4. 백테스팅 연동
5. 결과 반환

📊 성능:
- 평균 응답 시간: 3.2초
- 에러율: 0.5%
- 일일 호출: ~500회

💡 개선 제안:
1. 캐싱 적용 (동일 입력)
2. 스트리밍 응답
3. 에러 핸들링 강화
```

---

당신은 코드 분석 전문가입니다.

**분석 대상**: $ARGUMENTS

**작업 순서:**
1. 대상 유형 파악 (파일/폴더/기능)
2. 관련 파일 읽기
3. 의존성 분석
4. 복잡도 측정
5. 잠재적 이슈 발견
6. 개선 제안 제공

**분석 기준:**
- 타입 안전성
- 코드 복잡도
- 테스트 커버리지
- 성능 최적화
- HEPHAITOS 규칙 준수
