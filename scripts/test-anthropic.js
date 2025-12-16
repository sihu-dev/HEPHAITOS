// Claude AI (Anthropic) 연결 테스트
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const apiKey = process.env.ANTHROPIC_API_KEY;

console.log('🔍 Claude AI (Anthropic) 연결 테스트 시작...\n');

if (!apiKey) {
  console.log('❌ ANTHROPIC_API_KEY가 설정되지 않았습니다.');
  console.log('   .env.local 파일을 확인하세요.\n');
  process.exit(1);
}

console.log('✅ API 키 확인:', apiKey.substring(0, 20) + '...\n');

const client = new Anthropic({
  apiKey: apiKey,
});

async function testConnection() {
  try {
    console.log('📡 API 호출 테스트 중...');

    const message = await client.messages.create({
      model: 'claude-4-haiku-20250321',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: 'Hello! Please respond with "API connection successful"'
        }
      ]
    });

    console.log('✅ API 연결 성공!\n');
    console.log('📝 응답:', message.content[0].text);
    console.log('\n🎯 모델:', message.model);
    console.log('💰 사용량:');
    console.log('   - Input tokens:', message.usage.input_tokens);
    console.log('   - Output tokens:', message.usage.output_tokens);

    // 대략적인 비용 계산 (Haiku 기준)
    const inputCost = (message.usage.input_tokens / 1000000) * 0.40;
    const outputCost = (message.usage.output_tokens / 1000000) * 2.00;
    const totalCost = inputCost + outputCost;

    console.log(`   - 예상 비용: $${totalCost.toFixed(6)}`);

    console.log('\n✨ Claude AI 설정 완료!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ API 호출 실패:', error.message);

    if (error.status === 401) {
      console.log('\n💡 해결 방법:');
      console.log('   1. API 키가 올바른지 확인하세요.');
      console.log('   2. https://console.anthropic.com/에서 새 키를 발급받으세요.\n');
    } else if (error.status === 429) {
      console.log('\n💡 Rate limit 초과. 잠시 후 다시 시도하세요.\n');
    } else {
      console.log('\n💡 오류 상세:', error);
    }

    process.exit(1);
  }
}

testConnection();
