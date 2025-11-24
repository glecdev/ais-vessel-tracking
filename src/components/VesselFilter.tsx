import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'

interface VesselFilterProps {
    onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
    searchQuery: string
    minSpeed: number
    maxSpeed: number
    sortBy: 'speed-desc' | 'speed-asc' | 'updated' | 'mmsi'
}

export function VesselFilter({ onFilterChange }: VesselFilterProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [filters, setFilters] = useState<FilterState>({
        searchQuery: '',
        minSpeed: 0,
        maxSpeed: 40,
        sortBy: 'updated'
    })

    const updateFilters = (updates: Partial<FilterState>) => {
        const newFilters = { ...filters, ...updates }
        setFilters(newFilters)
        onFilterChange(newFilters)
    }

    return (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="선박명 또는 MMSI 검색..."
                        value={filters.searchQuery}
                        onChange={(e) => updateFilters({ searchQuery: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                        isExpanded
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <SlidersHorizontal size={20} />
                    <span className="hidden sm:inline">필터</span>
                </button>
            </div>

            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            속도 범위: {filters.minSpeed} - {filters.maxSpeed} knots
                        </label>
                        <div className="flex gap-4 items-center">
                            <div className="flex-1">
                                <label className="text-xs text-gray-600">최소</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="40"
                                    value={filters.minSpeed}
                                    onChange={(e) => updateFilters({ minSpeed: Number(e.target.value) })}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-600">최대</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="40"
                                    value={filters.maxSpeed}
                                    onChange={(e) => updateFilters({ maxSpeed: Number(e.target.value) })}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">정렬</label>
                        <select
                            value={filters.sortBy}
                            onChange={(e) => updateFilters({ sortBy: e.target.value as FilterState['sortBy'] })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="updated">최근 업데이트 순</option>
                            <option value="speed-desc">속도 높은 순</option>
                            <option value="speed-asc">속도 낮은 순</option>
                            <option value="mmsi">MMSI 순</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    )
}
