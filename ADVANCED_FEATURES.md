# 고급 기능 구현 완료

## 📋 개요

AIS WebSocket 실시간 선박 추적 애플리케이션에 3가지 핵심 고급 기능이 추가되었습니다:
1. **데이터 내보내기 시스템** - CSV/JSON/GeoJSON 형식
2. **선박 그룹화 및 클러스터링** - DBSCAN/격자 기반 알고리즘
3. **Geofencing 시스템** - 지역 기반 경계 알림 (타입/유틸만)

---

## 1. 📊 데이터 내보내기 시스템

### 기능
- **선박 데이터 내보내기**: CSV, JSON
- **추적 기록 내보내기**: CSV, GeoJSON (지리 데이터)
- **알림 내보내기**: CSV, JSON
- **전체 리포트**: 모든 데이터를 하나의 JSON 파일로

### 파일 구조
```typescript
// src/utils/dataExport.ts
export function exportVesselsToCSV(vessels: Vessel[]): void
export function exportVesselsToJSON(vessels: Vessel[]): void
export function exportTracksToCSV(tracks: Map<number, VesselTrack>): void
export function exportTracksToGeoJSON(tracks: Map<number, VesselTrack>): void
export function exportNotificationsToCSV(notifications: Notification[]): void
export function exportNotificationsToJSON(notifications: Notification[]): void
export function exportFullReport(
  vessels: Vessel[],
  tracks: Map<number, VesselTrack>,
  notifications: Notification[]
): void
```

### UI 컴포넌트: ExportPanel

**위치**: [src/components/ExportPanel.tsx](src/components/ExportPanel.tsx)

**주요 기능**:
- 4가지 데이터 유형 선택 (선박/추적/알림/전체)
- 포맷 선택 (CSV/JSON/GeoJSON)
- 데이터 카운트 미리보기
- 내보내기 성공 애니메이션
- 모달 형태의 깔끔한 UI

**사용 방법**:
1. 헤더의 "내보내기" 버튼 클릭
2. 데이터 유형 선택
3. 포맷 선택
4. "내보내기" 버튼 클릭
5. 파일 자동 다운로드

### 내보내기 형식

#### CSV (표 형식)
- Excel/Google Sheets에서 바로 열기 가능
- 데이터 분석 및 정렬 용이
- 필드: MMSI, 이름, 위치, 속도, 방향 등

#### JSON (구조화된 데이터)
- 프로그래밍 가능
- 완전한 데이터 구조 보존
- 메타데이터 포함 (exportDate, count 등)

#### GeoJSON (지리 데이터)
- GIS 소프트웨어 호환 (QGIS, ArcGIS 등)
- Mapbox/Leaflet에서 즉시 시각화 가능
- LineString geometry로 경로 표현

### 파일명 규칙
```
vessels_20251125_012345.csv
vessel_tracks_20251125_012345.geojson
notifications_20251125_012345.json
ais_full_report_20251125_012345.json
```

---

## 2. 🗺️ 선박 그룹화 및 클러스터링

### 알고리즘

#### 1. DBSCAN (Density-Based Spatial Clustering)
- **설명**: 밀도 기반 공간 클러스터링
- **파라미터**:
  - epsilon: 0.5 해리 (약 900m)
  - minPoints: 3척 이상
- **특징**: 임의 형태의 클러스터 발견, 노이즈 제거

#### 2. 격자 기반 (Grid-Based)
- **설명**: 지리적 격자로 빠른 그룹화
- **파라미터**:
  - gridSize: 0.1도 (약 11km)
- **특징**: 빠른 계산, 단순한 구현

### 파일 구조
```typescript
// src/utils/vesselClustering.ts
export interface VesselCluster {
  id: string
  vessels: Vessel[]
  center: { latitude: number; longitude: number }
  radius: number
  averageSpeed: number
  vesselTypes: Map<string, number>
}

export function clusterVessels(
  vessels: Vessel[],
  epsilon: number,
  minPoints: number
): VesselCluster[]

export function gridClusterVessels(
  vessels: Vessel[],
  gridSize: number
): VesselCluster[]

export function mergeClusters(
  clusters: VesselCluster[],
  mergeDistance: number
): VesselCluster[]

export function filterClusters(
  clusters: VesselCluster[],
  filters: FilterOptions
): VesselCluster[]
```

### UI 컴포넌트: VesselClusterPanel

**위치**: [src/components/VesselClusterPanel.tsx](src/components/VesselClusterPanel.tsx)

**주요 기능**:
- 클러스터 방법 선택 (DBSCAN/격자)
- 클러스터 목록 표시 (선박 수순 정렬)
- 확장 가능한 상세 정보
- 클러스터 통계 (반경, 평균 속도, 선박 유형)
- 선박 목록 (최대 5개 표시)

