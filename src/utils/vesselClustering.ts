import type { Vessel } from '@/types/ais.types'

/**
 * 선박 클러스터링 유틸리티
 * DBSCAN 알고리즘을 사용하여 밀집 지역의 선박을 그룹화합니다.
 */

export interface VesselCluster {
  id: string
  vessels: Vessel[]
  center: {
    latitude: number
    longitude: number
  }
  radius: number // 클러스터 반경 (해리)
  averageSpeed: number
  vesselTypes: Map<string, number>
}

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

// 클러스터 중심 계산
function calculateClusterCenter(vessels: Vessel[]): { latitude: number; longitude: number } {
  const sum = vessels.reduce(
    (acc, vessel) => {
      if (vessel.position) {
        acc.lat += vessel.position.latitude
        acc.lon += vessel.position.longitude
        acc.count++
      }
      return acc
    },
    { lat: 0, lon: 0, count: 0 }
  )

  return {
    latitude: sum.lat / sum.count,
    longitude: sum.lon / sum.count,
  }
}

// 클러스터 반경 계산
function calculateClusterRadius(vessels: Vessel[], center: { latitude: number; longitude: number }): number {
  let maxDistance = 0

  vessels.forEach(vessel => {
    if (vessel.position) {
      const distance = calculateDistance(
        center.latitude,
        center.longitude,
        vessel.position.latitude,
        vessel.position.longitude
      )
      maxDistance = Math.max(maxDistance, distance)
    }
  })

  return maxDistance
}

// 선박 유형 통계
function getVesselTypeStats(vessels: Vessel[]): Map<string, number> {
  const typeMap = new Map<string, number>()

  vessels.forEach(vessel => {
    const type = vessel.type || 'Unknown'
    typeMap.set(type, (typeMap.get(type) || 0) + 1)
  })

  return typeMap
}

/**
 * DBSCAN 클러스터링
 * @param vessels 선박 배열
 * @param epsilon 클러스터 반경 (해리)
 * @param minPoints 클러스터 최소 선박 수
 */
export function clusterVessels(
  vessels: Vessel[],
  epsilon: number = 0.5, // 기본: 0.5 해리 (약 900m)
  minPoints: number = 3 // 기본: 3척 이상
): VesselCluster[] {
  // 위치 정보가 있는 선박만 필터링
  const validVessels = vessels.filter(v => v.position !== undefined)

  if (validVessels.length === 0) return []

  const visited = new Set<number>()
  const clusters: Vessel[][] = []
  const noise: Vessel[] = []

  // 이웃 찾기
  function getNeighbors(vessel: Vessel): Vessel[] {
    if (!vessel.position) return []

    return validVessels.filter(v => {
      if (!v.position || v.mmsi === vessel.mmsi) return false

      const distance = calculateDistance(
        vessel.position!.latitude,
        vessel.position!.longitude,
        v.position.latitude,
        v.position.longitude
      )

      return distance <= epsilon
    })
  }

  // 클러스터 확장
  function expandCluster(vessel: Vessel, neighbors: Vessel[]): Vessel[] | null {
    if (neighbors.length < minPoints) {
      return null
    }

    const cluster: Vessel[] = [vessel]
    visited.add(vessel.mmsi)

    const queue = [...neighbors]

    while (queue.length > 0) {
      const current = queue.shift()!

      if (!visited.has(current.mmsi)) {
        visited.add(current.mmsi)
        cluster.push(current)

        const currentNeighbors = getNeighbors(current)

        if (currentNeighbors.length >= minPoints) {
          currentNeighbors.forEach(neighbor => {
            if (!visited.has(neighbor.mmsi)) {
              queue.push(neighbor)
            }
          })
        }
      }
    }

    return cluster
  }

  // DBSCAN 실행
  validVessels.forEach(vessel => {
    if (visited.has(vessel.mmsi)) return

    const neighbors = getNeighbors(vessel)
    const cluster = expandCluster(vessel, neighbors)

    if (cluster) {
      clusters.push(cluster)
    } else {
      noise.push(vessel)
    }
  })

  // 클러스터 객체 생성
  return clusters.map((vessels, index) => {
    const center = calculateClusterCenter(vessels)
    const radius = calculateClusterRadius(vessels, center)
    const averageSpeed = vessels.reduce((sum, v) => sum + v.speed, 0) / vessels.length
    const vesselTypes = getVesselTypeStats(vessels)

    return {
      id: `cluster-${index}`,
      vessels,
      center,
      radius,
      averageSpeed,
      vesselTypes,
    }
  })
}

