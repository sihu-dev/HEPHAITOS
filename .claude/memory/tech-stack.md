# HEPHAITOS Tech Stack

## Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4.0 + Custom Design System
- **Charts**: TradingView Lightweight Charts v5 / Recharts
- **State**: Zustand + TanStack Query

## Backend
- **Database**: Supabase (PostgreSQL + Realtime)
- **Auth**: Supabase Auth
- **AI**: Vercel AI SDK 4.2 + Claude 4
- **Payments**: Tosspayments

## External APIs

| API | 용도 | 비용 |
|-----|------|------|
| Unusual Whales | 의원 거래 데이터 | $999/월 |
| Quiver Quantitative | 대안 데이터 | $499/월 |
| SEC EDGAR | 공시 데이터 | 무료 |
| KIS Developers | 한국 증권사 연동 | 무료 |

## 개발 환경
- Node.js 18+
- pnpm (패키지 관리)
- Prettier (포맷팅)
- ESLint (린트)
- Playwright (E2E 테스트)

## 배포
- Vercel (프론트엔드)
- Supabase Cloud (백엔드)
- Redis Cloud (Rate Limiting)
