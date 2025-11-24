import { useEffect, useRef, useState } from 'react'
import type { AISStreamConfig, Vessel } from '@/types/ais.types'
import { ReconnectionManager } from '@/utils/reconnectionManager'
import { parseAISMessage } from '@/services/aisMessageParser'
import { VesselStore } from '@/services/vesselStore'

interface WebSocketState {
    status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'
    error: Error | null
    lastMessageTime: number
    messageCount: number
}

export function useAISStreamWebSocket(config: AISStreamConfig) {
    const wsRef = useRef<WebSocket | null>(null)
    const vesselStoreRef = useRef(new VesselStore())
    const reconnectionManagerRef = useRef(new ReconnectionManager())

    const [state, setState] = useState<WebSocketState>({
        status: 'idle',
        error: null,
        lastMessageTime: 0,
        messageCount: 0
    })

    const [vessels, setVessels] = useState<Vessel[]>([])

    useEffect(() => {
        let isMounted = true

        const connect = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) return

            setState(prev => ({ ...prev, status: 'connecting' }))

            const ws = new WebSocket('wss://stream.aisstream.io/v0/stream')
            wsRef.current = ws

            ws.onopen = () => {
                if (!isMounted) return
                console.log('[AISStream] Connected')
                setState(prev => ({ ...prev, status: 'connected', error: null }))
                reconnectionManagerRef.current.reset()

                const subscription = {
                    APIKey: config.apiKey,
                    BoundingBoxes: config.boundingBoxes,
                    FilterMessageTypes: ['PositionReport', 'ShipStaticData', 'StandardClassBPositionReport']
                }
                ws.send(JSON.stringify(subscription))
            }

            ws.onmessage = (event) => {
                if (!isMounted) return

                const raw = event.data.toString()
                const partialVessel = parseAISMessage(raw)

                if (partialVessel) {
                    const newMap = vesselStoreRef.current.update(partialVessel)

                    // Optimization: Update state every 100ms max to avoid re-render flood
                    // For now, we just set it.
                    setVessels(Array.from(newMap.values()))

                    setState(prev => ({
                        ...prev,
                        lastMessageTime: Date.now(),
                        messageCount: prev.messageCount + 1
                    }))
                }
            }

            ws.onerror = (event) => {
                console.error('[AISStream] Error:', event)
                if (isMounted) {
                    setState(prev => ({ ...prev, status: 'error', error: new Error('WebSocket error') }))
                }
            }

            ws.onclose = () => {
                if (!isMounted) return
                console.log('[AISStream] Disconnected')
                setState(prev => ({ ...prev, status: 'disconnected' }))

                if (reconnectionManagerRef.current.shouldReconnect()) {
                    const delay = reconnectionManagerRef.current.getDelay()
                    setTimeout(() => {
                        if (isMounted) {
                            reconnectionManagerRef.current.incrementAttempt()
                            connect()
                        }
                    }, delay)
                }
            }
        }

        connect()

        return () => {
            isMounted = false
            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, [config.apiKey])

    return { state, vessels }
}
