#!/bin/bash

# ============================================
# UX/UI 나노단위 검수 시작 스크립트
# 50시간 검수를 위한 환경 설정
# ============================================

# 색상 코드
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   HEPHAITOS UX/UI 나노단위 검수 (50시간)              ║"
echo "║   환경 설정 및 베이스라인 생성                          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 검수 디렉토리 생성
AUDIT_DIR="uxui-audit"
SCREENSHOTS_DIR="$AUDIT_DIR/screenshots"
REPORTS_DIR="$AUDIT_DIR/reports"
BASELINE_DIR="$AUDIT_DIR/baseline"

echo -e "${BLUE}━━━ Step 1: 디렉토리 구조 생성 ━━━${NC}"
echo ""

mkdir -p "$AUDIT_DIR"
mkdir -p "$SCREENSHOTS_DIR"
mkdir -p "$REPORTS_DIR"
mkdir -p "$BASELINE_DIR"

echo -e "${GREEN}✓${NC} $AUDIT_DIR"
echo -e "${GREEN}✓${NC} $SCREENSHOTS_DIR"
echo -e "${GREEN}✓${NC} $REPORTS_DIR"
echo -e "${GREEN}✓${NC} $BASELINE_DIR"

echo ""
echo -e "${BLUE}━━━ Step 2: 필수 도구 확인 ━━━${NC}"
echo ""

# Node.js 확인
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js: $(node --version)"
else
    echo -e "${YELLOW}⚠${NC} Node.js not found"
fi

# Playwright 확인
if [ -d "node_modules/@playwright/test" ]; then
    echo -e "${GREEN}✓${NC} Playwright installed"
else
    echo -e "${YELLOW}⚠${NC} Playwright not installed"
    read -p "Install Playwright? (y/n): " INSTALL_PW
    if [ "$INSTALL_PW" = "y" ]; then
        npm install -D @playwright/test
        npx playwright install
    fi
fi

# Lighthouse 확인
if command -v lhci &> /dev/null; then
    echo -e "${GREEN}✓${NC} Lighthouse CI installed"
else
    echo -e "${YELLOW}⚠${NC} Lighthouse CI not installed"
    read -p "Install Lighthouse CI? (y/n): " INSTALL_LH
    if [ "$INSTALL_LH" = "y" ]; then
        npm install -g @lhci/cli
    fi
fi

echo ""
echo -e "${BLUE}━━━ Step 3: 개발 서버 상태 확인 ━━━${NC}"
echo ""

# 서버 실행 중인지 확인
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓${NC} 개발 서버 실행 중 (http://localhost:3000)"
else
    echo -e "${YELLOW}⚠${NC} 개발 서버 실행 필요"
    echo ""
    echo "다른 터미널에서 실행:"
    echo "  npm run dev"
    echo ""
    read -p "서버가 준비되면 Enter를 누르세요..."
fi

echo ""
echo -e "${BLUE}━━━ Step 4: 베이스라인 스크린샷 생성 ━━━${NC}"
echo ""

# 검수 대상 페이지 목록
PAGES=(
    "/"
    "/auth/login"
    "/auth/signup"
    "/dashboard"
    "/dashboard/portfolio"
    "/dashboard/strategy-builder"
    "/dashboard/backtest"
    "/dashboard/strategies"
    "/strategies/leaderboard"
    "/admin/cs"
)

echo "총 ${#PAGES[@]}개 페이지 스크린샷 생성 중..."
echo ""

# Playwright로 스크린샷 생성
cat > "$AUDIT_DIR/take-screenshots.js" << 'EOF'
const { chromium } = require('@playwright/test');

const pages = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/dashboard',
  '/dashboard/portfolio',
  '/dashboard/strategy-builder',
  '/dashboard/backtest',
  '/dashboard/strategies',
  '/strategies/leaderboard',
  '/admin/cs'
];

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 }
];

