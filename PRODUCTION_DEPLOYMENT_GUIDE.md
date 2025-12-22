# HEPHAITOS Production Deployment Guide

> **Version**: 2.0.0
> **Last Updated**: 2025-12-22
> **Status**: Production Ready
> **Target**: Private Beta (50) → Public Beta (500) → Production (5,000)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Pre-deployment Checklist](#pre-deployment-checklist)
3. [Environment Setup](#environment-setup)
4. [Deployment Steps](#deployment-steps)
5. [Post-deployment Validation](#post-deployment-validation)
6. [Monitoring & Observability](#monitoring--observability)
7. [Rollback Plan](#rollback-plan)
8. [Beta Launch Timeline](#beta-launch-timeline)
9. [Infrastructure Costs](#infrastructure-costs)
10. [Scaling Strategy](#scaling-strategy)
11. [Troubleshooting Guide](#troubleshooting-guide)
12. [Emergency Procedures](#emergency-procedures)
13. [Appendix](#appendix)

---

## Executive Summary

**HEPHAITOS 2.0** is a production-ready AI trading platform that enables users to build, backtest, and deploy trading strategies without coding. This guide covers the complete deployment process from Private Beta to Production.

### Key Metrics

| Metric | Private Beta | Public Beta | Production |
|--------|-------------|-------------|------------|
| **Users** | 50 | 500 | 5,000 |
| **Duration** | 2 weeks | 1 month | 3 months |
| **Goal** | Feedback collection | Scaling test | PMF achievement |
| **Budget** | $100/month | $300/month | $1,000/month |

### Tech Stack Overview

```
Frontend:  Next.js 15 (App Router) + React 19 + Tailwind CSS
Backend:   Supabase (PostgreSQL + Auth + Realtime)
AI:        Claude API (Anthropic)
Queue:     BullMQ + Upstash Redis
Cache:     Upstash Redis
Payments:  Toss Payments
Deploy:    Vercel (Seoul region)
Monitor:   Sentry + Uptime Robot
```

---

## Pre-deployment Checklist

### Critical Requirements ⚠️

Before deploying to production, ensure ALL of the following are completed:

- [ ] **Environment variables configured** (see [Environment Setup](#environment-setup))
- [ ] **Supabase project created** and migrations applied
- [ ] **Upstash Redis database** created (Seoul region)
- [ ] **Vercel project linked** to GitHub repository
- [ ] **Claude API key** with sufficient credits ($100+)
- [ ] **Sentry project** created for error monitoring
- [ ] **Admin account** created in Supabase
- [ ] **All tests passing** (`pnpm test`)
- [ ] **Build successful** (`pnpm build`)
- [ ] **Security audit** completed

### Quick Validation Script

Run the automated checklist:

```bash
bash scripts/beta-checklist.sh
```

Expected output:
```
✓ Passed:  30+ checks
✗ Failed:  0 checks
⚠ Warnings: 0-3 checks
```

---

## Environment Setup

### 1. Vercel Environment Variables

Navigate to **Vercel Dashboard → Your Project → Settings → Environment Variables**

#### Required Variables (CRITICAL)

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://hephaitos.vercel.app

# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Anthropic AI (REQUIRED)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Upstash Redis for Queue (REQUIRED)
UPSTASH_REDIS_URL=rediss://default:password@region.upstash.io:6379
UPSTASH_REDIS_HOST=region.upstash.io
UPSTASH_REDIS_PORT=6379
UPSTASH_REDIS_PASSWORD=your_password

# Worker Configuration
WORKER_CONCURRENCY=5
WORKER_MAX_RETRIES=3

# NextAuth (REQUIRED)
NEXTAUTH_SECRET=your_nextauth_secret_min_32_chars
NEXTAUTH_URL=https://hephaitos.vercel.app
```

#### Recommended Variables

```bash
# Toss Payments (Credit System)
TOSS_CLIENT_KEY=test_ck_xxx
TOSS_SECRET_KEY=test_sk_xxx
TOSS_TEST=false  # Set to false for production

# Credit System
NEXT_PUBLIC_CREDIT_ENABLED=true
NEXT_PUBLIC_WELCOME_BONUS=50
NEXT_PUBLIC_REFERRAL_BONUS=30

# Sentry (Error Monitoring)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Feature Flags
NEXT_PUBLIC_USE_SUPABASE=true
```

#### Optional Variables

```bash
# Korea Investment & Securities (KIS)
KIS_APP_KEY=your_kis_app_key
KIS_APP_SECRET=your_kis_app_secret
KIS_VIRTUAL=false  # Set to false for real trading

# US Market Data
POLYGON_API_KEY=your_polygon_api_key

# Crypto Exchanges
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
UPBIT_API_KEY=your_upbit_api_key
UPBIT_API_SECRET=your_upbit_api_secret

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Slack Notifications
SLACK_WEBHOOK_URL_ALERTS=https://hooks.slack.com/services/xxx
SLACK_WEBHOOK_URL_REPORTS=https://hooks.slack.com/services/xxx

# Cron Secret (for API routes)
CRON_SECRET=your_cron_secret
```

### 2. Supabase Project Setup

#### Step 1: Create Project

1. Visit [Supabase Dashboard](https://app.supabase.com/)
2. Click **"New Project"**
3. Configure:
   - **Name**: `hephaitos-production`
   - **Database Password**: Strong password (save to password manager)
   - **Region**: `Seoul (Northeast Asia)`
   - **Plan**: Pro ($25/month) for production

#### Step 2: Configure Authentication

Navigate to **Authentication → Providers**:

- ✅ **Email**: Enabled
- ✅ **Google**: Enabled (OAuth credentials required)
- ✅ **Kakao**: Enabled (for Korean users)

Email Templates:
- Customize **Confirm Signup** template
- Customize **Reset Password** template
- Add HEPHAITOS branding

#### Step 3: Database Connection

Get connection details from **Settings → Database**:

```bash
# Connection String
postgres://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Direct Connection (for migrations)
Host: db.xxxxx.supabase.co
Database: postgres
Port: 5432
User: postgres
Password: [YOUR-PASSWORD]
```

### 3. Upstash Redis Setup

#### Step 1: Create Database

1. Visit [Upstash Console](https://console.upstash.com/)
2. Click **"Create Database"**
3. Configure:
   - **Name**: `hephaitos-backtest-queue`
   - **Type**: Regional
   - **Region**: `Seoul (ap-northeast-2)`
   - **Eviction**: `noeviction`
   - **TLS**: Enabled

#### Step 2: Get Credentials

Copy from dashboard:

```bash
UPSTASH_REDIS_URL=rediss://default:AbC...xyz@guided-mantis-12345.ap-northeast-2.upstash.io:6379
UPSTASH_REDIS_HOST=guided-mantis-12345.ap-northeast-2.upstash.io
UPSTASH_REDIS_PORT=6379
UPSTASH_REDIS_PASSWORD=AbC...xyz
```

#### Step 3: Test Connection

```bash
pnpm test:redis
```

Expected output:
```
✅ Connected: PONG
✅ Set key: OK
✅ Get key: test-value
```

### 4. Sentry Setup

#### Step 1: Create Project

1. Visit [Sentry Dashboard](https://sentry.io/)
2. Click **"Create Project"**
3. Configure:
   - **Platform**: Next.js
   - **Project Name**: hephaitos
   - **Team**: Your team

#### Step 2: Install SDK

Already installed in package.json:
```json
{
  "dependencies": {
    "@sentry/nextjs": "^7.x.x"
  }
}
```

#### Step 3: Configure

Create `sentry.client.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

Create `sentry.server.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### 5. Toss Payments Setup (Optional)

#### Step 1: Create Account

1. Visit [Toss Payments Developers](https://developers.tosspayments.com/)
2. Sign up and verify business
3. Get API keys from dashboard

#### Step 2: Test Mode First

```bash
TOSS_TEST=true  # Use test keys initially
```

Test cards:
- Card Number: `4242424242424242`
- Expiry: Any future date
- CVC: Any 3 digits

#### Step 3: Production Keys

After testing, switch to production keys:

```bash
TOSS_TEST=false
TOSS_CLIENT_KEY=live_ck_xxx
TOSS_SECRET_KEY=live_sk_xxx
```

---

## Deployment Steps

### Phase 1: Pre-deployment (Day -7)

#### 1.1 Code Freeze

```bash
# Create release branch
git checkout -b release/v2.0.0

# Final code review
git log --oneline -10
```

#### 1.2 Run Full Test Suite

```bash
# TypeScript type check
pnpm typecheck

# Linting
pnpm lint

# Unit tests
pnpm test

# E2E tests (all priorities)
pnpm test:e2e:p0  # Critical paths
pnpm test:e2e:p1  # Important flows
pnpm test:e2e:p2  # Nice-to-have
```

#### 1.3 Security Audit

```bash
# Check for hardcoded secrets
pnpm audit

# Check dependencies for vulnerabilities
pnpm audit --audit-level=high

# Check for forbidden words (investment advice)
bash scripts/forbidden-wording-check.sh
```

#### 1.4 Performance Audit

```bash
# Lighthouse audit
pnpm audit:lighthouse

# Bundle analysis
ANALYZE=true pnpm build
```

Expected metrics:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+
- Bundle size: < 500KB initial load

### Phase 2: Database Migration (Day -3)

#### 2.1 Backup Current Database

```bash
# Using Supabase CLI
supabase db dump -f backup-$(date +%Y%m%d).sql

# Or from dashboard
# Settings → Database → Backups → Create Manual Backup
```

#### 2.2 Apply Migrations

Link Supabase project:

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Apply migrations:

```bash
# Apply all migrations
bash scripts/deploy-migrations.sh

# Or manually
supabase db push
```

Critical migrations to verify:
- `20251216_loop11_backtest_queue.sql` - Queue system
- `20251222_user_tiers.sql` - User tier system
- `20251222_cache_metrics.sql` - Performance tracking

#### 2.3 Verify Migration Success

```bash
# Check migration status
supabase migration list

# Connect to database
psql "postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Verify tables
\dt

# Expected tables:
#  - users
#  - strategies
#  - backtest_jobs
#  - credit_transactions
#  - user_tiers
#  - cache_metrics
#  - safety_events
#  - etc.
```

#### 2.4 Row Level Security (RLS) Verification

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Critical policies to verify:
-- strategies: Users can only access their own strategies
-- backtest_jobs: Users can only access their own jobs
-- credit_transactions: Users can only view their own transactions
```

### Phase 3: Deploy Edge Functions (Day -2)

#### 3.1 Deploy Auto-Refund Handler

```bash
# Deploy function
supabase functions deploy auto-refund-handler

# Set environment variables
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxx
supabase secrets set ANTHROPIC_API_KEY=xxx
```

#### 3.2 Test Edge Function

```bash
# Invoke function
curl -X POST \
  https://xxxxx.supabase.co/functions/v1/auto-refund-handler \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "record": {
      "id": "test-123",
      "user_id": "test-user",
      "event_type": "safety_intervention"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "refund_issued": false,
  "message": "No refund needed (test)"
}
```

### Phase 4: Deploy to Vercel (Day -1)

#### 4.1 Build Locally First

```bash
# Clean build
rm -rf .next node_modules
pnpm install
pnpm build
```

Verify build output:
```
✓ Collecting page data
✓ Generating static pages (15/15)
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    XXX kB         XXX kB
├ ○ /auth/signin                         XXX kB         XXX kB
├ ○ /dashboard                           XXX kB         XXX kB
└ ○ /dashboard/strategies                XXX kB         XXX kB
```

#### 4.2 Deploy to Preview

```bash
# Deploy to preview environment
vercel

# Get preview URL
vercel ls
```

#### 4.3 Test Preview Deployment

```bash
# Get preview URL from Vercel output
PREVIEW_URL="https://hephaitos-xxx.vercel.app"

# Health check
curl "$PREVIEW_URL/api/health"

# Expected response:
# {"status":"ok","timestamp":"2025-12-22T..."}
```

#### 4.4 Deploy to Production

```bash
# Automated deployment script
bash scripts/auto-deploy.sh production

# Or manual
vercel --prod
```

#### 4.5 Verify Production Deployment

```bash
PRODUCTION_URL="https://hephaitos.vercel.app"

# Health check
curl "$PRODUCTION_URL/api/health"

# API endpoints
curl "$PRODUCTION_URL/api/strategies"

# Check headers
curl -I "$PRODUCTION_URL"
```

Expected headers:
```
strict-transport-security: max-age=63072000
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
```

### Phase 5: Start Worker (Day 0)

#### 5.1 Deploy Worker Process

For Vercel, use Railway or Render for worker:

**Railway:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create project
railway init

# Set environment variables (copy from Vercel)
railway variables set UPSTASH_REDIS_URL=xxx
railway variables set SUPABASE_SERVICE_ROLE_KEY=xxx
railway variables set ANTHROPIC_API_KEY=xxx

# Deploy
railway up
```

**Render:**
1. Create new **Background Worker** service
2. Connect GitHub repository
3. Build Command: `pnpm install`
4. Start Command: `pnpm worker:prod`
5. Set environment variables

#### 5.2 Verify Worker Running

```bash
# Check Redis queue
redis-cli -u $UPSTASH_REDIS_URL

# In Redis CLI:
> KEYS *
> LLEN bull:backtest:waiting
> LLEN bull:backtest:active
```

#### 5.3 Test Queue System

```bash
# Submit test backtest job
curl -X POST "$PRODUCTION_URL/api/backtest/queue" \
  -H "Content-Type: application/json" \
  -H "Cookie: supabase-auth-token=xxx" \
  -d '{
    "strategyId": "test-strategy",
    "params": {
      "symbol": "AAPL",
      "startDate": "2020-01-01",
      "endDate": "2025-12-22",
      "initialCapital": 10000
    }
  }'

# Expected response:
{
  "jobId": "backtest-xxx",
  "status": "queued",
  "estimatedWaitTime": 30
}
```

### Phase 6: Setup Monitoring (Day 0)

#### 6.1 Sentry Integration

Verify Sentry is receiving events:

1. Visit [Sentry Dashboard](https://sentry.io/organizations/your-org/projects/hephaitos/)
2. Check **Issues** tab
3. Should see "No issues" or only test issues

Trigger test error:

```bash
curl "$PRODUCTION_URL/api/test/sentry-error"
```

#### 6.2 Uptime Monitoring

**Recommended: BetterUptime**

1. Visit [BetterUptime](https://betterstack.com/uptime)
2. Create monitor:
   - **URL**: `https://hephaitos.vercel.app/api/health`
   - **Interval**: 1 minute
   - **Alert**: Email + Slack

**Alternative: Uptime Robot**

1. Visit [Uptime Robot](https://uptimerobot.com/)
2. Add new monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://hephaitos.vercel.app/api/health`
   - **Interval**: 5 minutes

#### 6.3 Performance Monitoring

**Vercel Analytics** (included):
- Already enabled in Vercel dashboard
- View real-time metrics

**PostHog** (optional):

```bash
# Set environment variable
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

Create `lib/posthog.ts`:

```typescript
import posthog from 'posthog-js'

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  })
}

export default posthog
```

### Phase 7: Admin Setup (Day 0)

#### 7.1 Create Admin User

```bash
# Run admin setup script
bash scripts/setup-admin.sh
```

Or manually in Supabase SQL Editor:

```sql
-- Insert admin user
INSERT INTO public.users (
  id,
  email,
  tier,
  role,
  created_at
) VALUES (
  'admin-user-id',
  'admin@hephaitos.io',
  'admin',
  'admin',
  NOW()
);

-- Grant admin privileges
INSERT INTO public.user_roles (
  user_id,
  role
) VALUES (
  'admin-user-id',
  'admin'
);
```

#### 7.2 Verify Admin Access

1. Visit `https://hephaitos.vercel.app/admin/cs`
2. Login with admin account
3. Verify access to:
   - User management
   - Credit refunds
   - Safety events
   - Analytics dashboard

---

## Post-deployment Validation

### 1. Automated Health Checks

Run the comprehensive health check script:

```bash
bash scripts/health-check.sh production
```

Expected output:
```
✓ API Health: OK
✓ Database: Connected
✓ Redis Queue: Connected
✓ Claude API: OK
✓ Authentication: Working
✓ Backtest Queue: Processing
```

### 2. Manual Testing Checklist

#### 2.1 Authentication Flow

- [ ] Sign up with email
- [ ] Email verification
- [ ] Sign in with Google
- [ ] Sign in with Kakao
- [ ] Password reset

#### 2.2 Core Features

- [ ] Create strategy
- [ ] Edit strategy
- [ ] Delete strategy
- [ ] Submit backtest
- [ ] View backtest results
- [ ] Real-time progress updates

#### 2.3 Credit System

- [ ] Welcome bonus credited (50 credits)
- [ ] Credit purchase flow
- [ ] Credit deduction on backtest
- [ ] Refund on error

#### 2.4 Admin Dashboard

- [ ] View all users
- [ ] View safety events
- [ ] Issue manual refund
- [ ] View analytics

### 3. Performance Validation

#### 3.1 API Response Times

```bash
# Test API endpoints
ab -n 100 -c 10 https://hephaitos.vercel.app/api/health
```

Expected results:
- Mean response time: < 200ms
- 99th percentile: < 500ms
- No failed requests

#### 3.2 Database Queries

Monitor slow queries in Supabase:

```sql
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### 3.3 Redis Performance

```bash
# Check queue metrics
redis-cli -u $UPSTASH_REDIS_URL INFO stats
```

Look for:
- `instantaneous_ops_per_sec` < 1000
- `used_memory_human` < 50MB

### 4. Security Validation

#### 4.1 HTTPS/TLS

```bash
# Check SSL certificate
openssl s_client -connect hephaitos.vercel.app:443 -servername hephaitos.vercel.app
```

#### 4.2 Security Headers

```bash
curl -I https://hephaitos.vercel.app | grep -i "x-frame\|strict-transport\|content-type"
```

Expected:
```
strict-transport-security: max-age=63072000; includeSubDomains
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
```

#### 4.3 RLS Policies

Test unauthorized access:

```bash
# Try to access other user's data
curl https://hephaitos.vercel.app/api/strategies \
  -H "Authorization: Bearer WRONG_TOKEN"

# Expected: 401 Unauthorized
```

---

## Monitoring & Observability

### 1. Sentry Error Monitoring

#### 1.1 Dashboard Overview

Key metrics to monitor:

- **Error Rate**: < 0.1%
- **Crash-Free Sessions**: > 99.9%
- **APDEX Score**: > 0.9

#### 1.2 Alert Rules

Configure alerts in Sentry:

1. **High Error Rate**
   - Condition: Error count > 10 in 5 minutes
   - Action: Email + Slack

2. **Critical Error**
   - Condition: Error level = "fatal"
   - Action: Immediate email + SMS

3. **Performance Degradation**
   - Condition: p95 response time > 1000ms
   - Action: Email

#### 1.3 Custom Error Tracking

Add custom breadcrumbs:

```typescript
import * as Sentry from '@sentry/nextjs'

// Track user actions
Sentry.addBreadcrumb({
  category: 'backtest',
  message: 'User started backtest',
  level: 'info',
  data: { strategyId: 'xxx' }
})

// Capture custom error
try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'backtest' },
    extra: { strategyId: 'xxx' }
  })
}
```

### 2. Uptime Monitoring

#### 2.1 Critical Endpoints

Monitor these endpoints:

```
https://hephaitos.vercel.app/api/health          # Every 1 min
https://hephaitos.vercel.app/api/strategies      # Every 5 min
https://hephaitos.vercel.app/api/backtest/queue  # Every 5 min
```

#### 2.2 Alert Thresholds

- **Downtime**: Alert after 1 failure
- **Response Time**: Alert if > 5 seconds
- **SSL Certificate**: Alert 7 days before expiry

#### 2.3 Status Page

Create public status page:

**Option 1: Statuspage.io**
- URL: `status.hephaitos.io`
- Components: API, Database, Queue, Worker

**Option 2: Self-hosted**

```sql
-- Create status_page table (already in migration)
SELECT * FROM public.status_page_incidents
ORDER BY created_at DESC
LIMIT 5;
```

### 3. Performance Monitoring

#### 3.1 Vercel Analytics

Dashboard shows:
- Real User Monitoring (RUM)
- Core Web Vitals
- Top pages
- Error tracking

Access: `vercel.com/[your-team]/hephaitos/analytics`

#### 3.2 Custom Metrics

Log custom metrics to Supabase:

```typescript
// Track backtest performance
await supabase
  .from('cache_metrics')
  .insert({
    cache_key: `backtest:${strategyId}`,
    hit: true,
    execution_time_ms: 1500,
    metadata: { strategy_id: strategyId }
  })
```

#### 3.3 Database Performance

Monitor in Supabase Dashboard:

1. Navigate to **Database → Query Performance**
2. Check slow queries (> 100ms)
3. Add indexes if needed:

```sql
-- Example: Add index on strategies user_id
CREATE INDEX IF NOT EXISTS idx_strategies_user_id
ON strategies(user_id);
```

### 4. Queue Monitoring

#### 4.1 BullMQ Dashboard

Use Bull Board for visual monitoring:

```typescript
// Already configured in src/app/admin/queue/page.tsx
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'

const serverAdapter = new ExpressAdapter()
createBullBoard({
  queues: [new BullMQAdapter(backtestQueue)],
  serverAdapter
})
```

Access: `https://hephaitos.vercel.app/admin/queue`

#### 4.2 Queue Metrics

Track in Redis:

```bash
# Waiting jobs
redis-cli -u $UPSTASH_REDIS_URL LLEN bull:backtest:waiting

# Active jobs
redis-cli -u $UPSTASH_REDIS_URL LLEN bull:backtest:active

# Failed jobs
redis-cli -u $UPSTASH_REDIS_URL LLEN bull:backtest:failed
```

#### 4.3 Alert on Queue Buildup

Create cron job to check queue size:

```typescript
// pages/api/cron/check-queue.ts
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const waitingCount = await backtestQueue.getWaitingCount()

  if (waitingCount > 100) {
    // Alert admin
    await sendSlackAlert(`Queue buildup: ${waitingCount} jobs waiting`)
  }

  res.json({ waitingCount })
}
```

Configure Vercel Cron:

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/check-queue",
    "schedule": "*/5 * * * *"
  }]
}
```

---

## Rollback Plan

### Emergency Rollback Procedure

If critical issues are discovered post-deployment, follow this plan:

#### 1. Immediate Actions (< 5 minutes)

**Option A: Vercel Instant Rollback**

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback
```

Or in Vercel Dashboard:
1. Go to **Deployments**
2. Find previous stable deployment
3. Click **"..."** → **"Promote to Production"**

**Option B: Emergency Maintenance Mode**

Create `public/maintenance.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>HEPHAITOS - Maintenance</title>
</head>
<body>
  <h1>🔧 Scheduled Maintenance</h1>
  <p>We'll be back shortly. Sorry for the inconvenience.</p>
</body>
</html>
```

Update `vercel.json`:

```json
{
  "routes": [
    { "src": "/.*", "dest": "/maintenance.html" }
  ]
}
```

Deploy:

```bash
vercel --prod
```

#### 2. Database Rollback (< 15 minutes)

**Restore from backup:**

```bash
# List backups
supabase db dump --list

# Restore specific backup
supabase db restore backup-20251222.sql
```

**Or from Supabase Dashboard:**

1. **Settings → Database → Backups**
2. Find backup before deployment
3. Click **"Restore"**
4. Confirm (THIS WILL OVERWRITE CURRENT DATA)

#### 3. Verify Rollback

```bash
# Health check
curl https://hephaitos.vercel.app/api/health

# Test critical flows
bash scripts/smoke-test.sh
```

#### 4. Post-mortem

Document in GitHub Issue:

```markdown
## Incident Report: [Date] Rollback

**Time**: 2025-12-22 14:30 KST
**Duration**: 15 minutes
**Impact**: 0.1% of requests failed

**Root Cause**:
[Describe issue]

**Resolution**:
[Describe fix]

**Prevention**:
[Action items]
```

---

## Beta Launch Timeline

### Private Beta: 50 Users (Weeks 1-2)

#### Goals
- Collect feedback from power users
- Identify critical bugs
- Test infrastructure at small scale

#### User Acquisition

```bash
# Generate 50 invite codes
npm run script:generate-invites -- --count 50 --tier beta
```

Invite codes stored in `beta_invite_codes` table:

```sql
SELECT code, used, created_at
FROM beta_invite_codes
WHERE tier = 'beta'
ORDER BY created_at DESC;
```

#### Distribution Channels
1. **Twitter/X** - Announce to followers (10 codes)
2. **ProductHunt** - Soft launch (10 codes)
3. **Reddit** - r/algotrading (10 codes)
4. **LinkedIn** - Personal network (10 codes)
5. **Email** - Waitlist (10 codes)

#### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Activation Rate | > 80% | Codes used / codes sent |
| DAU/MAU | > 40% | Active days / 14 days |
| Backtest Completion | > 90% | Completed / started |
| Critical Bugs | 0 | Sentry issues |
| P95 Response Time | < 500ms | Vercel Analytics |

#### Daily Monitoring

```bash
# Check user activity
psql "SELECT
  DATE(created_at) as date,
  COUNT(*) as new_users
FROM users
WHERE created_at > NOW() - INTERVAL '14 days'
GROUP BY DATE(created_at)
ORDER BY date;"

# Check backtest success rate
psql "SELECT
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentage
FROM backtest_jobs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status;"
```

### Public Beta: 500 Users (Weeks 3-6)

#### Goals
- Validate scalability (10x growth)
- Test payment system with real money
- Collect diverse user feedback

#### User Acquisition

Remove invite-only restriction:

```bash
# Update feature flag
supabase secrets set PUBLIC_BETA_ENABLED=true
```

Update landing page:
- Remove "Invite Only" banner
- Add "Join Beta" CTA
- Highlight early adopter benefits

#### Marketing Push

1. **ProductHunt Launch** (Day 1)
   - Prepare 3-minute demo video
   - Schedule for Tuesday 00:01 PST
   - Rally community for upvotes

2. **Social Media** (Week 1)
   - Twitter thread on "Why I built HEPHAITOS"
   - LinkedIn article
   - Reddit r/algotrading showcase

3. **Content Marketing** (Weeks 2-4)
   - Blog: "5 Trading Strategies You Can Build in 10 Minutes"
   - YouTube: Tutorial series
   - Dev.to: Technical deep dive

4. **Paid Ads** (Weeks 3-6)
   - Google Ads: $50/day budget
   - Facebook/Instagram: $30/day
   - Target keywords: "algorithmic trading", "backtesting platform"

#### Infrastructure Scaling

**Expected Load:**
- 500 users × 20% DAU = 100 DAU
- 100 DAU × 5 backtests/day = 500 backtests/day
- 500 / 24 hours = ~21 backtests/hour

**Scaling Actions:**

1. **Increase Worker Concurrency**

```bash
# In Railway/Render
WORKER_CONCURRENCY=10  # Up from 5
```

2. **Upgrade Redis Plan**

If hitting free tier limits (10k commands/day):
- Upstash Pay-as-you-go: $0.2 per 100k commands
- Expected cost: $5-10/month

3. **Enable Caching**

```typescript
// Add Redis caching for strategies
const cachedStrategy = await redis.get(`strategy:${id}`)
if (cachedStrategy) return JSON.parse(cachedStrategy)

const strategy = await supabase
  .from('strategies')
  .select('*')
  .eq('id', id)
  .single()

await redis.setex(`strategy:${id}`, 3600, JSON.stringify(strategy))
```

#### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Signups | 500+ | Total users |
| Activation | > 70% | Users with 1+ backtest |
| Retention (D7) | > 40% | Users active on day 7 |
| Paying Users | > 50 | 10% conversion |
| MRR | > $500 | Monthly recurring revenue |
| NPS | > 50 | Net Promoter Score |

### Production: 5,000 Users (Months 3-6)

#### Goals
- Achieve Product-Market Fit (PMF)
- Scale infrastructure to handle 10x growth
- Establish sustainable unit economics

#### User Acquisition

**Organic Growth:**
- SEO optimization for "ai trading platform", "backtest trading strategy"
- Referral program (30 credits for referrer + referee)
- User-generated content (strategy marketplace)

**Paid Acquisition:**
- Increase ad spend to $200/day
- Partner with trading influencers
- Sponsor trading podcasts

**Viral Features:**
- Public strategy showcase
- Leaderboard (top performing strategies)
- Social sharing of backtest results

#### Infrastructure Scaling

**Expected Load:**
- 5,000 users × 20% DAU = 1,000 DAU
- 1,000 DAU × 10 backtests/day = 10,000 backtests/day
- 10,000 / 24 hours = ~420 backtests/hour

**Scaling Actions:**

1. **Horizontal Worker Scaling**

Deploy multiple worker instances:

```yaml
# Railway: railway.toml
[deploy]
  numReplicas = 3

[env]
  WORKER_CONCURRENCY = 10
```

Total capacity: 3 workers × 10 concurrent = 30 backtests in parallel

2. **Database Optimization**

Upgrade Supabase plan:
- Pro → Team ($599/month)
- Includes: 500 GB bandwidth, 50 GB storage, daily backups

Add read replicas for analytics queries.

3. **CDN for Static Assets**

Vercel automatically provides CDN, but optimize:
- Use `next/image` for all images
- Enable ISR for landing pages
- Cache API responses aggressively

4. **Rate Limiting**

Implement per-user rate limits:

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour
})

export async function middleware(request: NextRequest) {
  const userId = getUserId(request)
  const { success } = await ratelimit.limit(userId)

  if (!success) {
    return new Response('Rate limit exceeded', { status: 429 })
  }
}
```

#### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| MAU | 5,000+ | Monthly active users |
| Paying Users | 500+ | 10% conversion |
| MRR | $15,000+ | $30 ARPU × 500 |
| LTV/CAC | > 3:1 | Lifetime value / Customer acquisition cost |
| Churn | < 5% | Monthly churn rate |
| NPS | > 60 | Net Promoter Score |

---

## Infrastructure Costs

### Private Beta (50 users)

| Service | Plan | Cost/month |
|---------|------|------------|
| **Vercel** | Hobby | $0 |
| **Supabase** | Pro | $25 |
| **Upstash Redis** | Free | $0 |
| **Anthropic API** | Pay-as-you-go | $20 |
| **Sentry** | Developer | $0 |
| **Railway Worker** | Hobby | $5 |
| **Domain** | .io domain | $3 |
| **Total** | | **$53/month** |

### Public Beta (500 users)

| Service | Plan | Cost/month |
|---------|------|------------|
| **Vercel** | Pro | $20 |
| **Supabase** | Pro | $25 |
| **Upstash Redis** | Pay-as-you-go | $10 |
| **Anthropic API** | Pay-as-you-go | $100 |
| **Sentry** | Team | $26 |
| **Railway Worker** | Pro (3 instances) | $60 |
| **Toss Payments** | Free (fee per transaction) | $0 |
| **Domain + SSL** | | $3 |
| **Total** | | **$244/month** |

**Revenue:**
- 50 paying users × $30/month = $1,500/month
- **Profit Margin**: ($1,500 - $244) / $1,500 = **83.7%**

### Production (5,000 users)

| Service | Plan | Cost/month |
|---------|------|------------|
| **Vercel** | Pro | $20 |
| **Supabase** | Team | $599 |
| **Upstash Redis** | Pay-as-you-go | $50 |
| **Anthropic API** | Pay-as-you-go | $500 |
| **Sentry** | Team | $26 |
| **Railway Worker** | Pro (10 instances) | $200 |
| **Better Uptime** | Pro | $18 |
| **Toss Payments** | Transaction fees (3%) | $450 |
| **Marketing** | Ads + Content | $3,000 |
| **Total** | | **$4,863/month** |

**Revenue:**
- 500 paying users × $30/month = $15,000/month
- **Profit Margin**: ($15,000 - $4,863) / $15,000 = **67.6%**
- **Break-even**: 163 paying users

---

## Scaling Strategy

### Vertical Scaling (Months 1-3)

**Approach:** Increase resources on existing infrastructure

1. **Database**
   - Supabase Pro → Team ($25 → $599/month)
   - More connections, better performance
   - Daily backups, point-in-time recovery

2. **Workers**
   - Increase `WORKER_CONCURRENCY` (5 → 20)
   - Upgrade Railway instance (Shared → Dedicated CPU)

3. **Redis**
   - Upstash Free → Pay-as-you-go
   - Enable persistence for queue durability

**Pros:**
- Simple to implement
- No code changes required
- Lower operational complexity

**Cons:**
- Limited scalability (can't scale beyond single instance limits)
- Higher costs per unit

### Horizontal Scaling (Months 3-6)

**Approach:** Add more instances of services

1. **Worker Pool**

Deploy worker cluster:

```yaml
# docker-compose.yml
version: '3.8'
services:
  worker-1:
    image: hephaitos-worker
    environment:
      - WORKER_CONCURRENCY=10
      - WORKER_ID=1
  worker-2:
    image: hephaitos-worker
    environment:
      - WORKER_CONCURRENCY=10
      - WORKER_ID=2
  worker-3:
    image: hephaitos-worker
    environment:
      - WORKER_CONCURRENCY=10
      - WORKER_ID=3
```

Total capacity: 3 × 10 = 30 concurrent backtests

2. **Database Read Replicas**

Supabase Team plan includes read replicas:

```typescript
// Use read replica for analytics
const analyticsClient = createClient(
  process.env.SUPABASE_READ_REPLICA_URL,
  process.env.SUPABASE_ANON_KEY
)

// Heavy analytics query
const { data } = await analyticsClient
  .from('backtest_jobs')
  .select('*')
  .gte('created_at', lastMonth)
```

3. **CDN & Edge Caching**

Vercel Edge Network automatically handles this, but optimize:

```typescript
// app/api/strategies/route.ts
export const runtime = 'edge' // Deploy to edge
export const revalidate = 3600 // Cache for 1 hour
```

**Pros:**
- Unlimited scalability
- Better fault tolerance
- Cost-effective at scale

**Cons:**
- More complex operations
- Requires code changes
- Higher operational overhead

### Auto-scaling (Months 6+)

**Approach:** Automatically scale based on load

1. **Worker Auto-scaling**

Use Railway's auto-scaling:

```yaml
# railway.toml
[deploy]
  minReplicas = 2
  maxReplicas = 10
  targetCPU = 70 # Scale when CPU > 70%
```

2. **Database Connection Pooling**

Use PgBouncer for connection pooling:

```typescript
// lib/supabase/pooler.ts
import { createClient } from '@supabase/supabase-js'

export const pooledClient = createClient(
  process.env.SUPABASE_POOLER_URL, // Pooled connection
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
    },
  }
)
```

3. **Intelligent Queue Management**

Priority queue for paid users:

```typescript
// lib/queue/index.ts
await backtestQueue.add(
  'backtest',
  { strategyId, params },
  {
    priority: user.tier === 'pro' ? 1 : 10, // Lower number = higher priority
  }
)
```

**Pros:**
- Optimal resource utilization
- Cost-efficient (only pay for what you use)
- Handles traffic spikes automatically

**Cons:**
- Complex to configure
- Requires monitoring and tuning
- Cold start delays possible

---

## Troubleshooting Guide

### Common Issues

#### 1. "Environment variable X is not defined"

**Symptom:**
```
Error: Environment variable ANTHROPIC_API_KEY is not defined
```

**Solution:**
1. Check `.env.local` file exists and has the variable
2. For Vercel, check environment variables in dashboard
3. Redeploy after adding variables

```bash
# Verify locally
echo $ANTHROPIC_API_KEY

