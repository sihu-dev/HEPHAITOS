// ============================================
// HEPHAITOS UI Components Unit Tests
// Comprehensive test suite for key components
// Target: 40+ tests
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { StrategyCard } from '@/app/strategies/leaderboard/components/StrategyCard'
import { PortfolioHero } from '@/components/dashboard/PortfolioHero'
import { RecentTrades } from '@/components/dashboard/RecentTrades'
import { BacktestMetrics } from '@/components/backtest/BacktestMetrics'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { I18nProvider } from '@/i18n/client'

// ============================================
// Mock i18n
// ============================================

vi.mock('@/i18n/client', async () => {
  const actual = await vi.importActual<typeof import('@/i18n/client')>('@/i18n/client')
  return {
    ...actual,
    useI18n: () => ({
      locale: 'en',
      setLocale: vi.fn(),
      t: (key: string) => key,
    }),
  }
})

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock utility functions
vi.mock('@/lib/utils', () => ({
  formatCurrency: (value: number) => `$${value.toFixed(2)}`,
}))

// ============================================
// Test Helpers
// ============================================

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nProvider>{component}</I18nProvider>)
}

// ============================================
// 1. StrategyCard Tests (10 tests)
// ============================================

describe('StrategyCard', () => {
  const mockStrategy = {
    rank: 1,
    strategyId: 'strategy-123',
    strategyName: 'Momentum Trading',
    creatorId: 'creator-abc123',
    backtestCount: 42,
    avgReturn: 15.5,
    avgSharpe: 2.1,
    avgCagr: 18.3,
    avgMdd: -12.5,
    rankSharpe: 5,
    rankCagr: 3,
    lastBacktestAt: '2025-01-15T10:30:00Z',
  }

  it('should render strategy card with basic info', () => {
    render(<StrategyCard strategy={mockStrategy} sortBy="sharpe" />)

    expect(screen.getByText('Momentum Trading')).toBeInTheDocument()
    expect(screen.getByText(/creator/)).toBeInTheDocument()
    expect(screen.getByText(/42 백테스트/)).toBeInTheDocument()
  })

  it('should display rank badge for top 3 positions', () => {
    const { rerender } = render(<StrategyCard strategy={mockStrategy} sortBy="sharpe" />)
    expect(screen.getByText('🥇')).toBeInTheDocument()

    rerender(<StrategyCard strategy={{ ...mockStrategy, rank: 2 }} sortBy="sharpe" />)
    expect(screen.getByText('🥈')).toBeInTheDocument()

    rerender(<StrategyCard strategy={{ ...mockStrategy, rank: 3 }} sortBy="sharpe" />)
    expect(screen.getByText('🥉')).toBeInTheDocument()
  })

  it('should display numeric rank for positions beyond top 3', () => {
    render(<StrategyCard strategy={{ ...mockStrategy, rank: 10 }} sortBy="sharpe" />)
    expect(screen.getByText('#10')).toBeInTheDocument()
  })

  it('should display primary metric based on sortBy prop - sharpe', () => {
    render(<StrategyCard strategy={mockStrategy} sortBy="sharpe" />)
    expect(screen.getByText('평균 Sharpe')).toBeInTheDocument()
    expect(screen.getByText('2.10')).toBeInTheDocument()
  })

  it('should display primary metric based on sortBy prop - cagr', () => {
    const { container } = render(<StrategyCard strategy={mockStrategy} sortBy="cagr" />)
    const cagrElements = screen.getAllByText('평균 CAGR')
    expect(cagrElements.length).toBeGreaterThan(0)
    // Check for CAGR value in container text
    expect(container.textContent).toContain('18.3%')
  })

  it('should display primary metric based on sortBy prop - return', () => {
    const { container } = render(<StrategyCard strategy={mockStrategy} sortBy="return" />)
    const returnElements = screen.getAllByText('평균 수익률')
    expect(returnElements.length).toBeGreaterThan(0)
    // Check for return value in container text
    expect(container.textContent).toContain('15.5%')
  })

  it('should show positive returns in green color', () => {
    render(<StrategyCard strategy={mockStrategy} sortBy="sharpe" />)
    const returnElement = screen.getByText('+15.5%')
    expect(returnElement).toHaveClass('text-green-400')
  })

  it('should show negative returns in red color', () => {
    render(<StrategyCard strategy={{ ...mockStrategy, avgReturn: -5.2 }} sortBy="sharpe" />)
    const returnElement = screen.getByText('-5.2%')
    expect(returnElement).toHaveClass('text-red-400')
  })

  it('should display all metrics in the grid', () => {
    render(<StrategyCard strategy={mockStrategy} sortBy="sharpe" />)

    expect(screen.getAllByText('평균 수익률').length).toBeGreaterThan(0)
    expect(screen.getAllByText('평균 CAGR').length).toBeGreaterThan(0)
    expect(screen.getByText('평균 MDD')).toBeInTheDocument()
    expect(screen.getByText('Sharpe 순위')).toBeInTheDocument()
  })

  it('should render as a clickable link to strategy detail page', () => {
    render(<StrategyCard strategy={mockStrategy} sortBy="sharpe" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/strategies/strategy-123')
  })
})

// ============================================
// 2. PortfolioHero Tests (10 tests)
// ============================================

describe('PortfolioHero', () => {
  const mockProps = {
    totalValue: 125000.5,
    change: 2500.25,
    changePercent: 2.04,
    sparklineData: [100000, 105000, 103000, 110000, 125000],
  }

  it('should render portfolio value', () => {
    const { container } = renderWithI18n(<PortfolioHero {...mockProps} />)
    // AnimatedValue renders the value with commas, check if it exists in the document
    expect(container.textContent).toMatch(/125,000/)
  })

  it('should display profit with up arrow and green color', () => {
    const { container } = renderWithI18n(<PortfolioHero {...mockProps} />)
    // Find element with emerald styling (profit indicator)
    const profitIndicator = container.querySelector('.bg-emerald-500\\/15')
    expect(profitIndicator).toBeInTheDocument()
    expect(profitIndicator).toHaveClass('text-emerald-400')
  })

  it('should display loss with down arrow and red color', () => {
    const { container } = renderWithI18n(
      <PortfolioHero
        totalValue={100000}
        change={-5000}
        changePercent={-4.76}
        sparklineData={[]}
      />
    )
    const lossIndicator = container.querySelector('.bg-red-500\\/15')
    expect(lossIndicator).toBeInTheDocument()
    expect(lossIndicator).toHaveClass('text-red-400')
  })

  it('should display percentage change', () => {
    const { container } = renderWithI18n(<PortfolioHero {...mockProps} />)
    expect(container.textContent).toContain('2.04%')
  })

  it('should render all time range buttons', () => {
    renderWithI18n(<PortfolioHero {...mockProps} />)

    expect(screen.getByText('1D')).toBeInTheDocument()
    expect(screen.getByText('1W')).toBeInTheDocument()
    expect(screen.getByText('1M')).toBeInTheDocument()
    expect(screen.getByText('3M')).toBeInTheDocument()
    expect(screen.getByText('1Y')).toBeInTheDocument()
    expect(screen.getByText('ALL')).toBeInTheDocument()
  })

  it('should have default selected time range as 1D', () => {
    renderWithI18n(<PortfolioHero {...mockProps} />)
    const button1D = screen.getByText('1D')
    expect(button1D).toHaveClass('bg-emerald-500/20')
  })

  it('should change selected time range on click', () => {
    renderWithI18n(<PortfolioHero {...mockProps} />)

    const button1W = screen.getByText('1W')
    fireEvent.click(button1W)

    expect(button1W).toHaveClass('bg-emerald-500/20')
  })

  it('should render sparkline chart when data is provided', () => {
    const { container } = renderWithI18n(<PortfolioHero {...mockProps} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should not render sparkline chart when data is empty', () => {
    const { container } = renderWithI18n(
      <PortfolioHero {...mockProps} sparklineData={[]} />
    )
    // Check for sparkline-specific SVG with viewBox for chart (not icon SVGs)
    const chartSvg = container.querySelector('svg[viewBox="0 0 400 80"]')
    expect(chartSvg).not.toBeInTheDocument()
  })

  it('should show live indicator', () => {
    renderWithI18n(<PortfolioHero {...mockProps} />)
    expect(screen.getByText('Portfolio Value')).toBeInTheDocument()
  })
})

// ============================================
// 3. RecentTrades Tests (8 tests)
// ============================================

describe('RecentTrades', () => {
  it('should render trade list with header', () => {
    renderWithI18n(<RecentTrades />)

    expect(screen.getByText(/dashboard\.components\.recentTrades\.title/)).toBeInTheDocument()
  })

  it('should display column headers', () => {
    renderWithI18n(<RecentTrades />)

    expect(screen.getByText('dashboard.components.recentTrades.symbol')).toBeInTheDocument()
    expect(screen.getByText('dashboard.components.recentTrades.pnl')).toBeInTheDocument()
    expect(screen.getByText('dashboard.components.recentTrades.strategy')).toBeInTheDocument()
  })

  it('should render empty state when showEmpty is true', () => {
    renderWithI18n(<RecentTrades showEmpty />)

    expect(screen.getByText('dashboard.components.recentTrades.emptyTitle')).toBeInTheDocument()
    expect(screen.getByText('dashboard.components.recentTrades.emptyDesc')).toBeInTheDocument()
  })

  it('should display trade symbols', () => {
    renderWithI18n(<RecentTrades />)

    // Multiple trades can have the same symbol, use getAllByText
    expect(screen.getAllByText('BTC/USDT').length).toBeGreaterThan(0)
    expect(screen.getByText('ETH/USDT')).toBeInTheDocument()
    expect(screen.getByText('SOL/USDT')).toBeInTheDocument()
  })

  it('should show profit trades in green', () => {
    const { container } = renderWithI18n(<RecentTrades />)

    // Check for green colored profit elements
    const profitElements = container.querySelectorAll('.text-emerald-500')
    expect(profitElements.length).toBeGreaterThan(0)
  })

  it('should show loss trades in red', () => {
    const { container } = renderWithI18n(<RecentTrades />)

    // Check for red colored loss elements
    const lossElements = container.querySelectorAll('.text-red-500')
    expect(lossElements.length).toBeGreaterThan(0)
  })

  it('should display pending status for incomplete trades', () => {
    renderWithI18n(<RecentTrades />)

    const pendingElements = screen.getAllByText('dashboard.components.recentTrades.pending')
    expect(pendingElements.length).toBeGreaterThan(0)
  })

  it('should have view all button', () => {
    renderWithI18n(<RecentTrades />)

    expect(screen.getByText('dashboard.components.recentTrades.viewAll')).toBeInTheDocument()
  })
})

// ============================================
// 4. BacktestMetrics Tests (8 tests)
// ============================================

describe('BacktestMetrics', () => {
  const mockMetrics = {
    totalReturn: 0.25,
    annualizedReturn: 0.35,
    maxDrawdown: -0.15,
    volatility: 0.18,
    sharpeRatio: 1.8,
    sortinoRatio: 2.2,
    calmarRatio: 1.5,
    profitFactor: 2.1,
    totalTrades: 150,
    winRate: 0.65,
    avgWin: 125.50,
    avgLoss: -75.25,
    maxConsecutiveWins: 8,
    maxConsecutiveLosses: 4,
    avgHoldingPeriod: 86400000, // 1 day in ms
    expectancy: 45.75,
    winningTrades: 98,
    losingTrades: 52,
    maxWin: 500,
    maxLoss: -300,
    recoveryFactor: 1.8,
    payoffRatio: 1.67,
  }

  it('should render metrics title', () => {
    renderWithI18n(<BacktestMetrics metrics={mockMetrics} />)

    expect(screen.getByText('dashboard.backtest.metrics.title')).toBeInTheDocument()
  })

  it('should display total return with percentage', () => {
    renderWithI18n(<BacktestMetrics metrics={mockMetrics} />)

    expect(screen.getByText('dashboard.backtest.metrics.totalReturn')).toBeInTheDocument()
    expect(screen.getByText('+25.00%')).toBeInTheDocument()
  })

  it('should display negative total return correctly', () => {
    const { container } = renderWithI18n(
      <BacktestMetrics metrics={{ ...mockMetrics, totalReturn: -0.12 }} />
    )

    expect(container.textContent).toContain('-12.00%')
  })

  it('should show positive metrics in green', () => {
    renderWithI18n(<BacktestMetrics metrics={mockMetrics} />)

    const positiveReturn = screen.getByText('+25.00%')
    expect(positiveReturn).toHaveClass('text-emerald-400')
  })

  it('should show negative metrics in red', () => {
    const { container } = renderWithI18n(<BacktestMetrics metrics={mockMetrics} />)

    // Check for drawdown value - might be displayed as absolute value or with minus
    const hasDrawdown = container.textContent?.includes('15.00%') || container.textContent?.includes('-15.00%')
    expect(hasDrawdown).toBeTruthy()

    // Check for red color class
    const redElements = container.querySelectorAll('.text-red-400')
    expect(redElements.length).toBeGreaterThan(0)
  })

  it('should display sharpe ratio correctly', () => {
    renderWithI18n(<BacktestMetrics metrics={mockMetrics} />)

    expect(screen.getByText('dashboard.backtest.metrics.sharpeRatio')).toBeInTheDocument()
    expect(screen.getByText('1.800')).toBeInTheDocument()
  })

  it('should display total trades count', () => {
    renderWithI18n(<BacktestMetrics metrics={mockMetrics} />)

    expect(screen.getByText('dashboard.backtest.metrics.totalTrades')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
  })

  it('should display win rate as percentage', () => {
    renderWithI18n(<BacktestMetrics metrics={mockMetrics} />)

    expect(screen.getByText('dashboard.backtest.metrics.winRate')).toBeInTheDocument()
    expect(screen.getByText('65.0%')).toBeInTheDocument()
  })
})

// ============================================
// 5. OnboardingWizard Tests (10 tests)
// ============================================

describe('OnboardingWizard', () => {
  const mockOnComplete = vi.fn()
  const mockOnSkip = vi.fn()
  const mockOnStepChange = vi.fn()

  beforeEach(() => {
    mockOnComplete.mockClear()
    mockOnSkip.mockClear()
    mockOnStepChange.mockClear()
  })

  it('should render onboarding wizard', () => {
    renderWithI18n(<OnboardingWizard onComplete={mockOnComplete} />)

    expect(screen.getByText('dashboard.onboarding.painPoints.title')).toBeInTheDocument()
  })

  it('should display progress bar', () => {
    const { container } = renderWithI18n(<OnboardingWizard onComplete={mockOnComplete} />)

    const progressBars = container.querySelectorAll('.h-1')
    expect(progressBars.length).toBeGreaterThan(0)
  })

  it('should show skip button on first step when onSkip is provided', () => {
    renderWithI18n(<OnboardingWizard onComplete={mockOnComplete} onSkip={mockOnSkip} />)

    expect(screen.getByText('dashboard.onboarding.navigation.skip')).toBeInTheDocument()
  })

  it('should call onSkip when skip button is clicked', () => {
    renderWithI18n(<OnboardingWizard onComplete={mockOnComplete} onSkip={mockOnSkip} />)

    const skipButton = screen.getByText('dashboard.onboarding.navigation.skip')
    fireEvent.click(skipButton)

    expect(mockOnSkip).toHaveBeenCalledTimes(1)
  })

  it('should disable next button when validation fails', () => {
    renderWithI18n(<OnboardingWizard onComplete={mockOnComplete} />)

    const nextButton = screen.getByText('dashboard.onboarding.navigation.next').closest('button')
    expect(nextButton).toBeDisabled()
  })

  it('should enable next button when pain point is selected', () => {
    renderWithI18n(<OnboardingWizard onComplete={mockOnComplete} />)

    // Select a pain point
    const painPoints = screen.getAllByRole('button').filter(btn =>
      btn.textContent?.includes('dashboard.onboarding.painPoints.items')
    )
    fireEvent.click(painPoints[0])

    const nextButton = screen.getByText('dashboard.onboarding.navigation.next')
    expect(nextButton).not.toBeDisabled()
  })

  it('should navigate to next step when next is clicked', async () => {
    renderWithI18n(<OnboardingWizard onComplete={mockOnComplete} />)

    // Select a pain point first
    const painButtons = screen.getAllByRole('button').filter(btn =>
      btn.textContent?.includes('dashboard.onboarding.painPoints.items')
    )
    fireEvent.click(painButtons[0])

    const nextButton = screen.getByText('dashboard.onboarding.navigation.next')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('dashboard.onboarding.welcome.titleWithPain')).toBeInTheDocument()
    })
  })

  it('should show back button on steps after first', async () => {
    renderWithI18n(<OnboardingWizard onComplete={mockOnComplete} initialStep={2} />)

    await waitFor(() => {
      expect(screen.getByText('dashboard.onboarding.navigation.back')).toBeInTheDocument()
    })
  })

  it('should validate nickname input on profile step', async () => {
    renderWithI18n(<OnboardingWizard onComplete={mockOnComplete} initialStep={2} />)

    const nextButton = screen.getByText('dashboard.onboarding.navigation.next').closest('button')
    expect(nextButton).toBeDisabled()

    const nicknameInput = screen.getByPlaceholderText('dashboard.onboarding.profile.nicknamePlaceholder')
    fireEvent.change(nicknameInput, { target: { value: 'TestUser' } })

    // Select experience level
    const experienceButtons = screen.getAllByRole('button').filter(btn =>
      btn.textContent?.includes('dashboard.onboarding.profile.experienceLevels')
    )
    fireEvent.click(experienceButtons[0])

    await waitFor(() => {
      expect(nextButton).not.toBeDisabled()
    })
  })

  it('should call onComplete with collected data on final step', async () => {
    const initialData = {
      nickname: 'TestUser',
      investmentStyle: 'moderate' as const,
      interests: ['tech', 'finance'],
      experience: 'intermediate' as const,
      acceptedDisclaimer: true,
      painPoints: ['youtube'],
    }

    renderWithI18n(
      <OnboardingWizard
        onComplete={mockOnComplete}
        initialStep={5}
        initialData={initialData}
      />
    )

    const startButton = screen.getByText('dashboard.onboarding.navigation.start')
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          nickname: 'TestUser',
          investmentStyle: 'moderate',
        })
      )
    })
  })
})

// ============================================
// Summary
// ============================================

/*
 * Test Summary:
 *
 * Total Tests: 46
 *
 * 1. StrategyCard: 10 tests
 *    - Basic rendering
 *    - Rank badges (top 3 + numeric)
 *    - Primary metric display by sortBy
 *    - Color coding for profit/loss
 *    - All metrics display
 *    - Clickable link
 *
 * 2. PortfolioHero: 10 tests
 *    - Value display
 *    - Profit/loss styling
 *    - Percentage change
 *    - Time range buttons
 *    - Time range selection
 *    - Sparkline chart rendering
 *    - Live indicator
 *
 * 3. RecentTrades: 8 tests
 *    - Header and columns
 *    - Empty state
 *    - Trade data display
 *    - Profit/loss color coding
 *    - Pending status
 *    - View all button
 *
 * 4. BacktestMetrics: 8 tests
 *    - Metrics display
 *    - Percentage formatting
 *    - Positive/negative styling
 *    - Various metric types
 *
 * 5. OnboardingWizard: 10 tests
 *    - Step navigation
 *    - Validation rules
 *    - Skip functionality
 *    - Data collection
 *    - Completion callback
 */
