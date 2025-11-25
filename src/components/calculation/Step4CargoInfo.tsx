/**
 * Step 4: 화물 정보 입력
 * 화물 종류, 중량 입력
 */
import { useState, useEffect } from 'react'
import { useCalculationStore, type Cargo } from '@/stores/calculationStore'
import { mockGLECAPI, type CodeReference } from '@/services/glecAPI'
import {
  Package,
  Scale,
  Info,
  Check,
  Loader2,
  Container,
  Car,
  Cpu,
  Hammer,
  Apple
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CargoTypeOption {
  code: string
  name: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

const CARGO_ICONS: Record<string, CargoTypeOption> = {
  'CONT-GEN': {
    code: 'CONT-GEN',
    name: '컨테이너(일반)',
    icon: <Container className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  'CONT-COLD': {
    code: 'CONT-COLD',
    name: '컨테이너(냉동)',
    icon: <Container className="w-6 h-6" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100'
  },
  'VEHICLE': {
    code: 'VEHICLE',
    name: '차량',
    icon: <Car className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  'ELECTRONICS': {
    code: 'ELECTRONICS',
    name: '전자제품',
    icon: <Cpu className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  'CONSTRUCTION': {
    code: 'CONSTRUCTION',
    name: '건축자재',
    icon: <Hammer className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  'FOOD': {
    code: 'FOOD',
    name: '식품',
    icon: <Apple className="w-6 h-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  }
}

export function Step4CargoInfo() {
  const { formData, updateFormData } = useCalculationStore()
  const [cargoTypes, setCargoTypes] = useState<CodeReference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedType, setSelectedType] = useState(formData.cargo?.type || '')
  const [weight, setWeight] = useState(formData.cargo?.weight?.toString() || '')
  const [unit, setUnit] = useState<'kg' | 'ton'>(formData.cargo?.unit || 'ton')
  const [description, setDescription] = useState(formData.cargo?.description || '')

  // 화물 종류 로드
  useEffect(() => {
    const loadCargoTypes = async () => {
      setIsLoading(true)
      try {
        const data = await mockGLECAPI.getCargoTypeCodes()
        setCargoTypes(data)
      } catch (error) {
        console.error('Failed to load cargo types:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCargoTypes()
  }, [])

  // 화물 정보 업데이트
  useEffect(() => {
    if (selectedType && weight) {
      const cargo: Cargo = {
        type: selectedType,
        weight: parseFloat(weight),
        unit,
        description: description || undefined
      }
      updateFormData({ cargo })
    } else {
      updateFormData({ cargo: null })
    }
  }, [selectedType, weight, unit, description])

  const getCargoIcon = (code: string): CargoTypeOption => {
    return CARGO_ICONS[code] || {
      code,
      name: code,
      icon: <Package className="w-6 h-6" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    }
  }

  const displayWeight = (): string => {
    if (!weight) return '0'
    const w = parseFloat(weight)
    if (unit === 'kg') {
      return w >= 1000 ? `${(w / 1000).toLocaleString()} ton` : `${w.toLocaleString()} kg`
    }
    return `${w.toLocaleString()} ton`
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 설명 카드 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">화물 정보</h3>
            <p className="text-sm text-blue-700 mt-1">
              운송되는 화물의 종류와 중량을 입력해주세요.
              배출량 계산에서 t-km (톤-킬로미터) 기준이 적용됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 화물 종류 선택 */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">화물 종류</label>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {cargoTypes.map((type) => {
              const iconInfo = getCargoIcon(type.code)
              const isSelected = selectedType === type.code
              return (
                <button
                  key={type.code}
                  onClick={() => setSelectedType(type.code)}
                  className={cn(
                    'flex flex-col items-center p-4 rounded-lg border-2 transition-all',
                    isSelected
                      ? `${iconInfo.bgColor} border-current ${iconInfo.color}`
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center mb-2',
                    isSelected ? iconInfo.color : 'text-gray-500'
                  )}>
                    {iconInfo.icon}
                  </div>
                  <span className={cn(
                    'text-sm font-medium',
                    isSelected ? iconInfo.color : 'text-gray-700'
                  )}>
                    {type.name}
                  </span>
                  {isSelected && (
                    <Check className="w-4 h-4 mt-1" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 중량 입력 */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Scale className="w-4 h-4" />
          화물 중량
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="중량 입력"
              min="0"
              step="0.1"
              className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as 'kg' | 'ton')}
                className="bg-gray-100 border-0 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-green-500"
              >
                <option value="ton">ton</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>
        </div>

        {/* 중량 표시 */}
        {weight && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Scale className="w-4 h-4" />
            운송 중량: <span className="font-semibold">{displayWeight()}</span>
          </div>
        )}
      </div>

      {/* 화물 설명 (선택) */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          화물 설명 <span className="text-gray-400">(선택)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="화물에 대한 추가 설명을 입력하세요..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
        />
      </div>

      {/* 선택 요약 */}
      {formData.cargo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              getCargoIcon(formData.cargo.type).bgColor,
              getCargoIcon(formData.cargo.type).color
            )}>
              {getCargoIcon(formData.cargo.type).icon}
            </div>
            <div>
              <p className="text-sm text-green-700">선택된 화물</p>
              <p className="font-medium text-green-900">
                {cargoTypes.find(t => t.code === formData.cargo?.type)?.name || formData.cargo.type}
                {' '}- {displayWeight()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* API Request 미리보기 */}
      <div className="bg-gray-900 rounded-lg p-4 text-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-xs font-mono">API Request Preview</span>
          <span className="text-green-400 text-xs">cargo</span>
        </div>
        <pre className="text-green-300 font-mono">
{`{
  "cargo": {
    "type": "${selectedType || 'CARGO_TYPE'}",
    "weight": ${weight || 0}${unit === 'ton' ? ' // ton → kg 변환됨' : ''}
  }
}`}
        </pre>
      </div>
    </div>
  )
}
