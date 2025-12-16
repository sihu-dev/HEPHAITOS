# HEPHAITOS 2.0 - 핵심 레퍼런스 & API 가이드

> **Version**: 2.0
> **Date**: 2025-12-13
> **Purpose**: 개발 시 참조해야 할 모든 핵심 외부 API, 라이브러리, 서비스

---

## 1. 증권사 API (Broker Integration)

### 1.1 한국 증권사

#### 한국투자증권 (KIS) - ⭐ 최우선 추천
| 항목 | 내용 |
|------|------|
| **API 포탈** | https://apiportal.koreainvestment.com |
| **API 문서** | https://apiportal.koreainvestment.com/apiservice |
| **연동 난이도** | ⭐⭐ (쉬움) |
| **연동 시간** | 3분 |
| **API 방식** | REST |
| **Paper Trading** | ✅ 지원 |
| **특징** | - 가장 개발자 친화적<br>- REST API (모든 OS 지원)<br>- 실시간 WebSocket 제공 |

**핵심 엔드포인트:**
```
POST /oauth2/tokenP              # 토큰 발급
GET  /uapi/domestic-stock/v1/trading/inquire-balance  # 잔고 조회
POST /uapi/domestic-stock/v1/trading/order-cash       # 현금 주문
GET  /uapi/domestic-stock/v1/quotations/inquire-price # 시세 조회
```

**커뮤니티 SDK:**
- Python: https://github.com/Soju06/python-kis

#### 키움증권 (Kiwoom)
| 항목 | 내용 |
|------|------|
| **API 신청** | https://www.kiwoom.com/h/customer/download/VOpenApiInfoView |
| **API 교육** | https://wikidocs.net/book/1173 |
| **연동 난이도** | ⭐⭐⭐ (보통) |
| **API 방식** | OCX (Windows 전용) |
| **Paper Trading** | ✅ 지원 |
| **특징** | - 조건검색 강력<br>- Windows 전용 (프록시 필요)<br>- 가장 많은 사용자 |

**우회 방법:** REST Proxy 서버 사용
- kiwoom-rest: https://github.com/sculove/kiwoom-rest-api

### 1.2 해외 증권사

#### Alpaca Markets - ⭐ 최우선 추천 (해외주식)
| 항목 | 내용 |
|------|------|
| **홈페이지** | https://alpaca.markets |
| **API 문서** | https://docs.alpaca.markets |
| **연동 난이도** | ⭐ (매우 쉬움) |
| **연동 시간** | 1분 |
| **API 방식** | REST + WebSocket |
| **Paper Trading** | ✅ 무료 지원 |
| **특징** | - 무료 Paper Trading<br>- 가장 개발자 친화적<br>- 커미션 0% |

**핵심 엔드포인트:**
```
GET  /v2/account        # 계좌 정보
GET  /v2/positions      # 보유 종목
POST /v2/orders         # 주문
GET  /v2/assets         # 종목 정보
```

**No-Code 연동:**
- https://alpaca.markets/integrations

---

## 2. 유명인 포트폴리오 데이터 API

### 2.1 정치인 거래 데이터

#### Unusual Whales API - ⭐ 핵심
| 항목 | 내용 |
|------|------|
| **홈페이지** | https://unusualwhales.com |
| **API 문서** | https://docs.unusualwhales.com |
| **데이터** | - Congress Trading<br>- ETF Flows<br>- Options Flow |
| **가격** | 유료 (Pro 플랜 필요) |
| **특징** | Nancy Pelosi 등 정치인 거래 실시간 추적 |

**주요 엔드포인트:**
```
GET /congress/trades         # 의회 거래 목록
GET /congress/members        # 의원 목록
GET /congress/member/{id}    # 특정 의원 거래
```

#### Quiver Quantitative
| 항목 | 내용 |
|------|------|
| **홈페이지** | https://www.quiverquant.com |
| **API** | https://api.quiverquant.com |
| **데이터** | - Senator/House Trading<br>- Lobby Data<br>- Government Contracts |
| **특징** | 정치인 거래 상세 데이터 |

### 2.2 기관투자자 데이터

#### SEC EDGAR API (무료)
| 항목 | 내용 |
|------|------|
| **홈페이지** | https://www.sec.gov/cgi-bin/browse-edgar |
| **API** | https://data.sec.gov |
| **데이터** | 13F 파일링 (분기별) |
| **특징** | - 완전 무료<br>- 45일 지연<br>- Warren Buffett 등 헤지펀드 |

**13F 데이터 조회:**
```
GET https://data.sec.gov/submissions/CIK{cik}.json
```

