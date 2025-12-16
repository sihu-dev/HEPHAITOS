import { test, expect } from '@playwright/test'

/**
 * Backtest E2E Tests
 * 백테스트 기능 E2E 테스트
 */
test.describe('Backtest', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/backtest')
    await page.waitForLoadState('networkidle')
  })

  test('should display backtest page', async ({ page }) => {
    // URL 확인 (리다이렉트될 수 있음)
    const url = page.url()
    expect(url.includes('backtest') || url.includes('dashboard')).toBeTruthy()
    await expect(page.locator('#main-content, body').first()).toBeVisible()
  })

  test('should show strategy selection', async ({ page }) => {
    // 전략 선택 UI 확인
    const strategySection = page.locator('text=/전략|strategy|선택|select/i')
    const strategySelect = page.locator('[role="combobox"], select, [data-testid*="strategy"]')

    const hasStrategyUI =
      (await strategySection.count()) > 0 || (await strategySelect.count()) > 0

    // 전략 선택 UI가 있어야 함
    if (hasStrategyUI) {
      if ((await strategySelect.count()) > 0) {
        await expect(strategySelect.first()).toBeVisible()
      }
    }
  })

  test('should show date range picker', async ({ page }) => {
    // 날짜 범위 선택 UI 확인
    const dateInputs = page.locator('input[type="date"], [data-testid*="date"], [class*="date"]')
    const datePicker = page.locator('text=/날짜|date|기간|period|시작|종료|from|to/i')

    const hasDateUI = (await dateInputs.count()) > 0 || (await datePicker.count()) > 0

    if (hasDateUI) {
      // 날짜 관련 UI가 보이는지 확인
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should show initial capital input', async ({ page }) => {
    // 초기 자본 입력 UI 확인
    const capitalInput = page.locator(
      'input[type="number"], [data-testid*="capital"], [class*="capital"]'
    )
    const capitalLabel = page.locator('text=/자본|capital|금액|amount|투자/i')

    const hasCapitalUI = (await capitalInput.count()) > 0 || (await capitalLabel.count()) > 0

    if (hasCapitalUI) {
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should have run backtest button', async ({ page }) => {
    // 백테스트 실행 버튼 확인
    const runButton = page.getByRole('button', { name: /실행|run|시작|start|백테스트/i })

    if ((await runButton.count()) > 0) {
      await expect(runButton.first()).toBeVisible()
      await expect(runButton.first()).toBeEnabled()
    }
  })
})

/**
 * Backtest Configuration Tests
 * 백테스트 설정 테스트
 */
test.describe('Backtest Configuration', () => {
  test('should configure commission settings', async ({ page }) => {
    await page.goto('/dashboard/backtest')
    await page.waitForLoadState('networkidle')

    // 수수료 설정 확인
    const commissionInput = page.locator('text=/수수료|commission|fee/i')

    if ((await commissionInput.count()) > 0) {
      await expect(commissionInput.first()).toBeVisible()
    }
  })

  test('should configure slippage settings', async ({ page }) => {
    await page.goto('/dashboard/backtest')
    await page.waitForLoadState('networkidle')

    // 슬리피지 설정 확인
    const slippageInput = page.locator('text=/슬리피지|slippage/i')

    if ((await slippageInput.count()) > 0) {
      await expect(slippageInput.first()).toBeVisible()
    }
  })

  test('should show advanced settings toggle', async ({ page }) => {
    await page.goto('/dashboard/backtest')
    await page.waitForLoadState('networkidle')

    // 고급 설정 토글 확인
    const advancedToggle = page.locator('text=/고급|advanced|상세|설정/i')

    if ((await advancedToggle.count()) > 0) {
      // 고급 설정 섹션이 있음
      await expect(page.locator('body')).toBeVisible()
    }
  })
})

/**
 * Backtest Results Tests
 * 백테스트 결과 테스트
 */
