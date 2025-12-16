# 🎨 UX/UI 나노단위 검수 시작 가이드

**검수 기간**: 50시간 (6일 x 8시간)
**검수 대상**: 22개 페이지
**검수 수준**: 나노단위 (픽셀, 애니메이션, 접근성)

---

## ⚡ Quick Start (5분)

```bash
# 1. 개발 서버 실행 (터미널 1)
npm run dev

# 2. 검수 환경 설정 (터미널 2)
npm run audit:uxui

# 자동으로:
# - 디렉토리 구조 생성 (uxui-audit/)
# - 베이스라인 스크린샷 생성 (30장: 10페이지 x 3뷰포트)
# - Lighthouse 분석 실행
# - 검수 리포트 템플릿 생성 (10개)
```

---

## 📋 생성되는 파일 구조

```
uxui-audit/
├── baseline/                    # 베이스라인 스크린샷 (30장)
│   ├── desktop_home.png
│   ├── tablet_home.png
│   ├── mobile_home.png
│   ├── desktop_auth_login.png
│   └── ...
├── reports/                     # 검수 리포트 (10개 템플릿)
│   ├── home_report.md
│   ├── auth_login_report.md
│   ├── dashboard_report.md
│   └── lighthouse-baseline.txt
└── screenshots/                 # 진행 중 스크린샷
    └── (검수 중 추가)
```

---

## 📚 50시간 검수 로드맵

### Day 1 (8시간) - 환경 설정 & Landing/Auth
```
✅ 09:00-10:00  환경 설정 (npm run audit:uxui)
✅ 10:00-12:00  자동화 도구 확인
   13:00-16:00  Landing, Login, Signup 검수
   16:00-18:00  첫 3개 페이지 리포트 작성
```

### Day 2 (8시간) - Dashboard 핵심
```
   09:00-18:00  Dashboard 4개 페이지 검수
                - /dashboard (메인)
                - /dashboard/portfolio
                - /dashboard/strategy-builder
                - /dashboard/backtest
```

### Day 3-6
상세 스케줄: `docs/UXUI_AUDIT_FRAMEWORK_50H.md` 참조

---

## 🛠️ 필수 도구 설치

### 1. Playwright (스크린샷 자동화)
```bash
npm install -D @playwright/test
npx playwright install
```

### 2. Lighthouse CI (성능 자동 검증)
```bash
npm install -g @lhci/cli

# 실행
npm run audit:lighthouse
```

### 3. axe DevTools (접근성 검증)
```
Chrome Extension 설치:
https://chrome.google.com/webstore/detail/axe-devtools
```

---

## 📝 검수 프로세스 (각 페이지)

### Step 1: 페이지 열기 (5분)
```bash
# 브라우저에서
http://localhost:3000/dashboard
```

### Step 2: 나노단위 체크 (120분)
**10가지 카테고리 순차 검수**:
1. Visual Design (30분) - 색상, 타이포, 간격
2. Interactive Elements (20분) - 버튼, 폼, 카드
3. Animation & Transitions (15분) - 페이지 전환, 마이크로 인터랙션
4. Content & Copy (10분) - 텍스트, 숫자 포맷
5. Responsive Design (20분) - Mobile/Tablet/Desktop
6. Accessibility (15분) - 키보드, 스크린리더, 색맹
7. Performance (15분) - 로딩, 런타임
8. Error States (10분) - 사용자/시스템 에러
9. Edge Cases (15분) - 데이터 극단값
10. Cross-Browser (10분) - 6개 브라우저

### Step 3: 리포트 작성 (30분)
```bash
# 템플릿 열기
code uxui-audit/reports/dashboard_report.md

# 체크리스트 작성
# 이슈 기록 (Critical/High/Medium/Low)
# 스크린샷 추가
# 개선 제안 작성
```

### Step 4: 이슈 수정 (변동)
- Critical: 즉시 수정
- High: 당일 수정
- Medium: 검수 완료 후 일괄 수정
- Low: 선택적 수정

---

## 🎯 검수 체크리스트 (각 페이지)

### ✅ Visual Design (30분)
```
□ Primary Color #5E6AD2 정확히 사용
□ Glass Morphism rgba(255,255,255,0.03) 정확
□ 8px Grid System 준수
□ Font: Inter 사용
□ Contrast Ratio 4.5:1 이상
```

### ✅ Interactive Elements (20분)
```
□ Button Hover: 명확한 피드백
□ Form Validation: 즉시 피드백
□ Card Hover: 부드러운 상승 효과
□ Focus Indicator: 명확
```

### ✅ Animation (15분)
```
□ Page Transition: 300ms
□ Micro-interactions: 부드러움
□ Loading Skeleton: 펄스 효과
□ Chart Animation: 데이터 로드 시
```

