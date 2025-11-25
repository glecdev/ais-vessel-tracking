import { useState } from 'react'
import { Users, TrendingUp, Ship, ChevronDown, ChevronUp } from 'lucide-react'
import type { Vessel } from '@/types/ais.types'
import { type VesselCluster } from '@/utils/vesselClustering'

interface VesselClusterPanelProps {
  vessels: Vessel[]
  clusters: VesselCluster[]
  clusterMethod: 'dbscan' | 'grid'
  onClusterMethodChange: (method: 'dbscan' | 'grid') => void
  onSelectCluster?: (cluster: VesselCluster) => void
}

export function VesselClusterPanel({
  vessels,
  clusters,
  clusterMethod,
  onClusterMethodChange,
  onSelectCluster
}: VesselClusterPanelProps) {
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null)

  // Clusters are now passed as props


  const totalClustered = clusters.reduce((sum, c) => sum + c.vessels.length, 0)

  if (vessels.length < 2 && clusters.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">선박 클러스터</h2>
        </div>
        <p className="text-sm text-gray-500">클러스터를 형성할 만큼 충분한 선박이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">선박 클러스터</h2>
              <p className="text-sm text-gray-500">
                {clusters.length}개 그룹, {totalClustered}척 클러스터링
              </p>
            </div>
          </div>
        </div>

        {/* 클러스터링 방법 선택 */}
        <div className="flex gap-2">
          <button
            onClick={() => onClusterMethodChange('grid')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${clusterMethod === 'grid'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            격자 방식
          </button>
          <button
            onClick={() => onClusterMethodChange('dbscan')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${clusterMethod === 'dbscan'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            DBSCAN
          </button>
        </div>
      </div>

      {/* 클러스터 목록 */}
      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
        {clusters.map((cluster, index) => {
          const isExpanded = expandedCluster === cluster.id
          const topTypes = Array.from(cluster.vesselTypes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)

          return (
            <div key={cluster.id} className="p-4 hover:bg-gray-50 transition-colors">
              {/* 클러스터 요약 */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => {
                  setExpandedCluster(isExpanded ? null : cluster.id)
                  if (onSelectCluster) {
                    onSelectCluster(cluster)
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                    <span className="text-sm font-bold text-purple-600">
                      #{index + 1}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold text-gray-900">
                        {cluster.vessels.length}척
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <TrendingUp className="w-3 h-3" />
                      <span>평균 {cluster.averageSpeed.toFixed(1)} kn</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {cluster.center.latitude.toFixed(3)}°N
                    </div>
                    <div className="text-xs text-gray-500">
                      {cluster.center.longitude.toFixed(3)}°E
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* 확장된 상세 정보 */}
              {isExpanded && (
                <div className="mt-4 pl-13 space-y-3">
                  {/* 선박 유형 */}
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-2">선박 유형</div>
                    <div className="flex flex-wrap gap-2">
                      {topTypes.map(([type, count]) => (
                        <span
                          key={type}
                          className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium"
                        >
                          {type}: {count}척
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 클러스터 통계 */}
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-2">통계</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>반경: {cluster.radius.toFixed(2)} NM</div>
                      <div>평균 속도: {cluster.averageSpeed.toFixed(1)} kn</div>
                    </div>
                  </div>

                  {/* 선박 목록 (처음 5개만) */}
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-2">
                      선박 목록 {cluster.vessels.length > 5 && `(처음 5개)`}
                    </div>
                    <div className="space-y-1">
                      {cluster.vessels.slice(0, 5).map(vessel => (
                        <div
                          key={vessel.mmsi}
                          className="text-xs text-gray-600 flex justify-between"
                        >
                          <span className="truncate">{vessel.name}</span>
                          <span className="text-gray-400">{vessel.speed.toFixed(1)} kn</span>
                        </div>
                      ))}
                      {cluster.vessels.length > 5 && (
                        <div className="text-xs text-gray-400 italic">
                          ...외 {cluster.vessels.length - 5}척
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
