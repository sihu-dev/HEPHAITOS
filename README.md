# HEPHAITOS

**Build trading strategies without code.**

A natural language trading platform that transforms your ideas into executable strategies.

[![Version](https://img.shields.io/badge/v2.0.0-black)](https://github.com/hephaitos)
[![Next.js](https://img.shields.io/badge/Next.js_15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-black)](https://www.typescriptlang.org)

---

## What is HEPHAITOS?

HEPHAITOS lets you create, test, and deploy trading strategies using natural language. No coding required.

```
"Create a momentum strategy that buys when RSI crosses above 30"
→ AI generates complete strategy with entry/exit rules
→ Backtest against historical data
→ Deploy to paper trading or live
```

## Core Features

| Feature | Description |
|---------|-------------|
| **Natural Language** | Describe strategies in plain language |
| **AI Generation** | Claude-powered strategy creation |
| **Backtesting** | Test against historical market data |
| **Portfolio Mirror** | Follow successful investor portfolios |
| **Multi-Broker** | Connect KIS, Alpaca, and more |

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local

# Run development server
pnpm dev
```

Open [localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + Realtime)
- **AI**: Claude 4 via Vercel AI SDK
- **Styling**: Tailwind CSS + Glass Morphism
- **State**: Zustand + TanStack Query

## Project Structure

```
src/
├── app/          # Next.js App Router
├── components/   # UI Components
├── lib/          # Core Logic
│   ├── ai/       # AI Strategy Engine
│   ├── broker/   # Broker Integrations
│   └── trading/  # Trading Engine
├── agents/       # Autonomous Agents
└── stores/       # State Management

packages/
├── types/        # Type Definitions
├── utils/        # Utilities
└── core/         # Core Services
```

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | Development guidelines |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | UI/UX specifications |
| [QUICK_START.md](./QUICK_START.md) | Setup guide |
| [docs/FAQ.md](./docs/FAQ.md) | Frequently asked questions |

## Legal

This platform provides educational tools and analysis only. Not investment advice.

All trading decisions are the user's responsibility.

## License

MIT

---

Built with Claude Code
