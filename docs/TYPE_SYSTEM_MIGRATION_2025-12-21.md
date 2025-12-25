# Type System Migration Plan
**Date**: 2025-12-21
**Priority**: P0 (Phase 5 - System Integration)
**Estimated Time**: 1.5 hours

---

## Executive Summary

**Goal**: Consolidate all types from `src/types/` → `packages/types/` (`@hephaitos/types`)

**Current State**:
- ✅ `packages/types/` exists with 10 organized type files (Nano-Factor L0)
- ❌ `src/types/` still exists with 2 files (407 + 59 = 466 lines)
- ❌ **41 imports** using `from '@/types'` (legacy)
- ✅ **5 imports** using `from '@hephaitos/types'` (correct)

**Problem**: Type duplication and fragmentation

**Solution**: Migrate all types to `@hephaitos/types`, update imports, delete `src/types/`

---

## Type Comparison Analysis

### Types in src/types/index.ts (407 lines)

| Category | Types | Status |
|----------|-------|--------|
| **Utility Types** | RequiredProps, OptionalProps, DeepPartial, Brand | ❌ NOT in @hephaitos/types |
| **User & Auth** | User | ❌ NOT in @hephaitos/types |
| **Strategy** | Strategy, StrategyStatus, StrategyConfig, etc. | ✅ DUPLICATE (in packages/types/src/hephaitos/strategy.ts) |
| **Trade** | Trade, TradeType, TradeStatus | ✅ DUPLICATE (in packages/types/src/hephaitos/trade.ts) |
| **Portfolio** | Portfolio, Position | ✅ DUPLICATE (in packages/types/src/hephaitos/portfolio.ts) |
| **Backtest** | BacktestConfig, BacktestResult, EquityPoint | ✅ DUPLICATE (in packages/types/src/hephaitos/backtest.ts) |
| **Market Data** | MarketData, OHLCV | ⚠️ PARTIAL (OHLCV exists, MarketData doesn't) |
| **Node Builder** | NodeType, StrategyNode, StrategyEdge, StrategyGraph | ❌ NOT in @hephaitos/types |
| **API Response** | ApiResponse, ApiError, PaginatedResponse | ❌ NOT in @hephaitos/types |
| **Exchange** | ExchangeId, ExchangeConnection, ExchangePermission | ⚠️ PARTIAL (ExchangeType exists, but different) |
| **Notification** | NotificationType, Notification | ❌ NOT in @hephaitos/types |
| **Form Inputs** | CreateStrategyInput, UpdateStrategyInput, CreateTradeInput | ❌ NOT in @hephaitos/types |
| **WebSocket** | WebSocketEventType, WebSocketMessage, TickerData, etc. | ❌ NOT in @hephaitos/types |
| **Component Props** | BaseComponentProps, LoadingProps, ErrorProps, PaginationProps | ❌ NOT in @hephaitos/types |
| **Store State** | AsyncState, StrategyStoreState, PortfolioStoreState | ❌ NOT in @hephaitos/types |

### Types in src/types/queue.ts (59 lines)

| Type | Status |
|------|--------|
| BacktestParams, BacktestJob, BacktestResult, etc. | ❌ NOT in @hephaitos/types |

---

## Migration Strategy

### Phase 1: Add Missing Types to @hephaitos/types (30 min)

Create new files in `packages/types/src/hephaitos/`:

**1. `ui.ts`** (100 lines) - UI/Component types
```typescript
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingProps {
  isLoading: boolean
  loadingText?: string
}

export interface ErrorProps {
  error: Error | null
  onRetry?: () => void
}

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}
```

**2. `api.ts`** (80 lines) - API Response types
```typescript
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

**3. `websocket.ts`** (120 lines) - WebSocket types
```typescript
export type WebSocketEventType =
  | 'ticker'
  | 'orderbook'
  | 'trade'
  | 'kline'
  | 'depth'

export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType
  symbol: string
  data: T
  timestamp: number
}

export interface TickerData { /* ... */ }
export interface OrderBookData { /* ... */ }
export interface KlineData { /* ... */ }
```

**4. `user.ts`** (60 lines) - User & Auth types
```typescript
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  plan: 'free' | 'pro' | 'enterprise'
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  data?: Record<string, unknown>
  createdAt: Date
}

export type NotificationType = 'signal' | 'trade' | 'alert' | 'system'
```

**5. `util.ts`** (80 lines) - Utility types
```typescript
/** Make selected properties required */
export type RequiredProps<T, K extends keyof T> = T & Required<Pick<T, K>>

/** Make selected properties optional */
export type OptionalProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/** Deep partial - makes all nested properties optional */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/** Brand type for nominal typing */
export type Brand<K, T> = K & { __brand: T }

/** Branded ID types for type safety */
export type UserId = Brand<string, 'UserId'>
export type StrategyId = Brand<string, 'StrategyId'>
export type TradeId = Brand<string, 'TradeId'>
export type PositionId = Brand<string, 'PositionId'>

