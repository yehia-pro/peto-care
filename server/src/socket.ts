import { Server as SocketIOServer, Socket } from 'socket.io'
import { supabaseAdmin } from './lib/supabase'

const userSocketMap = new Map<string, string>()
const socketUserMap = new Map<string, string>()

const profileToLegacyRole = (role?: string | null): string => {
  if (role === 'store_owner') return 'petstore'
  if (role === 'vet') return 'vet'
  if (role === 'admin') return 'admin'
  return 'user'
}

export const initializeSocket = (io: SocketIOServer) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined
      if (!token) {
        return next(new Error('Authentication token required'))
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
      if (authError || !authData.user) {
        return next(new Error('Invalid authentication token'))
      }

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .maybeSingle()

      socket.data.userId = authData.user.id
      socket.data.userEmail = authData.user.email || ''
      socket.data.userRole = profileToLegacyRole(profile?.role as string | null)

      next()
    } catch {
      next(new Error('Invalid authentication token'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string

    console.log(`✅ User connected: ${userId} (Socket: ${socket.id})`)

    userSocketMap.set(userId, socket.id)
    socketUserMap.set(socket.id, userId)

    socket.join(`user-${userId}`)

    socket.emit('connected', {
      message: 'Successfully connected to real-time server',
      userId,
      socketId: socket.id
    })

    socket.on('disconnect', (reason) => {
      console.log(`❌ User disconnected: ${userId} (Reason: ${reason})`)
      userSocketMap.delete(userId)
      socketUserMap.delete(socket.id)
    })

    socket.on('join-room', (roomId: string) => {
      socket.join(roomId)
      console.log(`User ${userId} joined room: ${roomId}`)
    })

    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId)
      console.log(`User ${userId} left room: ${roomId}`)
    })

    socket.on('join_chat', (data: { otherUserId: string }) => {
      const chatRoom = `chat_${[userId, data.otherUserId].sort().join('_')}`
      socket.join(chatRoom)
      console.log(`User ${userId} joined chat room: ${chatRoom}`)
      socket.emit('chat_joined', { chatRoom })
    })

    // Real-time chat: emit only until chat persistence is migrated off MongoDB
    socket.on('send_message', async (data: { receiverId: string; content: string; appointmentId?: string }) => {
      try {
        const message = {
          _id: `rt_${Date.now()}`,
          sender: userId,
          receiver: data.receiverId,
          content: data.content,
          appointmentId: data.appointmentId,
          read: false,
          createdAt: new Date().toISOString()
        }

        io.to(`user-${data.receiverId}`).emit('receive_message', {
          message,
          sender: { _id: userId, email: socket.data.userEmail }
        })

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
        io.to(`user-${data.senderId}`).emit('messages_read', { readBy: userId })
      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    })

    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error)
    })
  })

  console.log('🔌 Socket.IO initialized successfully')
}

export const sendNotification = (
  io: SocketIOServer,
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  data?: any
) => {
  void supabaseAdmin
    .from('user_notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type,
      link: data?.link || null,
      metadata: data && typeof data === 'object' ? data : {}
    })
    .then(({ error }) => {
      if (error && !String(error.message || '').includes('user_notifications')) {
        console.error('Error saving notification to DB:', error)
      }
    })

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

  io.to(`user-${userId}`).emit('notification', notification)
  console.log(`📢 Notification sent to user ${userId}:`, title)
  return true
}

export const sendNotificationToUsers = (
  io: SocketIOServer,
  userIds: string[],
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  data?: any
) => {
  let sentCount = 0
  userIds.forEach((uid) => {
    if (sendNotification(io, uid, title, message, type, data)) sentCount++
  })
  console.log(`📢 Notification sent to ${sentCount}/${userIds.length} users`)
  return sentCount
}

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

export const getConnectedUsersCount = (): number => userSocketMap.size
export const isUserConnected = (userId: string): boolean => userSocketMap.has(userId)
export const getConnectedUserIds = (): string[] => Array.from(userSocketMap.keys())
