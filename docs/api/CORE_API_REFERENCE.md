# HEPHAITOS Core API Reference

> **핵심 API 엔드포인트 12개 문서**
>
> 최종 업데이트: 2025-12-18
> 버전: 2.0.0

---

## 📖 목차

### 전략 API (5개)
1. [GET/POST /api/strategies](#1-getpost-apistrategies) - 전략 목록 조회 및 생성
2. [GET/PATCH/DELETE /api/strategies/[id]](#2-getpatchdelete-apistrategiesid) - 전략 조회/수정/삭제
3. [GET /api/strategies/[id]/performance](#3-get-apistrategiesidperformance) - 전략 성과 조회
4. [GET /api/strategies/leaderboard](#4-get-apistrategiesleaderboard) - 전략 리더보드
5. [GET /api/strategies/ranking](#5-get-apistrategiesranking) - 전략 랭킹

### 백테스팅 & 거래 API (3개)
6. [POST /api/backtest/queue](#6-post-apibacktestqueue) - 백테스팅 작업 큐 추가
7. [GET/POST /api/trades](#7-getpost-apitrades) - 거래 내역 조회 및 실행
8. [GET/POST /api/simulation/trade](#8-getpost-apisimulationtrade) - 시뮬레이션 거래

### AI & 데이터 API (4개)
9. [POST /api/ai/strategy](#9-post-apiaistrategy) - AI 전략 생성
10. [POST /api/ai/agent](#10-post-apiaiagent) - AI 에이전트 대화
11. [GET /api/exchange/tickers](#11-get-apiexchangetickers) - 실시간 시세
12. [GET/POST /api/broker](#12-getpost-apibroker) - 증권사 연동

---

## ⚠️ 공통 사항

### 인증 (Authentication)

모든 API는 Supabase Auth 토큰이 필요합니다.

```bash
Authorization: Bearer <supabase-access-token>
```

### Rate Limit

| 카테고리 | 제한 | 적용 API |
|---------|------|----------|
| `api` | 100 req/min | 기본 |
| `strategy` | 50 req/min | 전략 CRUD |
| `ai` | 20 req/min | AI 생성 |
| `exchange` | 30 req/min | 실시간 시세 |
| `write` | 30 req/min | 주문 실행 |

### 응답 포맷

**성공 응답**:
```json
{
  "success": true,
  "data": { ... }
}
```

**에러 응답**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

### 법률 준수

⚠️ **중요**: 모든 AI 응답 및 전략 추천은 투자 조언이 아닙니다.
- "수익 보장", "확실한 수익" 표현 금지
- 모든 전략 결과에 면책조항 표시 필수
- 과거 성과는 미래 수익을 보장하지 않습니다

---

## 1. GET/POST /api/strategies

### GET - 전략 목록 조회

**Endpoint**: `GET /api/strategies`

**Description**: 사용자의 트레이딩 전략 목록을 조회합니다.

**Authentication**: Required

**Rate Limit**: `strategy` (50 req/min)

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userId` | string | No | current user | 사용자 ID |
| `limit` | number | No | 20 | 조회 개수 (1-100) |
| `offset` | number | No | 0 | 페이지네이션 오프셋 |
| `sortBy` | string | No | 'updated_at' | 정렬 기준 ('name', 'updated_at', 'created_at') |
| `order` | string | No | 'desc' | 정렬 순서 ('asc', 'desc') |

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "strategies": [
      {
        "id": "uuid",
        "name": "RSI 역발상 전략",
        "description": "RSI 30 이하 매수, 70 이상 매도",
        "userId": "user-uuid",
        "code": "function entry() { ... }",
        "config": {
          "entryConditions": [...],
          "exitConditions": [...],
          "riskManagement": { ... }
        },
        "isPublic": false,
        "tags": ["RSI", "역발상"],
        "createdAt": "2024-12-18T10:00:00Z",
        "updatedAt": "2024-12-18T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

**Example**:
```bash
curl -X GET https://api.hephaitos.com/api/strategies?limit=10&sortBy=updated_at \
  -H "Authorization: Bearer $TOKEN"
```

---

### POST - 전략 생성

**Endpoint**: `POST /api/strategies`

**Description**: 새로운 트레이딩 전략을 생성합니다.

**Authentication**: Required

**Rate Limit**: `write` (30 req/min)

**Request Body**:
```json
{
  "name": "My Strategy",
  "description": "전략 설명 (선택사항)",
  "code": "function entry(data) { return data.rsi < 30; }",
  "config": {
    "entryConditions": [
      {
        "type": "indicator",
        "indicator": "RSI",
        "operator": "<",
        "value": 30
      }
    ],
    "exitConditions": [...],
    "riskManagement": {
      "stopLossPercent": 5,
      "takeProfitPercent": 10
    }
  },
  "isPublic": false,
  "tags": ["RSI", "역발상"]
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "name": "My Strategy",
    ...
  }
}
```

**Error Responses**:

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | 잘못된 전략 설정 |
| `LEGAL_VIOLATION` | 403 | 법률 준수 위반 (투자 조언 표현 포함) |
| `UNAUTHORIZED` | 401 | 인증 실패 |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate Limit 초과 |

**Example**:
```bash
curl -X POST https://api.hephaitos.com/api/strategies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "RSI Strategy",
    "code": "function entry(data) { return data.rsi < 30; }",
    "config": { ... }
  }'
```

---

## 2. GET/PATCH/DELETE /api/strategies/[id]

### GET - 특정 전략 조회

**Endpoint**: `GET /api/strategies/{strategyId}`

**Description**: 특정 전략의 상세 정보를 조회합니다.

**Authentication**: Required

**Rate Limit**: `strategy` (50 req/min)

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `strategyId` | string (UUID) | Yes | 전략 ID |

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "strategy-uuid",
    "name": "RSI Strategy",
    "description": "...",
    "code": "...",
    "config": { ... },
    "userId": "user-uuid",
    "isPublic": false,
    "tags": ["RSI"],
    "performance": {
      "totalReturn": 15.5,
      "sharpeRatio": 1.2,
      "maxDrawdown": -8.3,
      "winRate": 0.65
    },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Error Responses**:

| Code | Status | Description |
|------|--------|-------------|
| `NOT_FOUND` | 404 | 전략을 찾을 수 없음 |
| `FORBIDDEN` | 403 | 접근 권한 없음 (다른 사용자의 private 전략) |

---

### PATCH - 전략 수정

**Endpoint**: `PATCH /api/strategies/{strategyId}`

**Description**: 전략 정보를 수정합니다.

**Authentication**: Required

**Rate Limit**: `write` (30 req/min)

**Request Body** (Partial Update):
```json
{
  "name": "Updated Strategy Name",
  "description": "새로운 설명",
  "config": { ... },
  "isPublic": true
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "strategy-uuid",
    "name": "Updated Strategy Name",
    ...
  }
}
```

---

### DELETE - 전략 삭제

**Endpoint**: `DELETE /api/strategies/{strategyId}`

**Description**: 전략을 삭제합니다.

**Authentication**: Required

**Rate Limit**: `write` (30 req/min)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "id": "strategy-uuid"
  }
}
```

---

## 3. GET /api/strategies/[id]/performance

**Endpoint**: `GET /api/strategies/{strategyId}/performance`

**Description**: 전략의 성과 지표를 조회합니다 (백테스팅 결과).

**Authentication**: Required

**Rate Limit**: `strategy` (50 req/min)

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | '1y' | 조회 기간 ('1m', '3m', '6m', '1y', 'all') |

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "strategyId": "uuid",
    "metrics": {
      "totalReturn": 18.5,
      "sharpeRatio": 1.82,
      "maxDrawdown": -8.3,
      "winRate": 0.65,
      "profitFactor": 2.1,
      "totalTrades": 24,
      "avgWin": 3.5,
      "avgLoss": -1.8
    },
    "equityCurve": [
      {
        "timestamp": 1704067200000,
        "value": 100000
      },
      {
        "timestamp": 1704153600000,
        "value": 102500
      }
    ],
    "trades": [
      {
        "entryDate": "2024-01-01T10:00:00Z",
        "exitDate": "2024-01-05T15:00:00Z",
        "symbol": "BTC/USD",
        "side": "long",
        "entryPrice": 42000,
        "exitPrice": 44100,
        "quantity": 1,
        "pnl": 2100,
        "pnlPercent": 5.0
      }
    ],
    "legalCompliance": {
      "passed": true,
      "warnings": [],
      "riskLevel": "moderate"
    }
  }
}
```

**Example**:
```bash
curl -X GET https://api.hephaitos.com/api/strategies/abc-123/performance?period=3m \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4. GET /api/strategies/leaderboard

**Endpoint**: `GET /api/strategies/leaderboard`

**Description**: 공개된 전략 중 성과가 우수한 전략 리더보드를 조회합니다.

**Authentication**: Optional (인증 시 더 많은 정보 제공)

**Rate Limit**: `api` (100 req/min)

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sortBy` | string | No | 'sharpe' | 정렬 기준 ('sharpe', 'return', 'winRate') |
| `limit` | number | No | 20 | 조회 개수 (1-100) |
| `period` | string | No | '1y' | 평가 기간 |

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "strategies": [
      {
        "rank": 1,
        "strategyId": "uuid",
        "strategyName": "AI Momentum Strategy",
        "creatorName": "TradingPro",
        "metrics": {
          "sharpeRatio": 2.5,
          "totalReturn": 45.2,
          "maxDrawdown": -12.3,
          "winRate": 0.72
        },
        "followerCount": 1250,
        "isVerified": true
      }
    ],
    "pagination": {
      "total": 500,
      "limit": 20
    }
  }
}
```

**Example**:
```bash
curl -X GET https://api.hephaitos.com/api/strategies/leaderboard?sortBy=return&limit=10
```

---

## 5. GET /api/strategies/ranking

**Endpoint**: `GET /api/strategies/ranking`

**Description**: 전략 랭킹 조회 (카테고리별).

**Authentication**: Optional

**Rate Limit**: `api` (100 req/min)

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | No | 'all' | 카테고리 ('momentum', 'mean-reversion', 'breakout', 'ai') |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "category": "momentum",
    "rankings": [
      {
        "rank": 1,
        "strategyId": "uuid",
        "name": "Trend Following Pro",
        "score": 95.5,
        "tags": ["momentum", "trend"]
      }
    ]
  }
}
```

---

## 6. POST /api/backtest/queue

**Endpoint**: `POST /api/backtest/queue`

**Description**: 백테스팅 작업을 큐에 추가합니다 (BullMQ).

**Authentication**: Required

**Rate Limit**: `write` (30 req/min)

**Request Body**:
```json
{
  "strategyId": "strategy-uuid",
  "symbol": "BTC/USD",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "initialCapital": 100000,
  "commission": 0.001,
  "slippage": 0.0005
}
```

**Response (202 Accepted)**:
```json
{
  "success": true,
  "data": {
    "jobId": "job-uuid",
    "status": "queued",
    "position": 3,
    "estimatedTime": 120
  }
}
```

**Webhook** (작업 완료 시):
```json
{
  "jobId": "job-uuid",
  "status": "completed",
  "result": {
    "metrics": { ... },
    "trades": [ ... ]
  }
}
```

**Example**:
```bash
curl -X POST https://api.hephaitos.com/api/backtest/queue \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "strategyId": "abc-123",
    "symbol": "BTC/USD",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }'
```

---

## 7. GET/POST /api/trades

### GET - 거래 내역 조회

**Endpoint**: `GET /api/trades`

**Description**: 사용자의 거래 내역을 조회합니다.

**Authentication**: Required

**Rate Limit**: `api` (100 req/min)

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbol` | string | No | all | 거래 심볼 필터 |
| `startDate` | string | No | -30days | 시작일 (ISO 8601) |
| `endDate` | string | No | now | 종료일 (ISO 8601) |
| `status` | string | No | all | 거래 상태 ('open', 'closed', 'all') |
| `limit` | number | No | 50 | 조회 개수 |

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "trades": [
      {
        "id": "trade-uuid",
        "symbol": "AAPL",
        "side": "buy",
        "quantity": 10,
        "entryPrice": 150.50,
        "exitPrice": 155.20,
        "pnl": 47.00,
        "pnlPercent": 3.12,
        "status": "closed",
        "openedAt": "2024-12-01T10:00:00Z",
        "closedAt": "2024-12-05T15:00:00Z",
        "strategyId": "strategy-uuid",
        "strategyName": "My Strategy"
      }
    ],
    "summary": {
      "totalTrades": 42,
      "openTrades": 2,
      "closedTrades": 40,
      "totalPnl": 1250.50,
      "winRate": 0.65
    }
  }
}
```

---

### POST - 거래 실행 (실전 거래)

**Endpoint**: `POST /api/trades`

**Description**: 실제 거래를 실행합니다.

**Authentication**: Required

**Rate Limit**: `write` (30 req/min)

**⚠️ 경고**: 실제 자금으로 거래됩니다. Paper Trading은 `/api/simulation/trade` 사용

**Request Body**:
```json
{
  "symbol": "AAPL",
  "side": "buy",
  "quantity": 10,
  "orderType": "market",
  "price": 150.50,
  "stopLoss": 145.00,
  "takeProfit": 160.00
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "orderId": "order-uuid",
    "status": "submitted",
    "timestamp": "2024-12-18T10:00:00Z",
    "estimatedFill": "market"
  }
}
```

**Example**:
```bash
curl -X POST https://api.hephaitos.com/api/trades \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "side": "buy",
    "quantity": 10,
    "orderType": "market"
  }'