(async () => {
  const browser = await chromium.launch();

  for (const viewport of viewports) {
    console.log(`\nCapturing ${viewport.name} (${viewport.width}x${viewport.height})...`);
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    for (const path of pages) {
      const url = `http://localhost:3000${path}`;
      const fileName = path.replace(/\//g, '_').substring(1) || 'home';
      const screenshotPath = `uxui-audit/baseline/${viewport.name}_${fileName}.png`;

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  ✓ ${fileName}`);
      } catch (error) {
        console.log(`  ✗ ${fileName} (${error.message})`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('\n✅ All screenshots captured!');
})();
EOF

# 스크린샷 생성 실행
node "$AUDIT_DIR/take-screenshots.js"

echo ""
echo -e "${BLUE}━━━ Step 5: Lighthouse 베이스라인 실행 ━━━${NC}"
echo ""

if command -v lhci &> /dev/null; then
    echo "Lighthouse 분석 중... (3-5분 소요)"
    lhci autorun --config=.lighthouserc.json > "$REPORTS_DIR/lighthouse-baseline.txt" 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Lighthouse 베이스라인 생성 완료"
        echo "   리포트: $REPORTS_DIR/lighthouse-baseline.txt"
    else
        echo -e "${YELLOW}⚠${NC} Lighthouse 실행 실패 (수동 실행 필요)"
    fi
else
    echo -e "${YELLOW}⚠${NC} Lighthouse CI 설치 필요 (skip)"
fi

echo ""
echo -e "${BLUE}━━━ Step 6: 검수 템플릿 생성 ━━━${NC}"
echo ""

# 검수 리포트 템플릿
for page in "${PAGES[@]}"; do
    PAGE_NAME=$(echo "$page" | sed 's/\//_/g' | sed 's/^_//')
    [ -z "$PAGE_NAME" ] && PAGE_NAME="home"

    TEMPLATE_FILE="$REPORTS_DIR/${PAGE_NAME}_report.md"

    cat > "$TEMPLATE_FILE" << TEMPLATE
# $page - UX/UI 검수 리포트

## 기본 정보
- **URL**: \`$page\`
- **검수 시간**: [시작 - 종료]
- **검수자**: [이름]
- **검수일**: $(date +%Y-%m-%d)

## 검수 결과
- **Overall Score**: __/100
- **Critical Issues**: __
- **High Issues**: __
- **Medium Issues**: __
- **Low Issues**: __

## 나노단위 체크리스트

### 1. Visual Design (30분)

#### 1.1 Color System (10분)
- [ ] Primary Color (#5E6AD2) 정확
- [ ] Background (#0D0D0F) 일관성
- [ ] Glass Morphism rgba(255,255,255,0.03)
- [ ] Border rgba(255,255,255,0.06)
- [ ] Contrast Ratio 4.5:1+

#### 1.2 Typography (10분)
- [ ] Font: Inter
- [ ] Heading 크기 정확
- [ ] Line Height 일관성
- [ ] Font Weight 정확

#### 1.3 Spacing & Layout (10분)
- [ ] 8px Grid System
- [ ] Padding 일관성
- [ ] Responsive Breakpoints

### 2. Interactive Elements (20분)
- [ ] Button States (Hover/Active/Disabled)
- [ ] Form Validation
- [ ] Card Interactions

### 3. Animation & Transitions (15분)
- [ ] Page Transitions (300ms)
- [ ] Micro-interactions
- [ ] Loading States

### 4. Content & Copy (10분)
- [ ] 맞춤법
- [ ] 법률 면책조항
- [ ] 숫자 포맷

### 5. Responsive Design (20분)
- [ ] Mobile (375px)
- [ ] Tablet (768px)
- [ ] Desktop (1920px)

### 6. Accessibility (15분)
- [ ] Keyboard Navigation
- [ ] Screen Reader
- [ ] Color Blindness

### 7. Performance (15분)
- [ ] FCP < 1.5s
- [ ] LCP < 2.5s
- [ ] CLS < 0.1

### 8. Error States (10분)
- [ ] User Errors
- [ ] System Errors

### 9. Edge Cases (15분)
- [ ] 0 값 처리
- [ ] 빈 리스트
- [ ] 긴 텍스트

### 10. Cross-Browser (10분)
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile

## 발견된 이슈

### Critical (즉시 수정)
1. [이슈 설명]
   - 위치:
   - 현상:
   - 해결:

### High (우선 수정)

### Medium (권장 수정)

### Low (선택 수정)

## 개선 제안

1.
2.
3.

## 스크린샷

### Desktop
![]($SCREENSHOTS_DIR/desktop_${PAGE_NAME}.png)

### Tablet
![]($SCREENSHOTS_DIR/tablet_${PAGE_NAME}.png)

### Mobile
![]($SCREENSHOTS_DIR/mobile_${PAGE_NAME}.png)

## Next Steps

- [ ] Critical Issues 수정
- [ ] High Issues 수정
- [ ] 재검수 스케줄
TEMPLATE

    echo -e "${GREEN}✓${NC} $TEMPLATE_FILE"
done

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║              ✅ 환경 설정 완료!                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${CYAN}생성된 파일:${NC}"
echo "  - 베이스라인 스크린샷: $BASELINE_DIR/ (${#PAGES[@]}개 페이지 x 3개 뷰포트)"
echo "  - 검수 리포트 템플릿: $REPORTS_DIR/ (${#PAGES[@]}개)"
echo "  - Lighthouse 리포트: $REPORTS_DIR/lighthouse-baseline.txt"
echo ""
echo -e "${CYAN}다음 단계:${NC}"
echo "  1. docs/UXUI_AUDIT_FRAMEWORK_50H.md 읽기"
echo "  2. Day 1 스케줄 시작 (Landing/Auth 검수)"
echo "  3. $REPORTS_DIR/home_report.md 부터 작성"
echo ""
echo -e "${MAGENTA}💡 Tip:${NC} 각 페이지 검수 후 즉시 리포트 작성!"
echo ""
