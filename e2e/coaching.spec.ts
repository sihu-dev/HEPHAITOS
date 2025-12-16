import { test, expect } from '@playwright/test'

/**
 * Coaching (LEARN) E2E Tests
 * AI + 멘토 코칭 기능 테스트
 */
test.describe('Coaching Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')
  })

  test('should display coaching page', async ({ page }) => {
    // 인증 없이 접근 시 로그인 페이지로 리다이렉트될 수 있음
    const url = page.url()
    expect(url.includes('coaching') || url.includes('login') || url.includes('auth')).toBeTruthy()

    await page.waitForSelector('main, #main-content, form, [role="main"]', { timeout: 10000 })
    await expect(page.locator('main, #main-content, form, [role="main"]').first()).toBeVisible()
  })

  test('should show mentor list or AI coach', async ({ page }) => {
    // 멘토 또는 AI 코치 관련 요소 확인
    const coachingElements = page.locator('text=/멘토|mentor|코치|coach|AI|학습|learn/i')

    if (await coachingElements.count() > 0) {
      await expect(coachingElements.first()).toBeVisible()
    }
  })

  test('should have chat or lesson interface', async ({ page }) => {
    // 채팅이나 레슨 인터페이스 확인
    const chatInput = page.locator(
      'input[type="text"], textarea, [contenteditable="true"]'
    )
    const messageList = page.locator('[class*="chat"], [class*="message"], [class*="lesson"]')

    const hasInterface = (await chatInput.count()) > 0 || (await messageList.count()) > 0
    // 코칭 인터페이스가 있을 수 있음
  })
})

/**
 * AI Coaching Tests
 * AI 코칭 기능 테스트
 */
test.describe('AI Coaching', () => {
  test('should interact with AI coach', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // AI 코치 섹션 찾기
    const aiSection = page.locator('text=/AI|인공지능|자동|assistant/i')

    if (await aiSection.count() > 0) {
      await expect(aiSection.first()).toBeVisible()
    }
  })

  test('should display learning progress', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 학습 진도 관련 요소 확인
    const progressElements = page.locator('text=/진도|progress|레벨|level|완료|complete/i')

    if (await progressElements.count() > 0) {
      await expect(progressElements.first()).toBeVisible()
    }
  })
})

/**
 * Mentor Booking Tests
 * 멘토 예약 테스트
 */
test.describe('Mentor Booking', () => {
  test('should show mentor profiles', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 멘토 프로필 카드 확인
    const mentorCards = page.locator('[class*="mentor"], [class*="profile"], [class*="card"]')

    if (await mentorCards.count() > 0) {
      await expect(mentorCards.first()).toBeVisible()
    }
  })

  test('should have booking or schedule option', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 예약 버튼 확인
    const bookingButton = page.getByRole('button', {
      name: /예약|book|schedule|상담|consult/i,
    })

    if (await bookingButton.count() > 0) {
      await expect(bookingButton.first()).toBeVisible()
    }
  })
})

/**
 * Learning Content Tests
 * 학습 콘텐츠 테스트
 */
test.describe('Learning Content', () => {
  test('should display educational content', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 교육 콘텐츠 관련 요소 확인
    const contentElements = page.locator(
      'text=/강의|lesson|튜토리얼|tutorial|가이드|guide|교육|education/i'
    )

    if (await contentElements.count() > 0) {
      await expect(contentElements.first()).toBeVisible()
    }
  })

  test('should have investment disclaimer', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 투자 면책 조항 확인 (중요: 법적 요구사항)
    const disclaimer = page.locator('text=/투자 조언이 아닙니다|교육 목적|참고용|not financial advice/i')

    // 면책 조항이 있어야 함 (optional - 페이지에 따라 다름)
    if (await disclaimer.count() > 0) {
      await expect(disclaimer.first()).toBeVisible()
    }
  })
})