```

---

## 8. GET/POST /api/simulation/trade

### GET - 시뮬레이션 거래 내역

**Endpoint**: `GET /api/simulation/trade`

**Description**: Paper Trading (시뮬레이션) 거래 내역을 조회합니다.

**Authentication**: Required

**Rate Limit**: `api` (100 req/min)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "trades": [...],
    "account": {
      "balance": 100000,
      "unrealizedPnl": 250.50,
      "totalPnl": 1500.00
    }
  }
}
```

---

### POST - 시뮬레이션 거래 실행

**Endpoint**: `POST /api/simulation/trade`

**Description**: Paper Trading 주문을 실행합니다 (실제 자금 X).

**Authentication**: Required

**Rate Limit**: `write` (30 req/min)

**Request Body**: `/api/trades`와 동일

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "orderId": "sim-order-uuid",
    "status": "filled",
    "filledPrice": 150.52,
    "mode": "simulation",
    "timestamp": "2024-12-18T10:00:00Z"
  }
}
```

---

## 9. POST /api/ai/strategy

**Endpoint**: `POST /api/ai/strategy`

**Description**: AI를 사용하여 자연어 입력으로부터 트레이딩 전략을 생성합니다.

**Authentication**: Required

**Rate Limit**: `ai` (20 req/min)

**Request Body**:
```json
{
  "prompt": "RSI 30 이하일 때 매수하고 70 이상일 때 매도하는 전략을 만들어줘",
  "model": "claude-4",
  "riskProfile": "moderate"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "strategy": {
      "name": "RSI 역발상 전략",
      "description": "RSI 지표를 활용한 역발상 매매 전략입니다.",
      "code": "function entry(data) { return data.rsi < 30; }",
      "config": {
        "entryConditions": [
          {
            "type": "indicator",
            "indicator": "RSI",
            "period": 14,
            "operator": "<",
            "value": 30
          }
        ],
        "exitConditions": [
          {
            "type": "indicator",
            "indicator": "RSI",
            "operator": ">",
            "value": 70
          }
        ],
        "riskManagement": {
          "stopLossPercent": 5,
          "takeProfitPercent": 10
        }
      },
      "legalCompliance": {
        "passed": true,
        "disclaimer": "이 전략은 교육 목적이며 투자 조언이 아닙니다."
      },
      "tokensUsed": 1250,
      "costKRW": 15.5
    }
  }
}
```

**Example**:
```bash
curl -X POST https://api.hephaitos.com/api/ai/strategy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "MACD 골든크로스 전략",
    "model": "claude-4"
  }'
