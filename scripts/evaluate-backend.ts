#!/usr/bin/env npx tsx
// ============================================
// Backend Evaluation Script
// 백엔드 품질 평가 도구
// ============================================

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { resolve, join } from 'path'

interface EvaluationResult {
  category: string
  score: number
  maxScore: number
  details: string[]
  passed: boolean
}

interface BackendReport {
  timestamp: string
  overallScore: number
  results: EvaluationResult[]
  apiEndpoints: APIEndpoint[]
  securityChecks: SecurityCheck[]
  recommendations: string[]
}

interface APIEndpoint {
  path: string
  methods: string[]
  hasAuth: boolean
  hasRateLimit: boolean
  hasValidation: boolean
}

interface SecurityCheck {
  name: string
  passed: boolean
  details: string
}

const REPORT_DIR = resolve(process.cwd(), 'reports')
const API_DIR = resolve(process.cwd(), 'src/app/api')

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

function getAllAPIRoutes(dir: string, basePath = ''): string[] {
  const routes: string[] = []

  if (!existsSync(dir)) return routes

  const items = readdirSync(dir)

  for (const item of items) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      routes.push(...getAllAPIRoutes(fullPath, `${basePath}/${item}`))
    } else if (item === 'route.ts') {
      routes.push(basePath || '/')
    }
  }

  return routes
}

// ============================================
// Evaluation Functions
// ============================================

function evaluateAPIStructure(): EvaluationResult {
  printSection('API Structure')

  const routes = getAllAPIRoutes(API_DIR)
  const endpoints: APIEndpoint[] = []

  for (const route of routes) {
    const routePath = join(API_DIR, route, 'route.ts')
    if (!existsSync(routePath)) continue

    const content = readFileSync(routePath, 'utf-8')

    const methods: string[] = []
    if (content.includes('export async function GET')) methods.push('GET')
    if (content.includes('export async function POST')) methods.push('POST')
    if (content.includes('export async function PUT')) methods.push('PUT')
    if (content.includes('export async function DELETE')) methods.push('DELETE')
    if (content.includes('export async function PATCH')) methods.push('PATCH')

    endpoints.push({
      path: `/api${route}`,
      methods,
      hasAuth: content.includes('getUser') || content.includes('session') || content.includes('auth'),
      hasRateLimit: content.includes('rateLimit') || content.includes('RateLimiter'),
      hasValidation: content.includes('zod') || content.includes('.parse(') || content.includes('schema'),
    })
  }

  const authCount = endpoints.filter(e => e.hasAuth).length
  const rateLimitCount = endpoints.filter(e => e.hasRateLimit).length
  const validationCount = endpoints.filter(e => e.hasValidation).length

  const score = Math.round(
    (authCount / Math.max(1, endpoints.length)) * 40 +
    (rateLimitCount / Math.max(1, endpoints.length)) * 30 +
    (validationCount / Math.max(1, endpoints.length)) * 30
  )

  return {
    category: 'API Structure',
    score,
    maxScore: 100,
    details: [
      `총 API 엔드포인트: ${endpoints.length}개`,
      `인증 적용: ${authCount}개 (${((authCount / Math.max(1, endpoints.length)) * 100).toFixed(0)}%)`,
      `Rate Limit: ${rateLimitCount}개 (${((rateLimitCount / Math.max(1, endpoints.length)) * 100).toFixed(0)}%)`,
      `입력 검증: ${validationCount}개 (${((validationCount / Math.max(1, endpoints.length)) * 100).toFixed(0)}%)`,
    ],
    passed: score >= 60,
  }
}

