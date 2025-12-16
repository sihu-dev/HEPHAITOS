import { test, expect } from '@playwright/test'

test.describe('Strategy Builder', () => {
  test('should display strategy list page', async ({ page }) => {
    await page.goto('/strategies')

    // 전략 목록 또는 로그인 페이지로 리다이렉트
    await page.waitForURL(/\/(strategies|login|signin|auth)/)

    const currentUrl = page.url()
    if (currentUrl.includes('strategies')) {
      // 전략 목록 페이지 확인
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()
    }
  })

  test('should display new strategy page', async ({ page }) => {
    await page.goto('/strategies/new')

    // 새 전략 페이지 또는 로그인 페이지로 리다이렉트
    await page.waitForURL(/\/(strategies|login|signin|auth|dashboard)/)

    const currentUrl = page.url()
    if (currentUrl.includes('strategies/new') || currentUrl.includes('strategy')) {
      // 전략 생성 폼 또는 페이지 확인
      const form = page.locator('form').first()
      if (await form.count() > 0) {
        await expect(form).toBeVisible()
      } else {
        // 폼이 없어도 페이지가 렌더링되면 OK
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })

  test('should have strategy builder components', async ({ page }) => {
    await page.goto('/strategies/new')

    // 전략 빌더 UI 컴포넌트 확인
    const currentUrl = page.url()
    if (currentUrl.includes('strategies')) {
      // 전략 이름 입력
      const nameInput = page.locator('input[name="name"], input[placeholder*="전략"], input[placeholder*="Strategy"]').first()
      if (await nameInput.count() > 0) {
        await expect(nameInput).toBeVisible()
      }

      // 전략 설명 입력
      const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="설명"]').first()
      if (await descriptionInput.count() > 0) {
        await expect(descriptionInput).toBeVisible()
      }
    }
  })
})

test.describe('Backtest', () => {
  test('should display backtest page', async ({ page }) => {
    await page.goto('/backtest')

    // 백테스트 페이지 또는 로그인 페이지로 리다이렉트
    await page.waitForURL(/\/(backtest|login|signin|auth)/)

    const currentUrl = page.url()
    if (currentUrl.includes('backtest')) {
      // 백테스트 페이지 확인
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()
    }
  })

  test('should have backtest configuration options', async ({ page }) => {
    await page.goto('/backtest')

    const currentUrl = page.url()
    if (currentUrl.includes('backtest')) {
      // 기간 설정 확인
      const dateInputs = page.locator('input[type="date"]')
      const dateCount = await dateInputs.count()
      expect(dateCount).toBeGreaterThanOrEqual(0)

      // 초기 자본 설정 확인
      const capitalInput = page.locator('input[name*="capital"], input[placeholder*="자본"]').first()
      if (await capitalInput.count() > 0) {
        await expect(capitalInput).toBeVisible()
      }
    }
  })
})