**주요 CIK:**
- Berkshire Hathaway (Warren Buffett): 0001067983
- Scion Asset Management (Michael Burry): 0001649339
- ARK Invest (Cathie Wood): 0001731012

#### Autopilot (포트폴리오 미러링)
| 항목 | 내용 |
|------|------|
| **홈페이지** | https://www.getautopilot.com |
| **기능** | - 포트폴리오 복사<br>- 자동 리밸런싱<br>- 알림 |
| **특징** | Pelosi, Buffett 등 자동 추적 |

---

## 3. AI & NLP API

### 3.1 Claude API (핵심 AI 엔진)
| 항목 | 내용 |
|------|------|
| **API 문서** | https://docs.anthropic.com |
| **추천 모델** | claude-opus-4-5 (전략 생성), claude-sonnet-4-5 (일반) |
| **용도** | - 자연어 → 전략 변환<br>- 시장 분석<br>- 거래 설명 |

**LangChain 연동:**
```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const llm = new ChatAnthropic({
  modelName: "claude-opus-4-5",
  temperature: 0
});
```

### 3.2 브라우저 내 Python (Pyodide)
| 항목 | 내용 |
|------|------|
| **홈페이지** | https://pyodide.org |
| **GitHub** | https://github.com/pyodide/pyodide |
| **용도** | - 브라우저 내 백테스트<br>- Replit 스타일 코드 실행 |

```typescript
import { loadPyodide } from "pyodide";

const pyodide = await loadPyodide();
await pyodide.loadPackage(["numpy", "pandas"]);
const result = await pyodide.runPythonAsync(strategyCode);
```

---

## 4. 실시간 시세 & 차트

### 4.1 TradingView
| 항목 | 내용 |
|------|------|
| **Charting Library** | https://www.tradingview.com/HTML5-stock-forex-bitcoin-charting-library/ |
| **Widget** | https://www.tradingview.com/widget/ |
| **용도** | 전문 차트 라이브러리 |

### 4.2 한국 시세 데이터

#### KRX 정보데이터시스템
| 항목 | 내용 |
|------|------|
| **홈페이지** | http://data.krx.co.kr |
| **데이터** | 한국 주식 시세, 거래량, 외국인/기관 |
| **가격** | 무료 (웹 크롤링 필요) |