# Verify in Vercel
vercel env ls
```

#### 2. "Cannot connect to Supabase"

**Symptom:**
```
Error: connect ECONNREFUSED
```

**Solution:**
1. Verify Supabase URL and keys
2. Check Supabase project is not paused
3. Verify firewall/network access

```bash
# Test connection
curl https://xxxxx.supabase.co/rest/v1/?apikey=YOUR_ANON_KEY
```

#### 3. "Queue jobs stuck in 'waiting' status"

**Symptom:**
Jobs submitted but never processed

**Solution:**
1. Check if worker is running

```bash
# Railway
railway logs

# Or check Redis
redis-cli -u $UPSTASH_REDIS_URL LLEN bull:backtest:active
```

2. Restart worker
3. Check for worker errors in logs

#### 4. "Rate limit exceeded" errors

**Symptom:**
```
Error: Rate limit exceeded for Anthropic API
```

**Solution:**
1. Check Anthropic API usage dashboard
2. Upgrade Anthropic plan or add payment method
3. Implement request batching

```typescript
// Batch multiple requests
const results = await Promise.all([
  anthropic.messages.create(...),
  anthropic.messages.create(...),
])
```

#### 5. "Database migration failed"

**Symptom:**
```
Error: migration "xxx" already exists
```

**Solution:**
1. Check migration history

```bash
supabase migration list
```

2. If migration partially applied, manually fix:

```sql
-- Check schema_migrations table
SELECT * FROM schema_migrations ORDER BY version DESC;

