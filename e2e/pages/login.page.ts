import { Page } from '@playwright/test'
import { BasePage } from './base.page'

/**
 * Login Page Object
 * /login, /auth/login
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // Locators
  get emailInput() {
    return this.page.getByLabel('이메일')
  }

  get passwordInput() {
    return this.page.getByLabel('비밀번호')
  }

  get loginButton() {
    return this.page.getByRole('button', { name: '로그인' })
  }

  get googleButton() {
    return this.page.getByRole('button', { name: 'Google로 로그인' })
  }

  get kakaoButton() {
    return this.page.getByRole('button', { name: 'Kakao로 로그인' })
  }

  get errorMessage() {
    return this.page.getByRole('alert')
  }

  get forgotPasswordLink() {
    return this.page.getByText('비밀번호를 잊으셨나요?')
  }

  // Actions
  async goto() {
    await super.goto('/login')
  }

  async loginWithEmail(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }

  async loginWithGoogle() {
    await this.googleButton.click()
  }

  async loginWithKakao() {
    await this.kakaoButton.click()
  }

  async expectLoginError(message: string) {
    await this.expectVisible(this.errorMessage)
    await this.page.getByText(message).isVisible()
  }
}
