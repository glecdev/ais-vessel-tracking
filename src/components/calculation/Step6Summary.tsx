/**
 * Step 6: 계산 결과 요약
 * ISO-14083 탄소배출량 계산 결과 표시
 */
import { useCalculationStore, formDataToJSON } from '@/stores/calculationStore'
import {
  Calculator,
  Leaf,
  TrendingDown,
  BarChart3,
  FileJson,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function Step6Summary() {
  const {
    formData,
    requestJSON,
    responseJSON,
    isCalculating,
    error,
    calculate
  } = useCalculationStore()

  const [copied, setCopied] = useState<'request' | 'response' | null>(null)

  const apiRequest = formDataToJSON(formData)
  const hasResponse = responseJSON && responseJSON !== '{}'

  let parsedResponse = null
  try {
    parsedResponse = JSON.parse(responseJSON)
  } catch {
    // Invalid JSON
  }

  const handleCalculate = async () => {
    await calculate()
  }

  const handleCopy = async (type: 'request' | 'response') => {
    const content = type === 'request' ? requestJSON : responseJSON
    await navigator.clipboard.writeText(content)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDownload = (type: 'request' | 'response') => {
    const content = type === 'request' ? requestJSON : responseJSON
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `glec-api-${type}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 입력 데이터 요약 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">입력 데이터 요약</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">운송 일시:</span>
              <span className="ml-2 font-medium">{formData.transportDate}</span>
            </div>
            <div>
              <span className="text-gray-500">화주사:</span>
              <span className="ml-2 font-medium">{formData.shipper?.name || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">출발지:</span>
              <span className="ml-2 font-medium">{formData.origin?.name || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">도착지:</span>
              <span className="ml-2 font-medium">{formData.destination?.name || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">화물:</span>
              <span className="ml-2 font-medium">
                {formData.cargo
                  ? `${formData.cargo.type} - ${formData.cargo.weight} ${formData.cargo.unit}`
                  : '-'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">운송 구간:</span>
              <span className="ml-2 font-medium">{formData.routes.length}개</span>
            </div>
          </div>
        </div>
      </div>

      {/* 계산 버튼 */}
      {!hasResponse && (
        <div className="flex justify-center">
          <button
            onClick={handleCalculate}
            disabled={!apiRequest || isCalculating}
            className={cn(
              'flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all',
              apiRequest && !isCalculating
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            )}
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                계산 중...
              </>
            ) : (
              <>
                <Calculator className="w-6 h-6" />
                탄소배출량 계산하기
              </>
            )}
          </button>
        </div>
      )}

      {/* 에러 표시 */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 계산 결과 */}
      {hasResponse && parsedResponse?.result && (
        <>
          {/* 성공 메시지 */}
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">계산 완료</p>
              <p className="text-sm text-green-700">
                ISO-14083 표준 기준으로 탄소배출량이 계산되었습니다.
              </p>
            </div>
          </div>

          {/* 결과 카드 */}
          <div className="grid grid-cols-3 gap-4">
            {/* 총 배출량 */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-5 h-5" />
                <span className="text-green-100 text-sm">총 탄소배출량</span>
              </div>
              <p className="text-3xl font-bold">
                {parsedResponse.result.totalEmissions.value.toLocaleString()}
              </p>
              <p className="text-green-100">
                {parsedResponse.result.totalEmissions.unit}
              </p>
            </div>

            {/* 운송 활동 */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="text-gray-500 text-sm">운송 활동</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {parsedResponse.result.transportActivity.value.toLocaleString()}
              </p>
              <p className="text-gray-500">
                {parsedResponse.result.transportActivity.unit}
              </p>
            </div>

            {/* 배출 집약도 */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-purple-600" />
                <span className="text-gray-500 text-sm">배출 집약도</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {parsedResponse.result.emissionIntensity.value}
              </p>
              <p className="text-gray-500">
                {parsedResponse.result.emissionIntensity.unit}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {parsedResponse.result.emissionIntensity.source}
              </p>
            </div>
          </div>

          {/* 구간별 배출량 */}
          {parsedResponse.result.breakdown?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">구간별 배출량</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {parsedResponse.result.breakdown.map((segment: { segment: string; distance: number; emissions: number }, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {formData.routes[index]?.mode || segment.segment}
                        </p>
                        <p className="text-sm text-gray-500">
                          {segment.distance.toLocaleString()} km
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {segment.emissions.toFixed(2)} kgCO2e
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 다시 계산 버튼 */}
          <div className="flex justify-center">
            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className={cn('w-5 h-5', isCalculating && 'animate-spin')} />
              다시 계산
            </button>
          </div>
        </>
      )}

      {/* API Request/Response JSON */}
      <div className="grid grid-cols-2 gap-4">
        {/* Request */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">API Request</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCopy('request')}
                className="p-1.5 text-gray-400 hover:text-white rounded"
                title="복사"
              >
                {copied === 'request' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => handleDownload('request')}
                className="p-1.5 text-gray-400 hover:text-white rounded"
                title="다운로드"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <pre className="p-4 text-sm text-green-300 font-mono overflow-x-auto max-h-[300px]">
            {requestJSON || '{}'}
          </pre>
        </div>

        {/* Response */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">API Response</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCopy('response')}
                className="p-1.5 text-gray-400 hover:text-white rounded"
                title="복사"
                disabled={!hasResponse}
              >
                {copied === 'response' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => handleDownload('response')}
                className="p-1.5 text-gray-400 hover:text-white rounded"
                title="다운로드"
                disabled={!hasResponse}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <pre className="p-4 text-sm text-blue-300 font-mono overflow-x-auto max-h-[300px]">
            {responseJSON || '// 계산 후 응답이 표시됩니다'}
          </pre>
        </div>
      </div>
    </div>
  )
}
