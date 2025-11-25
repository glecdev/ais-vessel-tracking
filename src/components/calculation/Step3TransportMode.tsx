/**
 * Step 3: 운송 수단 선택
 * 멀티모달 운송 경로 설정
 */
import { useState } from 'react'
import { useCalculationStore, type Route } from '@/stores/calculationStore'
import {
  Truck,
  Ship,
  Train,
  Plane,
  Warehouse,
  Plus,
  Trash2,
  GripVertical,
  Info,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransportModeOption {
  mode: Route['mode']
  name: string
  nameKo: string
  icon: React.ReactNode
  color: string
  bgColor: string
  description: string
  avgEmission: string
}

const TRANSPORT_MODES: TransportModeOption[] = [
  {
    mode: 'truck',
    name: 'Truck',
    nameKo: '트럭',
    icon: <Truck className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: '도로 운송',
    avgEmission: '62 gCO2e/tkm'
  },
  {
    mode: 'ship',
    name: 'Ship',
    nameKo: '선박',
    icon: <Ship className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: '해상 운송',
    avgEmission: '8 gCO2e/tkm'
  },
  {
    mode: 'rail',
    name: 'Rail',
    nameKo: '철도',
    icon: <Train className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: '철도 운송',
    avgEmission: '22 gCO2e/tkm'
  },
  {
    mode: 'air',
    name: 'Air',
    nameKo: '항공',
    icon: <Plane className="w-6 h-6" />,
    color: 'text-sky-600',
    bgColor: 'bg-sky-100',
    description: '항공 운송',
    avgEmission: '602 gCO2e/tkm'
  },
  {
    mode: 'warehouse',
    name: 'Warehouse',
    nameKo: '물류센터',
    icon: <Warehouse className="w-6 h-6" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: '환적/보관',
    avgEmission: '5 kgCO2e/unit'
  }
]

export function Step3TransportMode() {
  const { formData, updateFormData } = useCalculationStore()
  const [selectedMode, setSelectedMode] = useState<Route['mode'] | null>(null)
  const [distance, setDistance] = useState('')

  const handleAddRoute = () => {
    if (!selectedMode || !distance) return

    const newRoute: Route = {
      mode: selectedMode,
      distance: parseFloat(distance)
    }

    updateFormData({
      routes: [...formData.routes, newRoute]
    })

    // Reset
    setSelectedMode(null)
    setDistance('')
  }

  const handleRemoveRoute = (index: number) => {
    updateFormData({
      routes: formData.routes.filter((_, i) => i !== index)
    })
  }

  const getModeInfo = (mode: Route['mode']): TransportModeOption => {
    return TRANSPORT_MODES.find(m => m.mode === mode) || TRANSPORT_MODES[0]
  }

  const totalDistance = formData.routes.reduce((sum, r) => sum + r.distance, 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 설명 카드 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">멀티모달 운송 경로</h3>
            <p className="text-sm text-blue-700 mt-1">
              운송 구간별로 운송 수단과 거리를 입력해주세요.
              복합 운송의 경우 여러 구간을 순서대로 추가할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 추가된 경로 목록 */}
      {formData.routes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">운송 경로 ({formData.routes.length}개 구간)</h4>
          <div className="space-y-2">
            {formData.routes.map((route, index) => {
              const modeInfo = getModeInfo(route.mode)
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />

                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    modeInfo.bgColor,
                    modeInfo.color
                  )}>
                    {modeInfo.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">구간 {index + 1}</span>
                      {index < formData.routes.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <p className="font-medium text-gray-900">
                      {modeInfo.nameKo} ({modeInfo.name})
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{route.distance.toLocaleString()} km</p>
                    <p className="text-xs text-gray-500">{modeInfo.avgEmission}</p>
                  </div>

                  <button
                    onClick={() => handleRemoveRoute(index)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}

            {/* 총 거리 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">총 운송 거리</span>
              <span className="font-semibold text-gray-900">{totalDistance.toLocaleString()} km</span>
            </div>
          </div>
        </div>
      )}

      {/* 운송 수단 선택 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">운송 수단 선택</h4>
        <div className="grid grid-cols-5 gap-2">
          {TRANSPORT_MODES.map((mode) => (
            <button
              key={mode.mode}
              onClick={() => setSelectedMode(mode.mode)}
              className={cn(
                'flex flex-col items-center p-4 rounded-lg border-2 transition-all',
                selectedMode === mode.mode
                  ? `${mode.bgColor} border-current ${mode.color}`
                  : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center mb-2',
                selectedMode === mode.mode ? mode.color : 'text-gray-500'
              )}>
                {mode.icon}
              </div>
              <span className="text-sm font-medium">{mode.nameKo}</span>
              <span className="text-xs text-gray-500">{mode.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 거리 입력 */}
      {selectedMode && (
        <div className="flex items-end gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getModeInfo(selectedMode).nameKo} 운송 거리
            </label>
            <div className="relative">
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="거리 입력"
                min="0"
                step="0.1"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">km</span>
            </div>
          </div>
          <button
            onClick={handleAddRoute}
            disabled={!distance || parseFloat(distance) <= 0}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-5 h-5" />
            추가
          </button>
        </div>
      )}

      {/* API Request 미리보기 */}
      <div className="bg-gray-900 rounded-lg p-4 text-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-xs font-mono">API Request Preview</span>
          <span className="text-green-400 text-xs">routes</span>
        </div>
        <pre className="text-green-300 font-mono overflow-x-auto">
{`{
  "routes": ${JSON.stringify(
    formData.routes.map(r => ({ mode: r.mode, distance: r.distance })),
    null,
    4
  ).replace(/\n/g, '\n  ')}
}`}
        </pre>
      </div>
    </div>
  )
}
