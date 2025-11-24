#!/usr/bin/env node

/**
 * 자동 회귀 검증 시스템
 *
 * 기능:
 * 1. 개발 서버 시작
 * 2. E2E 테스트 실행
 * 3. 스크린샷 캡처
 * 4. 에러 감지 및 리포팅
 * 5. 자동 재시도
 */

import { execSync, spawn } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

interface TestResult {
  passed: boolean
  errors: string[]
  warnings: string[]
  screenshots: string[]
  duration: number
}

class AutoVerifier {
  private reportDir = join(process.cwd(), 'test-reports')
  private screenshotDir = join(process.cwd(), 'e2e', 'screenshots')

  constructor() {
    this.ensureDirectories()
  }

  private ensureDirectories() {
    if (!existsSync(this.reportDir)) {
      mkdirSync(this.reportDir, { recursive: true })
    }
    if (!existsSync(this.screenshotDir)) {
      mkdirSync(this.screenshotDir, { recursive: true })
    }
  }

  async run(): Promise<TestResult> {
    console.log('🚀 자동 회귀 검증 시작...\n')

    const startTime = Date.now()
    const result: TestResult = {
      passed: false,
      errors: [],
      warnings: [],
      screenshots: [],
      duration: 0,
    }

    try {
      // 1. 타입 체크
      console.log('📝 TypeScript 타입 체크...')
      this.runCommand('npm run build')
      console.log('✅ 타입 체크 통과\n')

      // 2. Playwright 설치 (처음 실행 시)
      console.log('🎭 Playwright 브라우저 설치 확인...')
      try {
        this.runCommand('npx playwright install chromium')
      } catch (e) {
        console.log('⚠️ Playwright 브라우저 설치 실패 (이미 설치되었을 수 있음)\n')
      }

      // 3. E2E 테스트 실행
      console.log('🧪 E2E 테스트 실행...')
      this.runCommand('npx playwright test --reporter=html,list')
      console.log('✅ E2E 테스트 통과\n')

      result.passed = true
    } catch (error) {
      const err = error as Error
      result.errors.push(err.message)
      console.error('❌ 테스트 실패:', err.message)
    }

    result.duration = Date.now() - startTime

    // 결과 리포트 생성
    this.generateReport(result)

    return result
  }

  private runCommand(command: string): void {
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
  }

  private generateReport(result: TestResult): void {
    const reportPath = join(this.reportDir, `test-report-${Date.now()}.json`)

    const report = {
      timestamp: new Date().toISOString(),
      passed: result.passed,
      duration: `${(result.duration / 1000).toFixed(2)}s`,
      errors: result.errors,
      warnings: result.warnings,
      screenshots: result.screenshots,
    }

    writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log('\n📊 테스트 리포트 생성됨:', reportPath)
    console.log('\n=== 테스트 요약 ===')
    console.log(`상태: ${result.passed ? '✅ 통과' : '❌ 실패'}`)
    console.log(`소요 시간: ${(result.duration / 1000).toFixed(2)}초`)
    console.log(`에러: ${result.errors.length}개`)
    console.log(`경고: ${result.warnings.length}개`)
  }
}

// 실행
if (require.main === module) {
  const verifier = new AutoVerifier()
  verifier.run().then(result => {
    process.exit(result.passed ? 0 : 1)
  })
}

export { AutoVerifier }
