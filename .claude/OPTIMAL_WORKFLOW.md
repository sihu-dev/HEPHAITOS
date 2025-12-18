# HEPHAITOS 최적 개발 워크플로우 (Claude Code)

> **커뮤니티 베스트 프랙티스 + HEPHAITOS 맞춤형**
> **작성일**: 2025-12-18

---

## 🎯 핵심 원칙

### 1. **Planning-First Workflow** (Anthropic 공식 권장)
```
❌ "트레이딩 전략 추가해줘" → 즉시 코딩 → 타입 오류 → 수정 반복
✅ "관련 파일을 먼저 읽고 계획을 세워줘" → 계획 승인 → 단계별 구현
```

### 2. **Spec-Driven Development** (HackerNews 커뮤니티)
```
12단계 스펙 2시간 작성 → Claude가 6-10시간 절약
```

### 3. **Small Diffs + Tests** (Reddit 커뮤니티)
```
큰 변경 한 번에 X → 작은 변경 + 테스트 반복 O
```

### 4. **Context Management** (이미 완벽하게 구축됨!)
```
✅ CLAUDE.md (루트)
✅ src/components/CLAUDE.md (컴포넌트 전용)
✅ src/lib/backtest/CLAUDE.md (백테스팅 전용)
✅ src/app/api/CLAUDE.md (API 전용)
```

---

## 🚀 시나리오별 최적 워크플로우

### **시나리오 1: 새 기능 추가** (예: AI 멘토 코칭)

```bash
# Step 1: Spec 작성 (Planning-First) ⏱️ 30분
/spec AI 멘토 코칭 시스템

# Claude가 자동으로:
# 1. 관련 파일 읽기 (src/lib/coaching/, src/app/api/ai/)
# 2. 유사 기능 분석 (AI 리포트, 튜터링)
# 3. 12단계 스펙 작성
# 4. 검토 요청 → 승인 대기

# Step 2: Spec 기반 구현 ⏱️ 2시간
/spec implement AI 멘토 코칭

# Claude가 Step by Step:
# ✓ Step 1: DB 스키마 (coaching_sessions)
# ✓ Step 2: API 엔드포인트 (POST /api/coaching)
# ✓ Step 3: AI 프롬프트 설계
# ✓ Step 4: 프론트엔드 컴포넌트
# ✓ Step 5: 테스트 작성
# ✓ Step 6: 법률 준수 검증

# Step 3: 품질 검증 ⏱️ 10분
/type-check --fix     # 타입 오류 자동 수정
/test-fix            # 테스트 수정
/legal               # 법률 준수 검증

# Step 4: 배포 전 최종 검증 ⏱️ 5분
/deploy-check

# 총 소요 시간: ~3시간
# 커뮤니티 방식 없이: ~8-12시간 (추정)
```

### **시나리오 2: 버그 수정** (예: 백테스팅 성능 이슈)

```bash
# Step 1: 문제 진단 (Extended Thinking)
"백테스팅이 느려. think harder"

# Claude가 깊게 분석:
# - src/lib/backtest/engine.ts 읽기
# - 병목 지점 파악 (동기식 루프, 캐싱 미사용)
# - 해결 방안 3가지 제시

# Step 2: Checkpoint 생성 (안전장치)
/checkpoint "백테스팅 최적화 전"

# Step 3: 단계별 수정
"첫 번째 방안부터 적용해줘 (Worker Thread)"

# ✓ Worker Thread 구현
# ✓ 테스트 실행 → 2배 빨라짐

# Step 4: 추가 최적화
"두 번째 방안 적용 (Redis 캐싱)"

# ✓ Redis 캐싱 추가
# ✓ 테스트 실행 → 5배 빨라짐

# Step 5: 문제 발생 시 되돌리기
/rewind  # 마지막 체크포인트로 복귀

# 총 소요 시간: ~1시간
# 수동 디버깅: ~4-6시간
```

### **시나리오 3: 리팩토링** (예: UnifiedBroker 구조 개선)

```bash
# Step 1: 전문 Agent 활용
"@trading-architect UnifiedBroker를 개선하고 싶어.
현재 구조를 분석하고 개선안을 제시해줘"

# trading-architect agent가:
# - src/lib/broker/ 폴더 분석
# - 현재 문제점 파악 (타입 안전성, 에러 핸들링)
# - 개선안 3가지 제시 (Adapter 패턴, Factory 패턴 등)

# Step 2: Spec 작성
/spec UnifiedBroker 리팩토링

# Step 3: Checkpoint + 단계별 리팩토링
/checkpoint "리팩토링 전"

# 인터페이스 먼저 수정
"인터페이스부터 개선해줘 (타입 안전성 강화)"
# ✓ IUnifiedBroker 인터페이스 업데이트
# ✓ 테스트 실행

# 구현체 순차 업데이트
"KISBroker 구현체 업데이트"
# ✓ KISBroker 수정
# ✓ 테스트 실행

"Alpaca 구현체 업데이트"
# ✓ AlpacaBroker 수정
# ✓ 테스트 실행

# Step 4: 통합 테스트
/test-fix

# 총 소요 시간: ~2-3시간
# 수동 리팩토링: ~1-2일
```