function evaluateSecurity(): EvaluationResult {
  printSection('Security Analysis')

  const checks: SecurityCheck[] = []

  // Check for SQL injection patterns
  const { output: sqlOutput } = runCommand('grep -rE "\\$\\{.*\\}" src/app/api --include="*.ts" | grep -v "template" | wc -l')
  const templateLiterals = parseInt(sqlOutput.trim()) || 0
  checks.push({
    name: 'SQL Injection Prevention',
    passed: templateLiterals < 50,
    details: `템플릿 리터럴 사용: ${templateLiterals}개`,
  })

  // Check for eval usage
  const { output: evalOutput } = runCommand('grep -r "eval(" src/app/api --include="*.ts" | wc -l')
  const evalUsage = parseInt(evalOutput.trim()) || 0
  checks.push({
    name: 'No eval() Usage',
    passed: evalUsage === 0,
    details: evalUsage === 0 ? 'eval() 사용 없음' : `eval() 사용: ${evalUsage}개`,
  })

  // Check for secret exposure
  const { output: secretOutput } = runCommand('grep -rE "(password|secret|key)\\s*=\\s*[\"\\x27][^\"\\x27]+" src/app/api --include="*.ts" | wc -l')
  const hardcodedSecrets = parseInt(secretOutput.trim()) || 0
  checks.push({
    name: 'No Hardcoded Secrets',
    passed: hardcodedSecrets < 5,
    details: hardcodedSecrets < 5 ? '하드코딩된 시크릿 없음' : `의심 패턴: ${hardcodedSecrets}개`,
  })

  // Check for environment variable usage
  const { output: envOutput } = runCommand('grep -r "process.env" src/app/api --include="*.ts" | wc -l')
  const envUsage = parseInt(envOutput.trim()) || 0
  checks.push({
    name: 'Environment Variables',
    passed: envUsage > 0,
    details: `환경변수 사용: ${envUsage}개`,
  })

  // Check for error handling
  const { output: catchOutput } = runCommand('grep -r "catch" src/app/api --include="*.ts" | wc -l')
  const catchCount = parseInt(catchOutput.trim()) || 0
  checks.push({
    name: 'Error Handling',
    passed: catchCount > 10,
    details: `catch 블록: ${catchCount}개`,
  })

  const passedCount = checks.filter(c => c.passed).length
  const score = Math.round((passedCount / checks.length) * 100)

  return {
    category: 'Security',
    score,
    maxScore: 100,
    details: checks.map(c => `${c.passed ? '✓' : '✗'} ${c.name}: ${c.details}`),
    passed: score >= 80,
  }
}

function evaluateErrorHandling(): EvaluationResult {
  printSection('Error Handling')

  // Check for try-catch patterns
  const { output: tryOutput } = runCommand('grep -r "try {" src/app/api --include="*.ts" | wc -l')
  const tryBlocks = parseInt(tryOutput.trim()) || 0

  // Check for NextResponse error handling
  const { output: responseOutput } = runCommand('grep -r "NextResponse.json.*error" src/app/api --include="*.ts" | wc -l')
  const errorResponses = parseInt(responseOutput.trim()) || 0

  // Check for logging
  const { output: logOutput } = runCommand('grep -rE "console\\.(error|warn|log)" src/app/api --include="*.ts" | wc -l')
  const logStatements = parseInt(logOutput.trim()) || 0

  const routes = getAllAPIRoutes(API_DIR)
  const routeCount = routes.length

  const errorHandlingRatio = routeCount > 0 ? tryBlocks / routeCount : 0
  const score = Math.min(100, Math.round(errorHandlingRatio * 50 + (errorResponses > 10 ? 30 : errorResponses * 3) + Math.min(20, logStatements)))

  return {
    category: 'Error Handling',
    score,
    maxScore: 100,
    details: [
      `try-catch 블록: ${tryBlocks}개`,
      `에러 응답: ${errorResponses}개`,
      `로깅: ${logStatements}개`,
    ],
    passed: score >= 60,
  }
}

function evaluateAPITests(): EvaluationResult {
  printSection('API Tests')

  const { output: testOutput } = runCommand('find src/__tests__/api -name "*.test.ts" 2>/dev/null | wc -l')
  const apiTestCount = parseInt(testOutput.trim()) || 0

  const { output: e2eOutput } = runCommand('find e2e -name "*.spec.ts" 2>/dev/null | wc -l')
  const e2eTestCount = parseInt(e2eOutput.trim()) || 0

  const routes = getAllAPIRoutes(API_DIR)
  const routeCount = routes.length

  const unitCoverage = routeCount > 0 ? (apiTestCount / routeCount) * 100 : 0
  const score = Math.min(100, Math.round(unitCoverage + e2eTestCount * 2))

  return {
    category: 'API Tests',
    score,
    maxScore: 100,
    details: [
      `API 단위 테스트: ${apiTestCount}개`,
      `E2E 테스트: ${e2eTestCount}개`,
      `API 엔드포인트: ${routeCount}개`,
      `커버리지: ${unitCoverage.toFixed(1)}%`,
    ],
    passed: unitCoverage >= 30,
  }
}

function evaluateTypeScriptBackend(): EvaluationResult {
  printSection('Backend TypeScript')

  const { success, output } = runCommand('pnpm tsc --noEmit 2>&1')

  // Filter for API-specific errors
  const apiErrors = (output.match(/src\/app\/api.*error TS\d+/g) || []).length
  const score = Math.max(0, 100 - apiErrors * 10)

  return {
    category: 'Backend TypeScript',
    score,
    maxScore: 100,
    details: apiErrors === 0
      ? ['API 코드 타입 검사 통과']
      : [`API 타입 오류: ${apiErrors}개`],
    passed: apiErrors === 0,
  }
}