-- Manually insert if needed
INSERT INTO schema_migrations (version) VALUES ('20251222_xxx');
```

3. Rerun migrations

```bash
supabase db push --dry-run  # Preview changes
supabase db push
```

#### 6. "Build failed on Vercel"

**Symptom:**
```
Error: Module not found: Can't resolve 'X'
```

**Solution:**
1. Clear build cache

```bash
# In Vercel dashboard
Settings → General → Clear Build Cache
```

2. Check package.json dependencies

```bash
# Install missing dependency
pnpm add missing-package
```

3. Check for TypeScript errors

```bash
pnpm typecheck
```

### Performance Issues

#### Slow API Response Times

**Diagnostic:**

```bash
# Check Vercel Analytics
# Dashboard → Analytics → Performance

# Check Sentry traces
# Sentry → Performance → Transactions
```

**Solutions:**

1. **Add database indexes**

```sql
-- Find slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- Add index
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
```

2. **Enable caching**

```typescript
// Cache frequently accessed data
const cached = await redis.get(`user:${userId}`)
if (cached) return JSON.parse(cached)

const user = await fetchUser(userId)
await redis.setex(`user:${userId}`, 3600, JSON.stringify(user))
```

3. **Optimize queries**

```typescript
// Before: N+1 query
const strategies = await supabase.from('strategies').select('*')
for (const strategy of strategies) {
  const backtests = await supabase
    .from('backtest_jobs')
    .select('*')
    .eq('strategy_id', strategy.id)
}

