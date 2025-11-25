import { useState, useEffect, useCallback, useRef } from 'react'
import type { Vessel } from '@/types/ais.types'
import type { Notification, NotificationSettings } from '@/types/notification.types'
import { detectCollisions } from '@/utils/collisionDetection'
import { nanoid } from 'nanoid'

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  sound: true,
  desktop: false,
  types: {
    collision: true,
    speed: true,
    zone: true,
    vessel: true,
    info: true,
  },
  thresholds: {
    collisionDistance: 500,
    speedChange: 5,
  },
}

export function useNotifications(vessels: Vessel[]) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS)
  const [unreadCount, setUnreadCount] = useState(0)

  const previousVesselsRef = useRef<Map<number, Vessel>>(new Map())
  const collisionAlertsRef = useRef<Set<string>>(new Set())

  // 알림 추가
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      if (!settings.enabled || !settings.types[notification.type]) {
        return
      }

      const newNotification: Notification = {
        ...notification,
        id: nanoid(),
        timestamp: Date.now(),
        read: false,
      }

      setNotifications(prev => [newNotification, ...prev])
      setUnreadCount(prev => prev + 1)

      // 사운드 재생
      if (settings.sound) {
        playNotificationSound(notification.priority)
      }

      // 데스크톱 알림
      if (settings.desktop && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/ship-icon.png',
          })
        }
      }
    },
    [settings]
  )

  // 충돌 감지
  useEffect(() => {
    if (!settings.types.collision || vessels.length < 2) return

    const alerts = detectCollisions(vessels, settings.thresholds.collisionDistance)

    alerts.forEach(alert => {
      // 중복 알림 방지
      const alertKey = `${alert.vessel1MMSI}-${alert.vessel2MMSI}`
      if (collisionAlertsRef.current.has(alertKey)) return

      collisionAlertsRef.current.add(alertKey)

      // 5분 후 키 제거 (재알림 허용)
      setTimeout(() => {
        collisionAlertsRef.current.delete(alertKey)
      }, 5 * 60 * 1000)

      const vessel1 = vessels.find(v => v.mmsi === alert.vessel1MMSI)
      const vessel2 = vessels.find(v => v.mmsi === alert.vessel2MMSI)

      if (vessel1 && vessel2) {
        const priority = alert.severity === 'critical' ? 'critical' : alert.severity === 'danger' ? 'high' : 'medium'

        addNotification({
          type: 'collision',
          priority,
          title: '⚠️ 충돌 경고',
          message: `${vessel1.name}과(와) ${vessel2.name}의 거리가 가까워지고 있습니다 (${alert.distance.toFixed(0)}m)`,
          data: {
            vesselMMSI: vessel1.mmsi,
            vesselName: vessel1.name,
            distance: alert.distance,
            cpa: alert.cpa,
            tcpa: alert.tcpa,
          },
        })
      }
    })
  }, [vessels, settings, addNotification])

  // 속도 이상 감지
  useEffect(() => {
    if (!settings.types.speed) return

    vessels.forEach(vessel => {
      const previous = previousVesselsRef.current.get(vessel.mmsi)

      if (previous) {
        const speedChange = Math.abs(vessel.speed - previous.speed)

        if (speedChange > settings.thresholds.speedChange) {
          addNotification({
            type: 'speed',
            priority: 'medium',
            title: '📊 속도 변화 감지',
            message: `${vessel.name}의 속도가 급격히 변했습니다 (${previous.speed.toFixed(1)} → ${vessel.speed.toFixed(1)} kn)`,
            data: {
              vesselMMSI: vessel.mmsi,
              vesselName: vessel.name,
              speed: vessel.speed,
            },
          })
        }
      }

      previousVesselsRef.current.set(vessel.mmsi, { ...vessel })
    })
  }, [vessels, settings, addNotification])

  // 알림 읽음 처리
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  // 모두 읽음 처리
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  // 알림 삭제
  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id)
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1))
      }
      return prev.filter(n => n.id !== id)
    })
  }, [])

  // 모두 삭제
  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  // 설정 업데이트
  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }, [])

  // 데스크톱 알림 권한 요청
  const requestDesktopPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }, [])

  return {
    notifications,
    unreadCount,
    settings,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updateSettings,
    requestDesktopPermission,
  }
}

// 사운드 재생
function playNotificationSound(priority: string) {
  try {
    const audio = new Audio()
    audio.volume = 0.5

    switch (priority) {
      case 'critical':
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZSA0PVKvn77BiFQg+ltryy3krBSh+zPDblUMLG2S56ualUhULTKXh8bllHQU2kNbzzn0uBSl+zPDblUMLG2S56ualUhULTKXh8bllHQU2kNbzzn0uBSl+zPDblUMLG2S56ualUhULTKXh8bllHQU2kNbzzn0u'
        break
      case 'high':
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA'
        break
      default:
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA'
    }

    audio.play().catch(() => {
      // 사용자가 아직 페이지와 상호작용하지 않은 경우 무시
    })
  } catch (error) {
    console.warn('Failed to play notification sound:', error)
  }
}
