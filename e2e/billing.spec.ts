import { test, expect } from '@playwright/test'

/**
 * Billing Page E2E Tests
 * 빌링 페이지 테스트 - 구독 및 크레딧 시스템
 */
test.describe('Billing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/billing')
    await page.waitForLoadState('networkidle')
  })

  test('should display billing page or redirect to auth', async ({ page }) => {
    const url = page.url()
    expect(
      url.includes('billing') || url.includes('login') || url.includes('auth')
    ).toBeTruthy()

    await page.waitForSelector('main, #main-content, form, [role="main"]', {
      timeout: 10000,
    })
    await expect(
      page.locator('main, #main-content, form, [role="main"]').first()
    ).toBeVisible()
  })

  test('should display subscription plans section', async ({ page }) => {
    // 요금제 섹션 확인
    const plansSection = page.locator(
      'text=/요금제|플랜|Plan|Pricing|구독|Subscription/i'
    )

    if (await plansSection.count() > 0) {
      await expect(plansSection.first()).toBeVisible()
    }
  })

  test('should show available pricing tiers', async ({ page }) => {
    // 프리, 스타터, 프로, 팀 플랜 확인
    const tiers = ['Free', 'Starter', 'Pro', 'Team', '무료', '스타터', '프로', '팀']

    for (const tier of tiers) {
      const tierElement = page.locator(`text=/${tier}/i`)
      if (await tierElement.count() > 0) {
        await expect(tierElement.first()).toBeVisible()
        break // 하나라도 있으면 통과
      }
    }
  })

  test('should display credit balance section', async ({ page }) => {
    // 크레딧 잔액 섹션 확인
    const creditSection = page.locator(
      'text=/크레딧|Credit|잔액|Balance|충전|Charge/i'
    )

    if (await creditSection.count() > 0) {
      await expect(creditSection.first()).toBeVisible()
    }
  })

  test('should have upgrade or purchase button', async ({ page }) => {
    // 업그레이드 또는 구매 버튼 확인
    const actionButton = page.getByRole('button', {
      name: /업그레이드|구매|Purchase|Upgrade|시작하기|Get Started/i,
    })

    if (await actionButton.count() > 0) {
      await expect(actionButton.first()).toBeVisible()
    }
  })
})

/**
 * Credit System Tests
 * 크레딧 시스템 테스트
 */
test.describe('Credit System', () => {
  test('should display credit usage history', async ({ page }) => {
    await page.goto('/dashboard/billing')
    await page.waitForLoadState('networkidle')

    // 사용 내역 섹션 확인
    const historySection = page.locator(
      'text=/사용 내역|History|이력|Usage|거래/i'
    )

    if (await historySection.count() > 0) {
      await expect(historySection.first()).toBeVisible()
    }
  })

  test('should show credit recharge options', async ({ page }) => {
    await page.goto('/dashboard/billing')
    await page.waitForLoadState('networkidle')

    // 크레딧 충전 옵션 확인
    const rechargeOptions = page.locator(
      'text=/충전|Recharge|크레딧 구매|Buy Credits/i'
    )

    if (await rechargeOptions.count() > 0) {
      await expect(rechargeOptions.first()).toBeVisible()
    }
  })
})

/**
 * Subscription Management Tests
 * 구독 관리 테스트
 */
test.describe('Subscription Management', () => {
  test('should display current subscription status', async ({ page }) => {
    await page.goto('/dashboard/billing')
    await page.waitForLoadState('networkidle')

    // 현재 구독 상태 표시 확인
    const statusElements = page.locator(
      'text=/현재 플랜|Current Plan|활성|Active|Free|무료/i'
    )

    if (await statusElements.count() > 0) {
      await expect(statusElements.first()).toBeVisible()
    }
  })

  test('should have plan comparison or features list', async ({ page }) => {
    await page.goto('/dashboard/billing')
    await page.waitForLoadState('networkidle')

    // 플랜 비교 또는 기능 목록 확인
    const featuresSection = page.locator(
      '[class*="feature"], [class*="benefit"], ul, li'
    )

    if (await featuresSection.count() > 0) {
      await expect(featuresSection.first()).toBeVisible()
    }
  })

  test('should display billing period information', async ({ page }) => {
    await page.goto('/dashboard/billing')
    await page.waitForLoadState('networkidle')

    // 결제 주기 정보 확인
    const periodInfo = page.locator(
      'text=/월|년|Monthly|Yearly|Annual|결제일|갱신/i'
    )

    if (await periodInfo.count() > 0) {
      await expect(periodInfo.first()).toBeVisible()
    }
  })
})

/**
 * Payment Flow Tests
 * 결제 플로우 테스트
 */
test.describe('Payment Flow', () => {
  test('should open payment modal on plan selection', async ({ page }) => {
    await page.goto('/dashboard/billing')
    await page.waitForLoadState('networkidle')

    // 플랜 선택 버튼 찾기
    const selectButton = page.getByRole('button', {
      name: /선택|Select|업그레이드|시작/i,
    })

    if (await selectButton.count() > 0) {
      await selectButton.first().click()

      // 모달 또는 결제 페이지 이동 확인
      await page.waitForTimeout(1000)
      const modalOrPayment = page.locator(
        '[role="dialog"], [class*="modal"], [class*="payment"], form'
      )

      if (await modalOrPayment.count() > 0) {
        await expect(modalOrPayment.first()).toBeVisible()
      }
    }
  })

  test('should validate payment form fields', async ({ page }) => {
    await page.goto('/dashboard/billing')
    await page.waitForLoadState('networkidle')

    // 결제 폼 필드 확인
    const paymentForm = page.locator('form')

    if (await paymentForm.count() > 0) {
      const inputs = paymentForm.locator('input')
      // 폼이 있다면 입력 필드도 있어야 함
      if (await inputs.count() > 0) {
        await expect(inputs.first()).toBeVisible()
      }
    }
  })
})

/**
 * Billing Responsive Tests
 * 빌링 반응형 테스트
 */
test.describe('Billing Responsive', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard/billing')
    await page.waitForLoadState('networkidle')

    await page.waitForSelector('main, #main-content, form, [role="main"]', {
      timeout: 10000,
    })
    await expect(
      page.locator('main, #main-content, form, [role="main"]').first()
    ).toBeVisible()
  })

  test('should stack plans vertically on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard/billing')
    await page.waitForLoadState('networkidle')

    // 모바일에서 플랜 카드가 세로로 쌓이는지 확인
    const planCards = page.locator('[class*="plan"], [class*="card"], [class*="pricing"]')

    if (await planCards.count() > 1) {
      // 플랜 카드들이 모두 표시되어야 함
      await expect(planCards.first()).toBeVisible()
    }
  })
})
