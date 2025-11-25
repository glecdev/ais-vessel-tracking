import { useCallback, useEffect, useRef, useState } from 'react'
import type { Vessel } from '@/types/ais.types'
import type { TrackingState, VesselTrack, TrackPoint } from '@/types/tracking.types'

// Re-export for external use
export type { VesselTrack, TrackPoint } from '@/types/tracking.types'

const MAX_TRACK_POINTS = 100

export function useVesselTracking(vessels: Vessel[]) {
    const [trackingState, setTrackingState] = useState<TrackingState>({
        selectedMMSI: null,
        tracks: new Map(),
        isFollowing: false
    })

    const tracksRef = useRef<Map<number, VesselTrack>>(new Map())

    // Calculate distance between two points in nautical miles
    const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number => {
        const R = 3440.065 // Earth radius in nautical miles
        const dLat = ((lat2 - lat1) * Math.PI) / 180
        const dLon = ((lon2 - lon1) * Math.PI) / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    // Update tracks when vessels change
    useEffect(() => {
        if (!trackingState.selectedMMSI) return

        const vessel = vessels.find(v => v.mmsi === trackingState.selectedMMSI)
        if (!vessel) return

        const existingTrack = tracksRef.current.get(vessel.mmsi)
        const newPoint: TrackPoint = {
            latitude: vessel.position.latitude,
            longitude: vessel.position.longitude,
            timestamp: vessel.lastUpdate,
            speed: vessel.speed,
            course: vessel.course
        }

        let updatedTrack: VesselTrack

        if (existingTrack) {
            const lastPoint = existingTrack.points[existingTrack.points.length - 1]

            // Only add point if position changed significantly (> 0.0001 degrees, ~10 meters)
            const positionChanged =
                Math.abs(lastPoint.latitude - newPoint.latitude) > 0.0001 ||
                Math.abs(lastPoint.longitude - newPoint.longitude) > 0.0001

            if (positionChanged) {
                const distance = calculateDistance(
                    lastPoint.latitude,
                    lastPoint.longitude,
                    newPoint.latitude,
                    newPoint.longitude
                )

                const newPoints = [...existingTrack.points, newPoint]
                if (newPoints.length > MAX_TRACK_POINTS) {
                    newPoints.shift() // Remove oldest point
                }

                updatedTrack = {
                    ...existingTrack,
                    points: newPoints,
                    totalDistance: existingTrack.totalDistance + distance
                }
            } else {
                return // No significant change, don't update
            }
        } else {
            // Create new track
            updatedTrack = {
                mmsi: vessel.mmsi,
                points: [newPoint],
                startTime: vessel.lastUpdate,
                totalDistance: 0
            }
        }

        const newTracks = new Map(tracksRef.current)
        newTracks.set(vessel.mmsi, updatedTrack)
        tracksRef.current = newTracks

        setTrackingState(prev => ({
            ...prev,
            tracks: newTracks
        }))
    }, [vessels, trackingState.selectedMMSI])

    const selectVessel = useCallback((mmsi: number | null) => {
        setTrackingState(prev => ({
            ...prev,
            selectedMMSI: mmsi,
            isFollowing: mmsi !== null
        }))
    }, [])

    const toggleFollowing = useCallback(() => {
        setTrackingState(prev => ({
            ...prev,
            isFollowing: !prev.isFollowing
        }))
    }, [])

    const clearTrack = useCallback((mmsi: number) => {
        const newTracks = new Map(tracksRef.current)
        newTracks.delete(mmsi)
        tracksRef.current = newTracks

        setTrackingState(prev => ({
            ...prev,
            tracks: newTracks
        }))
    }, [])

    const clearAllTracks = useCallback(() => {
        tracksRef.current.clear()
        setTrackingState(prev => ({
            ...prev,
            tracks: new Map(),
            selectedMMSI: null,
            isFollowing: false
        }))
    }, [])

    const selectedVessel = trackingState.selectedMMSI
        ? vessels.find(v => v.mmsi === trackingState.selectedMMSI)
        : null

    const selectedTrack = trackingState.selectedMMSI
        ? trackingState.tracks.get(trackingState.selectedMMSI)
        : null

    return {
        trackingState,
        selectedVessel,
        selectedTrack,
        selectVessel,
        toggleFollowing,
        clearTrack,
        clearAllTracks
    }
}
