/**
 * Progress Component
 * Loop 11: Backtest Queue System
 */

'use client';

import * as React from 'react';

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export function Progress({ value, className = '', 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy }: ProgressProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`relative h-2 w-full overflow-hidden rounded-full bg-white/5 ${className}`}
      role="progressbar"
      aria-valuenow={normalizedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      <div
        className="h-full bg-gradient-to-r from-primary to-purple-400 transition-all duration-300 ease-out"
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  );
}
