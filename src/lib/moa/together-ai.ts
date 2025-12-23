/**
 * Together AI Integration
 *
 * Open-source LLM provider for cost optimization
 * - Llama 3.1 70B: $0.88 / 1M tokens
 * - Mixtral 8x7B: $0.60 / 1M tokens
 * - Qwen 2.5 72B: $0.50 / 1M tokens
 *
 * vs Claude Sonnet: $9 / 1M tokens (평균)
 */

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const TOGETHER_BASE_URL = 'https://api.together.xyz/v1';

interface TogetherAIConfig {
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  repetitionPenalty?: number;
}

interface TogetherAIResponse {
  text: string;
  tokensUsed: number;
  finishReason: string;
}

/**
 * Together AI Models
 */
export const TOGETHER_MODELS = {
  'llama-3.1-70b': 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
  'llama-3.1-8b': 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
  'mixtral-8x7b': 'mistralai/Mixtral-8x7B-Instruct-v0.1',
  'mixtral-8x22b': 'mistralai/Mixtral-8x22B-Instruct-v0.1',
  'qwen-2.5-72b': 'Qwen/Qwen2.5-72B-Instruct-Turbo',
  'qwen-2.5-7b': 'Qwen/Qwen2.5-7B-Instruct-Turbo',
} as const;

/**
 * Call Together AI Chat Completion
 */
export async function callTogetherAI(
  systemPrompt: string,
  userPrompt: string,
  config: TogetherAIConfig
): Promise<TogetherAIResponse> {
  if (!TOGETHER_API_KEY) {
    throw new Error('TOGETHER_API_KEY가 설정되지 않았습니다.');
  }

  const modelId = TOGETHER_MODELS[config.model as keyof typeof TOGETHER_MODELS] || config.model;

  const response = await fetch(`${TOGETHER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOGETHER_API_KEY}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: config.maxTokens || 600,
      temperature: config.temperature || 0.7,
      top_p: config.topP || 0.9,
      top_k: config.topK || 50,
      repetition_penalty: config.repetitionPenalty || 1.0,
      stop: ['<|eot_id|>', '<|im_end|>'],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Together AI API 호출 실패: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    text: data.choices[0]?.message?.content || '',
    tokensUsed: data.usage?.total_tokens || 0,
    finishReason: data.choices[0]?.finish_reason || 'unknown',
  };
}

/**
 * Batch call (for parallel perspectives)
 */
export async function callTogetherAIBatch(
  requests: Array<{
    systemPrompt: string;
    userPrompt: string;
    model: string;
  }>
): Promise<TogetherAIResponse[]> {
  return Promise.all(
    requests.map((req) =>
      callTogetherAI(req.systemPrompt, req.userPrompt, { model: req.model })
    )
  );
}

/**
 * Cost calculator
 */
export function calculateTogetherAICost(model: string, tokensUsed: number): number {
  const pricePerMillion: Record<string, number> = {
    'llama-3.1-70b': 0.88,
    'llama-3.1-8b': 0.20,
    'mixtral-8x7b': 0.60,
    'mixtral-8x22b': 1.20,
    'qwen-2.5-72b': 0.50,
    'qwen-2.5-7b': 0.15,
  };

  const price = pricePerMillion[model] || 0.88;
  return (tokensUsed / 1_000_000) * price;
}

/**
 * Health check
 */
export async function checkTogetherAIHealth(): Promise<boolean> {
  try {
    const result = await callTogetherAI(
      'You are a helpful assistant.',
      'Say "OK" if you are working.',
      { model: 'llama-3.1-8b', maxTokens: 10 }
    );
    return result.text.toLowerCase().includes('ok');
  } catch (error) {
    safeLogger.error('[Together AI] Health check failed:', error);
    return false;
  }
}
