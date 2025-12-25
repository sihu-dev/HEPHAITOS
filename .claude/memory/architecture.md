# HEPHAITOS Architecture Reference

## 나노팩터 아키텍처 (Nano-Factor Hierarchy)

```
L0 (Atoms)     → packages/types/src/     # 기본 타입 정의
L1 (Molecules) → packages/utils/src/     # 유틸리티 함수
L2 (Cells)     → packages/core/src/      # 비즈니스 로직
L3 (Tissues)   → src/agents/             # 자율 에이전트
```

## 패키지 구조

| 패키지 | 네임스페이스 | 역할 |
|--------|-------------|------|
| packages/types | @hephaitos/types | L0 타입 정의 (9개 파일) |
| packages/utils | @hephaitos/utils | L1 유틸리티 (14개 파일) |
| packages/core | @hephaitos/core | L2 서비스/리포지토리 (16개 파일) |
| src/agents | - | L3 자율 에이전트 (3개 파일) |

## 핵심 타입 시스템 (L0)

### strategy.ts
- StrategyType (7종), Timeframe (9종)
- IndicatorType (9종)
- IStrategy 인터페이스

### backtest.ts
- IBacktestConfig, IPerformanceMetrics (22개 지표)

### order.ts
- ExecutionMode, IRiskConfig, IOrderRequest

### exchange.ts
- ExchangeType (5종), EXCHANGE_CONFIGS

## 에이전트 시스템 (L3)

| 에이전트 | 역할 | 라인 수 |
|---------|------|--------|
| BacktestAgent | 백테스트 시뮬레이션, 22개 성과 지표 | 645 |
| OrderExecutorAgent | 주문 실행, 리스크 관리 | 633 |
| PortfolioSyncAgent | 멀티 거래소 포트폴리오 동기화 | 324 |

## 디렉토리 구조

```
HEPHAITOS/
├── .claude/              # Claude Code 설정
├── packages/             # 모노레포 (나노팩터)
├── docs/                 # 분석 리포트
├── src/
│   ├── app/              # Next.js App Router
│   ├── agents/           # L3 자율 에이전트
│   ├── components/       # UI 컴포넌트
│   ├── lib/              # 핵심 라이브러리
│   └── types/            # 타입 정의
├── BUSINESS_CONSTITUTION.md
├── DESIGN_SYSTEM.md
└── CLAUDE.md
```
