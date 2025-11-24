import type { AISMessage, Vessel } from "@/types/ais.types"

export function parseAISMessage(raw: string): Partial<Vessel> | null {
    try {
        const data: AISMessage = JSON.parse(raw)

        if (data.MessageType !== 'PositionReport' &&
            data.MessageType !== 'ShipStaticData' &&
            data.MessageType !== 'StandardClassBPositionReport') {
            return null
        }

        const mmsi = data.MetaData.MMSI
        const now = Date.now()

        const vessel: Partial<Vessel> = {
            mmsi,
            lastUpdate: now
        }

        if (data.MessageType === 'PositionReport' && data.Message.PositionReport) {
            const report = data.Message.PositionReport
            vessel.position = {
                latitude: report.Latitude,
                longitude: report.Longitude
            }
            vessel.course = report.Cog
            vessel.speed = report.Sog
        } else if (data.MessageType === 'StandardClassBPositionReport' && data.Message.StandardClassBPositionReport) {
            const report = data.Message.StandardClassBPositionReport
            vessel.position = {
                latitude: report.Latitude,
                longitude: report.Longitude
            }
            vessel.course = report.Cog
            vessel.speed = report.Sog
        } else if (data.MessageType === 'ShipStaticData' && data.Message.ShipStaticData) {
            const report = data.Message.ShipStaticData
            vessel.name = report.Name
            vessel.destination = report.Destination
            vessel.shipType = report.Type.toString()
        }

        return vessel
    } catch (error) {
        console.error('[AISStream] Parse error:', error)
        return null
    }
}
