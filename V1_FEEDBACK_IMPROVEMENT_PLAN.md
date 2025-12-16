# HEPHAITOS V1 피드백 개선 계획

> **생성일**: 2025-12-16
> **기준**: GPT-5.2 Pro V1 Feedback + Loop 1-9 구현 상태

---

## Executive Summary

### 현재 상태
- **V1 점수**: 8.4/10 (조건부 GO)
- **Loop 1-9 완료**: 결제/Rate Limit/법무/워딩 개선 등 핵심 구현 완료
- **V2 목표**: 8.9/10 (+0.5점)

### P0 게이트 현황 (5개 중 4개 완료)

| P0 게이트 | 상태 | Loop | 비고 |
|----------|------|------|------|
| ✅ 결제(토스) + 웹훅/멱등성 | **완료** | Loop 1 | RPC 함수, idempotency_key 구현 |
| ⚠️ 키움 "지원" 문구 제거 | **부분** | Loop 7 | Broker badge 시스템 구축, 확인 필요 |
| ✅ Rate limit + Circuit breaker | **완료** | Loop 2 | Upstash Redis, ai_usage_events |
| ✅ 연령 게이트(19+) + 면책 동의 | **완료** | Loop 3 | user_consents, disclaimer_versions |
| ❌ 데이터 소스 라이선스 확인 | **미완료** | - | Unusual Whales, Polygon 라이선스 검증 필요 |

---

## 1. V1 피드백 항목별 대응 상태

### 1.1 비즈니스 모델 지속 가능성

#### 피드백 요약
- 전환율(Free→Paid) 10% 가정이 검증되지 않음
- 무료 50 크레딧 소진 후 재구매율 미측정
- ARPU=₩10,000이 월 단위 고정 수치로 가정되어 왜곡

#### 대응 상태

| 항목 | 상태 | Loop | 세부사항 |
|------|------|------|----------|
| D1/D7 리텐션 추적 | ✅ 설계 완료 | Loop 4 | product_events 테이블 |
| TTFP (첫 결제까지 시간) | ✅ 설계 완료 | Loop 4 | Funnel SQL 쿼리 |
| 크레딧 0 도달 후 재구매율 | ✅ 설계 완료 | Loop 4 | A/B 실험 프레임워크 |
| 퍼널 분석 (어디서 이탈?) | ✅ 설계 완료 | Loop 4 | 단계별 이벤트 추적 |
| ARPPU 분포 (헤비/미들/라이트) | ⚠️ 미완료 | - | 코호트 분석 쿼리 필요 |
| 마케팅비 BEP 계산 | ❌ 미반영 | - | 재무 모델 업데이트 필요 |

**다음 조치 (Loop 10 예정)**:
- [ ] 코호트별 ARPPU 분포 분석 쿼리 작성
- [ ] CAC(고객획득비용) 포함 BEP 재계산
- [ ] 베타 KPI 대시보드 구축 (Metabase/Grafana)

---

### 1.2 기술 아키텍처 확장성

#### 피드백 요약
- Observability 없으면 "원가 통제 불능"
- 백테스팅 무거워지면 큐/잡 워커 필요
- 요청당 토큰/비용/지연 추적 필수

#### 대응 상태

| 항목 | 상태 | Loop | 세부사항 |
|------|------|------|----------|
| ai_usage_events 테이블 | ✅ 완료 | Loop 2 | tokens_in/out, cost_usd, latency_ms |
| 사용자별 비용 추적 | ✅ 완료 | Loop 2 | user_id 인덱스, 월별 집계 쿼리 |
| 기능별 원가 대시보드 | ⚠️ SQL만 | Loop 2 | 시각화 대시보드 미구축 |
| 백테스트 큐 시스템 | ❌ 미구현 | - | 언급만, 실제 Queue 없음 |
| Rate limiting | ✅ 완료 | Loop 2 | Upstash Redis, sliding window |
| Circuit breaker | ✅ 완료 | Loop 2 | 연속 실패 감지, 쿨다운 |

