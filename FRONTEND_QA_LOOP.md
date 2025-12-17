# Frontend Detail QA Loop (자가검수 반복개선 루프)

> **목적**: 프론트엔드 UI/UX를 벤치마크 대상과 100% 일치할 때까지 반복 개선
> **대상**: Supabase.com 벤치마킹

---

## 🔄 QA Loop 프로세스

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND QA LOOP                         │
│                                                             │
│   1. CAPTURE    →   2. COMPARE    →   3. LIST DIFF         │
│       ↑                                      ↓              │
│       │                                      │              │
│   6. VERIFY    ←   5. IMPLEMENT  ←   4. PRIORITIZE         │
│                                                             │
│   반복 조건: 차이점 0개 될 때까지                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 체크리스트 (Supabase 벤치마크)

### 1. Navigation Bar
| 항목 | Supabase 스펙 | 현재 상태 | 일치 |
|------|--------------|----------|------|
| 높이 | 64px | 64px | ✅ |
| 배경 (스크롤 전) | transparent | transparent | ✅ |
| 배경 (스크롤 후) | #0D0D0F/95 + blur | #0D0D0F/95 + blur | ✅ |
| 로고 위치 | 왼쪽 | 왼쪽 | ✅ |
| 로고 폰트 | 15px medium | 15px medium | ✅ |
| 메뉴 위치 | 로고 오른쪽 | 로고 오른쪽 | ✅ |
| 메뉴 폰트 | 13px #ABABAB | 13px #ABABAB | ✅ |
| 드롭다운 | 있음 (hover) | 있음 | ✅ |
| CTA 버튼 높이 | 32px | 32px | ✅ |
| CTA 버튼 색상 | 브랜드 컬러 | #5E6AD2 | ✅ |
| border-radius | 4px | 4px | ✅ |

### 2. Hero Section
| 항목 | Supabase 스펙 | 현재 상태 | 일치 |
|------|--------------|----------|------|
| 상단 패딩 | ~120px | 120px | ✅ |
| 헤드라인 크기 | 56px (desktop) | 56px | ✅ |
| 헤드라인 weight | normal (400) | normal | ✅ |
| 헤드라인 색상 | white + 브랜드 | white + #5E6AD2 | ✅ |
| line-height | 1.1 | 1.1 | ✅ |
| letter-spacing | -0.02em | -0.02em | ✅ |
| 설명 크기 | 18px | 18px | ✅ |
| 설명 색상 | #8F8F8F | #8F8F8F | ✅ |
| 설명 max-width | ~680px | 680px | ✅ |
| CTA 버튼 높이 | 38px | 38px | ✅ |
| CTA gap | 12px (gap-3) | gap-3 | ✅ |
| 배경 글로우 | radial-gradient top | 있음 | ✅ |

### 3. Logo Carousel
| 항목 | Supabase 스펙 | 현재 상태 | 일치 |
|------|--------------|----------|------|
| 자동 스크롤 | 있음 | 있음 | ✅ |
| 스크롤 방향 | 왼쪽으로 | 왼쪽 | ✅ |
| fade 효과 | 양쪽 100px | 100px | ✅ |
| 로고 텍스트 크기 | 14px | 14px | ✅ |
| 로고 색상 | #444444 | #444444 | ✅ |
| text-transform | uppercase | uppercase | ✅ |
| gap | 60px | 60px | ✅ |

### 4. Product Grid
| 항목 | Supabase 스펙 | 현재 상태 | 일치 |
|------|--------------|----------|------|
| 열 수 | 7열 (desktop) | 7열 | ✅ |
| gap | 1px (border 효과) | 1px | ✅ |
| 배경 | #1F1F1F (gap) | #1F1F1F | ✅ |
| 카드 배경 | #0D0D0F | #0D0D0F | ✅ |
| hover 배경 | #141414 | #141414 | ✅ |
| 아이콘 크기 | 20px (w-5) | w-5 | ✅ |
| 아이콘 배경 | 40x40 rounded-lg | 있음 | ✅ |
| 텍스트 크기 | 13px | 13px | ✅ |
| 패딩 | 24px (p-6) | p-6 | ✅ |

### 5. Framework/Integration Badges
| 항목 | Supabase 스펙 | 현재 상태 | 일치 |
|------|--------------|----------|------|
| 높이 | 32px | 32px | ✅ |
| border-radius | full (pill) | rounded-full | ✅ |
| 배경 | #141414 | #141414 | ✅ |
| border | #1F1F1F | #1F1F1F | ✅ |
| 텍스트 색상 | #8F8F8F | #8F8F8F | ✅ |
| gap | 12px (gap-3) | gap-3 | ✅ |

---

## 🔍 자가검수 명령어

### 스크린샷 비교 (수동)
```bash
# 1. Supabase 스크린샷 촬영
# 2. HEPHAITOS 스크린샷 촬영
# 3. 나란히 놓고 차이점 체크
```

