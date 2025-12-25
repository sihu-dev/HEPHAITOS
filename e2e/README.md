# HEPHAITOS E2E Tests

Playwright 기반 End-to-End 테스트

## 📊 테스트 현황

**총 경우의 수**: 372개
- **P0** (Critical - MVP 필수): 65개
- **P1** (Important - 베타 출시 필수): 75개
- **P2** (Nice to have - 정식 출시): 96개
- **P3** (Enhancement - 출시 후): 57개

## 🚀 실행 방법

```bash
# 전체 테스트 실행
pnpm test:e2e

# P0 테스트만 실행 (빠름, ~15분)
pnpm test:e2e:p0

# P1 테스트만 실행
pnpm test:e2e:p1

# UI 모드로 실행 (디버깅)
pnpm test:e2e:ui

# Headed 모드로 실행 (브라우저 보이기)
pnpm test:e2e:headed

# 디버그 모드
pnpm test:e2e:debug

# 리포트 보기
pnpm test:e2e:report
```

## 📁 디렉토리 구조

```
e2e/
├── fixtures/           # 테스트 데이터 & 공통 fixture
├── pages/              # Page Object Model
│   ├── base.page.ts
│   ├── login.page.ts
│   ├── signup.page.ts
│   └── ...
├── tests/              # 테스트 스펙
│   ├── p0/             # P0 (Critical)
│   │   └── smoke.spec.ts
│   ├── p1/             # P1 (Important)
│   └── p2/             # P2 (Nice to have)
└── utils/              # 유틸리티 함수
```

## 🎯 우선순위 정의

### P0 (Critical - MVP 필수)
- 회원가입 & 로그인
- 온보딩 플로우
- 전략 생성 (AI & 비주얼)
- 백테스트 실행
- 미러링 시작
- 결제 (플랜 업그레이드)
- 성능 (주요 페이지 LCP <3초)

### P1 (Important - 베타 출시 필수)
- AI 분석 & 코칭
- 포트폴리오 관리
- 전략 수정/삭제
- 에러 처리
- 반응형 (Mobile/Tablet)

### P2 (Nice to have - 정식 출시)
- Admin 대시보드
- 접근성 (WCAG 2.1 AA)
- 크로스 브라우저 (Safari, Firefox)

## 📝 테스트 작성 가이드

### Page Object Pattern

```typescript
// e2e/pages/login.page.ts
import { Page } from '@playwright/test'
import { BasePage } from './base.page'

export class LoginPage extends BasePage {
  // Locators
  get emailInput() {
    return this.page.getByLabel('이메일')
  }

  // Actions
  async loginWithEmail(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }
}
```

### Test Spec

```typescript
// e2e/tests/p0/auth.spec.ts
import { test, expect } from '@playwright/test'
import { LoginPage } from '../../pages/login.page'

test.describe('Authentication', () => {
  test('로그인 성공', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginWithEmail('test@example.com', 'password')

    // 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL(/dashboard/)
  })
})
```

## 🔧 CI/CD 통합

GitHub Actions에서 자동 실행:

```yaml
# .github/workflows/e2e.yml
- name: Run E2E Tests (P0)
  run: pnpm test:e2e:p0

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 📈 커버리지 목표

| Phase | 목표 커버리지 |
|-------|-------------|
| P0 완료 후 | 70% |
| P1 완료 후 | 85% |
| P2 완료 후 | 95% |

## 🐛 디버깅 팁

1. **UI 모드 사용**: `pnpm test:e2e:ui`
2. **Headed 모드**: `pnpm test:e2e:headed`
3. **디버그 모드**: `pnpm test:e2e:debug`
4. **스크린샷**: 실패 시 자동 저장됨 (`test-results/`)
5. **비디오**: 실패 시 자동 녹화됨
6. **Trace**: Playwright UI에서 재생 가능

## 📚 참고 자료

- [Playwright 공식 문서](https://playwright.dev/)
- [Page Object Model 가이드](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [HEPHAITOS E2E 테스트 케이스 분석](../docs/E2E_TEST_CASES_COMPREHENSIVE_2025-12-21.md)