```

---

## 10. POST /api/ai/agent

**Endpoint**: `POST /api/ai/agent`

**Description**: AI 트레이딩 에이전트와 대화합니다.

**Authentication**: Required

**Rate Limit**: `ai` (20 req/min)

**Request Body**:
```json
{
  "message": "오늘 시장 상황이 어떤가요?",
  "conversationId": "conv-uuid",
  "model": "claude-4"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "response": "오늘 S&P 500은 0.5% 상승했으며...",
    "suggestions": [
      "포트폴리오 리밸런싱 고려",
      "리스크 관리 점검"
    ],
    "conversationId": "conv-uuid",
    "tokensUsed": 850,
    "legalCompliance": {
      "disclaimer": "이 정보는 교육 목적이며 투자 조언이 아닙니다."
    }
  }
}
```

---

## 11. GET /api/exchange/tickers

**Endpoint**: `GET /api/exchange/tickers`

**Description**: 실시간 시세 데이터를 조회합니다.

**Authentication**: Optional (Rate Limit 완화를 위해 인증 권장)

**Rate Limit**: `exchange` (30 req/min)

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | No | 심볼 목록 (쉼표 구분, 예: 'BTC/USD,ETH/USD') |

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "tickers": [
      {
        "symbol": "BTC/USD",
        "bid": 42000.50,
        "ask": 42001.20,
        "last": 42000.80,
        "change": 850.30,
        "changePercent": 2.07,
        "volume": 123456.78,
        "timestamp": 1704067200000
      }
    ]
  }
}
```

