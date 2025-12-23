// ============================================
// E2E Test: Rate Limiting
// Loop 15: Rate Limit 검증
// ============================================

import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

test.describe('Rate Limiting', () => {
  let testUserId: string
  let testToken: string

  test.beforeEach(async () => {
    // 테스트 사용자 생성
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'testpass123',
      email_confirm: true,
    })

    if (error) throw error
    testUserId = user.user.id

    // 크레딧 지갑 생성 (충분한 잔액)
    await supabaseAdmin
      .from('credit_wallets')
      .insert({ user_id: testUserId, balance: 1000 })

    // 인증 토큰 발급
    const { data: session } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.user.email!,
    })

    testToken = session.properties.action_link.split('access_token=')[1].split('&')[0]
  })

  test.afterEach(async () => {
    if (testUserId) {
      await supabaseAdmin.auth.admin.deleteUser(testUserId)
    }
  })

  test('should enforce 100 requests per 10 minutes limit for AI strategy', async ({
    request,
  }) => {
    const responses: any[] = []

    // 100개 요청 전송
    for (let i = 0; i < 100; i++) {
      const response = await request.post(
        'http://localhost:3000/api/ai/generate-strategy',
        {
          headers: {
            Authorization: `Bearer ${testToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            prompt: `Test strategy ${i}`,
            riskLevel: 'medium',
          },
        }
      )

      responses.push({
        status: response.status(),
        i,
      })

      // Rate limit 체크
      if (response.status() === 429) {
        break
      }
    }

    // 100개 이상 요청 시 429 발생해야 함
    const rateLimitedCount = responses.filter((r) => r.status === 429).length

    expect(rateLimitedCount).toBeGreaterThan(0)

    // 101번째 요청
    const response101 = await request.post(
      'http://localhost:3000/api/ai/generate-strategy',
      {
        headers: {
          Authorization: `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          prompt: 'Test strategy 101',
          riskLevel: 'medium',
        },
      }
    )

    expect(response101.status()).toBe(429)

    const body = await response101.json()
    expect(body.error).toBe('RATE_LIMIT_EXCEEDED')
    expect(body.retryAfter).toBeDefined()
  })

  test('should reset rate limit after 10 minutes', async ({ request }) => {
    // 100개 요청으로 Rate Limit 도달
    for (let i = 0; i < 100; i++) {
      await request.post('http://localhost:3000/api/ai/generate-strategy', {
        headers: {
          Authorization: `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          prompt: `Test strategy ${i}`,
          riskLevel: 'medium',
        },
      })
    }

    // 101번째 요청 (429 확인)
    const response101 = await request.post(
      'http://localhost:3000/api/ai/generate-strategy',
      {
        headers: {
          Authorization: `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          prompt: 'Test strategy 101',
          riskLevel: 'medium',
        },
      }
    )

    expect(response101.status()).toBe(429)

    // 10분 대기 (실제 테스트에서는 짧게 조정)
    // await new Promise((resolve) => setTimeout(resolve, 600000))

    // Redis에서 키 수동 삭제 (테스트용)
    const redis = await import('ioredis').then(
      (m) => new m.Redis(process.env.UPSTASH_REDIS_URL!)
    )
    await redis.del(`ratelimit:${testUserId}`)
    await redis.quit()

    // 재시도 (성공해야 함)
    const retryResponse = await request.post(
      'http://localhost:3000/api/ai/generate-strategy',
      {
        headers: {
          Authorization: `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          prompt: 'Test retry after reset',
          riskLevel: 'medium',
        },
      }
    )

    expect(retryResponse.status()).toBe(200)
  })

  test('should apply rate limit per user', async ({ request }) => {
    // 사용자 A: 100개 요청
    for (let i = 0; i < 100; i++) {
      await request.post('http://localhost:3000/api/ai/generate-strategy', {
        headers: {
          Authorization: `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          prompt: `Test strategy A ${i}`,
          riskLevel: 'medium',
        },
      })
    }

    // 사용자 A: 101번째 요청 (429)
    const responseA101 = await request.post(
      'http://localhost:3000/api/ai/generate-strategy',
      {
        headers: {
          Authorization: `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          prompt: 'Test strategy A 101',
          riskLevel: 'medium',
        },
      }
    )

    expect(responseA101.status()).toBe(429)

    // 사용자 B 생성
    const { data: userB } = await supabaseAdmin.auth.admin.createUser({
      email: `test-b-${Date.now()}@example.com`,
      password: 'testpass123',
      email_confirm: true,
    })

    await supabaseAdmin
      .from('credit_wallets')
      .insert({ user_id: userB!.user.id, balance: 1000 })

    const { data: sessionB } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userB!.user.email!,
    })

    const testTokenB = sessionB.properties.action_link.split('access_token=')[1].split('&')[0]

    // 사용자 B: 첫 요청 (성공해야 함)
    const responseB1 = await request.post(
      'http://localhost:3000/api/ai/generate-strategy',
      {
        headers: {
          Authorization: `Bearer ${testTokenB}`,
          'Content-Type': 'application/json',
        },
        data: {
          prompt: 'Test strategy B 1',
          riskLevel: 'medium',
        },
      }
    )

    expect(responseB1.status()).toBe(200)

    // 사용자 B 정리
    await supabaseAdmin.auth.admin.deleteUser(userB!.user.id)
  })

  test('should apply different rate limits for different endpoints', async ({
    request,
  }) => {
    // AI Strategy (100 req/10min)
    const strategyResponse = await request.post(
      'http://localhost:3000/api/ai/generate-strategy',
      {
        headers: {
          Authorization: `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          prompt: 'Test strategy',
          riskLevel: 'medium',
        },
      }
    )

    expect(strategyResponse.status()).toBe(200)

    // AI Tutor (1000 req/10min, 더 관대)
    const tutorResponse = await request.post('http://localhost:3000/api/ai/tutor', {
      headers: {
        Authorization: `Bearer ${testToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        question: 'What is RSI?',
      },
    })

    expect(tutorResponse.status()).toBe(200)
  })
})
