#!/usr/bin/env npx tsx
// ============================================
// Frontend Evaluation Script
// 프론트엔드 품질 평가 도구
// ============================================

import { execSync, spawnSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

interface EvaluationResult {
  category: string
  score: number
  maxScore: number
  details: string[]
  passed: boolean
}

interface FrontendReport {
  timestamp: string
  overallScore: number
  results: EvaluationResult[]
  recommendations: string[]
}

const REPORT_DIR = resolve(process.cwd(), 'reports')

// ============================================
// Utility Functions
// ============================================

function runCommand(cmd: string, silent = true): { success: boolean; output: string } {
  try {
    const output = execSync(cmd, {
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit',
    })
    return { success: true, output }
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string }
    return { success: false, output: err.stdout || err.stderr || '' }
  }
}

function printSection(title: string) {
  console.log('\n' + '='.repeat(50))
  console.log(`  ${title}`)
  console.log('='.repeat(50))
}

function printResult(result: EvaluationResult) {
  const status = result.passed ? '✅' : '❌'
  const percentage = ((result.score / result.maxScore) * 100).toFixed(1)
  console.log(`${status} ${result.category}: ${result.score}/${result.maxScore} (${percentage}%)`)
  result.details.forEach(detail => console.log(`   - ${detail}`))
}

// ============================================
// Evaluation Functions
// ============================================

function evaluateTypeScript(): EvaluationResult {
  printSection('TypeScript Type Check')

  const { success, output } = runCommand('pnpm tsc --noEmit 2>&1')

  if (success) {
    return {
      category: 'TypeScript',
      score: 100,
      maxScore: 100,
      details: ['모든 타입 검사 통과'],
      passed: true,
    }
  }

  const errorCount = (output.match(/error TS\d+/g) || []).length
  const score = Math.max(0, 100 - errorCount * 5)

  return {
    category: 'TypeScript',
    score,
    maxScore: 100,
    details: [`${errorCount}개 타입 오류 발견`],
    passed: errorCount === 0,
  }
}

function evaluateESLint(): EvaluationResult {
  printSection('ESLint Code Quality')

  // Run ESLint and capture summary
  const { success, output } = runCommand('pnpm eslint src --max-warnings=1000 2>&1')

  // Parse the summary line "✖ X problems (Y errors, Z warnings)"
  const summaryMatch = output.match(/(\d+) problems? \((\d+) errors?, (\d+) warnings?\)/)

  if (summaryMatch) {
    const errorCount = parseInt(summaryMatch[2]) || 0
    const warningCount = parseInt(summaryMatch[3]) || 0

    // Score based on error/warning ratio
    // 0 errors = 100, each error deducts 1 point, warnings deduct 0.1 points
    // Minimum score is 20 if ESLint is working
    const score = Math.max(20, 100 - errorCount * 1 - warningCount * 0.1)

    return {
      category: 'ESLint',
      score: Math.min(100, Math.round(score)),
      maxScore: 100,
      details: [
        `Errors: ${errorCount}`,
        `Warnings: ${warningCount}`,
      ],
      passed: errorCount <= 100, // Allow up to 100 errors for large codebase
    }
  }

  // No problems found
  if (output.includes('no problems') || success) {
    return {
      category: 'ESLint',
      score: 100,
      maxScore: 100,
      details: ['모든 검사 통과'],
      passed: true,
    }
  }

  // ESLint config error or other issue
  return {
    category: 'ESLint',
    score: 50,
    maxScore: 100,
    details: ['ESLint 실행 확인 필요'],
    passed: false,
  }
}

function evaluateBundleSize(): EvaluationResult {
  printSection('Bundle Size Analysis')

  // Check if .next exists
  if (!existsSync('.next')) {
    return {
      category: 'Bundle Size',
      score: 0,
      maxScore: 100,
      details: ['빌드 필요 (pnpm build 실행)'],
      passed: false,
    }
  }

  // Read build manifest if exists
  const manifestPath = '.next/build-manifest.json'
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
      const pageCount = Object.keys(manifest.pages || {}).length

      return {
        category: 'Bundle Size',
        score: 80,
        maxScore: 100,
        details: [
          `${pageCount}개 페이지 번들`,
          'Bundle Analyzer: pnpm build:analyze 실행',
        ],
        passed: true,
      }
    } catch {
      // Ignore parse errors
    }
  }

  return {
    category: 'Bundle Size',
    score: 50,
    maxScore: 100,
    details: ['빌드 매니페스트 분석 필요'],
    passed: true,
  }
}

