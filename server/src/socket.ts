import { Server as SocketIOServer, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'

// Map to store userId -> socketId mappings
const userSocketMap = new Map<string, string>()

// Map to store socketId -> userId mappings (reverse lookup)
const socketUserMap = new Map<string, string>()

interface JWTPayload {
    id: string
    email: string
    role: string
}

/**
 * Initialize Socket.IO event handlers
 */
export const initializeSocket = (io: SocketIOServer) => {
    // Middleware for authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token

        if (!token) {
            return next(new Error('Authentication token required'))
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload

            // Attach user info to socket
            socket.data.userId = decoded.id
            socket.data.userEmail = decoded.email
            socket.data.userRole = decoded.role

            next()
        } catch (error) {
            next(new Error('Invalid authentication token'))
        }
    })

    // Connection handler
    io.on('connection', (socket: Socket) => {
        const userId = socket.data.userId

        console.log(`✅ User connected: ${userId} (Socket: ${socket.id})`)

        // Store userId -> socketId mapping
        userSocketMap.set(userId, socket.id)
        socketUserMap.set(socket.id, userId)

        // Join user to their personal room
        socket.join(`user-${userId}`)

        // Send welcome message
        socket.emit('connected', {
            message: 'Successfully connected to real-time server',
            userId,
            socketId: socket.id
        })

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.log(`❌ User disconnected: ${userId} (Reason: ${reason})`)

            // Remove from maps
            userSocketMap.delete(userId)
            socketUserMap.delete(socket.id)
        })

        // Handle join-room events
        socket.on('join-room', (roomId: string) => {
            socket.join(roomId)
            console.log(`User ${userId} joined room: ${roomId}`)
        })

        // Handle leave-room events
        socket.on('leave-room', (roomId: string) => {
            socket.leave(roomId)
            console.log(`User ${userId} left room: ${roomId}`)
        })

        // Chat-specific handlers
        socket.on('join_chat', (data: { otherUserId: string }) => {
            const chatRoom = `chat_${[userId, data.otherUserId].sort().join('_')}`
            socket.join(chatRoom)
            console.log(`User ${userId} joined chat room: ${chatRoom}`)
            socket.emit('chat_joined', { chatRoom })
        })

        socket.on('send_message', async (data: { receiverId: string; content: string; appointmentId?: string }) => {
            try {
                // Import Message model dynamically
                const { Message } = await import('./models/Message')
                const { Types } = await import('mongoose')

                // Save message to database
                const message = new Message({
                    sender: new Types.ObjectId(userId),
                    receiver: new Types.ObjectId(data.receiverId),
                    content: data.content,
                    appointmentId: data.appointmentId ? new Types.ObjectId(data.appointmentId) : undefined,
                    read: false
                })

                await message.save()
                await message.populate('sender', 'name avatar')
                await message.populate('receiver', 'name avatar')

                // Emit to receiver
                io.to(`user-${data.receiverId}`).emit('receive_message', {
                    message,
                    sender: message.sender
                })

                // Emit back to sender for confirmation
                socket.emit('message_sent', { message })

                console.log(`💬 Message sent from ${userId} to ${data.receiverId}`)
            } catch (error) {
                console.error('Error sending message via socket:', error)
                socket.emit('message_error', { error: 'Failed to send message' })
            }
        })

        socket.on('typing', (data: { receiverId: string; isTyping: boolean }) => {
            io.to(`user-${data.receiverId}`).emit('user_typing', {
                userId,
                isTyping: data.isTyping
            })
        })

        socket.on('mark_read', async (data: { senderId: string }) => {
            try {
                const { Message } = await import('./models/Message')
                const { Types } = await import('mongoose')

                await Message.updateMany(
                    {
                        sender: new Types.ObjectId(data.senderId),
                        receiver: new Types.ObjectId(userId),
                        read: false
                    },
                    { $set: { read: true } }
                )

                // Notify sender that messages were read
                io.to(`user-${data.senderId}`).emit('messages_read', { readBy: userId })
            } catch (error) {
                console.error('Error marking messages as read:', error)
            }
        })

        // Handle errors
        socket.on('error', (error) => {
            console.error(`Socket error for user ${userId}:`, error)
        })
    })

    console.log('🔌 Socket.IO initialized successfully')
}

/**
 * Send notification to a specific user
 */
export const sendNotification = (
    io: SocketIOServer,
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    data?: any
) => {
    // Async save to database
    import('./models/Notification')
        .then(({ default: Notification }) => {
            return Notification.create({
                userId,
                title,
                message,
                type,
                link: data?.link || '' // Store any specific link data if provided
            });
        })
        .catch(err => console.error('Error saving notification to DB:', err));

    const socketId = userSocketMap.get(userId)

    if (!socketId) {
        console.log(`User ${userId} is not connected, notification saved to DB but not emitted`)
        return false
    }

    const notification = {
        title,
        message,
        type,
        data,
        timestamp: new Date().toISOString()
    }

    // Emit to user's personal room
    io.to(`user-${userId}`).emit('notification', notification)

    console.log(`📢 Notification sent to user ${userId}:`, title)
    return true
}

/**
 * Send notification to multiple users
 */
export const sendNotificationToUsers = (
    io: SocketIOServer,
    userIds: string[],
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    data?: any
) => {
    let sentCount = 0

    userIds.forEach(userId => {
        const sent = sendNotification(io, userId, title, message, type, data)
        if (sent) sentCount++
    })

    console.log(`📢 Notification sent to ${sentCount}/${userIds.length} users`)
    return sentCount
}

/**
 * Broadcast notification to all connected users
 */
export const broadcastNotification = (
    io: SocketIOServer,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    data?: any
) => {
    const notification = {
        title,
        message,
        type,
        data,
        timestamp: new Date().toISOString()
    }

    io.emit('notification', notification)
    console.log(`📢 Broadcast notification sent to all users:`, title)
}

/**
 * Get connected user count
 */
export const getConnectedUsersCount = (): number => {
    return userSocketMap.size
}

/**
 * Check if user is connected
 */
export const isUserConnected = (userId: string): boolean => {
    return userSocketMap.has(userId)
}

/**
 * Get all connected user IDs
 */
export const getConnectedUserIds = (): string[] => {
    return Array.from(userSocketMap.keys())
}
