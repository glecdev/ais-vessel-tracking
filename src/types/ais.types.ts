export interface Vessel {
    mmsi: number
    name: string
    shipType: string
    type?: string  // alias for shipType
    position: {
        latitude: number
        longitude: number
    }
    course: number  // 0-360
    speed: number   // knots
    heading?: number  // true heading 0-360
    status?: string  // navigation status
    destination: string
    eta: string | null
    lastUpdate: number
    callsign?: string
    imo?: number
    dimensions?: {
        length: number
        width: number
    }
    draught?: number
}

export interface AISMessage {
    MessageType: 'PositionReport' | 'ShipStaticData' | 'StandardClassBPositionReport'
    MetaData: {
        MMSI: number
        ShipName?: string
        latitude: number
        longitude: number
        time_utc: string
    }
    Message: {
        PositionReport?: {
            Cog: number
            Latitude: number
            Longitude: number
            Sog: number
            TrueHeading: number
            Timestamp: string
        }
        ShipStaticData?: {
            Destination: string
            Eta: {
                Day: number
                Hour: number
                Minute: number
                Month: number
            }
            ImoNumber: number
            Name: string
            Type: number
        }
        StandardClassBPositionReport?: {
            Cog: number
            Latitude: number
            Longitude: number
            Sog: number
            TrueHeading: number
            Timestamp: string
        }
    }
}

export interface AISStreamConfig {
    apiKey: string
    boundingBoxes: number[][][] // [[[lat, lon], [lat, lon]]]
}
