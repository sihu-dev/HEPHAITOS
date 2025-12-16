# HEPHAITOS API 키 발급 및 설정 가이드

> **업데이트**: 2025-12-16
> **목적**: HEPHAITOS의 모든 기능을 사용하기 위한 API 키 발급 방법

---

## 🔑 필수 API 키

### 1. Claude AI (Anthropic) - **필수**

**용도**: AI 전략 생성, AI 튜터, AI 리포트

**발급 방법**:
1. https://console.anthropic.com/ 접속
2. 계정 생성 또는 로그인
3. Settings → API Keys → Create Key
4. 키 복사 (sk-ant-로 시작)

**비용**:
- Claude 4 Haiku: $0.40 / 1M input tokens, $2 / 1M output tokens
- Claude 4 Sonnet: $3 / 1M input tokens, $15 / 1M output tokens
- 신규 가입 시 $5 크레딧 제공

**테스트**:
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-4-haiku-20250321","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}'
```

**환경변수**:
```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 2. 한국투자증권 (KIS) Open API - 선택

**용도**: 한국 주식 시세 조회, 주문 실행

**발급 방법**:
1. https://apiportal.koreainvestment.com/ 접속
2. 회원가입 (한국투자증권 계좌 필요)
3. 애플리케이션 등록
4. APP KEY, APP SECRET 발급

