#!/usr/bin/env tsx

// ============================================
// Extended Context Test Script
// Claude 200K 컨텍스트 윈도우 테스트
// ============================================

import { createClaudeClient } from '../src/lib/ai/claude-client'
import { getContextManager } from '../src/lib/ai/context-manager'

/**
 * Generate mock 10-year backtest data
 */
function generateMock10YearBacktest() {
  const trades = []
  const equityCurve = []
  let equity = 100000
  const startDate = Date.now() - 10 * 365 * 24 * 60 * 60 * 1000 // 10 years ago

  // Generate 5000 trades (avg ~500 per year)
  for (let i = 0; i < 5000; i++) {
    const entryTime = startDate + i * (10 * 365 * 24 * 60 * 60 * 1000) / 5000
    const exitTime = entryTime + Math.random() * 7 * 24 * 60 * 60 * 1000 // 1-7 days
    const pnlPercent = (Math.random() - 0.45) * 10 // -4.5% to +5.5% (slight profit bias)
    const pnl = equity * (pnlPercent / 100)

    equity += pnl

    trades.push({
      entryTime,
      exitTime,
      pnl,
      pnlPercent,
      side: Math.random() > 0.5 ? 'long' : 'short',
    })
  }

  // Generate equity curve (daily snapshots)
  for (let i = 0; i < 10 * 365; i++) {
    const timestamp = startDate + i * 24 * 60 * 60 * 1000
    const drawdown = Math.max(0, (Math.random() - 0.8) * 15) // 0-15% drawdown

    equityCurve.push({
      timestamp,
      equity: equity * (1 - drawdown / 100),
      drawdown,
    })
  }

  const metrics = {
    totalReturn: equity - 100000,
    totalReturnPercent: ((equity - 100000) / 100000) * 100,
    annualizedReturn: (Math.pow(equity / 100000, 1 / 10) - 1) * 100,
    maxDrawdown: 8234.56,
    maxDrawdownPercent: 8.23,
    sharpeRatio: 1.85,
    sortinoRatio: 2.34,
    calmarRatio: 14.5,
    volatility: 12.3,
    totalTrades: trades.length,
    winningTrades: trades.filter((t) => t.pnl > 0).length,
    losingTrades: trades.filter((t) => t.pnl <= 0).length,
    winRate: (trades.filter((t) => t.pnl > 0).length / trades.length) * 100,
    avgWin: trades.filter((t) => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / trades.filter((t) => t.pnl > 0).length,
    avgLoss: Math.abs(
      trades.filter((t) => t.pnl <= 0).reduce((sum, t) => sum + t.pnl, 0) / trades.filter((t) => t.pnl <= 0).length
    ),
    profitFactor: 2.3,
    expectancy: 123.45,
  }

  return { metrics, trades, equityCurve }
}

/**
 * Test 1: Token Estimation
 */
async function testTokenEstimation() {
  console.log('\n📊 Test 1: Token Estimation\n')

  const contextManager = getContextManager()
  const backtestData = generateMock10YearBacktest()

  const dataText = JSON.stringify(backtestData)
  const estimate = contextManager.estimate(dataText)

  console.log('✅ 10-Year Backtest Data:')
  console.log(`   - Trades: ${backtestData.trades.length}`)
  console.log(`   - Equity Points: ${backtestData.equityCurve.length}`)
  console.log(`   - Total Characters: ${estimate.characters.toLocaleString()}`)
  console.log(`   - Estimated Tokens: ${estimate.tokens.toLocaleString()}`)
  console.log(`   - Can Fit in 200K: ${estimate.canFit ? '✅ YES' : '❌ NO'}`)
  console.log(`   - Utilization: ${estimate.utilizationPercent.toFixed(2)}%`)

  return estimate
}

/**
 * Test 2: Priority-Based Selection
 */
async function testPrioritySelection() {
  console.log('\n🎯 Test 2: Priority-Based Data Selection\n')

  const contextManager = getContextManager()

  const items = [
    { text: 'A'.repeat(10000), priority: 100, metadata: { name: 'Recent Year (High Priority)' } },
    { text: 'B'.repeat(8000), priority: 80, metadata: { name: 'Last 2 Years' } },
    { text: 'C'.repeat(6000), priority: 60, metadata: { name: '3-5 Years Ago' } },
    { text: 'D'.repeat(4000), priority: 40, metadata: { name: '6-8 Years Ago' } },
    { text: 'E'.repeat(2000), priority: 20, metadata: { name: '9-10 Years Ago (Low Priority)' } },
  ]

  const selected = contextManager.selectByPriority(items, 10000) // 10K token limit

  console.log('✅ Selected Items:')
  selected.forEach((item, i) => {
    console.log(`   ${i + 1}. ${item.metadata?.name} (Priority: ${item.priority})`)
  })

  console.log(`\n   Total Selected: ${selected.length} / ${items.length}`)

  return selected
}

/**
 * Test 3: Extended Context Analysis (Real API Call)
 */
async function testExtendedContextAnalysis() {
  console.log('\n🚀 Test 3: Extended Context Analysis (Real API)\n')

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY

  if (!apiKey) {
    console.log('⚠️  Skipped: ANTHROPIC_API_KEY not set')
    return
  }

  const claudeClient = createClaudeClient({
    apiKey,
    model: 'claude-sonnet-4-5-20250514',
    useExtendedContext: true,
  })

  const backtestData = generateMock10YearBacktest()

  console.log('📤 Sending to Claude API...')
  console.log(`   - Model: claude-sonnet-4-5-20250514`)
  console.log(`   - Extended Context: ENABLED`)
  console.log(`   - Trades: ${backtestData.trades.length}`)
  console.log(`   - Equity Points: ${backtestData.equityCurve.length}`)

  const startTime = Date.now()

  try {
    const analysis = await claudeClient.analyzeBacktest({
      ...backtestData,
      strategyName: 'Test Strategy (10-Year Backtest)',
    })

    const duration = Date.now() - startTime

    console.log('\n✅ Analysis Completed!')
    console.log(`   - Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`)
    console.log(`   - Report Length: ${analysis.length} characters`)
    console.log(`   - First 500 chars:\n`)
    console.log(analysis.slice(0, 500) + '...\n')

    return analysis
  } catch (error) {
    console.error('\n❌ API Call Failed:', error instanceof Error ? error.message : error)
    throw error
  }
}

/**
 * Test 4: Strategy Comparison (Mock)
 */
async function testStrategyComparison() {
  console.log('\n🔀 Test 4: Strategy Comparison (3 Strategies)\n')

  const contextManager = getContextManager()

  const strategies = [
    { name: 'RSI Reversal', data: generateMock10YearBacktest() },
    { name: 'MACD Trend', data: generateMock10YearBacktest() },
    { name: 'MA Crossover', data: generateMock10YearBacktest() },
  ]

  const totalData = strategies.map((s) => JSON.stringify(s.data))
  const estimate = contextManager.estimateMultiple(totalData)

  console.log('✅ 3-Strategy Comparison:')
  strategies.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.name}:`)
    console.log(`      - Trades: ${s.data.trades.length}`)
    console.log(`      - Equity Points: ${s.data.equityCurve.length}`)
  })

  console.log(`\n   Total Tokens: ${estimate.tokens.toLocaleString()}`)
  console.log(`   Can Fit in 200K: ${estimate.canFit ? '✅ YES' : '❌ NO'}`)
  console.log(`   Utilization: ${estimate.utilizationPercent.toFixed(2)}%`)

  return estimate
}

/**
 * Test 5: Cost Comparison (Chunking vs Extended Context)
 */
async function testCostComparison() {
  console.log('\n💰 Test 5: Cost Comparison\n')

  const contextManager = getContextManager()
  const backtestData = generateMock10YearBacktest()
  const dataText = JSON.stringify(backtestData)
  const totalTokens = contextManager.estimate(dataText).tokens

  // Pricing (as of 2025-12)
  const INPUT_PRICE_PER_1M_TOKENS = 3.0 // $3 per 1M input tokens (Sonnet 4.5)
  const OUTPUT_PRICE_PER_1M_TOKENS = 15.0 // $15 per 1M output tokens

  // Chunking approach (32K context)
  const chunksNeeded = Math.ceil(totalTokens / 32000)
  const chunkingCost =
    ((totalTokens / 1000000) * INPUT_PRICE_PER_1M_TOKENS + (8192 / 1000000) * OUTPUT_PRICE_PER_1M_TOKENS) *
    chunksNeeded

  // Extended Context approach (200K context)
  const extendedContextCost =
    (totalTokens / 1000000) * INPUT_PRICE_PER_1M_TOKENS + (8192 / 1000000) * OUTPUT_PRICE_PER_1M_TOKENS

  console.log('📊 Chunking Approach (32K context):')
  console.log(`   - Chunks Needed: ${chunksNeeded}`)
  console.log(`   - Total API Calls: ${chunksNeeded}`)
  console.log(`   - Total Input Tokens: ${(totalTokens * chunksNeeded).toLocaleString()}`)
  console.log(`   - Estimated Cost: $${chunkingCost.toFixed(4)}`)

  console.log('\n🚀 Extended Context Approach (200K):')
  console.log(`   - API Calls: 1`)
  console.log(`   - Total Input Tokens: ${totalTokens.toLocaleString()}`)
  console.log(`   - Estimated Cost: $${extendedContextCost.toFixed(4)}`)

  console.log('\n💡 Savings:')
  console.log(`   - Cost Reduction: -${(((chunkingCost - extendedContextCost) / chunkingCost) * 100).toFixed(1)}%`)
  console.log(`   - API Calls Reduction: -${(((chunksNeeded - 1) / chunksNeeded) * 100).toFixed(1)}%`)
  console.log(`   - Token Usage Reduction: -${(((totalTokens * chunksNeeded - totalTokens) / (totalTokens * chunksNeeded)) * 100).toFixed(1)}%`)

  return {
    chunking: { cost: chunkingCost, calls: chunksNeeded },
    extendedContext: { cost: extendedContextCost, calls: 1 },
  }
}

/**
 * Main Test Runner
 */
async function main() {
  console.log('🔬 HEPHAITOS Extended Context Test Suite')
  console.log('=========================================')

  try {
    await testTokenEstimation()
    await testPrioritySelection()
    await testStrategyComparison()
    await testCostComparison()

    // Real API test (optional)
    const runRealApiTest = process.argv.includes('--real-api')
    if (runRealApiTest) {
      await testExtendedContextAnalysis()
    } else {
      console.log('\n⚠️  Skipping real API test. Use --real-api flag to enable.')
    }

    console.log('\n✅ All tests completed!\n')
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

// Run tests
main()