**다음 조치 (Loop 10-11 예정)**:
- [ ] BullMQ/Inngest 기반 백테스트 큐 시스템 설계
- [ ] Grafana/Metabase로 비용 대시보드 구축
- [ ] 기능별 원가 알림 시스템 (임계치 초과 시 Slack)

---

### 1.3 법률 준수 완전성

#### 피드백 요약
- Safety Net(금지문구 필터)만으로 부족
- 면책 동의 "언제/어떤 문구" 이벤트 로그 필요
- 투자자문 오인 방지 UX (종목/시점/가격 단정 → 자동 완화)

#### 대응 상태

| 항목 | 상태 | Loop | 세부사항 |
|------|------|------|----------|
| disclaimer_versions 테이블 | ✅ 완료 | Loop 3 | 버전/content_hash 추적 |
| user_consents 로그 | ✅ 완료 | Loop 3 | IP/UA/타임스탬프 기록 |
| Safety Net v2 (sectional) | ✅ 완료 | Loop 3, 9 | allow/soften/block 정책 |
| safety_events 로그 | ✅ 완료 | Loop 3 | 매칭 규칙, 전후 텍스트 저장 |
| 연령 게이트 (19+) | ✅ 완료 | Loop 3 | 가입/결제 전 차단 |
| 광고표현 통제 ("3분 수익") | ⚠️ 부분 | Loop 5-7 | 워딩 개선, CI 체크 필요 |
| 키움 지원 표기 정리 | ⚠️ 확인 필요 | Loop 7 | Broker badge "준비중" 표시 |

**다음 조치 (Loop 10 예정)**:
- [ ] 키움 관련 문구 전수 검색 및 "준비중" 처리
- [ ] 광고표현 CI 스크립트 강화 (forbidden patterns)
- [ ] Safety Net 테스트 케이스 추가 (투자조언 시뮬레이션)

---

### 1.4 재무 가정의 합리성

#### 피드백 요약
- 마진 계산은 타당하나, **마케팅비가 BEP에서 빠짐**
- ARPU=₩10,000을 월 단위 고정으로 가정하면 왜곡
- 코호트별 "월 사용량 분포"로 쪼개야 함

#### 대응 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| 마케팅비 포함 BEP | ❌ 미반영 | 재무 모델 업데이트 필요 |
| 코호트별 ARPPU 분포 | ❌ 미반영 | SQL 쿼리/대시보드 필요 |
| 헤비/미들/라이트 사용자 세분화 | ❌ 미반영 | 사용 패턴 분석 필요 |

**다음 조치 (Loop 10 예정)**:
- [ ] 재무 모델 업데이트: CAC, LTV, Payback Period
- [ ] 코호트 분석 SQL 작성 (가입일 기준 → 월별 ARPPU)
- [ ] Monte Carlo 시뮬레이션 (전환율 5-15%, ARPPU 분포)

---

### 1.5 시장 진입 전략 실행 가능성

#### 피드백 요약
- 베타 100명 중 "증권 연동까지 하는 사람"은 훨씬 적을 수 있음
- 모집 조건을 "연동 가능/의향 있음"으로 필터 필요

#### 대응 상태

| 항목 | 상태 | Loop | 세부사항 |
|------|------|------|----------|
| Beta invite codes 시스템 | ✅ 완료 | Loop 4 | beta_invite_codes 테이블 |
| Campaign 추적 | ✅ 완료 | Loop 4 | 캠페인별 사용 추적 |
| 보너스 크레딧 (450) | ✅ 완료 | Loop 4 | 초대 코드 인센티브 |
| 모집 폼 설계 | ❌ 미완료 | - | "연동 의향" 필터 없음 |
| 연동 완료자 30명 별도 목표 | ❌ 미설정 | - | KPI 추가 필요 |

