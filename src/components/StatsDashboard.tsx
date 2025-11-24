import { useMemo } from 'react'
import type { Vessel } from '@/types/ais.types'
import { Ship, Gauge, TrendingUp, TrendingDown } from 'lucide-react'

interface StatsDashboardProps {
    vessels: Vessel[]
}

export function StatsDashboard({ vessels }: StatsDashboardProps) {
    const stats = useMemo(() => {
        if (vessels.length === 0) {
            return {
                total: 0,
                avgSpeed: 0,
                fastest: null as Vessel | null,
                slowest: null as Vessel | null,
                moving: 0,
                stationary: 0,
                shipTypes: new Map<string, number>()
            }
        }

        const speeds = vessels.map(v => v.speed)
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / vessels.length

        const sortedBySpeed = [...vessels].sort((a, b) => b.speed - a.speed)
        const fastest = sortedBySpeed[0]
        const slowest = sortedBySpeed[sortedBySpeed.length - 1]

        const moving = vessels.filter(v => v.speed > 1).length
        const stationary = vessels.filter(v => v.speed <= 1).length

        const shipTypes = new Map<string, number>()
        vessels.forEach(v => {
            const count = shipTypes.get(v.shipType) || 0
            shipTypes.set(v.shipType, count + 1)
        })

        return {
            total: vessels.length,
            avgSpeed,
            fastest,
            slowest,
            moving,
            stationary,
            shipTypes
        }
    }, [vessels])

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Vessels */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">총 선박</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <Ship className="text-blue-500" size={32} />
                </div>
                <div className="mt-2 flex gap-2 text-xs">
                    <span className="text-green-600">운항 {stats.moving}</span>
                    <span className="text-gray-400">정박 {stats.stationary}</span>
                </div>
            </div>

            {/* Average Speed */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">평균 속도</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {stats.avgSpeed.toFixed(1)}
                        </p>
                    </div>
                    <Gauge className="text-yellow-500" size={32} />
                </div>
                <div className="mt-2 text-xs text-gray-500">knots</div>
            </div>

            {/* Fastest Vessel */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-600">최고속</p>
                    <TrendingUp className="text-red-500" size={20} />
                </div>
                {stats.fastest ? (
                    <>
                        <p className="text-xl font-bold text-gray-900">
                            {stats.fastest.speed.toFixed(1)} kn
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-1">
                            {stats.fastest.name}
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-gray-400">-</p>
                )}
            </div>

            {/* Slowest Vessel */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-600">최저속</p>
                    <TrendingDown className="text-gray-500" size={20} />
                </div>
                {stats.slowest ? (
                    <>
                        <p className="text-xl font-bold text-gray-900">
                            {stats.slowest.speed.toFixed(1)} kn
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-1">
                            {stats.slowest.name}
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-gray-400">-</p>
                )}
            </div>
        </div>
    )
}
