/**
 * Geofencing 타입 정의
 * 지역 기반 경계 알림 시스템
 */

export type ZoneType = 'circle' | 'polygon' | 'rectangle'
export type ZoneEventType = 'enter' | 'exit' | 'dwell'

export interface CircleZone {
  type: 'circle'
  center: {
    latitude: number
    longitude: number
  }
  radius: number // 해리 단위
}

export interface PolygonZone {
  type: 'polygon'
  coordinates: Array<{ latitude: number; longitude: number }>
}

export interface RectangleZone {
  type: 'rectangle'
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

export type ZoneGeometry = CircleZone | PolygonZone | RectangleZone

export interface GeoZone {
  id: string
  name: string
  description?: string
  geometry: ZoneGeometry
  color: string
  enabled: boolean
  events: {
    enter: boolean
    exit: boolean
    dwell: boolean
  }
  dwellTimeMinutes?: number // dwell 이벤트를 위한 최소 체류 시간
  createdAt: number
}

export interface ZoneEvent {
  id: string
  zoneId: string
  zoneName: string
  vesselMMSI: number
  vesselName: string
  eventType: ZoneEventType
  timestamp: number
  position: {
    latitude: number
    longitude: number
  }
}

export interface VesselZoneStatus {
  vesselMMSI: number
  zonesInside: string[] // 현재 내부에 있는 존 ID들
  lastEnterTime: Map<string, number> // 각 존에 진입한 시간
  lastExitTime: Map<string, number> // 각 존에서 이탈한 시간
}
