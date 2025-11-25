import { useState, useEffect, useCallback, useRef } from 'react'
import { nanoid } from 'nanoid'
import type { Vessel } from '@/types/ais.types'
import type { GeoZone, ZoneEvent, VesselZoneStatus } from '@/types/geofencing.types'
import { isInsideZone } from '@/utils/geofencing'

/**
 * Geofencing Hook
 * 지역 기반 경계 알림을 관리합니다.
 */

interface GeofencingOptions {
  onZoneEvent?: (event: ZoneEvent) => void
  enableNotifications?: boolean
}

export function useGeofencing(vessels: Vessel[], options: GeofencingOptions = {}) {
  const [zones, setZones] = useState<GeoZone[]>([])
  const [zoneEvents, setZoneEvents] = useState<ZoneEvent[]>([])
  const [vesselStatus, setVesselStatus] = useState<Map<number, VesselZoneStatus>>(new Map())

  const previousVesselPositions = useRef<Map<number, { latitude: number; longitude: number }>>(
    new Map()
  )

  // 존 추가
  const addZone = useCallback((zone: Omit<GeoZone, 'id' | 'createdAt'>) => {
    const newZone: GeoZone = {
      ...zone,
      id: nanoid(),
      createdAt: Date.now(),
    }
    setZones(prev => [...prev, newZone])
    return newZone
  }, [])

  // 존 업데이트
  const updateZone = useCallback((id: string, updates: Partial<GeoZone>) => {
    setZones(prev => prev.map(zone => (zone.id === id ? { ...zone, ...updates } : zone)))
  }, [])

  // 존 삭제
  const deleteZone = useCallback((id: string) => {
    setZones(prev => prev.filter(zone => zone.id !== id))
  }, [])

  // 존 활성화/비활성화 토글
  const toggleZone = useCallback((id: string) => {
    setZones(prev =>
      prev.map(zone => (zone.id === id ? { ...zone, enabled: !zone.enabled } : zone))
    )
  }, [])

  // 모든 존 삭제
  const clearZones = useCallback(() => {
    setZones([])
  }, [])

  // 이벤트 생성
  const createZoneEvent = useCallback(
    (
      zone: GeoZone,
      vessel: Vessel,
      eventType: 'enter' | 'exit' | 'dwell'
    ): ZoneEvent => {
      const event: ZoneEvent = {
        id: nanoid(),
        zoneId: zone.id,
        zoneName: zone.name,
        vesselMMSI: vessel.mmsi,
        vesselName: vessel.name,
        eventType,
        timestamp: Date.now(),
        position: vessel.position!,
      }

      setZoneEvents(prev => [event, ...prev].slice(0, 100)) // 최근 100개만 유지

      if (options.onZoneEvent) {
        options.onZoneEvent(event)
      }

      return event
    },
    [options]
  )

  // 선박-존 상태 모니터링
  useEffect(() => {
    if (vessels.length === 0 || zones.length === 0) return

    const newVesselStatus = new Map(vesselStatus)

    vessels.forEach(vessel => {
      if (!vessel.position) return

      const currentStatus: VesselZoneStatus = newVesselStatus.get(vessel.mmsi) || {
        vesselMMSI: vessel.mmsi,
        zonesInside: [] as string[],
        lastEnterTime: new Map<string, number>(),
        lastExitTime: new Map<string, number>(),
      }

      zones.forEach(zone => {
        if (!zone.enabled) return

        const isInside = isInsideZone(vessel.position!.latitude, vessel.position!.longitude, zone)
        const wasInside = currentStatus.zonesInside.includes(zone.id)

        // 진입 이벤트
        if (isInside && !wasInside && zone.events.enter) {
          currentStatus.zonesInside = [...currentStatus.zonesInside, zone.id]
          currentStatus.lastEnterTime.set(zone.id, Date.now())
          createZoneEvent(zone, vessel, 'enter')
        }

        // 이탈 이벤트
        if (!isInside && wasInside && zone.events.exit) {
          currentStatus.zonesInside = currentStatus.zonesInside.filter(id => id !== zone.id)
          currentStatus.lastExitTime.set(zone.id, Date.now())
          createZoneEvent(zone, vessel, 'exit')
        }

        // 체류 이벤트
        if (
          isInside &&
          wasInside &&
          zone.events.dwell &&
          zone.dwellTimeMinutes &&
          currentStatus.lastEnterTime.has(zone.id)
        ) {
          const enterTime = currentStatus.lastEnterTime.get(zone.id)!
          const dwellTime = Date.now() - enterTime
          const requiredDwellTime = zone.dwellTimeMinutes * 60 * 1000

          // 정확히 체류 시간에 도달했을 때만 이벤트 발생 (중복 방지)
          if (
            dwellTime >= requiredDwellTime &&
            dwellTime < requiredDwellTime + 60000 // 1분 오차 허용
          ) {
            createZoneEvent(zone, vessel, 'dwell')
          }
        }
      })

      newVesselStatus.set(vessel.mmsi, currentStatus)

      // 이전 위치 저장
      previousVesselPositions.current.set(vessel.mmsi, {
        latitude: vessel.position.latitude,
        longitude: vessel.position.longitude,
      })
    })

    setVesselStatus(newVesselStatus)
  }, [vessels, zones, createZoneEvent])

  // 특정 선박이 어떤 존 안에 있는지 확인
  const getVesselZones = useCallback(
    (vesselMMSI: number): GeoZone[] => {
      const status = vesselStatus.get(vesselMMSI)
      if (!status) return []

      return zones.filter(zone => status.zonesInside.includes(zone.id))
    },
    [zones, vesselStatus]
  )

  // 특정 존 안에 있는 선박들
  const getVesselsInZone = useCallback(
    (zoneId: string): Vessel[] => {
      return vessels.filter(vessel => {
        const status = vesselStatus.get(vessel.mmsi)
        return status && status.zonesInside.includes(zoneId)
      })
    },
    [vessels, vesselStatus]
  )

  // 이벤트 삭제
  const deleteEvent = useCallback((eventId: string) => {
    setZoneEvents(prev => prev.filter(event => event.id !== eventId))
  }, [])

  // 모든 이벤트 삭제
  const clearEvents = useCallback(() => {
    setZoneEvents([])
  }, [])

  // 통계
  const stats = {
    totalZones: zones.length,
    activeZones: zones.filter(z => z.enabled).length,
    totalEvents: zoneEvents.length,
    vesselsBeingTracked: vesselStatus.size,
  }

  return {
    zones,
    zoneEvents,
    vesselStatus,
    stats,
    addZone,
    updateZone,
    deleteZone,
    toggleZone,
    clearZones,
    getVesselZones,
    getVesselsInZone,
    deleteEvent,
    clearEvents,
  }
}
