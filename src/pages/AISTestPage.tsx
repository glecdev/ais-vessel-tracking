import { useMemo, useState, useCallback } from 'react'
import { Download, Users, MapPin } from 'lucide-react'
import { useAISStreamWebSocket } from '@/hooks/useAISStreamWebSocket'
import { useVesselTracking } from '@/hooks/useVesselTracking'
import { useNotifications } from '@/hooks/useNotifications'
import { useGeofencing } from '@/hooks/useGeofencing'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { VesselList } from '@/components/VesselList'
import { VesselMapTracking } from '@/components/VesselMapTracking'
import { VesselFilter, type FilterState } from '@/components/VesselFilter'
import { StatsDashboard } from '@/components/StatsDashboard'
import { VesselDetailPanel } from '@/components/VesselDetailPanel'
import { NotificationToastContainer } from '@/components/NotificationToast'
import { NotificationCenter } from '@/components/NotificationCenter'
import { NotificationSettings } from '@/components/NotificationSettings'
import { ExportPanel } from '@/components/ExportPanel'
import { VesselClusterPanel } from '@/components/VesselClusterPanel'
import { ZoneManager } from '@/components/ZoneManager'
import type { ZoneEvent } from '@/types/geofencing.types'

const AISSTREAM_API_KEY = import.meta.env.VITE_AISSTREAM_API_KEY || 'YOUR_API_KEY_HERE'
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE'

const SOUTH_KOREA_BBOX = [
    [
        [33.0, 124.0],  // Southwest corner [lat, lon]
        [38.0, 132.0]   // Northeast corner [lat, lon]
    ]
]

