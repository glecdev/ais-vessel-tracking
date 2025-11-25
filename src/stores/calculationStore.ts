import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * GLEC LCS API 계산 데이터 타입
 */

export interface Location {
    name: string
    latitude: number
    longitude: number
}

export interface Cargo {
    type: string
    weight: number
    unit: 'kg' | 'ton'
    description?: string
}

export interface Route {
    mode: 'truck' | 'ship' | 'rail' | 'air' | 'warehouse'
    distance: number
    carrier?: string
    vehicleType?: string
}

export interface Shipper {
    id: string
    name: string
    businessNumber?: string
}

/**
 * Design Mode 폼 데이터
 */
export interface FormData {
    transportDate: string // ISO date string
    shipper: Shipper | null
    origin: Location | null
    destination: Location | null
    cargo: Cargo | null
    routes: Route[]
}

/**
 * GLEC API Request 포맷
 */
export interface APIRequest {
    transportDate: string
    shipperId: string
    origin: {
        latitude: number
        longitude: number
    }
    destination: {
        latitude: number
        longitude: number
    }
    cargo: {
        type: string
        weight: number
    }
    routes: Array<{
        mode: string
        distance: number
    }>
}

/**
 * GLEC API Response 포맷
 */
export interface APIResponse {
    calculationId: string
    status: 'completed' | 'processing' | 'failed'
    result: {
        transportActivity: {
            value: number
            unit: string
        }
        emissionIntensity: {
            value: number
            unit: string
            source: string
        }
        totalEmissions: {
            value: number
            unit: string
        }
        breakdown: Array<{
            segment: string
            distance: number
            emissions: number
        }>
    }
    timestamp: string
}

/**
 * 동기화 상태
 */
interface SyncState {
    isSyncing: boolean
    lastSyncSource: 'design' | 'developer' | null
    lastSyncTime: number
}

/**
 * Store 상태
 */
interface CalculationStore {
    // Design Mode 데이터
    formData: FormData

    // Developer Mode 데이터
    requestJSON: string
    responseJSON: string

    // 동기화 상태
    syncState: SyncState

    // 계산 상태
    isCalculating: boolean
    error: string | null

    // Actions
    updateFormData: (data: Partial<FormData>) => void
    updateRequestJSON: (json: string) => void
    updateResponseJSON: (json: string) => void
    syncFormToJSON: () => void
    syncJSONToForm: () => void
    resetForm: () => void
    calculate: () => Promise<void>
}

/**
 * 초기 상태
 */
const initialFormData: FormData = {
    transportDate: new Date().toISOString().split('T')[0],
    shipper: null,
    origin: null,
    destination: null,
    cargo: null,
    routes: []
}

/**
 * Form Data → JSON 변환
 */
export function formDataToJSON(formData: FormData): APIRequest | null {
    if (!formData.shipper || !formData.origin || !formData.destination || !formData.cargo) {
        return null
    }

    return {
        transportDate: formData.transportDate,
        shipperId: formData.shipper.id,
        origin: {
            latitude: formData.origin.latitude,
            longitude: formData.origin.longitude
        },
        destination: {
            latitude: formData.destination.latitude,
            longitude: formData.destination.longitude
        },
        cargo: {
            type: formData.cargo.type,
            weight: formData.cargo.unit === 'ton'
                ? formData.cargo.weight * 1000
                : formData.cargo.weight
        },
        routes: formData.routes.map(route => ({
            mode: route.mode,
            distance: route.distance
        }))
    }
}

/**
 * JSON → Form Data 변환
 */
export function jsonToFormData(json: string): FormData | null {
    try {
        const data = JSON.parse(json) as APIRequest

        // 기본 검증
        if (!data.transportDate || !data.shipperId || !data.origin || !data.destination) {
            throw new Error('Missing required fields')
        }

        return {
            transportDate: data.transportDate,
            shipper: {
                id: data.shipperId,
                name: 'Unknown' // Note: API doesn't return shipper name
            },
            origin: {
                name: 'Unknown', // Note: Requires reverse geocoding
                latitude: data.origin.latitude,
                longitude: data.origin.longitude
            },
            destination: {
                name: 'Unknown',
                latitude: data.destination.latitude,
                longitude: data.destination.longitude
            },
            cargo: {
                type: data.cargo.type,
                weight: data.cargo.weight >= 1000 ? data.cargo.weight / 1000 : data.cargo.weight,
                unit: data.cargo.weight >= 1000 ? 'ton' : 'kg'
            },
            routes: data.routes.map(route => ({
                mode: route.mode as Route['mode'],
                distance: route.distance
            }))
        }
    } catch (error) {
        console.error('[Sync] JSON parse error:', error)
        return null
    }
}

/**
 * Zustand Store 생성
 */
