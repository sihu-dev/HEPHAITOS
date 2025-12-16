---
name: unified-broker-api
description: UnifiedBroker API 사용법 - 3분 만에 모든 증권사 연동
tags: [broker, api, integration]
version: 1.0.0
---

# Unified Broker API Skill

HEPHAITOS의 핵심 차별화 요소인 UnifiedBroker API 사용법입니다.

## 핵심 개념

```
┌─────────────────────────────────────────┐
│         Hephaitos Unified API           │
├─────────────────────────────────────────┤
│  KIS(REST) │ Kiwoom(Proxy) │ Alpaca    │
└─────────────────────────────────────────┘
```

**모든 증권사를 하나의 인터페이스로 통합**하여 3분 만에 연동 가능합니다.

---

## 인터페이스 정의

```typescript
// src/lib/broker/UnifiedBroker.ts
export interface UnifiedBroker {
  // 연결
  connect(credentials: BrokerCredentials): Promise<ConnectionResult>;
  disconnect(): Promise<void>;

  // 조회
  getBalance(): Promise<Balance>;
  getHoldings(): Promise<Holding[]>;
  getOrders(): Promise<Order[]>;

  // 주문
  buy(order: BuyOrder): Promise<OrderResult>;
  sell(order: SellOrder): Promise<OrderResult>;
  cancelOrder(orderId: string): Promise<void>;

  // 실시간
  subscribePrice(symbol: string, callback: PriceCallback): void;
  unsubscribe(symbol: string): void;
}
```

---

## 지원 증권사

### 1. KIS 한국투자증권 (구현 완료 ✅)

```typescript
// src/lib/broker/adapters/KISBroker.ts
export class KISBroker implements UnifiedBroker {
  private client: KISClient;

  async connect(credentials: KISCredentials) {
    // OAuth 인증
    const token = await this.client.authenticate({
      appKey: credentials.appKey,
      appSecret: credentials.appSecret,
    });

    this.accessToken = token;

    return {
      success: true,
      broker: 'KIS',
      accountNo: credentials.accountNo,
    };
  }

  async getBalance(): Promise<Balance> {
    const response = await this.client.get('/inquire-balance', {
      headers: {
        authorization: `Bearer ${this.accessToken}`,
      },
    });

    return {
      cash: response.output.dnca_tot_amt,      // 예수금
      buyingPower: response.output.nrcvb_buy_amt, // 매수가능금액
      totalAssets: response.output.tot_evlu_amt,  // 총평가액
    };
  }

  async buy(order: BuyOrder): Promise<OrderResult> {
    const response = await this.client.post('/order', {
      stockCode: order.symbol,
      orderQty: order.quantity,
      orderPrice: order.price || 0,  // 0 = 시장가
      orderType: order.price ? '00' : '01',
    });

    return {
      orderId: response.output.KRX_FWDG_ORD_ORGNO,
      status: 'pending',
      symbol: order.symbol,
      quantity: order.quantity,
    };
  }

  subscribePrice(symbol: string, callback: PriceCallback) {
    // WebSocket 구독
    this.ws.subscribe(`price:${symbol}`, (data) => {
      callback({
        symbol,
        price: parseFloat(data.STCK_PRPR),
        change: parseFloat(data.PRDY_VRSS),
        changeRate: parseFloat(data.PRDY_CTRT),
        volume: parseInt(data.ACML_VOL),
      });
    });
  }
}
```

### 2. Kiwoom 키움증권 (계획 중)

```typescript
// src/lib/broker/adapters/KiwoomBroker.ts
export class KiwoomBroker implements UnifiedBroker {
  // ActiveX → Node.js Proxy 서버 필요
  private proxy: KiwoomProxyClient;

  async connect(credentials: KiwoomCredentials) {
    // Windows ActiveX 제한 → Proxy로 우회
    return this.proxy.connect(credentials);
  }

  // 나머지 구현...
}
```

### 3. Alpaca (US 주식)

```typescript
// src/lib/broker/adapters/AlpacaBroker.ts
export class AlpacaBroker implements UnifiedBroker {
  async connect(credentials: AlpacaCredentials) {
    this.client = new AlpacaClient({
      keyId: credentials.apiKey,
      secretKey: credentials.secretKey,
      paper: credentials.isPaper, // 모의투자
    });

    return { success: true, broker: 'Alpaca' };
  }

  // 나머지 구현...
}
```

---

## Factory Pattern

```typescript
// src/lib/broker/BrokerFactory.ts
export class BrokerFactory {
  static create(type: BrokerType): UnifiedBroker {
    switch (type) {
      case 'KIS':
        return new KISBroker();
      case 'KIWOOM':
        return new KiwoomBroker();
      case 'ALPACA':
        return new AlpacaBroker();
      default:
        throw new Error(`Unsupported broker: ${type}`);
    }
  }
}

// 사용 예시
const broker = BrokerFactory.create('KIS');
await broker.connect(credentials);
```

---

## 사용 예시

### 1. 증권사 연결

```typescript
import { BrokerFactory } from '@/lib/broker';

async function connectBroker() {
  // 1. 브로커 생성
  const broker = BrokerFactory.create('KIS');

  // 2. 인증 정보
  const credentials = {
    appKey: process.env.KIS_APP_KEY!,
    appSecret: process.env.KIS_APP_SECRET!,
    accountNo: process.env.KIS_ACCOUNT_NO!,
  };

  // 3. 연결
  const result = await broker.connect(credentials);

  if (result.success) {
    console.log('✅ 연결 성공:', result.broker);
  }

  return broker;
}
```

### 2. 잔고 조회

