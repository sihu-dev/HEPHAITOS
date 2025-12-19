/**
 * 스크린샷 + 콘솔 오류 수집 스크립트
 * Usage: npx tsx scripts/screenshot-console-check.ts
 */

import { chromium, ConsoleMessage } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

interface PageCheck {
  url: string
  name: string
}

const PAGES_TO_CHECK: PageCheck[] = [
  { url: 'http://localhost:3000', name: 'home' },
  { url: 'http://localhost:3000/dashboard', name: 'dashboard' },
  { url: 'http://localhost:3000/dashboard/strategies', name: 'strategies' },
  { url: 'http://localhost:3000/dashboard/portfolio', name: 'portfolio' },
  { url: 'http://localhost:3000/auth/login', name: 'login' },
]

interface ConsoleError {
  type: string
  text: string
  location: string
}

interface PageResult {
  page: string
  url: string
  screenshot: string
  consoleErrors: ConsoleError[]
  timestamp: string
}

async function checkPage(page: PageCheck): Promise<PageResult> {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  })
  const browserPage = await context.newPage()

  const consoleErrors: ConsoleError[] = []

  // 콘솔 메시지 수집
  browserPage.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()?.url || 'unknown',
      })
    }
  })

  // 페이지 에러 수집
  browserPage.on('pageerror', (error) => {
    consoleErrors.push({
      type: 'pageerror',
      text: error.message,
      location: error.stack || 'unknown',
    })
  })

  try {
    await browserPage.goto(page.url, { waitUntil: 'networkidle', timeout: 30000 })
    await browserPage.waitForTimeout(2000) // 추가 대기

    // 스크린샷 저장
    const screenshotDir = path.join(process.cwd(), 'screenshots')
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true })
    }

    const screenshotPath = path.join(screenshotDir, `${page.name}.png`)
    await browserPage.screenshot({ path: screenshotPath, fullPage: true })

    return {
      page: page.name,
      url: page.url,
      screenshot: screenshotPath,
      consoleErrors,
      timestamp: new Date().toISOString(),
    }
  } finally {
    await browser.close()
  }
}

async function main() {
  console.log('🔍 스크린샷 + 콘솔 오류 검사 시작...\n')

  const results: PageResult[] = []

  for (const page of PAGES_TO_CHECK) {
    console.log(`📸 ${page.name} (${page.url})...`)
    try {
      const result = await checkPage(page)
      results.push(result)
      console.log(`   ✅ 스크린샷: ${result.screenshot}`)
      console.log(`   ⚠️  콘솔 오류: ${result.consoleErrors.length}개`)
    } catch (error) {
      console.log(`   ❌ 에러: ${error}`)
    }
  }

  // 결과 저장
  const reportPath = path.join(process.cwd(), 'screenshots', 'report.json')
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))

  // 요약 출력
  console.log('\n' + '='.repeat(60))
  console.log('📊 검사 결과 요약')
  console.log('='.repeat(60))

  let totalErrors = 0
  for (const result of results) {
    totalErrors += result.consoleErrors.length
    console.log(`\n[${result.page}]`)
    if (result.consoleErrors.length === 0) {
      console.log('  ✅ 콘솔 오류 없음')
    } else {
      for (const error of result.consoleErrors) {
        console.log(`  ❌ [${error.type}] ${error.text.substring(0, 100)}`)
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`총 오류: ${totalErrors}개`)
  console.log(`리포트: ${reportPath}`)
  console.log('='.repeat(60))

  process.exit(totalErrors > 0 ? 1 : 0)
}

main().catch(console.error)
