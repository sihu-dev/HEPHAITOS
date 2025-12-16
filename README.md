# HEPHAITOS (헤파이토스)

> **💎 크레딧 기반 "Replit for Trading"** - 쓴 만큼만 내는 투자 교육 플랫폼

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 핵심 가치

```
1. COPY  - 셀럽 포트폴리오 미러링 (무료, 0 크레딧)
2. LEARN - AI 튜터 (1 크레딧) + 라이브 코칭 (20 크레딧)
3. BUILD - AI 전략 생성 (10 크레딧) + 백테스팅 (3 크레딧)
```

**비즈니스 모델**: 크레딧 선불제 → 유연한 사용량 기반 가격
**법률 준수**: 투자 조언 금지, 교육 + 도구만 제공

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase 계정
- Claude API 키 (Anthropic)

### 빠른 시작 (3단계)

```bash
# 1. 종속성 설치
npm install

# 2. API 키 자동 설정 (Windows)
.\scripts\setup-api-keys.ps1

# 3. 개발 서버 실행
npm run dev
# → http://localhost:3000
```

**자세한 가이드**: `QUICK_START.md` 참조

---

## 📦 기술 스택

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.3 (Strict Mode)
- **Styling**: Tailwind CSS 3.4 + Custom Design System
- **State**: Zustand + TanStack Query
- **UI**: Custom Glass Morphism Components
- **Charts**: TradingView Lightweight Charts, Recharts

### Backend

- **Database**: Supabase (PostgreSQL + Realtime + Auth)
- **AI**: Vercel AI SDK 5.0 + Claude 4 (Anthropic)
- **Payments**: 토스페이먼츠 (Credit System)
- **Caching**: Redis (Optional)

### External APIs

- **Korea Market**: KIS 한국투자증권 Open API
- **US Market**: Polygon.io
- **Celebrity Trading**: Unusual Whales (Optional)

---

## 🎨 Design System

### Color Palette

```css
/* Primary - Linear Purple */
--primary: #5E6AD2;
--primary-light: #7C8AEA;
--primary-dark: #4B56C8;

/* Background - Deep Space */
--bg-primary: #0D0D0F;
--bg-secondary: #111113;
--bg-tertiary: #151517;

/* Glass Morphism */
--surface-glass: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(16px);
```

### Design Principles

1. **Deep Space Dark Theme** - #0D0D0F 배경
2. **Glass Morphism First** - 모든 카드에 backdrop-blur
3. **Linear Purple Identity** - #5E6AD2 시그니처 컬러
4. **Aurora Background** - 다층 radial gradient

자세한 내용: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

---

## 💎 크레딧 시스템

### 가격 정책

| 패키지 | 크레딧 | 가격 | 보너스 | 단가 |
|--------|--------|------|--------|------|
| 스타터 | 100 | ₩9,900 | - | ₩99 |
| 베이직 | 500 | ₩39,000 | +50 | ₩71 |
| 프로 | 1,000 | ₩69,000 | +150 | ₩60 |
| 엔터프라이즈 | 5,000 | ₩299,000 | +1,000 | ₩50 |

### 기능별 크레딧 소비

| 기능 | 크레딧 | 설명 |
|------|--------|------|
| 셀럽 미러링 (COPY) | **0** | 무료 진입 |
| AI 튜터 질문 | **1** | 저가 진입점 |
| AI 전략 생성 | **10** | 핵심 수익 |
| 백테스팅 (1년) | **3** | 검증 필수 |
| 라이브 코칭 (30분) | **20** | 프리미엄 |
| 실시간 알림 (1일) | **5** | 지속 사용 |

---

## 📁 프로젝트 구조

```
HEPHAITOS/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 인증 페이지
│   │   ├── (dashboard)/        # 대시보드 페이지
│   │   ├── api/                # API Routes
│   │   │   ├── credits/        # ✨ 크레딧 시스템 API
│   │   │   ├── ai/             # AI 엔진 API
│   │   │   ├── payments/       # 결제 API
│   │   │   └── ...
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # 기본 UI 컴포넌트
│   │   ├── credits/            # ✨ 크레딧 UI 컴포넌트
│   │   ├── charts/             # 차트 컴포넌트
│   │   └── dashboard/          # 대시보드 컴포넌트
│   ├── lib/
│   │   ├── supabase/           # Supabase 클라이언트
│   │   ├── ai/                 # AI 엔진 (Claude 4)
│   │   ├── credits/            # ✨ 크레딧 로직
│   │   ├── trading/            # 트레이딩 엔진
│   │   └── utils/
│   ├── hooks/                  # Custom Hooks
│   ├── stores/                 # Zustand Stores
│   └── types/                  # TypeScript Types
├── supabase/
│   ├── migrations/             # 🆕 DB 마이그레이션
│   │   └── 20251216000001_create_credit_system.sql
│   └── seed.sql                # 초기 데이터
├── scripts/                    # 🆕 자동화 스크립트
│   ├── setup-api-keys.ps1      # API 키 자동 설정
│   ├── test-all-apis.js        # 전체 API 테스트
│   └── test-anthropic.js       # Claude AI 테스트
├── public/                     # 정적 파일
├── docs/                       # 문서
├── .claude/                    # Claude Code 설정
│   ├── agents/                 # ✨ 전문 Agents
│   ├── skills/                 # ✨ 개발 가이드
│   └── projects/hephaitos/     # 🆕 HEPHAITOS 전용 설정
├── API_KEY_SETUP_GUIDE.md      # 🆕 API 키 발급 가이드
├── SETUP_COMPLETE.md           # 🆕 초기화 완료 문서
├── QUICK_START.md              # 🆕 빠른 시작 가이드
└── README.md (이 파일)
```

