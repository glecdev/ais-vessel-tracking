import type { Vessel } from '@/types/ais.types'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface VesselTableProps {
    vessels: Vessel[]
}

export function VesselTable({ vessels }: VesselTableProps) {
    if (vessels.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">선박 목록</h2>
                <p className="text-gray-500 text-center py-8">선박 데이터를 기다리는 중...</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">선박 목록</h2>
                <span className="text-sm text-gray-600">총 {vessels.length}척</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">MMSI</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">선박명</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">선종</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">위도</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">경도</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">속도 (knots)</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">방향 (°)</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">목적지</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">최종 업데이트</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vessels.map((vessel) => (
                            <tr key={vessel.mmsi} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 font-mono text-sm">{vessel.mmsi}</td>
                                <td className="py-3 px-4">{vessel.name}</td>
                                <td className="py-3 px-4 text-sm text-gray-600">{vessel.shipType}</td>
                                <td className="py-3 px-4 text-right font-mono text-sm">
                                    {vessel.position.latitude.toFixed(4)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-sm">
                                    {vessel.position.longitude.toFixed(4)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono">
                                    {vessel.speed.toFixed(1)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono">
                                    {vessel.course.toFixed(0)}
                                </td>
                                <td className="py-3 px-4 text-sm">{vessel.destination}</td>
                                <td className="py-3 px-4 text-sm text-gray-500">
                                    {formatDistanceToNow(vessel.lastUpdate, {
                                        addSuffix: true,
                                        locale: ko
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
