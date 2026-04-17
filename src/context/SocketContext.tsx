import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import socketService from '../services/socket'
import { useAuthStore } from '../stores/authStore'
import { toast } from 'sonner'
import { Socket } from 'socket.io-client'

interface SocketContextType {
    socket: Socket | null
    isConnected: boolean
    connect: () => void
    disconnect: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = () => {
    const context = useContext(SocketContext)
    if (!context) {
        throw new Error('يجب استخدام useSocket داخل SocketProvider')
    }
    return context
}

interface SocketProviderProps {
    children: ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false)
    const { user, token } = useAuthStore()
    const [socket, setSocket] = useState<Socket | null>(null)

    const connect = () => {
        if (!token) {
            console.log('No token available, skipping socket connection')
            return
        }

        if (socketService.isConnected()) {
            console.log('Socket already connected')
            return
        }

        console.log('Connecting to socket...')
        const socketInstance = socketService.connect(token)
        setSocket(socketInstance)
    }

    const disconnect = () => {
        console.log('Disconnecting socket...')
        socketService.disconnect()
        setSocket(null)
        setIsConnected(false)
    }

    useEffect(() => {
        // Auto-connect when user is authenticated
        if (user && token) {
            connect()
        } else {
            disconnect()
        }
        // Intentionally no cleanup disconnect: React 18 StrictMode remount would tear down
        // a WebSocket still handshaking and spam the console. Logout path above still disconnects.
    }, [user, token])

    useEffect(() => {
        if (!socket) return

        // Connection event handlers
        const handleConnect = () => {
            console.log('✅ Socket connected successfully')
            setIsConnected(true)
            toast.success('متصل بالخادم', { duration: 2000 })
        }

        const handleDisconnect = (reason: string) => {
            console.log('❌ Socket disconnected:', reason)
            setIsConnected(false)

            if (reason === 'io server disconnect') {
                // Server disconnected, try to reconnect
                toast.error('انقطع الاتصال بالخادم')
                setTimeout(() => connect(), 1000)
            }
        }

        const handleConnectError = (error: Error) => {
            console.error('Socket connection error:', error)
            setIsConnected(false)
            toast.error('فشل الاتصال بالخادم')
        }

        const handleReconnect = (attemptNumber: number) => {
            console.log(`تمت إعادة الاتصال بعد ${attemptNumber} محاولة`)
            toast.success('تمت إعادة الاتصال بالخادم')
        }

        // Register event listeners
        socket.on('connect', handleConnect)
        socket.on('disconnect', handleDisconnect)
        socket.on('connect_error', handleConnectError)
        socket.on('reconnect', handleReconnect)

        // Cleanup
        return () => {
            socket.off('connect', handleConnect)
            socket.off('disconnect', handleDisconnect)
            socket.off('connect_error', handleConnectError)
            socket.off('reconnect', handleReconnect)
        }
    }, [socket])

    const value: SocketContextType = {
        socket,
        isConnected,
        connect,
        disconnect
    }

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    )
}
