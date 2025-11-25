import { useState } from 'react'
import { MapPin, Plus, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import type { GeoZone } from '@/types/geofencing.types'
import { getZoneCenter, calculateZoneArea } from '@/utils/geofencing'

interface ZoneManagerProps {
  zones: GeoZone[]
  onAddZone: (zone: Omit<GeoZone, 'id' | 'createdAt'>) => void
  onDeleteZone: (id: string) => void
  onToggleZone: (id: string) => void
  vesselCounts?: Map<string, number> // 각 존에 있는 선박 수
}

export function ZoneManager({
  zones,
  onAddZone,
  onDeleteZone,
  onToggleZone,
  vesselCounts = new Map(),
}: ZoneManagerProps) {
  const [isCreating, setIsCreating] = useState(false)

  // 간단한 원형 존 생성 폼
  const [newZone, setNewZone] = useState({
    name: '',
    latitude: 35.0,
    longitude: 129.0,
    radius: 5.0,
    color: '#3B82F6',
  })

  const handleCreateZone = () => {
    if (!newZone.name.trim()) {
      alert('존 이름을 입력하세요')
      return
    }

    onAddZone({
      name: newZone.name,
      description: '',
      geometry: {
        type: 'circle',
        center: {
          latitude: newZone.latitude,
          longitude: newZone.longitude,
        },
        radius: newZone.radius,
      },
      color: newZone.color,
      enabled: true,
      events: {
        enter: true,
        exit: true,
        dwell: false,
      },
    })

    // 초기화
    setNewZone({
      name: '',
      latitude: 35.0,
      longitude: 129.0,
      radius: 5.0,
      color: '#3B82F6',
    })
    setIsCreating(false)
  }

  const getZoneTypeLabel = (zone: GeoZone): string => {
    switch (zone.geometry.type) {
      case 'circle':
        return `원형 (반경 ${zone.geometry.radius.toFixed(1)} NM)`
      case 'rectangle':
        return '사각형'
      case 'polygon':
        return `다각형 (${zone.geometry.coordinates.length}점)`
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">지역 관리</h2>
              <p className="text-sm text-gray-500">{zones.length}개 존</p>
            </div>
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>새 존 추가</span>
          </button>
        </div>

        {/* 존 생성 폼 */}
        {isCreating && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">존 이름</label>
              <input
                type="text"
                value={newZone.name}
                onChange={e => setNewZone({ ...newZone, name: e.target.value })}
                placeholder="예: 부산항 구역"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">위도</label>
                <input
                  type="number"
                  step="0.1"
                  value={newZone.latitude}
                  onChange={e => setNewZone({ ...newZone, latitude: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">경도</label>
                <input
                  type="number"
                  step="0.1"
                  value={newZone.longitude}
                  onChange={e => setNewZone({ ...newZone, longitude: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                반경 (해리)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={newZone.radius}
                onChange={e => setNewZone({ ...newZone, radius: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">색상</label>
              <input
                type="color"
                value={newZone.color}
                onChange={e => setNewZone({ ...newZone, color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateZone}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                생성
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 존 목록 */}
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {zones.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">생성된 존이 없습니다</p>
            <p className="text-xs mt-1">위의 버튼을 클릭하여 새 존을 추가하세요</p>
          </div>
        ) : (
          zones.map(zone => {
            const center = getZoneCenter(zone)
            const area = calculateZoneArea(zone)
            const vesselCount = vesselCounts.get(zone.id) || 0

            return (
              <div key={zone.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: zone.color }}
                      />
                      <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                      {!zone.enabled && (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                          비활성
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{getZoneTypeLabel(zone)}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>중심: {center.latitude.toFixed(3)}°N, {center.longitude.toFixed(3)}°E</div>
                      <div>면적: ~{area.toFixed(1)} NM²</div>
                    </div>

                    {vesselCount > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-sm text-blue-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>{vesselCount}척 선박 내부</span>
                      </div>
                    )}

                    {/* 이벤트 설정 */}
                    <div className="mt-2 flex gap-2">
                      {zone.events.enter && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          진입
                        </span>
                      )}
                      {zone.events.exit && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                          이탈
                        </span>
                      )}
                      {zone.events.dwell && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                          체류
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => onToggleZone(zone.id)}
                      className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      aria-label={zone.enabled ? '비활성화' : '활성화'}
                    >
                      {zone.enabled ? (
                        <Eye className="w-4 h-4 text-gray-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    <button
                      onClick={() => onDeleteZone(zone.id)}
                      className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                      aria-label="삭제"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
