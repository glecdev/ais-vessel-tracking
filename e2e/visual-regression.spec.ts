import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test('스크린샷 비교 - 메인 페이지', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 베이스라인 스크린샷과 비교
    await expect(page).toHaveScreenshot('main-page.png', {
      fullPage: true,
      maxDiffPixels: 100, // 100픽셀까지 차이 허용
    })
  })

  test('스크린샷 비교 - 필터 확장', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("필터")').click()

    await expect(page.locator('text=속도 범위')).toBeVisible()

    await expect(page).toHaveScreenshot('filter-expanded.png', {
      maxDiffPixels: 50,
    })
  })

  test('다크 모드 스크린샷 (미래 기능)', async ({ page }) => {
    await page.goto('/')

    // 다크 모드가 구현되면 활성화
    // await page.evaluate(() => {
    //   document.documentElement.classList.add('dark')
    // })

    await page.screenshot({
      path: 'e2e/screenshots/dark-mode-future.png',
      fullPage: true,
    })
  })
})
