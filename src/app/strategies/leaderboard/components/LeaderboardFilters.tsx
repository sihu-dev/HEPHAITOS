/**
 * Leaderboard Filters Component
 * Loop 12: 정렬 필터
 */

'use client';

interface LeaderboardFiltersProps {
  sortBy: 'sharpe' | 'cagr' | 'return';
  onSortChange: (sortBy: 'sharpe' | 'cagr' | 'return') => void;
}

export function LeaderboardFilters({ sortBy, onSortChange }: LeaderboardFiltersProps) {
  const options = [
    { value: 'sharpe' as const, label: 'Sharpe Ratio', icon: '⭐' },
    { value: 'cagr' as const, label: 'CAGR', icon: '📈' },
    { value: 'return' as const, label: '총 수익률', icon: '💰' },
  ];

  return (
    <div className="flex gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSortChange(option.value)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
            sortBy === option.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white'
          }`}
        >
          <span>{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
