import type { Vessel } from '@/types/ais.types'
import type { CollisionAlert } from '@/types/notification.types'

/**
 * 충돌 감지 유틸리티
 */

// Haversine 공식으로 두 지점 간 거리 계산 (meters)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

// 베어링 계산 (degrees)
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

  const θ = Math.atan2(y, x)
  const bearing = ((θ * 180) / Math.PI + 360) % 360

  return bearing
}

// CPA (Closest Point of Approach) 계산
export function calculateCPA(vessel1: Vessel, vessel2: Vessel): {
  cpa: number // nautical miles
  tcpa: number // minutes
} {
  // 현재 위치
  const lat1 = vessel1.position.latitude
  const lon1 = vessel1.position.longitude
  const lat2 = vessel2.position.latitude
  const lon2 = vessel2.position.longitude

  // 속도 (knots to m/s)
  const speed1 = vessel1.speed * 0.514444
  const speed2 = vessel2.speed * 0.514444

  // 방향 (degrees to radians)
  const course1 = (vessel1.course * Math.PI) / 180
  const course2 = (vessel2.course * Math.PI) / 180

  // 속도 벡터 (m/s)
  const vx1 = speed1 * Math.sin(course1)
  const vy1 = speed1 * Math.cos(course1)
  const vx2 = speed2 * Math.sin(course2)
  const vy2 = speed2 * Math.cos(course2)

  // 상대 속도
  const dvx = vx1 - vx2
  const dvy = vy1 - vy2

  // 현재 거리 벡터 (meters to approximate)
  const dx = (lon1 - lon2) * 111320 * Math.cos((lat1 * Math.PI) / 180)
  const dy = (lat1 - lat2) * 110540

  // TCPA 계산 (seconds)
  const dv2 = dvx * dvx + dvy * dvy
  if (dv2 < 0.001) {
    // 거의 같은 속도/방향
    const currentDistance = Math.sqrt(dx * dx + dy * dy)
    return {
      cpa: currentDistance / 1852, // meters to nautical miles
      tcpa: 0,
    }
  }

  const tcpaSeconds = -(dx * dvx + dy * dvy) / dv2
  const tcpa = Math.max(0, tcpaSeconds / 60) // seconds to minutes

  // CPA 거리 계산
  const cpaX = dx + dvx * tcpaSeconds
  const cpaY = dy + dvy * tcpaSeconds
  const cpaDistance = Math.sqrt(cpaX * cpaX + cpaY * cpaY)
  const cpa = cpaDistance / 1852 // meters to nautical miles

  return { cpa, tcpa }
}

// 충돌 위험도 판정
export function assessCollisionRisk(
  cpa: number, // nautical miles
  tcpa: number // minutes
): 'safe' | 'warning' | 'danger' | 'critical' {
  // CPA < 0.5nm AND TCPA < 30분
  if (cpa < 0.5 && tcpa < 30) {
    if (cpa < 0.2 && tcpa < 10) return 'critical'
    if (cpa < 0.3 && tcpa < 15) return 'danger'
    return 'warning'
  }

  return 'safe'
}

// 모든 선박 쌍에 대해 충돌 감지
export function detectCollisions(
  vessels: Vessel[],
  thresholdDistance: number = 500 // meters
): CollisionAlert[] {
  const alerts: CollisionAlert[] = []

  for (let i = 0; i < vessels.length; i++) {
    for (let j = i + 1; j < vessels.length; j++) {
      const vessel1 = vessels[i]
      const vessel2 = vessels[j]

      // 현재 거리 계산
      const distance = calculateDistance(
        vessel1.position.latitude,
        vessel1.position.longitude,
        vessel2.position.latitude,
        vessel2.position.longitude
      )

      // 거리가 임계값 이내인 경우만 CPA 계산 (성능 최적화)
      if (distance < thresholdDistance * 3) {
        const { cpa, tcpa } = calculateCPA(vessel1, vessel2)
        const severity = assessCollisionRisk(cpa, tcpa)

        if (severity !== 'safe') {
          alerts.push({
            vessel1MMSI: vessel1.mmsi,
            vessel2MMSI: vessel2.mmsi,
            distance,
            cpa,
            tcpa,
            severity,
          })
        }
      }
    }
  }

  // 심각도 순으로 정렬
  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, danger: 1, warning: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}

// 선박의 속도 변화율 계산
export function detectSpeedAnomalies(
  vessel: Vessel,
  previousSpeed: number,
  threshold: number = 5 // knots
): boolean {
  const speedChange = Math.abs(vessel.speed - previousSpeed)
  return speedChange > threshold
}

// 지역 경계 체크 (Bounding Box)
export function isInZone(
  lat: number,
  lon: number,
  zone: { minLat: number; maxLat: number; minLon: number; maxLon: number }
): boolean {
  return (
    lat >= zone.minLat &&
    lat <= zone.maxLat &&
    lon >= zone.minLon &&
    lon <= zone.maxLon
  )
}
