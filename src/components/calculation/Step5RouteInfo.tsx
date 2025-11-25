/**
 * Step 5: 경로 정보 입력
 * 출발지/도착지 위치 설정
 */
import { useState } from 'react'
import { useCalculationStore, type Location } from '@/stores/calculationStore'
import {
  MapPin,
  Navigation,
  Info,
  Search,
  Check,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PresetLocation {
  name: string
  nameEn: string
  latitude: number
  longitude: number
  type: 'port' | 'airport' | 'terminal' | 'city'
}

const PRESET_LOCATIONS: PresetLocation[] = [
  // 한국 주요 항만/공항
  { name: '부산항', nameEn: 'Busan Port', latitude: 35.1028, longitude: 129.0403, type: 'port' },
  { name: '인천항', nameEn: 'Incheon Port', latitude: 37.4603, longitude: 126.6291, type: 'port' },
  { name: '광양항', nameEn: 'Gwangyang Port', latitude: 34.9053, longitude: 127.6922, type: 'port' },
  { name: '인천국제공항', nameEn: 'Incheon Intl Airport', latitude: 37.4602, longitude: 126.4407, type: 'airport' },
  { name: '김포국제공항', nameEn: 'Gimpo Intl Airport', latitude: 37.5583, longitude: 126.7906, type: 'airport' },

  // 아시아 주요 항만
  { name: '상하이항', nameEn: 'Shanghai Port', latitude: 31.2304, longitude: 121.4737, type: 'port' },
  { name: '싱가포르항', nameEn: 'Singapore Port', latitude: 1.2644, longitude: 103.8198, type: 'port' },
  { name: '도쿄항', nameEn: 'Tokyo Port', latitude: 35.6532, longitude: 139.7870, type: 'port' },
  { name: '홍콩항', nameEn: 'Hong Kong Port', latitude: 22.2855, longitude: 114.1577, type: 'port' },

  // 유럽/미국
  { name: '로테르담항', nameEn: 'Rotterdam Port', latitude: 51.9054, longitude: 4.4677, type: 'port' },
  { name: '함부르크항', nameEn: 'Hamburg Port', latitude: 53.5511, longitude: 9.9937, type: 'port' },
  { name: 'LA항', nameEn: 'Los Angeles Port', latitude: 33.7361, longitude: -118.2648, type: 'port' },

  // 주요 물류 터미널
  { name: '서울 ICD', nameEn: 'Seoul ICD', latitude: 37.5759, longitude: 127.1035, type: 'terminal' },
  { name: '평택 물류센터', nameEn: 'Pyeongtaek Hub', latitude: 36.9910, longitude: 127.0858, type: 'terminal' },
]

export function Step5RouteInfo() {
  const { formData, updateFormData } = useCalculationStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeField, setActiveField] = useState<'origin' | 'destination'>('origin')

  const filteredLocations = PRESET_LOCATIONS.filter(loc =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectLocation = (location: PresetLocation) => {
    const loc: Location = {
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude
    }

    if (activeField === 'origin') {
      updateFormData({ origin: loc })
      setActiveField('destination')
    } else {
      updateFormData({ destination: loc })
    }
    setSearchTerm('')
  }

  const getTypeIcon = (type: PresetLocation['type']) => {
    switch (type) {
      case 'port':
        return '🚢'
      case 'airport':
        return '✈️'
      case 'terminal':
        return '🏭'
      default:
        return '📍'
    }
  }

  const getTypeLabel = (type: PresetLocation['type']) => {
    switch (type) {
      case 'port':
        return '항만'
      case 'airport':
        return '공항'
      case 'terminal':
        return '터미널'
      default:
        return '도시'
    }
  }

  // 거리 계산 (Haversine formula)
  const calculateDistance = (): number | null => {
    if (!formData.origin || !formData.destination) return null

    const R = 6371 // 지구 반경 (km)
    const dLat = (formData.destination.latitude - formData.origin.latitude) * Math.PI / 180
    const dLon = (formData.destination.longitude - formData.origin.longitude) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(formData.origin.latitude * Math.PI / 180) *
      Math.cos(formData.destination.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c)
  }

  const distance = calculateDistance()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 설명 카드 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">운송 경로 설정</h3>
            <p className="text-sm text-blue-700 mt-1">
              출발지와 도착지를 선택해주세요. 주요 항만, 공항, 물류 터미널을
              빠르게 선택하거나 직접 좌표를 입력할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 출발지/도착지 카드 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 출발지 */}
        <button
          onClick={() => setActiveField('origin')}
          className={cn(
            'p-4 rounded-lg border-2 text-left transition-all',
            activeField === 'origin'
              ? 'border-green-500 bg-green-50'
              : formData.origin
              ? 'border-green-300 bg-white'
              : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              formData.origin ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
            )}>
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-gray-700">출발지</span>
            {formData.origin && <Check className="w-4 h-4 text-green-600 ml-auto" />}
          </div>
          {formData.origin ? (
            <div>
              <p className="font-semibold text-gray-900">{formData.origin.name}</p>
              <p className="text-xs text-gray-500">
                {formData.origin.latitude.toFixed(4)}, {formData.origin.longitude.toFixed(4)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">출발지를 선택하세요</p>
          )}
        </button>

        {/* 도착지 */}
        <button
          onClick={() => setActiveField('destination')}
          className={cn(
            'p-4 rounded-lg border-2 text-left transition-all',
            activeField === 'destination'
              ? 'border-green-500 bg-green-50'
              : formData.destination
              ? 'border-green-300 bg-white'
              : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              formData.destination ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
            )}>
              <Navigation className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-gray-700">도착지</span>
            {formData.destination && <Check className="w-4 h-4 text-green-600 ml-auto" />}
          </div>
          {formData.destination ? (
            <div>
              <p className="font-semibold text-gray-900">{formData.destination.name}</p>
              <p className="text-xs text-gray-500">
                {formData.destination.latitude.toFixed(4)}, {formData.destination.longitude.toFixed(4)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">도착지를 선택하세요</p>
          )}
        </button>
      </div>

      {/* 경로 요약 */}
      {formData.origin && formData.destination && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="font-medium">{formData.origin.name}</span>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <span className="font-medium">{formData.destination.name}</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">직선 거리</p>
            <p className="font-semibold text-gray-900">{distance?.toLocaleString()} km</p>
          </div>
        </div>
      )}

      {/* 위치 검색 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {activeField === 'origin' ? '출발지' : '도착지'} 선택
          </span>
          <span className={cn(
            'px-2 py-0.5 text-xs rounded-full',
            activeField === 'origin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
          )}>
            {activeField === 'origin' ? 'Origin' : 'Destination'}
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="항만, 공항, 터미널 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* 위치 목록 */}
        <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
          {filteredLocations.map((location) => {
            const isSelected =
              (activeField === 'origin' && formData.origin?.name === location.name) ||
              (activeField === 'destination' && formData.destination?.name === location.name)

            return (
              <button
                key={`${location.name}-${location.latitude}`}
                onClick={() => handleSelectLocation(location)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                  isSelected
                    ? 'bg-green-50 border-green-500'
                    : 'bg-white border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                )}
              >
                <span className="text-xl">{getTypeIcon(location.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{location.name}</p>
                  <p className="text-xs text-gray-500">{getTypeLabel(location.type)}</p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-green-600 flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* API Request 미리보기 */}
      <div className="bg-gray-900 rounded-lg p-4 text-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-xs font-mono">API Request Preview</span>
          <span className="text-green-400 text-xs">origin / destination</span>
        </div>
        <pre className="text-green-300 font-mono">
{`{
  "origin": {
    "latitude": ${formData.origin?.latitude || 0},
    "longitude": ${formData.origin?.longitude || 0}
  },
  "destination": {
    "latitude": ${formData.destination?.latitude || 0},
    "longitude": ${formData.destination?.longitude || 0}
  }
}`}
        </pre>
      </div>
    </div>
  )
}
