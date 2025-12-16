# Phase 1: Real-time Dashboard Implementation

**Priority**: 🔥 P0 (Critical)
**Timeline**: Day 2-3 (8-11 hours)
**Impact**: User Experience 극적 개선

---

## 🎯 Goals

- Dashboard가 WebSocket으로 실시간 업데이트
- Backtest progress가 live로 표시
- Toast notifications로 즉각적인 피드백
- Zero page refresh, zero manual polling

---

## 📋 Prerequisites

- [ ] Supabase Project 접근 권한
- [ ] Database tables 존재 확인 (strategies, backtest_jobs, backtest_results)
- [ ] RLS policies 설정 완료
- [ ] Vercel 배포 완료

---

## Step 1: Enable Supabase Realtime (30분)

### 1.1 Supabase Dashboard 접속
```bash
# URL 열기
open https://supabase.com/dashboard/project/demwsktllidwsxahqyvd
```

### 1.2 Database → Replication 메뉴
1. 좌측 메뉴 → **Database** 클릭
2. **Replication** 탭 클릭
3. `supabase_realtime` publication 찾기

### 1.3 Tables 추가
```sql
-- SQL Editor에서 실행
ALTER PUBLICATION supabase_realtime ADD TABLE strategies;
ALTER PUBLICATION supabase_realtime ADD TABLE backtest_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE backtest_results;
```

### 1.4 Verification
```sql
-- 추가된 테이블 확인
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Expected Output:
--  schemaname | tablename
-- ------------+-------------------
--  public     | strategies
--  public     | backtest_jobs
--  public     | backtest_results
```

✅ **Checkpoint**: 3개 테이블이 모두 보이면 성공

---

## Step 2: Create Realtime Hooks (2-3시간)

### 2.1 Generic Realtime Hook
```typescript
// hooks/useRealtime.ts
import { useEffect, useState } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UseRealtimeOptions<T> {
  table: string;
  filter?: string;
  initialData?: T[];
  onInsert?: (item: T) => void;
  onUpdate?: (item: T) => void;
  onDelete?: (id: string) => void;
}

export function useRealtime<T extends { id: string }>(
  options: UseRealtimeOptions<T>
) {
  const [data, setData] = useState<T[]>(options.initialData || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 5;

    // Initial fetch
    const fetchData = async () => {
      try {
        const query = supabase
          .from(options.table)
          .select('*')
          .order('created_at', { ascending: false });

        const { data: initialData, error: fetchError } = await query;

        if (fetchError) {
          setError(fetchError);
        } else if (mounted) {
          setData(initialData as T[]);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to changes
    const subscribe = () => {
      const ch = supabase
        .channel(`${options.table}-changes`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: options.table,
          filter: options.filter
        }, (payload: RealtimePostgresChangesPayload<T>) => {
          if (!mounted) return;

          console.log(`[Realtime] ${options.table} ${payload.eventType}`, payload);

          if (payload.eventType === 'INSERT') {
            setData(prev => [payload.new, ...prev]);
            options.onInsert?.(payload.new);
          } else if (payload.eventType === 'UPDATE') {
            setData(prev => prev.map(item =>
              item.id === payload.new.id ? payload.new : item
            ));
            options.onUpdate?.(payload.new);
          } else if (payload.eventType === 'DELETE') {
            setData(prev => prev.filter(item => item.id !== payload.old.id));
            options.onDelete?.(payload.old.id);
          }
        })
        .subscribe((status, err) => {
          console.log(`[Realtime] ${options.table} subscription status:`, status);

          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
            retryCount = 0; // Reset on successful connection
          } else if (status === 'CLOSED') {
            setConnectionStatus('disconnected');
          } else if (status === 'CHANNEL_ERROR') {
            setConnectionStatus('reconnecting');

            // Exponential backoff retry
            if (retryCount < maxRetries) {
              const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s, 16s
              console.log(`[Realtime] Retry ${retryCount + 1}/${maxRetries} in ${delay}ms`);

              setTimeout(() => {
                retryCount++;
                supabase.removeChannel(ch);
                subscribe();
              }, delay);
            } else {
              console.error('[Realtime] Max retries reached. Falling back to polling.');
              // TODO: Implement polling fallback
            }
          }
        });

      setChannel(ch);
    };

    subscribe();

    return () => {
      mounted = false;
      if (channel) {
        console.log(`[Realtime] Unsubscribing from ${options.table}`);
        supabase.removeChannel(channel);
      }
    };
  }, [options.table, options.filter]);

  return { data, loading, error, connectionStatus };
}
```