```typescript
const balance = await broker.getBalance();

console.log({
  현금: balance.cash.toLocaleString(),
  매수가능: balance.buyingPower.toLocaleString(),
  총자산: balance.totalAssets.toLocaleString(),
});
```

### 3. 보유 종목 조회

```typescript
const holdings = await broker.getHoldings();

holdings.forEach(holding => {
  console.log({
    종목명: holding.name,
    수량: holding.quantity,
    평가액: holding.marketValue.toLocaleString(),
    수익률: `${holding.returnRate}%`,
  });
});
```

### 4. 주식 매수

```typescript
// 시장가 매수
const result = await broker.buy({
  symbol: '005930',  // 삼성전자
  quantity: 10,
});

console.log('주문번호:', result.orderId);
```

```typescript
// 지정가 매수
const result = await broker.buy({
  symbol: '005930',
  quantity: 10,
  price: 70000,  // 70,000원
});
```

### 5. 주식 매도

```typescript
const result = await broker.sell({
  symbol: '005930',
  quantity: 5,
  price: 75000,  // 지정가
});
```

### 6. 실시간 가격 구독

```typescript
broker.subscribePrice('005930', (price) => {
  console.log({
    현재가: price.price,
    등락: price.change,
    등락률: `${price.changeRate}%`,
    거래량: price.volume,
  });
});

// 구독 해제
broker.unsubscribe('005930');
```

---

## 에러 핸들링

```typescript
try {
  await broker.buy({
    symbol: '005930',
    quantity: 10,
  });
} catch (error) {
  if (error instanceof InsufficientFundsError) {
    // 잔고 부족
    notify({
      type: 'error',
      message: '매수 가능 금액이 부족합니다.',
    });
  } else if (error instanceof InvalidSymbolError) {
    // 잘못된 종목코드
    notify({
      type: 'error',
      message: '존재하지 않는 종목입니다.',
    });
  } else {
    // 기타 에러
    console.error(error);
  }
}
```

---

## React Hook으로 감싸기

```typescript
// src/hooks/use-broker.ts
export function useBroker(type: BrokerType) {
  const [broker, setBroker] = useState<UnifiedBroker | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const connect = async (credentials: BrokerCredentials) => {
    setLoading(true);

    try {
      const b = BrokerFactory.create(type);
      const result = await b.connect(credentials);

      if (result.success) {
        setBroker(b);
        setConnected(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    broker,
    connected,
    loading,
    connect,
  };
}
```

**사용 예시:**
```tsx
function TradingPanel() {
  const { broker, connected, connect } = useBroker('KIS');

  const handleConnect = async () => {
    await connect({
      appKey: '...',
      appSecret: '...',
      accountNo: '...',
    });
  };

  const handleBuy = async () => {
    if (!broker) return;

    await broker.buy({
      symbol: '005930',
      quantity: 10,
    });
  };

  return (
    <div>
      {!connected && <Button onClick={handleConnect}>연결하기</Button>}
      {connected && <Button onClick={handleBuy}>매수</Button>}
    </div>
  );
}
```

---

## 테스팅

### 1. Mock Broker

```typescript
// src/lib/broker/adapters/MockBroker.ts
export class MockBroker implements UnifiedBroker {
  async connect() {
    return { success: true, broker: 'MOCK' };
  }

  async getBalance() {
    return {
      cash: 10_000_000,
      buyingPower: 10_000_000,
      totalAssets: 15_000_000,
    };
  }

  async buy(order: BuyOrder) {
    return {
      orderId: `MOCK-${Date.now()}`,
      status: 'filled',
      symbol: order.symbol,
      quantity: order.quantity,
    };
  }

  // 나머지 메서드도 Mock 데이터 반환
}
```

### 2. 단위 테스트

```typescript
// src/__tests__/lib/broker/KISBroker.test.ts
describe('KISBroker', () => {
  it('should connect successfully', async () => {
    const broker = new KISBroker();
    const result = await broker.connect(testCredentials);

    expect(result.success).toBe(true);
    expect(result.broker).toBe('KIS');
  });

  it('should get balance', async () => {
    const broker = new KISBroker();
    await broker.connect(testCredentials);

    const balance = await broker.getBalance();

    expect(balance.cash).toBeGreaterThan(0);
  });
});
```

---

## 보안 고려사항

### 1. 인증 정보 암호화

```typescript
// 환경 변수로 관리
const credentials = {
  appKey: process.env.KIS_APP_KEY!,
  appSecret: process.env.KIS_APP_SECRET!,
  accountNo: process.env.KIS_ACCOUNT_NO!,
};

// Supabase Vault에 저장
await supabase
  .from('broker_credentials')
  .insert({
    user_id: userId,
    broker: 'KIS',
    credentials: encrypt(credentials), // AES-256 암호화
  });
```

### 2. Rate Limiting

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 분당 10회
});

async function buy(order: BuyOrder) {
  const { success } = await ratelimit.limit(userId);

  if (!success) {
    throw new RateLimitError('분당 주문 한도 초과');
  }

  return broker.buy(order);
}
```

---

## 체크리스트

### 브로커 연동 구현 시
- [ ] UnifiedBroker 인터페이스 준수
- [ ] 에러 핸들링 완료
- [ ] 인증 정보 암호화
- [ ] Rate Limiting 적용
- [ ] 단위 테스트 작성
- [ ] Mock 브로커 준비

### 보안
- [ ] API 키 환경 변수 관리
- [ ] 민감 정보 암호화
- [ ] HTTPS 통신 필수
- [ ] 토큰 만료 처리

---

**3분 연동의 핵심:**
- UnifiedBroker 인터페이스로 추상화
- Adapter 패턴으로 증권사별 구현
- Factory 패턴으로 간편한 생성
- React Hook으로 UI 통합
