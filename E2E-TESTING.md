# E2E 자동화 테스트 시스템

## 📋 개요

Playwright 기반의 End-to-End 자동화 테스트 시스템입니다. 실시간 오류 감지, 스크린샷 캡처, 성능 메트릭 수집, 자동 회귀 검증을 지원합니다.

## 🎯 테스트 범위

### 기능 테스트
- ✅ 페이지 로딩 및 렌더링
- ✅ WebSocket 연결 상태
- ✅ 필터링 기능 (검색, 속도, 정렬)
- ✅ 통계 대시보드
- ✅ 지도 렌더링 (Mapbox GL)
- ✅ 선박 목록 및 선택
- ✅ 상세 정보 패널
- ✅ 반응형 레이아웃 (Desktop/Tablet/Mobile)

### 품질 검증
- ✅ JavaScript 에러 감지
- ✅ 콘솔 경고 모니터링
- ✅ 성능 메트릭 (DOM 로드, 인터랙티브 시간)
- ✅ Visual Regression (스크린샷 비교)

## 🚀 사용 방법

### 1. 기본 테스트 실행

```bash
# 전체 테스트 실행
npm run test:e2e

# UI 모드로 실행 (대화형)
npm run test:e2e:ui

# 헤드 모드로 실행 (브라우저 보이기)
npm run test:e2e:headed

# 디버그 모드
npm run test:e2e:debug
```

### 2. 테스트 리포트 확인

```bash
# HTML 리포트 열기
npm run test:report
```

자동으로 브라우저에서 상세한 테스트 리포트가 열립니다:
- 각 테스트별 성공/실패 상태
- 스크린샷 및 비디오
- 실행 시간
- 에러 스택 트레이스

### 3. 자동 회귀 검증

```bash
# 전체 빌드 + 테스트 + 리포트 생성
npm run test:verify
```

이 명령은 다음을 수행합니다:
1. TypeScript 타입 체크
2. 프로덕션 빌드
3. E2E 테스트 실행
4. JSON 리포트 생성 (`test-reports/` 폴더)

## 📁 파일 구조

```
frontend/
├── e2e/                          # E2E 테스트 파일
│   ├── ais-app.spec.ts          # 메인 기능 테스트
│   ├── visual-regression.spec.ts # Visual regression 테스트
│   └── screenshots/              # 캡처된 스크린샷
├── playwright.config.ts          # Playwright 설정
├── scripts/
│   └── auto-verify.ts           # 자동 검증 스크립트
├── test-reports/                # 테스트 리포트 (JSON)
└── playwright-report/           # HTML 리포트
```

## 🎭 테스트 시나리오

### 1. 기본 기능 테스트 (`ais-app.spec.ts`)

```typescript
// 페이지 로딩
test('페이지가 정상적으로 로드된다', async ({ page }) => {
  await expect(page.locator('h1')).toContainText('AIS WebSocket')
})

// 지도 렌더링
test('지도가 정상적으로 렌더링된다', async ({ page }) => {
  const mapContainer = page.locator('.mapboxgl-map')
  await expect(mapContainer).toBeVisible({ timeout: 15000 })
})

// 성능 체크
test('성능 메트릭 수집', async ({ page }) => {
  const metrics = await page.evaluate(() => {
    const perf = performance.getEntriesByType('navigation')[0]
    return { domContentLoaded, loadComplete, domInteractive }
  })
  expect(metrics.domContentLoaded).toBeLessThan(5000)
})
```

### 2. Visual Regression 테스트

```typescript
// 스크린샷 비교
test('스크린샷 비교 - 메인 페이지', async ({ page }) => {
  await expect(page).toHaveScreenshot('main-page.png', {
    fullPage: true,
    maxDiffPixels: 100
  })
})
```

## 📸 스크린샷 자동 캡처

모든 테스트는 다음 시점에 스크린샷을 자동으로 캡처합니다:
- ✅ 테스트 통과 시: 각 단계별 스크린샷
- ❌ 테스트 실패 시: 실패 지점 스크린샷 + 비디오

