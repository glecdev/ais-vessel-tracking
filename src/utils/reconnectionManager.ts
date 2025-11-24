export class ReconnectionManager {
    private attempt = 0
    private maxAttempts = 10
    private baseDelay = 1000
    private maxDelay = 30000

    getDelay(): number {
        const exponentialDelay = Math.min(
            this.baseDelay * Math.pow(2, this.attempt),
            this.maxDelay
        )
        const jitter = Math.random() * 1000
        return exponentialDelay + jitter
    }

    shouldReconnect(): boolean {
        return this.attempt < this.maxAttempts
    }

    incrementAttempt(): void {
        this.attempt++
    }

    reset(): void {
        this.attempt = 0
    }
}