### 2.2 Specific Hooks for Each Table

#### hooks/useRealtimeStrategies.ts
```typescript
import { useRealtime } from './useRealtime';
import { Strategy } from '@/types/strategy';

export function useRealtimeStrategies(userId: string) {
  return useRealtime<Strategy>({
    table: 'strategies',
    filter: `user_id=eq.${userId}`,
    onInsert: (strategy) => {
      console.log('New strategy created:', strategy.name);
    },
    onUpdate: (strategy) => {
      console.log('Strategy updated:', strategy.name);
    },
    onDelete: (id) => {
      console.log('Strategy deleted:', id);
    }
  });
}
```

#### hooks/useRealtimeBacktestJobs.ts
```typescript
import { useRealtime } from './useRealtime';
import { BacktestJob } from '@/types/backtest';

export function useRealtimeBacktestJobs(userId: string) {
  return useRealtime<BacktestJob>({
    table: 'backtest_jobs',
    filter: `user_id=eq.${userId}`,
    onUpdate: (job) => {
      if (job.status === 'completed') {
        console.log('Backtest completed:', job.id);
      } else if (job.status === 'failed') {
        console.error('Backtest failed:', job.error_message);
      }
    }
  });
}
```

#### hooks/useRealtimeBacktestResults.ts
```typescript
import { useRealtime } from './useRealtime';
import { BacktestResult } from '@/types/backtest';

export function useRealtimeBacktestResults(strategyId: string) {
  return useRealtime<BacktestResult>({
    table: 'backtest_results',
    filter: `strategy_id=eq.${strategyId}`,
    onInsert: (result) => {
      console.log('New backtest result:', result.id);
    }
  });
}
```

✅ **Checkpoint**: Hooks 컴파일 에러 없이 완료

---

## Step 3: Dashboard Integration (2-3시간)

### 3.1 Update Dashboard Page
```typescript
// app/dashboard/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRealtimeStrategies } from '@/hooks/useRealtimeStrategies';
import { useRealtimeBacktestJobs } from '@/hooks/useRealtimeBacktestJobs';

import { PortfolioHero } from '@/components/dashboard/PortfolioHero';
import { CommandPalette } from '@/components/dashboard/CommandPalette';
import { ActiveStrategies } from '@/components/dashboard/ActiveStrategies';
import { PerformanceMetrics } from '@/components/dashboard/PerformanceMetrics';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { BacktestProgress } from '@/components/dashboard/BacktestProgress';

export default function DashboardPage() {
  const { user } = useAuth();

  // Real-time data
  const {
    data: strategies,
    loading: strategiesLoading,
    connectionStatus: strategiesConnection
  } = useRealtimeStrategies(user.id);

  const {
    data: backtestJobs,
    loading: jobsLoading,
    connectionStatus: jobsConnection
  } = useRealtimeBacktestJobs(user.id);

  // Show connection status in dev mode
  if (process.env.NODE_ENV === 'development') {
    console.log('Strategies connection:', strategiesConnection);
    console.log('Backtest jobs connection:', jobsConnection);
  }

  // Loading state
  if (strategiesLoading || jobsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Connection Status Indicator (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            strategiesConnection === 'connected'
              ? 'bg-emerald-500/20 text-emerald-400'
              : strategiesConnection === 'reconnecting'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {strategiesConnection === 'connected' ? '● Connected' :
             strategiesConnection === 'reconnecting' ? '⟳ Reconnecting' :
             '○ Disconnected'}
          </div>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Portfolio Hero */}
        <PortfolioHero
          totalValue={12345.67}
          change={567.89}
          changePercent={4.82}
          sparklineData={[100, 102, 98, 105, 110, 108, 115, 120, 118, 125]}
        />

        {/* Active Backtests Progress */}
        {backtestJobs.some(job => job.status === 'running') && (
          <BacktestProgress jobs={backtestJobs.filter(j => j.status === 'running')} />
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Active Strategies (60%) */}
          <div className="lg:col-span-7">
            <h2 className="text-base font-semibold text-white mb-4">
              Active Strategies
            </h2>
            <ActiveStrategies strategies={strategies} />
          </div>

          {/* Right: Performance Metrics (40%) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white mb-4">
                Performance
              </h2>
              <PerformanceMetrics />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-base font-semibold text-white mb-4">
            Recent Activity
          </h2>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
```