// After: Single join query
const strategies = await supabase
  .from('strategies')
  .select('*, backtest_jobs(*)')
```

#### High Memory Usage

**Diagnostic:**

```bash
# Railway
railway logs | grep "memory"

# Check Node.js heap
node --expose-gc --max-old-space-size=2048 server.js
```

**Solutions:**

1. **Increase memory limit**

```bash
# Railway: Settings → Resources
# Memory: 512MB → 1024MB
```

2. **Fix memory leaks**

```typescript
// Use WeakMap for caching
const cache = new WeakMap()

// Clear listeners
useEffect(() => {
  const subscription = supabase
    .channel('changes')
    .on('*', handleChange)
    .subscribe()

  return () => subscription.unsubscribe() // Important!
}, [])
```

3. **Stream large responses**

```typescript
// Instead of loading all data
const allJobs = await supabase.from('backtest_jobs').select('*') // Bad

// Stream in chunks
const pageSize = 100
let page = 0
while (true) {
  const { data } = await supabase
    .from('backtest_jobs')
    .select('*')
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (!data.length) break
  await processChunk(data)
  page++
}
```

---

## Emergency Procedures

### Incident Response Levels

| Level | Severity | Response Time | Escalation |
|-------|----------|---------------|------------|
| **P0** | Critical - Site down | < 5 minutes | CEO + CTO |
| **P1** | High - Core feature broken | < 30 minutes | CTO + Team |
| **P2** | Medium - Non-core feature broken | < 4 hours | Team |
| **P3** | Low - Minor bug | < 1 day | Backlog |

### P0: Site Down

**Symptoms:**
- Health check failing
- 500 errors on all pages
- Unable to authenticate

**Immediate Actions:**

1. **Acknowledge incident** (< 2 minutes)

```bash
# Post to status page
curl -X POST https://api.statuspage.io/v1/incidents \
  -H "Authorization: Bearer $STATUSPAGE_TOKEN" \
  -d '{
    "incident": {
      "name": "Service Disruption",
      "status": "investigating",
      "impact_override": "critical"
    }
  }'

