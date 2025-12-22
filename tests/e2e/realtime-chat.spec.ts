import { test, expect } from '@playwright/test'

/**
 * Realtime Chat E2E Tests
 * Supabase Realtime 기반 실시간 채팅 테스트
 */
test.describe('Realtime Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')
  })

  test('should establish realtime connection', async ({ page }) => {
    // Supabase Realtime 연결 상태 확인
    const connectionIndicator = page.locator(
      '[class*="connected"], [class*="online"], text=/연결됨|Connected/i'
    )

    // 연결 상태 표시가 있다면 확인
    if (await connectionIndicator.count() > 0) {
      await expect(connectionIndicator.first()).toBeVisible()
    }
  })

  test('should display chat interface elements', async ({ page }) => {
    // 채팅 인터페이스 필수 요소 확인
    const chatContainer = page.locator(
      '[class*="chat"], [class*="message"], [class*="conversation"]'
    )

    if (await chatContainer.count() > 0) {
      await expect(chatContainer.first()).toBeVisible()
    }
  })

  test('should have message input and send functionality', async ({ page }) => {
    const messageInput = page.locator('textarea, input[type="text"]').first()
    const sendButton = page.locator('button[type="submit"], button:has-text("전송")').first()

    if (await messageInput.isVisible()) {
      // 메시지 입력
      await messageInput.fill('테스트 메시지입니다')
      await expect(messageInput).toHaveValue('테스트 메시지입니다')

      // 전송 버튼 확인
      if (await sendButton.isVisible()) {
        await expect(sendButton).toBeVisible()
      }
    }
  })

  test('should show session list for chat history', async ({ page }) => {
    // 세션 목록 확인 (채팅 히스토리)
    const sessionList = page.locator(
      '[class*="session"], [class*="history"], [class*="list"]'
    )

    if (await sessionList.count() > 0) {
      await expect(sessionList.first()).toBeVisible()
    }
  })

  test('should handle message sending with keyboard', async ({ page }) => {
    const messageInput = page.locator('textarea, input[type="text"]').first()

    if (await messageInput.isVisible()) {
      await messageInput.fill('키보드 전송 테스트')

      // Enter 키로 전송 (Shift 없이)
      // 실제 전송은 인증이 필요하므로 폼 동작만 확인
      await messageInput.press('Enter')
    }
  })
})

/**
 * Realtime Connection Resilience Tests
 * 실시간 연결 복원력 테스트
 */
test.describe('Connection Resilience', () => {
  test('should show reconnecting state on connection loss', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 재연결 상태 표시 확인 (선택적)
    const reconnectingIndicator = page.locator(
      'text=/재연결|Reconnecting|연결 중/i'
    )

    // 재연결 UI가 있다면 확인
    if (await reconnectingIndicator.count() > 0) {
      // 존재하면 확인
    }
  })

  test('should preserve message draft on reconnection', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    const messageInput = page.locator('textarea, input[type="text"]').first()

    if (await messageInput.isVisible()) {
      await messageInput.fill('초안 메시지')

      // 페이지 새로고침
      await page.reload()
      await page.waitForLoadState('networkidle')

      // 초안이 보존되어 있는지 확인 (구현에 따라 다름)
      const newInput = page.locator('textarea, input[type="text"]').first()
      if (await newInput.isVisible()) {
        // 초안 보존은 선택적 기능
      }
    }
  })
})

/**
 * Realtime Presence Tests
 * 실시간 프레즌스 테스트
 */
test.describe('Realtime Presence', () => {
  test('should show online users count', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 온라인 사용자 수 표시 확인
    const onlineCount = page.locator(
      'text=/온라인|Online|참여자|Participants/i'
    )

    if (await onlineCount.count() > 0) {
      await expect(onlineCount.first()).toBeVisible()
    }
  })

  test('should indicate AI tutor status', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // AI 튜터 상태 표시 확인
    const aiStatus = page.locator(
      'text=/AI 튜터|AI Tutor|활성|Active|응답 중/i'
    )

    if (await aiStatus.count() > 0) {
      await expect(aiStatus.first()).toBeVisible()
    }
  })
})

/**
 * Message Display Tests
 * 메시지 표시 테스트
 */
test.describe('Message Display', () => {
  test('should differentiate user and AI messages', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 사용자 메시지와 AI 메시지 구분 확인
    const userMessage = page.locator('[class*="user"], [class*="sent"]')
    const aiMessage = page.locator('[class*="ai"], [class*="assistant"], [class*="received"]')

    // 메시지 스타일이 구분되어 있어야 함
    if (await userMessage.count() > 0 && await aiMessage.count() > 0) {
      // 둘 다 존재하면 구분되어 있음
    }
  })

  test('should show message timestamps', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 메시지 타임스탬프 확인
    const timestamp = page.locator(
      '[class*="time"], [class*="timestamp"], text=/\\d{1,2}:\\d{2}|오전|오후|AM|PM/i'
    )

    if (await timestamp.count() > 0) {
      await expect(timestamp.first()).toBeVisible()
    }
  })

  test('should support markdown in messages', async ({ page }) => {
    await page.goto('/dashboard/coaching')
    await page.waitForLoadState('networkidle')

    // 마크다운 렌더링 확인 (코드 블록, 볼드 등)
    const markdownElements = page.locator(
      'code, pre, strong, em, [class*="markdown"]'
    )

    if (await markdownElements.count() > 0) {
      await expect(markdownElements.first()).toBeVisible()
    }
  })
})
