/**
 * Strategy Card Component
 * Loop 12: 리더보드 전략 카드
 */

'use client';

import Link from 'next/link';

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

interface StrategyCardProps {
  strategy: Strategy;
  sortBy: 'sharpe' | 'cagr' | 'return';
}

export function StrategyCard({ strategy, sortBy }: StrategyCardProps) {
  const getPrimaryMetric = () => {
    switch (sortBy) {
      case 'sharpe':
        return { label: '평균 Sharpe', value: strategy.avgSharpe.toFixed(2) };
      case 'cagr':
        return { label: '평균 CAGR', value: `${strategy.avgCagr.toFixed(1)}%` };
      case 'return':
        return { label: '평균 수익률', value: `${strategy.avgReturn.toFixed(1)}%` };
    }
  };

  const primaryMetric = getPrimaryMetric();

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-500';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <Link
      href={`/strategies/${strategy.strategyId}`}
      className="block transition-transform hover:scale-[1.01]"
    >
      <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:border-primary/50">
        <div className="flex items-start justify-between">
          {/* Left: Rank + Info */}
          <div className="flex items-start gap-4">
            {/* Rank Badge */}
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
              <span className={`text-xl font-bold ${getRankColor(strategy.rank)}`}>
                {getRankIcon(strategy.rank)}
              </span>
            </div>

            {/* Strategy Info */}
            <div>
              <h3 className="text-lg font-semibold text-white">
                {strategy.strategyName}
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                @creator{strategy.creatorId.slice(0, 8)} • {strategy.backtestCount} 백테스트
              </p>
            </div>
          </div>

          {/* Right: Primary Metric */}
          <div className="text-right">
            <p className="text-sm text-gray-400">{primaryMetric.label}</p>
            <p className="mt-1 text-2xl font-bold text-primary">{primaryMetric.value}</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-4 grid grid-cols-4 gap-4 border-t border-white/10 pt-4">
          <div>
            <p className="text-xs text-gray-400">평균 수익률</p>
            <p
              className={`mt-1 text-sm font-semibold ${
                strategy.avgReturn > 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {strategy.avgReturn > 0 ? '+' : ''}
              {strategy.avgReturn.toFixed(1)}%
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400">평균 CAGR</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {strategy.avgCagr.toFixed(1)}%
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400">평균 MDD</p>
            <p className="mt-1 text-sm font-semibold text-red-400">
              {strategy.avgMdd.toFixed(1)}%
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400">Sharpe 순위</p>
            <p className="mt-1 text-sm font-semibold text-primary">
              #{strategy.rankSharpe}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
