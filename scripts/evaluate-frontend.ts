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

  const { success, output } = runCommand('pnpm eslint src --format json 2>&1')

  try {
    const results = JSON.parse(output)
    let errorCount = 0
    let warningCount = 0

    results.forEach((file: { errorCount: number; warningCount: number }) => {
      errorCount += file.errorCount
      warningCount += file.warningCount
    })

    const score = Math.max(0, 100 - errorCount * 10 - warningCount * 2)

    return {
      category: 'ESLint',
      score: Math.min(100, score),
      maxScore: 100,
      details: [
        `Errors: ${errorCount}`,
        `Warnings: ${warningCount}`,
      ],
      passed: errorCount === 0,
    }
  } catch {
    return {
      category: 'ESLint',
      score: success ? 100 : 50,
      maxScore: 100,
      details: success ? ['검사 완료'] : ['ESLint 실행 오류'],
      passed: success,
    }
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

  // Check for hardcoded colors (should use Tailwind)
  const { output: hexOutput } = runCommand('grep -rE "#[0-9A-Fa-f]{6}" src/components --include="*.tsx" | wc -l')
  const hardcodedColors = parseInt(hexOutput.trim()) || 0

  // Check for inline styles
  const { output: styleOutput } = runCommand('grep -r "style={{" src/components --include="*.tsx" | wc -l')
  const inlineStyles = parseInt(styleOutput.trim()) || 0

  const deductions = hardcodedColors * 5 + inlineStyles * 3
  const score = Math.max(0, 100 - deductions)

  return {
    category: 'Design System',
    score,
    maxScore: 100,
    details: [
      `하드코딩 색상: ${hardcodedColors}개 (권장: 0)`,
      `인라인 스타일: ${inlineStyles}개`,
    ],
    passed: hardcodedColors <= 5 && inlineStyles <= 10,
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
