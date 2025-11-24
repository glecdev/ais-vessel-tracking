import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileText, FileJson, MapPin, Bell, X, Check } from 'lucide-react'
import type { Vessel } from '@/types/ais.types'
import type { VesselTrack } from '@/hooks/useVesselTracking'
import type { Notification } from '@/types/notification.types'
import {
  exportVesselsToCSV,
  exportVesselsToJSON,
  exportTracksToCSV,
  exportTracksToGeoJSON,
  exportNotificationsToCSV,
  exportNotificationsToJSON,
  exportFullReport,
} from '@/utils/dataExport'

interface ExportPanelProps {
  isOpen: boolean
  onClose: () => void
  vessels: Vessel[]
  tracks: Map<number, VesselTrack>
  notifications: Notification[]
}

type ExportType = 'vessels' | 'tracks' | 'notifications' | 'full'
type ExportFormat = 'csv' | 'json' | 'geojson'

export function ExportPanel({
  isOpen,
  onClose,
  vessels,
  tracks,
  notifications,
}: ExportPanelProps) {
  const [selectedType, setSelectedType] = useState<ExportType>('vessels')
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv')
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    setExportSuccess(false)

    try {
      // 약간의 지연을 추가하여 UX 개선
      await new Promise(resolve => setTimeout(resolve, 500))

      switch (selectedType) {
        case 'vessels':
          if (selectedFormat === 'csv') {
            exportVesselsToCSV(vessels)
          } else {
            exportVesselsToJSON(vessels)
          }
          break

        case 'tracks':
          if (selectedFormat === 'csv') {
            exportTracksToCSV(tracks)
          } else {
            exportTracksToGeoJSON(tracks)
          }
          break

        case 'notifications':
          if (selectedFormat === 'csv') {
            exportNotificationsToCSV(notifications)
          } else {
            exportNotificationsToJSON(notifications)
          }
          break

        case 'full':
          exportFullReport(vessels, tracks, notifications)
          break
      }

      setExportSuccess(true)
      setTimeout(() => {
        setExportSuccess(false)
      }, 2000)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const getExportInfo = () => {
    switch (selectedType) {
      case 'vessels':
        return {
          count: vessels.length,
          label: '선박',
          icon: <FileText className="w-5 h-5" />,
          formats: ['csv', 'json'] as ExportFormat[],
        }
      case 'tracks':
        return {
          count: tracks.size,
          label: '추적 기록',
          icon: <MapPin className="w-5 h-5" />,
          formats: ['csv', 'geojson'] as ExportFormat[],
        }
      case 'notifications':
        return {
          count: notifications.length,
          label: '알림',
          icon: <Bell className="w-5 h-5" />,
          formats: ['csv', 'json'] as ExportFormat[],
        }
      case 'full':
        return {
          count: vessels.length + tracks.size + notifications.length,
          label: '전체 데이터',
          icon: <Download className="w-5 h-5" />,
          formats: ['json'] as ExportFormat[],
        }
    }
  }

  const info = getExportInfo()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* 내보내기 패널 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-50"
          >
            {/* 헤더 */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Download className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">데이터 내보내기</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* 내용 */}
            <div className="p-6 space-y-6">
              {/* 데이터 유형 선택 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">데이터 유형</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(['vessels', 'tracks', 'notifications', 'full'] as ExportType[]).map(type => {
                    const typeInfo = {
                      vessels: { label: '선박 데이터', icon: <FileText className="w-4 h-4" /> },
                      tracks: { label: '추적 기록', icon: <MapPin className="w-4 h-4" /> },
                      notifications: { label: '알림', icon: <Bell className="w-4 h-4" /> },
                      full: { label: '전체 리포트', icon: <FileJson className="w-4 h-4" /> },
                    }[type]

                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedType(type)
                          if (type === 'full') {
                            setSelectedFormat('json')
                          } else if (type === 'tracks' && selectedFormat === 'json') {
                            setSelectedFormat('geojson')
                          }
                        }}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          selectedType === type
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {typeInfo.icon}
                        <span className="text-sm font-medium">{typeInfo.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 포맷 선택 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">내보내기 형식</h3>
                <div className="flex gap-2">
                  {info.formats.map(format => (
                    <button
                      key={format}
                      onClick={() => setSelectedFormat(format)}
                      disabled={selectedType === 'full'}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedFormat === format
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      } ${selectedType === 'full' && 'opacity-50 cursor-not-allowed'}`}
                    >
                      <span className="text-sm font-medium uppercase">{format}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 데이터 미리보기 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">내보낼 데이터</span>
                  <span className="text-2xl font-bold text-green-600">{info.count}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {info.icon}
                  <span>{info.label}</span>
                </div>
              </div>

              {/* 내보내기 정보 */}
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5" />
                  <span>CSV: 표 형식, Excel에서 열기 가능</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5" />
                  <span>JSON: 구조화된 데이터, 프로그래밍 가능</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5" />
                  <span>GeoJSON: 지리 데이터, GIS 소프트웨어 호환</span>
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleExport}
                disabled={isExporting || info.count === 0}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  exportSuccess
                    ? 'bg-green-500 text-white'
                    : isExporting || info.count === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {exportSuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    내보내기 완료!
                  </>
                ) : isExporting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Download className="w-5 h-5" />
                    </motion.div>
                    내보내는 중...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    {info.count === 0 ? '데이터 없음' : '내보내기'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