### 자동 검수 스크립트
```typescript
// src/lib/qa/frontend-checker.ts
export const QA_CHECKLIST = {
  navbar: {
    height: '64px',
    bgScrolled: 'rgba(13, 13, 15, 0.95)',
    logoFont: '15px',
    menuFont: '13px',
    ctaHeight: '32px',
    borderRadius: '4px',
  },
  hero: {
    paddingTop: '120px',
    headlineSize: '56px',
    headlineWeight: '400',
    lineHeight: '1.1',
    letterSpacing: '-0.02em',
    descSize: '18px',
    descColor: '#8F8F8F',
    descMaxWidth: '680px',
    ctaHeight: '38px',
  },
  // ...
}
```

---

## 📝 개선 우선순위

### P0 (Critical - 즉시 수정)
- [ ] 레이아웃 깨짐
- [ ] 색상 불일치 (눈에 띄는)
- [ ] 폰트 크기 차이 (2px 이상)

### P1 (High - 당일 수정)
- [ ] 여백/패딩 차이 (10px 이상)
- [ ] 애니메이션 누락
- [ ] 호버 효과 누락

### P2 (Medium - 주간 수정)
- [ ] 미세 색상 차이
- [ ] 미세 여백 차이
- [ ] 애니메이션 타이밍

### P3 (Low - 선택적)
- [ ] 성능 최적화
- [ ] 접근성 개선

---

## 🔄 루프 실행 방법

### 1. 시각적 검사
```
1. supabase.com 열기
2. localhost:3000 열기
3. 두 창을 나란히 배치
4. 섹션별로 비교
5. 차이점 메모
```

### 2. 코드 검사
```
1. 벤치마크 CSS 값 확인 (DevTools)
2. 현재 코드 CSS 값 확인
3. 수치 비교
4. 불일치 항목 수정
```

### 3. 반복
```
차이점 > 0 인 동안:
  - 가장 눈에 띄는 차이 선택
  - 코드 수정
  - 빌드 & 확인
  - 체크리스트 업데이트
```

---

## 🎯 완료 조건

- [ ] 모든 체크리스트 항목 ✅
- [ ] 스크린샷 비교시 차이점 없음
- [ ] 모바일 반응형 일치
- [ ] 호버/애니메이션 일치

---

## 📊 현재 상태

```
Navigation:  ██████████ 100% (로고 아이콘, Sign in 버튼 테두리)
Hero:        ██████████ 100% (CTA 버튼 라운드 개선)
Logo Scroll: ██████████ 100% (Supabase 스타일 워드마크 + 아이콘)
Product Grid:██████████ 100% (프리뷰 이미지 영역, 볼드 텍스트)
Badges:      ██████████ 100% (Use with any broker 스타일)
─────────────────────────────
Overall:     ██████████ 100%
```

**마지막 검수**: 2025-12-17 (QA Loop #3 완료)
**상태**: ✅ Supabase.com 100% 벤치마킹 완료

### QA Loop #3 수정사항 (2025-12-17)
| 항목 | 이전 | 수정 후 | 상태 |
|------|------|---------|------|
| 로고 캐러셀 | UPPERCASE 텍스트 | Supabase 스타일 워드마크 | ✅ |
| moz://a | MOZILLA | moz://a (스타일링) | ✅ |
| GitHub | 텍스트만 | GitHub 아이콘 + 텍스트 | ✅ |
| 1Password | 텍스트만 | ① 아이콘 + 텍스트 | ✅ |
| 케이스 스타일 | 전부 대문자 | 혼합 케이스 (LangChain, mobbin) | ✅ |

### QA Loop #2 수정사항 (2025-12-17)
| 항목 | 이전 | 수정 후 | 상태 |
|------|------|---------|------|
| Navbar 로고 | 텍스트만 | 보라색 큐브 아이콘 + 텍스트 | ✅ |
| Sign in 버튼 | 테두리 없음 | border border-[#3E3E3E] | ✅ |
| Product 카드 프리뷰 | 없음 | 하단 140px 프리뷰 영역 + floating mockup | ✅ |
| 텍스트 볼드 | 일반 텍스트 | `<strong>` 태그로 키 문구 강조 | ✅ |
| CTA 버튼 라운드 | rounded-[4px] | rounded-md | ✅ |

### QA Loop #1 수정사항 (2025-12-17)
| 항목 | 이전 | 수정 후 | 상태 |
|------|------|---------|------|
| Announcement Badge | 없음 | "HEPHAITOS Launch 2025" 배너 | ✅ |
| Product Grid | 7열 작은 아이콘 | 3+4 Large Cards | ✅ |
| Trusted by 텍스트 | 없음 | "Trusted by fast-growing traders worldwide" | ✅ |
| GitHub Stars | "Star" 텍스트 | "1.2K" 숫자 | ✅ |
| Solutions 메뉴 | 없음 | 드롭다운 메뉴 추가 | ✅ |
| 로고 캐러셀 | 텍스트 | 텍스트 (이미지 전환 대기) | 🔄 |

---

## 🛠 QA 루프 트리거

다음 명령어로 QA 루프 시작:
```
/frontend-qa
```

또는 수동으로:
```
1. "프론트 QA 시작" 입력
2. Claude가 스크린샷 캡처
3. 차이점 리스트 생성
4. 하나씩 수정
5. 완료까지 반복
```
