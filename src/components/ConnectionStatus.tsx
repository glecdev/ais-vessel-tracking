interface ConnectionStatusProps {
    status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'
    error: Error | null
    messageCount: number
    lastMessageTime: number
}

export function ConnectionStatus({ status, error, messageCount, lastMessageTime }: ConnectionStatusProps) {
    const getStatusColor = () => {
        switch (status) {
            case 'connected':
                return 'bg-green-500'
            case 'connecting':
                return 'bg-yellow-500 animate-pulse'
            case 'disconnected':
                return 'bg-gray-500'
            case 'error':
                return 'bg-red-500'
            default:
                return 'bg-gray-400'
        }
    }

    const getStatusText = () => {
        switch (status) {
            case 'connected':
                return '연결됨'
            case 'connecting':
                return '연결 중...'
            case 'disconnected':
                return '연결 끊김'
            case 'error':
                return '오류'
            default:
                return '대기 중'
        }
    }

    const getTimeSinceLastMessage = () => {
        if (!lastMessageTime) return '-'
        const seconds = Math.floor((Date.now() - lastMessageTime) / 1000)
        if (seconds < 60) return `${seconds}초 전`
        const minutes = Math.floor(seconds / 60)
        return `${minutes}분 전`
    }

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">WebSocket 연결 상태</h2>

            <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
                <span className="font-semibold">{getStatusText()}</span>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                    <p className="text-red-700 text-sm">{error.message}</p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-gray-600">수신 메시지</p>
                    <p className="text-2xl font-bold">{messageCount.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600">마지막 수신</p>
                    <p className="text-2xl font-bold">{getTimeSinceLastMessage()}</p>
                </div>
            </div>
        </div>
    )
}
