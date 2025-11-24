import type { Vessel } from '@/types/ais.types'
import type { VesselTrack } from '@/types/tracking.types'
import { X, Navigation, Gauge, MapPin, Target, Anchor } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface VesselDetailPanelProps {
    vessel: Vessel
    track: VesselTrack | null
    isFollowing: boolean
    onClose: () => void
    onToggleFollow: () => void
    onClearTrack: () => void
}

export function VesselDetailPanel({
    vessel,
    track,
    isFollowing,
    onClose,
    onToggleFollow,
    onClearTrack
}: VesselDetailPanelProps) {
    const trackDuration = track
        ? Math.floor((Date.now() - track.startTime) / 1000 / 60)
        : 0

    return (
        <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-xl z-10 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-500 text-white p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="font-bold text-lg">{vessel.name}</h3>
                        <p className="text-sm opacity-90 font-mono">{vessel.mmsi}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-blue-600 rounded p-1 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {/* Position Info */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                        <MapPin size={16} className="text-blue-500" />
                        <span className="text-sm font-semibold">위치</span>
                    </div>
                    <div className="pl-6 text-sm text-gray-600 space-y-1">
                        <p>위도: {vessel.position.latitude.toFixed(6)}°N</p>
                        <p>경도: {vessel.position.longitude.toFixed(6)}°E</p>
                    </div>
                </div>

                {/* Speed & Course */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                            <Gauge size={16} className="text-green-500" />
                            <span className="text-sm font-semibold">속도</span>
                        </div>
                        <p className="pl-6 text-2xl font-bold text-gray-900">
                            {vessel.speed.toFixed(1)}
                            <span className="text-sm font-normal text-gray-500 ml-1">kn</span>
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                            <Navigation size={16} className="text-purple-500" />
                            <span className="text-sm font-semibold">방향</span>
                        </div>
                        <p className="pl-6 text-2xl font-bold text-gray-900">
                            {vessel.course.toFixed(0)}
                            <span className="text-sm font-normal text-gray-500 ml-1">°</span>
                        </p>
                    </div>
                </div>

                {/* Destination */}
                {vessel.destination && vessel.destination !== 'Unknown' && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                            <Target size={16} className="text-red-500" />
                            <span className="text-sm font-semibold">목적지</span>
                        </div>
                        <p className="pl-6 text-sm text-gray-600">{vessel.destination}</p>
                    </div>
                )}

                {/* Ship Type */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                        <Anchor size={16} className="text-gray-500" />
                        <span className="text-sm font-semibold">선종</span>
                    </div>
                    <p className="pl-6 text-sm text-gray-600">{vessel.shipType}</p>
                </div>

                {/* Track Info */}
                {track && (
                    <div className="bg-gray-50 rounded p-3 space-y-2">
                        <h4 className="font-semibold text-sm text-gray-700">추적 정보</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p>기록 포인트: {track.points.length}개</p>
                            <p>이동 거리: {track.totalDistance.toFixed(2)} nm</p>
                            <p>추적 시간: {trackDuration}분</p>
                        </div>
                    </div>
                )}

                {/* Last Update */}
                <div className="text-xs text-gray-400 italic">
                    최종 업데이트:{' '}
                    {formatDistanceToNow(vessel.lastUpdate, { addSuffix: true, locale: ko })}
                </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-4 space-y-2">
                <button
                    onClick={onToggleFollow}
                    className={`w-full px-4 py-2 rounded font-semibold transition-colors ${
                        isFollowing
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    {isFollowing ? '자동 추적 중' : '자동 추적 시작'}
                </button>

                {track && track.points.length > 0 && (
                    <button
                        onClick={onClearTrack}
                        className="w-full px-4 py-2 rounded font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                        경로 기록 삭제
                    </button>
                )}
            </div>
        </div>
    )
}
