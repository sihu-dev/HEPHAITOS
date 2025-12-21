# HEPHAITOS 프로젝트 Claude Code 가이드

> **Progressive Disclosure 패턴 적용**
> **마지막 업데이트**: 2025-12-21

---

## 🎯 핵심 각인

```
┌─────────────────────────────────────────────────────────────────┐
│  HEPHAITOS = "Replit for Trading"                               │
│                                                                 │
│  코딩 없이 자연어로 AI 트레이딩 봇을 만드는 플랫폼               │
│                                                                 │
│  COPY  → LEARN → BUILD                                          │
│  (따라하기)  (배우기)  (만들기)                                    │
│                                                                 │
│  최종 목표: 스스로 자동매매하는 나만의 AI Agent 빌드             │
│                                                                 │
│  ❌ 투자 조언 절대 금지                                          │
│  ✅ 교육 + 도구만 제공                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📚 참조 문서 (Progressive Disclosure)

**핵심 규칙**:
- @.claude/memory/core-rules.md - CRITICAL 준수 사항
- @.claude/memory/architecture.md - 나노팩터 아키텍처
- @.claude/memory/tech-stack.md - 기술 스택
- @.claude/memory/patterns.md - 코드 패턴

**사업 문서**:
- @BUSINESS_CONSTITUTION.md - 사업 헌법 (불변 원칙)
- @BUSINESS_OVERVIEW.md - 투자자용 사업 설명서
- @DESIGN_SYSTEM.md - UI/UX 규칙

**기술 문서**:
- @docs/HEPHAITOS_CORE_REFERENCES.md - API 레퍼런스
- @docs/HEPHAITOS_DEEP_ANALYSIS_REPORT.md - 코드 분석

**작업 관리**:
- @TASKS.md - 지능형 작업 관리 ('ㄱ' 루프)

---

## 🚀 개발 워크플로우

### 1. Planning-First (필수)
```bash
# 관련 파일 먼저 읽기
@src/components/dashboard/TradingChart.tsx

# 계획 수립 → 승인 → 구현
/spec [기능명]
/implement [기능]
```

### 2. 자동 검증
PostToolUse Hooks 자동 실행:
- ✅ Prettier 포맷팅
- ✅ 법률 준수 체크
- ✅ 타입 체크

### 3. 작업 완료
```bash
git add .
git commit -m "feat: ..."
git push
```

---

## 🤖 Intelligent Loop

### 'ㄱ' 루프
```bash
ㄱ          # 다음 작업 자동 진행
ㄱㄱ        # 2개 작업 병렬
ㄱ?         # 상태 미리보기
```

### Sub-agents (자동 트리거)
- **opus-auditor**: "검수", "리뷰", "audit" 입력 시
- **type-checker**: "타입", "type", "TypeScript" 입력 시

---

## ⚠️ 중요 주의사항

**CRITICAL - 매 응답마다 체크**:
1. ❌ 투자 조언 표현 사용 금지
2. ❌ `any` 타입 사용 금지
3. ✅ 면책조항 포함
4. ✅ Planning-First

**상세 규칙**: @.claude/memory/core-rules.md

---

*이 파일은 Progressive Disclosure 패턴으로 50줄 이하 유지*
*상세 내용은 .claude/memory/ 참조*