### **시나리오 4: 타입 오류 대량 수정** (방금 했던 작업!)

```bash
# 이전 방식: 수동으로 88개 파일 확인 및 수정 ⏱️ 4-6시간

# Claude Code 방식:
/type-check --fix  ⏱️ 15분

# Claude가 자동으로:
# ✓ npx tsc --noEmit 실행
# ✓ 88개 오류 파악
# ✓ 패턴 인식 (Promise 타입 불일치)
# ✓ 일괄 수정 적용
# ✓ 재검증
```

---

## 📊 생산성 비교

| 작업 | 수동 | Claude Code | 절감 |
|------|------|-------------|------|
| 새 기능 추가 | 8-12시간 | 3시간 | **70%** ⬇️ |
| 버그 수정 | 4-6시간 | 1시간 | **80%** ⬇️ |
| 리팩토링 | 1-2일 | 2-3시간 | **85%** ⬇️ |
| 타입 오류 88개 | 4-6시간 | 15분 | **95%** ⬇️ |

---

## 🔥 커스텀 명령어 활용

### 개발 단계별 명령어

```bash
# 1. 기획 단계
/spec [기능명]              # Spec 작성

# 2. 구현 단계
/spec implement [기능명]    # Spec 기반 구현
/strategy [자연어]          # AI 전략 생성
/broker [증권사]            # 브로커 API 테스트

# 3. 품질 검증
/type-check --fix           # 타입 오류 수정
/test-fix                   # 테스트 수정
/legal                      # 법률 준수 체크

# 4. 배포 전
/build                      # 빌드 + 타입 체크
/deploy-check               # 최종 검증

# 5. 백테스팅
/backtest [전략ID]          # 백테스팅 실행
```

---

## 🎓 커뮤니티 베스트 프랙티스 적용

### 1. **Extended Thinking** (Anthropic)
```bash
"think"         # 기본 사고
"think hard"    # 더 깊은 사고
"think harder"  # 가장 깊은 사고 (복잡한 아키텍처 설계 시)
"ultrathink"    # 최대 사고 (드물게 사용)
```

### 2. **Context Tightness** (Reddit)
```bash
/clear often    # 컨텍스트 주기적으로 초기화
             # 파일 많이 읽었을 때
             # 주제 전환할 때
```

### 3. **Small Diffs** (HackerNews)
```
❌ 한 번에 10개 파일 수정
✅ 1개 파일 수정 → 테스트 → 다음 파일
```

### 4. **Checkpoints** (Skywork AI Blog)
```bash
/checkpoint "주요 기능 완성"
# ... 작업 ...
/rewind  # 문제 발생 시 되돌리기
```

---

## 💡 HEPHAITOS 프로젝트 특화 팁

### 1. **법률 준수 자동화**
모든 트레이딩 관련 작업 후:
```bash
/legal
```

### 2. **증권사 연동 테스트**
```bash
/broker KIS      # 한국투자증권
/broker Alpaca   # 미국 주식
```

### 3. **AI 전략 생성 + 백테스팅**
```bash
/strategy 이동평균선 골든크로스
# → 자동으로 전략 생성 + 백테스팅 + 리포트
```

### 4. **성능 최적화**
```bash
"백테스팅 성능을 개선하고 싶어. think harder"
# → Worker Thread, Redis 캐싱, 배치 처리 제안
```

---

## 🚨 주의사항

### 절대 하지 말 것
❌ Claude에게 "모든 것을 한 번에" 요청
❌ 계획 없이 바로 코딩 요청
❌ 타입 안전성 무시 (any 사용)
❌ 법률 준수 생략

### 항상 할 것
✅ Planning-First (파일 읽기 → 계획 → 구현)
✅ Spec-Driven (복잡한 기능은 스펙 먼저)
✅ Small Diffs (작은 단위로 수정 + 테스트)
✅ Legal Check (트레이딩 관련 기능은 /legal)

---

## 📚 참고 자료

### Anthropic 공식
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

### 커뮤니티
- [HackerNews Discussion](https://news.ycombinator.com/item?id=43735550)
- [GitHub: claudecode-best-practices](https://github.com/rosmur/claudecode-best-practices)
- [GitHub: awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
- [Skywork AI Blog: 2025 Workflow](https://skywork.ai/blog/claude-code-2-0-best-practices-ai-coding-workflow-2025/)

---

**마지막 업데이트**: 2025-12-18
**버전**: 1.0
**프로젝트**: HEPHAITOS (Replit for Trading)
