/**
 * Progress Component
 * Loop 11: Backtest Queue System
 */

'use client';

import * as React from 'react';

interface ProgressProps {
  value: number; // 0-100
  className?: string;
}

export function Progress({ value, className = '' }: ProgressProps) {
  return (
    <div className={`relative h-2 w-full overflow-hidden rounded-full bg-white/5 ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-primary to-purple-400 transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
