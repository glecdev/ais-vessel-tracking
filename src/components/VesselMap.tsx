import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Vessel } from '@/types/ais.types'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface VesselMapProps {
    vessels: Vessel[]
    accessToken: string
}

interface MarkerData {
    marker: mapboxgl.Marker
    popup: mapboxgl.Popup
}

export function VesselMap({ vessels, accessToken }: VesselMapProps) {
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
            center: [128.0, 36.0], // 한반도 중심
            zoom: 6.5
        })

        map.current.on('load', () => {
            setMapLoaded(true)
        })

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

        return () => {
            map.current?.remove()
            map.current = null
        }
    }, [accessToken])

    // Update markers when vessels change
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

            if (existingMarker) {
                // Update existing marker
                existingMarker.marker.setLngLat([
                    vessel.position.longitude,
                    vessel.position.latitude
                ])
                existingMarker.marker.setRotation(vessel.course)
                existingMarker.popup.setHTML(createPopupHTML(vessel))
            } else {
                // Create new marker
                const el = createMarkerElement(vessel)
                const popup = new mapboxgl.Popup({ offset: 25 })
                    .setHTML(createPopupHTML(vessel))

                const marker = new mapboxgl.Marker({
                    element: el,
                    rotation: vessel.course,
                    rotationAlignment: 'map'
                })
                    .setLngLat([vessel.position.longitude, vessel.position.latitude])
                    .setPopup(popup)
                    .addTo(map.current!)

                markers.current.set(vessel.mmsi, { marker, popup })
            }
        })
    }, [vessels, mapLoaded])

    return (
        <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden shadow-lg" />
    )
}

function createMarkerElement(vessel: Vessel): HTMLElement {
    const el = document.createElement('div')
    el.className = 'vessel-marker'

    const color = getSpeedColor(vessel.speed)

    el.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M12 2 L20 20 L12 16 L4 20 Z"
                fill="${color}"
                stroke="#fff"
                stroke-width="2"
            />
        </svg>
    `

    el.style.cursor = 'pointer'
    el.style.width = '24px'
    el.style.height = '24px'

    return el
}

function getSpeedColor(speed: number): string {
    if (speed < 1) return '#9CA3AF' // gray
    if (speed < 10) return '#10B981' // green
    if (speed < 20) return '#F59E0B' // yellow
    return '#EF4444' // red
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
