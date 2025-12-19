---
name: cmentech-b2b-automation
description: 씨엠엔텍 B2B 견적/워크플로우 자동화. 부대표 설득 시나리오, 견적 생성, ROI 분석 작업 시 사용.
allowed-tools: Read, Write, Edit, Bash, WebSearch, WebFetch
---

# 씨엠엔텍 B2B 자동화 스킬

## 사용 시점
- 씨엠엔텍 관련 문서 작성 시
- 부대표 설득 시나리오 시뮬레이션 시
- B2B 견적 자동화 기능 개발 시
- 현장-본사-정부 워크플로우 구현 시

## 핵심 개념

### Copy-Learn-Build → Adopt-Adapt-Automate
```
HEPHAITOS           →    HEPHAITOS I/O (B2B)
COPY (따라하기)     →    ADOPT (표준 도입)
LEARN (배우기)      →    ADAPT (맞춤 최적화)
BUILD (만들기)      →    AUTOMATE (완전 자동화)
```

### 권장 시나리오 (A2-B2-C2-D1)
- A2: 견적 + 기술문서 자동화
- B2: AI 바우처 + 스마트공장 정책 연계
- C2: 6개월 단계적 도입
- D1: 공공시장 집중

## 핵심 파일 참조

문서:
  - docs/CMENTECH_EXECUTIVE_PITCH.md
  - CMenTech_HEPHAITOS_IO_SCENARIO_ANALYSIS.md
  - CMENTECH_AI_SIMULATION.md
  - CMENTECH_WORKFLOW_SIMULATION.md

기술:
  - src/lib/broker/unified-broker-v2.ts
  - packages/core/src/

## ROI 계산

투자회수기간 = 총 비용 / 연간 절감액

예시:
- 총 비용: 3,600만원 (3년)
- 정부 지원: -2,880만원 (80%)
- 실질 부담: 720만원
- 연간 절감: 1.1억원
- 투자회수: 8.5개월
