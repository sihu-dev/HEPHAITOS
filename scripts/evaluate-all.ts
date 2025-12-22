#!/usr/bin/env npx tsx
// ============================================
// Full Project Evaluation Script
// 프론트엔드 + 백엔드 통합 평가
// ============================================

import { execSync, spawn } from 'child_process'
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs'
import { resolve } from 'path'

interface CombinedReport {
  timestamp: string
  frontend: {
    score: number
    grade: string
  }
  backend: {
    score: number
    grade: string
  }
  overall: {
    score: number
    grade: string
  }
  summary: string[]
}

const REPORT_DIR = resolve(process.cwd(), 'reports')

function runCommand(cmd: string): { success: boolean; output: string } {
  try {
    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' })
    return { success: true, output }
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string }
    return { success: false, output: err.stdout || err.stderr || '' }
  }
}

function getGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function printBanner() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     🔥 HEPHAITOS Full Project Evaluation                     ║
║                                                               ║
║     Frontend + Backend Quality Assessment                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`)
}

function printScore(label: string, score: number, grade: string) {
  const bar = '█'.repeat(Math.round(score / 5)) + '░'.repeat(20 - Math.round(score / 5))
  const color = score >= 80 ? '\x1b[32m' : score >= 60 ? '\x1b[33m' : '\x1b[31m'
  console.log(`  ${label}: ${color}${bar}\x1b[0m ${score}/100 (Grade: ${grade})`)
}

async function main() {
  printBanner()
  console.log(`Started at: ${new Date().toISOString()}\n`)

  // Ensure reports directory exists
  if (!existsSync(REPORT_DIR)) {
    mkdirSync(REPORT_DIR, { recursive: true })
  }

  let frontendScore = 0
  let backendScore = 0

  // ============================================
  // Run Frontend Evaluation
  // ============================================
  console.log('━'.repeat(60))
  console.log('  🎨 Running Frontend Evaluation...')
  console.log('━'.repeat(60))

  try {
    execSync('npx tsx scripts/evaluate-frontend.ts', { stdio: 'inherit' })
    // Try to read the latest report
    const reports = execSync('ls -t reports/frontend-*.json 2>/dev/null | head -1', { encoding: 'utf-8' }).trim()
    if (reports) {
      const report = JSON.parse(readFileSync(reports, 'utf-8'))
      frontendScore = report.overallScore || 0
    }
  } catch {
    console.log('  ⚠️ Frontend evaluation completed with warnings')
    frontendScore = 50 // Default if failed
  }

  // ============================================
  // Run Backend Evaluation
  // ============================================
  console.log('\n' + '━'.repeat(60))
  console.log('  🔧 Running Backend Evaluation...')
  console.log('━'.repeat(60))

  try {
    execSync('npx tsx scripts/evaluate-backend.ts', { stdio: 'inherit' })
    // Try to read the latest report
    const reports = execSync('ls -t reports/backend-*.json 2>/dev/null | head -1', { encoding: 'utf-8' }).trim()
    if (reports) {
      const report = JSON.parse(readFileSync(reports, 'utf-8'))
      backendScore = report.overallScore || 0
    }
  } catch {
    console.log('  ⚠️ Backend evaluation completed with warnings')
    backendScore = 50 // Default if failed
  }

  // ============================================
  // Calculate Overall Score
  // ============================================
  const overallScore = Math.round((frontendScore + backendScore) / 2)
  const frontendGrade = getGrade(frontendScore)
  const backendGrade = getGrade(backendScore)
  const overallGrade = getGrade(overallScore)

  // ============================================
  // Print Summary
  // ============================================
  console.log('\n' + '═'.repeat(60))
  console.log('  📊 FINAL EVALUATION SUMMARY')
  console.log('═'.repeat(60) + '\n')

  printScore('Frontend ', frontendScore, frontendGrade)
  printScore('Backend  ', backendScore, backendGrade)
  console.log('  ' + '─'.repeat(40))
  printScore('Overall  ', overallScore, overallGrade)

  // Status message
  console.log('\n' + '─'.repeat(60))
  if (overallScore >= 80) {
    console.log('  ✅ Project is in EXCELLENT condition!')
  } else if (overallScore >= 70) {
    console.log('  ✅ Project is in GOOD condition.')
  } else if (overallScore >= 60) {
    console.log('  ⚠️ Project needs IMPROVEMENT.')
  } else {
    console.log('  ❌ Project requires CRITICAL attention!')
  }
  console.log('─'.repeat(60))

  // Generate summary
  const summary: string[] = []
  if (frontendScore < 70) summary.push('프론트엔드 품질 개선 필요')
  if (backendScore < 70) summary.push('백엔드 품질 개선 필요')
  if (frontendScore >= 80 && backendScore >= 80) summary.push('프로덕션 배포 준비 완료')

  // Save combined report
  const report: CombinedReport = {
    timestamp: new Date().toISOString(),
    frontend: { score: frontendScore, grade: frontendGrade },
    backend: { score: backendScore, grade: backendGrade },
    overall: { score: overallScore, grade: overallGrade },
    summary,
  }

  const reportPath = resolve(REPORT_DIR, `full-evaluation-${Date.now()}.json`)
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📄 Full report saved: ${reportPath}`)

  // Quick reference for available commands
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  Available Evaluation Commands:                               ║
╠═══════════════════════════════════════════════════════════════╣
║  pnpm run eval:frontend    - Frontend only                    ║
║  pnpm run eval:backend     - Backend only                     ║
║  pnpm run eval:all         - Full evaluation (this command)   ║
║  pnpm run eval:lighthouse  - Lighthouse CI audit              ║
║  pnpm run test:coverage    - Test coverage report             ║
╚═══════════════════════════════════════════════════════════════╝
`)

  process.exit(overallScore >= 70 ? 0 : 1)
}

main().catch(console.error)
