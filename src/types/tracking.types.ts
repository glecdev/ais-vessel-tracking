export interface TrackPoint {
    latitude: number
    longitude: number
    timestamp: number
    speed: number
    course: number
}

export interface VesselTrack {
    mmsi: number
    points: TrackPoint[]
    startTime: number
    totalDistance: number // nautical miles
}

export interface TrackingState {
    selectedMMSI: number | null
    tracks: Map<number, VesselTrack>
    isFollowing: boolean // auto-center map on selected vessel
}
