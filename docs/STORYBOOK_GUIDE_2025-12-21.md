# HEPHAITOS Storybook 가이드

> **작성일**: 2025-12-21
> **목적**: UI 컴포넌트 문서화 및 디자인 시스템 시각화
> **Phase**: 5 P2

---

## 📊 개요

HEPHAITOS Storybook은 34개의 UI 컴포넌트를 문서화하고,
디자인 시스템을 시각화하는 개발자 협업 도구입니다.

### 주요 기능

| 기능 | 설명 |
|------|------|
| **Component Showcase** | 모든 UI 컴포넌트 시각화 |
| **Interactive Props** | 실시간 props 변경 테스트 |
| **Accessibility Testing** | a11y addon으로 접근성 검증 |
| **Dark Mode** | HEPHAITOS Dark Theme 적용 |
| **Design Tokens** | 색상, 타이포그래피 문서화 |

---

## 🚀 사용법

### 로컬 실행

```bash
# Storybook 개발 서버 시작
pnpm storybook

# 브라우저에서 http://localhost:6006 자동 열림
```

### 프로덕션 빌드

```bash
# 정적 사이트 빌드
pnpm build-storybook

# 출력: storybook-static/
# Vercel/Netlify 배포 가능
```

---

## 📂 파일 구조

```
HEPHAITOS/
├── .storybook/
│   ├── main.ts              # Storybook 설정
│   ├── preview.tsx          # 글로벌 스타일, 데코레이터
│   ├── Introduction.stories.mdx   # 소개 페이지
│   └── DesignTokens.stories.mdx   # 디자인 토큰 문서
├── src/components/ui/
│   ├── Button.tsx
│   ├── Button.stories.tsx   # ← 스토리 파일
│   ├── Card.tsx
│   ├── Card.stories.tsx
│   └── ...
└── docs/
    └── STORYBOOK_GUIDE_2025-12-21.md
```

---

## 🎨 스토리 작성법

### 기본 구조

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { MyComponent } from './MyComponent'

const meta = {
  title: 'UI/MyComponent',  // 카테고리/이름
  component: MyComponent,
  parameters: {
    layout: 'centered',  // 레이아웃 옵션
  },
  tags: ['autodocs'],  // 자동 문서 생성
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
  },
} satisfies Meta<typeof MyComponent>

export default meta
type Story = StoryObj<typeof meta>

// 기본 스토리
export const Primary: Story = {
  args: {
    children: 'Click me',
    variant: 'primary',
  },
}

// 복잡한 렌더링
export const WithIcon: Story = {
  render: (args) => (
    <MyComponent {...args}>
      <Icon /> Content
    </MyComponent>
  ),
}
```

### ArgTypes 옵션

| Control | 사용 예시 |
|---------|----------|
| `boolean` | `isLoading: { control: 'boolean' }` |
| `select` | `variant: { control: 'select', options: [...] }` |
| `range` | `size: { control: { type: 'range', min: 10, max: 100 } }` |
| `color` | `color: { control: 'color' }` |
| `text` | `label: { control: 'text' }` |

---

## 🧩 현재 문서화된 컴포넌트

### Core UI (3개 완료)

- [x] **Button** - 5 variants, 4 sizes, 아이콘 지원
- [x] **Card** - 7 variants, 5 padding options
- [x] **Input** - 아이콘, 에러, 힌트 지원

### 추가 예정 (31개)

| 컴포넌트 | 우선순위 | 상태 |
|---------|---------|------|
| Badge | P1 | ⏸️ 대기 |
| Modal | P1 | ⏸️ 대기 |
| Tabs | P1 | ⏸️ 대기 |
| Select | P1 | ⏸️ 대기 |
| Checkbox | P1 | ⏸️ 대기 |
| Tooltip | P2 | ⏸️ 대기 |
| Spinner | P2 | ⏸️ 대기 |
| GlassPanel | P2 | ⏸️ 대기 |
| ... | ... | ... |

**전략**: 사용 빈도 높은 컴포넌트부터 순차 작성

---

## 🔧 설정 파일

### .storybook/main.ts

```typescript
import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',  // Controls, Actions, Docs
    '@storybook/addon-interactions', // Interaction testing
    '@storybook/addon-a11y',         // Accessibility
    'storybook-dark-mode',           // Dark mode toggle
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
}

export default config
```

### .storybook/preview.tsx

```tsx
import type { Preview } from '@storybook/react'
import '../src/styles/globals.css'  // Tailwind CSS

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0D0D0F' },  // HEPHAITOS BG
      ],
    },
    darkMode: {
      current: 'dark',  // 기본 다크 모드
    },
  },
  decorators: [
    (Story) => (
      <div className="font-sans antialiased">
        <Story />
      </div>
    ),
  ],
}

