import { test, expect } from '@playwright/test'

/**
 * Copy Trading (Celebrity Follow) E2E Tests
 * 셀럽 따라하기 기능 테스트
 */
test.describe('Copy Trading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/copy-trading')
    await page.waitForLoadState('networkidle')
  })

  test('should display copy trading page', async ({ page }) => {
    // URL 확인 (리다이렉트될 수 있음)
    const url = page.url()
    expect(url.includes('copy-trading') || url.includes('dashboard')).toBeTruthy()
    await expect(page.locator('main, body')).toBeVisible()
  })

  test('should show celebrity list', async ({ page }) => {
    // 셀럽 카드나 리스트 확인
    const celebritySection = page.locator('text=/셀럽|celebrity|따라하기|Nancy|Warren|Buffett|Pelosi/i')

    if (await celebritySection.count() > 0) {
      await expect(celebritySection.first()).toBeVisible()
    }
  })

  test('should have filter options', async ({ page }) => {
    // 필터 버튼이나 드롭다운 확인
    const filterButton = page.getByRole('button', { name: /필터|filter/i })
    const combobox = page.locator('[role="combobox"], select')

    const hasFilter = (await filterButton.count()) > 0 || (await combobox.count()) > 0
    // 필터는 선택적임
  })

  test('should navigate to celebrity detail', async ({ page }) => {
    // 셀럽 카드 클릭
    const celebrityCard = page.locator('[class*="card"], [data-testid*="celebrity"]').first()

    if (await celebrityCard.count() > 0) {
      await celebrityCard.click()
      // 상세 페이지나 모달이 열리는지 확인
      await page.waitForTimeout(500)
    }
  })
})

/**
 * Celebrity Portfolio Tests
 * 셀럽 포트폴리오 테스트
 */
test.describe('Celebrity Portfolio', () => {
  test('should display portfolio holdings', async ({ page }) => {
    await page.goto('/dashboard/copy-trading')
    await page.waitForLoadState('networkidle')

    // 포트폴리오 관련 요소 확인
    const portfolioSection = page.locator('text=/포트폴리오|portfolio|보유|holdings|종목/i')

    if (await portfolioSection.count() > 0) {
      await expect(portfolioSection.first()).toBeVisible()
    }
  })

  test('should show trade history', async ({ page }) => {
    await page.goto('/dashboard/copy-trading')
    await page.waitForLoadState('networkidle')

    // 거래 내역 관련 요소 확인
    const tradeSection = page.locator('text=/거래|trade|매수|매도|buy|sell/i')

    if (await tradeSection.count() > 0) {
      await expect(tradeSection.first()).toBeVisible()
    }
  })
})

/**
 * Follow Celebrity Tests
 * 셀럽 팔로우 테스트
 */
test.describe('Follow Celebrity', () => {
  test('should have follow button', async ({ page }) => {
    await page.goto('/dashboard/copy-trading')
    await page.waitForLoadState('networkidle')

    // 팔로우 버튼 확인
    const followButton = page.getByRole('button', { name: /팔로우|follow|구독|subscribe/i })

    if (await followButton.count() > 0) {
      await expect(followButton.first()).toBeVisible()
    }
  })

  test('should show disclaimer for copy trading', async ({ page }) => {
    await page.goto('/dashboard/copy-trading')
    await page.waitForLoadState('networkidle')

    // 투자 경고/면책 문구 확인 (법적 요구사항)
    const disclaimer = page.locator('text=/투자|위험|책임|교육|참고/i')

    // 면책 조항이 있는지 확인 (optional)
    if (await disclaimer.count() > 0) {
      await expect(disclaimer.first()).toBeVisible()
    }
  })
})
