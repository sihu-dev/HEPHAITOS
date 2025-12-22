// ============================================
// ESLint Flat Config (ESLint 9+)
// Frontend & Backend Code Quality Evaluation
// ============================================

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

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
      'reports/**',
      '*.config.js',
      '*.config.mjs',
      'scripts/**/*.js',
      'packages/**/dist/**',
    ],
  },

  // Base JavaScript config
  js.configs.recommended,

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLSpanElement: 'readonly',
        HTMLHeadingElement: 'readonly',
        HTMLParagraphElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLLabelElement: 'readonly',
        HTMLAnchorElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLAudioElement: 'readonly',
        Node: 'readonly',
        Element: 'readonly',
        Document: 'readonly',
        DocumentFragment: 'readonly',
        NodeList: 'readonly',
        DOMRect: 'readonly',
        DOMRectReadOnly: 'readonly',
        screen: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        AbortController: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        RequestInit: 'readonly',
        Headers: 'readonly',
        // Node.js globals (for API routes)
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        // Web Crypto API
        crypto: 'readonly',
        // WebSocket
        WebSocket: 'readonly',
        // React (for JSX)
        React: 'readonly',
        JSX: 'readonly',
        // Additional browser APIs
        Intl: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        WeakMap: 'readonly',
        WeakSet: 'readonly',
        Promise: 'readonly',
        Proxy: 'readonly',
        Reflect: 'readonly',
        Symbol: 'readonly',
        Array: 'readonly',
        Object: 'readonly',
        String: 'readonly',
        Number: 'readonly',
        Boolean: 'readonly',
        Date: 'readonly',
        Math: 'readonly',
        JSON: 'readonly',
        RegExp: 'readonly',
        Error: 'readonly',
        TypeError: 'readonly',
        SyntaxError: 'readonly',
        ReferenceError: 'readonly',
        RangeError: 'readonly',
        EvalError: 'readonly',
        URIError: 'readonly',
        // NodeJS
        NodeJS: 'readonly',
        // Audio/Video
        Audio: 'readonly',
        AudioContext: 'readonly',
        MediaStream: 'readonly',
        // Performance
        performance: 'readonly',
        PerformanceObserver: 'readonly',
        // Other common browser APIs
        atob: 'readonly',
        btoa: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        ReadableStream: 'readonly',
        WritableStream: 'readonly',
        TransformStream: 'readonly',
        EventSource: 'readonly',
        MessageChannel: 'readonly',
        MessagePort: 'readonly',
        Worker: 'readonly',
        SharedWorker: 'readonly',
        ServiceWorker: 'readonly',
        Notification: 'readonly',
        history: 'readonly',
        location: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        open: 'readonly',
        close: 'readonly',
        queueMicrotask: 'readonly',
        structuredClone: 'readonly',
        // Additional DOM APIs
        TouchEvent: 'readonly',
        PointerEvent: 'readonly',
        DragEvent: 'readonly',
        FocusEvent: 'readonly',
        InputEvent: 'readonly',
        CompositionEvent: 'readonly',
        WheelEvent: 'readonly',
        AnimationEvent: 'readonly',
        TransitionEvent: 'readonly',
        MediaQueryList: 'readonly',
        MediaQueryListEvent: 'readonly',
        ClipboardEvent: 'readonly',
        DataTransfer: 'readonly',
        MessageEvent: 'readonly',
        StorageEvent: 'readonly',
        BeforeUnloadEvent: 'readonly',
        PopStateEvent: 'readonly',
        HashChangeEvent: 'readonly',
        PageTransitionEvent: 'readonly',
        ProgressEvent: 'readonly',
        ErrorEvent: 'readonly',
        SubmitEvent: 'readonly',
        // Canvas
        CanvasRenderingContext2D: 'readonly',
        ImageData: 'readonly',
        Path2D: 'readonly',
        // WebGL
        WebGLRenderingContext: 'readonly',
        WebGL2RenderingContext: 'readonly',
        // SVG
        SVGElement: 'readonly',
        SVGSVGElement: 'readonly',
        // Range/Selection
        Range: 'readonly',
        Selection: 'readonly',
        // Geolocation
        Geolocation: 'readonly',
        GeolocationPosition: 'readonly',
        // IndexedDB
        indexedDB: 'readonly',
        IDBDatabase: 'readonly',
        // CSS
        CSSStyleDeclaration: 'readonly',
        getComputedStyle: 'readonly',
        matchMedia: 'readonly',
        // Infinity/NaN
        Infinity: 'readonly',
        NaN: 'readonly',
        undefined: 'readonly',
        isNaN: 'readonly',
        isFinite: 'readonly',
        parseInt: 'readonly',
        parseFloat: 'readonly',
        encodeURI: 'readonly',
        encodeURIComponent: 'readonly',
        decodeURI: 'readonly',
        decodeURIComponent: 'readonly',
        // Testing globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        vi: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooks,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'no-unused-vars': 'off', // Use TypeScript version

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Code Quality
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // Security
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },

  // Frontend components - stricter rules
  {
    files: ['src/components/**/*.tsx', 'src/app/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // API routes - backend specific
  {
    files: ['src/app/api/**/*.ts'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },

  // Test files - relaxed rules
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', 'e2e/**/*.ts', 'tests/**/*.ts', 'src/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      'no-undef': 'off', // Tests have their own environment
    },
  },
]
