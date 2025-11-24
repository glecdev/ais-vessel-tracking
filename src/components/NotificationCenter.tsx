import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, CheckCheck, Trash2, Filter, Settings } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Notification, NotificationType } from '@/types/notification.types'

interface NotificationCenterProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  onClearAll: () => void
  onOpenSettings: () => void
}

export function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onOpenSettings,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  // 필터링된 알림
  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType)
    }

    if (showUnreadOnly) {
      filtered = filtered.filter(n => !n.read)
    }

    return filtered
  }, [notifications, filterType, showUnreadOnly])

  const getTypeLabel = (type: NotificationType) => {
    const labels: Record<NotificationType, string> = {
      collision: '충돌',
      speed: '속도',
      zone: '구역',
      vessel: '선박',
      info: '정보',
    }
    return labels[type]
  }

  const getTypeColor = (type: NotificationType) => {
    const colors: Record<NotificationType, string> = {
      collision: 'bg-red-100 text-red-700',
      speed: 'bg-orange-100 text-orange-700',
      zone: 'bg-purple-100 text-purple-700',
      vessel: 'bg-blue-100 text-blue-700',
      info: 'bg-gray-100 text-gray-700',
    }
    return colors[type]
  }

  const getPriorityEmoji = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '🚨'
      case 'high':
        return '⚠️'
      case 'medium':
        return '📢'
      case 'low':
        return 'ℹ️'
      default:
        return ''
    }
  }

  return (
    <div className="relative">
      {/* 알림 벨 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="알림 센터"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* 드롭다운 패널 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* 알림 패널 */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-[420px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col"
            >
              {/* 헤더 */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">알림</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onOpenSettings}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="설정"
                    >
                      <Settings className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="닫기"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* 필터 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filterType === 'all'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    전체
                  </button>
                  {(['collision', 'speed', 'zone', 'vessel', 'info'] as NotificationType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        filterType === type
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {getTypeLabel(type)}
                    </button>
                  ))}
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      showUnreadOnly
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    읽지 않음만
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllAsRead}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      모두 읽음
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={onClearAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      모두 삭제
                    </button>
                  )}
                </div>
              </div>

              {/* 알림 목록 */}
              <div className="flex-1 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Bell className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="text-sm font-medium">알림이 없습니다</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredNotifications.map(notification => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* 우선순위 이모지 */}
                          <div className="text-xl">{getPriorityEmoji(notification.priority)}</div>

                          {/* 내용 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-gray-900">
                                {notification.title}
                              </h4>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${getTypeColor(
                                  notification.type
                                )}`}
                              >
                                {getTypeLabel(notification.type)}
                              </span>
                            </div>

                            <p className="text-sm text-gray-700 mb-2">{notification.message}</p>

                            {/* 추가 데이터 */}
                            {notification.data && (
                              <div className="text-xs text-gray-600 space-y-0.5 mb-2">
                                {notification.data.vesselName && (
                                  <div>선박: {notification.data.vesselName}</div>
                                )}
                                {notification.data.distance !== undefined && (
                                  <div>거리: {notification.data.distance.toFixed(2)} NM</div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(notification.timestamp, {
                                  addSuffix: true,
                                  locale: ko,
                                })}
                              </span>

                              <div className="flex items-center gap-1">
                                {!notification.read && (
                                  <button
                                    onClick={() => onMarkAsRead(notification.id)}
                                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                                    aria-label="읽음 표시"
                                  >
                                    <Check className="w-4 h-4 text-gray-600" />
                                  </button>
                                )}
                                <button
                                  onClick={() => onDelete(notification.id)}
                                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                                  aria-label="삭제"
                                >
                                  <Trash2 className="w-4 h-4 text-gray-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
