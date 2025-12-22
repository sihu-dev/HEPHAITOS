// ============================================
// Chart Analysis API Route
// Claude Vision을 활용한 차트 이미지 분석
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { claudeVisionProvider } from '@/lib/api/providers/claude-vision'
import { z } from 'zod'
import type { ChartAnalysisRequest, ChartAnalysisResponse } from '@/types'

// ============================================
// Request Validation Schema
// ============================================

const ChartAnalysisRequestSchema = z.object({
  chartImage: z.string().min(100), // base64 image
  symbol: z.string().min(1).max(20),
  timeframe: z.string().optional(),
  question: z.string().optional(),
})

// ============================================
// POST /api/ai/chart-analysis
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate input
    const validatedData = ChartAnalysisRequestSchema.parse(body)

    // Remove base64 prefix if exists
    const chartImageBase64 = validatedData.chartImage.includes(',')
      ? validatedData.chartImage.split(',')[1]
      : validatedData.chartImage

    // Prepare request
    const analysisRequest: ChartAnalysisRequest = {
      chartImageBase64,
      symbol: validatedData.symbol,
      timeframe: validatedData.timeframe,
      question: validatedData.question,
    }

    // Call Claude Vision API
    const analysis = await claudeVisionProvider.analyzeChartImage(analysisRequest)

    // Return response
    const response: ChartAnalysisResponse = {
      ...analysis,
    }

    return NextResponse.json({
      success: true,
      data: response,
    })

  } catch (error) {
    console.error('[Chart Analysis API] Error:', error)

    // Zod validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    // Claude API error
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ANALYSIS_ERROR',
            message: error.message,
          },
        },
        { status: 500 }
      )
    }

    // Unknown error
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
        },
      },
      { status: 500 }
    )
  }
}

// ============================================
// OPTIONS (CORS)
// ============================================

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  )
}
