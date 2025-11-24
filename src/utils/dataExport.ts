import type { Vessel } from '@/types/ais.types'
import type { VesselTrack } from '@/hooks/useVesselTracking'
import type { Notification } from '@/types/notification.types'
import { format } from 'date-fns'

/**
 * 데이터 내보내기 유틸리티
 * CSV 및 JSON 형식으로 선박 데이터, 추적 기록, 알림을 내보냅니다.
 */

// CSV 필드 이스케이프
function escapeCSV(field: string | number | undefined): string {
  if (field === undefined || field === null) return ''
  const str = String(field)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// 배열을 CSV로 변환
function arrayToCSV(headers: string[], rows: string[][]): string {
  const headerRow = headers.map(escapeCSV).join(',')
  const dataRows = rows.map(row => row.map(escapeCSV).join(','))
  return [headerRow, ...dataRows].join('\n')
}

// 파일 다운로드 트리거
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 선박 데이터를 CSV로 내보내기
 */
export function exportVesselsToCSV(vessels: Vessel[]): void {
  const headers = [
    'MMSI',
    'Name',
    'Type',
    'Latitude',
    'Longitude',
    'Speed (kn)',
    'Course (°)',
    'Heading (°)',
    'Status',
    'Destination',
    'ETA',
    'Callsign',
    'IMO',
    'Length (m)',
    'Width (m)',
    'Draught (m)',
    'Last Update',
  ]

  const rows = vessels.map(vessel => [
    String(vessel.mmsi),
    vessel.name,
    vessel.type,
    vessel.position ? String(vessel.position.latitude) : '',
    vessel.position ? String(vessel.position.longitude) : '',
    String(vessel.speed),
    String(vessel.course),
    vessel.heading !== undefined ? String(vessel.heading) : '',
    vessel.status || '',
    vessel.destination || '',
    vessel.eta || '',
    vessel.callsign || '',
    vessel.imo || '',
    vessel.dimensions?.length !== undefined ? String(vessel.dimensions.length) : '',
    vessel.dimensions?.width !== undefined ? String(vessel.dimensions.width) : '',
    vessel.draught !== undefined ? String(vessel.draught) : '',
    format(vessel.lastUpdate, 'yyyy-MM-dd HH:mm:ss'),
  ])

  const csv = arrayToCSV(headers, rows)
  const filename = `vessels_${format(Date.now(), 'yyyyMMdd_HHmmss')}.csv`
  downloadFile(csv, filename, 'text/csv;charset=utf-8;')
}

/**
 * 선박 데이터를 JSON으로 내보내기
 */
export function exportVesselsToJSON(vessels: Vessel[]): void {
  const data = {
    exportDate: new Date().toISOString(),
    vesselCount: vessels.length,
    vessels: vessels.map(vessel => ({
      mmsi: vessel.mmsi,
      name: vessel.name,
      type: vessel.type,
      position: vessel.position,
      speed: vessel.speed,
      course: vessel.course,
      heading: vessel.heading,
      status: vessel.status,
      destination: vessel.destination,
      eta: vessel.eta,
      callsign: vessel.callsign,
      imo: vessel.imo,
      dimensions: vessel.dimensions,
      draught: vessel.draught,
      lastUpdate: vessel.lastUpdate,
    })),
  }

  const json = JSON.stringify(data, null, 2)
  const filename = `vessels_${format(Date.now(), 'yyyyMMdd_HHmmss')}.json`
  downloadFile(json, filename, 'application/json;charset=utf-8;')
}

/**
 * 선박 추적 기록을 CSV로 내보내기
 */
export function exportTracksToCSV(tracks: Map<number, VesselTrack>): void {
  const headers = [
    'MMSI',
    'Vessel Name',
    'Point Index',
    'Latitude',
    'Longitude',
    'Speed (kn)',
    'Course (°)',
    'Timestamp',
    'Total Distance (NM)',
    'Point Count',
  ]

  const rows: string[][] = []

  tracks.forEach(track => {
    track.points.forEach((point, index) => {
      rows.push([
        String(track.mmsi),
        track.vesselName,
        String(index + 1),
        String(point.latitude),
        String(point.longitude),
        String(point.speed),
        String(point.course),
        format(point.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        index === 0 ? String(track.totalDistance) : '', // 첫 행에만 총 거리 표시
        index === 0 ? String(track.points.length) : '', // 첫 행에만 포인트 수 표시
      ])
    })
  })

  const csv = arrayToCSV(headers, rows)
  const filename = `vessel_tracks_${format(Date.now(), 'yyyyMMdd_HHmmss')}.csv`
  downloadFile(csv, filename, 'text/csv;charset=utf-8;')
}

/**
 * 선박 추적 기록을 JSON (GeoJSON 형식)으로 내보내기
 */
export function exportTracksToGeoJSON(tracks: Map<number, VesselTrack>): void {
  const features = Array.from(tracks.values()).map(track => ({
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates: track.points.map(p => [p.longitude, p.latitude]),
    },
    properties: {
      mmsi: track.mmsi,
      vesselName: track.vesselName,
      totalDistance: track.totalDistance,
      pointCount: track.points.length,
      startTime: format(track.points[0].timestamp, 'yyyy-MM-dd HH:mm:ss'),
      endTime: format(track.points[track.points.length - 1].timestamp, 'yyyy-MM-dd HH:mm:ss'),
    },
  }))

  const geojson = {
    type: 'FeatureCollection' as const,
    features,
  }

  const json = JSON.stringify(geojson, null, 2)
  const filename = `vessel_tracks_${format(Date.now(), 'yyyyMMdd_HHmmss')}.geojson`
  downloadFile(json, filename, 'application/geo+json;charset=utf-8;')
}

/**
 * 알림을 CSV로 내보내기
 */
export function exportNotificationsToCSV(notifications: Notification[]): void {
  const headers = [
    'ID',
    'Type',
    'Priority',
    'Title',
    'Message',
    'Timestamp',
    'Read',
    'Vessel MMSI',
    'Vessel Name',
    'Distance (NM)',
    'CPA (NM)',
    'TCPA (min)',
    'Speed (kn)',
  ]

  const rows = notifications.map(notification => [
    notification.id,
    notification.type,
    notification.priority,
    notification.title,
    notification.message,
    format(notification.timestamp, 'yyyy-MM-dd HH:mm:ss'),
    notification.read ? 'Yes' : 'No',
    notification.data?.vesselMMSI ? String(notification.data.vesselMMSI) : '',
    notification.data?.vesselName || '',
    notification.data?.distance !== undefined ? String(notification.data.distance.toFixed(2)) : '',
    notification.data?.cpa !== undefined ? String(notification.data.cpa.toFixed(2)) : '',
    notification.data?.tcpa !== undefined ? String(notification.data.tcpa.toFixed(1)) : '',
    notification.data?.speed !== undefined ? String(notification.data.speed.toFixed(1)) : '',
  ])

  const csv = arrayToCSV(headers, rows)
  const filename = `notifications_${format(Date.now(), 'yyyyMMdd_HHmmss')}.csv`
  downloadFile(csv, filename, 'text/csv;charset=utf-8;')
}

/**
 * 알림을 JSON으로 내보내기
 */
export function exportNotificationsToJSON(notifications: Notification[]): void {
  const data = {
    exportDate: new Date().toISOString(),
    notificationCount: notifications.length,
    notifications: notifications.map(n => ({
      id: n.id,
      type: n.type,
      priority: n.priority,
      title: n.title,
      message: n.message,
      timestamp: n.timestamp,
      read: n.read,
      data: n.data,
    })),
  }

  const json = JSON.stringify(data, null, 2)
  const filename = `notifications_${format(Date.now(), 'yyyyMMdd_HHmmss')}.json`
  downloadFile(json, filename, 'application/json;charset=utf-8;')
}

/**
 * 통합 리포트 생성 (모든 데이터 포함)
 */
export function exportFullReport(
  vessels: Vessel[],
  tracks: Map<number, VesselTrack>,
  notifications: Notification[]
): void {
  const report = {
    reportDate: new Date().toISOString(),
    summary: {
      totalVessels: vessels.length,
      trackedVessels: tracks.size,
      totalNotifications: notifications.length,
      unreadNotifications: notifications.filter(n => !n.read).length,
    },
    vessels: vessels.map(v => ({
      mmsi: v.mmsi,
      name: v.name,
      type: v.type,
      position: v.position,
      speed: v.speed,
      course: v.course,
      lastUpdate: v.lastUpdate,
    })),
    tracks: Array.from(tracks.values()).map(track => ({
      mmsi: track.mmsi,
      vesselName: track.vesselName,
      totalDistance: track.totalDistance,
      pointCount: track.points.length,
      points: track.points,
    })),
    notifications: notifications,
  }

  const json = JSON.stringify(report, null, 2)
  const filename = `ais_full_report_${format(Date.now(), 'yyyyMMdd_HHmmss')}.json`
  downloadFile(json, filename, 'application/json;charset=utf-8;')
}