function evaluateDatabase(): EvaluationResult {
  printSection('Database Integration')

  // Check for Supabase usage
  const { output: supabaseOutput } = runCommand('grep -r "supabase" src/app/api --include="*.ts" | wc -l')
  const supabaseUsage = parseInt(supabaseOutput.trim()) || 0

  // Check for proper query patterns
  const { output: selectOutput } = runCommand('grep -r "\\.select(" src/app/api --include="*.ts" | wc -l')
  const selectCount = parseInt(selectOutput.trim()) || 0

  // Check for RLS awareness
  const { output: rlsOutput } = runCommand('grep -rE "(eq|neq|gt|lt)\\(.*user" src/app/api --include="*.ts" | wc -l')
  const rlsFilters = parseInt(rlsOutput.trim()) || 0

  const score = Math.min(100, supabaseUsage > 0 ? 40 : 0 + selectCount * 2 + rlsFilters * 5)

  return {
    category: 'Database',
    score,
    maxScore: 100,
    details: [
      `Supabase 사용: ${supabaseUsage}개`,
      `Select 쿼리: ${selectCount}개`,
      `RLS 필터: ${rlsFilters}개`,
    ],
    passed: supabaseUsage > 0,
  }
}

function evaluatePerformance(): EvaluationResult {
  printSection('Performance Patterns')

  // Check for caching
  const { output: cacheOutput } = runCommand('grep -rE "(cache|Cache|redis|Redis)" src/app/api --include="*.ts" | wc -l')
  const cacheUsage = parseInt(cacheOutput.trim()) || 0

  // Check for pagination
  const { output: paginationOutput } = runCommand('grep -rE "(limit|offset|page|cursor)" src/app/api --include="*.ts" | wc -l')
  const paginationUsage = parseInt(paginationOutput.trim()) || 0

  // Check for streaming
  const { output: streamOutput } = runCommand('grep -r "stream" src/app/api --include="*.ts" | wc -l')
  const streamUsage = parseInt(streamOutput.trim()) || 0

  const score = Math.min(100, 30 + cacheUsage * 5 + paginationUsage * 3 + streamUsage * 10)

  return {
    category: 'Performance',
    score,
    maxScore: 100,
    details: [
      `캐싱: ${cacheUsage}개`,
      `페이지네이션: ${paginationUsage}개`,
      `스트리밍: ${streamUsage}개`,
    ],
    passed: score >= 50,
  }
}

// ============================================
// Main Execution
// ============================================

async function main() {
  console.log('\n🔧 HEPHAITOS Backend Evaluation')
  console.log('='.repeat(50))
  console.log(`Started at: ${new Date().toISOString()}`)

  const results: EvaluationResult[] = []

  // Run all evaluations
  results.push(evaluateTypeScriptBackend())
  results.push(evaluateAPIStructure())
  results.push(evaluateSecurity())
  results.push(evaluateErrorHandling())
  results.push(evaluateAPITests())
  results.push(evaluateDatabase())
  results.push(evaluatePerformance())

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
  console.log(`\n  📊 Backend Score: ${overallScore}/100 (Grade: ${grade})`)

  // Recommendations
  const recommendations: string[] = []
  if (results.find(r => r.category === 'Security' && !r.passed)) {
    recommendations.push('보안 취약점 점검 필요')
  }
  if (results.find(r => r.category === 'API Tests' && !r.passed)) {
    recommendations.push('API 테스트 커버리지 증가 필요')
  }
  if (results.find(r => r.category === 'Error Handling' && !r.passed)) {
    recommendations.push('에러 핸들링 개선 필요')
  }
  if (results.find(r => r.category === 'Performance' && !r.passed)) {
    recommendations.push('성능 최적화 패턴 적용 권장')
  }

  if (recommendations.length > 0) {
    printSection('Recommendations')
    recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`))
  }

  // API Endpoints summary
  const routes = getAllAPIRoutes(API_DIR)
  printSection('API Endpoints')
  console.log(`  Total: ${routes.length} endpoints`)
  routes.slice(0, 10).forEach(r => console.log(`  - /api${r}`))
  if (routes.length > 10) {
    console.log(`  ... and ${routes.length - 10} more`)
  }

  // Save report
  if (!existsSync(REPORT_DIR)) {
    mkdirSync(REPORT_DIR, { recursive: true })
  }

  const report: BackendReport = {
    timestamp: new Date().toISOString(),
    overallScore,
    results,
    apiEndpoints: [],
    securityChecks: [],
    recommendations,
  }

  const reportPath = resolve(REPORT_DIR, `backend-${Date.now()}.json`)
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📄 Report saved: ${reportPath}`)

  // Exit with appropriate code
  process.exit(overallScore >= 70 ? 0 : 1)
}

main().catch(console.error)