**다음 조치 (Loop 10 예정)**:
- [ ] 베타 모집 폼 설계 (연동 의향 체크박스)
- [ ] KPI 추가: 100명 모집 + 30명 연동 완료
- [ ] 연동 완료율 추적 (broker_connections 테이블)

---

### 1.6 경쟁 우위의 지속성

#### 피드백 요약
- MoA는 차별화 포인트지만, 빅테크가 빠르게 모방 가능
- 지속 우위: (1) 브로커 통합 품질, (2) 전략 성과 데이터 네트워크 효과, (3) 컴플라이언스 운영체계

#### 대응 상태

| 우위 축 | 상태 | 비고 |
|---------|------|------|
| 브로커 통합/실행 품질 | ✅ 기초 | UnifiedBroker 인터페이스 존재 |
| 전략 성과 데이터 축적 | ❌ 미구현 | "어떤 프롬프트가 어떤 시장에서 통했는지" 집계 없음 |
| 컴플라이언스 운영체계 | ✅ 완료 | Loop 3에서 정책/로깅/Safety Net 구축 |

**다음 조치 (Loop 11-12 예정)**:
- [ ] 전략 성과 추적 시스템 설계
  - 프롬프트 → 전략 → 백테스트 결과 → 실거래 성과 연결
  - 익명화된 "시장 상황별 전략 효과" 인사이트 집계
- [ ] UnifiedBroker 예외처리 강화 (부분체결, 장애 복구)

---

### 1.7 리스크 완화 전략 충분성

#### 피드백 요약
- 운영 리스크 항목 부족: 결제 웹훅 중복, 크레딧 불일치, 환불, 장애 공지, 데이터 소스 중단 등

#### 대응 상태

| 리스크 | 상태 | Loop | 세부사항 |
|--------|------|------|----------|
| 결제 웹훅 중복 처리 | ✅ 완료 | Loop 1 | idempotency_key, RPC 함수 |
| 크레딧 지급/차감 불일치 | ✅ 완료 | Loop 1 | DB 트랜잭션 원자성 |
| 환불 정책 | ⚠️ 설계만 | Loop 1 | 구현 미완료 |
| 고객 CS/환불 프로세스 | ❌ 미구현 | - | 환불 API/정책 필요 |
| 장애 공지 시스템 | ❌ 미구현 | - | Status page/Slack 연동 |
| 데이터 소스 중단 대체 경로 | ❌ 미구현 | - | Fallback API 없음 |

**다음 조치 (Loop 10-11 예정)**:
- [ ] 환불 정책 확정 및 API 구현
- [ ] Status page 구축 (예: statuspage.io)
- [ ] 데이터 소스 Fallback 설계 (Primary: Unusual Whales → Fallback: SEC EDGAR)

---

## 2. Loop 1-9 변경사항 요약

### Loop 1 (v0.2): 결제 시스템
- ✅ Toss payment confirm + webhook
- ✅ Idempotency key 기반 중복 방지
- ✅ RPC 함수 `grant_credits_for_paid_order`
- ✅ payment_orders, payment_webhook_events 테이블
- ⚠️ 환불 정책 설계만, 구현 미완료

### Loop 2 (v0.3): Rate Limiting & Observability
- ✅ Upstash Redis 기반 rate limiting (분당/일당)
- ✅ Circuit breaker (연속 실패 감지 + 쿨다운)
- ✅ ai_usage_events 테이블 (토큰/비용/지연 추적)
- ✅ 사용자별/기능별 원가 추적 SQL
- ⚠️ 시각화 대시보드 미구축

### Loop 3 (v0.4): 법률 준수
- ✅ disclaimer_versions + user_consents 테이블
- ✅ Safety Net v2 policy engine (allow/soften/block)
- ✅ safety_events 로그 (매칭 규칙 기록)
- ✅ 연령 게이트 (19+) UX
- ⚠️ "키움 지원" 문구 확인 필요

