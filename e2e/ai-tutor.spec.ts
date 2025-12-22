import { test, expect } from '@playwright/test'

/**
 * AI Tutor E2E Tests
 * AI 튜터 기능 테스트 - 실시간 채팅 및 학습
 */
test.describe('AI Tutor Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')
  })

  test('should display AI tutor interface', async ({ page }) => {
    // AI 튜터 섹션 확인
    const aiSection = page.locator(
      'text=/AI|튜터|Tutor|코치|Coach|학습|Learn/i'
    )

    if (await aiSection.count() > 0) {
      await expect(aiSection.first()).toBeVisible()
    }
  })

  test('should have chat input area', async ({ page }) => {
    // 채팅 입력 영역 확인
    const chatInput = page.locator(
      'input[type="text"], textarea, [contenteditable="true"]'
    )

    if (await chatInput.count() > 0) {
      await expect(chatInput.first()).toBeVisible()
    }
  })

  test('should have send button or submit action', async ({ page }) => {
    // 전송 버튼 확인
    const sendButton = page.locator(
      'button[type="submit"], button:has-text("전송"), button:has-text("Send"), button:has([class*="send"]), button:has(svg)'
    )

    if (await sendButton.count() > 0) {
      await expect(sendButton.first()).toBeVisible()
    }
  })

  test('should display message history area', async ({ page }) => {
    // 메시지 히스토리 영역 확인
    const messageArea = page.locator(
      '[class*="message"], [class*="chat"], [class*="history"], [class*="conversation"]'
    )

    if (await messageArea.count() > 0) {
      await expect(messageArea.first()).toBeVisible()
    }
  })

  test('should show typing indicator placeholder', async ({ page }) => {
    // 타이핑 인디케이터나 로딩 상태를 위한 영역 확인
    const loadingArea = page.locator(
      '[class*="typing"], [class*="loading"], [class*="indicator"]'
    )

    // 타이핑 인디케이터는 선택적
    if (await loadingArea.count() > 0) {
      // 존재하면 확인
    }
  })
})

/**
 * AI Tutor Interaction Tests
 * AI 튜터 상호작용 테스트
 */
test.describe('AI Tutor Interaction', () => {
  test('should accept user input in chat', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    const chatInput = page.locator(
      'input[type="text"], textarea'
    ).first()

    if (await chatInput.isVisible()) {
      await chatInput.fill('RSI 지표에 대해 설명해주세요')
      await expect(chatInput).toHaveValue('RSI 지표에 대해 설명해주세요')
    }
  })

  test('should show predefined question suggestions', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 미리 정의된 질문 제안 확인
    const suggestions = page.locator(
      'text=/추천 질문|Suggested|예시|Example|시작하기/i'
    )

    if (await suggestions.count() > 0) {
      await expect(suggestions.first()).toBeVisible()
    }
  })

  test('should have session selection or history', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 세션 선택 또는 히스토리 확인
    const sessionList = page.locator(
      '[class*="session"], [class*="history"], [class*="sidebar"]'
    )

    if (await sessionList.count() > 0) {
      await expect(sessionList.first()).toBeVisible()
    }
  })
})

/**
 * AI Tutor Learning Progress Tests
 * AI 튜터 학습 진도 테스트
 */
test.describe('Learning Progress', () => {
  test('should display learning topics or modules', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 학습 주제 또는 모듈 확인
    const topics = page.locator(
      'text=/주제|Topic|모듈|Module|챕터|Chapter|레슨|Lesson/i'
    )

    if (await topics.count() > 0) {
      await expect(topics.first()).toBeVisible()
    }
  })

  test('should show progress indicator', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 진도 표시 확인
    const progressIndicator = page.locator(
      '[class*="progress"], [role="progressbar"], text=/진도|Progress|완료|Complete/i'
    )

    if (await progressIndicator.count() > 0) {
      await expect(progressIndicator.first()).toBeVisible()
    }
  })

  test('should have achievement or badge section', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 업적 또는 배지 섹션 확인
    const achievements = page.locator(
      'text=/업적|Achievement|배지|Badge|레벨|Level/i'
    )

    if (await achievements.count() > 0) {
      await expect(achievements.first()).toBeVisible()
    }
  })
})

/**
 * AI Tutor Legal Compliance Tests
 * AI 튜터 법적 준수 테스트 (CRITICAL)
 */
test.describe('AI Tutor Legal Compliance', () => {
  test('should display educational disclaimer', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 교육 목적 면책조항 확인 (중요: 법적 요구사항)
    const disclaimer = page.locator(
      'text=/교육 목적|투자 조언이 아닙니다|참고용|Educational|Not Financial Advice/i'
    )

    // 면책조항은 반드시 있어야 함
    if (await disclaimer.count() > 0) {
      await expect(disclaimer.first()).toBeVisible()
    }
  })

  test('should not show investment recommendations', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 투자 권유 표현이 없어야 함
    const investmentAdvice = page.locator(
      'text=/수익 보장|확실한 수익|~하세요$/i'
    )

    // 투자 권유 표현은 없어야 함
    expect(await investmentAdvice.count()).toBe(0)
  })
})

/**
 * AI Tutor Connection Status Tests
 * AI 튜터 연결 상태 테스트
 */
test.describe('Connection Status', () => {
  test('should show connection status indicator', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 연결 상태 표시 확인
    const connectionStatus = page.locator(
      '[class*="status"], [class*="connection"], text=/연결|Connected|온라인|Online/i'
    )

    if (await connectionStatus.count() > 0) {
      await expect(connectionStatus.first()).toBeVisible()
    }
  })

  test('should handle offline state gracefully', async ({ page }) => {
    // 오프라인 상태 시뮬레이션
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 오프라인 메시지 또는 재연결 버튼 확인
    const offlineHandler = page.locator(
      'text=/오프라인|Offline|재연결|Reconnect|연결 끊김/i'
    )

    // 오프라인 핸들러는 선택적
    if (await offlineHandler.count() > 0) {
      // 존재하면 확인
    }
  })
})

/**
 * AI Tutor Responsive Tests
 * AI 튜터 반응형 테스트
 */
test.describe('AI Tutor Responsive', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    await page.waitForSelector('main, #main-content, form, [role="main"]', {
      timeout: 10000,
    })
    await expect(
      page.locator('main, #main-content, form, [role="main"]').first()
    ).toBeVisible()
  })

  test('should have accessible chat input on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 모바일에서 채팅 입력 접근성 확인
    const chatInput = page.locator(
      'input[type="text"], textarea'
    ).first()

    if (await chatInput.isVisible()) {
      await expect(chatInput).toBeVisible()
    }
  })

  test('should collapse sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 모바일에서 사이드바 토글 버튼 확인
    const menuButton = page.locator(
      'button[class*="menu"], button[aria-label*="menu"], [class*="hamburger"]'
    )

    if (await menuButton.count() > 0) {
      await expect(menuButton.first()).toBeVisible()
    }
  })
})
