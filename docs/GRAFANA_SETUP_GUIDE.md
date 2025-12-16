# Grafana Cost Dashboard 설치 가이드

> **Loop 11: Observability**
> **목적**: AI 비용 실시간 모니터링 및 알림

---

## 📊 대시보드 개요

**HEPHAITOS AI Cost Dashboard**는 다음 지표를 실시간으로 추적합니다:

| 패널 | 설명 | 임계값 |
|------|------|--------|
| 월 전체 AI 비용 | 현재 월 누적 비용 | ₩500,000 초과 시 알림 |
| 기능별 평균 원가 | 전략 생성, 백테스트 등 기능별 원가 | - |
| 시간별 비용 추이 | 24시간 비용 추이 | 1시간 ₩50,000 초과 시 알림 |
| 모델별 성능 비교 | Claude, GPT, Gemini 비교 | - |
| 원가/수익 마진 | 기능별 마진율 | 마진 0% 미만 시 적자 |
| 사용자별 월 비용 | Top 10 비용 발생 사용자 | 사용자당 ₩500 초과 시 알림 |

---

## 🚀 설치 방법

### 1. Grafana Cloud 설정

```bash
# Grafana Cloud 계정 생성
# https://grafana.com/products/cloud/

# Supabase 데이터 소스 추가
# Settings > Data sources > Add data source > PostgreSQL
```

**PostgreSQL Connection Settings**:
```
Host: db.your-project.supabase.co:5432
Database: postgres
User: postgres
Password: [SUPABASE_DB_PASSWORD]
SSL Mode: require
```

### 2. 대시보드 Import

```bash
# 1. Grafana 대시보드로 이동
# Dashboards > Import

# 2. grafana/cost-dashboard.json 내용 붙여넣기

# 3. Data source 선택: Supabase PostgreSQL

# 4. Import 클릭
```

### 3. 알림 설정 (Slack/Email)

```bash
# Alerting > Contact points > Add contact point

# Slack Webhook URL 입력:
# https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Email 설정:
# To: team@hephaitos.io
# Subject: [HEPHAITOS] AI Cost Alert
```

**알림 규칙 추가**:

```yaml
# 월 전체 비용 ₩500,000 초과
Alert name: Monthly Cost Exceeded
Condition: sum(cost_estimate_krw) > 500000
Frequency: Every 1 hour
Contact point: Slack + Email

# 사용자별 ₩500 초과
Alert name: User Cost Exceeded
Condition: user total_cost > 500
Frequency: Every 1 hour
Contact point: Slack

# 시간당 ₩50,000 초과 (비정상 급증)
Alert name: Hourly Cost Spike
Condition: hourly_cost > 50000
Frequency: Every 5 minutes
Contact point: Slack + Email (긴급)
```

---

## 📈 주요 SQL 쿼리

### 기능별 원가 요약
```sql
SELECT * FROM feature_cost_summary;
```

### 실시간 비용 모니터링 (최근 24시간)
```sql
SELECT * FROM realtime_cost_monitor;
```

### 모델별 성능 비교
```sql
SELECT * FROM model_performance_comparison;
```

### 비용 알림 확인
```sql
SELECT * FROM check_cost_threshold(500000);
```

---

## 🎯 목표 KPI

| 지표 | 목표 | 현재 | 상태 |
|------|------|------|------|
| 전략 생성 원가 | ₩100 이하 | - | 베타 측정 중 |
| 백테스트 원가 | ₩50 이하 | - | 베타 측정 중 |
| MoA 실패율 | 5% 이하 | - | 베타 측정 중 |
| 월 전체 비용 | ₩500,000 이하 | - | 베타 측정 중 |

---

## 🔔 알림 예시

**Slack 알림 예시**:
```
[HEPHAITOS] AI Cost Alert 🚨

월 전체 비용이 ₩500,000를 초과했습니다.
현재: ₩523,450

기능별 비용:
- 전략 생성: ₩320,000 (61%)
- 백테스트: ₩150,000 (29%)
- AI 튜터: ₩53,450 (10%)

Dashboard: https://grafana.com/d/hephaitos-cost
```

---

## 📝 운영 가이드

### 일일 체크리스트
- [ ] 월 누적 비용 확인 (₩500,000 이하 유지)
- [ ] 기능별 원가 추이 확인 (전략 생성 ₩100 이하)
- [ ] MoA 실패율 확인 (5% 이하)

### 주간 체크리스트
- [ ] 모델별 성능 비교 (최적 모델 선택)
- [ ] 사용자별 비용 Top 10 검토
- [ ] 마진율 개선 방안 논의

### 월간 체크리스트
- [ ] 전월 대비 비용 변화 분석
- [ ] 가격 정책 업데이트 (크레딧 가격/기능별 크레딧)
- [ ] 모델 환율 업데이트 (USD/KRW)

---

*문서 생성일: 2025-12-16*
*Loop 11: Observability 완료*
