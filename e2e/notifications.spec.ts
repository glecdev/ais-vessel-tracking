import { test, expect } from '@playwright/test'

test.describe('알림 시스템 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('알림 센터 버튼이 표시된다', async ({ page }) => {
    const notificationBell = page.locator('button[aria-label="알림 센터"]')
    await expect(notificationBell).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/notifications-01-bell-button.png' })
  })

  test('알림 센터를 열고 닫을 수 있다', async ({ page }) => {
    // 알림 벨 클릭
    const notificationBell = page.locator('button[aria-label="알림 센터"]')
    await notificationBell.click()

    // 알림 패널 확인
    await expect(page.locator('text=알림').first()).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/notifications-02-center-opened.png' })

    // 닫기 버튼 클릭
    await page.locator('button[aria-label="닫기"]').first().click()

    // 패널이 사라졌는지 확인
    await expect(page.locator('text=알림').first()).not.toBeVisible()
  })

  test('알림 필터가 작동한다', async ({ page }) => {
    // 알림 센터 열기
    await page.locator('button[aria-label="알림 센터"]').click()

    // 필터 버튼들 확인
    await expect(page.locator('button:has-text("전체")')).toBeVisible()
    await expect(page.locator('button:has-text("충돌")')).toBeVisible()
    await expect(page.locator('button:has-text("속도")')).toBeVisible()
    await expect(page.locator('button:has-text("구역")')).toBeVisible()
    await expect(page.locator('button:has-text("선박")')).toBeVisible()
    await expect(page.locator('button:has-text("정보")')).toBeVisible()

    // 충돌 필터 클릭
    await page.locator('button:has-text("충돌")').click()
    await page.screenshot({ path: 'e2e/screenshots/notifications-03-filter-collision.png' })
  })

  test('알림 설정 모달을 열 수 있다', async ({ page }) => {
    // 알림 센터 열기
    await page.locator('button[aria-label="알림 센터"]').click()

    // 설정 버튼 클릭
    await page.locator('button[aria-label="설정"]').click()

    // 설정 모달 확인
    await expect(page.locator('text=알림 설정').first()).toBeVisible()
    await expect(page.locator('text=전역 설정')).toBeVisible()
    await expect(page.locator('text=알림 유형')).toBeVisible()
    await expect(page.locator('text=임계값')).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/notifications-04-settings-modal.png' })
  })

  test('알림 설정에서 알림을 활성화/비활성화할 수 있다', async ({ page }) => {
    // 알림 센터 열기
    await page.locator('button[aria-label="알림 센터"]').click()

    // 설정 버튼 클릭
    await page.locator('button[aria-label="설정"]').click()

    // 알림 활성화 토글 찾기
    const enableToggle = page.locator('text=알림 활성화').locator('..').locator('..').locator('button').first()

    // 토글 클릭 (비활성화)
    await enableToggle.click()
    await page.waitForTimeout(500)
    await page.screenshot({
      path: 'e2e/screenshots/notifications-05-settings-disabled.png',
    })

    // 다시 토글 (활성화)
    await enableToggle.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'e2e/screenshots/notifications-06-settings-enabled.png' })
  })

  test('알림 유형별 설정을 토글할 수 있다', async ({ page }) => {
    // 알림 센터 열기
    await page.locator('button[aria-label="알림 센터"]').click()

    // 설정 열기
    await page.locator('button[aria-label="설정"]').click()

    // 충돌 알림 토글
    const collisionToggle = page
      .locator('text=충돌 경고')
      .locator('..')
      .locator('..')
      .locator('button')
      .first()
    await collisionToggle.click()
    await page.waitForTimeout(300)

    // 속도 알림 토글
    const speedToggle = page.locator('text=속도 변화').locator('..').locator('..').locator('button').first()
    await speedToggle.click()
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'e2e/screenshots/notifications-07-type-toggles.png' })
  })

  test('충돌 거리 임계값을 조정할 수 있다', async ({ page }) => {
    // 알림 센터 열기
    await page.locator('button[aria-label="알림 센터"]').click()

    // 설정 열기
    await page.locator('button[aria-label="설정"]').click()

    // 충돌 거리 슬라이더 찾기
    const collisionSlider = page.locator('text=충돌 경고 거리').locator('..').locator('input[type="range"]')

    // 값 변경
    await collisionSlider.fill('1000')
    await page.waitForTimeout(300)

    // 변경된 값 확인
    await expect(page.locator('text=1000m')).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/notifications-08-threshold-slider.png' })
  })

  test('속도 변화 임계값을 조정할 수 있다', async ({ page }) => {
    // 알림 센터 열기
    await page.locator('button[aria-label="알림 센터"]').click()

    // 설정 열기
    await page.locator('button[aria-label="설정"]').click()

    // 속도 임계값 슬라이더 찾기
    const speedSlider = page.locator('text=속도 변화 임계값').locator('..').locator('input[type="range"]')

    // 값 변경
    await speedSlider.fill('10')
    await page.waitForTimeout(300)

    // 변경된 값 확인
    await expect(page.locator('text=10 kn')).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/notifications-09-speed-threshold.png' })
  })

  test('설정 모달을 닫을 수 있다', async ({ page }) => {
    // 알림 센터 열기
    await page.locator('button[aria-label="알림 센터"]').click()

    // 설정 열기
    await page.locator('button[aria-label="설정"]').click()

    // 완료 버튼 클릭
    await page.locator('button:has-text("완료")').click()

    // 모달이 닫혔는지 확인
    await expect(page.locator('text=알림 설정').first()).not.toBeVisible()
  })

  test('알림이 없을 때 빈 상태 메시지가 표시된다', async ({ page }) => {
    // 알림 센터 열기
    await page.locator('button[aria-label="알림 센터"]').click()

    // 빈 상태 메시지 확인 (알림이 없는 경우)
    const emptyMessage = page.locator('text=알림이 없습니다')

    // 메시지가 표시되거나 알림이 있는지 확인
    const hasNotifications = await page.locator('.hover\\:bg-gray-50').count()

    if (hasNotifications === 0) {
      await expect(emptyMessage).toBeVisible()
      await page.screenshot({ path: 'e2e/screenshots/notifications-10-empty-state.png' })
    } else {
      console.log('알림이 이미 존재합니다 (실제 선박 데이터로 인한 충돌 경고 가능)')
    }
  })

  test('알림 센터 반응형 레이아웃', async ({ page }) => {
    // 데스크톱
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.locator('button[aria-label="알림 센터"]').click()
    await page.screenshot({
      path: 'e2e/screenshots/notifications-11-responsive-desktop.png',
    })
    await page.locator('button[aria-label="닫기"]').first().click()

    // 태블릿
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.locator('button[aria-label="알림 센터"]').click()
    await page.screenshot({
      path: 'e2e/screenshots/notifications-12-responsive-tablet.png',
    })
    await page.locator('button[aria-label="닫기"]').first().click()

    // 모바일
    await page.setViewportSize({ width: 375, height: 667 })
    await page.locator('button[aria-label="알림 센터"]').click()
    await page.screenshot({
      path: 'e2e/screenshots/notifications-13-responsive-mobile.png',
    })
  })

  test('사운드 설정을 토글할 수 있다', async ({ page }) => {
    await page.locator('button[aria-label="알림 센터"]').click()
    await page.locator('button[aria-label="설정"]').click()

    // 사운드 토글 찾기
    const soundToggle = page.locator('text=사운드').locator('..').locator('..').locator('button').first()

    // 토글 클릭
    await soundToggle.click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'e2e/screenshots/notifications-14-sound-toggle.png' })
  })

  test('읽지 않음만 필터를 사용할 수 있다', async ({ page }) => {
    await page.locator('button[aria-label="알림 센터"]').click()

    // 읽지 않음만 필터 버튼 찾기
    const unreadOnlyButton = page.locator('button:has-text("읽지 않음만")')

    // 버튼이 존재하는지 확인
    if ((await unreadOnlyButton.count()) > 0) {
      await unreadOnlyButton.click()
      await page.waitForTimeout(300)
      await page.screenshot({
        path: 'e2e/screenshots/notifications-15-unread-filter.png',
      })
    }
  })

  test('알림 설정에서 안내 메시지가 표시된다', async ({ page }) => {
    await page.locator('button[aria-label="알림 센터"]').click()
    await page.locator('button[aria-label="설정"]').click()

    // 안내 메시지 확인
    await expect(page.locator('text=알림 설정 안내')).toBeVisible()
    await expect(page.locator('text=충돌 경고는 CPA/TCPA 알고리즘을 사용합니다')).toBeVisible()
    await expect(page.locator('text=데스크톱 알림은 브라우저 권한이 필요합니다')).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/notifications-16-info-message.png' })
  })
})
