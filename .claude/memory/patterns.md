# HEPHAITOS Code Patterns

## UnifiedBroker Pattern

```typescript
interface UnifiedBroker {
  connect(credentials): Promise<ConnectionResult>
  getBalance(): Promise<Balance>
  getHoldings(): Promise<Holding[]>
  buy(stockCode, quantity, price?): Promise<OrderResult>
  sell(stockCode, quantity, price?): Promise<OrderResult>
  subscribePrice(stockCode, callback): void
}
```

## AI 전략 생성 Pattern

```typescript
const strategy = await generateStrategy({
  model: 'claude-4',
  prompt: user.naturalLanguageInput,
  context: {
    riskProfile: user.riskProfile,
    targetReturn: user.targetReturn,
  }
})
```

## 디자인 패턴

### Glass Morphism
```css
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.06);
```

### 컬러 토큰
```tsx
// ❌ 하드코딩
<div className="bg-[#5E6AD2]" />

// ✅ 토큰 사용
<div className="bg-primary" />
```

## 커밋 메시지

```
feat(copy): 셀럽 포트폴리오 미러링 기능
feat(learn): AI 멘토 코칭 시스템
feat(build): 자연어 전략 빌더
fix(trading): 주문 실행 오류 수정
docs: 사업 헌법 업데이트
```

## Error Handling

```typescript
try {
  await riskyOperation()
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error'
  safeLogger.error('[Component] Error:', { message })
  // 사용자에게 친화적인 메시지 표시
}
```
