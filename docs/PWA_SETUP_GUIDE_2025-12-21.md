# HEPHAITOS PWA 설정 가이드

> **작성일**: 2025-12-21
> **목적**: Progressive Web App (PWA) 설정 및 오프라인 지원 구현
> **Phase**: 5 P1

---

## 📱 PWA란?

Progressive Web App은 웹 기술로 만든 애플리케이션을 네이티브 앱처럼 사용할 수 있게 해주는 기술입니다.

### 주요 특징
- ✅ **오프라인 지원** - 네트워크 없이도 기본 기능 사용
- ✅ **앱 설치** - 홈 화면에 추가 가능
- ✅ **빠른 로딩** - Service Worker 캐싱으로 즉시 로드
- ✅ **푸시 알림** - 브라우저 닫혀 있어도 알림 수신
- ✅ **자동 업데이트** - 백그라운드 업데이트

---

## 🔧 구현 사항

### 1. 패키지 설치

```bash
pnpm add @ducanh2912/next-pwa
```

**사용 이유**: Next.js 15 App Router 완벽 지원, Workbox 기반 강력한 캐싱

### 2. Next.js 설정 (`next.config.js`)

```javascript
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    // 폰트 캐싱
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1년
        },
      },
    },
    // 이미지 캐싱
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24시간
        },
      },
    },
    // API 캐싱 (Network First)
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'apis',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 24 * 60 * 60,
        },
        networkTimeoutSeconds: 10,
      },
    },
    // 기타 모든 요청 (Network First)
    {
      urlPattern: /.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'others',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
})

module.exports = withPWA(withBundleAnalyzer(nextConfig))
```

### 3. Manifest 파일 (`public/manifest.json`)

```json
{
  "name": "HEPHAITOS - AI Trading Platform",
  "short_name": "HEPHAITOS",
  "description": "AI 트레이딩 시스템 빌더",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0D0D0F",
  "theme_color": "#5E6AD2",
  "orientation": "portrait-primary",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    },
    {
      "src": "/icons/icon-192x192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "대시보드",
      "url": "/dashboard",
      "description": "메인 대시보드로 이동"
    },
    {
      "name": "전략 빌더",
      "url": "/dashboard/strategies/new",
      "description": "전략 빌더로 이동"
    }
  ]
}
```

### 4. 메타데이터 설정 (`src/app/layout.tsx`)

```typescript
export const metadata: Metadata = {
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0D0D0F' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HEPHAITOS',
  },
}
```

### 5. `.gitignore` 추가

```gitignore
# PWA
public/sw.js
public/workbox-*.js
```

---

## 🎯 캐싱 전략

### CacheFirst
- **사용처**: 폰트, 자주 변하지 않는 정적 리소스
- **동작**: 캐시에 있으면 즉시 반환, 없으면 네트워크 요청 후 캐시 저장
- **장점**: 가장 빠른 로딩 속도

### StaleWhileRevalidate
- **사용처**: 이미지, CSS, JS 파일
- **동작**: 캐시에서 즉시 반환하면서 백그라운드에서 최신 버전 가져옴
- **장점**: 빠른 응답 + 자동 업데이트

### NetworkFirst
- **사용처**: API 요청, 동적 콘텐츠
- **동작**: 네트워크 요청 시도 → 실패 시 캐시 사용
- **장점**: 항상 최신 데이터, 오프라인 대비

---

## 🧪 테스트 방법

### 1. 프로덕션 빌드 생성

```bash
pnpm build
pnpm start
```

### 2. Chrome DevTools에서 확인

1. **Application 탭** 열기
2. **Manifest** 섹션에서 manifest.json 확인
3. **Service Workers** 섹션에서 등록 확인
4. **Cache Storage** 섹션에서 캐시 확인

### 3. Lighthouse PWA 감사

```bash
npx lighthouse http://localhost:3000 --view
```

**목표 점수**: 90점 이상

### 4. 오프라인 테스트

1. Chrome DevTools → **Network 탭**
2. **Offline** 모드 활성화
3. 페이지 새로고침 → 정상 작동 확인

### 5. 모바일 설치 테스트

**Android Chrome**:
1. 사이트 방문
2. 주소창 오른쪽 **"설치"** 버튼 클릭
3. 홈 화면에 아이콘 추가 확인

**iOS Safari**:
1. 사이트 방문
2. 공유 버튼 → **"홈 화면에 추가"**
3. 독립 실행형 앱으로 실행 확인

---

## 📊 기대 효과

| 지표 | 개선 |
|------|------|
| **First Load** | 50% 빠른 로딩 (캐시 히트 시) |
| **Repeat Visits** | 90% 빠른 로딩 |
| **Offline Access** | 기본 UI 및 캐시된 데이터 접근 |
| **Mobile Engagement** | 홈 화면 설치로 재방문율 ↑ |
| **Data Usage** | 캐싱으로 데이터 사용량 30% 감소 |

---

## ⚠️ 주의사항

### 개발 환경에서 비활성화
```javascript
disable: process.env.NODE_ENV === 'development'
```
개발 중에는 PWA를 비활성화하여 캐시 이슈 방지

### Service Worker 업데이트
- 새 버전 배포 시 자동으로 백그라운드 업데이트
- `skipWaiting: true`로 즉시 활성화
- 사용자에게 "새 버전 사용 가능" 알림 표시 권장

### 민감한 데이터 캐싱 주의
- 인증 토큰, 개인정보는 캐시하지 않음
- API 응답 중 민감 데이터는 `networkOnly` 전략 사용

---

## 🔍 문제 해결

### Service Worker 등록 실패
```bash
# 브라우저 콘솔 확인
navigator.serviceWorker.getRegistrations().then(console.log)

# 강제 재등록
navigator.serviceWorker.getRegistrations().then(regs =>
  regs.forEach(reg => reg.unregister())
)
```

### 캐시 클리어
```bash
# Chrome DevTools → Application → Cache Storage → 우클릭 → Delete
```

### HTTPS 필요
PWA는 HTTPS 환경에서만 작동 (localhost 제외)

---

## 📚 참고 자료

- [next-pwa 문서](https://ducanh2912.github.io/next-pwa/)
- [Workbox 전략](https://developer.chrome.com/docs/workbox/modules/workbox-strategies)
- [Web.dev PWA 체크리스트](https://web.dev/pwa-checklist/)
- [MDN PWA 가이드](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

## ✅ 체크리스트

- [x] @ducanh2912/next-pwa 설치
- [x] next.config.js PWA 설정
- [x] manifest.json 생성 및 보완
- [x] 아이콘 파일 준비 (192x192, 512x512)
- [x] layout.tsx 메타데이터 추가
- [x] .gitignore 업데이트
- [ ] 프로덕션 빌드 테스트
- [ ] Lighthouse PWA 감사 (90+ 목표)
- [ ] 오프라인 기능 테스트
- [ ] 모바일 설치 테스트 (Android/iOS)

---

**작성자**: Claude Sonnet 4.5
**최종 수정**: 2025-12-21
