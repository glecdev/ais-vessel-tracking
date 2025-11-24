export type NotificationType = 'collision' | 'speed' | 'zone' | 'vessel' | 'info'
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Notification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  timestamp: number
  read: boolean
  data?: {
    vesselMMSI?: number
    vesselName?: string
    distance?: number // meters
    cpa?: number // nautical miles
    tcpa?: number // minutes
    zone?: string
    speed?: number
    [key: string]: any
  }
}

export interface NotificationSettings {
  enabled: boolean
  sound: boolean
  desktop: boolean
  types: {
    collision: boolean
    speed: boolean
    zone: boolean
    vessel: boolean
    info: boolean
  }
  thresholds: {
    collisionDistance: number // meters
    speedChange: number // knots
  }
}

export interface CollisionAlert {
  vessel1MMSI: number
  vessel2MMSI: number
  distance: number // meters
  cpa: number // nautical miles
  tcpa: number // minutes
  severity: 'warning' | 'danger' | 'critical'
}
