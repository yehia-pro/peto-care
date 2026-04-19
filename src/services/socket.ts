import { io, Socket } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'https://yehia-ayman-peto-care-server.hf.space/api'
const SOCKET_URL = API_URL.replace('/api', '')
console.log('[Socket] Connecting to:', SOCKET_URL)

interface SocketEvents {
    // Chat events
    'join-chat': (chatId: string) => void
    'leave-chat': (chatId: string) => void
    'send-message': (data: any) => void
    'new-message': (message: any) => void
    'typing': (data: { chatId: string; userId: string; isTyping: boolean }) => void
    'user-typing': (data: { userId: string; isTyping: boolean }) => void

    // Appointment events
    'appointment-updated': (appointment: any) => void
    'appointment-confirmed': (appointment: any) => void
    'appointment-cancelled': (appointment: any) => void

    // Delivery events
    'driver-location': (data: { lat: number; lng: number; orderId: string }) => void
    'order-status-updated': (data: { orderId: string; status: string }) => void

    // General events
    'connect': () => void
    'disconnect': () => void
    'error': (error: Error) => void
}

class SocketService {
    private socket: Socket | null = null
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5

    /**
     * Connect to Socket.IO server
     * @param token - JWT authentication token
     */
    connect(token: string): Socket {
        if (this.socket?.connected) {
            console.log('Socket already connected')
            return this.socket
        }
        // Reuse in-flight client (e.g. React 18 StrictMode remount) instead of opening a second WebSocket
        if (this.socket && !this.socket.connected) {
            return this.socket
        }

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 15000,
            reconnectionAttempts: 10,
            timeout: 20000,  // wait longer for Hugging Face cold-start
        })

        this.setupEventListeners()
        return this.socket
    }

    /**
     * Setup default event listeners
     */
    private setupEventListeners(): void {
        if (!this.socket) return

        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket?.id)
            this.reconnectAttempts = 0
        })

        this.socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason)
        })

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error)
            this.reconnectAttempts++

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached')
                this.disconnect()
            }
        })

        this.socket.on('error', (error) => {
            console.error('Socket error:', error)
        })
    }

    /**
     * Disconnect from Socket.IO server
     */
    disconnect(): void {
        if (!this.socket) return
        const s = this.socket
        this.socket = null
        try {
            s.removeAllListeners()
            s.disconnect()
        } catch {
            /* ignore */
        }
        console.log('Socket disconnected manually')
    }

    /**
     * Get the current socket instance
     */
    getSocket(): Socket | null {
        return this.socket
    }

    /**
     * Check if socket is connected
     */
    isConnected(): boolean {
        return this.socket?.connected || false
    }

    /**
     * Emit an event to the server
     */
    emit(event: string, data?: any): void {
        if (!this.socket?.connected) {
            console.warn('Socket not connected, cannot emit event:', event)
            return
        }
        this.socket.emit(event, data)
    }

    /**
     * Listen to an event from the server
     */
    on(event: string, callback: (...args: any[]) => void): void {
        if (!this.socket) {
            console.warn('Socket not initialized, cannot listen to event:', event)
            return
        }
        this.socket.on(event, callback)
    }

    /**
     * Remove event listener
     */
    off(event: string, callback?: (...args: any[]) => void): void {
        if (!this.socket) return
        this.socket.off(event, callback)
    }

    /**
     * Join a room
     */
    joinRoom(room: string): void {
        this.emit('join-room', room)
    }

    /**
     * Leave a room
     */
    leaveRoom(room: string): void {
        this.emit('leave-room', room)
    }
}

// Export singleton instance
export default new SocketService()