**Example**:
```bash
curl -X GET https://api.hephaitos.com/api/exchange/tickers?symbols=BTC/USD,ETH/USD
```

---

## 12. GET/POST /api/broker

### GET - 증권사 연결 상태 조회

**Endpoint**: `GET /api/broker`

**Description**: 사용자의 증권사 연결 상태를 조회합니다.

**Authentication**: Required

**Rate Limit**: `api` (100 req/min)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "connections": [
      {
        "brokerId": "KIS",
        "accountNumber": "1234****",
        "connected": true,
        "lastSync": "2024-12-18T09:30:00Z",
        "balance": {
          "total": 10000000,
          "available": 8500000
        }
      }
    ]
  }
}
```

---

### POST - 증권사 연결

**Endpoint**: `POST /api/broker`

**Description**: 새로운 증권사 계좌를 연결합니다.

**Authentication**: Required

**Rate Limit**: `write` (30 req/min)

**Request Body**:
```json
{
  "brokerId": "KIS",
  "apiKey": "your-api-key",
  "apiSecret": "your-api-secret",
  "accountNumber": "12345678",
  "isPaper": false
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "connectionId": "conn-uuid",
    "brokerId": "KIS",
    "status": "connected",
    "accountNumber": "1234****"
  }
}
```

**Error Responses**:

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_CREDENTIALS` | 401 | 잘못된 API 키/시크릿 |
| `CONNECTION_FAILED` | 503 | 증권사 서버 연결 실패 |
| `ACCOUNT_NOT_FOUND` | 404 | 계좌번호를 찾을 수 없음 |