#### Yahoo Finance (무료)
```typescript
// 한국 주식: .KS (코스피), .KQ (코스닥)
const url = `https://query1.finance.yahoo.com/v8/finance/chart/005930.KS`
```

### 4.3 암호화폐 시세

#### Binance API
| 항목 | 내용 |
|------|------|
| **API 문서** | https://binance-docs.github.io/apidocs |
| **WebSocket** | wss://stream.binance.com:9443 |

#### Upbit API
| 항목 | 내용 |
|------|------|
| **API 문서** | https://docs.upbit.com |
| **WebSocket** | wss://api.upbit.com/websocket/v1 |

---

## 5. 트레이딩 교육 & 멘토링 레퍼런스

### 5.1 교육 방법론

#### Topstep (미국)
| 항목 | 내용 |
|------|------|
| **홈페이지** | https://www.topstep.com |
| **특징** | Prep–Trade–Reflect® 루틴 |
| **참고** | https://www.topstep.com/free-coaching/ |

#### SMB Capital
| 항목 | 내용 |
|------|------|
| **홈페이지** | https://smbtraining.com |
| **특징** | 리얼타임 멘토링 + Tape Reading |

#### Schwab Coaching
| 항목 | 내용 |
|------|------|
| **홈페이지** | https://www.schwab.com/coaching |
| **특징** | Over the Shoulder 방식 |

### 5.2 한국 투자 교육

#### 패스트캠퍼스
| 항목 | 내용 |
|------|------|
| **참고** | https://fastcampus.co.kr/story_article_investtop4 |
| **인사이트** | 시장→이슈→대장주→기법 학습 순서 |

#### 나주다스쿨
| 항목 | 내용 |
|------|------|
| **홈페이지** | https://najudaschool.co.kr |
| **특징** | 타점 교육 방법론 |

#### 성공투자스쿨
| 항목 | 내용 |
|------|------|
| **홈페이지** | https://stschool.kr |
| **특징** | 근거 기반 트레이딩 |

---

## 6. No-Code 트레이딩 플랫폼 벤치마크

### 6.1 해외 플랫폼

#### Tradetron (인도)
| 항목 | 내용 |
|------|------|
| **홈페이지** | https://tradetron.tech |
| **특징** | - 코딩 없이 알고 전략<br>- 드래그앤드롭 빌더 |
| **벤치마크 포인트** | 전략 마켓플레이스 |

#### PredictNow.ai
| 항목 | 내용 |
|------|------|
| **홈페이지** | https://predictnow.ai |
| **특징** | 노코드 ML 트레이딩 |

#### Trellis
| 항목 | 내용 |
|------|------|
| **홈페이지** | https://trellis.trade |
| **특징** | 무료 트레이딩 봇 빌더 |

### 6.2 백테스팅 플랫폼

#### QuantConnect
| 항목 | 내용 |
|------|------|
| **홈페이지** | https://www.quantconnect.com |
| **특징** | - Python/C# 지원<br>- 클라우드 백테스트 |

#### Backtrader (오픈소스)
| 항목 | 내용 |
|------|------|
| **GitHub** | https://github.com/mementum/backtrader |
| **특징** | Python 백테스팅 프레임워크 |

---

## 7. 기술 스택 문서

### 7.1 프론트엔드

| 기술 | 문서 URL |
|------|----------|
| Next.js 14 App Router | https://nextjs.org/docs |
| React 19 | https://react.dev |
| Tailwind CSS | https://tailwindcss.com/docs |
| shadcn/ui | https://ui.shadcn.com |
| Framer Motion | https://www.framer.com/motion/ |
| TanStack Query | https://tanstack.com/query |
| Zustand | https://zustand-demo.pmnd.rs |
| Monaco Editor | https://microsoft.github.io/monaco-editor/ |

### 7.2 백엔드

| 기술 | 문서 URL |
|------|----------|
| Supabase | https://supabase.com/docs |
| Socket.io | https://socket.io/docs/v4/ |
| Redis | https://redis.io/docs |
| FastAPI (Python) | https://fastapi.tiangolo.com |
| Celery | https://docs.celeryq.dev |

### 7.3 AI & ML

| 기술 | 문서 URL |
|------|----------|
| LangChain | https://python.langchain.com/docs |
| Claude API | https://docs.anthropic.com |
| Pyodide | https://pyodide.org/en/stable/ |

---

## 8. 핵심 비즈니스 모델 요약

### Copy-Learn-Build 3단계 진화

```
[1단계: Copy] 유명인 따라하기 (초보자)
   - Unusual Whales API → 정치인 거래 추적
   - SEC EDGAR → 13F 파일링 (Buffett, Burry)
   - Autopilot → 자동 미러링
   ↓
[2단계: Learn] 멘토와 함께 배우기 (중급자)
   - WebSocket → 실시간 화면 동기화
   - Claude API → "왜?" 분석
   - 1:1 코칭 + 그룹 세션
   ↓
[3단계: Build] 나만의 AI 전략 만들기 (전문가)
   - Claude → 자연어 → 전략 코드
   - Pyodide → 브라우저 내 백테스트
   - Monaco Editor → 코드 편집
   - 전략 마켓플레이스
```

---

## 9. API 발급 간소화 전략

### 문제점: 일반인 API 발급 어려움
```
기존 방식:
1. 복잡한 신청 과정 (1-3일)
2. 본인인증 다단계
3. 기술 용어 난해
4. 에러 메시지 불친절
```

### Hephaitos 솔루션

#### A. 단계별 가이드 (In-App)
```typescript
// 증권사 선택 후 맞춤 가이드 표시
const guides = {
  kis: {
    steps: [
      { title: "1. KIS Developers 접속", url: "https://apiportal.koreainvestment.com" },
      { title: "2. 회원가입 (공인인증서 불필요)", time: "2분" },
      { title: "3. API Key 발급", screenshot: "/guides/kis-3.png" },
      { title: "4. Key 복사 → 붙여넣기", highlight: true }
    ],
    totalTime: "3분",
    difficulty: "쉬움"
  },
  alpaca: {
    steps: [
      { title: "1. Alpaca 접속", url: "https://alpaca.markets" },
      { title: "2. 이메일로 가입", time: "1분" },
      { title: "3. Paper Trading API Keys 클릭" }
    ],
    totalTime: "1분",
    difficulty: "매우 쉬움"
  }
}
```

#### B. 영상 튜토리얼
- 증권사별 API 발급 과정 녹화
- 1분 숏폼 + 5분 상세

#### C. 챗봇 지원
- "한국투자증권 API 발급이 안 돼요"
- Claude가 단계별 문제 해결

---

**작성자**: Claude Opus 4.5
**최종 수정**: 2025-12-13