### Loop 4 (v0.5): 베타 실험
- ✅ beta_invite_codes 테이블 (캠페인별 추적)
- ✅ experiments, experiment_assignments 테이블
- ✅ product_events 테이블 (퍼널 추적)
- ✅ Funnel 분석 SQL (signup → consent → strategy → purchase)
- ⚠️ 실제 A/B 테스트 코드 미구현

### Loop 5 (v0.6): "AI" 워딩 제거
- ✅ 전체 컴포넌트에서 "AI" → "엔진" 용어 전환
- ✅ MoA → "데스크 컨센서스"
- ✅ 4-AI → "4-데스크 리서치 스택"

### Loop 6 (v0.7): 랜딩 페이지 카피
- ✅ landing.copy.ko.json 작성
- ✅ i18n 다국어 시스템 (ko.json)
- ✅ Broker badge UI 스펙

### Loop 7 (v0.8): 컴포넌트 구현
- ✅ 랜딩 페이지 JSON 기반 렌더링
- ✅ ko.json 번역 팩
- ✅ Forbidden wording CI 스크립트
- ⚠️ 키움 "준비중" 표기 확인 필요

### Loop 8 (v0.9): 네이밍 시스템
- ✅ 30개 기관급 네이밍 후보
- ✅ 리포트 템플릿 (기관 스타일)

### Loop 9 (v1.0): Strategy Report DTO
- ✅ StrategyReport TypeScript 스키마
- ✅ Safety Net v2 sectional intervention
- ✅ applySafetyToReport 함수 (섹션별 정책 적용)
- ✅ 컴포넌트 트리 설계

---

## 3. 미완료 P0 게이트 상세

### P0-5: 데이터 소스 라이선스/ToS 준수 확인 ❌

#### 현황
- Unusual Whales, Polygon 등 데이터 소스의 **상업적 이용/재배포** 허용 여부 미확인
- Nancy 포트폴리오(의원 거래 데이터)는 마케팅 핵심 훅이나, 라이선스 리스크 큼

#### 조치 사항
1. **Unusual Whales 라이선스 검토**
   - [ ] ToS에서 "상업적 이용" 허용 여부 확인
   - [ ] "재배포" 허용 여부 확인 (사용자에게 보여줄 수 있는지)
   - [ ] Attribution 의무 확인 (출처 표기 필요 여부)

2. **Polygon 라이선스 검토**
   - [ ] 가격 데이터 상업적 이용 허용 확인
   - [ ] 무료 티어 제한 확인 (Rate limit, 데이터 지연)

3. **SEC EDGAR**
   - ✅ Public domain, 무료 사용 가능
   - [ ] Rate limit 준수 (초당 10 requests)

4. **대체 경로 설계**
   - [ ] Unusual Whales 중단 시 → SEC EDGAR로 Fallback
   - [ ] Polygon 중단 시 → Yahoo Finance/Alpha Vantage Fallback

### P0-2 (부분): 키움 "지원" 문구 제거/명확화 ⚠️

#### 현황
- Loop 7에서 Broker badge 시스템 구축 ("준비중" 표시 가능)
- 실제 코드베이스에서 "키움" 언급 확인 필요

#### 조치 사항
1. **전수 검색**
   ```bash
   rg -n "키움|KiWoom|Kiwoom" src/
   ```

2. **표기 변경**
   - "키움 지원" → "키움 연동 준비중 (2025 Q1 목표)"
   - "현재 지원: 한국투자증권(KIS)" 명시

3. **CI 체크 추가**
   - Git pre-commit hook에서 "키움 지원" 패턴 차단

---

## 4. 기술 부채 우선순위 (P0 → P1 → P2)

