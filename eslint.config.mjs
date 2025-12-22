// ============================================
// ESLint Flat Config (ESLint 9+)
// Frontend & Backend Code Quality Evaluation
// ============================================

import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'playwright-report/**',
      '*.config.js',
      '*.config.mjs',
      'scripts/**/*.js',
    ],
  },

  // Base config for all files
  ...compat.extends('next/core-web-vitals'),

  // TypeScript specific rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Type Safety (CRITICAL)
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',

      // React Best Practices
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Code Quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // Import organization
      'import/order': 'off',
      'import/no-duplicates': 'off',
    },
  },

  // Frontend specific (src/components, src/app pages)
  {
    files: ['src/components/**/*.tsx', 'src/app/**/*.tsx'],
    rules: {
      // Accessibility
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',

      // Performance
      'react/jsx-no-bind': ['warn', {
        allowArrowFunctions: true,
        allowFunctions: false,
        allowBind: false,
      }],
    },
  },

  // Backend specific (API routes)
  {
    files: ['src/app/api/**/*.ts'],
    rules: {
      // Security
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // API Best Practices
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },

  // Test files
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', 'e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
]
