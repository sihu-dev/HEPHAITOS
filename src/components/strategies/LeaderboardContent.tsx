'use client';

import { useState } from 'react';

export function LeaderboardContent() {
  const [timeframe, setTimeframe] = useState<'1d' | '7d' | '30d' | 'all'>('7d');
  
  // Mock data for now
  const strategies = [
    { id: '1', name: 'RSI Oversold', author: 'trader1', return: 18.5, trades: 24, sharpe: 1.82 },
    { id: '2', name: 'MACD Cross', author: 'trader2', return: 12.3, trades: 18, sharpe: 1.45 },
    { id: '3', name: 'Momentum', author: 'trader3', return: 8.7, trades: 32, sharpe: 1.12 },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0F] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">전략 리더보드</h1>
        
        <div className="flex gap-2 mb-6">
          {(['1d', '7d', '30d', 'all'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded text-sm ${
                timeframe === tf
                  ? 'bg-primary text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {tf === 'all' ? '전체' : tf}
            </button>
          ))}
        </div>
        
        <div className="space-y-3">
          {strategies.map((strategy, i) => (
            <div key={strategy.id} className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-zinc-500">#{i + 1}</span>
                  <div>
                    <p className="text-white font-medium">{strategy.name}</p>
                    <p className="text-sm text-zinc-400">by {strategy.author}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-emerald-400 font-bold">+{strategy.return}%</p>
                    <p className="text-xs text-zinc-500">수익률</p>
                  </div>
                  <div>
                    <p className="text-white">{strategy.sharpe}</p>
                    <p className="text-xs text-zinc-500">샤프</p>
                  </div>
                  <div>
                    <p className="text-white">{strategy.trades}</p>
                    <p className="text-xs text-zinc-500">거래</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
