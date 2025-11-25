import { defineConfig, devices } from '@playwright/test'

/**
 * 배포된 버전에 대한 E2E 테스트 설정
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1,
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report/production-results.json' }],
    ['list']
  ],

  use: {
    baseURL: 'https://frontend-five-ivory-41.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 배포된 버전 테스트이므로 webServer 비활성화
})
