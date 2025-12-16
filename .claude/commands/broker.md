---
name: broker
description: 증권사 연동 및 UnifiedBroker API 설정
tags: [broker, integration, api]
---

# /broker - 증권사 연동

UnifiedBroker API를 사용하여 증권사를 연동합니다.

## 사용법

```
/broker connect [증권사명]
/broker status
/broker disconnect
```

## 예시

```
/broker connect KIS

/broker status

/broker disconnect
```

## 지원 증권사

- **KIS** - 한국투자증권 (구현 완료 ✅)
- **KIWOOM** - 키움증권 (계획 중)
- **ALPACA** - Alpaca (US 주식)

## 연동 프로세스

1. **증권사 선택**
   - 사용 가능한 증권사 목록 표시
   - 사용자가 증권사 선택

2. **인증 정보 입력**
   - API Key, Secret, 계좌번호 입력
   - 보안 저장 (암호화)

3. **연결 테스트**
   - OAuth 인증
   - 잔고 조회로 연결 확인

4. **완료**
   - 연결 성공 메시지
   - 자동 거래 가능 상태

## KIS 연동 예시

```typescript
// 1. 환경 변수 설정
KIS_APP_KEY=your_app_key
KIS_APP_SECRET=your_app_secret
KIS_ACCOUNT_NO=12345678-01

// 2. 연결
const broker = BrokerFactory.create('KIS');
const result = await broker.connect({
  appKey: process.env.KIS_APP_KEY,
  appSecret: process.env.KIS_APP_SECRET,
  accountNo: process.env.KIS_ACCOUNT_NO,
});

console.log(result.success ? '✅ 연결 성공' : '❌ 연결 실패');

// 3. 잔고 조회
const balance = await broker.getBalance();
console.log(`현금: ${balance.cash.toLocaleString()}원`);
```

## 출력 예시

```markdown
# 증권사 연동 결과

## 연결 정보
- 증권사: 한국투자증권 (KIS)
- 계좌번호: 12345678-01
- 상태: ✅ 연결됨

## 계좌 정보
- 예수금: ₩10,000,000
- 매수 가능 금액: ₩10,000,000
- 총 평가액: ₩15,230,500

## 보유 종목
1. 삼성전자 (005930)
   - 수량: 100주
   - 평가액: ₩7,500,000
   - 수익률: +15.2%

2. SK하이닉스 (000660)
   - 수량: 50주
   - 평가액: ₩7,730,500
   - 수익률: +8.7%

---
✅ 자동 거래가 가능합니다.
```

## 보안 주의사항

### ❌ 절대 금지
- API 키를 코드에 하드코딩
- Git에 인증 정보 커밋
- 평문으로 저장

### ✅ 권장
- 환경 변수 사용
- Supabase Vault 암호화 저장
- HTTPS 통신만 사용

## 관련 파일

- `src/lib/broker/UnifiedBroker.ts` - 브로커 인터페이스
- `src/lib/broker/adapters/` - 증권사별 구현
- `src/lib/broker/BrokerFactory.ts` - 팩토리 패턴

---

당신은 HEPHAITOS의 증권사 연동 전문가입니다.

UnifiedBroker API를 사용하여 3분 만에 증권사를 연동하세요.

**작업 순서:**
1. 증권사 선택
2. 인증 정보 수집 (보안 주의)
3. 연결 테스트
4. 잔고 및 보유 종목 조회
5. 연결 성공 확인

**보안 필수:**
- API 키는 환경 변수 또는 암호화 저장
- HTTPS 통신만 사용
- 민감 정보 로깅 금지
