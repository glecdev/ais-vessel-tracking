import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Vessel } from '@/types/ais.types'
import type { VesselTrack } from '@/types/tracking.types'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface VesselMapTrackingProps {
    vessels: Vessel[]
    accessToken: string
    selectedMMSI: number | null
    selectedTrack: VesselTrack | null
    isFollowing: boolean
    onSelectVessel: (mmsi: number) => void
}

interface MarkerData {
    marker: mapboxgl.Marker
    popup: mapboxgl.Popup
    element: HTMLElement
}

const TRACK_LINE_SOURCE = 'vessel-track'
const TRACK_LINE_LAYER = 'vessel-track-line'

export function VesselMapTracking({
    vessels,
    accessToken,
    selectedMMSI,
    selectedTrack,
    isFollowing,
    onSelectVessel
}: VesselMapTrackingProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const markers = useRef<Map<number, MarkerData>>(new Map())
    const [mapLoaded, setMapLoaded] = useState(false)

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return

        mapboxgl.accessToken = accessToken

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [128.0, 36.0],
            zoom: 6.5
        })

        map.current.on('load', () => {
            // Add track line source and layer
            map.current!.addSource(TRACK_LINE_SOURCE, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: []
                    }
                }
            })

            map.current!.addLayer({
                id: TRACK_LINE_LAYER,
                type: 'line',
                source: TRACK_LINE_SOURCE,
                paint: {
                    'line-color': '#3B82F6',
                    'line-width': 3,
                    'line-opacity': 0.8
                }
            })

            setMapLoaded(true)
        })

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

        return () => {
            map.current?.remove()
            map.current = null
        }
    }, [accessToken])

    // Update track line
    useEffect(() => {
        if (!map.current || !mapLoaded) return

        const source = map.current.getSource(TRACK_LINE_SOURCE) as mapboxgl.GeoJSONSource
        if (!source) return

        if (selectedTrack && selectedTrack.points.length > 1) {
            const coordinates = selectedTrack.points.map(p => [p.longitude, p.latitude])
            source.setData({
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates
                }
            })
        } else {
            source.setData({
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: []
                }
            })
        }
    }, [selectedTrack, mapLoaded])

    // Follow selected vessel
    useEffect(() => {
        if (!map.current || !isFollowing || !selectedMMSI) return

        const vessel = vessels.find(v => v.mmsi === selectedMMSI)
        if (!vessel) return

        map.current.easeTo({
            center: [vessel.position.longitude, vessel.position.latitude],
            duration: 1000
        })
    }, [vessels, selectedMMSI, isFollowing])

    // Update markers
    useEffect(() => {
        if (!map.current || !mapLoaded) return

        const currentMMSIs = new Set(vessels.map(v => v.mmsi))

        // Remove markers for vessels that no longer exist
        for (const [mmsi, markerData] of markers.current) {
            if (!currentMMSIs.has(mmsi)) {
                markerData.marker.remove()
                markers.current.delete(mmsi)
            }
        }

        // Add or update markers for each vessel
        vessels.forEach(vessel => {
            const existingMarker = markers.current.get(vessel.mmsi)
            const isSelected = vessel.mmsi === selectedMMSI

            if (existingMarker) {
                // Update existing marker
                existingMarker.marker.setLngLat([
                    vessel.position.longitude,
                    vessel.position.latitude
                ])
                existingMarker.marker.setRotation(vessel.course)
                existingMarker.popup.setHTML(createPopupHTML(vessel))

                // Update marker appearance based on selection
                updateMarkerStyle(existingMarker.element, vessel, isSelected)
            } else {
                // Create new marker
                const el = createMarkerElement(vessel, isSelected)
                const popup = new mapboxgl.Popup({ offset: 25 })
                    .setHTML(createPopupHTML(vessel))

                // Add click handler
                el.addEventListener('click', () => {
                    onSelectVessel(vessel.mmsi)
                })

                const marker = new mapboxgl.Marker({
                    element: el,
                    rotation: vessel.course,
                    rotationAlignment: 'map'
                })
                    .setLngLat([vessel.position.longitude, vessel.position.latitude])
                    .setPopup(popup)
                    .addTo(map.current!)

                markers.current.set(vessel.mmsi, { marker, popup, element: el })
            }
        })
    }, [vessels, mapLoaded, selectedMMSI, onSelectVessel])

    return (
        <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden shadow-lg" />
    )
}

function createMarkerElement(vessel: Vessel, isSelected: boolean): HTMLElement {
    const el = document.createElement('div')
    el.className = 'vessel-marker'

    const color = getSpeedColor(vessel.speed)
    const size = isSelected ? 32 : 24
    const strokeWidth = isSelected ? 3 : 2

    el.innerHTML = `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M12 2 L20 20 L12 16 L4 20 Z"
                fill="${color}"
                stroke="${isSelected ? '#3B82F6' : '#fff'}"
                stroke-width="${strokeWidth}"
            />
        </svg>
    `

    el.style.cursor = 'pointer'
    el.style.width = `${size}px`
    el.style.height = `${size}px`
    el.style.transition = 'all 0.2s ease'

    if (isSelected) {
        el.style.filter = 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))'
    }

    return el
}

function updateMarkerStyle(el: HTMLElement, vessel: Vessel, isSelected: boolean) {
    const color = getSpeedColor(vessel.speed)
    const size = isSelected ? 32 : 24
    const strokeWidth = isSelected ? 3 : 2

    el.innerHTML = `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M12 2 L20 20 L12 16 L4 20 Z"
                fill="${color}"
                stroke="${isSelected ? '#3B82F6' : '#fff'}"
                stroke-width="${strokeWidth}"
            />
        </svg>
    `

    el.style.width = `${size}px`
    el.style.height = `${size}px`

    if (isSelected) {
        el.style.filter = 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))'
    } else {
        el.style.filter = 'none'
    }
}

function getSpeedColor(speed: number): string {
    if (speed < 1) return '#9CA3AF'
    if (speed < 10) return '#10B981'
    if (speed < 20) return '#F59E0B'
    return '#EF4444'
}

function createPopupHTML(vessel: Vessel): string {
    return `
        <div class="vessel-popup" style="min-width: 200px;">
            <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">
                ${vessel.name}
            </h3>
            <div style="font-size: 12px; color: #6B7280;">
                <p><strong>MMSI:</strong> ${vessel.mmsi}</p>
                <p><strong>위치:</strong> ${vessel.position.latitude.toFixed(4)}°N, ${vessel.position.longitude.toFixed(4)}°E</p>
                <p><strong>속도:</strong> ${vessel.speed.toFixed(1)} knots</p>
                <p><strong>방향:</strong> ${vessel.course.toFixed(0)}°</p>
                <p><strong>선종:</strong> ${vessel.shipType}</p>
                <p><strong>목적지:</strong> ${vessel.destination}</p>
                <p style="margin-top: 8px; font-style: italic;">
                    ${formatDistanceToNow(vessel.lastUpdate, { addSuffix: true, locale: ko })}
                </p>
            </div>
        </div>
    `
}
