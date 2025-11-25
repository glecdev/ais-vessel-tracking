/**
 * GLEC LCS API 클라이언트
 * ISO-14083 표준 기반 탄소배출량 계산 API
 */

const API_BASE_URL = import.meta.env.VITE_GLEC_API_URL || 'https://sfc-lcs.glec.io'
const API_KEY = import.meta.env.VITE_GLEC_API_KEY || ''

/**
 * API Request/Response 타입
 */
export interface EmissionCalculationRequest {
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

export interface EmissionCalculationResponse {
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

export interface Shipper {
    id: string
    name: string
    businessNumber?: string
    createdAt: string
}

export interface CodeReference {
    code: string
    name: string
    category: string
    description?: string
}

/**
 * API Client Class
 */
class GLECAPIClient {
    private baseURL: string
    private apiKey: string

    constructor(baseURL: string, apiKey: string) {
        this.baseURL = baseURL
        this.apiKey = apiKey
    }

    /**
     * 공통 fetch 래퍼
     */
    private async fetch<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `GlecApiKey ${this.apiKey}`,
                ...options.headers
            }
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }))
            throw new Error(error.message || `API Error: ${response.status}`)
        }

        return response.json()
    }

    /**
     * POST /emission-calculations
     * 탄소배출량 계산 요청
     */
    async calculateEmissions(
        request: EmissionCalculationRequest
    ): Promise<EmissionCalculationResponse> {
        return this.fetch<EmissionCalculationResponse>('/emission-calculations', {
            method: 'POST',
            body: JSON.stringify(request)
        })
    }

    /**
     * GET /emission-calculations/:id
     * 계산 결과 조회
     */
    async getCalculation(calculationId: string): Promise<EmissionCalculationResponse> {
        return this.fetch<EmissionCalculationResponse>(`/emission-calculations/${calculationId}`)
    }

    /**
     * GET /emission-calculations
     * 계산 이력 목록 조회
     */
    async getCalculations(params?: {
        shipperId?: string
        startDate?: string
        endDate?: string
        limit?: number
        offset?: number
    }): Promise<{ calculations: EmissionCalculationResponse[]; total: number }> {
        const query = new URLSearchParams()
        if (params?.shipperId) query.append('shipperId', params.shipperId)
        if (params?.startDate) query.append('startDate', params.startDate)
        if (params?.endDate) query.append('endDate', params.endDate)
        if (params?.limit) query.append('limit', params.limit.toString())
        if (params?.offset) query.append('offset', params.offset.toString())

        return this.fetch<{ calculations: EmissionCalculationResponse[]; total: number }>(
            `/emission-calculations?${query.toString()}`
        )
    }

    /**
     * GET /shippers
     * 화주사 목록 조회
     */
    async getShippers(search?: string): Promise<Shipper[]> {
        const query = search ? `?search=${encodeURIComponent(search)}` : ''
        return this.fetch<Shipper[]>(`/shippers${query}`)
    }

    /**
     * POST /shippers
     * 화주사 생성
     */
    async createShipper(data: {
        name: string
        businessNumber?: string
    }): Promise<Shipper> {
        return this.fetch<Shipper>('/shippers', {
            method: 'POST',
            body: JSON.stringify(data)
        })
    }

    /**
     * PUT /shippers/:id
     * 화주사 수정
     */
    async updateShipper(
        id: string,
        data: Partial<{ name: string; businessNumber: string }>
    ): Promise<Shipper> {
        return this.fetch<Shipper>(`/shippers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    }

    /**
     * DELETE /shippers/:id
     * 화주사 삭제
     */
    async deleteShipper(id: string): Promise<void> {
        return this.fetch<void>(`/shippers/${id}`, {
            method: 'DELETE'
        })
    }

    /**
     * GET /codes/transport-modes
     * 운송 수단 코드 조회
     */
    async getTransportModeCodes(): Promise<CodeReference[]> {
        return this.fetch<CodeReference[]>('/codes/transport-modes')
    }

    /**
     * GET /codes/cargo-types
     * 화물 종류 코드 조회
     */
    async getCargoTypeCodes(): Promise<CodeReference[]> {
        return this.fetch<CodeReference[]>('/codes/cargo-types')
    }

    /**
     * POST /reports/generate
     * ISO-14083 보고서 생성
     */
    async generateReport(calculationId: string): Promise<{
        reportId: string
        downloadUrl: string
        format: 'pdf' | 'excel'
    }> {
        return this.fetch<{
            reportId: string
            downloadUrl: string
            format: 'pdf' | 'excel'
        }>('/reports/generate', {
            method: 'POST',
            body: JSON.stringify({ calculationId })
        })
    }
}

/**
 * API 클라이언트 싱글톤 인스턴스
 */
export const glecAPI = new GLECAPIClient(API_BASE_URL, API_KEY)

/**
 * Mock API (개발/테스트용)
 */
export const mockGLECAPI = {
    async calculateEmissions(
        request: EmissionCalculationRequest
    ): Promise<EmissionCalculationResponse> {
        await new Promise(resolve => setTimeout(resolve, 1500))

        const totalDistance = request.routes.reduce((sum, r) => sum + r.distance, 0)
        const totalEmissions = totalDistance * 0.25 * (request.cargo.weight / 1000)

        return {
            calculationId: `calc-${Date.now()}`,
            status: 'completed',
            result: {
                transportActivity: {
                    value: (request.cargo.weight / 1000) * totalDistance,
                    unit: 't-km'
                },
                emissionIntensity: {
                    value: 12.5,
                    unit: 'gCO2e/t-km',
                    source: 'GLEC Framework v3.0'
                },
                totalEmissions: {
                    value: totalEmissions,
                    unit: 'kgCO2e'
                },
                breakdown: request.routes.map((route, index) => ({
                    segment: `segment-${index + 1}`,
                    distance: route.distance,
                    emissions: route.distance * 0.25 * (request.cargo.weight / 1000)
                }))
            },
            timestamp: new Date().toISOString()
        }
    },

    async getShippers(search?: string): Promise<Shipper[]> {
        await new Promise(resolve => setTimeout(resolve, 300))

        const allShippers = [
            { id: 'shipper-1', name: '삼성전자', businessNumber: '124-81-00998', createdAt: '2024-01-01' },
            { id: 'shipper-2', name: '삼성물산', businessNumber: '110-81-03044', createdAt: '2024-01-02' },
            { id: 'shipper-3', name: '삼성SDI', businessNumber: '167-81-01287', createdAt: '2024-01-03' },
            { id: 'shipper-4', name: 'LG전자', businessNumber: '107-86-14075', createdAt: '2024-01-04' },
            { id: 'shipper-5', name: 'SK하이닉스', businessNumber: '107-81-11515', createdAt: '2024-01-05' },
            { id: 'shipper-6', name: '현대자동차', businessNumber: '101-81-41633', createdAt: '2024-01-06' },
            { id: 'shipper-7', name: '포스코', businessNumber: '107-86-97963', createdAt: '2024-01-07' },
            { id: 'shipper-8', name: 'CJ대한통운', businessNumber: '120-81-03044', createdAt: '2024-01-08' }
        ]

        if (search) {
            return allShippers.filter(s =>
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                s.businessNumber?.includes(search)
            )
        }

        return allShippers
    },

    async getCargoTypeCodes(): Promise<CodeReference[]> {
        return [
            { code: 'CONT-GEN', name: '컨테이너(일반)', category: 'container' },
            { code: 'CONT-COLD', name: '컨테이너(냉동)', category: 'container' },
            { code: 'VEHICLE', name: '차량', category: 'vehicle' },
            { code: 'ELECTRONICS', name: '전자제품', category: 'electronics' },
            { code: 'CONSTRUCTION', name: '건축자재', category: 'construction' },
            { code: 'FOOD', name: '식품', category: 'food' }
        ]
    },

    async getTransportModeCodes(): Promise<CodeReference[]> {
        return [
            { code: 'truck', name: '트럭', category: 'road' },
            { code: 'ship', name: '선박', category: 'sea' },
            { code: 'rail', name: '철도', category: 'rail' },
            { code: 'air', name: '항공', category: 'air' },
            { code: 'warehouse', name: '물류센터', category: 'warehouse' }
        ]
    }
}
