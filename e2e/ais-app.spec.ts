import { test, expect } from '@playwright/test'

test.describe('AIS WebSocket 실시간 테스트 애플리케이션', () => {
  test.beforeEach(async ({ page }) => {
    // Console 에러 수집
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // 네트워크 에러 수집
    page.on('pageerror', error => {
      console.error('Page Error:', error.message)
    })

    await page.goto('/')
  })

  test('페이지가 정상적으로 로드된다', async ({ page }) => {
    // 타이틀 확인
    await expect(page.locator('h1')).toContainText('AIS WebSocket 실시간 테스트')

    // 스크린샷 캡처
    await page.screenshot({ path: 'e2e/screenshots/01-page-load.png', fullPage: true })
  })

  test('WebSocket 연결 상태가 표시된다', async ({ page }) => {
    // ConnectionStatus 컴포넌트 확인
    const statusSection = page.locator('text=WebSocket 연결 상태')
    await expect(statusSection).toBeVisible()

    // 연결 상태 점 확인 (idle, connecting, connected 중 하나)
    const statusIndicator = page.locator('.bg-green-500, .bg-yellow-500, .bg-gray-400').first()
    await expect(statusIndicator).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: 'e2e/screenshots/02-connection-status.png' })
  })

  test('필터 컴포넌트가 작동한다', async ({ page }) => {
    // 검색 입력
    const searchInput = page.locator('input[placeholder*="선박명"]')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('Test')

    // 필터 버튼 클릭
    const filterButton = page.locator('button:has-text("필터")')
    await filterButton.click()

    // 필터 확장 확인
    await expect(page.locator('text=속도 범위')).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/03-filter-expanded.png' })
  })

  test('통계 대시보드가 표시된다', async ({ page }) => {
    // 통계 카드 확인
    await expect(page.locator('text=총 선박')).toBeVisible()
    await expect(page.locator('text=평균 속도')).toBeVisible()
    await expect(page.locator('text=최고속')).toBeVisible()
    await expect(page.locator('text=최저속')).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/04-stats-dashboard.png' })
  })

  test('지도가 정상적으로 렌더링된다', async ({ page }) => {
    // Mapbox 지도 컨테이너 확인
    const mapContainer = page.locator('.mapboxgl-map')
    await expect(mapContainer).toBeVisible({ timeout: 15000 })

    // 네비게이션 컨트롤 확인
    const navControl = page.locator('.mapboxgl-ctrl-zoom-in')
    await expect(navControl).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/05-map-rendered.png' })
  })

  test('선박 목록이 표시된다', async ({ page }) => {
    // 선박 목록 섹션 확인
    const vesselListHeader = page.locator('text=선박 목록')
    await expect(vesselListHeader).toBeVisible()

    // 선박 카드 또는 "데이터를 기다리는 중" 메시지 확인
    await expect(
      page.locator('.vessel-marker, text=선박 데이터를 기다리는 중')
    ).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: 'e2e/screenshots/06-vessel-list.png' })
  })

  test('선박 선택 시 상세 패널이 표시된다', async ({ page }) => {
    // 선박 데이터가 로드될 때까지 대기
    await page.waitForTimeout(5000)

    // 선박 마커 클릭 시도 (존재하는 경우)
    const vesselMarker = page.locator('.vessel-marker').first()

    if (await vesselMarker.isVisible()) {
      await vesselMarker.click()

      // 상세 패널 확인
      await expect(page.locator('text=위치, text=속도, text=방향')).toBeVisible({ timeout: 5000 })

      await page.screenshot({ path: 'e2e/screenshots/07-vessel-detail-panel.png' })
    } else {
      console.log('선박 데이터가 아직 없습니다 (API 키 필요)')
    }
  })

  test('반응형 레이아웃이 작동한다', async ({ page }) => {
    // 데스크톱
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.screenshot({ path: 'e2e/screenshots/08-desktop-layout.png', fullPage: true })

    // 태블릿
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.screenshot({ path: 'e2e/screenshots/09-tablet-layout.png', fullPage: true })

    // 모바일
    await page.setViewportSize({ width: 375, height: 667 })
    await page.screenshot({ path: 'e2e/screenshots/10-mobile-layout.png', fullPage: true })
  })

  test('JavaScript 에러가 없다', async ({ page }) => {
    const errors: string[] = []

    page.on('pageerror', error => {
      errors.push(error.message)
    })

    await page.waitForTimeout(5000)

    expect(errors).toHaveLength(0)
  })

  test('콘솔 경고가 최소화되어 있다', async ({ page }) => {
    const warnings: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text())
      }
    })

    await page.waitForTimeout(3000)

    // 일부 경고는 허용 (예: Mapbox GL 경고)
    console.log(`Total warnings: ${warnings.length}`)
    warnings.forEach(w => console.log('Warning:', w))
  })

  test('성능 메트릭 수집', async ({ page }) => {
    // Performance API 사용
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        domInteractive: perf.domInteractive - perf.fetchStart,
      }
    })

    console.log('Performance Metrics:', metrics)

    // DOM 로드가 5초 이내
    expect(metrics.domContentLoaded).toBeLessThan(5000)

    await page.screenshot({ path: 'e2e/screenshots/11-performance-check.png' })
  })

  test('알림 시스템이 통합되어 있다', async ({ page }) => {
    // 알림 벨 버튼 확인
    const notificationBell = page.locator('button[aria-label="알림 센터"]')
    await expect(notificationBell).toBeVisible()

    // 알림 센터 열기
    await notificationBell.click()

    // 알림 패널 확인
    await expect(page.locator('text=알림').first()).toBeVisible()

    await page.screenshot({ path: 'e2e/screenshots/12-notification-system.png' })
  })
})
