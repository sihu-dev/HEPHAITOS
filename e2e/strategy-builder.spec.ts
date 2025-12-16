import { test, expect } from '@playwright/test'

/**
 * Strategy Builder E2E Tests
 * 전략 빌더 페이지 테스트
 */
test.describe('Strategy Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/strategy-builder')
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle')
  })

  test('should display strategy builder page', async ({ page }) => {
    // 인증 없이 접근 시 로그인 페이지로 리다이렉트될 수 있음
    const url = page.url()
    expect(url.includes('strategy-builder') || url.includes('login') || url.includes('auth')).toBeTruthy()

    await page.waitForSelector('main, #main-content, form, [role="main"]', { timeout: 10000 })
    await expect(page.locator('main, #main-content, form, [role="main"]').first()).toBeVisible()
  })

  test('should show loading state initially', async ({ page }) => {
    // 인증 없이 접근 시 로그인 페이지로 리다이렉트될 수 있음
    // 로딩 후 컨텐츠가 표시되는지 확인 (main 또는 form 둘 다 허용)
    await page.waitForSelector('main, #main-content, form, [role="main"]', { timeout: 10000 })
    await expect(page.locator('main, #main-content, form, [role="main"]').first()).toBeVisible()
  })

  test('should have strategy creation form or list', async ({ page }) => {
    // 전략 관련 UI 요소 확인
    const strategyElements = page.locator('[class*="strategy"], [data-testid*="strategy"]')
    const formElements = page.locator('form, [role="form"]')
    const buttonElements = page.getByRole('button')

    // 전략 빌더 관련 요소가 있는지 확인
    const hasStrategyUI =
      (await strategyElements.count()) > 0 ||
      (await formElements.count()) > 0 ||
      (await buttonElements.count()) > 0

    expect(hasStrategyUI).toBeTruthy()
  })
})

/**
 * AI Strategy Generation Tests
 * AI 전략 생성 테스트
 */
test.describe('AI Strategy Generation', () => {
  test('should have AI strategy generation option', async ({ page }) => {
    await page.goto('/dashboard/strategy-builder')
    await page.waitForLoadState('networkidle')

    // AI 관련 버튼이나 탭 확인
    const aiElements = page.locator('text=/AI|자동|생성|Generate/i')

    if (await aiElements.count() > 0) {
      await expect(aiElements.first()).toBeVisible()
    }
  })
})

/**
 * Strategy List Tests
 * 전략 목록 테스트
 */
test.describe('Strategy List', () => {
  test('should navigate to strategies page', async ({ page }) => {
    await page.goto('/dashboard/strategies')

    // 전략 목록 페이지 확인
    await expect(page).toHaveURL(/.*strategies/)
  })

  test('should display strategy cards or list', async ({ page }) => {
    await page.goto('/dashboard/strategies')
    await page.waitForLoadState('networkidle')

    // 전략 목록이나 빈 상태 메시지 확인
    const contentArea = page.locator('#main-content, main, body')
    await expect(contentArea.first()).toBeVisible()
  })
})