export function AISTestPage() {
    const { state, vessels } = useAISStreamWebSocket({
        apiKey: AISSTREAM_API_KEY,
        boundingBoxes: SOUTH_KOREA_BBOX
    })

    const [filters, setFilters] = useState<FilterState>({
        searchQuery: '',
        minSpeed: 0,
        maxSpeed: 40,
        sortBy: 'updated'
    })

    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isExportOpen, setIsExportOpen] = useState(false)
    const [showClusters, setShowClusters] = useState(false)
    const [showZones, setShowZones] = useState(false)

    const {
        trackingState,
        selectedVessel,
        selectedTrack,
        selectVessel,
        toggleFollowing,
        clearTrack
    } = useVesselTracking(vessels)

    const {
        notifications,
        unreadCount,
        settings,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        updateSettings,
        requestDesktopPermission,
        addNotification,
    } = useNotifications(vessels)

    // Geofencing 이벤트를 알림으로 변환
    const handleZoneEvent = useCallback((event: ZoneEvent) => {
        const eventLabels = {
            enter: '진입',
            exit: '이탈',
            dwell: '체류'
        }

        addNotification({
            type: 'zone',
            priority: event.eventType === 'enter' ? 'medium' : 'low',
            title: `🗺️ 구역 ${eventLabels[event.eventType]}`,
            message: `${event.vesselName}이(가) ${event.zoneName} 구역에 ${eventLabels[event.eventType]}했습니다`,
            data: {
                vesselMMSI: event.vesselMMSI,
                vesselName: event.vesselName,
            },
        })
    }, [addNotification])

    const {
        zones,
        addZone,
        deleteZone,
        toggleZone,
        getVesselsInZone,
    } = useGeofencing(vessels, {
        onZoneEvent: handleZoneEvent,
        enableNotifications: settings.types.zone,
    })

    // 각 존에 있는 선박 수 계산
    const vesselCountsByZone = useMemo(() => {
        const counts = new Map<string, number>()
        zones.forEach(zone => {
            const vesselsInZone = getVesselsInZone(zone.id)
            counts.set(zone.id, vesselsInZone.length)
        })
        return counts
    }, [zones, getVesselsInZone])

    const filteredVessels = useMemo(() => {
        let result = vessels.filter((vessel) => {
            // Speed filter
            if (vessel.speed < filters.minSpeed || vessel.speed > filters.maxSpeed) {
                return false
            }

            // Search filter
            if (filters.searchQuery) {
                const query = filters.searchQuery.toLowerCase()
                const matchesName = vessel.name.toLowerCase().includes(query)
                const matchesMMSI = vessel.mmsi.toString().includes(query)
                if (!matchesName && !matchesMMSI) {
                    return false
                }
            }

            return true
        })

        // Sort
        switch (filters.sortBy) {
            case 'speed-desc':
                result.sort((a, b) => b.speed - a.speed)
                break
            case 'speed-asc':
                result.sort((a, b) => a.speed - b.speed)
                break
            case 'updated':
                result.sort((a, b) => b.lastUpdate - a.lastUpdate)
                break
            case 'mmsi':
                result.sort((a, b) => a.mmsi - b.mmsi)
                break
        }

        return result
    }, [vessels, filters])

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-[1920px] mx-auto">
                <header className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">AIS WebSocket 실시간 테스트</h1>
                        <p className="text-gray-600 mt-2">
                            AISStream API를 통한 실시간 선박 데이터 모니터링
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* 지역 관리 토글 */}
                        <button
                            onClick={() => {
                                setShowZones(!showZones)
                                if (!showZones) setShowClusters(false)
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                showZones
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            aria-label="지역 관리"
                        >
                            <MapPin className="w-5 h-5" />
                            <span>지역</span>
                            {zones.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 bg-blue-200 text-blue-800 text-xs rounded-full">
                                    {zones.length}
                                </span>
                            )}
                        </button>

                        {/* 클러스터 토글 */}
                        <button
                            onClick={() => {
                                setShowClusters(!showClusters)
                                if (!showClusters) setShowZones(false)
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                showClusters
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            aria-label="클러스터 보기"
                        >
                            <Users className="w-5 h-5" />
                            <span>클러스터</span>
                        </button>

                        {/* 내보내기 버튼 */}
                        <button
                            onClick={() => setIsExportOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium transition-colors"
                            aria-label="데이터 내보내기"
                        >
                            <Download className="w-5 h-5" />
                            <span>내보내기</span>
                        </button>

                        {/* 알림 센터 */}
                        <NotificationCenter
                            notifications={notifications}
                            unreadCount={unreadCount}
                            onMarkAsRead={markAsRead}
                            onMarkAllAsRead={markAllAsRead}
                            onDelete={deleteNotification}
                            onClearAll={clearAll}
                            onOpenSettings={() => setIsSettingsOpen(true)}
                        />
                    </div>
                </header>

                <ConnectionStatus
                    status={state.status}
                    error={state.error}
                    messageCount={state.messageCount}
                    lastMessageTime={state.lastMessageTime}
                />

                <VesselFilter onFilterChange={setFilters} />

                <div className="mb-6">
                    <StatsDashboard vessels={filteredVessels} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2 h-[600px] relative">
                        <VesselMapTracking
                            vessels={filteredVessels}
                            accessToken={MAPBOX_TOKEN}
                            selectedMMSI={trackingState.selectedMMSI}
                            selectedTrack={selectedTrack ?? null}
                            isFollowing={trackingState.isFollowing}
                            onSelectVessel={selectVessel}
                        />

                        {selectedVessel && (
                            <VesselDetailPanel
                                vessel={selectedVessel}
                                track={selectedTrack ?? null}
                                isFollowing={trackingState.isFollowing}
                                onClose={() => selectVessel(null)}
                                onToggleFollow={toggleFollowing}
                                onClearTrack={() => clearTrack(selectedVessel.mmsi)}
                            />
                        )}
                    </div>

                    <div className="lg:col-span-1 h-[600px] space-y-4">
                        {showZones ? (
                            <ZoneManager
                                zones={zones}
                                onAddZone={addZone}
                                onDeleteZone={deleteZone}
                                onToggleZone={toggleZone}
                                vesselCounts={vesselCountsByZone}
                            />
                        ) : showClusters ? (
                            <VesselClusterPanel vessels={filteredVessels} />
                        ) : (
                            <VesselList
                                vessels={filteredVessels}
                                selectedMMSI={trackingState.selectedMMSI}
                                onSelectVessel={selectVessel}
                            />
                        )}
                    </div>
                </div>

                <footer className="text-center text-sm text-gray-500">
                    <p>데이터 출처: <a href="https://aisstream.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">AISStream.io</a></p>
                    <p className="mt-1">관측 지역: 한반도 주변 해역 (33°N-38°N, 124°E-132°E)</p>
                </footer>
            </div>

            {/* 알림 토스트 */}
            <NotificationToastContainer
                notifications={notifications.filter(n => !n.read).slice(0, 3)}
                onClose={deleteNotification}
                onRead={markAsRead}
            />

            {/* 알림 설정 모달 */}
            <NotificationSettings
                isOpen={isSettingsOpen}
                settings={settings}
                onClose={() => setIsSettingsOpen(false)}
                onUpdate={updateSettings}
                onRequestDesktopPermission={requestDesktopPermission}
            />

            {/* 데이터 내보내기 패널 */}
            <ExportPanel
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                vessels={filteredVessels}
                tracks={trackingState.tracks}
                notifications={notifications}
            />
        </div>
    )
}
