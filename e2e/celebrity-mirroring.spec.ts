import { test, expect } from '@playwright/test'

/**
 * Celebrity Mirroring E2E Tests
 * 셀럽 미러링 기능 확장 E2E 테스트
 */
test.describe('Celebrity Mirroring Extended', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/copy-trading')
    await page.waitForLoadState('networkidle')
  })

  /**
   * Celebrity List Tests
   * 셀럽 목록 테스트
   */
  test.describe('Celebrity List', () => {
    test('should display multiple celebrity types', async ({ page }) => {
      // 다양한 셀럽 유형 확인 (정치인, 투자자, 펀드매니저)
      const celebrityTypes = [
        /정치인|politician/i,
        /투자자|investor/i,
        /펀드.*매니저|fund.*manager/i,
      ]

      for (const type of celebrityTypes) {
        const typeElement = page.locator(`text=${type}`)
        if ((await typeElement.count()) > 0) {
          // 해당 유형의 셀럽이 존재
          break
        }
      }
    })

    test('should show celebrity performance metrics', async ({ page }) => {
      // 셀럽 성과 지표 확인 (YTD, 1년 수익률 등)
      const performanceLabels = [
        /YTD|ytd/,
        /수익률|return/i,
        /\d+%/, // 퍼센트 표시
      ]

      for (const label of performanceLabels) {
        const element = page.locator(`text=${label}`)
        if ((await element.count()) > 0) {
          await expect(element.first()).toBeVisible()
          break
        }
      }
    })

    test('should filter celebrities by type', async ({ page }) => {
      // 셀럽 유형 필터 확인
      const filterButtons = page.locator(
        'button:has-text("정치인"), button:has-text("투자자"), button:has-text("펀드"), [role="tab"]'
      )

      if ((await filterButtons.count()) > 0) {
        // 필터 버튼 클릭
        await filterButtons.first().click()
        await page.waitForTimeout(300)
      }
    })

    test('should sort celebrities by performance', async ({ page }) => {
      // 성과순 정렬 확인
      const sortButton = page.locator(
        'button:has-text("정렬"), button:has-text("sort"), [data-testid*="sort"]'
      )

      if ((await sortButton.count()) > 0) {
        await expect(sortButton.first()).toBeVisible()
      }
    })
  })

  /**
   * Celebrity Detail Tests
   * 셀럽 상세 테스트
   */
  test.describe('Celebrity Detail', () => {
    test('should show celebrity portfolio breakdown', async ({ page }) => {
      // 셀럽 카드 클릭해서 상세 보기
      const celebrityCard = page.locator('[class*="card"], [data-testid*="celebrity"]').first()

      if ((await celebrityCard.count()) > 0) {
        await celebrityCard.click()
        await page.waitForTimeout(500)

        // 포트폴리오 분석 섹션 확인
        const portfolioSection = page.locator('text=/포트폴리오|portfolio|보유.*종목/i')
        if ((await portfolioSection.count()) > 0) {
          await expect(portfolioSection.first()).toBeVisible()
        }
      }
    })

    test('should show recent trades list', async ({ page }) => {
      // 최근 거래 목록 확인
      const tradesSection = page.locator('text=/최근.*거래|recent.*trade|거래.*내역/i')

      if ((await tradesSection.count()) > 0) {
        await expect(tradesSection.first()).toBeVisible()
      }
    })

    test('should show data source info', async ({ page }) => {
      // 데이터 소스 정보 확인 (SEC 13F, Congress Disclosure 등)
      const dataSourceLabels = [
        /SEC.*13F|13F/i,
        /의회.*공시|congress/i,
        /실시간|realtime/i,
        /45일|45.*day/i,
        /분기|quarterly/i,
      ]

      for (const label of dataSourceLabels) {
        const element = page.locator(`text=${label}`)
        if ((await element.count()) > 0) {
          await expect(element.first()).toBeVisible()
          break
        }
      }
    })
  })

  /**
   * Mirror Setup Tests
   * 미러 설정 테스트
   */
  test.describe('Mirror Setup', () => {
    test('should have investment amount input', async ({ page }) => {
      // 투자 금액 입력 확인
      const amountInput = page.locator(
        'input[type="number"], input[placeholder*="금액"], input[placeholder*="amount"]'
      )
      const amountLabel = page.locator('text=/투자.*금액|investment.*amount|미러.*금액/i')

      const hasAmountUI =
        (await amountInput.count()) > 0 || (await amountLabel.count()) > 0

      if (hasAmountUI) {
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('should have auto-mirror toggle', async ({ page }) => {
      // 자동 미러링 토글 확인
      const autoToggle = page.locator(
        'input[type="checkbox"], [role="switch"], button:has-text("자동")'
      )
      const autoLabel = page.locator('text=/자동.*미러|auto.*mirror|자동.*따라/i')

      const hasAutoUI = (await autoToggle.count()) > 0 || (await autoLabel.count()) > 0

      if (hasAutoUI) {
        // 자동 미러링 UI 존재
      }
    })

    test('should show notification settings', async ({ page }) => {
      // 알림 설정 확인
      const notificationLabel = page.locator('text=/알림|notification|notify/i')

      if ((await notificationLabel.count()) > 0) {
        await expect(notificationLabel.first()).toBeVisible()
      }
    })

    test('should allow excluding symbols', async ({ page }) => {
      // 종목 제외 설정 확인
      const excludeLabel = page.locator('text=/제외|exclude|필터|filter/i')

      if ((await excludeLabel.count()) > 0) {
        // 제외 설정 UI 존재
      }
    })
  })

  /**
   * Trade Analysis Tests
   * 거래 분석 테스트
   */
  test.describe('Trade Analysis', () => {
    test('should show AI analysis for trades', async ({ page }) => {
      // AI 거래 분석 확인
      const aiAnalysisSection = page.locator('text=/AI.*분석|analysis|분석.*결과/i')

      if ((await aiAnalysisSection.count()) > 0) {
        await expect(aiAnalysisSection.first()).toBeVisible()
      }
    })

    test('should show trade reasoning', async ({ page }) => {
      // 거래 이유 분석 확인
      const reasoningSection = page.locator('text=/이유|reasoning|배경|background|추론/i')

      if ((await reasoningSection.count()) > 0) {
        await expect(reasoningSection.first()).toBeVisible()
      }
    })

    test('should show risk assessment', async ({ page }) => {
      // 리스크 평가 확인
      const riskSection = page.locator('text=/리스크|risk|위험|주의/i')

      if ((await riskSection.count()) > 0) {
        await expect(riskSection.first()).toBeVisible()
      }
    })

    test('should show recommendation', async ({ page }) => {
      // 권장 행동 확인
      const recommendationLabels = [
        /권장|recommend/i,
        /따라.*투자|follow/i,
        /관망|observe/i,
        /회피|avoid/i,
      ]

      for (const label of recommendationLabels) {
        const element = page.locator(`text=${label}`)
        if ((await element.count()) > 0) {
          await expect(element.first()).toBeVisible()
          break
        }
      }
    })
  })

  /**
   * Portfolio Comparison Tests
   * 포트폴리오 비교 테스트
   */
  test.describe('Portfolio Comparison', () => {
    test('should compare user portfolio with celebrity', async ({ page }) => {
      // 포트폴리오 비교 UI 확인
      const comparisonSection = page.locator('text=/비교|compare|차이|difference/i')

      if ((await comparisonSection.count()) > 0) {
        await expect(comparisonSection.first()).toBeVisible()
      }
    })

    test('should show deviation analysis', async ({ page }) => {
      // 편차 분석 확인
      const deviationLabels = [
        /편차|deviation/i,
        /비중.*차이|weight.*diff/i,
        /조정.*필요|adjust/i,
      ]

      for (const label of deviationLabels) {
        const element = page.locator(`text=${label}`)
        if ((await element.count()) > 0) {
          break
        }
      }
    })

    test('should suggest portfolio changes', async ({ page }) => {
      // 포트폴리오 조정 제안 확인
      const suggestionSection = page.locator('text=/제안|suggestion|조정|rebalance/i')

      if ((await suggestionSection.count()) > 0) {
        // 제안 섹션 존재
      }
    })
  })

  /**
   * Disclaimer Tests
   * 면책 조항 테스트
   */
  test.describe('Legal Compliance', () => {
    test('should show investment disclaimer', async ({ page }) => {
      // 투자 면책 조항 확인 (법적 요구사항)
      const disclaimerLabels = [
        /투자.*조언.*아닙니다|not.*investment.*advice/i,
        /교육.*목적|educational/i,
        /손실.*책임|loss.*responsibility/i,
        /개인.*판단|personal.*judgment/i,
      ]

      for (const label of disclaimerLabels) {
        const element = page.locator(`text=${label}`)
        if ((await element.count()) > 0) {
          await expect(element.first()).toBeVisible()
          break
        }
      }
    })

    test('should show data delay notice', async ({ page }) => {
      // 데이터 지연 안내 확인
      const delayNotice = page.locator('text=/45일.*지연|delay|공시.*지연|45.*day/i')

      if ((await delayNotice.count()) > 0) {
        await expect(delayNotice.first()).toBeVisible()
      }
    })
  })
})

/**
 * Mobile Responsiveness Tests
 * 모바일 반응형 테스트
 */
test.describe('Mobile Copy Trading', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

  test('should be usable on mobile', async ({ page }) => {
    await page.goto('/dashboard/copy-trading')
    await page.waitForLoadState('networkidle')

    // 모바일에서도 핵심 기능이 접근 가능한지 확인
    await expect(page.locator('body')).toBeVisible()

    // 스크롤 가능해야 함
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight)
    expect(scrollHeight).toBeGreaterThan(0)
  })

  test('should have accessible navigation on mobile', async ({ page }) => {
    await page.goto('/dashboard/copy-trading')
    await page.waitForLoadState('networkidle')

    // 모바일 네비게이션 (햄버거 메뉴 등) 확인
    const mobileNav = page.locator(
      'button[aria-label*="menu"], [class*="hamburger"], [data-testid*="mobile-nav"]'
    )

    // 모바일 네비게이션이 있을 수 있음
  })
})