export const useCalculationStore = create<CalculationStore>()(
    devtools(
        (set, get) => ({
            // 초기 상태
            formData: initialFormData,
            requestJSON: '{}',
            responseJSON: '{}',
            syncState: {
                isSyncing: false,
                lastSyncSource: null,
                lastSyncTime: 0
            },
            isCalculating: false,
            error: null,

            // Form 데이터 업데이트
            updateFormData: (data) => {
                set(state => ({
                    formData: { ...state.formData, ...data }
                }))

                // 자동 동기화 (debounced)
                setTimeout(() => {
                    get().syncFormToJSON()
                }, 100)
            },

            // Request JSON 업데이트
            updateRequestJSON: (json) => {
                set({ requestJSON: json })

                // 자동 동기화 (debounced)
                setTimeout(() => {
                    get().syncJSONToForm()
                }, 500)
            },

            // Response JSON 업데이트
            updateResponseJSON: (json) => {
                set({ responseJSON: json })
            },

            // Design Mode → Developer Mode 동기화
            syncFormToJSON: () => {
                const state = get()

                // 이미 동기화 중이면 스킵
                if (state.syncState.isSyncing) {
                    return
                }

                // 같은 소스에서 연속 호출이면 스킵 (debounce)
                if (
                    state.syncState.lastSyncSource === 'design' &&
                    Date.now() - state.syncState.lastSyncTime < 100
                ) {
                    return
                }

                set({
                    syncState: {
                        isSyncing: true,
                        lastSyncSource: 'design',
                        lastSyncTime: Date.now()
                    }
                })

                try {
                    const apiRequest = formDataToJSON(state.formData)
                    if (apiRequest) {
                        set({
                            requestJSON: JSON.stringify(apiRequest, null, 2)
                        })
                    }
                } finally {
                    set(state => ({
                        syncState: {
                            ...state.syncState,
                            isSyncing: false
                        }
                    }))
                }
            },

            // Developer Mode → Design Mode 동기화
            syncJSONToForm: () => {
                const state = get()

                // 이미 동기화 중이면 스킵
                if (state.syncState.isSyncing) {
                    return
                }

                // 같은 소스에서 연속 호출이면 스킵
                if (
                    state.syncState.lastSyncSource === 'developer' &&
                    Date.now() - state.syncState.lastSyncTime < 500
                ) {
                    return
                }

                set({
                    syncState: {
                        isSyncing: true,
                        lastSyncSource: 'developer',
                        lastSyncTime: Date.now()
                    }
                })

                try {
                    const formData = jsonToFormData(state.requestJSON)
                    if (formData) {
                        set({ formData })
                    }
                } finally {
                    set(state => ({
                        syncState: {
                            ...state.syncState,
                            isSyncing: false
                        }
                    }))
                }
            },

            // 폼 리셋
            resetForm: () => {
                set({
                    formData: initialFormData,
                    requestJSON: '{}',
                    responseJSON: '{}',
                    error: null
                })
            },

            // API 호출 (계산 실행)
            calculate: async () => {
                const state = get()
                const apiRequest = formDataToJSON(state.formData)

                if (!apiRequest) {
                    set({ error: '필수 입력 항목을 모두 채워주세요' })
                    return
                }

                set({ isCalculating: true, error: null })

                try {
                    // TODO: 실제 API 호출
                    // const response = await fetch('https://sfc-lcs.glec.io/emission-calculations', {
                    //   method: 'POST',
                    //   headers: {
                    //     'Content-Type': 'application/json',
                    //     'Authorization': `GlecApiKey ${API_KEY}`
                    //   },
                    //   body: JSON.stringify(apiRequest)
                    // })

                    // 임시 Mock Response
                    await new Promise(resolve => setTimeout(resolve, 1500))

                    const mockResponse: APIResponse = {
                        calculationId: `calc-${Date.now()}`,
                        status: 'completed',
                        result: {
                            transportActivity: {
                                value: 9000,
                                unit: 't-km'
                            },
                            emissionIntensity: {
                                value: 12.5,
                                unit: 'gCO2e/t-km',
                                source: 'GLEC Framework v3.0'
                            },
                            totalEmissions: {
                                value: 112.5,
                                unit: 'kgCO2e'
                            },
                            breakdown: apiRequest.routes.map((route, index) => ({
                                segment: `segment-${index + 1}`,
                                distance: route.distance,
                                emissions: route.distance * 0.25 // Mock calculation
                            }))
                        },
                        timestamp: new Date().toISOString()
                    }

                    set({
                        responseJSON: JSON.stringify(mockResponse, null, 2),
                        isCalculating: false
                    })
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : '계산 중 오류가 발생했습니다',
                        isCalculating: false
                    })
                }
            }
        }),
        { name: 'CalculationStore' }
    )
)
