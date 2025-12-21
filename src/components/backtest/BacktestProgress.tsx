/**
 * Backtest Progress Component
 * Loop 11: Real-time Progress with Supabase Realtime
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Progress } from '@/components/ui/progress';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface BacktestProgressProps {
  jobId: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export function BacktestProgress({ jobId, onComplete, onError }: BacktestProgressProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'pending' | 'active' | 'completed' | 'failed'>('pending');
  const [message, setMessage] = useState('대기 중...');
  const [result, setResult] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!supabase) {
      onError?.('Supabase 연결을 사용할 수 없습니다');
      return;
    }

    let channel: RealtimeChannel;
    let pollInterval: NodeJS.Timeout;

    const subscribe = async () => {
      // 1. Realtime 구독 (primary method)
      channel = supabase
        .channel(`backtest:${jobId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'backtest_jobs',
            filter: `job_id=eq.${jobId}`,
          },
          (payload) => {
            const data = payload.new as Record<string, unknown>;

            console.log('[BacktestProgress] Realtime update:', data);

            setProgress((data.progress as number) || 0);
            setStatus(data.status as string);
            setMessage((data.message as string) || '처리 중...');

            if (data.status === 'completed') {
              setResult(data.result);
              onComplete?.(data.result);
            } else if (data.status === 'failed') {
              const result = data.result as { error?: string } | undefined;
              onError?.(result?.error || '알 수 없는 오류');
            }
          }
        )
        .subscribe((status) => {
          console.log('[BacktestProgress] Realtime status:', status);
        });

      // 2. Polling Fallback (Realtime 실패 시)
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/backtest/queue?jobId=${jobId}`);
          const data = await res.json();

          if (data.status !== 'pending' && data.status !== 'active') {
            clearInterval(pollInterval);
          }

          setProgress(data.progress || 0);
          setStatus(data.status);

          if (data.status === 'completed') {
            setResult(data.result);
            onComplete?.(data.result);
            clearInterval(pollInterval);
          } else if (data.status === 'failed') {
            onError?.(data.result?.error || '알 수 없는 오류');
            clearInterval(pollInterval);
          }
        } catch (error) {
          console.error('[BacktestProgress] Polling error:', error);
        }
      }, 2000); // 2초마다 폴링
    };

    subscribe();

    return () => {
      channel?.unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [jobId, supabase, onComplete, onError]);

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return '대기 중';
      case 'active':
        return '실행 중';
      case 'completed':
        return '완료';
      case 'failed':
        return '실패';
      default:
        return '알 수 없음';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">백테스트 진행 중</h3>
          <p className="mt-1 text-sm text-gray-400">
            Job ID: <span className="font-mono text-xs">{jobId.slice(0, 16)}...</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {status === 'active' && (
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">{message}</span>
          <span className="font-mono font-semibold text-primary">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Result or Error */}
      {status === 'completed' && result && (
        <div className="rounded-md bg-green-500/10 p-4">
          <p className="text-sm font-medium text-green-400">
            ✓ 백테스트가 완료되었습니다!
          </p>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">총 수익률:</span>
              <span className="ml-2 font-semibold text-green-400">
                {result.totalReturn?.toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-gray-400">Sharpe Ratio:</span>
              <span className="ml-2 font-semibold">{result.sharpeRatio?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="rounded-md bg-red-500/10 p-4">
          <p className="text-sm font-medium text-red-400">
            ✕ 백테스트 실행 중 오류가 발생했습니다.
          </p>
          <p className="mt-1 text-xs text-red-300">{message}</p>
        </div>
      )}
    </div>
  );
}
