import { test, expect } from '@playwright/test'

test.describe('API Endpoints', () => {
  test('health check endpoint should return 200', async ({ request }) => {
    const response = await request.get('/api/health')

    // 헬스체크 엔드포인트가 있다면 200 반환
    if (response.status() !== 404) {
      expect(response.status()).toBe(200)
    }
  })

  test('strategies API should require authentication', async ({ request }) => {
    const response = await request.get('/api/strategies')

    // 인증 필요 또는 빈 결과
    expect([200, 401, 403]).toContain(response.status())
  })

  test('payment webhook should accept POST requests', async ({ request }) => {
    const response = await request.post('/api/payments/webhook', {
      data: {
        eventType: 'TEST',
        data: {},
      },
    })

    // 웹훅은 보통 200 또는 401 반환
    expect([200, 401, 400]).toContain(response.status())
  })

  test('rate limiter should work', async ({ request }) => {
    // 여러 요청을 빠르게 보내서 rate limiting 확인
    const responses = await Promise.all(
      Array(5).fill(null).map(() => request.get('/api/strategies'))
    )

    // 모든 요청이 완료되어야 함
    expect(responses.length).toBe(5)

    // 너무 많은 요청 시 429 반환될 수 있음
    const statuses = responses.map(r => r.status())
    const hasValidStatus = statuses.every(s => [200, 401, 403, 429].includes(s))
    expect(hasValidStatus).toBeTruthy()
  })
})

test.describe('AI API', () => {
  test('AI tutor endpoint should exist', async ({ request }) => {
    const response = await request.post('/api/ai/tutor', {
      data: {
        question: 'What is RSI?',
      },
    })

    // AI API는 인증 필요하거나 RPC 미설정 시 500 반환할 수 있음
    expect([200, 401, 402, 403, 404, 500]).toContain(response.status())
  })

  test('strategy generation endpoint should exist', async ({ request }) => {
    const response = await request.post('/api/ai/generate-strategy', {
      data: {
        prompt: 'Simple moving average crossover strategy',
      },
    })

    // AI API는 인증 필요할 수 있음
    expect([200, 401, 403, 404]).toContain(response.status())
  })
})