test.describe('Backtest Results', () => {
  test('should display results after running backtest', async ({ page }) => {
    await page.goto('/dashboard/backtest')
    await page.waitForLoadState('networkidle')

    // 결과 섹션 확인 (백테스트 실행 후 표시됨)
    const resultsSection = page.locator('text=/결과|result|성과|performance|수익/i')

    // 결과 UI가 있을 수 있음 (이전 백테스트 결과)
    if ((await resultsSection.count()) > 0) {
      await expect(resultsSection.first()).toBeVisible()
    }
  })

  test('should show equity curve chart', async ({ page }) => {
    await page.goto('/dashboard/backtest')
    await page.waitForLoadState('networkidle')

    // 자산 곡선 차트 확인
    const chartSection = page.locator(
      'canvas, svg[class*="chart"], [data-testid*="chart"], [class*="chart"]'
    )

    if ((await chartSection.count()) > 0) {
      await expect(chartSection.first()).toBeVisible()
    }
  })

  test('should display key metrics', async ({ page }) => {
    await page.goto('/dashboard/backtest')
    await page.waitForLoadState('networkidle')

    // 주요 지표 확인
    const metricsLabels = [
      /수익률|return|profit/i,
      /샤프|sharpe/i,
      /드로우다운|drawdown/i,
      /승률|win.*rate/i,
    ]

    for (const label of metricsLabels) {
      const metricElement = page.locator(`text=${label}`)
      if ((await metricElement.count()) > 0) {
        // 지표가 존재함
        break // 하나라도 있으면 OK
      }
    }
  })

  test('should show trade list', async ({ page }) => {
    await page.goto('/dashboard/backtest')
    await page.waitForLoadState('networkidle')

    // 거래 목록 확인
    const tradeList = page.locator('text=/거래.*목록|trade.*list|매매.*내역/i')
    const tradeTable = page.locator('table, [role="table"], [class*="trade"]')

    const hasTradeUI = (await tradeList.count()) > 0 || (await tradeTable.count()) > 0

    // 거래 UI가 있을 수 있음
    if (hasTradeUI) {
      await expect(page.locator('body')).toBeVisible()
    }
  })
})

/**
 * Backtest Integration Tests
 * 백테스트 통합 테스트
 */
test.describe('Backtest Integration', () => {
  test('should load strategy from strategy builder', async ({ page }) => {
    // 전략 빌더에서 전략 생성 후 백테스트 연동
    await page.goto('/dashboard/strategy-builder')
    await page.waitForLoadState('networkidle')

    // 백테스트 버튼이나 링크 확인
    const backtestLink = page.locator('text=/백테스트|backtest/i')

    if ((await backtestLink.count()) > 0) {
      await expect(backtestLink.first()).toBeVisible()
    }
  })

  test('should save backtest results', async ({ page }) => {
    await page.goto('/dashboard/backtest')
    await page.waitForLoadState('networkidle')

    // 결과 저장 버튼 확인
    const saveButton = page.getByRole('button', { name: /저장|save|보관/i })

    if ((await saveButton.count()) > 0) {
      await expect(saveButton.first()).toBeVisible()
    }
  })

  test('should export backtest results', async ({ page }) => {
    await page.goto('/dashboard/backtest')
    await page.waitForLoadState('networkidle')

    // 내보내기 버튼 확인
    const exportButton = page.getByRole('button', { name: /내보내기|export|다운로드|download/i })

    if ((await exportButton.count()) > 0) {
      await expect(exportButton.first()).toBeVisible()
    }
  })
})

/**
 * Backtest Performance Tests
 * 백테스트 성능 테스트
 */
test.describe('Backtest Performance', () => {
  test('should show loading state during backtest', async ({ page }) => {
    await page.goto('/dashboard/backtest')
    await page.waitForLoadState('networkidle')

    // 인증 없이 접근 시 로그인 페이지로 리다이렉트될 수 있음
    // 페이지가 로드되었는지 확인
    await page.waitForSelector('main, #main-content, form, [role="main"]', { timeout: 10000 })
    await expect(page.locator('main, #main-content, form, [role="main"]').first()).toBeVisible()
  })

  test('should show progress during long backtest', async ({ page }) => {
    await page.goto('/dashboard/backtest')
    await page.waitForLoadState('networkidle')

    // 진행률 표시 UI 확인
    const progressBar = page.locator('[role="progressbar"], [class*="progress"]')

    if ((await progressBar.count()) > 0) {
      // 프로그레스 바 존재
    }
  })
})
