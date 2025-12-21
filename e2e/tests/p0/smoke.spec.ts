import { test, expect } from '@playwright/test'

/**
 * P0 Smoke Tests
 * 기본적인 페이지 로드 및 네비게이션 테스트
 */

test.describe('Smoke Tests', () => {
  test('랜딩 페이지가 로드된다', async ({ page }) => {
    await page.goto('/')

    // 페이지 로드 확인
    await expect(page).toHaveTitle(/HEPHAITOS/)

    // 주요 요소 확인
    await expect(page.getByRole('heading', { name: /HEPHAITOS/ })).toBeVisible()
  })

  test('로그인 페이지가 로드된다', async ({ page }) => {
    await page.goto('/login')

    // 로그인 폼 확인
    await expect(page.getByLabel('이메일')).toBeVisible()
    await expect(page.getByLabel('비밀번호')).toBeVisible()
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()
  })

  test('회원가입 페이지가 로드된다', async ({ page }) => {
    await page.goto('/signup')

    // 회원가입 폼 확인
    await expect(page).toHaveURL(/signup/)
  })

  test('비인증 사용자가 대시보드 접근 시 로그인 페이지로 리다이렉트된다', async ({ page }) => {
    await page.goto('/dashboard')

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/login|auth/)
  })
})