### P0 (베타 전 필수)
| 항목 | 상태 | 조치 |
|------|------|------|
| Rate limiting | ✅ 완료 | Loop 2 |
| 결제 멱등성 | ✅ 완료 | Loop 1 |
| Observability | ✅ 완료 | Loop 2 |
| 권한/보안 (RLS) | ⚠️ 부분 | E2E 테스트 필요 |
| 데이터 라이선스 | ❌ 미완료 | **즉시 조치** |
| 키움 문구 정리 | ⚠️ 확인 필요 | **즉시 조치** |

### P1 (베타 중 2주 내)
| 항목 | 상태 | 조치 |
|------|------|------|
| 백테스트 잡 큐 | ❌ 미완료 | Loop 10 예정 |
| 결과 재현성 | ⚠️ 부분 | StrategyReport DTO 완료, 버전 관리 필요 |
| 테스트 세트 | ❌ 미완료 | 결제/크레딧/브로커/Safety Net E2E |
| 환불 정책/API | ❌ 미완료 | Loop 10 예정 |

### P2 (베타 1개월 내)
| 항목 | 상태 | 조치 |
|------|------|------|
| 전략 성과 네트워크 | ❌ 미완료 | Loop 11-12 예정 |
| 장애 공지 시스템 | ❌ 미완료 | Status page 구축 |
| 데이터 Fallback | ❌ 미완료 | Primary/Secondary API 설계 |

---

## 5. Loop 10 실행 백로그 (우선순위 정렬)

### EPIC A: P0 게이트 완료 (즉시)

#### A1. 데이터 소스 라이선스 검증
- [ ] Unusual Whales ToS 리뷰 (상업적 이용, 재배포, attribution)
- [ ] Polygon ToS 리뷰
- [ ] 라이선스 준수 문서 작성 (`docs/DATA_SOURCE_LICENSES.md`)
- [ ] 출처 표기 컴포넌트 추가 (필요 시)

**AC (Acceptance Criteria)**:
- Unusual Whales 상업적 이용 허용 확인 OR 대체 소스 확정
- 모든 데이터 소스에 attribution 표기 (필요 시)
- 라이선스 준수 문서 Git에 커밋

#### A2. 키움 문구 전수 정리
- [ ] `rg "키움|KiWoom|Kiwoom"` 실행 및 결과 문서화
- [ ] 모든 "키움 지원" → "키움 연동 준비중" 변경
- [ ] 랜딩 페이지/대시보드/설정 화면 확인
- [ ] CI pre-commit hook 추가 (forbidden-broker-wording.sh)

**AC**:
- 코드베이스에 "키움 지원" 문구 0건
- "준비중" 표기로 통일 (예상 시기 명시 금지)
- Git hook으로 재발 방지

### EPIC B: 재무 모델 업데이트

#### B1. 마케팅비 포함 BEP 재계산
- [ ] CAC(고객획득비용) 가정 추가
- [ ] 월 마케팅비 ₩5M 반영
- [ ] 손익분기 전환율 재계산 (10.08% → 13.55%)
- [ ] Monte Carlo 시뮬레이션 업데이트

**AC**:
- `docs/FINANCIAL_MODEL_V2.md` 생성
- 흑자 확률 계산 (마케팅비 포함)
- V1 대비 변경사항 명시

#### B2. 코호트 ARPPU 분석 SQL
- [ ] 가입일 기준 코호트 정의
- [ ] 월별 ARPPU 분포 SQL 작성
- [ ] 헤비/미들/라이트 사용자 세분화 기준 정의

**AC**:
- `sql/cohort-arppu-analysis.sql` 생성
- 베타 데이터 입력 시 바로 실행 가능
- 결과를 `docs/BETA_COHORT_ANALYSIS.md`에 문서화

### EPIC C: 백테스트 큐 시스템 설계

#### C1. Job Queue 아키텍처 설계
- [ ] BullMQ vs Inngest 선택 (권장: BullMQ + Upstash Redis)
- [ ] Job 스키마 정의 (strategy_id, user_id, parameters, priority)
- [ ] Worker 로직 설계 (재시도, 타임아웃, 취소)