**Example**:
```bash
curl -X POST https://api.hephaitos.com/api/broker \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brokerId": "KIS",
    "apiKey": "xxx",
    "apiSecret": "yyy",
    "accountNumber": "12345678",
    "isPaper": true
  }'
```

---

## 📌 추가 정보

### Webhook 설정

백테스팅 완료, 주문 체결 등의 이벤트를 Webhook으로 수신할 수 있습니다.

**설정**: `POST /api/user/webhooks`

```json
{
  "url": "https://yourdomain.com/webhook",
  "events": ["backtest_completed", "order_filled"]
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | 요청 데이터 검증 실패 |
| `UNAUTHORIZED` | 401 | 인증 실패 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `LEGAL_VIOLATION` | 403 | 법률 준수 위반 |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate Limit 초과 |
| `INTERNAL_ERROR` | 500 | 서버 오류 |
| `BROKER_ERROR` | 503 | 증권사 연결 오류 |

### Pagination

목록 조회 API는 다음과 같은 페이지네이션을 지원합니다:

```json
{
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Versioning

API 버전은 URL에 포함되지 않으며, 헤더로 관리합니다:

```bash
Accept-Version: 2.0
```

---

## ⚖️ 법률 준수 (Legal Compliance)

**중요**: HEPHAITOS는 교육 및 도구 제공 플랫폼입니다.

### 금지 사항
- ❌ 투자 조언 제공
- ❌ 수익 보장 표현
- ❌ 특정 종목 추천
- ❌ "~하세요" 권유형 표현

### 허용 표현
- ✅ "~할 수 있습니다" (설명형)
- ✅ "교육 목적입니다"
- ✅ "참고용입니다"
- ✅ "과거 성과는 미래를 보장하지 않습니다"

### 면책조항
모든 트레이딩 관련 응답에는 다음 면책조항이 포함됩니다:

> 본 서비스는 투자 교육 및 도구 제공 목적이며, 투자 조언이 아닙니다.
> 투자 결정은 본인 책임입니다. 과거 성과는 미래 수익을 보장하지 않습니다.

---

## 📧 지원

- **Documentation**: https://docs.hephaitos.com
- **GitHub**: https://github.com/anthropics/hephaitos
- **Email**: support@hephaitos.com

---

*최종 업데이트: 2025-12-18*
*버전: 2.0.0*
*문서 작성: Claude Code*