# Notify team
curl -X POST $SLACK_WEBHOOK_URL_ALERTS \
  -d '{"text": "🚨 P0 INCIDENT: Site is down"}'
```

2. **Check infrastructure** (< 3 minutes)

```bash
# Vercel status
curl https://www.vercel-status.com/api/v2/status.json

# Supabase status
curl https://status.supabase.com/api/v2/status.json

# Our health check
curl https://hephaitos.vercel.app/api/health
```

3. **Rollback if recent deployment** (< 5 minutes)

```bash
vercel rollback
```

4. **Enable maintenance mode** if rollback doesn't work

```bash
# Update vercel.json
{
  "routes": [
    { "src": "/.*", "dest": "/maintenance.html" }
  ]
}

vercel --prod
```

5. **Update status page**

```bash
curl -X PATCH https://api.statuspage.io/v1/incidents/$INCIDENT_ID \
  -d '{
    "incident": {
      "status": "identified",
      "body": "Rolled back to previous version. Investigating root cause."
    }
  }'
```

### P1: Core Feature Broken

**Symptoms:**
- Backtest queue not processing
- Authentication failing intermittently
- Database connection errors

**Immediate Actions:**

1. **Investigate logs** (< 10 minutes)

```bash
# Vercel logs
vercel logs --since 1h