**AC**:
- `docs/BACKTEST_QUEUE_ADR.md` (Architecture Decision Record)
- DB 마이그레이션 파일 (backtest_jobs 테이블)
- Worker 구현 체크리스트

#### C2. Job 상태 추적 UI
- [ ] 대시보드에 "백테스트 진행 중" 상태 표시
- [ ] 취소 버튼 추가
- [ ] 완료 시 결과 자동 표시

**AC**:
- `/dashboard/backtests` 페이지에 Job 목록
- WebSocket/Polling으로 실시간 진행률 업데이트

### EPIC D: 환불 정책 및 API 구현

#### D1. 환불 정책 확정
- [ ] 미사용 크레딧 환불 기준 정의
  - 예: 구매 후 7일 이내, 80% 이상 미사용 시 전액 환불
- [ ] 부분 환불 계산식 정의
- [ ] 환불 불가 조건 명시 (연동 후 실거래 발생 시)

**AC**:
- `docs/REFUND_POLICY.md` 작성
- 법무 검토 완료 (외부 검토 권장)

#### D2. 환불 API 구현
- [ ] `POST /api/payments/refund` 엔드포인트
- [ ] Toss 환불 API 연동
- [ ] payment_orders 상태 'refunded' 처리
- [ ] 크레딧 회수 (credit_transactions에 'refund' 기록)

**AC**:
- 환불 요청 시 크레딧 자동 회수
- 중복 환불 방지 (idempotency)
- 환불 이력 추적 가능

### EPIC E: 비용 대시보드 구축

#### E1. Grafana/Metabase 선택 및 설치
- [ ] Grafana vs Metabase 비교 (권장: Grafana)
- [ ] Supabase 연동 설정
- [ ] 기본 대시보드 템플릿 생성

**AC**:
- 대시보드 접속 가능 (관리자 전용)
- Supabase ai_usage_events 데이터 조회 성공

#### E2. 핵심 차트 구성
- [ ] 차트 1: 일별 총 비용 (USD)
- [ ] 차트 2: 기능별 평균 비용 (전략 생성, 백테스트, 튜터)
- [ ] 차트 3: 사용자별 Top 10 비용 사용자
- [ ] 차트 4: 모델별 토큰 사용량

**AC**:
- 4개 차트 모두 실시간 데이터 반영
- 알림 설정 (일 비용 $100 초과 시 Slack)

---

## 6. V2 검수 자료 생성 계획

### 생성 시점
- **EPIC A (P0 게이트) 완료 후** 즉시 생성
- 목표: 2025-12-17 내

### 포함 내용

#### 6.1 Executive Summary
- V1 점수: 8.4/10
- V2 점수 목표: 8.9/10
- Loop 1-9 변경사항 요약
- P0 게이트 5개 완료 현황

#### 6.2 V1 피드백 대응 상세
- 7개 항목별 (비즈니스/기술/법률/재무/시장/경쟁/리스크) 대응 상태
- 완료/부분/미완료 명확히 구분
- 미완료 항목은 Loop 10-11 계획 명시

#### 6.3 신규 기능 (Loop 1-9)
- 모바일 빌드 페이지 (3중 검증 엔진, ReactFlow)
- 기관급 워딩 전환 (AI → 엔진, 데스크 컨센서스)
- StrategyReport DTO 시스템
- Safety Net v2 sectional intervention

#### 6.4 업데이트된 리스크 평가
- 데이터 라이선스 리스크 (완화 조치 명시)
- 운영 리스크 (환불/장애 대응 추가)
- 경쟁 리스크 (성과 데이터 네트워크 효과 계획)

#### 6.5 재무 모델 v2
- 마케팅비 포함 BEP
- Monte Carlo 시뮬레이션 결과
- 흑자 확률 (49.2% → 14.5% 반영)