### ✅ Responsive (20분)
```
□ Mobile (375px): 1 Column, Touch 44x44px
□ Tablet (768px): 2 Column, Sidebar Collapsible
□ Desktop (1920px): 3 Column, Sidebar Fixed
```

### ✅ Accessibility (15분)
```
□ Tab 순서: 논리적
□ Alt Text: 모든 이미지
□ ARIA Labels: 필요한 곳
□ Contrast: 4.5:1 이상
```

### ✅ Performance (15분)
```
□ FCP < 1.5s
□ LCP < 2.5s
□ CLS < 0.1
□ TTI < 3.5s
```

---

## 🔍 나노단위 검수 예시

### 예시 1: Button Hover 검수

**나노단위 체크**:
```css
/* ✅ 올바른 예 */
.button {
  transition: all 200ms ease-out;
  transform: translateY(0);
}
.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(94, 106, 210, 0.3);
}

/* ❌ 잘못된 예 */
.button:hover {
  /* transition 누락 - 끊김 */
  /* transform 없음 - 피드백 부족 */
  background: #4A5AD2; /* Primary 색상 아님 */
}
```

**검수 항목**:
- [ ] transition duration: 200ms (150-250ms 허용)
- [ ] translateY: -2px (일관성)
- [ ] box-shadow: 존재, Primary 색상 사용
- [ ] ease-out 또는 ease 사용

### 예시 2: Typography 검수

**나노단위 체크**:
```css
/* ✅ 제목 */
h1: 30px / Line-height 1.2 / Font-weight 700
h2: 24px / Line-height 1.2 / Font-weight 600
h3: 20px / Line-height 1.2 / Font-weight 600

/* ✅ 본문 */
body: 16px / Line-height 1.5 / Font-weight 400
small: 14px / Line-height 1.5 / Font-weight 400
```

**검수 항목**:
- [ ] Font Size: 정확 (±1px 허용)
- [ ] Line Height: 일관성
- [ ] Font Weight: 디자인 시스템 준수
- [ ] Letter Spacing: 기본값 (특수 케이스 제외)

---

## 📊 진행 상황 추적

### 일일 리포트 작성
```markdown
# Day 1 - 2025-12-XX

## 검수 완료
- [x] / (Landing)
- [x] /auth/login
- [x] /auth/signup

## 발견 이슈
- Critical: 2개
- High: 5개
- Medium: 12개
- Low: 8개

## 즉시 수정
- Button hover transition 누락 → 수정 완료
- Primary color 불일치 → 수정 완료

## 다음 단계
- Day 2: Dashboard 4개 페이지
```

---

## 🎯 검수 완료 기준

### Minimum (필수)
```
✅ P0 페이지 11개 검수 완료
✅ Critical Issue 0개
✅ Lighthouse 점수 90+ (모든 카테고리)
✅ axe violations 0개
```

### Recommended (권장)
```
✅ P1 페이지 6개 검수 완료
✅ High Issue 5개 이하
✅ WCAG 2.1 AA 준수
✅ 모든 브라우저 테스트 통과
```

### Excellent (이상적)
```
✅ P2 페이지 5개 검수 완료
✅ Medium Issue 10개 이하
✅ Core Web Vitals 모두 Green
✅ Percy Visual Regression 통과
```

---

## 💡 Pro Tips

### Tip 1: 효율적인 검수
- 같은 카테고리를 한 번에 검수 (예: 모든 페이지의 Typography)
- 자동화 도구 최대 활용 (Lighthouse, axe)
- 스크린샷 즉시 캡처 (비교용)

### Tip 2: 이슈 우선순위
- **Critical**: 즉시 수정 (기능 차단, 법률 문제)
- **High**: 당일 수정 (사용성 심각, 접근성)
- **Medium**: 일괄 수정 (일관성, 미세 조정)
- **Low**: 선택적 (개선 제안)

### Tip 3: 리포트 작성
- 스크린샷 + 설명 병행
- Before/After 비교 이미지
- 구체적인 해결 방법 제시
- CSS/HTML 코드 스니펫 포함

---

## 📞 도움말

### 상세 프레임워크
```bash
# 전체 50시간 계획
cat docs/UXUI_AUDIT_FRAMEWORK_50H.md
```

### 자동화 재실행
```bash
# 스크린샷만
node uxui-audit/take-screenshots.js

# Lighthouse만
npm run audit:lighthouse
```

### 리포트 템플릿 재생성
```bash
# 전체 재생성
rm -rf uxui-audit/reports/*
npm run audit:uxui
```

---

## 🚀 지금 시작하기

```bash
# 1단계: 개발 서버 실행
npm run dev

# 2단계: 검수 환경 설정 (5분)
npm run audit:uxui

# 3단계: 첫 페이지 검수 시작 (2시간)
# http://localhost:3000 접속
# uxui-audit/reports/home_report.md 작성
```

---

**50시간 나노단위 검수 시작 준비 완료!** 🎨

*최종 업데이트: 2025-12-16*