**계좌 개설**:
- 모의투자 계좌: 무료 (https://securities.koreainvestment.com/main/research/virtual/_static/TF01ca010001.jsp)
- 실전 계좌: 한국투자증권 영업점 방문 또는 비대면 개설

**환경변수**:
```env
KIS_APP_KEY=PSxxxxxxxxxxxxxxxxxxxx
KIS_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
KIS_ACCOUNT_NUMBER=12345678-01
KIS_ACCOUNT_PRODUCT_CODE=01
KIS_VIRTUAL=true  # 모의투자: true, 실전: false
```

**참고 문서**:
- API 가이드: https://apiportal.koreainvestment.com/apiservice/oauth2
- 샘플 코드: https://github.com/koreainvestment/open-trading-api

---

### 3. Polygon.io - 선택

**용도**: 미국 주식 시세 조회

**발급 방법**:
1. https://polygon.io/ 접속
2. Sign Up → 무료 플랜 선택
3. Dashboard → API Keys

**플랜 비교**:
| 플랜 | 가격 | API 콜 제한 | 실시간 데이터 |
|------|------|------------|--------------|
| Free | $0/월 | 5 calls/min | ❌ |
| Starter | $29/월 | 100 calls/min | ✅ (15분 지연) |
| Developer | $99/월 | 500 calls/min | ✅ (실시간) |
| Advanced | $249/월 | Unlimited | ✅ (실시간) |

**환경변수**:
```env
POLYGON_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
POLYGON_PLAN=basic  # basic | starter | developer | advanced
```

**테스트**:
```bash
curl "https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2023-01-01/2023-12-31?apiKey=YOUR_API_KEY"
```

---

### 4. 토스페이먼츠 (Toss Payments) - 선택

**용도**: 크레딧 결제 처리

**발급 방법**:
1. https://developers.tosspayments.com/ 접속
2. 회원가입 → 내 개발 정보
3. 개발자 센터 → API 키 발급
4. 테스트 키, 라이브 키 구분

**환경변수**:
```env
# 테스트 환경
TOSS_CLIENT_KEY=test_ck_xxxxxxxxxxxxxxxxxxxxxxxxxx
TOSS_SECRET_KEY=test_sk_xxxxxxxxxxxxxxxxxxxxxxxxxx
TOSS_TEST=true

# 실서비스 (심사 후 발급)
# TOSS_CLIENT_KEY=live_ck_xxxxxxxxxxxxxxxxxxxxxxxxxx
# TOSS_SECRET_KEY=live_sk_xxxxxxxxxxxxxxxxxxxxxxxxxx
# TOSS_TEST=false
```

**테스트 카드 번호**:
- 성공: 4090-0000-0000-0004 (유효기간: 임의, CVC: 임의)
- 실패: 4090-0000-0000-0012

**참고 문서**:
- 결제 연동 가이드: https://docs.tosspayments.com/guides/payment-widget/integration
- API 레퍼런스: https://docs.tosspayments.com/reference

---

## 🔧 환경변수 설정 방법

### Windows (PowerShell)

**Option 1: .env.local 파일 편집** (추천)
```powershell
cd C:\Users\sihu2\OneDrive\Desktop\Projects\HEPHAITOS
notepad .env.local
```

다음 내용 추가:
```env
# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Korea Market
KIS_APP_KEY=PSxxxxxxxxxxxxxxxxxxxx
KIS_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
KIS_ACCOUNT_NUMBER=12345678-01
KIS_ACCOUNT_PRODUCT_CODE=01
KIS_VIRTUAL=true

# US Market
POLYGON_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
POLYGON_PLAN=basic

# Payments
TOSS_CLIENT_KEY=test_ck_xxxxxxxxxxxxxxxxxxxxxxxxxx
TOSS_SECRET_KEY=test_sk_xxxxxxxxxxxxxxxxxxxxxxxxxx
TOSS_TEST=true
```

**Option 2: 자동 설정 스크립트 사용**
```powershell
.\scripts\setup-api-keys.ps1
```

### macOS / Linux

```bash
cd ~/Projects/HEPHAITOS
nano .env.local
```

---

## ✅ API 연결 테스트

전체 API 연결 상태 확인:
```bash
npm run test:api
```

개별 API 테스트:
```bash
# Claude AI
node scripts/test-anthropic.js

# KIS
node scripts/test-kis.js

# Polygon.io
node scripts/test-polygon.js

# 토스페이먼츠
node scripts/test-toss.js
```

---

## 🚨 보안 주의사항

### 절대 금지
- ❌ API 키를 GitHub에 커밋
- ❌ API 키를 코드에 하드코딩
- ❌ API 키를 스크린샷으로 공유
- ❌ 프론트엔드 코드에 SECRET_KEY 노출

### 권장 사항
- ✅ `.env.local` 파일만 사용 (`.gitignore`에 포함됨)
- ✅ 주기적으로 API 키 로테이션
- ✅ 프로덕션과 개발 환경 키 분리
- ✅ 키 노출 시 즉시 재발급

### 키 노출 시 대응
1. 해당 플랫폼에서 즉시 키 삭제
2. 새 키 재발급
3. `.env.local` 업데이트
4. Git 히스토리에서 키 제거 (필요 시)

---

## 💰 비용 관리

### Claude AI (Anthropic)
- **예상 비용**: AI 전략 1회 생성 = 약 $0.01~0.05
- **월 예산**: $100 = AI 전략 약 2,000~10,000회 생성
- **절약 팁**:
  - AI 튜터는 Haiku 모델 사용 (저렴)
  - AI 전략은 Sonnet 모델 사용 (고품질)

### KIS Open API
- **비용**: 무료
- **제한**: 초당 20건, 일 100,000건

### Polygon.io
- **Free**: $0/월 (5 calls/min)
- **Starter**: $29/월 (100 calls/min)
- **권장**: 개발 시 Free, 실서비스 시 Starter

### 토스페이먼츠
- **수수료**:
  - 신용카드: 3.3% (부가세 별도)
  - 간편결제: 2.8% (부가세 별도)
- **정산**: D+2일 (영업일 기준)

---

## 📞 지원

**API 키 발급 문제**:
1. 각 서비스 고객센터 문의
2. HEPHAITOS Discord 커뮤니티
3. GitHub Issues

**HEPHAITOS 설정 문제**:
- GitHub: https://github.com/YOUR_USERNAME/HEPHAITOS/issues
- Email: support@hephaitos.io (예시)

---

**다음 단계**:
1. API 키 발급 완료
2. `.env.local` 파일 업데이트
3. `npm run test:api` 실행하여 연결 확인
4. `npm run dev` 개발 서버 시작