/**
 * 격자 기반 클러스터링 (더 빠름, 단순한 그리드)
 * @param vessels 선박 배열
 * @param gridSize 격자 크기 (도 단위)
 */
export function gridClusterVessels(
  vessels: Vessel[],
  gridSize: number = 0.1 // 기본: 0.1도 (약 11km)
): VesselCluster[] {
  const validVessels = vessels.filter(v => v.position !== undefined)

  if (validVessels.length === 0) return []

  // 격자 맵
  const gridMap = new Map<string, Vessel[]>()

  // 격자 키 생성
  const getGridKey = (lat: number, lon: number): string => {
    const gridLat = Math.floor(lat / gridSize)
    const gridLon = Math.floor(lon / gridSize)
    return `${gridLat},${gridLon}`
  }

  // 선박을 격자에 배치
  validVessels.forEach(vessel => {
    if (vessel.position) {
      const key = getGridKey(vessel.position.latitude, vessel.position.longitude)
      if (!gridMap.has(key)) {
        gridMap.set(key, [])
      }
      gridMap.get(key)!.push(vessel)
    }
  })

  // 격자를 클러스터로 변환 (2척 이상인 격자만)
  const clusters: VesselCluster[] = []
  let clusterIndex = 0

  gridMap.forEach((vessels, key) => {
    if (vessels.length >= 2) {
      const center = calculateClusterCenter(vessels)
      const radius = calculateClusterRadius(vessels, center)
      const averageSpeed = vessels.reduce((sum, v) => sum + v.speed, 0) / vessels.length
      const vesselTypes = getVesselTypeStats(vessels)

      clusters.push({
        id: `grid-cluster-${clusterIndex++}`,
        vessels,
        center,
        radius,
        averageSpeed,
        vesselTypes,
      })
    }
  })

  return clusters.sort((a, b) => b.vessels.length - a.vessels.length)
}

/**
 * 클러스터 병합 (가까운 클러스터 통합)
 */
export function mergeClusters(
  clusters: VesselCluster[],
  mergeDistance: number = 1.0 // 1 해리
): VesselCluster[] {
  if (clusters.length <= 1) return clusters

  const merged: VesselCluster[] = []
  const processed = new Set<string>()

  clusters.forEach(cluster1 => {
    if (processed.has(cluster1.id)) return

    let mergedVessels = [...cluster1.vessels]

    clusters.forEach(cluster2 => {
      if (cluster1.id === cluster2.id || processed.has(cluster2.id)) return

      const distance = calculateDistance(
        cluster1.center.latitude,
        cluster1.center.longitude,
        cluster2.center.latitude,
        cluster2.center.longitude
      )

      if (distance <= mergeDistance) {
        mergedVessels = [...mergedVessels, ...cluster2.vessels]
        processed.add(cluster2.id)
      }
    })

    const center = calculateClusterCenter(mergedVessels)
    const radius = calculateClusterRadius(mergedVessels, center)
    const averageSpeed = mergedVessels.reduce((sum, v) => sum + v.speed, 0) / mergedVessels.length
    const vesselTypes = getVesselTypeStats(mergedVessels)

    merged.push({
      id: `merged-${merged.length}`,
      vessels: mergedVessels,
      center,
      radius,
      averageSpeed,
      vesselTypes,
    })

    processed.add(cluster1.id)
  })

  return merged.sort((a, b) => b.vessels.length - a.vessels.length)
}

/**
 * 클러스터 필터링
 */
export function filterClusters(
  clusters: VesselCluster[],
  filters: {
    minVessels?: number
    maxVessels?: number
    minSpeed?: number
    maxSpeed?: number
    vesselTypes?: string[]
  }
): VesselCluster[] {
  return clusters.filter(cluster => {
    if (filters.minVessels && cluster.vessels.length < filters.minVessels) return false
    if (filters.maxVessels && cluster.vessels.length > filters.maxVessels) return false
    if (filters.minSpeed && cluster.averageSpeed < filters.minSpeed) return false
    if (filters.maxSpeed && cluster.averageSpeed > filters.maxSpeed) return false

    if (filters.vesselTypes && filters.vesselTypes.length > 0) {
      const hasMatchingType = Array.from(cluster.vesselTypes.keys()).some(type =>
        filters.vesselTypes!.includes(type)
      )
      if (!hasMatchingType) return false
    }

    return true
  })
}