---

## 🔧 개발 가이드

### 환경 변수 설정

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key

# 토스페이먼츠
TOSS_CLIENT_KEY=your_toss_client_key
TOSS_SECRET_KEY=your_toss_secret_key

# 크레딧 시스템
NEXT_PUBLIC_CREDIT_ENABLED=true
NEXT_PUBLIC_WELCOME_BONUS=50
```

### 스크립트

```bash
# 개발
npm run dev                # 개발 서버 시작

# 빌드
npm run build              # 프로덕션 빌드
npm run start              # 프로덕션 서버 시작

# 테스트
npm run test               # 단위 테스트 (Vitest)
npm run test:e2e           # E2E 테스트 (Playwright)
npm run test:coverage      # 커버리지 리포트
npm run test:api           # API 연결 테스트
npm run test:anthropic     # Claude AI 개별 테스트
npm run test:moa           # 🚀 MoA PoC 테스트
npm run test:moa:compare   # 🚀 MoA vs Baseline 비교

# 린트
npm run lint               # ESLint 실행

# CI
npm run ci                 # 린트 + 테스트 + 빌드
```

---

## 🗄️ Database Schema

### Credit System Tables

```sql
-- 크레딧 지갑
CREATE TABLE credit_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  balance INT NOT NULL DEFAULT 0,
  lifetime_purchased INT NOT NULL DEFAULT 0,
  lifetime_spent INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 크레딧 거래 내역
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'purchase', 'spend', 'refund', 'bonus'
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  feature VARCHAR(50), -- 'ai_strategy', 'backtest', 'coaching'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

자세한 스키마: [supabase/migrations/](./supabase/migrations/)

---

## 🤖 AI Features

### MoA (Mixture-of-Agents) - **NEW** 🚀

**4명의 AI 전문가가 협업하여 전략 생성**

```typescript
import { MoAEngine } from '@/lib/moa/engine';

const engine = new MoAEngine();
const result = await engine.generateStrategy(
  '사용자 전략 요청',
  'comprehensive' // 초안(5) | 정제(10) | 종합(20) 크레딧
);

// 4명의 전문가 의견
result.perspectives.forEach(p => {
  console.log(`${p.icon} ${p.name}: ${p.confidence}% 신뢰도`);
  console.log(p.output);
});

// 최종 종합 전략
console.log(result.aggregated);
```

**기대 효과**:
- Sharpe Ratio +12% (1.2 → 1.34)
- 백테스트 통과율 +12%p (60% → 72%)
- 사용자 만족도 NPS 70+

자세한 내용: [MOA_IMPLEMENTATION_GUIDE.md](./MOA_IMPLEMENTATION_GUIDE.md)

### Claude 4 Integration

```typescript
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

// AI 전략 생성 (10 크레딧)
const strategy = await generateText({
  model: anthropic('claude-4-sonnet-20250514'),
  prompt: '자연어 전략 설명...',
});

// AI 튜터 (1 크레딧/질문)
const answer = await generateText({
  model: anthropic('claude-4-haiku-20250321'),
  prompt: '투자 질문...',
});
```

---

## 🎓 Claude Code Agents

비전문가를 위한 자동화된 개발 도구:

```bash
# 크레딧 시스템 구현
@credit-system "크레딧 결제 API 구현해줘"

# AI 전략 생성
@ai-trading-engine "자연어로 RSI 전략 생성해줘"

# Excel 리포트
@excel-data-engine "월간 크레딧 수익 리포트 생성해줘"

# 법률 검증
@compliance-guard "이 문구가 투자 조언에 해당하나요?"
```

자세한 가이드: [.claude/projects/hephaitos/](./.claude/projects/hephaitos/)

---

## 🚨 법률 준수

### 투자자문업 규제

```text
❌ 금지 행위:
- 특정 종목 추천
- 매매 타이밍 조언
- 수익 보장 표현

✅ 허용 범위:
- 투자 교육 콘텐츠
- 분석 도구 제공
- 과거 데이터 분석
```

### 필수 면책조항

```
본 서비스는 투자 교육 및 분석 도구 제공을 목적으로 하며,
특정 종목 추천이나 투자 자문이 아닙니다.
투자 결정은 본인의 판단과 책임입니다.
```

자세한 내용: [BUSINESS_CONSTITUTION.md](./BUSINESS_CONSTITUTION.md)

---

## 📊 Performance

- **Lighthouse Score**: 90+
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: < 500KB (gzipped)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details

---

## 📞 Contact

- **Email**: [이메일 주소]
- **GitHub**: [GitHub 주소]
- **Documentation**: [docs/](./docs/)

---

## 🙏 Acknowledgments

- **Design System**: Inspired by Linear & CATALYST AI
- **AI Engine**: Powered by Claude 4 (Anthropic)
- **Charts**: TradingView Lightweight Charts
- **Framework**: Next.js by Vercel

---

**핵심 슬로건**: "💎 쓴 만큼만 내는 투자 학습 플랫폼"

**Made with ❤️ by HEPHAITOS Team**
