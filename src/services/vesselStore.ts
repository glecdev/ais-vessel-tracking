import type { Vessel } from "@/types/ais.types"

export class VesselStore {
    private vessels = new Map<number, Vessel>()
    private maxSize = 1000

    update(newData: Partial<Vessel>): Map<number, Vessel> {
        if (!newData.mmsi) return new Map(this.vessels)

        const existing = this.vessels.get(newData.mmsi)

        const updatedVessel: Vessel = {
            mmsi: newData.mmsi,
            name: newData.name || existing?.name || 'Unknown',
            shipType: newData.shipType || existing?.shipType || 'Unknown',
            position: newData.position || existing?.position || { latitude: 0, longitude: 0 },
            course: newData.course ?? existing?.course ?? 0,
            speed: newData.speed ?? existing?.speed ?? 0,
            destination: newData.destination || existing?.destination || 'Unknown',
            eta: newData.eta || existing?.eta || null,
            lastUpdate: newData.lastUpdate || Date.now()
        }

        const newVessels = new Map(this.vessels)
        newVessels.set(updatedVessel.mmsi, updatedVessel)

        if (newVessels.size > this.maxSize) {
            const oldestMmsi = this.findOldest(newVessels)
            if (oldestMmsi) newVessels.delete(oldestMmsi)
        }

        this.vessels = newVessels
        return newVessels
    }

    getAll(): Vessel[] {
        return Array.from(this.vessels.values())
    }

    getByMMSI(mmsi: number): Vessel | undefined {
        return this.vessels.get(mmsi)
    }

    cleanup(maxAge: number): Map<number, Vessel> {
        const now = Date.now()
        let changed = false
        const newVessels = new Map(this.vessels)

        for (const [mmsi, vessel] of newVessels) {
            if (now - vessel.lastUpdate > maxAge) {
                newVessels.delete(mmsi)
                changed = true
            }
        }

        if (changed) {
            this.vessels = newVessels
            return newVessels
        }
        return this.vessels
    }

    private findOldest(map: Map<number, Vessel>): number | null {
        let oldestTime = Infinity
        let oldestMmsi = null

        for (const [mmsi, vessel] of map) {
            if (vessel.lastUpdate < oldestTime) {
                oldestTime = vessel.lastUpdate
                oldestMmsi = mmsi
            }
        }
        return oldestMmsi
    }
}
