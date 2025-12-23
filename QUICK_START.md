# Quick Start

Get HEPHAITOS running in 5 minutes.

## Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Anthropic API key

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required
ANTHROPIC_API_KEY=sk-ant-api03-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 3. Run development server

```bash
pnpm dev
```

Open [localhost:3000](http://localhost:3000)

## Commands

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm test         # Run tests
pnpm lint         # Lint code
```

## Next Steps

- [CLAUDE.md](./CLAUDE.md) - Development guidelines
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - UI specifications
- [docs/FAQ.md](./docs/FAQ.md) - Common questions