### 3.2 Add Backtest Progress Component
```typescript
// components/dashboard/BacktestProgress.tsx
'use client';

import { BacktestJob } from '@/types/backtest';
import { clsx } from 'clsx';

interface BacktestProgressProps {
  jobs: BacktestJob[];
}

export function BacktestProgress({ jobs }: BacktestProgressProps) {
  return (
    <div className="bg-[#141416] border border-white/[0.08] rounded-xl p-6">
      <h3 className="text-sm font-semibold text-white mb-4">
        Running Backtests ({jobs.length})
      </h3>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">
                {job.strategy_name || `Strategy ${job.strategy_id.slice(0, 8)}`}
              </span>
              <span className="text-xs text-zinc-500">
                {job.progress || 0}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-300',
                  'bg-gradient-to-r from-[#5E6AD2] to-[#8B5CF6]'
                )}
                style={{ width: `${job.progress || 0}%` }}
              />
            </div>

            {/* Status Text */}
            <p className="text-xs text-zinc-500">
              {job.status === 'running' ? 'Backtesting...' : 'Queued'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

✅ **Checkpoint**: Dashboard 컴파일 성공, localhost에서 확인

---

## Step 4: Toast Notifications (2시간)

### 4.1 Install Sonner (Toast Library)
```bash
npm install sonner
```

### 4.2 Create Toast Provider
```typescript
// components/providers/ToastProvider.tsx
'use client';

import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to backtest job updates
    const backtestChannel = supabase
      .channel('backtest-notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'backtest_jobs',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const job = payload.new as any;

        if (job.status === 'completed' && payload.old.status !== 'completed') {
          toast.success('Backtest Complete!', {
            description: `Strategy "${job.strategy_name}" has finished backtesting.`,
            action: {
              label: 'View Results',
              onClick: () => {
                window.location.href = `/dashboard/backtest/${job.id}`;
              }
            }
          });
        } else if (job.status === 'failed' && payload.old.status !== 'failed') {
          toast.error('Backtest Failed', {
            description: job.error_message || 'An error occurred during backtesting.',
          });
        }
      })
      .subscribe();

    // Subscribe to strategy updates (e.g., loss threshold)
    const strategyChannel = supabase
      .channel('strategy-notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'strategies',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const strategy = payload.new as any;
        const oldStrategy = payload.old as any;

        // Example: Loss threshold alert
        if (strategy.current_loss && strategy.current_loss < -0.10) {
          if (!oldStrategy.current_loss || oldStrategy.current_loss >= -0.10) {
            toast.warning('Loss Threshold Alert', {
              description: `Strategy "${strategy.name}" has lost more than 10%.`,
              action: {
                label: 'Pause Strategy',
                onClick: async () => {
                  await supabase
                    .from('strategies')
                    .update({ status: 'paused' })
                    .eq('id', strategy.id);
                  toast.success('Strategy paused');
                }
              }
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(backtestChannel);
      supabase.removeChannel(strategyChannel);
    };
  }, [user]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#141416',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#fff'
          },
          className: 'sonner-toast'
        }}
      />
      {children}
    </>
  );
}
```

### 4.3 Add to Root Layout
```typescript
// app/layout.tsx
import { ToastProvider } from '@/components/providers/ToastProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
```

✅ **Checkpoint**: Toast notifications 작동 확인

---

## Step 5: Testing & Debugging (1-2시간)

### 5.1 Manual Testing Checklist
- [ ] **Test 1: Real-time Strategy Creation**
  1. Browser Tab 1: Dashboard 열기
  2. Browser Tab 2: Dashboard 열기 (same user)
  3. Tab 1: New Strategy 생성
  4. Tab 2: 즉시 나타나는지 확인 (refresh 없이)

- [ ] **Test 2: Real-time Strategy Update**
  1. Tab 1: Strategy 이름 변경
  2. Tab 2: 변경사항 즉시 반영 확인

- [ ] **Test 3: Real-time Backtest Progress**
  1. Dashboard: Backtest 시작
  2. Progress bar가 live로 업데이트 되는지 확인
  3. 완료 시 Toast notification 표시 확인

- [ ] **Test 4: WebSocket Connection**
  1. Network tab 열기
  2. WebSocket connection 존재 확인 (`ws://...`)
  3. Status: 101 Switching Protocols 확인

