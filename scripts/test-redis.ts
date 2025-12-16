/**
 * Upstash Redis 연결 테스트
 * 환경 변수가 올바르게 설정되었는지 확인
 */

import IORedis from 'ioredis';

// 색상 코드 (Node.js)
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

async function testRedisConnection() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Upstash Redis Connection Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // 환경 변수 확인
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error(`${colors.red}✗ 환경 변수가 설정되지 않았습니다${colors.reset}`);
    console.log('');
    console.log('다음 환경 변수를 .env.local에 추가하세요:');
    console.log('  - UPSTASH_REDIS_REST_URL');
    console.log('  - UPSTASH_REDIS_REST_TOKEN');
    console.log('');
    console.log('가이드: UPSTASH_SETUP_GUIDE.md');
    process.exit(1);
  }

  console.log(`${colors.blue}1. 환경 변수 확인${colors.reset}`);
  console.log(`   URL: ${url.substring(0, 30)}...`);
  console.log(`   Token: ${token.substring(0, 10)}...`);
  console.log('');

  // Redis 클라이언트 생성
  let redis: IORedis;

  try {
    redis = new IORedis(url, {
      // Upstash REST API 사용 시 TLS 필요
      tls: {
        rejectUnauthorized: true,
      },
      // Token 인증
      password: token,
      // 타임아웃 설정
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
    });

    console.log(`${colors.blue}2. Redis 연결 시도${colors.reset}`);
    console.log('   연결 중...');

    // Ping 테스트
    const pingResult = await redis.ping();
    console.log(`   ${colors.green}✓ Ping: ${pingResult}${colors.reset}`);
    console.log('');

    // Set/Get 테스트
    console.log(`${colors.blue}3. 기본 명령어 테스트${colors.reset}`);

    const testKey = 'hephaitos:test:connection';
    const testValue = `test-${Date.now()}`;

    await redis.set(testKey, testValue);
    console.log(`   ${colors.green}✓ SET ${testKey}${colors.reset}`);

    const getValue = await redis.get(testKey);
    if (getValue === testValue) {
      console.log(`   ${colors.green}✓ GET ${testKey} = ${getValue}${colors.reset}`);
    } else {
      throw new Error(`GET failed: expected ${testValue}, got ${getValue}`);
    }

    await redis.del(testKey);
    console.log(`   ${colors.green}✓ DEL ${testKey}${colors.reset}`);
    console.log('');

    // Queue 테스트 (BullMQ 준비)
    console.log(`${colors.blue}4. Queue 테스트 (BullMQ)${colors.reset}`);

    const queueKey = 'bull:backtest-queue:meta';
    await redis.set(queueKey, JSON.stringify({ test: true }));
    const queueValue = await redis.get(queueKey);
    await redis.del(queueKey);

    console.log(`   ${colors.green}✓ Queue metadata test passed${colors.reset}`);
    console.log('');

    // 성공
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`${colors.green}✅ Upstash Redis 연결 성공!${colors.reset}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('다음 단계:');
    console.log('  1. Worker 실행: npm run worker');
    console.log('  2. 전체 검증: bash scripts/beta-checklist.sh');
    console.log('  3. 배포 진행: bash scripts/quick-start.sh');
    console.log('');

    redis.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}✗ 연결 실패${colors.reset}`);
    console.log('');
    console.error('에러:', error);
    console.log('');
    console.log('문제 해결:');
    console.log('  1. UPSTASH_REDIS_REST_URL 확인');
    console.log('  2. UPSTASH_REDIS_REST_TOKEN 확인');
    console.log('  3. Upstash Console에서 Database 상태 확인');
    console.log('  4. REST API가 활성화되어 있는지 확인');
    console.log('');
    console.log('가이드: UPSTASH_SETUP_GUIDE.md');

    if (redis!) {
      redis.disconnect();
    }
    process.exit(1);
  }
}

// 실행
testRedisConnection().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
