/**
 * Strategy Leaderboard Page
 * Loop 12: 전략 리더보드
 */

'use client';

import { useCallback, useState, useEffect } from 'react';
import { StrategyCard } from './components/StrategyCard';
import { LeaderboardFilters } from './components/LeaderboardFilters';

interface Strategy {
  rank: number;
  strategyId: string;
  strategyName: string;
  creatorId: string;
  backtestCount: number;
  avgReturn: number;
  avgSharpe: number;
  avgCagr: number;
  avgMdd: number;
  rankSharpe: number;
  rankCagr: number;
  lastBacktestAt: string;
}

export default function LeaderboardPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'sharpe' | 'cagr' | 'return'>('sharpe');
  const [total, setTotal] = useState(0);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/strategies/leaderboard?sortBy=${sortBy}&limit=100`);
      const data = await res.json();

      if (data.success) {
        setStrategies(data.data.strategies);
        setTotal(data.data.pagination.total);
      }
    } catch (error) {
      console.error('[Leaderboard] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="min-h-screen bg-[#0D0D0F] p-6">
      {/* Header */}
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              🏆 전략 리더보드
            </h1>
            <p className="mt-2 text-gray-400">
              가장 성과가 좋은 트레이딩 전략을 확인하고 따라해보세요
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-400">전체 전략</p>
            <p className="text-2xl font-bold text-primary">{total}</p>
          </div>
        </div>

        {/* Filters */}
        <LeaderboardFilters sortBy={sortBy} onSortChange={setSortBy} />

        {/* Loading */}
        {loading && (
          <div className="mt-8 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {/* Strategy List */}
        {!loading && (
          <div className="mt-8 space-y-4">
            {strategies.length === 0 && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
                <p className="text-gray-400">
                  아직 공개된 전략이 없습니다
                </p>
              </div>
            )}

            {strategies.map((strategy) => (
              <StrategyCard
                key={strategy.strategyId}
                strategy={strategy}
                sortBy={sortBy}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 rounded-lg border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm font-semibold text-white">📖 리더보드 안내</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-400">
            <li>• 최소 3회 백테스트를 완료한 공개 전략만 표시됩니다</li>
            <li>• 랭킹은 1시간마다 자동 업데이트됩니다</li>
            <li>• 전략을 클릭하면 상세 성과를 확인할 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
