/**
 * MoA (Mixture-of-Agents) 테스트 스크립트
 *
 * Usage:
 *   node scripts/test-moa.js poc
 *   node scripts/test-moa.js full
 *   node scripts/test-moa.js compare
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

// Anthropic SDK
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 테스트 프롬프트
const TEST_PROMPT = `RSI와 MACD를 활용한 스윙 트레이딩 전략을 만들어주세요.

요구사항:
- RSI(14) 지표 사용
- MACD(12, 26, 9) 사용
- 손절 2% 이하로 제한
- 수익목표 5% 이상
- 타임프레임: 1시간 차트`;

// ANSI 컬러
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function printSection(title) {
  console.log('\n' + '='.repeat(60));
  log(colors.bright + colors.cyan, `  ${title}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Test 1: PoC (2-Persona)
 */
async function testPoC() {
  printSection('TEST 1: PoC (2-Persona MoA)');

  const startTime = Date.now();

  // Layer 1: 2-Persona
  log(colors.yellow, '📈 [Layer 1] Generating perspectives...');

  const perspectives = await Promise.all([
    // Technical Analyst
    client.messages.create({
      model: 'claude-4-sonnet-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: `You are a TECHNICAL ANALYSIS expert. Focus on RSI, MACD, moving averages. Provide specific entry/exit conditions.`,
        },
        { role: 'user', content: TEST_PROMPT },
      ],
    }),
    // Risk Manager
    client.messages.create({
      model: 'claude-4-sonnet-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: `You are a RISK MANAGEMENT specialist. Focus on stop-loss, take-profit, position sizing.`,
        },
        { role: 'user', content: TEST_PROMPT },
      ],
    }),
  ]);

  log(colors.green, '✅ Layer 1 완료');
  console.log('  - Technical Analyst:', perspectives[0].usage.output_tokens, 'tokens');
  console.log('  - Risk Manager:', perspectives[1].usage.output_tokens, 'tokens');

  // Layer 2: Aggregation
  log(colors.yellow, '\n✨ [Layer 2] Aggregating...');

  const aggregated = await client.messages.create({
    model: 'claude-4-sonnet-20250514',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: `Synthesize these expert perspectives into ONE trading strategy:

[Technical Analyst]
${perspectives[0].content[0].text}

[Risk Manager]
${perspectives[1].content[0].text}

Create a unified, executable strategy in Korean.`,
      },
    ],
  });

  log(colors.green, '✅ Layer 2 완료');

  // 결과 출력
  const totalLatency = Date.now() - startTime;
  const totalTokens = perspectives.reduce((sum, p) => sum + p.usage.input_tokens + p.usage.output_tokens, 0) +
    aggregated.usage.input_tokens +
    aggregated.usage.output_tokens;
  const estimatedCost = (totalTokens / 1_000_000) * 9; // $9/1M tokens

  printSection('RESULT: PoC Strategy');
  console.log(aggregated.content[0].text);

  printSection('METRICS');
  console.log(`  Total Latency: ${(totalLatency / 1000).toFixed(2)}s`);
  console.log(`  Total Tokens: ${totalTokens.toLocaleString()}`);
  console.log(`  Estimated Cost: $${estimatedCost.toFixed(4)}`);
  console.log(`  Perspectives: 2`);
}

/**
 * Test 2: Baseline (단일 AI)
 */
async function testBaseline() {
  printSection('TEST 2: Baseline (단일 AI)');

  const startTime = Date.now();

  const result = await client.messages.create({
    model: 'claude-4-sonnet-20250514',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: `Create a complete trading strategy based on:

${TEST_PROMPT}

Include:
1. Entry conditions (technical indicators)
2. Exit conditions (stop loss, take profit)
3. Risk management (position sizing)
4. Timeframe recommendation`,
      },
    ],
  });

  const totalLatency = Date.now() - startTime;
  const totalTokens = result.usage.input_tokens + result.usage.output_tokens;
  const estimatedCost = (totalTokens / 1_000_000) * 9;

  printSection('RESULT: Baseline Strategy');
  console.log(result.content[0].text);

  printSection('METRICS');
  console.log(`  Total Latency: ${(totalLatency / 1000).toFixed(2)}s`);
  console.log(`  Total Tokens: ${totalTokens.toLocaleString()}`);
  console.log(`  Estimated Cost: $${estimatedCost.toFixed(4)}`);
}

/**
 * Test 3: Comparison (PoC vs Baseline)
 */
async function testComparison() {
  printSection('COMPARISON: MoA vs Baseline');

  log(colors.yellow, '🔄 Running both tests...\n');

  // Run both in sequence
  const pocStart = Date.now();
  await testPoC();
  const pocTime = Date.now() - pocStart;

  const baselineStart = Date.now();
  await testBaseline();
  const baselineTime = Date.now() - baselineStart;

  printSection('FINAL COMPARISON');
  console.log(`  PoC (2-Persona):   ${(pocTime / 1000).toFixed(2)}s`);
  console.log(`  Baseline (단일 AI): ${(baselineTime / 1000).toFixed(2)}s`);
  console.log(`  Latency Overhead:  ${(((pocTime - baselineTime) / baselineTime) * 100).toFixed(1)}%`);

  log(colors.green, '\n✅ 비교 테스트 완료');
}

/**
 * Main
 */
async function main() {
  const command = process.argv[2] || 'poc';

  if (!process.env.ANTHROPIC_API_KEY) {
    log(colors.red, '❌ ANTHROPIC_API_KEY가 설정되지 않았습니다.');
    log(colors.yellow, '💡 .env.local 파일에 API 키를 추가하세요.');
    process.exit(1);
  }

  printSection('HEPHAITOS MoA Test Suite');
  console.log(`  Test Prompt: "${TEST_PROMPT.substring(0, 50)}..."\n`);

  switch (command) {
    case 'poc':
      await testPoC();
      break;
    case 'baseline':
      await testBaseline();
      break;
    case 'compare':
      await testComparison();
      break;
    case 'full':
      log(colors.yellow, 'Full 4-Persona test requires TypeScript environment.');
      log(colors.yellow, 'Use: npm run test:moa');
      break;
    default:
      log(colors.red, `❌ Unknown command: ${command}`);
      console.log('\nAvailable commands:');
      console.log('  poc      - Test PoC (2-Persona)');
      console.log('  baseline - Test Baseline (단일 AI)');
      console.log('  compare  - Compare MoA vs Baseline');
      process.exit(1);
  }
}

main().catch((error) => {
  log(colors.red, '\n❌ Error:', error.message);
  process.exit(1);
});
