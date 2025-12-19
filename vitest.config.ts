import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'packages/**/__tests__/*.{test,spec}.{js,jsx,ts,tsx}',
    ],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@hephaitos/types': resolve(__dirname, './packages/types/src/hephaitos/index.ts'),
      '@hephaitos/utils': resolve(__dirname, './packages/utils/src/index.ts'),
      '@hephaitos/core': resolve(__dirname, './packages/core/src/index.ts'),
    },
  },
})