**사용 방법**:
1. 헤더의 "클러스터" 버튼 클릭/토글
2. 우측 패널에서 클러스터 방법 선택
3. 클러스터 클릭하여 상세 정보 확인

### 클러스터 정보

**요약 카드**:
- 클러스터 번호 (선박 수 기준 정렬)
- 선박 수
- 평균 속도
- 중심 좌표

**상세 정보** (확장 시):
- 선박 유형 분포 (상위 2개)
- 클러스터 반경 (해리)
- 평균 속도
- 선박 목록 (처음 5개)

### 알고리즘 비교

| 특성 | DBSCAN | 격자 기반 |
|------|--------|----------|
| 속도 | 중간 (O(n log n)) | 빠름 (O(n)) |
| 형태 | 임의 형태 | 사각형만 |
| 노이즈 | 제거 | 포함 |
| 정확도 | 높음 | 중간 |
| 파라미터 | 2개 | 1개 |

**권장 사용**:
- **DBSCAN**: 정확한 클러스터링, 복잡한 형태
- **격자**: 빠른 개요, 실시간 모니터링

---

## 3. 📍 Geofencing 시스템 (타입 & 유틸리티)

### 존(Zone) 유형

#### 1. 원형 (Circle)
```typescript
{
  type: 'circle',
  center: { latitude: 35.0, longitude: 129.0 },
  radius: 5.0 // 해리
}
```

#### 2. 사각형 (Rectangle)
```typescript
{
  type: 'rectangle',
  bounds: {
    north: 38.0,
    south: 33.0,
    east: 132.0,
    west: 124.0
  }
}
```

#### 3. 다각형 (Polygon)
```typescript
{
  type: 'polygon',
  coordinates: [
    { latitude: 35.0, longitude: 129.0 },
    { latitude: 35.5, longitude: 129.5 },
    { latitude: 35.0, longitude: 130.0 }
  ]
}
```

### 이벤트 유형

- **enter**: 존 진입
- **exit**: 존 이탈
- **dwell**: 존 내 체류 (설정된 시간 이상)

### 파일 구조

**타입 정의**: [src/types/geofencing.types.ts](src/types/geofencing.types.ts)
```typescript
export interface GeoZone {
  id: string
  name: string
  description?: string
  geometry: CircleZone | PolygonZone | RectangleZone
  color: string
  enabled: boolean
  events: {
    enter: boolean
    exit: boolean
    dwell: boolean
  }
  dwellTimeMinutes?: number
  createdAt: number
}

export interface ZoneEvent {
  id: string
  zoneId: string
  zoneName: string
  vesselMMSI: number
  vesselName: string
  eventType: 'enter' | 'exit' | 'dwell'
  timestamp: number
  position: { latitude: number; longitude: number }
}
```

**유틸리티**: [src/utils/geofencing.ts](src/utils/geofencing.ts)
```typescript
// 존 내부 확인
export function isInsideZone(
  latitude: number,
  longitude: number,
  zone: GeoZone
): boolean

// 존 중심점 계산
export function getZoneCenter(zone: GeoZone): { latitude: number; longitude: number }

// 존 경계 박스 계산
export function getZoneBounds(zone: GeoZone): BoundingBox

// 존 면적 계산 (평방 해리)
export function calculateZoneArea(zone: GeoZone): number

// 존 검증
export function validateZone(zone: GeoZone): { valid: boolean; errors: string[] }
```

### 알고리즘

#### 원형 존 - Haversine 거리
```typescript
distance = 2 * R * arcsin(sqrt(
  sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
))
```

#### 다각형 존 - Ray Casting
점에서 수평선을 그어 다각형 경계와 교차 횟수 확인
- 홀수: 내부
- 짝수: 외부

#### 사각형 존 - 간단한 범위 확인
```typescript
isInside = (lat >= south && lat <= north && lon >= west && lon <= east)
```

### 향후 UI 구현 필요 항목

**ZoneManager 컴포넌트** (미구현):
- [ ] 존 생성/편집/삭제 UI
- [ ] 지도에서 존 그리기
- [ ] 존 목록 및 관리
- [ ] 이벤트 설정
- [ ] 체류 시간 설정

**통합 기능**:
- [ ] useGeofencing hook으로 알림 시스템 연동
- [ ] 지도에 존 오버레이 표시
- [ ] 존 이벤트 히스토리
- [ ] 선박별 존 진입/이탈 추적

---

## 🎯 AISTestPage 통합

모든 기능이 [src/pages/AISTestPage.tsx](src/pages/AISTestPage.tsx)에 통합되었습니다.

### 새로운 UI 요소

**헤더 우측**:
```
[클러스터] [내보내기] [알림센터]
```

