# Contributing to HEPHAITOS

Thank you for your interest in contributing to HEPHAITOS! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, background, or identity.

### Our Standards

**Positive behaviors include:**
- Being respectful and considerate
- Welcoming newcomers and helping them learn
- Accepting constructive criticism gracefully
- Focusing on what's best for the community
- Showing empathy towards others

**Unacceptable behaviors include:**
- Harassment, discrimination, or offensive comments
- Trolling, insulting, or derogatory remarks
- Publishing others' private information
- Any conduct that would be inappropriate in a professional setting

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** 20+ installed
- **Git** for version control
- **Supabase** account (free tier is fine)
- **Claude API** key from Anthropic
- **Upstash Redis** account (for queue system)
- Basic knowledge of TypeScript, React, and Next.js

### Repository Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/hephaitos.git
   cd hephaitos
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-org/hephaitos.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```
6. **Run database migrations**:
   ```bash
   # See QUICK_START.md for Supabase setup
   ```

---

## Development Setup

### Running Locally

```bash
# Start development server
npm run dev
# → http://localhost:3000

# In another terminal, start the backtest worker
npm run worker
```

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage

# Type checking
npm run typecheck
```

### Storybook (Component Development)

```bash
npm run storybook
# → http://localhost:6006
```

---

## How to Contribute

### Types of Contributions

We welcome:

- **Bug fixes** - Fix issues reported in GitHub Issues
- **New features** - Implement features from our roadmap
- **Documentation** - Improve docs, add examples, fix typos
- **Tests** - Add missing tests, improve coverage
- **Performance** - Optimize slow code or large bundles
- **UI/UX** - Improve design, accessibility, user experience

### Finding Work

1. Check [GitHub Issues](https://github.com/your-org/hephaitos/issues) for open tasks
2. Look for issues labeled `good first issue` or `help wanted`
3. Comment on an issue to claim it before starting work
4. If proposing a new feature, open an issue first to discuss

---

## Coding Standards

### TypeScript

- **Strict mode** - No `any` types (use `unknown` if needed)
- **Explicit types** - Don't rely on inference for function returns
- **Interfaces over types** - Prefer `interface` for object shapes
- **Named exports** - Use named exports instead of default exports

**Example:**
```typescript
// ✅ Good
export interface UserProfile {
  id: string;
  email: string;
  credits: number;
}

export function getUserProfile(userId: string): Promise<UserProfile> {
  // ...
}

// ❌ Bad
export default function getUser(id: any) {
  // ...
}
```

### React Components

- **Functional components** - Use function components with hooks
- **Prop types** - Define explicit prop interfaces
- **Memoization** - Use `React.memo` for expensive components
- **Custom hooks** - Extract reusable logic into hooks

**Example:**
```typescript
// ✅ Good
import { memo } from 'react';

interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

export const Button = memo<ButtonProps>(({ variant, onClick, children }) => {
  return (
    <button
      className={cn('btn', `btn-${variant}`)}
      onClick={onClick}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
```

### Styling

- **Tailwind CSS** - Use design tokens from `tailwind.config.ts`
- **No hardcoded colors** - Use color tokens (e.g., `bg-primary` not `bg-[#5E6AD2]`)
- **Glass morphism** - Use `glass-card` or `glass-panel` utility classes
- **Responsive** - All components must work on mobile

**Example:**
```tsx
// ✅ Good
<div className="glass-card bg-surface-glass p-6 rounded-xl">

// ❌ Bad
<div className="bg-[#5E6AD2] bg-opacity-10 p-6">
```

### File Organization

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── features/        # Feature-specific components
│   └── layout/          # Layout components
├── lib/                 # Utilities and helpers
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
└── types/               # TypeScript types
```

### Error Handling

- **Try-catch** - Wrap risky operations
- **User-friendly messages** - Show helpful error messages
- **Logging** - Log errors for debugging (remove sensitive data)

**Example:**
```typescript
try {
  await riskyOperation();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('[Component] Operation failed:', { message });
  toast.error('Failed to complete operation. Please try again.');
}
```

---

## Commit Message Guidelines

We follow **Conventional Commits** for clear, semantic commit history.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no feature change)
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes
- `ci`: CI/CD configuration

### Examples

```bash
feat(credits): add credit purchase flow

Implement TossPayments integration for credit purchases.
Users can now buy credit packages from the dashboard.

Closes #123

---

fix(backtest): resolve race condition in queue worker

The worker was processing jobs before Redis connection was ready.
Added connection check before consuming jobs.

Fixes #456

---

docs(readme): update quick start guide

Add missing Upstash Redis setup instructions.
```

### Rules

- **Subject line**: Max 72 characters, imperative mood ("add" not "added")
- **Body**: Wrap at 72 characters, explain *what* and *why* (not *how*)
- **Footer**: Reference issues with `Closes #123` or `Fixes #456`

---

## Pull Request Process

### Before Submitting

1. **Update from upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. **Run tests**:
   ```bash
   npm run test
   npm run test:e2e
   npm run lint
   npm run typecheck
   ```
3. **Update documentation** if needed
4. **Add tests** for new features

### Submitting PR

1. **Push to your fork**:
   ```bash
   git push origin feature/your-feature
   ```
2. **Open PR** on GitHub with:
   - Clear title following commit message format
   - Description explaining *what* and *why*
   - Screenshots for UI changes
   - Checklist of completed items

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No console warnings or errors
- [ ] Tested on mobile and desktop

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks** must pass (CI, tests, linting)
2. **Code review** by at least one maintainer
3. **Address feedback** - Make requested changes
4. **Approval** - Maintainer approves and merges

---

## Testing

### Unit Tests (Vitest)

Place tests next to source files:

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx
```

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct variant', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');
  });
});
```

### E2E Tests (Playwright)

Place in `e2e/tests/`:

```typescript
import { test, expect } from '@playwright/test';

test('user can purchase credits', async ({ page }) => {
  await page.goto('/dashboard/credits');
  await page.click('text=Buy Credits');
  await expect(page).toHaveURL(/.*checkout/);
});
```

### Coverage Requirements

- **Unit tests**: Aim for 80%+ coverage on critical paths
- **E2E tests**: Cover all P0 user flows
- **Integration tests**: Test API endpoints

---

## Legal Compliance

**CRITICAL**: HEPHAITOS is an educational platform, NOT an investment advisor.

### Rules for Contributors

When adding features:

- **Never** recommend specific stocks or trading actions
- **Never** guarantee returns or performance
- **Always** include disclaimers on trading-related features
- **Always** emphasize educational purpose

### Required Disclaimers

All trading-related UI must include:

```tsx
import { DisclaimerInline } from '@/components/ui/Disclaimer';

<DisclaimerInline />
```

See [BUSINESS_CONSTITUTION.md](./BUSINESS_CONSTITUTION.md) for details.

---

## Questions?

- **General questions**: [GitHub Discussions](https://github.com/your-org/hephaitos/discussions)
- **Bug reports**: [GitHub Issues](https://github.com/your-org/hephaitos/issues)
- **Security issues**: Email security@hephaitos.io (do not file public issue)

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

**Thank you for contributing to HEPHAITOS!** 🎉

We appreciate your time and effort in making this project better for everyone.
