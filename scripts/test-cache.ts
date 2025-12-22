// ============================================
// Claude Prompt Caching 테스트 스크립트
// ============================================

import Anthropic from '@anthropic-ai/sdk'
import { buildCachedSystemPrompt } from '../src/lib/ai/cache-config'
import { saveCacheMetrics, calculateCacheCost } from '../src/lib/monitoring/cache-metrics'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
})

/**
 * 테스트 1: 캐시 생성 (첫 요청)
 */
async function testCacheCreation() {
  console.log('\n=== 테스트 1: 캐시 생성 ===')

  const cachedBlocks = buildCachedSystemPrompt('learn')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: cachedBlocks,
    messages: [
      {
        role: 'user',
        content: 'RSI 지표가 무엇인가요? 간단히 설명해주세요.',
      },
    ],
  })

  console.log('응답:', response.content[0].type === 'text' ? response.content[0].text : '')
  console.log('\n토큰 사용량:')
  console.log('- 입력:', response.usage.input_tokens)
  console.log('- 출력:', response.usage.output_tokens)
  console.log('- 캐시 생성:', response.usage.cache_creation_input_tokens || 0)
  console.log('- 캐시 읽기:', response.usage.cache_read_input_tokens || 0)

  const costs = calculateCacheCost({
    cache_creation_tokens: response.usage.cache_creation_input_tokens || 0,
    cache_read_tokens: response.usage.cache_read_input_tokens || 0,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    endpoint: '/test/cache-creation',
    model: 'claude-sonnet-4-5',
  })

  console.log('\n비용:')
  console.log('- 실제 비용:', `$${costs.total_cost.toFixed(4)}`)
  console.log('- 캐싱 없을 시:', `$${costs.cost_without_cache.toFixed(4)}`)
  console.log('- 절감액:', `$${costs.cost_saved.toFixed(4)}`)
  console.log('- 절감률:', `${costs.savings_percent.toFixed(1)}%`)

  return response.usage
}

/**
 * 테스트 2: 캐시 재사용 (2번째 요청)
 */
async function testCacheReuse() {
  console.log('\n=== 테스트 2: 캐시 재사용 ===')
  console.log('(5초 후 실행...)')
  await new Promise((resolve) => setTimeout(resolve, 5000))

  const cachedBlocks = buildCachedSystemPrompt('learn')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: cachedBlocks,
    messages: [
      {
        role: 'user',
        content: 'MACD 지표는 어떻게 해석하나요?',
      },
    ],
  })

  console.log('응답:', response.content[0].type === 'text' ? response.content[0].text : '')
  console.log('\n토큰 사용량:')
  console.log('- 입력:', response.usage.input_tokens)
  console.log('- 출력:', response.usage.output_tokens)
  console.log('- 캐시 생성:', response.usage.cache_creation_input_tokens || 0)
  console.log('- 캐시 읽기:', response.usage.cache_read_input_tokens || 0, '⭐ (캐시 히트!)')

  const costs = calculateCacheCost({
    cache_creation_tokens: response.usage.cache_creation_input_tokens || 0,
    cache_read_tokens: response.usage.cache_read_input_tokens || 0,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    endpoint: '/test/cache-reuse',
    model: 'claude-sonnet-4-5',
  })

  console.log('\n비용:')
  console.log('- 실제 비용:', `$${costs.total_cost.toFixed(4)}`)
  console.log('- 캐싱 없을 시:', `$${costs.cost_without_cache.toFixed(4)}`)
  console.log('- 절감액:', `$${costs.cost_saved.toFixed(4)}`)
  console.log('- 절감률:', `${costs.savings_percent.toFixed(1)}%`)

  return response.usage
}

/**
 * 테스트 3: 10회 연속 요청으로 누적 절감액 계산
 */
async function testMultipleRequests() {
  console.log('\n=== 테스트 3: 10회 연속 요청 ===')

  let totalCost = 0
  let totalCostWithoutCache = 0

  const cachedBlocks = buildCachedSystemPrompt('build')

  for (let i = 0; i < 10; i++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: cachedBlocks,
      messages: [
        {
          role: 'user',
          content: `전략 ${i + 1}: RSI ${20 + i}에서 매수하는 전략을 만들어주세요.`,
        },
      ],
    })

    const costs = calculateCacheCost({
      cache_creation_tokens: response.usage.cache_creation_input_tokens || 0,
      cache_read_tokens: response.usage.cache_read_input_tokens || 0,
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      endpoint: `/test/multiple-${i + 1}`,
      model: 'claude-sonnet-4-5',
    })

    totalCost += costs.total_cost
    totalCostWithoutCache += costs.cost_without_cache

    console.log(
      `요청 ${i + 1}: $${costs.total_cost.toFixed(4)} (캐시 읽기: ${response.usage.cache_read_input_tokens || 0})`
    )

    // 요청 간격 1초
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const totalSaved = totalCostWithoutCache - totalCost
  const savingsPercent = (totalSaved / totalCostWithoutCache) * 100

  console.log('\n누적 결과:')
  console.log('- 총 비용 (캐싱):', `$${totalCost.toFixed(4)}`)
  console.log('- 총 비용 (캐싱 없음):', `$${totalCostWithoutCache.toFixed(4)}`)
  console.log('- 총 절감액:', `$${totalSaved.toFixed(4)}`)
  console.log('- 평균 절감률:', `${savingsPercent.toFixed(1)}%`)
}

/**
 * 메인 실행
 */
async function main() {
  console.log('┌────────────────────────────────────────────┐')
  console.log('│  Claude Prompt Caching 테스트              │')
  console.log('└────────────────────────────────────────────┘')

  // API 키 확인
  if (!process.env.ANTHROPIC_API_KEY && !process.env.CLAUDE_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.')
    process.exit(1)
  }

  try {
    await testCacheCreation()
    await testCacheReuse()
    await testMultipleRequests()

    console.log('\n✅ 모든 테스트 완료!')
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  main()
}
