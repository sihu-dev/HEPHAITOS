# 🎨 HEPHAITOS UX/UI 나노단위 검수 프레임워크 (50시간)

**검수 기간**: 50시간 (약 6일, 하루 8시간 기준)
**검수 수준**: 나노단위 (픽셀, 애니메이션, 인터랙션, 접근성)
**목표**: Production-Ready 품질 달성

---

## 📊 50시간 배분 계획

### Phase 1: 준비 및 자동화 (5시간)
- **1시간**: 검수 환경 설정 (도구, 브라우저, 디바이스)
- **2시간**: 자동화 도구 설정 (Lighthouse, axe, Percy)
- **1시간**: 디자인 시스템 검증 준비
- **1시간**: 베이스라인 스크린샷 생성

### Phase 2: 페이지별 상세 검수 (30시간)
| 페이지 그룹 | 시간 | 페이지 수 | 우선순위 |
|-------------|------|-----------|----------|
| **Landing & Auth** | 3시간 | 3개 | P0 |
| **Dashboard** | 8시간 | 7개 | P0 |
| **Strategy Builder** | 5시간 | 3개 | P0 |
| **Backtest & Results** | 4시간 | 2개 | P0 |
| **Leaderboard** | 3시간 | 2개 | P1 |
| **Admin Dashboard** | 4시간 | 2개 | P1 |
| **Settings & Profile** | 3시간 | 3개 | P2 |

### Phase 3: 크로스 페이지 검증 (10시간)
- **2시간**: 일관성 검증 (색상, 타이포그래피, 간격)
- **2시간**: Navigation & Flow 검증
- **2시간**: 반응형 디자인 검증 (5 breakpoints)
- **2시간**: 애니메이션 & 트랜지션 검증
- **2시간**: 접근성 검증 (WCAG 2.1 AA)

### Phase 4: 성능 및 최종 검증 (5시간)
- **2시간**: Core Web Vitals 최적화
- **1시간**: 이미지 & 폰트 최적화
- **1시간**: 크로스 브라우저 테스트
- **1시간**: 최종 리포트 작성

---

## 🎯 검수 대상 페이지 (전체 22개)

### P0: Critical (11개) - 20시간
1. **`/`** - Landing Page
2. **`/auth/login`** - 로그인
3. **`/auth/signup`** - 회원가입
4. **`/dashboard`** - 메인 대시보드
5. **`/dashboard/portfolio`** - 포트폴리오
6. **`/dashboard/strategy-builder`** - 전략 빌더
7. **`/dashboard/backtest`** - 백테스트
8. **`/dashboard/strategies`** - 전략 목록
9. **`/strategies/leaderboard`** - 리더보드
10. **`/backtest/results/[id]`** - 백테스트 결과
11. **`/dashboard/mirroring`** - 셀럽 미러링

### P1: High (6개) - 10시간
12. **`/admin/cs`** - Admin CS Dashboard
13. **`/dashboard/coaching`** - AI 코칭
14. **`/dashboard/copy-trading`** - 카피 트레이딩
15. **`/dashboard/history`** - 거래 내역
16. **`/dashboard/settings`** - 설정
17. **`/dashboard/settings/billing`** - 결제 관리

### P2: Medium (5개) - 5시간
18. **`/dashboard/ai-strategy`** - AI 전략 생성
19. **`/dashboard/compare`** - 전략 비교
20. **`/strategies/new`** - 새 전략 생성
21. **`/onboarding`** - 온보딩
22. **`/docs`** - 문서

---

## 📋 나노단위 검수 체크리스트 (각 페이지당)

### 1. Visual Design (30분)

