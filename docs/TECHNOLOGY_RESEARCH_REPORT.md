# 🔬 HEPHAITOS Technology Research Report

> **조사 일자**: 2025-12-15
> **목적**: Excel/Sheet 기반 Block System 설계를 위한 최신 기술 조사

---

## 📋 Executive Summary

| 항목 | 결과 |
|------|------|
| **조사 범위** | Excel-Agent v6.0, Notion, Airtable, Coda, Google Sheets |
| **핵심 발견** | Block 기반 아키텍처 + 컬럼명 수식 = 강력한 조합 |
| **권장 방향** | Notion Block Architecture + Excel-Agent FormulaEngine |
| **구현 복잡도** | Medium (2-3개월) |

---

## 1. Excel-Agent v6.0 핵심 기술

### 1.1 SmartTable - 컬럼명 기반 수식

**발견한 핵심 기술:**

```python
# Excel-Agent v6.0의 핵심: 컬럼명 기반 수식
formula_columns={
    'Total': '{Price} * {Quantity}',
    'Tax': '{Total} * 0.1',
    'Margin': '({Revenue} - {Cost}) / {Revenue} * 100'
}
```

**작동 방식:**
1. `{ColumnName}` → 실제 셀 참조로 변환 (`{Price}` → `B2`)
2. 수식 자동 복사 (모든 행에 적용)
3. 타입 안전 검증 (컬럼 존재 여부 확인)

**보안:**
- ✅ 직접적인 코드 실행 없음
- ✅ 컬럼명 화이트리스트 검증
- ✅ Excel 엔진이 계산 (안전)

### 1.2 pandas Integration

```python
table = SmartTable.from_dataframe(
    df, ws, start_row=2,
    formula_columns={'Profit': '{Revenue} - {Cost}'},
    auto_summary=True  # SUM 자동 생성
)
```

**특징:**
- pandas DataFrame 직접 통합
- 자동 요약 행 (SUM, AVG, MAX, MIN)
- 스타일 자동 적용
- 차트 자동 생성 연동

### 1.3 성능

- Small (100 rows): < 0.5초
- Medium (500 rows): < 2초
- Large (1000+ rows): < 5초

**테스트 결과:** 27/27 통과 (100%)

---

## 2. Notion Database Architecture

### 2.1 Block 기반 구조