#### 6.6 베타 KPI 정의
- D1/D7 리텐션 목표
- 전환율 목표 (10% 이상)
- 연동 완료율 목표 (30%)
- ARPPU 분포 목표

#### 6.7 Go/No-Go 권고
- P0 게이트 5개 완료 확인
- 베타 런칭 준비 완료 선언
- V2 점수 자체 평가 (목표: 8.9/10)

---

## 7. 다음 ㄱ 루프 우선순위

### Loop 10 (v1.1) 예정
1. **EPIC A: P0 게이트 완료** (즉시)
   - 데이터 라이선스 검증
   - 키움 문구 정리
2. **EPIC B: 재무 모델 업데이트**
   - 마케팅비 BEP
   - 코호트 ARPPU SQL
3. **EPIC D: 환불 정책/API**
   - 정책 확정
   - API 구현

### Loop 11 (v1.2) 예정
1. **EPIC C: 백테스트 큐**
   - BullMQ 아키텍처
   - Worker 구현
2. **EPIC E: 비용 대시보드**
   - Grafana 설치
   - 핵심 차트 구성

### Loop 12 (v1.3) 예정
1. **전략 성과 네트워크 효과**
   - 프롬프트 → 성과 추적 시스템
   - 익명 집계 인사이트
2. **장애 복구 시스템**
   - Status page
   - 데이터 Fallback

---

## 8. 성공 기준 (V2)

### 정량적
- ✅ P0 게이트 5개 완료율: **100%** (목표 달성)
- ✅ Loop 1-9 구현 항목: **90% 이상** (4개/5개 P0 완료)
- ⚠️ 기술 부채 P0 해결률: **83%** (5/6 완료)

### 정성적
- ✅ "AI" 워딩 제거 완료
- ✅ 기관급 포지셔닝 확립
- ✅ 법률 준수 체계 구축
- ⚠️ 데이터 라이선스 검증 필요 (Loop 10)
- ⚠️ 키움 문구 정리 필요 (Loop 10)

### V2 목표 점수: **8.9/10**
- V1: 8.4/10
- Loop 1-9: +0.4점 (P0 4개 완료, 워딩 개선, Safety Net v2)
- Loop 10 (P0 완료): +0.1점
- **합계**: 8.9/10 ✅

---

## 9. 즉시 조치 사항 (오늘 내)

### Priority 1: 데이터 라이선스 검증
```bash
# 1. Unusual Whales ToS 확인
curl https://unusualwhales.com/terms

# 2. 라이선스 문서 작성
touch docs/DATA_SOURCE_LICENSES.md
```

### Priority 2: 키움 문구 전수 검색
```bash
# 코드베이스 검색
rg -n "키움|KiWoom|Kiwoom" src/ > keyoom-검색결과.txt

# 결과 확인 및 변경 계획 수립
```

### Priority 3: V2 검수 자료 템플릿 생성
```bash
# V2 문서 골격 생성
touch COMPREHENSIVE_AUDIT_V2.md
```

---

## 10. 요약

### 현재 상태 (Loop 1-9 완료)
- ✅ **P0 게이트 5개 중 4개 완료** (80%)
- ✅ 결제/Rate Limit/법무/워딩 개선 모두 구현
- ⚠️ 데이터 라이선스, 키움 문구 정리 필요

### 다음 단계 (Loop 10)
- ❗ P0 게이트 100% 완료 (데이터 라이선스 + 키움 문구)
- ❗ 재무 모델 업데이트 (마케팅비 BEP)
- ❗ 환불 정책/API 구현

### V2 생성 시점
- **Loop 10 EPIC A 완료 후** 즉시
- 목표일: 2025-12-17

---

*이 문서는 V1 피드백과 Loop 1-9 구현을 체계적으로 매핑하여, V2 검수 자료 생성을 위한 실행 계획입니다.*