/** Generic async state */
export interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}
```

**6. `queue.ts`** (60 lines) - Queue/BullMQ types
```typescript
export interface BacktestParams {
  symbol: string
  startDate: string
  endDate: string
  initialCapital: number
  commission: number
  slippage: number
}

export interface BacktestJob {
  userId: string
  strategyId: string
  backtestParams: BacktestParams
  priority: number
  createdAt: number
}

export interface BacktestJobResult {
  jobId: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  progress: number
  result?: BacktestResult
  error?: string
  startedAt?: number
  completedAt?: number
}

export interface QueueMetrics { /* ... */ }
export interface ProgressUpdate { /* ... */ }
```

**7. `graph.ts`** (80 lines) - Strategy Graph/Node Builder types
```typescript
export type NodeType =
  | 'trigger'
  | 'condition'
  | 'indicator'
  | 'action'
  | 'filter'
  | 'risk'

export interface StrategyNode {
  id: string
  type: NodeType
  label: string
  data: Record<string, unknown>
  position: { x: number; y: number }
}

export interface StrategyEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface StrategyGraph {
  nodes: StrategyNode[]
  edges: StrategyEdge[]
}
```

**8. Update `index.ts`** to export new types
```typescript
export * from './ui'
export * from './api'
export * from './websocket'
export * from './user'
export * from './util'
export * from './queue'
export * from './graph'
```

### Phase 2: Update Imports (45 min)

**Find and replace all imports**:

```bash
# Find all files importing from '@/types'
grep -r "from '@/types'" src --include="*.ts" --include="*.tsx"
# Result: 41 files

# Replace pattern:
# OLD: import { Strategy, Trade } from '@/types'
# NEW: import { Strategy, Trade } from '@hephaitos/types'
```

**Automated script** (`scripts/migrate-type-imports.sh`):
```bash
#!/bin/bash
# Migrate type imports from @/types to @hephaitos/types

echo "🔄 Migrating type imports..."

# Find all TypeScript files
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  # Replace @/types with @hephaitos/types
  sed -i "s|from '@/types'|from '@hephaitos/types'|g" "$file"
  sed -i 's|from "@/types"|from "@hephaitos/types"|g' "$file"
done

echo "✅ Migration complete!"
echo "📊 Updated files:"
grep -r "from '@hephaitos/types'" src --include="*.ts" --include="*.tsx" | wc -l
```

### Phase 3: Delete src/types (5 min)

```bash
# Verify no imports remain
grep -r "from '@/types'" src --include="*.ts" --include="*.tsx"
# Should return: 0 results

# Remove directory
rm -rf src/types/

# Update tsconfig.json paths (if needed)
# Remove alias for '@/types' if it exists
```

### Phase 4: Verify & Test (10 min)

```bash
# Type check
pnpm tsc --noEmit

# Build
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

---

## Implementation Steps

### Step 1: Create New Type Files (30 min)

Create 7 new files in `packages/types/src/hephaitos/`:
1. `ui.ts` - Component props (100 lines)
2. `api.ts` - API responses (80 lines)
3. `websocket.ts` - WebSocket events (120 lines)
4. `user.ts` - User & Notification (60 lines)
5. `util.ts` - Utility types (80 lines)
6. `queue.ts` - BullMQ queue types (60 lines)
7. `graph.ts` - Strategy graph/node builder (80 lines)

**Command**:
```bash
cd packages/types/src/hephaitos
touch ui.ts api.ts websocket.ts user.ts util.ts queue.ts graph.ts
```

### Step 2: Copy & Organize Types (15 min)

For each new file, copy relevant types from `src/types/index.ts` and `src/types/queue.ts`.

**Example for `ui.ts`**:
```bash
# Extract component props from src/types/index.ts lines 352-378
cat > packages/types/src/hephaitos/ui.ts <<'EOF'
// Component Props Types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}
// ... (copy all component props)
EOF
```

### Step 3: Update Index Exports (5 min)

Update `packages/types/src/hephaitos/index.ts`:
```typescript
// Existing exports
export * from './asset'
export * from './backtest'
export * from './credentials'
export * from './exchange'
export * from './order'
export * from './portfolio'
export * from './strategy'
export * from './trade'

// NEW exports
export * from './ui'
export * from './api'
export * from './websocket'
export * from './user'
export * from './util'
export * from './queue'
export * from './graph'
```

### Step 4: Run Import Migration Script (20 min)

```bash
# Create migration script
cat > scripts/migrate-type-imports.sh <<'EOF'
#!/bin/bash
echo "🔄 Migrating type imports from @/types to @hephaitos/types..."

# Replace in all TS/TSX files
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s|from '@/types'|from '@hephaitos/types'|g" \
  -e 's|from "@/types"|from "@hephaitos/types"|g' \
  {} +

echo "✅ Migration complete!"
echo "📊 Files updated:"
grep -r "from '@hephaitos/types'" src --include="*.ts" --include="*.tsx" | wc -l
EOF

chmod +x scripts/migrate-type-imports.sh
./scripts/migrate-type-imports.sh
```