- **클러스터 버튼**: 토글하여 클러스터 패널 표시/숨김
- **내보내기 버튼**: 데이터 내보내기 모달 열기
- **알림 센터**: 기존 알림 시스템

**우측 패널**:
- 기본: 선박 목록
- 클러스터 활성화 시: 클러스터 패널

---

## 📁 새로 추가된 파일

### 유틸리티
- [src/utils/dataExport.ts](src/utils/dataExport.ts) - 데이터 내보내기 함수들
- [src/utils/vesselClustering.ts](src/utils/vesselClustering.ts) - 클러스터링 알고리즘
- [src/utils/geofencing.ts](src/utils/geofencing.ts) - Geofencing 계산

### 타입
- [src/types/geofencing.types.ts](src/types/geofencing.types.ts) - Geofencing 타입 정의

### 컴포넌트
- [src/components/ExportPanel.tsx](src/components/ExportPanel.tsx) - 내보내기 UI
- [src/components/VesselClusterPanel.tsx](src/components/VesselClusterPanel.tsx) - 클러스터 UI

---

## 🚀 개발 서버 상태

✅ **Dev Server**: http://localhost:5174 - 정상 실행 중
✅ **HMR**: Hot Module Replacement 작동 중
✅ **Build**: TypeScript 컴파일 성공
✅ **No Errors**: 콘솔 에러 없음

---

## 📊 기능 요약

### 완전 구현
| 기능 | 유틸리티 | UI | 통합 | 테스트 |
|------|---------|-----|------|--------|
| 알림 시스템 | ✅ | ✅ | ✅ | ✅ |
| 데이터 내보내기 | ✅ | ✅ | ✅ | ⏳ |
| 선박 클러스터링 | ✅ | ✅ | ✅ | ⏳ |
| Geofencing | ✅ | ⏳ | ⏳ | ⏳ |

### 향후 작업
- [ ] ZoneManager UI 구현
- [ ] useGeofencing hook 구현
- [ ] Geofencing 알림 통합
- [ ] 지도에 존 오버레이
- [ ] E2E 테스트 추가
- [ ] 성능 최적화

---

## 🎨 기술 스택

- **React 19.2.0**: UI 프레임워크
- **TypeScript 5.9.3**: 타입 안전성
- **Framer Motion 12.23.24**: 애니메이션
- **date-fns 4.1.0**: 시간 포맷팅
- **Tailwind CSS 3.4.16**: 스타일링
- **nanoid**: 고유 ID 생성
- **Lucide React**: 아이콘

---

## 📝 사용 예시

### 데이터 내보내기
```typescript
import { exportVesselsToCSV, exportTracksToGeoJSON } from '@/utils/dataExport'

// 선박 데이터 CSV로 내보내기
exportVesselsToCSV(vessels)

// 추적 기록 GeoJSON으로 내보내기
exportTracksToGeoJSON(tracks)
```

### 클러스터링
```typescript
import { clusterVessels, gridClusterVessels } from '@/utils/vesselClustering'

// DBSCAN 클러스터링
const clusters = clusterVessels(vessels, 0.5, 3)

// 격자 기반 클러스터링 (더 빠름)
const gridClusters = gridClusterVessels(vessels, 0.1)
```

### Geofencing
```typescript
import { isInsideZone, getZoneCenter } from '@/utils/geofencing'

// 선박이 존 내부에 있는지 확인
const inside = isInsideZone(vessel.position.latitude, vessel.position.longitude, zone)

// 존 중심 계산
const center = getZoneCenter(zone)
```

---

## 🐛 알려진 제한사항

1. **Geofencing UI**: 존 생성/관리 UI 미구현 (타입과 유틸리티만 완성)
2. **E2E 테스트**: 새 기능에 대한 테스트 미추가
3. **성능**: 대량 선박(1000척 이상) 시 클러스터링 최적화 필요
4. **GeoJSON Export**: 매우 긴 경로는 파일 크기가 클 수 있음

---

## 📞 기술 사양

### 데이터 내보내기
- **CSV**: RFC 4180 준수
- **JSON**: UTF-8 인코딩
- **GeoJSON**: RFC 7946 준수

### 클러스터링
- **DBSCAN**: O(n log n) 시간 복잡도
- **격자**: O(n) 시간 복잡도
- **병합**: O(n²) 최악의 경우

### Geofencing
- **Haversine**: 0.5% 오차 (지구를 구체로 가정)
- **Ray Casting**: O(n) n = 다각형 꼭짓점 수
- **사각형**: O(1) 상수 시간

---

**구현 완료일**: 2025-11-25
**개발 환경**: Windows, VSCode, Claude Code
**개발 방식**: Spec-Driven Development
