# HEPHAITOS 신규 기능 로직 설계서

> **작성일**: 2025-12-24
> **상태**: 설계 완료, 구현 대기

---

## 목차

1. [Excel/Google Sheets 연동](#1-excelgoogle-sheets-연동)
2. [Claude Chrome 확장 (베타)](#2-claude-chrome-확장-베타)
3. [차트 분석 고도화](#3-차트-분석-고도화)
4. [구현 로드맵](#4-구현-로드맵)

---

## 1. Excel/Google Sheets 연동

### 1.1 기능 개요

```
┌─────────────────────────────────────────────────────────────┐
│  "트레이딩 데이터를 스프레드시트로 자유롭게"                    │
│                                                             │
│  IMPORT: Excel/CSV/Sheets → HEPHAITOS                       │
│  EXPORT: HEPHAITOS → Excel/CSV/Sheets                       │
│  SYNC:   실시간 양방향 동기화 (Google Sheets)                 │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 사용자 스토리

| ID | 사용자 스토리 | 우선순위 |
|----|--------------|---------|
| US-1 | 백테스트 결과를 CSV로 다운로드하여 분석하고 싶다 | P0 |
| US-2 | 포트폴리오 현황을 Excel로 내보내고 싶다 | P0 |
| US-3 | Google Sheets에서 전략 파라미터를 관리하고 싶다 | P1 |
| US-4 | 외부 Excel 데이터로 백테스트를 돌리고 싶다 | P1 |
| US-5 | 실시간 포트폴리오를 Google Sheets에 자동 기록하고 싶다 | P2 |

### 1.3 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│                        사용자 인터페이스                           │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Export Modal │  │ Import Modal │  │ Sheets Panel │            │
│  │ - 형식 선택  │  │ - 파일 업로드 │  │ - 연결 관리  │            │
│  │ - 범위 설정  │  │ - 매핑 설정  │  │ - 동기화 상태│            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                         API Layer                                 │
├──────────────────────────────────────────────────────────────────┤
│  POST /api/export                                                 │
│  ├── /csv      → CSV 파일 생성                                    │
│  ├── /xlsx     → Excel 파일 생성                                  │
│  └── /sheets   → Google Sheets 내보내기                           │
│                                                                   │
│  POST /api/import                                                 │
│  ├── /csv      → CSV 파싱                                         │
│  ├── /xlsx     → Excel 파싱                                       │
│  └── /sheets   → Google Sheets 가져오기                           │
│                                                                   │
│  WebSocket /api/sync/sheets                                       │
│  └── 실시간 양방향 동기화                                          │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Service Layer                                │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ SpreadsheetService                                          │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │ + exportToCSV(data, options): Blob                          │ │
│  │ + exportToXLSX(data, options): Blob                         │ │
│  │ + exportToGoogleSheets(data, sheetId): Promise<void>        │ │
│  │ + importFromCSV(file): Promise<ParsedData>                  │ │
│  │ + importFromXLSX(file): Promise<ParsedData>                 │ │
│  │ + importFromGoogleSheets(sheetId): Promise<ParsedData>      │ │
│  │ + syncWithGoogleSheets(sheetId): RealtimeSubscription       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ DataTransformer                                             │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │ + portfolioToRows(portfolio): Row[]                         │ │
│  │ + backtestToRows(result): Row[]                             │ │
│  │ + tradesToRows(trades): Row[]                               │ │
│  │ + rowsToStrategy(rows): Strategy                            │ │
│  │ + rowsToOHLCV(rows): OHLCV[]                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     External Services                             │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ xlsx.js      │  │ papaparse    │  │ Google APIs  │            │
│  │ Excel 생성   │  │ CSV 파싱     │  │ Sheets v4    │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└──────────────────────────────────────────────────────────────────┘
```

### 1.4 데이터 모델

```typescript
// ============================================
// Export 관련 타입
// ============================================

interface ExportOptions {
  format: 'csv' | 'xlsx' | 'google_sheets'
  dataType: 'portfolio' | 'backtest' | 'trades' | 'strategy' | 'ohlcv'
  dateRange?: { start: Date; end: Date }
  columns?: string[]  // 선택적 컬럼 필터
  sheetId?: string    // Google Sheets ID
}

interface ExportResult {
  success: boolean
  url?: string        // 다운로드 URL 또는 Sheets URL
  filename?: string
  rowCount: number
  exportedAt: Date
}

// ============================================
// Import 관련 타입
// ============================================

interface ImportOptions {
  format: 'csv' | 'xlsx' | 'google_sheets'
  targetType: 'strategy_params' | 'ohlcv_data' | 'watchlist'
  mapping?: ColumnMapping[]  // 컬럼 매핑
  sheetId?: string
  sheetName?: string  // 특정 시트 선택
}

interface ColumnMapping {
  sourceColumn: string
  targetField: string
  transform?: 'number' | 'date' | 'string' | 'boolean'
}

interface ImportResult {
  success: boolean
  rowCount: number
  errors?: ImportError[]
  data: unknown
}

interface ImportError {
  row: number
  column: string
  message: string
  value: unknown
}

// ============================================
// Google Sheets 동기화
// ============================================

interface SheetsSyncConfig {
  sheetId: string
  sheetName: string
  syncDirection: 'read' | 'write' | 'bidirectional'
  syncInterval: number  // ms
  dataType: 'portfolio' | 'trades' | 'alerts'
}

interface SheetsSyncStatus {
  connected: boolean
  lastSyncAt: Date
  pendingChanges: number
  errors: string[]
}
```

### 1.5 API 상세 설계

#### POST /api/export/csv

```typescript
// Request
{
  dataType: 'backtest',
  backtestId: 'bt_123',
  columns: ['date', 'equity', 'drawdown', 'trades']
}

// Response
{
  success: true,
  url: '/api/download/backtest_123_20251224.csv',
  filename: 'backtest_123_20251224.csv',
  rowCount: 365,
  exportedAt: '2025-12-24T10:00:00Z'
}
```

#### POST /api/export/sheets

```typescript
// Request
{
  dataType: 'portfolio',
  sheetId: '1abc...xyz',  // 기존 시트 ID (없으면 새로 생성)
  sheetName: 'HEPHAITOS Portfolio'
}

// Response
{
  success: true,
  url: 'https://docs.google.com/spreadsheets/d/1abc...xyz',
  sheetId: '1abc...xyz',
  rowCount: 25,
  exportedAt: '2025-12-24T10:00:00Z'
}
```

#### POST /api/import/xlsx

```typescript
// Request (multipart/form-data)
{
  file: File,  // .xlsx 파일
  targetType: 'ohlcv_data',
  mapping: [
    { sourceColumn: 'Date', targetField: 'timestamp', transform: 'date' },
    { sourceColumn: 'Open', targetField: 'open', transform: 'number' },
    { sourceColumn: 'High', targetField: 'high', transform: 'number' },
    { sourceColumn: 'Low', targetField: 'low', transform: 'number' },
    { sourceColumn: 'Close', targetField: 'close', transform: 'number' },
    { sourceColumn: 'Volume', targetField: 'volume', transform: 'number' }
  ]
}

// Response
{
  success: true,
  rowCount: 1000,
  data: { /* OHLCV 데이터 */ },
  errors: []
}
```

### 1.6 UI 컴포넌트 설계

```
src/components/spreadsheet/
├── ExportModal.tsx           # 내보내기 모달
│   ├── FormatSelector        # CSV/Excel/Sheets 선택
│   ├── DataTypeSelector      # 포트폴리오/백테스트/거래 선택
│   ├── ColumnPicker          # 내보낼 컬럼 선택
│   ├── DateRangePicker       # 날짜 범위 (선택)
│   └── ExportButton          # 내보내기 실행
│
├── ImportModal.tsx           # 가져오기 모달
│   ├── FileDropzone          # 파일 드래그앤드롭
│   ├── SheetSelector         # Google Sheets 선택
│   ├── ColumnMapper          # 컬럼 매핑 UI
│   ├── PreviewTable          # 가져올 데이터 미리보기
│   └── ImportButton          # 가져오기 실행
│
├── GoogleSheetsPanel.tsx     # Google Sheets 연결 패널
│   ├── ConnectionStatus      # 연결 상태 표시
│   ├── LinkedSheets          # 연결된 시트 목록
│   ├── SyncControls          # 동기화 제어
│   └── SyncHistory           # 동기화 이력
│
└── hooks/
    ├── useExport.ts          # 내보내기 로직
    ├── useImport.ts          # 가져오기 로직
    └── useGoogleSheets.ts    # Sheets API 연동
```

### 1.7 의존성

```json
{
  "xlsx": "^0.18.5",           // Excel 읽기/쓰기
  "papaparse": "^5.4.1",       // CSV 파싱
  "googleapis": "^140.0.0",    // Google Sheets API
  "file-saver": "^2.0.5"       // 파일 다운로드
}
```

---

## 2. Claude Chrome 확장 (베타)

### 2.1 기능 개요

```
┌─────────────────────────────────────────────────────────────┐
│  "어디서든 AI 트레이딩 분석을"                                │
│                                                             │
│  웹 페이지에서 차트/데이터 자동 인식                          │
│  Claude AI 실시간 분석 제공                                  │
│  HEPHAITOS 대시보드 연동                                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 사용자 스토리

| ID | 사용자 스토리 | 우선순위 |
|----|--------------|---------|
| UC-1 | TradingView에서 차트를 보면서 AI 분석을 받고 싶다 | P0 |
| UC-2 | 뉴스 기사를 읽으면서 종목 영향 분석을 받고 싶다 | P0 |
| UC-3 | 어떤 웹페이지에서든 종목명을 선택하면 분석을 보고 싶다 | P1 |
| UC-4 | 분석 결과를 HEPHAITOS 대시보드에 저장하고 싶다 | P1 |
| UC-5 | 여러 브로커 사이트에서 포트폴리오를 통합하고 싶다 | P2 |

### 2.3 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│                     Chrome Extension (MV3)                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Popup UI                                 │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │ Analysis │  │ Watchlist│  │ Alerts   │  │ Settings │   │  │
│  │  │ Panel    │  │ Panel    │  │ Panel    │  │ Panel    │   │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│  ┌───────────────────────────┴────────────────────────────────┐  │
│  │                  Background Service Worker                  │  │
│  │  • HEPHAITOS API 통신                                       │  │
│  │  • 인증 토큰 관리                                            │  │
│  │  • 알림 스케줄링                                             │  │
│  │  • 컨텍스트 메뉴 관리                                        │  │
│  └───────────────────────────┬────────────────────────────────┘  │
│                              │                                    │
│  ┌───────────────────────────┴────────────────────────────────┐  │
│  │                     Content Scripts                         │  │
│  │  • 페이지 내 종목 심볼 감지                                   │  │
│  │  • 차트 이미지 캡처                                          │  │
│  │  • 플로팅 분석 패널 주입                                      │  │
│  │  • 텍스트 선택 분석                                          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      HEPHAITOS Backend                            │
├──────────────────────────────────────────────────────────────────┤
│  POST /api/chrome/analyze     → AI 분석 요청                      │
│  POST /api/chrome/capture     → 차트 캡처 분석                    │
│  GET  /api/chrome/watchlist   → 관심 종목 조회                    │
│  POST /api/chrome/alert       → 알림 설정                         │
│  POST /api/chrome/save        → 분석 결과 저장                    │
│  WS   /api/chrome/realtime    → 실시간 시세                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Claude AI                                   │
├──────────────────────────────────────────────────────────────────┤
│  • 차트 패턴 분석 (Vision)                                        │
│  • 뉴스/기사 감성 분석                                            │
│  • 기술적 분석 레포트                                             │
│  • 리스크 평가                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### 2.4 확장 프로그램 구조

```
chrome-extension/
├── manifest.json              # Manifest V3
├── src/
│   ├── popup/                 # 팝업 UI (React)
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── AnalysisPage.tsx
│   │   │   ├── WatchlistPage.tsx
│   │   │   ├── AlertsPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   └── components/
│   │       ├── SymbolCard.tsx
│   │       ├── AnalysisResult.tsx
│   │       ├── PriceChart.tsx
│   │       └── QuickActions.tsx
│   │
│   ├── background/            # Service Worker
│   │   ├── index.ts
│   │   ├── api-client.ts      # HEPHAITOS API
│   │   ├── auth-manager.ts    # 인증 관리
│   │   ├── notification.ts    # 알림
│   │   └── context-menu.ts    # 우클릭 메뉴
│   │
│   ├── content/               # Content Scripts
│   │   ├── index.ts
│   │   ├── symbol-detector.ts # 종목 감지
│   │   ├── chart-capture.ts   # 차트 캡처
│   │   ├── floating-panel.ts  # 플로팅 패널
│   │   └── text-analyzer.ts   # 텍스트 분석
│   │
│   ├── shared/                # 공유 모듈
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   │
│   └── styles/
│       └── content.css        # 주입 스타일
│
├── public/
│   ├── icons/                 # 확장 아이콘
│   ├── popup.html
│   └── options.html
│
└── vite.config.ts             # Vite 빌드 설정
```

### 2.5 Manifest V3 설정

```json
{
  "manifest_version": 3,
  "name": "HEPHAITOS AI Trading Assistant",
  "version": "1.0.0",
  "description": "AI-powered trading analysis anywhere on the web",

  "permissions": [
    "activeTab",
    "storage",
    "notifications",
    "contextMenus",
    "alarms"
  ],

  "host_permissions": [
    "https://api.hephaitos.com/*",
    "https://*.tradingview.com/*",
    "https://*.investing.com/*",
    "https://*.yahoo.com/*",
    "https://*.bloomberg.com/*"
  ],

  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/index.ts"],
      "css": ["src/styles/content.css"],
      "run_at": "document_idle"
    }
  ],

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },

  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### 2.6 핵심 기능 상세

#### 2.6.1 종목 심볼 자동 감지

```typescript
// src/content/symbol-detector.ts

interface DetectedSymbol {
  symbol: string
  type: 'stock' | 'crypto' | 'forex' | 'index'
  exchange?: string
  confidence: number
  element: HTMLElement
  position: { x: number; y: number }
}

class SymbolDetector {
  private patterns = {
    // 미국 주식: $AAPL, AAPL, Apple Inc. (AAPL)
    usStock: /\$?([A-Z]{1,5})(?:\s|$|\))/g,

    // 암호화폐: BTC, ETH, BTC/USDT
    crypto: /\b(BTC|ETH|SOL|XRP|ADA|DOGE)(?:\/[A-Z]{3,4})?\b/g,

    // 한국 주식: 삼성전자, 005930
    krStock: /\b(\d{6})\b/g,
  }

  detect(text: string): DetectedSymbol[] {
    // 패턴 매칭 로직
  }

  highlightSymbols(symbols: DetectedSymbol[]): void {
    // DOM에 하이라이트 추가
  }

  attachTooltips(symbols: DetectedSymbol[]): void {
    // 호버 시 가격/분석 툴팁
  }
}
```

#### 2.6.2 차트 캡처 분석

```typescript
// src/content/chart-capture.ts

interface ChartCapture {
  imageData: string  // base64
  source: string     // 웹사이트
  symbol?: string
  timeframe?: string
  capturedAt: Date
}

interface ChartAnalysis {
  pattern: string           // 'double_bottom', 'head_shoulders', etc.
  trend: 'bullish' | 'bearish' | 'neutral'
  support: number[]
  resistance: number[]
  signals: string[]
  confidence: number
  explanation: string
}

class ChartCapturer {
  async captureChart(element: HTMLElement): Promise<ChartCapture> {
    // html2canvas 또는 자체 캡처 로직
  }

  async analyzeChart(capture: ChartCapture): Promise<ChartAnalysis> {
    // HEPHAITOS API → Claude Vision 분석
  }
}
```

#### 2.6.3 플로팅 분석 패널

```typescript
// src/content/floating-panel.ts

interface FloatingPanelConfig {
  position: 'top-right' | 'bottom-right' | 'center'
  theme: 'dark' | 'light' | 'auto'
  autoHide: boolean
  autoHideDelay: number
}

class FloatingPanel {
  private container: HTMLElement
  private shadow: ShadowRoot  // 스타일 격리

  show(content: AnalysisResult): void {
    // React 컴포넌트 렌더링
  }

  hide(): void {
    // 패널 숨김
  }

  minimize(): void {
    // 최소화
  }
}
```

### 2.7 API 상세 설계

#### POST /api/chrome/analyze

```typescript
// Request
{
  type: 'symbol' | 'text' | 'chart',
  symbol?: 'AAPL',
  text?: '애플이 신제품을 발표하면서...',
  chartImage?: 'data:image/png;base64,...',
  context: {
    url: 'https://finance.yahoo.com/quote/AAPL',
    title: 'Apple Inc. (AAPL) Stock Price'
  }
}

// Response
{
  success: true,
  analysis: {
    type: 'symbol',
    symbol: 'AAPL',
    price: { current: 195.50, change: 2.3, changePercent: 1.19 },
    technicals: {
      trend: 'bullish',
      rsi: 58,
      macd: 'bullish_crossover',
      support: [190, 185],
      resistance: [200, 210]
    },
    sentiment: 'positive',
    signals: [
      { type: 'buy', strength: 'moderate', reason: 'RSI 과매도 탈출' }
    ],
    summary: '단기적으로 강세 흐름이 예상됩니다...',
    disclaimer: '본 분석은 투자 조언이 아닙니다.'
  },
  cached: false,
  analyzedAt: '2025-12-24T10:00:00Z'
}
```

#### POST /api/chrome/capture

```typescript
// Request
{
  chartImage: 'data:image/png;base64,...',
  source: 'tradingview.com',
  symbol: 'BTC/USDT',
  timeframe: '4h'
}

// Response
{
  success: true,
  analysis: {
    pattern: {
      name: 'ascending_triangle',
      reliability: 0.75,
      direction: 'bullish'
    },
    levels: {
      support: [42000, 40500],
      resistance: [44000, 45500]
    },
    indicators: {
      rsi: 55,
      macd: { histogram: 'positive', trend: 'bullish' },
      volume: 'increasing'
    },
    prediction: {
      shortTerm: 'bullish',
      target: 45000,
      stopLoss: 41500,
      timeframe: '1-2 weeks'
    },
    visualization: 'data:image/png;base64,...',  // 분석 결과 오버레이
    explanation: '상승 삼각형 패턴이 형성되고 있으며...'
  }
}
```

### 2.8 의존성

```json
{
  "@anthropic-ai/sdk": "^0.71.2",
  "html2canvas": "^1.4.1",
  "react": "^18.2.0",
  "zustand": "^4.5.0",
  "@crxjs/vite-plugin": "^2.0.0-beta.25"
}
```

---

## 3. 차트 분석 고도화

### 3.1 현재 상태 vs 목표

| 기능 | 현재 | 목표 |
|-----|------|------|
| 기술 지표 | 20+ | 50+ |
| 차트 패턴 인식 | 없음 | AI 기반 자동 인식 |
| 다중 타임프레임 | 단일 | 멀티 (1m ~ 1M) |
| 비교 차트 | 없음 | 최대 5개 자산 비교 |
| 드로잉 도구 | 없음 | 추세선, 피보나치 등 |
| 알림 | 없음 | 가격/지표 조건 알림 |

### 3.2 신규 기능 설계

#### 3.2.1 AI 차트 패턴 인식

```typescript
interface PatternRecognition {
  patterns: DetectedPattern[]
  scanTime: Date
}

interface DetectedPattern {
  name: string           // 'head_shoulders', 'double_bottom', etc.
  type: 'reversal' | 'continuation'
  direction: 'bullish' | 'bearish'
  startIndex: number
  endIndex: number
  keyPoints: { x: number; y: number }[]
  reliability: number    // 0-1
  priceTarget?: number
  stopLoss?: number
}

// 지원 패턴
const SUPPORTED_PATTERNS = [
  // 반전 패턴
  'head_shoulders', 'inverse_head_shoulders',
  'double_top', 'double_bottom',
  'triple_top', 'triple_bottom',
  'rounding_bottom', 'rounding_top',

  // 지속 패턴
  'ascending_triangle', 'descending_triangle',
  'symmetrical_triangle', 'wedge',
  'flag', 'pennant', 'rectangle',

  // 캔들 패턴
  'doji', 'hammer', 'engulfing',
  'morning_star', 'evening_star'
]
```

#### 3.2.2 다중 타임프레임 분석

```typescript
interface MultiTimeframeAnalysis {
  symbol: string
  timeframes: TimeframeAnalysis[]
  overallTrend: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish'
  confluence: number  // 0-100 (타임프레임 간 일치도)
}

interface TimeframeAnalysis {
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M'
  trend: 'bullish' | 'bearish' | 'neutral'
  indicators: {
    rsi: number
    macd: 'bullish' | 'bearish' | 'neutral'
    ma: 'above' | 'below'
  }
  support: number
  resistance: number
}
```

#### 3.2.3 드로잉 도구

```typescript
interface DrawingTool {
  type: DrawingType
  points: Point[]
  style: DrawingStyle
  visible: boolean
  locked: boolean
}

type DrawingType =
  | 'trendline'
  | 'horizontal_line'
  | 'vertical_line'
  | 'fibonacci_retracement'
  | 'fibonacci_extension'
  | 'rectangle'
  | 'ellipse'
  | 'arrow'
  | 'text'
  | 'price_range'

interface DrawingStyle {
  color: string
  lineWidth: number
  lineStyle: 'solid' | 'dashed' | 'dotted'
  fillColor?: string
  fontSize?: number
}
```

---

## 4. 구현 로드맵

### Phase 1: 기반 구축 (2주)

```
Week 1:
├── Excel/CSV 내보내기 기본 구현
│   ├── SpreadsheetService 구현
│   ├── /api/export/csv 엔드포인트
│   └── ExportModal UI
│
└── Chrome 확장 스켈레톤
    ├── Manifest V3 설정
    ├── 빌드 파이프라인 (Vite + CRXJS)
    └── 팝업 UI 기본 구조

Week 2:
├── Excel 내보내기 완성
│   ├── /api/export/xlsx 엔드포인트
│   └── 컬럼 선택, 날짜 범위 기능
│
└── Chrome 확장 핵심 기능
    ├── Background Service Worker
    ├── 인증 연동 (HEPHAITOS 계정)
    └── 기본 API 통신
```

### Phase 2: 핵심 기능 (2주)

```
Week 3:
├── Google Sheets 연동
│   ├── OAuth 2.0 설정
│   ├── /api/export/sheets 엔드포인트
│   └── Sheets 선택 UI
│
└── Chrome 확장 - 종목 분석
    ├── 종목 심볼 감지
    ├── /api/chrome/analyze 엔드포인트
    └── 플로팅 분석 패널

Week 4:
├── Import 기능 구현
│   ├── CSV/Excel 파싱
│   ├── 컬럼 매핑 UI
│   └── 검증 및 에러 처리
│
└── Chrome 확장 - 차트 분석
    ├── 차트 캡처 기능
    ├── Claude Vision 연동
    └── 분석 결과 시각화
```

### Phase 3: 고도화 (2주)

```
Week 5:
├── 실시간 동기화
│   ├── WebSocket 기반 Sheets 동기화
│   └── 양방향 데이터 흐름
│
└── Chrome 확장 - 알림
    ├── 가격 알림 설정
    ├── 푸시 알림
    └── 관심 종목 관리

Week 6:
├── 차트 고도화
│   ├── AI 패턴 인식 통합
│   ├── 드로잉 도구
│   └── 다중 타임프레임
│
└── 통합 테스트 및 최적화
    ├── E2E 테스트
    ├── 성능 최적화
    └── 베타 배포 준비
```

### 마일스톤

| 마일스톤 | 날짜 | 산출물 |
|---------|------|--------|
| M1 | +2주 | CSV/Excel 내보내기, Chrome 확장 스켈레톤 |
| M2 | +4주 | Google Sheets 연동, Chrome 종목/차트 분석 |
| M3 | +6주 | 실시간 동기화, 알림, 차트 고도화 |
| M4 | +8주 | 베타 출시 |

---

## 5. 리스크 및 고려사항

### 5.1 기술적 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| Google Sheets API 할당량 | 중간 | 캐싱, 배치 요청 |
| Chrome 확장 심사 지연 | 높음 | 조기 제출, 준수 검토 |
| Claude Vision 비용 | 중간 | 캡처 최적화, 캐싱 |
| 크로스 브라우저 호환성 | 낮음 | Chrome 우선, 추후 확장 |

### 5.2 법률 준수

```
⚠️ 중요: 모든 분석 결과에 면책조항 필수 포함

"본 분석은 교육 및 참고 목적으로 제공되며,
투자 조언이 아닙니다. 투자 결정은 본인 책임입니다."
```

---

*이 문서는 HEPHAITOS 기능 확장을 위한 로직 설계서입니다.*
*마지막 업데이트: 2025-12-24*
