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
import { MoAEngine } from '@/lib/moa/engine';
import { getRequiredCredits } from '@/lib/credits/moa-pricing';
// import { checkCreditBalance, deductCredits } from '@/lib/credits/balance';
// import { createClient } from '@/lib/supabase/server';

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

    // TODO: User authentication (현재는 스킵)
    // const supabase = createClient();
    // const {
    //   data: { user },
    //   error: authError,
    // } = await supabase.auth.getUser();
    //
    // if (authError || !user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // TODO: Credit balance check (현재는 스킵)
    // const requiredCredits = getRequiredCredits(tier);
    // const balance = await checkCreditBalance(user.id);
    //
    // if (balance < requiredCredits) {
    //   return NextResponse.json(
    //     {
    //       error: 'Insufficient credits',
    //       required: requiredCredits,
    //       balance,
    //     },
    //     { status: 402 }
    //   );
    // }

    // Generate strategy using MoA Engine
    const engine = new MoAEngine();
    const result = await engine.generateStrategy(prompt, tier);

    // TODO: Deduct credits (현재는 스킵)
    // await deductCredits(user.id, requiredCredits, {
    //   feature: 'moa_strategy',
    //   tier,
    //   requestId: result.metadata.requestId,
    // });

    // Log for monitoring
    console.log('[MoA API] Strategy generated:', {
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
