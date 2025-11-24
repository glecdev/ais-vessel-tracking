import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, Volume2, Monitor, AlertCircle } from 'lucide-react'
import type { NotificationSettings as NotificationSettingsType } from '@/types/notification.types'

interface NotificationSettingsProps {
  isOpen: boolean
  settings: NotificationSettingsType
  onClose: () => void
  onUpdate: (updates: Partial<NotificationSettingsType>) => void
  onRequestDesktopPermission: () => Promise<boolean>
}

export function NotificationSettings({
  isOpen,
  settings,
  onClose,
  onUpdate,
  onRequestDesktopPermission,
}: NotificationSettingsProps) {
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  const handleDesktopToggle = async () => {
    if (!settings.desktop) {
      setIsRequestingPermission(true)
      const granted = await onRequestDesktopPermission()
      setIsRequestingPermission(false)

      if (granted) {
        onUpdate({ desktop: true })
      }
    } else {
      onUpdate({ desktop: false })
    }
  }

  const handleTypeToggle = (type: keyof NotificationSettingsType['types']) => {
    onUpdate({
      types: {
        ...settings.types,
        [type]: !settings.types[type],
      },
    })
  }

  const handleThresholdChange = (
    threshold: keyof NotificationSettingsType['thresholds'],
    value: number
  ) => {
    onUpdate({
      thresholds: {
        ...settings.thresholds,
        [threshold]: value,
      },
    })
  }

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

          {/* 설정 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* 헤더 */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bell className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">알림 설정</h2>
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
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 전역 설정 */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">전역 설정</h3>
                <div className="space-y-3">
                  {/* 알림 활성화 */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">알림 활성화</div>
                        <div className="text-xs text-gray-500">모든 알림 받기</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpdate({ enabled: !settings.enabled })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.enabled ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.enabled ? 24 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </button>
                  </div>

                  {/* 사운드 */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">사운드</div>
                        <div className="text-xs text-gray-500">알림음 재생</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpdate({ sound: !settings.sound })}
                      disabled={!settings.enabled}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.sound && settings.enabled ? 'bg-blue-500' : 'bg-gray-300'
                      } ${!settings.enabled && 'opacity-50 cursor-not-allowed'}`}
                    >
                      <motion.div
                        animate={{ x: settings.sound && settings.enabled ? 24 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </button>
                  </div>

                  {/* 데스크톱 알림 */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">데스크톱 알림</div>
                        <div className="text-xs text-gray-500">시스템 알림 표시</div>
                      </div>
                    </div>
                    <button
                      onClick={handleDesktopToggle}
                      disabled={!settings.enabled || isRequestingPermission}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.desktop && settings.enabled ? 'bg-blue-500' : 'bg-gray-300'
                      } ${(!settings.enabled || isRequestingPermission) && 'opacity-50 cursor-not-allowed'}`}
                    >
                      <motion.div
                        animate={{ x: settings.desktop && settings.enabled ? 24 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </button>
                  </div>
                </div>
              </section>

              {/* 알림 유형 */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">알림 유형</h3>
                <div className="space-y-2">
                  {[
                    { key: 'collision' as const, label: '충돌 경고', icon: '⚠️' },
                    { key: 'speed' as const, label: '속도 변화', icon: '📊' },
                    { key: 'zone' as const, label: '구역 알림', icon: '🗺️' },
                    { key: 'vessel' as const, label: '선박 알림', icon: '🚢' },
                    { key: 'info' as const, label: '정보 알림', icon: 'ℹ️' },
                  ].map(({ key, label, icon }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{icon}</span>
                        <span className="text-sm font-medium text-gray-900">{label}</span>
                      </div>
                      <button
                        onClick={() => handleTypeToggle(key)}
                        disabled={!settings.enabled}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.types[key] && settings.enabled ? 'bg-blue-500' : 'bg-gray-300'
                        } ${!settings.enabled && 'opacity-50 cursor-not-allowed'}`}
                      >
                        <motion.div
                          animate={{ x: settings.types[key] && settings.enabled ? 24 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* 임계값 */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">임계값</h3>
                <div className="space-y-4">
                  {/* 충돌 거리 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-900">충돌 경고 거리</label>
                      <span className="text-sm text-gray-600">
                        {settings.thresholds.collisionDistance}m
                      </span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="2000"
                      step="100"
                      value={settings.thresholds.collisionDistance}
                      onChange={e => handleThresholdChange('collisionDistance', Number(e.target.value))}
                      disabled={!settings.enabled || !settings.types.collision}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>100m</span>
                      <span>2000m</span>
                    </div>
                  </div>

                  {/* 속도 변화 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-900">속도 변화 임계값</label>
                      <span className="text-sm text-gray-600">
                        {settings.thresholds.speedChange} kn
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={settings.thresholds.speedChange}
                      onChange={e => handleThresholdChange('speedChange', Number(e.target.value))}
                      disabled={!settings.enabled || !settings.types.speed}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1 kn</span>
                      <span>20 kn</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 안내 메시지 */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">알림 설정 안내</p>
                  <ul className="text-xs space-y-1 text-blue-800">
                    <li>• 충돌 경고는 CPA/TCPA 알고리즘을 사용합니다</li>
                    <li>• 데스크톱 알림은 브라우저 권한이 필요합니다</li>
                    <li>• 알림은 최대 5분마다 반복됩니다</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
              >
                완료
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
