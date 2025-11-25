/**
 * Throttle utility
 * 일정 시간 간격으로 함수 실행을 제한합니다.
 */

export function throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean

    return function (this: unknown, ...args: Parameters<T>): void {
        if (!inThrottle) {
            inThrottle = true
            func.apply(this, args)

            setTimeout(() => {
                inThrottle = false
            }, limit)
        }
    }
}

/**
 * Debounce utility  
 * 마지막 호출 이후 일정 시간이 지나야 함수를 실행합니다.
 */

export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null

    return function (this: unknown, ...args: Parameters<T>): void {
        if (timeout) {
            clearTimeout(timeout)
        }

        timeout = setTimeout(() => {
            func.apply(this, args)
            timeout = null
        }, wait)
    }
}
