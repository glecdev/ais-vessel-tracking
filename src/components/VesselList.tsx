import type { Vessel } from '@/types/ais.types'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface VesselListProps {
    vessels: Vessel[]
    selectedMMSI?: number | null
    onSelectVessel?: (mmsi: number) => void
}

export function VesselList({ vessels, selectedMMSI, onSelectVessel }: VesselListProps) {
    if (vessels.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6 h-full">
                <h2 className="text-xl font-bold mb-4">선박 목록</h2>
                <p className="text-gray-500 text-center py-8">선박 데이터를 기다리는 중...</p>
            </div>
        )
    }

    const getSpeedColor = (speed: number) => {
        if (speed < 1) return 'bg-gray-400'
        if (speed < 10) return 'bg-green-500'
        if (speed < 20) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    return (
        <div className="bg-white rounded-lg shadow h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">선박 목록</h2>
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {vessels.length}척
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {vessels.map((vessel) => {
                    const isSelected = selectedMMSI === vessel.mmsi
                    return (
                    <div
                        key={vessel.mmsi}
                        onClick={() => onSelectVessel?.(vessel.mmsi)}
                        className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                            isSelected
                                ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                : 'hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{vessel.name}</h3>
                                <p className="text-xs text-gray-500 font-mono">{vessel.mmsi}</p>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${getSpeedColor(vessel.speed)} ml-2 mt-1`} />
                        </div>

                        <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span className="text-gray-500">속도</span>
                                <span className="font-mono font-medium">{vessel.speed.toFixed(1)} kn</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">방향</span>
                                <span className="font-mono font-medium">{vessel.course.toFixed(0)}°</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">위치</span>
                                <span className="font-mono text-xs">
                                    {vessel.position.latitude.toFixed(2)}°N, {vessel.position.longitude.toFixed(2)}°E
                                </span>
                            </div>
                            {vessel.destination && vessel.destination !== 'Unknown' && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">목적지</span>
                                    <span className="text-xs truncate ml-2">{vessel.destination}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-2 text-xs text-gray-400 italic">
                            {formatDistanceToNow(vessel.lastUpdate, {
                                addSuffix: true,
                                locale: ko
                            })}
                        </div>
                    </div>
                    )
                })}
            </div>
        </div>
    )
}
