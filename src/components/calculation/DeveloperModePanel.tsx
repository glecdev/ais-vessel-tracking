/**
 * Developer Mode Panel
 * JSON 에디터 기반 API 테스트 인터페이스
 */
import { useState } from 'react'
import { useCalculationStore } from '@/stores/calculationStore'
import {
  Code,
  Play,
  Copy,
  Check,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileJson,
  RefreshCw,
  ArrowRight,
  Braces,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function DeveloperModePanel() {
  const {
    requestJSON,
    responseJSON,
    updateRequestJSON,
    isCalculating,
    error,
    calculate,
    syncJSONToForm
  } = useCalculationStore()

  const [copied, setCopied] = useState<'request' | 'response' | null>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)

  const handleRequestChange = (value: string) => {
    updateRequestJSON(value)

    // JSON 유효성 검사
    try {
      JSON.parse(value)
      setJsonError(null)
    } catch {
      setJsonError('Invalid JSON format')
    }
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

  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          handleRequestChange(content)
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(requestJSON)
      updateRequestJSON(JSON.stringify(parsed, null, 2))
      setJsonError(null)
    } catch {
      setJsonError('Cannot format invalid JSON')
    }
  }

  const handleExecute = async () => {
    if (jsonError) return
    syncJSONToForm() // Design Mode와 동기화
    await calculate()
  }

  const hasResponse = responseJSON && responseJSON !== '{}'

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
            <Code className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Developer Mode</h2>
            <p className="text-sm text-gray-500">GLEC LCS API 직접 테스트</p>
          </div>
        </div>

        {/* 실행 버튼 */}
        <button
          onClick={handleExecute}
          disabled={isCalculating || !!jsonError}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all',
            isCalculating || jsonError
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          )}
        >
          {isCalculating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              실행 중...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              API 실행
            </>
          )}
        </button>
      </div>

      {/* API 엔드포인트 표시 */}
      <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg font-mono text-sm">
        <span className="px-2 py-1 bg-green-600 text-white rounded text-xs font-bold">POST</span>
        <span className="text-gray-700">https://sfc-lcs.glec.io/emission-calculations</span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className="text-gray-500">ISO-14083 탄소배출량 계산</span>
      </div>

      {/* 에러/상태 표시 */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {jsonError && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{jsonError}</span>
        </div>
      )}

      {hasResponse && !error && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-green-900">API 호출 성공</p>
            <p className="text-sm text-green-700">응답이 정상적으로 수신되었습니다.</p>
          </div>
        </div>
      )}

      {/* JSON 에디터 영역 */}
      <div className="grid grid-cols-2 gap-4 h-[600px]">
        {/* Request Editor */}
        <div className="flex flex-col bg-gray-900 rounded-lg overflow-hidden">
          {/* 툴바 */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-gray-300">Request Body</span>
              <span className="px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">JSON</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleUpload}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="파일 업로드"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                onClick={handleFormat}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="JSON 포맷"
              >
                <Braces className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCopy('request')}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
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
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="다운로드"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 에디터 */}
          <textarea
            value={requestJSON}
            onChange={(e) => handleRequestChange(e.target.value)}
            spellCheck={false}
            className={cn(
              'flex-1 p-4 bg-transparent text-green-300 font-mono text-sm resize-none focus:outline-none',
              'scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent',
              jsonError && 'text-red-400'
            )}
            placeholder={`{
  "transportDate": "2024-11-25",
  "shipperId": "shipper-1",
  "origin": {
    "latitude": 35.1028,
    "longitude": 129.0403
  },
  "destination": {
    "latitude": 31.2304,
    "longitude": 121.4737
  },
  "cargo": {
    "type": "CONT-GEN",
    "weight": 15000
  },
  "routes": [
    { "mode": "truck", "distance": 50 },
    { "mode": "ship", "distance": 850 }
  ]
}`}
          />

          {/* 줄 수 표시 */}
          <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-500">
            {requestJSON.split('\n').length} lines
          </div>
        </div>

        {/* Response Viewer */}
        <div className="flex flex-col bg-gray-900 rounded-lg overflow-hidden">
          {/* 툴바 */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">Response</span>
              {hasResponse && (
                <span className="px-1.5 py-0.5 bg-green-900 text-green-400 rounded text-xs">200 OK</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCopy('response')}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
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
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="다운로드"
                disabled={!hasResponse}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 응답 표시 */}
          <div className="flex-1 p-4 overflow-auto">
            {isCalculating ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p>API 요청 처리 중...</p>
              </div>
            ) : hasResponse ? (
              <pre className="text-blue-300 font-mono text-sm whitespace-pre-wrap">
                {responseJSON}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Zap className="w-8 h-8 mb-3" />
                <p>API 실행 후 응답이 표시됩니다</p>
              </div>
            )}
          </div>

          {/* 응답 정보 */}
          {hasResponse && (
            <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-500">
              {responseJSON.split('\n').length} lines • {(new TextEncoder().encode(responseJSON).length / 1024).toFixed(2)} KB
            </div>
          )}
        </div>
      </div>

      {/* API 문서 링크 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-gray-500" />
          <div>
            <p className="font-medium text-gray-900">Design Mode와 자동 동기화</p>
            <p className="text-sm text-gray-500">
              JSON 수정 시 Design Mode 폼 데이터가 자동으로 업데이트됩니다.
            </p>
          </div>
        </div>
        <a
          href="https://docs.glec.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          API 문서 보기 →
        </a>
      </div>
    </div>
  )
}