- [ ] **Test 5: Reconnection Logic**
  1. Dashboard 열기
  2. WiFi 끄기 (또는 DevTools → Network → Offline)
  3. Connection status: "Reconnecting" 표시 확인
  4. WiFi 켜기
  5. 자동으로 "Connected"로 돌아오는지 확인

- [ ] **Test 6: Performance**
  1. 10개 strategies 생성
  2. Dashboard load time < 2s 확인
  3. Real-time update latency < 500ms 확인

### 5.2 Debugging Commands
```bash
# Check Realtime publication
psql $DATABASE_URL -c "SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';"

# Monitor Realtime messages (Supabase Dashboard → Logs)
# Filter by "realtime"

# Check WebSocket connections (Browser DevTools)
# Network tab → WS filter
```

### 5.3 Common Issues & Solutions

**Issue 1: "Row not found" error**
```
Solution: Check RLS policies
SELECT * FROM strategies WHERE user_id = auth.uid();
-- If empty, RLS is blocking. Check policies.
```

**Issue 2: WebSocket not connecting**
```
Solution: Check NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_URL
-- Must be https://xxx.supabase.co (not localhost)
```

**Issue 3: Updates not appearing**
```
Solution: Check filter in subscription
.on('postgres_changes', {
  filter: `user_id=eq.${userId}` // Ensure userId is correct
})
```

**Issue 4: Too many reconnections**
```
Solution: Check network stability
-- If reconnecting > 5%, increase retry delay
const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s...
```

✅ **Checkpoint**: 모든 테스트 통과

---

## Step 6: Performance Optimization (1시간)

### 6.1 Add Debounce for Rapid Updates
```typescript
// hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### 6.2 Apply to Realtime Data
```typescript
// In Dashboard component
const { data: strategies } = useRealtimeStrategies(user.id);
const debouncedStrategies = useDebounce(strategies, 100); // 100ms

// Use debouncedStrategies in render
<ActiveStrategies strategies={debouncedStrategies} />
```

### 6.3 Optimize Re-renders
```typescript
// Memoize expensive components
import { memo } from 'react';

export const ActiveStrategies = memo(function ActiveStrategies({
  strategies
}: {
  strategies: Strategy[]
}) {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison
  return JSON.stringify(prevProps.strategies) === JSON.stringify(nextProps.strategies);
});
```

### 6.4 Monitor Performance
```typescript
// Add performance logging (dev only)
if (process.env.NODE_ENV === 'development') {
  useEffect(() => {
    console.time('Dashboard Render');
    return () => {
      console.timeEnd('Dashboard Render');
    };
  });
}
```

✅ **Checkpoint**: Dashboard 렌더링 < 100ms

---

## 📊 Success Metrics

### Performance Targets
- [ ] **Real-time Latency**: < 500ms (message received → UI update)
- [ ] **WebSocket Connection**: Stable (< 5% reconnection rate)
- [ ] **Dashboard Load Time**: < 2s (first contentful paint)
- [ ] **Memory Usage**: < 100MB (after 10 min session)

### User Experience Targets
- [ ] **Zero Manual Refresh**: Users never need to refresh
- [ ] **Instant Feedback**: Toast notifications within 1s of event
- [ ] **Visual Feedback**: Progress bars update smoothly
- [ ] **Connection Status**: Clear indicator when offline

### Code Quality Targets
- [ ] **Type Safety**: 100% TypeScript coverage
- [ ] **Error Handling**: All edge cases handled
- [ ] **Logging**: Comprehensive console logs (dev mode)
- [ ] **Documentation**: All hooks documented

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance benchmarks met
- [ ] Code review completed

### Deployment
- [ ] Commit changes: `git commit -m "feat: Phase 1 - Real-time Dashboard"`
- [ ] Push to GitHub: `git push origin master`
- [ ] Verify Vercel deployment
- [ ] Test on production URL

### Post-Deployment
- [ ] Monitor Vercel logs for errors
- [ ] Check Supabase Dashboard → Logs → Realtime
- [ ] Test with Beta users (first 5 users)
- [ ] Collect feedback

---

## 🎉 Phase 1 Complete!

**Expected Outcome**:
- ✅ Dashboard updates in real-time
- ✅ Backtest progress shown live
- ✅ Toast notifications working
- ✅ WebSocket connection stable
- ✅ Zero page refreshes needed

**Next Phase**: Phase 3 - Connection Pooling (1 hour)

---

Last Updated: 2025-12-17