# Sentry errors
# Dashboard → Issues → Last 1 hour

# Worker logs
railway logs --tail 100
```

2. **Temporary mitigation**

```bash
# Disable affected feature
supabase secrets set BACKTEST_ENABLED=false

# Or redirect to fallback
# middleware.ts
if (pathname.startsWith('/dashboard/backtest')) {
  return NextResponse.redirect('/dashboard/strategies')
}
```

3. **Apply hotfix**

```bash
# Create hotfix branch
git checkout -b hotfix/backtest-queue

# Fix issue
# ... make changes ...

# Deploy immediately
vercel --prod

# Skip tests if urgent (document why)
```

4. **Verify fix**

```bash
# Manual test
# Submit test backtest

# Check metrics
# Sentry: Error count should drop to 0
```

### P2: Non-Critical Feature

**Examples:**
- Export to CSV not working
- Chart rendering issues
- Email notifications delayed

**Response:**

1. Create GitHub issue with details
2. Add to sprint backlog
3. Communicate ETA to affected users
4. Deploy fix in next release

### Communication Templates

#### Status Page Update

```markdown
**Investigating** (0-5 min)
We are investigating reports of [issue]. Updates to follow.

**Identified** (5-15 min)
We have identified the issue as [description]. Working on a fix.

**Monitoring** (15-30 min)
A fix has been deployed. We are monitoring the situation.