**출처**: [Notion's Data Model](https://www.notion.com/blog/data-model-behind-notion)

```typescript
// Notion의 Block 구조
interface Block {
  id: UUID
  type: BlockType  // 'paragraph' | 'database' | 'image' | ...
  properties: Record<string, any>
  content: Block[]  // 하위 블록 (nested)
}
```

**핵심 원칙:**
1. **Everything is a Block** - 모든 것이 블록
2. **Composable** - 블록 조합으로 페이지 구성
3. **Transformable** - 블록 타입 변환 가능
4. **Nested** - 블록 안에 블록 (무한 중첩)

### 2.2 Database Storage

**PostgreSQL 기반:**
- 96 database servers (2023년 기준)
- Workspace ID로 logical sharding
- 트랜잭션 보장 (같은 workspace = 같은 DB)

### 2.3 2025년 Multi-Source Database

**API version 2025-09-03:**
- 단일 Database에 여러 Data Source 연결
- 각 Source마다 다른 스키마 가능
- `/v1/data_sources` API

**HEPHAITOS 적용 가능성:**
- ✅ Block 간 데이터 연결
- ✅ TableBlock → ChartBlock 참조
- ✅ 실시간 동기화 (Supabase Realtime)

---

## 3. Airtable vs Google Sheets vs Coda

### 3.1 비교표

**출처**: [Zapier Comparison](https://zapier.com/blog/airtable-vs-google-sheets/)

| 기능 | Google Sheets | Airtable | Coda |
|------|---------------|----------|------|
| **본질** | Spreadsheet | Database | Doc + Table |
| **Cell Limit** | 10M | 100M (HyperDB) | - |
| **Views** | 1 (Grid) | 7 (Grid, Gallery, Calendar, etc.) | 다양 |
| **Automation** | Apps Script | Native | Native |
| **난이도** | 쉬움 | 중간 | 중간 |
| **가격** | 무료 | $10-$45/user | $10-$36/user |

### 3.2 핵심 인사이트

**Google Sheets:**
- ✅ 익숙함 (학습 곡선 없음)
- ✅ 무료
- ❌ 기능 제한적

**Airtable:**
- ✅ 강력한 Database 기능
- ✅ 다양한 View (Gallery, Kanban, Timeline)
- ✅ 100M records (HyperDB)
- ❌ 복잡함

**Coda:**
- ✅ Doc + Table 통합
- ✅ 600+ 앱 연동
- ❌ Database-first가 아님

### 3.3 HEPHAITOS에 적용할 점

1. **Google Sheets의 단순함** + **Airtable의 강력함**
2. **Notion의 Block 구조** + **Excel-Agent의 FormulaEngine**
3. **트레이딩 특화** (다른 제품과 차별화)

---

## 4. HEPHAITOS Block System 설계

### 4.1 Block 타입 분류 (16개)

#### **Core Blocks (Excel-Agent 기반)**

1. **TableBlock** - 스프레드시트
   - FormulaEngine: `{ColumnName}` 문법
   - Auto-summary: SUM, AVG, MAX, MIN
   - Sorting, Filtering
   - Conditional formatting

2. **PivotBlock** - 피벗 테이블
   - Group by, Aggregate
   - Drag-and-drop configuration

3. **ChartBlock** - 차트
   - TradingView Lightweight Charts
   - Types: Candlestick, Line, Bar, Area
   - Indicators: RSI, MACD, BB, SMA, EMA

#### **Trading Blocks**

4. **BacktestBlock** - 백테스트 결과
5. **OrderBookBlock** - 실시간 호가창
6. **PositionBlock** - 포지션 현황
7. **PnLBlock** - 손익 계산

#### **Mirroring Blocks**

8. **CelebPortfolioBlock** - 셀럽 포트폴리오
9. **SyncStatusBlock** - 동기화 상태
10. **PerformanceCompareBlock** - 수익률 비교

#### **Learning Blocks**

11. **QuizBlock** - 퀴즈/문제
12. **FeedbackBlock** - AI 피드백
13. **ProgressBlock** - 학습 진행도
14. **MentorChatBlock** - 멘토 채팅

#### **Utility Blocks**

15. **TextBlock** - 메모, 설명
16. **AIInsightBlock** - AI 분석 + 면책조항

### 4.2 FormulaEngine 보안 설계

**AST 기반 안전한 파싱:**

```typescript
// lib/blocks/formula-engine.ts
class FormulaEngine {
  private static ALLOWED_OPERATORS = ['+', '-', '*', '/', '%', '(', ')']

  evaluate(formula: string, row: Record<string, any>): number {
    // 1. Tokenize: "{Price} * {Quantity}" → tokens
    const tokens = this.tokenize(formula)

    // 2. Parse to AST (안전)
    const ast = this.parse(tokens)

    // 3. Evaluate AST (허용된 연산만)
    return this.evaluateAST(ast, row)
  }

  private evaluateAST(node: ASTNode, row: Record<string, any>): number {
    switch (node.type) {
      case 'number': return node.value
      case 'column': return row[node.name]
      case 'binary':
        const left = this.evaluateAST(node.left, row)
        const right = this.evaluateAST(node.right, row)
        // 안전한 연산만 허용
        switch (node.op) {
          case '+': return left + right
          case '-': return left - right
          case '*': return left * right
          case '/': return right !== 0 ? left / right : 0
          case '%': return left % right
        }
    }
  }
}
```

**보안 장점:**
- ✅ 코드 실행 불가
- ✅ 타입 안전
- ✅ 허용된 연산자만 사용

### 4.3 Block 간 데이터 연결

```typescript
// Cross-block formula reference
{
  type: 'chart',
  config: {
    dataSource: 'block-abc123',  // TableBlock ID
    xAxis: 'Date',
    yAxis: ['Close', 'MA20']
  }
}
```

### 4.4 Real-time Updates

```typescript
// Supabase Realtime
supabase
  .channel('workspace-123')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'blocks',
    filter: `workspace_id=eq.${workspaceId}`
  }, (payload) => {
    updateBlock(payload.new)
  })
  .subscribe()
```

---

## 5. 구현 우선순위

### Phase 1: Core (Week 1-2)
- [x] Credit System
- [ ] TableBlock (FormulaEngine)
- [ ] ChartBlock
- [ ] AIInsightBlock

### Phase 2: Trading (Week 3-4)
- [ ] BacktestBlock
- [ ] PositionBlock
- [ ] PnLBlock

### Phase 3: Mirroring (Week 5-6)
- [ ] CelebPortfolioBlock
- [ ] SyncStatusBlock

### Phase 4: Learning (Week 7-8)
- [ ] QuizBlock
- [ ] ProgressBlock

---

## 6. 결론

### 6.1 핵심 발견

1. **Notion Block Architecture** - 증명된 확장성
2. **Excel-Agent FormulaEngine** - 직관적이고 안전
3. **Credit System** - 시장 검증됨 (Cursor, Replit)

### 6.2 권장 아키텍처

```
Notion Blocks (구조)
+ Excel-Agent FormulaEngine (수식)
+ TradingView Charts (차트)
+ Supabase Realtime (동기화)
+ Claude 4 (AI)
+ Credit System (과금)
= HEPHAITOS
```

### 6.3 차별화

| 항목 | 경쟁사 | HEPHAITOS |
|------|--------|-----------|
| **Block System** | Notion, Coda | ✅ 트레이딩 특화 |
| **Formula** | Excel, Airtable | ✅ `{ColumnName}` 문법 |
| **Real-time** | Google Sheets | ✅ Supabase Realtime |
| **AI** | 없음 | ✅ Claude 4 통합 |
| **Mirroring** | 없음 | ✅ 셀럽 따라하기 |

---

## Sources

- [Notion's Data Model](https://www.notion.com/blog/data-model-behind-notion)
- [Airtable vs Google Sheets](https://zapier.com/blog/airtable-vs-google-sheets/)
- [Google Sheets Alternatives 2025](https://www.anydb.com/blog/google-sheets-alternatives/)
- Excel-Agent v6.0 Source Code

---

**다음 단계: 페르소나별 Pain Point 시나리오 작성**
