# 🔥 HEPHAITOS

> **"Replit for Trading"** - Build AI trading bots with natural language, no coding required

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Claude AI](https://img.shields.io/badge/Claude-4.5-purple)](https://anthropic.com/)

**HEPHAITOS** is an AI-powered investment education platform that enables anyone to build, backtest, and deploy trading strategies using natural language - just like how Replit lets you build apps without setup.

[Features](#-features) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack) • [Documentation](#-documentation) • [Contributing](#-contributing)

---

## 🎯 Core Features

### Copy-Learn-Build Methodology

```
1. COPY  → Mirror celebrity portfolios (Free)
   Follow Nancy Pelosi, Warren Buffett, and verified traders

2. LEARN → Understand the "why" with AI + human mentors
   AI tutor (1 credit) + Live coaching (20 credits)

3. BUILD → Create your own AI trading strategies
   Natural language → Python strategy (10 credits)
   Backtesting with 10 years of data (3 credits)
```

### Key Highlights

- **No-Code Strategy Builder**: "Buy when RSI < 30" → Working Python code
- **Browser-Based Backtesting**: Test strategies on 10 years of historical data
- **Multi-Broker Support**: Korea (KIS), US (Alpaca), Crypto (Binance/Upbit)
- **AI Strategy Generation**: Powered by Claude 4.5 Opus
- **Real-Time Queue System**: Handle 100+ concurrent backtests with BullMQ + Redis
- **Credit-Based Pricing**: Pay only for what you use, no monthly subscription

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm/pnpm
- **Supabase** account ([free tier](https://supabase.com))
- **Claude API** key ([Anthropic](https://console.anthropic.com))
- **Upstash Redis** for queue system ([free tier](https://upstash.com))

### Installation (3 steps)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Run development server
npm run dev
# → http://localhost:3000
```

For detailed setup including Supabase migrations and Redis configuration, see [QUICK_START.md](./QUICK_START.md).

---

## 📦 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript 5.3 (strict mode)
- **Styling**: Tailwind CSS 4.0 + Custom Glass Morphism Design System
- **State Management**: Zustand + TanStack Query
- **Charts**: TradingView Lightweight Charts, Recharts
- **UI Components**: Custom components with Linear-inspired design

### Backend
- **Database**: Supabase (PostgreSQL + Realtime subscriptions)
- **Queue System**: BullMQ + Upstash Redis (backtest queue)
- **AI Engine**: Vercel AI SDK 5.0 + Claude 4.5
- **Authentication**: Supabase Auth (OAuth + Email)
- **Payments**: TossPayments (Credit system)

### Key Libraries
- **Trading Signals**: `trading-signals` for technical indicators
- **Backtesting**: Custom Python execution via Pyodide (browser-based)
- **Real-time**: Supabase Realtime for live progress updates
- **Security**: Rate limiting, DOMPurify for XSS prevention

---

## 🎨 Design System

Inspired by **Linear** and **CATALYST AI**, our design system features:

- **Deep Space Dark Theme**: #0D0D0F background with Aurora gradients
- **Glass Morphism**: Translucent cards with `backdrop-blur-xl`
- **Linear Purple**: #5E6AD2 as signature color
- **Micro-interactions**: Smooth animations with Framer Motion

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for complete design tokens and guidelines.

---

## 💎 Credit System

Pay only for what you use - no monthly subscriptions.

### Pricing Packages

| Package | Credits | Price | Bonus | Unit Price |
|---------|---------|-------|-------|------------|
| Starter | 100 | ₩9,900 | - | ₩99/credit |
| Basic | 500 | ₩39,000 | +50 | ₩71/credit |
| Pro | 1,000 | ₩69,000 | +150 | ₩60/credit |
| Enterprise | 5,000 | ₩299,000 | +1,000 | ₩50/credit |

### Feature Costs

| Feature | Credits | Description |
|---------|---------|-------------|
| Celebrity Mirroring (COPY) | **0** | Free entry point |
| AI Tutor Q&A | **1** | Low-cost learning |
| AI Strategy Generation | **10** | Core revenue driver |
| Backtesting (1 year) | **3** | Validation essential |
| Live Coaching (30 min) | **20** | Premium service |
| Real-time Alerts (1 day) | **5** | Continuous usage |

---

## 📁 Project Structure

```
HEPHAITOS/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Authentication pages
│   │   ├── (dashboard)/          # Dashboard pages
│   │   └── api/                  # API Routes
│   │       ├── credits/          # Credit system API
│   │       ├── backtest/         # Backtest + Queue API
│   │       ├── ai/               # AI strategy generation
│   │       └── payments/         # Payment processing
│   ├── components/
│   │   ├── ui/                   # Base UI components
│   │   ├── credits/              # Credit UI components
│   │   ├── charts/               # Chart components
│   │   └── dashboard/            # Dashboard widgets
│   ├── lib/
│   │   ├── supabase/             # Supabase client
│   │   ├── ai/                   # AI engine (Claude 4)
│   │   ├── queue/                # BullMQ + Redis queue
│   │   ├── credits/              # Credit logic
│   │   └── trading/              # Trading engine
│   ├── stores/                   # Zustand stores
│   └── types/                    # TypeScript types
├── supabase/
│   ├── migrations/               # Database migrations
│   └── seed.sql                  # Initial data
├── scripts/                      # Automation scripts
├── docs/                         # Documentation
├── .claude/                      # Claude Code configuration
└── e2e/                          # Playwright E2E tests
```

---

## 🤖 AI Features

### MoA (Mixture-of-Agents) Strategy Generation

4 specialized AI agents collaborate to create optimal trading strategies:

```typescript
import { MoAEngine } from '@/lib/moa/engine';

const engine = new MoAEngine();
const result = await engine.generateStrategy(
  'Create a value investing strategy like Warren Buffett',
  'comprehensive' // draft(5) | refined(10) | comprehensive(20) credits
);

// 4 expert perspectives
result.perspectives.forEach(p => {
  console.log(`${p.icon} ${p.name}: ${p.confidence}% confidence`);
});

// Final aggregated strategy
console.log(result.aggregated);
```

**Expected Impact**:
- Sharpe Ratio: +12% (1.2 → 1.34)
- Backtest Pass Rate: +12%p (60% → 72%)
- User Satisfaction (NPS): 70+

See [MOA_IMPLEMENTATION_GUIDE.md](./MOA_IMPLEMENTATION_GUIDE.md) for details.

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev                # Start dev server
npm run build              # Production build
npm run start              # Production server

# Testing
npm run test               # Unit tests (Vitest)
npm run test:e2e           # E2E tests (Playwright)
npm run test:coverage      # Coverage report
npm run test:api           # API connection test

# Queue Worker
npm run worker             # Start backtest worker (dev)
npm run worker:prod        # Start backtest worker (production)

# Linting & Type Checking
npm run lint               # ESLint
npm run typecheck          # TypeScript check

# Storybook
npm run storybook          # Component development
npm run build-storybook    # Build static Storybook

# CI
npm run ci                 # Lint + Test + Build
```

### Environment Variables

Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Upstash Redis (Queue System)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# TossPayments (Optional)
TOSS_CLIENT_KEY=your_toss_client_key
TOSS_SECRET_KEY=your_toss_secret_key

# Credit System
NEXT_PUBLIC_CREDIT_ENABLED=true
NEXT_PUBLIC_WELCOME_BONUS=50
```

See [API_KEY_SETUP_GUIDE.md](./API_KEY_SETUP_GUIDE.md) for detailed instructions.

---

## 🗄️ Database Schema

### Key Tables

- **credit_wallets**: User credit balances
- **credit_transactions**: Credit purchase/spend history
- **strategies**: User-created trading strategies
- **backtest_results**: Historical backtest results
- **backtest_jobs**: Queue job tracking with real-time progress

Run migrations:

```bash
# Using Supabase CLI
supabase db push

# Or manually apply migrations in /supabase/migrations/
```

See [supabase/migrations/](./supabase/migrations/) for full schema.

---

## 🚨 Legal Compliance

**IMPORTANT**: HEPHAITOS is an **educational platform** that provides tools and knowledge, NOT investment advice.

### Prohibited Activities ❌

- Recommending specific stocks
- Giving buy/sell timing advice
- Guaranteeing returns

### Permitted Activities ✅

- Providing educational content
- Offering analytical tools
- Analyzing historical data

### Required Disclaimer

```
This service provides educational content and analytical tools only.
It does not constitute investment advice.
All investment decisions are your own responsibility.
Past performance does not guarantee future results.
```

See [BUSINESS_CONSTITUTION.md](./BUSINESS_CONSTITUTION.md) for complete legal framework.

---

## 📚 Documentation

### For Users
- [Quick Start Guide](./QUICK_START.md) - Get started in 5 minutes
- [API Key Setup](./API_KEY_SETUP_GUIDE.md) - Detailed API key instructions
- [FAQ](./docs/FAQ.md) - Frequently asked questions

### For Developers
- [Developer Onboarding](./docs/DEVELOPER_ONBOARDING_GUIDE.md) - Complete setup guide
- [Architecture](./DESIGN_SYSTEM.md) - System design and patterns
- [API Reference](./docs/HEPHAITOS_CORE_REFERENCES.md) - External API documentation
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute

### For Investors
- [Business Overview](./BUSINESS_OVERVIEW.md) - Business model and market
- [Investor Pitch Deck](./docs/INVESTOR_PITCH_DECK.md) - Investment opportunity
- [Financial Model](./docs/FINANCIAL_MODEL_V2.md) - Revenue projections

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- **TypeScript strict mode** - No `any` types
- **ESLint** - Follow configured rules
- **Prettier** - Auto-formatting on commit
- **Commit messages** - Follow Conventional Commits
- **Tests** - Add tests for new features

---

## 📊 Performance

- **Lighthouse Score**: 95+ (Mobile & Desktop)
- **First Contentful Paint**: < 1.2s
- **Time to Interactive**: < 2.8s
- **Bundle Size**: < 450KB (gzipped)

See [performance benchmarks](./docs/PERFORMANCE_BENCHMARK_GUIDE_2025-12-21.md) for details.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact & Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/hephaitos/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/hephaitos/discussions)

---

## 🙏 Acknowledgments

- **Design Inspiration**: [Linear](https://linear.app) & CATALYST AI
- **AI Engine**: Powered by [Claude 4.5](https://anthropic.com) (Anthropic)
- **Charts**: [TradingView Lightweight Charts](https://tradingview.github.io/lightweight-charts/)
- **Framework**: [Next.js](https://nextjs.org) by Vercel
- **Backend**: [Supabase](https://supabase.com) - Open source Firebase alternative

---

## 🎓 Educational Philosophy

> "We don't teach people to trade. We teach them to think like traders and build their own systems."

HEPHAITOS follows the **Copy-Learn-Build** methodology:
1. **Copy** proven strategies to understand what works
2. **Learn** the principles through AI tutors and human mentors
3. **Build** your own unique trading system with full autonomy

---

**Made with ❤️ by the HEPHAITOS Team**

**Core Mission**: Democratize algorithmic trading through AI-powered education and tools.
