import { Page, Locator, expect } from '@playwright/test'

/**
 * Base Page Object
 * 모든 페이지의 공통 기능
 */
export class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * 페이지로 이동
   */
  async goto(path: string) {
    await this.page.goto(path)
  }

  /**
   * 페이지 타이틀 확인
   */
  async expectTitle(title: string) {
    await expect(this.page).toHaveTitle(title)
  }

  /**
   * URL 확인
   */
  async expectURL(url: string | RegExp) {
    await expect(this.page).toHaveURL(url)
  }

  /**
   * 요소가 표시되는지 확인
   */
  async expectVisible(locator: Locator) {
    await expect(locator).toBeVisible()
  }

  /**
   * 로딩 완료 대기
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * 스크린샷 촬영
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` })
  }
}