**Resolved** (30+ min)
This incident has been resolved. Root cause: [description]
```

#### User Email (for P0/P1)

```
Subject: Service Disruption Resolved - Dec 22, 2025

Hi there,

We experienced a service disruption today from 14:00-14:30 KST that affected backtest submissions.

What happened:
Our background worker service became unresponsive due to [reason].

What we did:
We immediately rolled back to a stable version and restarted the worker pool.

What we're doing to prevent this:
- Adding worker health checks
- Implementing circuit breakers
- Improving monitoring

We apologize for the inconvenience. As compensation, we've added 10 bonus credits to your account.

Thank you for your patience,
HEPHAITOS Team
```

---

## Appendix

### A. Environment Variables Reference

Complete list of all environment variables:

```bash
# ============================================
# REQUIRED (Cannot deploy without these)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
UPSTASH_REDIS_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# ============================================
# RECOMMENDED (For production features)
# ============================================
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# ============================================
# OPTIONAL (Advanced features)
# ============================================
KIS_APP_KEY=
KIS_APP_SECRET=
POLYGON_API_KEY=
BINANCE_API_KEY=
UPBIT_API_KEY=
SLACK_WEBHOOK_URL_ALERTS=
CRON_SECRET=
```

### B. Database Schema Summary

Key tables:

```sql
-- Users
users (id, email, tier, role, credits, created_at)