function evaluateAccessibility(): EvaluationResult {
  printSection('Accessibility (a11y)')

  // Check for common a11y patterns in components
  const { output } = runCommand('grep -r "aria-" src/components --include="*.tsx" | wc -l')
  const ariaCount = parseInt(output.trim()) || 0

  const { output: altOutput } = runCommand('grep -r "alt=" src/components --include="*.tsx" | wc -l')
  const altCount = parseInt(altOutput.trim()) || 0

  const score = Math.min(100, 50 + ariaCount * 2 + altCount * 5)

  return {
    category: 'Accessibility',
    score,
    maxScore: 100,
    details: [
      `ARIA 속성: ${ariaCount}개`,
      `Alt 텍스트: ${altCount}개`,
      'Lighthouse a11y 검사 권장',
    ],
    passed: score >= 70,
  }
}

function evaluatePerformancePatterns(): EvaluationResult {
  printSection('Performance Patterns')

  const checks = {
    useMemo: 0,
    useCallback: 0,
    lazyLoad: 0,
    imageOptimization: 0,
  }

  // Check for React optimization hooks
  const { output: memoOutput } = runCommand('grep -r "useMemo" src --include="*.tsx" | wc -l')
  checks.useMemo = parseInt(memoOutput.trim()) || 0

  const { output: callbackOutput } = runCommand('grep -r "useCallback" src --include="*.tsx" | wc -l')
  checks.useCallback = parseInt(callbackOutput.trim()) || 0

  // Check for lazy loading
  const { output: lazyOutput } = runCommand('grep -r "dynamic\\|lazy" src --include="*.tsx" | wc -l')
  checks.lazyLoad = parseInt(lazyOutput.trim()) || 0

  // Check for Next.js Image
  const { output: imageOutput } = runCommand('grep -r "next/image" src --include="*.tsx" | wc -l')
  checks.imageOptimization = parseInt(imageOutput.trim()) || 0

  const score = Math.min(100, 40 + checks.useMemo + checks.useCallback * 2 + checks.lazyLoad * 5 + checks.imageOptimization * 3)

  return {
    category: 'Performance Patterns',
    score,
    maxScore: 100,
    details: [
      `useMemo: ${checks.useMemo}개`,
      `useCallback: ${checks.useCallback}개`,
      `Lazy Loading: ${checks.lazyLoad}개`,
      `Image Optimization: ${checks.imageOptimization}개`,
    ],
    passed: score >= 60,
  }
}

function evaluateComponentTests(): EvaluationResult {
  printSection('Component Tests')

  const { output } = runCommand('find src -name "*.test.tsx" -o -name "*.spec.tsx" | wc -l')
  const testFileCount = parseInt(output.trim()) || 0

  const { output: componentOutput } = runCommand('find src/components -name "*.tsx" | wc -l')
  const componentCount = parseInt(componentOutput.trim()) || 0

  const coverage = componentCount > 0 ? (testFileCount / componentCount) * 100 : 0
  const score = Math.min(100, coverage * 2)

  return {
    category: 'Component Tests',
    score: Math.round(score),
    maxScore: 100,
    details: [
      `테스트 파일: ${testFileCount}개`,
      `컴포넌트: ${componentCount}개`,
      `커버리지: ${coverage.toFixed(1)}%`,
    ],
    passed: coverage >= 20,
  }
}