#### 1.1 Color System (10분)
- [ ] **Primary Color** (#5E6AD2) 정확히 사용
- [ ] **Background** (#0D0D0F) 일관성
- [ ] **Glass Morphism** rgba(255,255,255,0.03) 정확
- [ ] **Border** rgba(255,255,255,0.06) 일관성
- [ ] **Profit** (#22C55E) / **Loss** (#EF4444) 명확
- [ ] Contrast Ratio 4.5:1 이상 (WCAG AA)

#### 1.2 Typography (10분)
- [ ] Font Family: Inter (Fallback: system-ui)
- [ ] Heading 크기: 3xl(30px) / 2xl(24px) / xl(20px)
- [ ] Body 크기: base(16px) / sm(14px) / xs(12px)
- [ ] Line Height: 1.5 (본문) / 1.2 (제목)
- [ ] Letter Spacing: 일관성
- [ ] Font Weight: 정확 (400/500/600/700)
- [ ] 텍스트 정렬 일관성
- [ ] 줄임표(...) 처리 정확

#### 1.3 Spacing & Layout (10분)
- [ ] **8px Grid System** 준수
- [ ] 컴포넌트 간 간격 일관성 (16px/24px/32px)
- [ ] Padding: 일관성 (4/8/12/16/20/24px)
- [ ] Margin: 중복 없음, 일관성
- [ ] Container Max Width: 일관성
- [ ] Grid/Flexbox 정렬 정확
- [ ] Responsive Breakpoints 정확
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
  - 2xl: 1536px

### 2. Interactive Elements (20분)

#### 2.1 Buttons (5분)
- [ ] Hover 상태: 명확한 피드백
- [ ] Active 상태: 누름 효과
- [ ] Disabled 상태: 시각적 구분
- [ ] Focus 상태: Outline 표시
- [ ] Loading 상태: Spinner 또는 텍스트
- [ ] 크기 일관성 (sm/md/lg)
- [ ] 아이콘 + 텍스트 간격
- [ ] Ripple 효과 (선택 사항)

#### 2.2 Forms & Inputs (10분)
- [ ] Input Border: 기본/Focus/Error 상태
- [ ] Placeholder 색상: text-white/40
- [ ] Label 위치: 일관성
- [ ] Error Message: 빨간색, 명확
- [ ] Success Feedback: 초록색
- [ ] Autofocus 적절
- [ ] Tab Navigation 순서
- [ ] Autocomplete 속성
- [ ] Input Type 정확 (email/tel/number)
- [ ] Character Counter (필요 시)

#### 2.3 Cards & Containers (5분)
- [ ] Glass Morphism 효과 정확
- [ ] Border Radius: 일관성 (8px/12px/16px)
- [ ] Shadow: 일관성
- [ ] Hover 효과: 부드러운 상승
- [ ] Active 상태: 명확
- [ ] Overflow 처리

### 3. Animation & Transitions (15분)

#### 3.1 Page Transitions (5분)
- [ ] Fade In/Out: 300ms
- [ ] Slide: 적절한 방향
- [ ] Loading Skeleton: 부드러움
- [ ] Route Change: 부드러움

#### 3.2 Micro-interactions (10분)
- [ ] Button Click: 즉각 반응
- [ ] Checkbox/Radio: 체크 애니메이션
- [ ] Toggle Switch: 부드러운 전환
- [ ] Dropdown: 펼쳐지는 효과
- [ ] Modal: Fade + Scale
- [ ] Toast: Slide In
- [ ] Tooltip: Fade In (200ms)
- [ ] Progress Bar: 부드러운 증가
- [ ] Chart Animation: 데이터 로드 시
- [ ] Skeleton Loading: 펄스 효과

### 4. Content & Copy (10분)

#### 4.1 Text Content (5분)
- [ ] 맞춤법 검사
- [ ] 문장 부호 일관성
- [ ] 줄임말 통일 (예: AI vs. A.I.)
- [ ] 톤앤매너 일관성 (존댓말/반말)
- [ ] CTA 명확성
- [ ] 법률 면책조항 포함 (트레이딩 페이지)

#### 4.2 Numbers & Data (5분)
- [ ] 금액 포맷: ₩1,234,567
- [ ] 퍼센트: 12.34%
- [ ] 날짜 포맷: 2025-12-16 or 12월 16일
- [ ] 시간 포맷: 오후 3:45
- [ ] 큰 숫자: 1.2M, 1.5B
- [ ] Decimal 자리수 일관성

### 5. Responsive Design (20분)

#### 5.1 Mobile (375px - 640px) (7분)
- [ ] Layout: 1 Column
- [ ] Navigation: Hamburger Menu
- [ ] Font Size: 조정 (14px → 16px)
- [ ] Touch Target: 최소 44x44px
- [ ] Horizontal Scroll 없음
- [ ] Chart: 터치 가능
- [ ] Table: 스크롤 또는 카드 변환

#### 5.2 Tablet (641px - 1024px) (7분)
- [ ] Layout: 2 Column
- [ ] Sidebar: Collapsible
- [ ] Font Size: 적절
- [ ] Chart: 반응형
- [ ] Table: 일부 컬럼 숨김

#### 5.3 Desktop (1025px+) (6분)
- [ ] Layout: Full 3 Column
- [ ] Sidebar: 고정
- [ ] Max Width: 1536px (2xl)
- [ ] Chart: Full Feature
- [ ] Hover 효과: 모두 작동

### 6. Accessibility (a11y) (15분)

#### 6.1 Keyboard Navigation (5분)
- [ ] Tab 순서: 논리적
- [ ] Focus Indicator: 명확
- [ ] Escape Key: Modal 닫기
- [ ] Arrow Keys: Dropdown 탐색
- [ ] Enter Key: Submit
- [ ] Space Key: Checkbox/Radio

#### 6.2 Screen Reader (5분)
- [ ] Alt Text: 모든 이미지
- [ ] ARIA Labels: 필요한 곳
- [ ] ARIA Roles: 정확
- [ ] ARIA Live Regions: 동적 콘텐츠
- [ ] Semantic HTML: 사용

#### 6.3 Color Blindness (5분)
- [ ] Contrast: 충분 (4.5:1)
- [ ] 색상만으로 의미 전달 안 함
- [ ] 아이콘 + 텍스트 병행
- [ ] Profit/Loss: 색 + 아이콘

### 7. Performance (15분)

#### 7.1 Loading Speed (5분)
- [ ] First Contentful Paint: <1.5s
- [ ] Largest Contentful Paint: <2.5s
- [ ] Time to Interactive: <3.5s
- [ ] Cumulative Layout Shift: <0.1

#### 7.2 Assets (5분)
- [ ] 이미지: WebP 포맷
- [ ] 이미지: Lazy Loading
- [ ] 폰트: Preload
- [ ] CSS: Minified
- [ ] JS: Code Splitting

#### 7.3 Runtime Performance (5분)
- [ ] Scroll: 60fps
- [ ] Animation: 60fps
- [ ] Memory Leak: 없음
- [ ] Re-render: 최소화

### 8. Error States (10분)

#### 8.1 User Errors (5분)
- [ ] Form Validation: 즉시 피드백
- [ ] 404 Page: 디자인 완성
- [ ] Empty State: 도움말 제공
- [ ] No Results: 대안 제시

#### 8.2 System Errors (5분)
- [ ] 500 Error: 친절한 메시지
- [ ] Network Error: 재시도 제안
- [ ] Timeout: Loading 표시
- [ ] API Error: 명확한 메시지

### 9. Edge Cases (15분)

#### 9.1 Data Edge Cases (10분)
- [ ] 0 값: 표시 정확
- [ ] 음수 값: 빨간색
- [ ] 매우 큰 숫자: 1.2B 포맷
- [ ] 매우 작은 숫자: 0.0001
- [ ] 빈 리스트: Empty State
- [ ] 긴 텍스트: 줄임표
- [ ] 짧은 텍스트: Center 정렬
- [ ] 특수 문자: 이스케이프

#### 9.2 UX Edge Cases (5분)
- [ ] 느린 네트워크: Loading 표시
- [ ] 오프라인: 오프라인 메시지
- [ ] Session Timeout: 재로그인 유도
- [ ] Concurrent Updates: Conflict 해결

### 10. Cross-Browser (10분)
- [ ] Chrome: 완벽 작동
- [ ] Firefox: 완벽 작동
- [ ] Safari: 완벽 작동
- [ ] Edge: 완벽 작동
- [ ] Mobile Safari: 완벽 작동
- [ ] Mobile Chrome: 완벽 작동

---

## 🛠️ 자동화 도구 설정

### 1. Lighthouse CI (자동 성능 검증)

```bash
# 설치
npm install -g @lhci/cli

# 실행
lhci autorun --config=.lighthouserc.json

# 기준 점수
Performance: 90+
Accessibility: 95+
Best Practices: 90+
SEO: 90+
```

### 2. axe DevTools (접근성 자동 검증)

```bash
# 설치 (Chrome Extension)
# https://chrome.google.com/webstore/detail/axe-devtools

# 모든 페이지에서 실행
# 0 violations 목표
```

### 3. Percy (Visual Regression Testing)

```bash
# 설치
npm install --save-dev @percy/cli @percy/playwright

# Snapshot 생성
npx percy exec -- npx playwright test

# Visual Diff 확인
```

### 4. ESLint a11y Plugin

```bash
# 이미 설치됨
# eslint-plugin-jsx-a11y

# 규칙 강화
"jsx-a11y/alt-text": "error"
"jsx-a11y/anchor-is-valid": "error"
```

---

## 📝 검수 템플릿

각 페이지마다 다음 템플릿 사용:

```markdown
# [페이지명] UX/UI 검수 리포트

## 기본 정보
- **URL**: /dashboard/...
- **검수 시간**: 2시간
- **검수자**: [이름]
- **검수일**: 2025-12-XX

## 검수 결과
- **Overall Score**: 92/100
- **Critical Issues**: 0
- **High Issues**: 2
- **Medium Issues**: 5
- **Low Issues**: 8

## 섹션별 검수

### Header
- [ ] ✅ Logo 위치 정확
- [ ] ⚠️ Navigation 간격 2px 차이
- [ ] ✅ User Menu 정상

### Main Content
- [ ] ✅ Grid 정렬 완벽
- [ ] ❌ Card hover 애니메이션 끊김 (Critical)
- [ ] ⚠️ Chart 색상 Primary 아님 (High)

### Footer
- [ ] ✅ 법률 면책조항 표시
- [ ] ✅ 링크 모두 작동

## 발견된 이슈

### Critical (즉시 수정 필요)
1. **Card hover 애니메이션 끊김**
   - 위치: Dashboard > Portfolio Card
   - 현상: Hover 시 transform 끊김
   - 원인: transition duration 누락
   - 해결: `transition-all duration-200` 추가

### High (우선 수정)
2. **Chart 색상 불일치**
   - 위치: Portfolio Chart
   - 현상: #4A5AD2 사용 (Primary #5E6AD2 아님)
   - 해결: `text-primary` 클래스 사용

## 개선 제안
1. Loading Skeleton 추가 (Empty → Loaded)
2. Error Boundary 추가
3. Empty State 일러스트 개선

## 스크린샷
- Before: [이미지]
- After: [이미지]
- Mobile: [이미지]
```

---

## 📅 50시간 상세 스케줄

### Day 1 (8시간) - 준비 & Landing/Auth
```
09:00-10:00  환경 설정 (도구, 브라우저, 디바이스)
10:00-12:00  자동화 도구 설정 (Lighthouse, axe, Percy)
12:00-13:00  점심
13:00-14:00  디자인 시스템 검증 준비
14:00-15:00  베이스라인 스크린샷 생성
15:00-16:00  / (Landing Page) 검수
16:00-17:00  /auth/login 검수
17:00-18:00  /auth/signup 검수
```

### Day 2 (8시간) - Dashboard 핵심
```
09:00-11:00  /dashboard (메인) 검수
11:00-13:00  /dashboard/portfolio 검수
13:00-14:00  점심
14:00-16:00  /dashboard/strategy-builder 검수
16:00-18:00  /dashboard/backtest 검수
```

### Day 3 (8시간) - 전략 & 결과
```
09:00-11:00  /dashboard/strategies 검수
11:00-13:00  /strategies/leaderboard 검수
13:00-14:00  점심
14:00-16:00  /backtest/results/[id] 검수
16:00-18:00  /dashboard/mirroring 검수
```

### Day 4 (8시간) - Admin & 설정
```
09:00-11:00  /admin/cs 검수
11:00-13:00  /dashboard/coaching 검수
13:00-14:00  점심
14:00-15:30  /dashboard/copy-trading 검수
15:30-17:00  /dashboard/history 검수
17:00-18:00  /dashboard/settings 검수
```

### Day 5 (8시간) - 크로스 검증
```
09:00-11:00  일관성 검증 (색상, 타이포, 간격)
11:00-13:00  Navigation & Flow 검증
13:00-14:00  점심
14:00-16:00  반응형 디자인 검증 (5 breakpoints)
16:00-18:00  애니메이션 & 트랜지션 검증
```

### Day 6 (10시간) - 접근성 & 최종
```
09:00-11:00  접근성 검증 (WCAG 2.1 AA)
11:00-13:00  Core Web Vitals 최적화
13:00-14:00  점심
14:00-15:00  이미지 & 폰트 최적화
15:00-16:00  크로스 브라우저 테스트
16:00-19:00  최종 리포트 작성
```

---

## 🎯 검수 완료 기준

### Critical (P0) - 100% 필수
- [ ] 모든 P0 페이지 검수 완료 (11개)
- [ ] Critical Issue 0개
- [ ] Lighthouse 점수 90+ (모든 카테고리)
- [ ] axe violations 0개

### High (P1) - 95% 권장
- [ ] P1 페이지 검수 완료 (6개)
- [ ] High Issue 5개 이하
- [ ] WCAG 2.1 AA 준수

### Medium (P2) - 90% 선택
- [ ] P2 페이지 검수 완료 (5개)
- [ ] Medium Issue 10개 이하

---

**50시간 나노단위 검수 시작 준비 완료!** 🚀

*최종 업데이트: 2025-12-16*
