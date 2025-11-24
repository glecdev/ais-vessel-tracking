import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react'
import type { Notification } from '@/types/notification.types'

interface NotificationToastProps {
  notification: Notification
  onClose: (id: string) => void
  onRead: (id: string) => void
}

export function NotificationToast({ notification, onClose, onRead }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  // 자동 닫기 타이머
  useEffect(() => {
    const duration = notification.priority === 'critical' ? 10000 : notification.priority === 'high' ? 7000 : 5000

    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(notification.id), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [notification, onClose])

  // 알림 읽음 처리
  useEffect(() => {
    if (!notification.read) {
      const readTimer = setTimeout(() => {
        onRead(notification.id)
      }, 1000)
      return () => clearTimeout(readTimer)
    }
  }, [notification, onRead])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(notification.id), 300)
  }

  const getIcon = () => {
    switch (notification.priority) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case 'medium':
        return <Bell className="w-5 h-5 text-yellow-500" />
      case 'low':
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getBorderColor = () => {
    switch (notification.priority) {
      case 'critical':
        return 'border-l-red-500'
      case 'high':
        return 'border-l-orange-500'
      case 'medium':
        return 'border-l-yellow-500'
      case 'low':
        return 'border-l-blue-500'
    }
  }

  const getBackgroundColor = () => {
    switch (notification.priority) {
      case 'critical':
        return 'bg-red-50'
      case 'high':
        return 'bg-orange-50'
      case 'medium':
        return 'bg-yellow-50'
      case 'low':
        return 'bg-blue-50'
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className={`
            flex items-start gap-3 p-4 rounded-lg shadow-lg border-l-4
            ${getBorderColor()} ${getBackgroundColor()}
            min-w-[320px] max-w-[420px]
          `}
        >
          {/* 아이콘 */}
          <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">{notification.title}</h4>
            <p className="text-sm text-gray-700 break-words">{notification.message}</p>

            {/* 추가 데이터 표시 */}
            {notification.data && (
              <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                {notification.data.vesselName && (
                  <div>선박: {notification.data.vesselName}</div>
                )}
                {notification.data.distance !== undefined && (
                  <div>거리: {notification.data.distance.toFixed(2)} NM</div>
                )}
                {notification.data.cpa !== undefined && notification.data.tcpa !== undefined && (
                  <div>
                    CPA: {notification.data.cpa.toFixed(2)} NM / TCPA: {notification.data.tcpa.toFixed(1)}분
                  </div>
                )}
                {notification.data.speed !== undefined && (
                  <div>속도: {notification.data.speed.toFixed(1)} kn</div>
                )}
              </div>
            )}

            {/* 타임스탬프 */}
            <div className="mt-2 text-xs text-gray-500">
              {new Date(notification.timestamp).toLocaleTimeString('ko-KR')}
            </div>
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface NotificationToastContainerProps {
  notifications: Notification[]
  onClose: (id: string) => void
  onRead: (id: string) => void
}

export function NotificationToastContainer({
  notifications,
  onClose,
  onRead,
}: NotificationToastContainerProps) {
  // 최근 3개만 표시
  const visibleNotifications = notifications.slice(0, 3)

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <div className="pointer-events-auto">
        {visibleNotifications.map(notification => (
          <div key={notification.id} className="mb-3">
            <NotificationToast notification={notification} onClose={onClose} onRead={onRead} />
          </div>
        ))}
      </div>
    </div>
  )
}