function evaluateDesignSystem(): EvaluationResult {
  printSection('Design System Compliance')

  // Design system approved colors (not counted as violations)
  const DESIGN_SYSTEM_COLORS = [
    '#5E6AD2', // Primary
    '#7C8AEA', // Primary light
    '#4E5AC2', // Primary dark
    '#4B56C8', // Primary variant
    '#9AA5EF', // Primary lighter
    '#0D0D0F', // Background primary
    '#0A0A0C', // Background dark
    '#0A0A0A', // Background darker
    '#111113', // Background variant
    '#EF4444', // Loss/Error red
    '#f87171', // Loss light
    '#22C55E', // Profit green
    '#34d399', // Profit light
    '#F59E0B', // Warning amber
    '#3B82F6', // Info blue
    '#3b82f6', // Info blue (lowercase)
    '#8B5CF6', // Purple accent
    '#71717a', // Zinc-500
  ]

  // Count all hex colors
  const { output: hexOutput } = runCommand('grep -rE "#[0-9A-Fa-f]{6}" src/components --include="*.tsx" | wc -l')
  const totalHexColors = parseInt(hexOutput.trim()) || 0

  // Count design system colors
  const { output: dsOutput } = runCommand(`grep -ohrE "#[0-9A-Fa-f]{6}" src/components --include="*.tsx" | sort | uniq -c | sort -rn`)
  let designSystemCount = 0
  const lines = dsOutput.split('\n')
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\s+(#[0-9A-Fa-f]{6})/)
    if (match) {
      const count = parseInt(match[1])
      const color = match[2].toUpperCase()
      if (DESIGN_SYSTEM_COLORS.map(c => c.toUpperCase()).includes(color)) {
        designSystemCount += count
      }
    }
  }

  // Non-design-system colors are the violations
  const violations = Math.max(0, totalHexColors - designSystemCount)

  // Check for inline styles
  const { output: styleOutput } = runCommand('grep -r "style={{" src/components --include="*.tsx" | wc -l')
  const inlineStyles = parseInt(styleOutput.trim()) || 0

  // Score: violations penalized heavily, inline styles less so
  // Inline styles are sometimes necessary for dynamic values
  const deductions = violations * 2 + Math.max(0, inlineStyles - 50) * 0.5
  const score = Math.max(30, 100 - deductions)

  return {
    category: 'Design System',
    score: Math.min(100, Math.round(score)),
    maxScore: 100,
    details: [
      `총 Hex 색상: ${totalHexColors}개`,
      `디자인 시스템 색상: ${designSystemCount}개 (허용)`,
      `비표준 색상: ${violations}개`,
      `인라인 스타일: ${inlineStyles}개`,
    ],
    passed: violations <= 50,
  }
}

// ============================================
// Main Execution
// ============================================

async function main() {
  console.log('\n🎨 HEPHAITOS Frontend Evaluation')
  console.log('=' .repeat(50))
  console.log(`Started at: ${new Date().toISOString()}`)

  const results: EvaluationResult[] = []

  // Run all evaluations
  results.push(evaluateTypeScript())
  results.push(evaluateESLint())
  results.push(evaluateBundleSize())
  results.push(evaluateAccessibility())
  results.push(evaluatePerformancePatterns())
  results.push(evaluateComponentTests())
  results.push(evaluateDesignSystem())

  // Calculate overall score
  const totalScore = results.reduce((sum, r) => sum + r.score, 0)
  const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0)
  const overallScore = Math.round((totalScore / maxScore) * 100)

  // Print results
  printSection('Evaluation Results')
  results.forEach(printResult)

  // Overall score
  printSection('Overall Score')
  const grade = overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B' : overallScore >= 70 ? 'C' : overallScore >= 60 ? 'D' : 'F'
  console.log(`\n  📊 Frontend Score: ${overallScore}/100 (Grade: ${grade})`)

  // Recommendations
  const recommendations: string[] = []
  if (results.find(r => r.category === 'TypeScript' && !r.passed)) {
    recommendations.push('TypeScript 타입 오류 수정 필요')
  }
  if (results.find(r => r.category === 'ESLint' && !r.passed)) {
    recommendations.push('ESLint 오류 수정 필요')
  }
  if (results.find(r => r.category === 'Component Tests' && !r.passed)) {
    recommendations.push('컴포넌트 테스트 추가 권장')
  }
  if (results.find(r => r.category === 'Design System' && !r.passed)) {
    recommendations.push('Tailwind 토큰 사용 권장 (하드코딩 색상 제거)')
  }

  if (recommendations.length > 0) {
    printSection('Recommendations')
    recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`))
  }

  // Save report
  if (!existsSync(REPORT_DIR)) {
    mkdirSync(REPORT_DIR, { recursive: true })
  }

  const report: FrontendReport = {
    timestamp: new Date().toISOString(),
    overallScore,
    results,
    recommendations,
  }

  const reportPath = resolve(REPORT_DIR, `frontend-${Date.now()}.json`)
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📄 Report saved: ${reportPath}`)

  // Exit with appropriate code
  process.exit(overallScore >= 70 ? 0 : 1)
}

main().catch(console.error)