export default preview
```

---

## 📦 Addons 활용

### 1. Controls (필수)

컴포넌트 props를 실시간으로 변경하여 테스트

```tsx
// 사용자가 UI에서 직접 variant 변경 가능
export const Interactive: Story = {
  args: {
    variant: 'primary',
    size: 'md',
  },
}
```

### 2. Actions (필수)

이벤트 핸들러 로깅

```tsx
export const WithClick: Story = {
  args: {
    onClick: () => console.log('Clicked!'),
  },
}
// Storybook Actions 탭에서 이벤트 확인 가능
```

### 3. Accessibility (a11y)

WCAG 2.1 AA 준수 검증

- 색상 대비 체크
- ARIA 속성 검증
- 키보드 네비게이션 테스트

### 4. Dark Mode

다크/라이트 모드 토글 (HEPHAITOS는 다크 전용)

---

## 🎯 Best Practices

### DO ✅

1. **모든 variant 문서화**
   ```tsx
   export const AllVariants: Story = {
     render: () => (
       <div className="space-y-2">
         <Button variant="primary">Primary</Button>
         <Button variant="secondary">Secondary</Button>
       </div>
     ),
   }
   ```

2. **실전 예시 제공**
   ```tsx
   export const LoginForm: Story = {
     render: () => (
       <form>
         <Input label="Email" type="email" />
         <Input label="Password" type="password" />
         <Button>Login</Button>
       </form>
     ),
   }
   ```

3. **ArgTypes로 props 설명**
   ```tsx
   argTypes: {
     variant: {
       control: 'select',
       options: ['primary', 'secondary'],
       description: '버튼 스타일 variant',
       table: {
         defaultValue: { summary: 'primary' },
       },
     },
   }
   ```

### DON'T ❌

1. **외부 API 호출 금지**
   ```tsx
   // ❌ Storybook에서 API 호출하지 말 것
   export const WithData: Story = {
     render: () => {
       const data = useFetch('/api/data')  // ❌
       return <Component data={data} />
     },
   }
   ```

2. **복잡한 상태 관리 지양**
   ```tsx
   // ❌ Zustand/Redux 사용 지양, mock 데이터 사용
   ```

3. **너무 많은 스토리**
   ```tsx
   // ✅ 대표적인 10-15개 스토리만
   // ❌ 모든 조합 (100개+) 만들지 말 것
   ```

---

## 🚢 배포

### Vercel 배포 (추천)

```bash
# storybook-static/ 자동 배포
vercel deploy --prod
```

### Chromatic 배포 (시각적 회귀 테스트)

```bash
# 1. Chromatic 가입
# 2. 프로젝트 토큰 발급

pnpm add -D chromatic

# 배포 + 시각적 테스트
npx chromatic --project-token=<TOKEN>
```

### GitHub Pages

```yaml
# .github/workflows/storybook.yml
name: Deploy Storybook
on:
  push:
    branches: [main]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm build-storybook
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./storybook-static
```

---

## 🔍 트러블슈팅

### 빌드 에러: "Cannot find module"

**증상**:
```
Error: Cannot find module '@/components/ui/Button'
```

**해결**:
```typescript
// .storybook/main.ts에 경로 설정 추가
import path from 'path'

const config: StorybookConfig = {
  webpackFinal: async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src'),
    }
    return config
  },
}
```

### Tailwind CSS 미적용

**증상**: 스타일이 안 나옴

**해결**: `.storybook/preview.tsx`에서 globals.css import 확인

### Dark Mode 안 됨

**증상**: 배경이 흰색

**해결**:
```tsx
// .storybook/preview.tsx
parameters: {
  backgrounds: {
    default: 'dark',
    values: [{ name: 'dark', value: '#0D0D0F' }],
  },
}
```

---

## 📚 참고 자료

- [Storybook 공식 문서](https://storybook.js.org/docs)
- [Storybook for Next.js](https://storybook.js.org/docs/get-started/nextjs)
- [Addon A11y](https://storybook.js.org/addons/@storybook/addon-a11y)
- [Chromatic](https://www.chromatic.com/)

---

## ✅ 체크리스트

- [x] Storybook 설치 및 설정
- [x] Button, Card, Input 스토리 작성
- [x] 디자인 토큰 문서화
- [x] 소개 페이지 작성
- [ ] 나머지 31개 컴포넌트 스토리 (선택적)
- [ ] Chromatic 연동 (선택적)
- [ ] CI/CD 자동 배포 (선택적)

---

**작성자**: Claude Sonnet 4.5
**최종 수정**: 2025-12-21
