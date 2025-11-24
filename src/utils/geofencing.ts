import type { GeoZone, CircleZone, PolygonZone, RectangleZone } from '@/types/geofencing.types'

/**
 * Geofencing 유틸리티
 * 선박이 정의된 지역 내부/외부에 있는지 확인
 */

// Haversine 거리 계산 (해리 단위)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3440.065 // 지구 반경 (해리)
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 원형 존 내부 확인
 */
function isInsideCircle(
  latitude: number,
  longitude: number,
  zone: CircleZone
): boolean {
  const distance = calculateDistance(
    latitude,
    longitude,
    zone.center.latitude,
    zone.center.longitude
  )
  return distance <= zone.radius
}

/**
 * 사각형 존 내부 확인
 */
function isInsideRectangle(
  latitude: number,
  longitude: number,
  zone: RectangleZone
): boolean {
  return (
    latitude >= zone.bounds.south &&
    latitude <= zone.bounds.north &&
    longitude >= zone.bounds.west &&
    longitude <= zone.bounds.east
  )
}

/**
 * 다각형 존 내부 확인 (Ray Casting 알고리즘)
 */
function isInsidePolygon(
  latitude: number,
  longitude: number,
  zone: PolygonZone
): boolean {
  const { coordinates } = zone

  if (coordinates.length < 3) return false

  let inside = false

  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const xi = coordinates[i].longitude
    const yi = coordinates[i].latitude
    const xj = coordinates[j].longitude
    const yj = coordinates[j].latitude

    const intersect =
      yi > latitude !== yj > latitude &&
      longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }

  return inside
}

/**
 * 선박이 존 내부에 있는지 확인
 */
export function isInsideZone(
  latitude: number,
  longitude: number,
  zone: GeoZone
): boolean {
  if (!zone.enabled) return false

  switch (zone.geometry.type) {
    case 'circle':
      return isInsideCircle(latitude, longitude, zone.geometry)
    case 'rectangle':
      return isInsideRectangle(latitude, longitude, zone.geometry)
    case 'polygon':
      return isInsidePolygon(latitude, longitude, zone.geometry)
    default:
      return false
  }
}

/**
 * 존의 중심점 계산
 */
export function getZoneCenter(zone: GeoZone): { latitude: number; longitude: number } {
  switch (zone.geometry.type) {
    case 'circle':
      return zone.geometry.center

    case 'rectangle':
      return {
        latitude: (zone.geometry.bounds.north + zone.geometry.bounds.south) / 2,
        longitude: (zone.geometry.bounds.east + zone.geometry.bounds.west) / 2,
      }

    case 'polygon':
      const coords = zone.geometry.coordinates
      if (coords.length === 0) return { latitude: 0, longitude: 0 }

      const sum = coords.reduce(
        (acc, coord) => ({
          latitude: acc.latitude + coord.latitude,
          longitude: acc.longitude + coord.longitude,
        }),
        { latitude: 0, longitude: 0 }
      )

      return {
        latitude: sum.latitude / coords.length,
        longitude: sum.longitude / coords.length,
      }

    default:
      return { latitude: 0, longitude: 0 }
  }
}

/**
 * 존의 경계 박스 계산
 */
export function getZoneBounds(zone: GeoZone): {
  north: number
  south: number
  east: number
  west: number
} {
  switch (zone.geometry.type) {
    case 'circle': {
      const { center, radius } = zone.geometry
      // 간단한 근사값 (1도 ≈ 60 해리)
      const latOffset = radius / 60
      const lonOffset = radius / (60 * Math.cos((center.latitude * Math.PI) / 180))

      return {
        north: center.latitude + latOffset,
        south: center.latitude - latOffset,
        east: center.longitude + lonOffset,
        west: center.longitude - lonOffset,
      }
    }

    case 'rectangle':
      return zone.geometry.bounds

    case 'polygon': {
      const coords = zone.geometry.coordinates
      if (coords.length === 0) {
        return { north: 0, south: 0, east: 0, west: 0 }
      }

      return coords.reduce(
        (bounds, coord) => ({
          north: Math.max(bounds.north, coord.latitude),
          south: Math.min(bounds.south, coord.latitude),
          east: Math.max(bounds.east, coord.longitude),
          west: Math.min(bounds.west, coord.longitude),
        }),
        {
          north: -90,
          south: 90,
          east: -180,
          west: 180,
        }
      )
    }

    default:
      return { north: 0, south: 0, east: 0, west: 0 }
  }
}

/**
 * 존 면적 계산 (대략적, 평방 해리 단위)
 */
export function calculateZoneArea(zone: GeoZone): number {
  switch (zone.geometry.type) {
    case 'circle':
      return Math.PI * zone.geometry.radius * zone.geometry.radius

    case 'rectangle': {
      const { bounds } = zone.geometry
      const width = calculateDistance(
        bounds.south,
        bounds.west,
        bounds.south,
        bounds.east
      )
      const height = calculateDistance(
        bounds.south,
        bounds.west,
        bounds.north,
        bounds.west
      )
      return width * height
    }

    case 'polygon': {
      // Shoelace 공식 (간단한 근사)
      const coords = zone.geometry.coordinates
      if (coords.length < 3) return 0

      let area = 0
      for (let i = 0; i < coords.length; i++) {
        const j = (i + 1) % coords.length
        area += coords[i].longitude * coords[j].latitude
        area -= coords[j].longitude * coords[i].latitude
      }

      return Math.abs(area / 2) * 3600 // 평방도를 평방 해리로 변환 (근사)
    }

    default:
      return 0
  }
}

/**
 * 존 검증
 */
export function validateZone(zone: GeoZone): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!zone.name || zone.name.trim() === '') {
    errors.push('존 이름이 필요합니다')
  }

  switch (zone.geometry.type) {
    case 'circle':
      if (zone.geometry.radius <= 0) {
        errors.push('반경은 0보다 커야 합니다')
      }
      if (zone.geometry.radius > 1000) {
        errors.push('반경은 1000 해리 이하여야 합니다')
      }
      break

    case 'rectangle':
      const { bounds } = zone.geometry
      if (bounds.north <= bounds.south) {
        errors.push('북쪽 경계는 남쪽 경계보다 커야 합니다')
      }
      if (bounds.east <= bounds.west) {
        errors.push('동쪽 경계는 서쪽 경계보다 커야 합니다')
      }
      break

    case 'polygon':
      if (zone.geometry.coordinates.length < 3) {
        errors.push('다각형은 최소 3개의 점이 필요합니다')
      }
      break
  }

  return { valid: errors.length === 0, errors }
}
