// 전체 API 연결 테스트
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

console.log('════════════════════════════════════════');
console.log('  HEPHAITOS API 연결 테스트');
console.log('════════════════════════════════════════\n');

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

// 테스트 결과 출력 헬퍼
function printResult(service, status, message = '') {
  const icons = {
    success: '✅',
    fail: '❌',
    skip: '⏭️ '
  };

  const colors = {
    success: '\x1b[32m', // Green
    fail: '\x1b[31m',    // Red
    skip: '\x1b[33m',    // Yellow
    reset: '\x1b[0m'
  };

  console.log(`${icons[status]} ${service}: ${colors[status]}${status.toUpperCase()}${colors.reset}`);
  if (message) {
    console.log(`   ${message}`);
  }
  console.log('');

  results.total++;
  if (status === 'success') results.passed++;
  else if (status === 'fail') results.failed++;
  else if (status === 'skip') results.skipped++;
}

// 1. Supabase 테스트
async function testSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    printResult('Supabase', 'fail', 'NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않음');
    return;
  }

  try {
    const supabase = createClient(url, key);
    const { error } = await supabase.from('_test_connection').select('*').limit(1);

    if (error && error.code === '42P01') {
      printResult('Supabase', 'success', '연결 정상 (테이블 없음은 정상)');
    } else if (error) {
      printResult('Supabase', 'fail', error.message);
    } else {
      printResult('Supabase', 'success', '연결 및 쿼리 정상');
    }
  } catch (err) {
    printResult('Supabase', 'fail', err.message);
  }
}

// 2. Anthropic (Claude AI) 테스트
async function testAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    printResult('Claude AI (Anthropic)', 'skip', 'ANTHROPIC_API_KEY가 설정되지 않음');
    return;
  }

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-4-haiku-20250321',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    });

    printResult('Claude AI (Anthropic)', 'success', `모델: ${message.model}, 토큰: ${message.usage.input_tokens + message.usage.output_tokens}`);
  } catch (err) {
    if (err.status === 401) {
      printResult('Claude AI (Anthropic)', 'fail', 'API 키가 유효하지 않음');
    } else {
      printResult('Claude AI (Anthropic)', 'fail', err.message);
    }
  }
}

// 3. KIS API 테스트
async function testKIS() {
  const appKey = process.env.KIS_APP_KEY;
  const appSecret = process.env.KIS_APP_SECRET;

  if (!appKey || !appSecret) {
    printResult('KIS (한국투자증권)', 'skip', 'KIS_APP_KEY 또는 KIS_APP_SECRET가 설정되지 않음');
    return;
  }

  try {
    // OAuth 토큰 발급 테스트
    const isVirtual = process.env.KIS_VIRTUAL === 'true';
    const baseUrl = isVirtual
      ? 'https://openapivts.koreainvestment.com:29443'
      : 'https://openapi.koreainvestment.com:9443';

    const response = await fetch(`${baseUrl}/oauth2/tokenP`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: appKey,
        appsecret: appSecret
      })
    });

    const data = await response.json();

    if (data.access_token) {
      printResult('KIS (한국투자증권)', 'success', `OAuth 토큰 발급 성공 (${isVirtual ? '모의투자' : '실전투자'})`);
    } else {
      printResult('KIS (한국투자증권)', 'fail', data.msg || '토큰 발급 실패');
    }
  } catch (err) {
    printResult('KIS (한국투자증권)', 'fail', err.message);
  }
}

// 4. Polygon.io 테스트
async function testPolygon() {
  const apiKey = process.env.POLYGON_API_KEY;

  if (!apiKey) {
    printResult('Polygon.io', 'skip', 'POLYGON_API_KEY가 설정되지 않음');
    return;
  }

  try {
    // 간단한 시세 조회 테스트
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(
      `https://api.polygon.io/v1/open-close/AAPL/${today}?apiKey=${apiKey}`
    );

    const data = await response.json();

    if (response.ok) {
      printResult('Polygon.io', 'success', `API 연결 정상 (AAPL 데이터 조회 성공)`);
    } else if (response.status === 401) {
      printResult('Polygon.io', 'fail', 'API 키가 유효하지 않음');
    } else if (response.status === 403) {
      printResult('Polygon.io', 'fail', '플랜 제한 또는 API 키 권한 부족');
    } else {
      printResult('Polygon.io', 'fail', data.message || `HTTP ${response.status}`);
    }
  } catch (err) {
    printResult('Polygon.io', 'fail', err.message);
  }
}

// 5. 토스페이먼츠 테스트
async function testToss() {
  const clientKey = process.env.TOSS_CLIENT_KEY;
  const secretKey = process.env.TOSS_SECRET_KEY;

  if (!clientKey || !secretKey) {
    printResult('토스페이먼츠', 'skip', 'TOSS_CLIENT_KEY 또는 TOSS_SECRET_KEY가 설정되지 않음');
    return;
  }

  try {
    // 결제 조회 API 테스트 (빈 조회)
    const isTest = process.env.TOSS_TEST === 'true';
    const baseUrl = 'https://api.tosspayments.com';

    const response = await fetch(`${baseUrl}/v1/payments`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok || response.status === 404) {
      printResult('토스페이먼츠', 'success', `API 연결 정상 (${isTest ? '테스트' : '라이브'} 환경)`);
    } else if (response.status === 401) {
      printResult('토스페이먼츠', 'fail', 'API 키가 유효하지 않음');
    } else {
      const data = await response.json();
      printResult('토스페이먼츠', 'fail', data.message || `HTTP ${response.status}`);
    }
  } catch (err) {
    printResult('토스페이먼츠', 'fail', err.message);
  }
}

// 전체 테스트 실행
async function runAllTests() {
  await testSupabase();
  await testAnthropic();
  await testKIS();
  await testPolygon();
  await testToss();

  // 요약
  console.log('════════════════════════════════════════');
  console.log('  테스트 결과 요약');
  console.log('════════════════════════════════════════');
  console.log(`총 테스트: ${results.total}`);
  console.log(`✅ 성공: ${results.passed}`);
  console.log(`❌ 실패: ${results.failed}`);
  console.log(`⏭️  건너뜀: ${results.skipped}`);
  console.log('════════════════════════════════════════\n');

  if (results.failed > 0) {
    console.log('💡 실패한 API가 있습니다.');
    console.log('   API_KEY_SETUP_GUIDE.md 파일을 참고하여 API 키를 발급받으세요.\n');
    process.exit(1);
  } else if (results.skipped === results.total) {
    console.log('⚠️  모든 API가 설정되지 않았습니다.');
    console.log('   최소한 ANTHROPIC_API_KEY는 설정해주세요.\n');
    process.exit(1);
  } else {
    console.log('🎉 모든 설정된 API 연결 성공!\n');
    process.exit(0);
  }
}

runAllTests();