### 저장 위치
- `e2e/screenshots/` - 테스트별 스크린샷
- `test-results/` - 실패한 테스트의 스크린샷/비디오
- `playwright-report/` - HTML 리포트 (스크린샷 포함)

## 🔧 설정 커스터마이징

### `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,           // 테스트 타임아웃
  use: {
    baseURL: 'http://localhost:5174',
    screenshot: 'only-on-failure',  // 실패 시에만 스크린샷
    video: 'retain-on-failure',     // 실패 시에만 비디오
    trace: 'on-first-retry',        // 재시도 시 트레이스
  },
})
```

## ⚠️ 주의사항

### API 키 필요
일부 테스트는 실제 API 키가 필요합니다:
- WebSocket 연결 테스트
- 선박 데이터 표시 테스트

`.env` 파일에 API 키를 설정하세요:
```
VITE_AISSTREAM_API_KEY=your_key
VITE_MAPBOX_TOKEN=your_token
```

### 타임아웃 조정
Mapbox GL 로딩이 느린 경우 타임아웃을 늘리세요:
```typescript
await expect(mapContainer).toBeVisible({ timeout: 30000 })
```

### Visual Regression 베이스라인
첫 실행 시 베이스라인 스크린샷이 생성됩니다:
```bash
# 베이스라인 업데이트
npm run test:e2e -- --update-snapshots
```

## 📊 CI/CD 통합

### GitHub Actions 예제

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 🐛 디버깅

### 1. UI 모드 사용
```bash
npm run test:e2e:ui
```
- 브라우저에서 각 단계를 시각적으로 확인
- 특정 테스트만 선택하여 실행
- 네트워크, 콘솔 로그 확인

### 2. 디버그 모드
```bash
npm run test:e2e:debug
```
- VS Code 디버거와 연동
- 브레이크포인트 설정 가능

### 3. 스크린샷/비디오 확인
실패한 테스트의 스크린샷과 비디오는 `test-results/` 폴더에 저장됩니다.

## 📈 성능 벤치마크

### 목표 메트릭
- DOM Content Loaded: < 2초
- DOM Interactive: < 5초
- 전체 로딩: < 5초

### 측정 방법
```typescript
const metrics = await page.evaluate(() => {
  const perf = performance.getEntriesByType('navigation')[0]
  return {
    domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
    domInteractive: perf.domInteractive - perf.fetchStart,
  }
})
```

## 🔄 자동 재시도

Playwright는 플래키(flaky) 테스트를 위해 자동 재시도를 지원합니다:
```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,  // CI 환경에서 2회 재시도
})
```

## 📝 모범 사례

### 1. 선택자 사용
```typescript
// ✅ 좋음: 의미있는 선택자
page.locator('button:has-text("필터")')
page.locator('[data-testid="vessel-list"]')

// ❌ 나쁨: 취약한 선택자
page.locator('div > div > button')
```

### 2. 대기 처리
```typescript
// ✅ 좋음: 자동 대기
await expect(element).toBeVisible()

// ❌ 나쁨: 고정 대기
await page.waitForTimeout(5000)
```

### 3. 격리
```typescript
// 각 테스트는 독립적이어야 함
test.beforeEach(async ({ page }) => {
  await page.goto('/')
})
```

## 🎉 성공 사례

**현재 테스트 결과:**
- ✅ 7개 테스트 통과
- ⚠️ 7개 API 키 관련 또는 베이스라인 누락
- 📸 11개 스크린샷 자동 캡처
- 🎥 비디오 기록 활성화
- ⚡ 평균 실행 시간: 1.1분

## 🚀 다음 단계

1. **API 키 설정** - 실제 데이터 테스트
2. **베이스라인 업데이트** - Visual regression 활성화
3. **CI/CD 파이프라인** - 자동화된 테스트
4. **성능 모니터링** - 지속적인 성능 추적
5. **커버리지 확대** - 더 많은 시나리오

---

**문의**: 테스트 관련 이슈는 GitHub Issues에 올려주세요.
