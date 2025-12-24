/**
 * @hephaitos/utils - PnL Calculation Tests
 * L1 (Molecules) - 손익 계산 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import type { IAsset, IPortfolioSnapshot } from '@hephaitos/types';
import {
  calculateAssetPnL,
  calculatePortfolioPnL,
  calculateSnapshotReturn,
  calculatePeriodReturns,
  calculateSharpeRatio,
  calculateMaxDrawdown,
} from '../pnl';

// ═══════════════════════════════════════════════════════════════
// Asset PnL Tests
// ═══════════════════════════════════════════════════════════════

describe('calculateAssetPnL', () => {
  it('should calculate profit for an asset', () => {
    const asset: IAsset = {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      amount: 10,
      price_usd: 110,
      value_usd: 1100,
      change_24h: 0,
      avg_buy_price: 100,
    };

    const result = calculateAssetPnL(asset);
    expect(result.cost_basis).toBe(1000); // 100 * 10
    expect(result.current_value).toBe(1100);
    expect(result.absolute).toBe(100); // 1100 - 1000
    expect(result.percentage).toBe(10); // (100 / 1000) * 100
  });

  it('should calculate loss for an asset', () => {
    const asset: IAsset = {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      amount: 10,
      price_usd: 90,
      value_usd: 900,
      change_24h: 0,
      avg_buy_price: 100,
    };

    const result = calculateAssetPnL(asset);
    expect(result.cost_basis).toBe(1000);
    expect(result.current_value).toBe(900);
    expect(result.absolute).toBe(-100);
    expect(result.percentage).toBe(-10);
  });

  it('should handle asset with no average buy price', () => {
    const asset: IAsset = {
      symbol: 'BTC',
      name: 'Bitcoin',
      amount: 1,
      price_usd: 50000,
      value_usd: 50000,
      change_24h: 0,
      avg_buy_price: undefined,
    };

    const result = calculateAssetPnL(asset);
    expect(result.cost_basis).toBe(0);
    expect(result.current_value).toBe(50000);
    expect(result.absolute).toBe(50000);
    expect(result.percentage).toBe(0); // Can't calculate % without cost basis
  });

  it('should handle zero value asset', () => {
    const asset: IAsset = {
      symbol: 'DEAD',
      name: 'Dead Coin',
      amount: 100,
      price_usd: 0,
      value_usd: 0,
      change_24h: -100,
      avg_buy_price: 10,
    };

    const result = calculateAssetPnL(asset);
    expect(result.cost_basis).toBe(1000);
    expect(result.current_value).toBe(0);
    expect(result.absolute).toBe(-1000);
    expect(result.percentage).toBe(-100);
  });

  it('should handle fractional amounts', () => {
    const asset: IAsset = {
      symbol: 'ETH',
      name: 'Ethereum',
      amount: 2.5,
      price_usd: 2100,
      value_usd: 5250,
      change_24h: 0,
      avg_buy_price: 2000,
    };

    const result = calculateAssetPnL(asset);
    expect(result.cost_basis).toBe(5000); // 2000 * 2.5
    expect(result.current_value).toBe(5250);
    expect(result.absolute).toBe(250);
    expect(result.percentage).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════
// Portfolio PnL Tests
// ═══════════════════════════════════════════════════════════════

describe('calculatePortfolioPnL', () => {
  it('should calculate total portfolio PnL', () => {
    const assets: IAsset[] = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        amount: 10,
        price_usd: 110,
        value_usd: 1100,
        change_24h: 0,
        avg_buy_price: 100,
      },
      {
        symbol: 'GOOGL',
        name: 'Google',
        amount: 5,
        price_usd: 180,
        value_usd: 900,
        change_24h: 0,
        avg_buy_price: 200,
      },
    ];

    const result = calculatePortfolioPnL(assets);
    expect(result.cost_basis).toBe(2000); // 1000 + 1000
    expect(result.current_value).toBe(2000); // 1100 + 900
    expect(result.absolute).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it('should calculate portfolio profit', () => {
    const assets: IAsset[] = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        amount: 10,
        price_usd: 120,
        value_usd: 1200,
        change_24h: 0,
        avg_buy_price: 100,
      },
      {
        symbol: 'GOOGL',
        name: 'Google',
        amount: 5,
        price_usd: 220,
        value_usd: 1100,
        change_24h: 0,
        avg_buy_price: 200,
      },
    ];

    const result = calculatePortfolioPnL(assets);
    expect(result.cost_basis).toBe(2000);
    expect(result.current_value).toBe(2300);
    expect(result.absolute).toBe(300);
    expect(result.percentage).toBe(15);
  });

  it('should handle empty portfolio', () => {
    const result = calculatePortfolioPnL([]);
    expect(result.cost_basis).toBe(0);
    expect(result.current_value).toBe(0);
    expect(result.absolute).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it('should skip assets without avg_buy_price in cost basis', () => {
    const assets: IAsset[] = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        amount: 10,
        price_usd: 110,
        value_usd: 1100,
        change_24h: 0,
        avg_buy_price: 100,
      },
      {
        symbol: 'AIRDROP',
        name: 'Airdrop Token',
        amount: 100,
        price_usd: 5,
        value_usd: 500,
        change_24h: 0,
        avg_buy_price: undefined,
      },
    ];

    const result = calculatePortfolioPnL(assets);
    expect(result.cost_basis).toBe(1000); // Only AAPL
    expect(result.current_value).toBe(1600); // Both
    expect(result.absolute).toBe(600);
    expect(result.percentage).toBe(60);
  });

  it('should handle portfolio with losses', () => {
    const assets: IAsset[] = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        amount: 10,
        price_usd: 80,
        value_usd: 800,
        change_24h: 0,
        avg_buy_price: 100,
      },
      {
        symbol: 'GOOGL',
        name: 'Google',
        amount: 5,
        price_usd: 150,
        value_usd: 750,
        change_24h: 0,
        avg_buy_price: 200,
      },
    ];

    const result = calculatePortfolioPnL(assets);
    expect(result.cost_basis).toBe(2000);
    expect(result.current_value).toBe(1550);
    expect(result.absolute).toBe(-450);
    expect(result.percentage).toBe(-22.5);
  });
});

// ═══════════════════════════════════════════════════════════════
// Snapshot Return Tests
// ═══════════════════════════════════════════════════════════════

describe('calculateSnapshotReturn', () => {
  it('should calculate positive return between snapshots', () => {
    const startSnapshot: IPortfolioSnapshot = {
      id: '1',
      portfolio_id: 'portfolio1',
      total_value_usd: 10000,
      asset_breakdown: [],
      recorded_at: new Date('2024-01-01').toISOString(),
    };

    const endSnapshot: IPortfolioSnapshot = {
      id: '2',
      portfolio_id: 'portfolio1',
      total_value_usd: 11000,
      asset_breakdown: [],
      recorded_at: new Date('2024-01-31').toISOString(),
    };

    const result = calculateSnapshotReturn(startSnapshot, endSnapshot);
    expect(result.cost_basis).toBe(10000);
    expect(result.current_value).toBe(11000);
    expect(result.absolute).toBe(1000);
    expect(result.percentage).toBe(10);
  });

  it('should calculate negative return between snapshots', () => {
    const startSnapshot: IPortfolioSnapshot = {
      id: '1',
      portfolio_id: 'portfolio1',
      total_value_usd: 10000,
      asset_breakdown: [],
      recorded_at: new Date('2024-01-01').toISOString(),
    };

    const endSnapshot: IPortfolioSnapshot = {
      id: '2',
      portfolio_id: 'portfolio1',
      total_value_usd: 9000,
      asset_breakdown: [],
      recorded_at: new Date('2024-01-31').toISOString(),
    };

    const result = calculateSnapshotReturn(startSnapshot, endSnapshot);
    expect(result.absolute).toBe(-1000);
    expect(result.percentage).toBe(-10);
  });

  it('should handle zero return', () => {
    const startSnapshot: IPortfolioSnapshot = {
      id: '1',
      portfolio_id: 'portfolio1',
      total_value_usd: 10000,
      asset_breakdown: [],
      recorded_at: new Date('2024-01-01').toISOString(),
    };

    const endSnapshot: IPortfolioSnapshot = {
      id: '2',
      portfolio_id: 'portfolio1',
      total_value_usd: 10000,
      asset_breakdown: [],
      recorded_at: new Date('2024-01-31').toISOString(),
    };

    const result = calculateSnapshotReturn(startSnapshot, endSnapshot);
    expect(result.absolute).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it('should handle zero start value', () => {
    const startSnapshot: IPortfolioSnapshot = {
      id: '1',
      portfolio_id: 'portfolio1',
      total_value_usd: 0,
      asset_breakdown: [],
      recorded_at: new Date('2024-01-01').toISOString(),
    };

    const endSnapshot: IPortfolioSnapshot = {
      id: '2',
      portfolio_id: 'portfolio1',
      total_value_usd: 10000,
      asset_breakdown: [],
      recorded_at: new Date('2024-01-31').toISOString(),
    };

    const result = calculateSnapshotReturn(startSnapshot, endSnapshot);
    expect(result.absolute).toBe(10000);
    expect(result.percentage).toBe(0); // Can't calculate % from 0
  });
});

// ═══════════════════════════════════════════════════════════════
// Period Returns Tests
// ═══════════════════════════════════════════════════════════════

describe('calculatePeriodReturns', () => {
  it('should calculate returns for all periods', () => {
    const now = new Date('2024-12-24T00:00:00Z');
    const snapshots: IPortfolioSnapshot[] = [
      {
        id: '1',
        portfolio_id: 'portfolio1',
        total_value_usd: 10000,
        asset_breakdown: [],
        recorded_at: new Date('2024-01-01T00:00:00Z').toISOString(),
      },
      {
        id: '2',
        portfolio_id: 'portfolio1',
        total_value_usd: 10500,
        asset_breakdown: [],
        recorded_at: new Date('2024-12-23T00:00:00Z').toISOString(),
      },
      {
        id: '3',
        portfolio_id: 'portfolio1',
        total_value_usd: 10800,
        asset_breakdown: [],
        recorded_at: new Date('2024-12-17T00:00:00Z').toISOString(),
      },
      {
        id: '4',
        portfolio_id: 'portfolio1',
        total_value_usd: 10200,
        asset_breakdown: [],
        recorded_at: new Date('2024-11-24T00:00:00Z').toISOString(),
      },
    ];

    const currentValue = 11000;
    const results = calculatePeriodReturns(snapshots, currentValue);

    // Should have results for periods with data + 'all'
    expect(results.length).toBeGreaterThan(0);

    // Check 'all' period
    const allPeriod = results.find(r => r.period === 'all');
    expect(allPeriod).toBeDefined();
    expect(allPeriod?.start_value).toBe(10000);
    expect(allPeriod?.end_value).toBe(11000);
    expect(allPeriod?.return_usd).toBe(1000);
    expect(allPeriod?.return_percent).toBe(10);
  });

  it('should handle empty snapshots', () => {
    const results = calculatePeriodReturns([], 10000);
    expect(results).toHaveLength(0);
  });

  it('should calculate correct percentages', () => {
    const now = new Date('2024-12-24T00:00:00Z');
    const snapshots: IPortfolioSnapshot[] = [
      {
        id: '1',
        portfolio_id: 'portfolio1',
        total_value_usd: 5000,
        asset_breakdown: [],
        recorded_at: new Date('2024-01-01T00:00:00Z').toISOString(),
      },
    ];

    const currentValue = 10000;
    const results = calculatePeriodReturns(snapshots, currentValue);

    const allPeriod = results.find(r => r.period === 'all');
    expect(allPeriod?.return_percent).toBe(100); // 100% gain
  });

  it('should handle zero start value', () => {
    const now = new Date('2024-12-24T00:00:00Z');
    const snapshots: IPortfolioSnapshot[] = [
      {
        id: '1',
        portfolio_id: 'portfolio1',
        total_value_usd: 0,
        asset_breakdown: [],
        recorded_at: new Date('2024-01-01T00:00:00Z').toISOString(),
      },
    ];

    const currentValue = 10000;
    const results = calculatePeriodReturns(snapshots, currentValue);

    const allPeriod = results.find(r => r.period === 'all');
    expect(allPeriod?.return_usd).toBe(10000);
    expect(allPeriod?.return_percent).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// Sharpe Ratio Tests
// ═══════════════════════════════════════════════════════════════

describe('calculateSharpeRatio', () => {
  it('should calculate positive Sharpe ratio for profitable returns', () => {
    // Consistent positive returns
    const returns = [0.5, 0.6, 0.4, 0.5, 0.7, 0.5, 0.6];
    const sharpe = calculateSharpeRatio(returns, 4);

    expect(sharpe).toBeGreaterThan(0);
  });

  it('should calculate negative Sharpe ratio for losing returns', () => {
    // Consistent negative returns
    const returns = [-0.5, -0.6, -0.4, -0.5, -0.3];
    const sharpe = calculateSharpeRatio(returns, 4);

    expect(sharpe).toBeLessThan(0);
  });

  it('should return 0 for insufficient data', () => {
    expect(calculateSharpeRatio([], 4)).toBe(0);
    expect(calculateSharpeRatio([0.5], 4)).toBe(0);
  });

  it('should return 0 for zero volatility', () => {
    // All returns are the same
    const returns = [0.5, 0.5, 0.5, 0.5, 0.5];
    const sharpe = calculateSharpeRatio(returns, 4);

    expect(sharpe).toBe(0);
  });

  it('should handle different risk-free rates', () => {
    const returns = [1, 1.2, 0.8, 1.1, 0.9];

    const sharpe1 = calculateSharpeRatio(returns, 2);
    const sharpe2 = calculateSharpeRatio(returns, 6);

    // Higher risk-free rate should result in lower Sharpe ratio
    expect(sharpe1).toBeGreaterThan(sharpe2);
  });

  it('should annualize returns correctly', () => {
    // Daily returns of 0.1% should annualize to ~36.5%
    const returns = Array(365).fill(0.1);
    const sharpe = calculateSharpeRatio(returns, 4);

    // With consistent returns and risk-free rate of 4%,
    // annualized return is 36.5%, should have positive Sharpe
    expect(sharpe).toBeGreaterThan(0);
  });

  it('should handle volatile returns', () => {
    const returns = [5, -3, 4, -2, 3, -4, 6, -1];
    const sharpe = calculateSharpeRatio(returns, 4);

    // Should calculate despite volatility
    expect(typeof sharpe).toBe('number');
    expect(isFinite(sharpe)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// Maximum Drawdown Tests
// ═══════════════════════════════════════════════════════════════

describe('calculateMaxDrawdown', () => {
  it('should calculate max drawdown for declining values', () => {
    const values = [10000, 9500, 9000, 8500];
    const mdd = calculateMaxDrawdown(values);

    expect(mdd).toBe(15); // (10000 - 8500) / 10000 * 100
  });

  it('should calculate max drawdown with recovery', () => {
    const values = [10000, 12000, 9000, 11000, 8000, 10000];
    const mdd = calculateMaxDrawdown(values);

    // Peak: 12000, Trough: 8000, MDD: 33.33%
    expect(mdd).toBeCloseTo(33.333, 2);
  });

  it('should return 0 for increasing values', () => {
    const values = [1000, 1100, 1200, 1300];
    const mdd = calculateMaxDrawdown(values);

    expect(mdd).toBe(0);
  });

  it('should return 0 for constant values', () => {
    const values = [1000, 1000, 1000, 1000];
    const mdd = calculateMaxDrawdown(values);

    expect(mdd).toBe(0);
  });

  it('should handle single value', () => {
    const values = [10000];
    const mdd = calculateMaxDrawdown(values);

    expect(mdd).toBe(0);
  });

  it('should handle empty array', () => {
    const values: number[] = [];
    const mdd = calculateMaxDrawdown(values);

    expect(mdd).toBe(0);
  });

  it('should calculate max drawdown correctly with multiple peaks', () => {
    const values = [100, 110, 90, 105, 80, 100, 120, 70];
    const mdd = calculateMaxDrawdown(values);

    // Peak: 120, Trough: 70, MDD: 41.67%
    expect(mdd).toBeCloseTo(41.667, 2);
  });

  it('should handle 100% drawdown (total loss)', () => {
    const values = [10000, 5000, 1000, 0];
    const mdd = calculateMaxDrawdown(values);

    expect(mdd).toBe(100);
  });

  it('should handle recovery to new highs', () => {
    const values = [100, 80, 90, 110, 95, 120];
    const mdd = calculateMaxDrawdown(values);

    // Worst drawdown was from 110 to 95: (110-95)/110 = 13.64%
    // Or from initial 100 to 80: 20%
    expect(mdd).toBe(20);
  });
});

// ═══════════════════════════════════════════════════════════════
// Edge Cases & Extreme Values
// ═══════════════════════════════════════════════════════════════

describe('PnL Edge Cases', () => {
  it('should handle very small asset values', () => {
    const asset: IAsset = {
      symbol: 'SHIB',
      name: 'Shiba Inu',
      amount: 1000000,
      price_usd: 0.00000001,
      value_usd: 0.01,
      change_24h: 0,
      avg_buy_price: 0.00001,
    };

    const result = calculateAssetPnL(asset);
    expect(result.cost_basis).toBeCloseTo(10, 5);
    expect(result.current_value).toBe(0.01);
    expect(result.absolute).toBeCloseTo(-9.99, 2);
  });

  it('should handle very large portfolio values', () => {
    const assets: IAsset[] = [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        amount: 1000,
        price_usd: 50000,
        value_usd: 50000000,
        change_24h: 0,
        avg_buy_price: 40000,
      },
    ];

    const result = calculatePortfolioPnL(assets);
    expect(result.cost_basis).toBe(40000000);
    expect(result.current_value).toBe(50000000);
    expect(result.absolute).toBe(10000000);
    expect(result.percentage).toBe(25);
  });

  it('should maintain precision with many decimal places', () => {
    const asset: IAsset = {
      symbol: 'ETH',
      name: 'Ethereum',
      amount: 3.14159265,
      price_usd: 2100,
      value_usd: 6597.345,
      change_24h: 0,
      avg_buy_price: 2100.123456,
    };

    const result = calculateAssetPnL(asset);
    const expectedCostBasis = 3.14159265 * 2100.123456;
    expect(result.cost_basis).toBeCloseTo(expectedCostBasis, 5);
  });

  it('should handle mixed profit and loss in portfolio', () => {
    const assets: IAsset[] = [
      {
        symbol: 'WINNER',
        name: 'Winner Coin',
        amount: 10,
        price_usd: 200,
        value_usd: 2000,
        change_24h: 0,
        avg_buy_price: 100,
      },
      {
        symbol: 'LOSER',
        name: 'Loser Coin',
        amount: 10,
        price_usd: 50,
        value_usd: 500,
        change_24h: 0,
        avg_buy_price: 100,
      },
    ];

    const result = calculatePortfolioPnL(assets);
    expect(result.cost_basis).toBe(2000);
    expect(result.current_value).toBe(2500);
    expect(result.absolute).toBe(500);
    expect(result.percentage).toBe(25);
  });
});