-- Strategies
strategies (id, user_id, name, config, created_at)

-- Backtests
backtest_jobs (id, user_id, strategy_id, status, params, results, created_at)

-- Credits
credit_transactions (id, user_id, amount, type, reason, created_at)

-- Safety
safety_events (id, user_id, event_type, severity, auto_refund_issued, created_at)
```

### C. API Endpoints Reference

```
# Health
GET /api/health

# Authentication
POST /api/auth/signin
POST /api/auth/signup
POST /api/auth/signout

# Strategies
GET /api/strategies
POST /api/strategies
GET /api/strategies/[id]
PUT /api/strategies/[id]
DELETE /api/strategies/[id]

# Backtests
POST /api/backtest/queue
GET /api/backtest/[id]
GET /api/backtest/[id]/status

# Credits
GET /api/credits/balance
POST /api/credits/purchase
GET /api/credits/transactions

# Admin
GET /api/admin/users
GET /api/admin/safety-events
POST /api/admin/refund
```

### D. Monitoring Checklist

Daily checks:

- [ ] Error rate < 0.1% (Sentry)
- [ ] API response time p95 < 500ms (Vercel)
- [ ] Database CPU < 70% (Supabase)
- [ ] Redis memory < 80% (Upstash)
- [ ] Queue backlog < 100 jobs
- [ ] No failed backtest jobs
- [ ] SSL certificate valid > 30 days

Weekly checks:

- [ ] Review slow database queries
- [ ] Check for dependency updates
- [ ] Review user feedback
- [ ] Check cost vs budget
- [ ] Backup database manually
- [ ] Test disaster recovery

### E. Runbook Scripts

**Health Check:**

```bash
#!/bin/bash
# scripts/health-check.sh

PRODUCTION_URL="https://hephaitos.vercel.app"

echo "🏥 Health Check Starting..."

# API Health
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/api/health")
if [ "$STATUS" = "200" ]; then
  echo "✅ API Health: OK"
else
  echo "❌ API Health: FAILED (HTTP $STATUS)"
  exit 1
fi

# Database
STRATEGIES=$(curl -s "$PRODUCTION_URL/api/strategies" | jq '. | length')
if [ "$STRATEGIES" -ge 0 ]; then
  echo "✅ Database: Connected"
else
  echo "❌ Database: FAILED"
  exit 1
fi

# Queue
redis-cli -u "$UPSTASH_REDIS_URL" PING > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Redis Queue: Connected"
else
  echo "❌ Redis Queue: FAILED"
  exit 1
fi

echo "✅ All systems operational"
```

**Load Test:**

```bash
#!/bin/bash
# scripts/load-test.sh

echo "🔥 Load Test Starting..."

# Test health endpoint
ab -n 1000 -c 50 https://hephaitos.vercel.app/api/health

# Test strategies list
ab -n 500 -c 25 https://hephaitos.vercel.app/api/strategies

# Test backtest queue
for i in {1..10}; do
  curl -X POST https://hephaitos.vercel.app/api/backtest/queue \
    -H "Content-Type: application/json" \
    -d "{\"strategyId\":\"test-$i\",\"params\":{\"symbol\":\"AAPL\"}}"
done

echo "✅ Load test complete"
```

**Database Backup:**

```bash
#!/bin/bash
# scripts/backup-db.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"

echo "💾 Starting database backup..."

supabase db dump -f "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
  echo "✅ Backup created: $BACKUP_FILE"

  # Upload to S3 (optional)
  # aws s3 cp "$BACKUP_FILE" s3://hephaitos-backups/
else
  echo "❌ Backup failed"
  exit 1
fi
```

### F. Contact Information

**Emergency Contacts:**

| Role | Name | Email | Phone |
|------|------|-------|-------|
| CEO | [Name] | ceo@hephaitos.io | +82-10-XXXX-XXXX |
| CTO | [Name] | cto@hephaitos.io | +82-10-XXXX-XXXX |
| DevOps | [Name] | devops@hephaitos.io | +82-10-XXXX-XXXX |

**Vendor Support:**

| Vendor | Support | Priority | URL |
|--------|---------|----------|-----|
| Vercel | support@vercel.com | Pro: 1-4 hours | https://vercel.com/support |
| Supabase | support@supabase.com | Pro: < 1 day | https://supabase.com/dashboard/support |
| Anthropic | support@anthropic.com | Standard: 1-2 days | https://console.anthropic.com |
| Upstash | support@upstash.com | Email only | support@upstash.com |

---

## Conclusion

This deployment guide covers the complete process of taking HEPHAITOS from Private Beta to Production. Follow each phase carefully, monitor metrics closely, and don't hesitate to rollback if issues arise.

### Key Takeaways

1. **Test Everything**: Run full test suite before each deployment
2. **Monitor Actively**: Set up alerts for critical metrics
3. **Rollback Plan**: Always have a rollback plan ready
4. **User Communication**: Keep users informed during incidents
5. **Document Issues**: Create post-mortems for all incidents

### Next Steps

After successful deployment:

1. [ ] Monitor for 48 hours intensively
2. [ ] Collect user feedback
3. [ ] Create backlog for improvements
4. [ ] Plan next feature release
5. [ ] Update documentation based on learnings

---

**Document Version**: 2.0.0
**Last Updated**: 2025-12-22
**Maintained By**: HEPHAITOS DevOps Team
**Review Schedule**: Monthly

For questions or issues with this guide, contact: devops@hephaitos.io
