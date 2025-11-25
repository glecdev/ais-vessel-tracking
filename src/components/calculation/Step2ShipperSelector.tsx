/**
 * Step 2: 화주사 선택
 * 화물 소유 기업 정보 입력
 */
import { useState, useEffect } from 'react'
import { useCalculationStore, type Shipper } from '@/stores/calculationStore'
import { mockGLECAPI } from '@/services/glecAPI'
import { Building2, Search, Plus, Check, Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Step2ShipperSelector() {
  const { formData, updateFormData } = useCalculationStore()
  const [shippers, setShippers] = useState<Shipper[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showNewShipperForm, setShowNewShipperForm] = useState(false)
  const [newShipper, setNewShipper] = useState({ name: '', businessNumber: '' })

  // 화주사 목록 로드
  useEffect(() => {
    const loadShippers = async () => {
      setIsLoading(true)
      try {
        const data = await mockGLECAPI.getShippers(searchTerm || undefined)
        setShippers(data)
      } catch (error) {
        console.error('Failed to load shippers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(loadShippers, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm])

  const handleSelectShipper = (shipper: Shipper) => {
    updateFormData({ shipper })
  }

  const handleAddNewShipper = () => {
    if (!newShipper.name.trim()) return

    const shipper: Shipper = {
      id: `new-${Date.now()}`,
      name: newShipper.name,
      businessNumber: newShipper.businessNumber || undefined
    }

    updateFormData({ shipper })
    setShowNewShipperForm(false)
    setNewShipper({ name: '', businessNumber: '' })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 설명 카드 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">화주사 (Shipper) 선택</h3>
            <p className="text-sm text-blue-700 mt-1">
              화물의 소유자 또는 운송을 의뢰하는 기업입니다.
              배출량 리포트에 화주사 정보가 포함됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="화주사 이름 또는 사업자번호로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* 화주사 목록 */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : shippers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            검색 결과가 없습니다
          </div>
        ) : (
          <div className="grid gap-2 max-h-[320px] overflow-y-auto">
            {shippers.map((shipper) => {
              const isSelected = formData.shipper?.id === shipper.id
              return (
                <button
                  key={shipper.id}
                  onClick={() => handleSelectShipper(shipper)}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border text-left transition-all',
                    isSelected
                      ? 'bg-green-50 border-green-500 ring-2 ring-green-200'
                      : 'bg-white border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      isSelected ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                    )}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{shipper.name}</p>
                      {shipper.businessNumber && (
                        <p className="text-sm text-gray-500">
                          사업자번호: {shipper.businessNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 새 화주사 추가 */}
      {!showNewShipperForm ? (
        <button
          onClick={() => setShowNewShipperForm(true)}
          className="flex items-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          새 화주사 추가
        </button>
      ) : (
        <div className="p-4 border border-gray-200 rounded-lg space-y-4 bg-gray-50">
          <h4 className="font-medium text-gray-900">새 화주사 정보</h4>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="화주사 이름 (필수)"
              value={newShipper.name}
              onChange={(e) => setNewShipper({ ...newShipper, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <input
              type="text"
              placeholder="사업자번호 (선택)"
              value={newShipper.businessNumber}
              onChange={(e) => setNewShipper({ ...newShipper, businessNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewShipperForm(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              취소
            </button>
            <button
              onClick={handleAddNewShipper}
              disabled={!newShipper.name.trim()}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {/* 선택된 화주사 표시 */}
      {formData.shipper && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-700">선택된 화주사</p>
              <p className="font-medium text-green-900">{formData.shipper.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* API Request 미리보기 */}
      <div className="bg-gray-900 rounded-lg p-4 text-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-xs font-mono">API Request Preview</span>
          <span className="text-green-400 text-xs">shipperId</span>
        </div>
        <pre className="text-green-300 font-mono">
{`{
  "shipperId": "${formData.shipper?.id || 'shipper-xxx'}"
}`}
        </pre>
      </div>
    </div>
  )
}