### Step 5: Remove src/types (2 min)

```bash
# Verify zero imports from @/types
grep -r "from '@/types'" src --include="*.ts" --include="*.tsx"

# If zero results:
rm -rf src/types/
git add -A
git commit -m "refactor: migrate all types to @hephaitos/types, remove src/types"
```

### Step 6: Verify Build (8 min)

```bash
# Type check (should pass)
pnpm tsc --noEmit

# Build (should succeed)
pnpm build

# Tests (should pass)
pnpm test --run

# Final verification
echo "✅ Type system migration complete!"
```

---

## Expected Results

### Before Migration

```
Type System:
├── src/types/
│   ├── index.ts (407 lines) ❌ Duplicates
│   └── queue.ts (59 lines)  ❌ Should be in @hephaitos/types
└── packages/types/src/hephaitos/
    ├── asset.ts ✅
    ├── backtest.ts ✅
    ├── ... (8 files)

Imports:
- from '@/types': 41 files ❌
- from '@hephaitos/types': 5 files ✅
```

### After Migration

```
Type System:
└── packages/types/src/hephaitos/
    ├── asset.ts ✅
    ├── backtest.ts ✅
    ├── ... (8 files - existing)
    ├── ui.ts ✅ NEW
    ├── api.ts ✅ NEW
    ├── websocket.ts ✅ NEW
    ├── user.ts ✅ NEW
    ├── util.ts ✅ NEW
    ├── queue.ts ✅ NEW
    └── graph.ts ✅ NEW

Imports:
- from '@/types': 0 files ✅
- from '@hephaitos/types': 46 files ✅
```

---

## Benefits

### Code Quality
- ✅ **Single Source of Truth** - All types in one place
- ✅ **No Duplication** - Eliminate conflicting type definitions
- ✅ **Better Organization** - Types grouped by domain (L0 Nano-Factor)
- ✅ **Easier Maintenance** - Update one file, not multiple

### Developer Experience
- ✅ **IntelliSense Autocomplete** - IDE can find types easily
- ✅ **Import Path Consistency** - Always `from '@hephaitos/types'`
- ✅ **Type Safety** - Catch errors at compile time
- ✅ **Reusability** - Types can be used across monorepo packages

### Architecture
- ✅ **Nano-Factor L0** - Pure types, no business logic
- ✅ **Monorepo Best Practice** - Shared types in dedicated package
- ✅ **Scalability** - Easy to add new types to appropriate files

---

## Risks & Mitigation

### Risk 1: Breaking Changes

**Problem**: Changing import paths might break existing code

**Mitigation**:
- ✅ Automated script ensures consistency
- ✅ TypeScript compiler catches import errors
- ✅ Run full test suite before committing

### Risk 2: Build Failures

**Problem**: Missing or circular dependencies

**Mitigation**:
- ✅ Test build after migration: `pnpm build`
- ✅ Check for circular deps: `madge --circular src`
- ✅ Rollback plan: `git revert`

### Risk 3: Type Conflicts

**Problem**: Different versions of same type

**Mitigation**:
- ✅ Carefully review types before copying
- ✅ Use existing @hephaitos/types definitions when available
- ✅ Only add truly missing types

---

## Checklist

### Pre-Migration
- [x] Identify all types in src/types
- [x] Compare with @hephaitos/types to find duplicates
- [x] Plan new files to create
- [x] Create migration script

### Migration
- [ ] Create 7 new type files in packages/types/src/hephaitos/
- [ ] Copy unique types from src/types/
- [ ] Update index.ts exports
- [ ] Run import migration script
- [ ] Verify zero imports from '@/types'
- [ ] Delete src/types directory

### Post-Migration
- [ ] Run `pnpm tsc --noEmit` (type check)
- [ ] Run `pnpm build` (build)
- [ ] Run `pnpm test` (tests)
- [ ] Run `pnpm lint` (linting)
- [ ] Commit changes
- [ ] Update documentation

---

## Timeline

| Task | Time | Status |
|------|------|--------|
| Create new type files | 30 min | ⏳ Pending |
| Copy & organize types | 15 min | ⏳ Pending |
| Update index exports | 5 min | ⏳ Pending |
| Run migration script | 20 min | ⏳ Pending |
| Remove src/types | 2 min | ⏳ Pending |
| Verify & test | 8 min | ⏳ Pending |
| **Total** | **1h 20min** | ⏳ Pending |

*Under 1.5 hour budget ✅*

---

## Next Steps

1. Review this migration plan
2. Execute Phase 1 (create new type files)
3. Execute Phase 2 (update imports)
4. Execute Phase 3 (delete src/types)
5. Verify build & tests pass
6. Commit and push

---

**Status**: ⏳ Ready for execution
**Priority**: P0 (Phase 5)
**Estimated Completion**: 1.5 hours

---

*Generated by Claude Code on 2025-12-21*
