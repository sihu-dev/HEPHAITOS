import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should display the home page correctly', async ({ page }) => {
    await page.goto('/')

    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/HEPHAITOS/)

    // 히어로 섹션 확인
    const heroSection = page.locator('[data-testid="hero-section"]').first()
    if (await heroSection.count() > 0) {
      await expect(heroSection).toBeVisible()
    }

    // 메인 헤딩이나 로고 확인
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto('/')

    // 네비게이션 바 확인
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible()

    // 로그인 또는 시작하기 버튼 확인
    const ctaButton = page.locator('a[href*="login"], a[href*="signup"], button:has-text("시작"), button:has-text("Start")').first()
    if (await ctaButton.count() > 0) {
      await expect(ctaButton).toBeVisible()
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // 페이지가 정상적으로 로드되는지 확인
    await expect(page.locator('body')).toBeVisible()

    // 모바일 메뉴 버튼 확인 (있는 경우)
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"], button[aria-label*="menu"]').first()
    if (await mobileMenuButton.count() > 0) {
      await expect(mobileMenuButton).toBeVisible()
    }
  })

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 심각한 콘솔 에러가 없는지 확인
    const criticalErrors = consoleErrors.filter(
      error => !error.includes('favicon') && !error.includes('hydration')
    )
    expect(criticalErrors).toHaveLength(0)
  })
})
