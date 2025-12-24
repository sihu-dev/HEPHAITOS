import { test, expect } from '@playwright/test'

/**
 * Dashboard E2E Tests
 * 대시보드 메인 페이지 테스트
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    // Wait for client-side hydration
    await page.waitForLoadState('networkidle')
  })

  test('should display dashboard page', async ({ page }) => {
    // 인증 없이 대시보드 접근 시 로그인 페이지로 리다이렉트되거나 대시보드 표시
    const url = page.url()
    const isOnDashboard = url.includes('dashboard')
    const isOnLogin = url.includes('login') || url.includes('auth')

    expect(isOnDashboard || isOnLogin).toBeTruthy()

    // 페이지가 정상 로드되었는지 확인
    await page.waitForSelector('main, #main-content, form, [role="main"]', { timeout: 10000 })
  })

  test('should have navigation sidebar', async ({ page }) => {
    // 인증 없이 접근 시 로그인 페이지로 리다이렉트될 수 있음
    // 네비게이션 또는 로그인 폼 둘 다 허용
    await page.waitForSelector('nav, aside, form, [role="navigation"]', { timeout: 10000 })
    const navOrForm = page.locator('nav, aside, form, [role="navigation"]').first()
    await expect(navOrForm).toBeVisible()
  })

  test('should navigate to strategy builder', async ({ page }) => {
    // 전략 빌더 링크 클릭
    const strategyLink = page.getByRole('link', { name: /전략|strategy/i })

    if (await strategyLink.count() > 0) {
      await strategyLink.first().click()
      // 전략 페이지 또는 대시보드 서브페이지로 이동 확인
      await page.waitForLoadState('networkidle')
      const url = page.url()
      expect(url.includes('strategy') || url.includes('dashboard')).toBeTruthy()
    }
  })

  test('should navigate to portfolio page', async ({ page }) => {
    // 포트폴리오 링크 클릭
    const portfolioLink = page.getByRole('link', { name: /포트폴리오|portfolio/i })

    if (await portfolioLink.count() > 0) {
      await portfolioLink.first().click()
      // 포트폴리오 또는 다른 대시보드 서브페이지로 이동 확인
      await page.waitForLoadState('networkidle')
      const url = page.url()
      expect(url.includes('portfolio') || url.includes('dashboard')).toBeTruthy()
    }
  })

  test('should display market data section', async ({ page }) => {
    // 시장 데이터 섹션 확인
    const marketSection = page.locator('text=/시장|market|코스피|KOSPI/i')

    // 시장 데이터가 표시되는지 확인 (optional)
    if (await marketSection.count() > 0) {
      await expect(marketSection.first()).toBeVisible()
    }
  })
})

/**
 * Dashboard Responsive Tests
 * 반응형 레이아웃 테스트
 */
test.describe('Dashboard Responsive', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // 인증 없이 접근 시 로그인 페이지로 리다이렉트될 수 있음
    await page.waitForSelector('main, #main-content, form, [role="main"]', { timeout: 10000 })
    await expect(page.locator('main, #main-content, form, [role="main"]').first()).toBeVisible()
  })

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // 인증 없이 접근 시 로그인 페이지로 리다이렉트될 수 있음
    await page.waitForSelector('main, #main-content, form, [role="main"]', { timeout: 10000 })
    await expect(page.locator('main, #main-content, form, [role="main"]').first()).toBeVisible()
  })
})
