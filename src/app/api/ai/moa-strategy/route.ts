/**
 * MoA Strategy Generation API
 *
 * POST /api/ai/moa-strategy
 *
 * Request:
 * {
 *   "prompt": "사용자 전략 요청",
 *   "tier": "draft" | "refined" | "comprehensive"
 * }
 *
 * Response:
 * {
 *   "tier": "refined",
 *   "perspectives": [...],
 *   "aggregated": "최종 전략",
 *   "validated": true,
 *   "totalCost": 0.032,
 *   "totalLatency": 15000,
 *   "metadata": {...}
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MoAEngine } from '@/lib/moa/engine';
import { getRequiredCredits } from '@/lib/credits/moa-pricing';
import { spendCredits, InsufficientCreditsError, getCreditBalance } from '@/lib/credits/spend-helper';
import { safeLogger } from '@/lib/utils/safe-logger';

// Request validation schema
const MoARequestSchema = z.object({
  prompt: z.string().min(10, '최소 10자 이상 입력해주세요'),
  tier: z.enum(['draft', 'refined', 'comprehensive']).default('refined'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const validation = MoARequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { prompt, tier } = validation.data;

    // 사용자 인증
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 크레딧 잔액 확인
    const requiredCredits = getRequiredCredits(tier);
    const balance = await getCreditBalance(user.id);

    if (balance < requiredCredits) {
      safeLogger.warn('[MoA API] Insufficient credits', {
        userId: user.id,
        required: requiredCredits,
        balance,
      });
      return NextResponse.json(
        {
          error: 'INSUFFICIENT_CREDITS',
          message: '크레딧이 부족합니다',
          required: requiredCredits,
          balance,
        },
        { status: 402 }
      );
    }

    // 크레딧 차감 (ai_strategy 카테고리 사용)
    try {
      await spendCredits({
        userId: user.id,
        feature: 'ai_strategy',
        amount: requiredCredits,
        metadata: {
          tier,
          promptLength: prompt.length,
        },
      });
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return NextResponse.json(
          {
            error: 'INSUFFICIENT_CREDITS',
            message: '크레딧이 부족합니다',
            required: error.required,
            current: error.current,
          },
          { status: 402 }
        );
      }
      safeLogger.error('[MoA API] Credit spend failed', { error });
      return NextResponse.json(
        { error: '크레딧 처리 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    // Generate strategy using MoA Engine
    const engine = new MoAEngine();
    const result = await engine.generateStrategy(prompt, tier);

    // Log for monitoring
    safeLogger.info('[MoA API] Strategy generated', {
      userId: user.id,
      tier,
      perspectives: result.perspectives.length,
      validated: result.validated,
      cost: result.totalCost,
      latency: result.totalLatency,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[MoA API] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/moa-strategy/pricing
 *
 * Returns MoA pricing information
 */
export async function GET() {
  const { MOA_PRICING } = await import('@/lib/credits/moa-pricing');

  return NextResponse.json({
    tiers: Object.entries(MOA_PRICING).map(([key, value]) => ({
      tier: key,
      ...value,
      priceKRW: value.credits * 71,
    })),
  });
}
