import React, { useState, useEffect, useRef } from 'react'
import { Send, X, Loader2 } from 'lucide-react'
import { useSocket } from '../../context/SocketContext'
import { useAuthStore } from '../../stores/authStore'
import axios from 'axios'
import { toast } from 'sonner'

interface Message {
    _id: string
    sender: {
        _id: string
        name?: string
        avatar?: string
    }
    receiver: {
        _id: string
        name?: string
    }
    content: string
    createdAt: string
    read: boolean
}

interface ChatWindowProps {
    otherUserId: string
    otherUserName: string
    otherUserAvatar?: string
    appointmentId?: string
    onClose: () => void
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    otherUserId,
    otherUserName,
    otherUserAvatar,
    appointmentId,
    onClose
}) => {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { socket } = useSocket()
    const { user } = useAuthStore()

    // Scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Load message history
    useEffect(() => {
        const loadHistory = async () => {
            try {
                setLoading(true)
                const token = localStorage.getItem('token')
                const params: any = { otherUserId }
                if (appointmentId) params.appointmentId = appointmentId

                const response = await axios.get('/api/chat', {
                    headers: { Authorization: `Bearer ${token}` },
                    params
                })

                setMessages(response.data.messages || [])
            } catch (error) {
                console.error('Error loading chat history:', error)
                toast.error('فشل تحميل سجل المحادثة')
            } finally {
                setLoading(false)
            }
        }

        loadHistory()
    }, [otherUserId, appointmentId])

    // Join chat room
    useEffect(() => {
        if (!socket) return

        socket.emit('join_chat', { otherUserId })

        return () => {
            // Leave chat when component unmounts
            socket.emit('leave_chat', { otherUserId })
        }
    }, [socket, otherUserId])

    // Listen for incoming messages
    useEffect(() => {
        if (!socket) return

        const handleReceiveMessage = (data: { message: Message }) => {
            // Only add if from the current chat partner
            if (data.message.sender._id === otherUserId) {
                setMessages(prev => [...prev, data.message])

                // Mark as read
                socket.emit('mark_read', { senderId: otherUserId })
            }
        }

        const handleMessageSent = (data: { message: Message }) => {
            // Confirmation that our message was sent
            console.log('Message sent confirmation:', data.message)
        }

        const handleUserTyping = (data: { userId: string; isTyping: boolean }) => {
            if (data.userId === otherUserId) {
                setIsTyping(data.isTyping)
            }
        }

        socket.on('receive_message', handleReceiveMessage)
        socket.on('message_sent', handleMessageSent)
        socket.on('user_typing', handleUserTyping)

        return () => {
            socket.off('receive_message', handleReceiveMessage)
            socket.off('message_sent', handleMessageSent)
            socket.off('user_typing', handleUserTyping)
        }
    }, [socket, otherUserId])

    // Handle typing indicator
    const handleTyping = (isTyping: boolean) => {
        if (socket) {
            socket.emit('typing', { receiverId: otherUserId, isTyping })
        }
    }

    // Send message
    const handleSend = async () => {
        if (!newMessage.trim() || !socket) return

        const messageContent = newMessage.trim()
        setNewMessage('')
        setSending(true)
        handleTyping(false)

        try {
            // Optimistic UI update
            const optimisticMessage: Message = {
                _id: `temp-${Date.now()}`,
                sender: {
                    _id: user?.id || '',
                    name: user?.fullName || user?.email || undefined,
                    avatar: user?.avatarUrl || undefined
                },
                receiver: {
                    _id: otherUserId,
                    name: otherUserName
                },
                content: messageContent,
                createdAt: new Date().toISOString(),
                read: false
            }

            setMessages(prev => [...prev, optimisticMessage])

            // Send via socket
            socket.emit('send_message', {
                receiverId: otherUserId,
                content: messageContent,
                appointmentId
            })

        } catch (error) {
            console.error('Error sending message:', error)
            toast.error('فشل إرسال الرسالة')
        } finally {
            setSending(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {otherUserAvatar ? (
                        <img src={otherUserAvatar} alt={otherUserName} className="w-10 h-10 rounded-full" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            {otherUserName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold">{otherUserName}</h3>
                        {isTyping && <p className="text-xs text-white/80">يكتب...</p>}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="hover:bg-white/20 p-1 rounded transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>لا توجد رسائل بعد. ابدأ المحادثة!</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isOwn = message.sender._id === user?.id
                        return (
                            <div
                                key={message._id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg p-3 ${isOwn
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-white text-gray-800 border border-gray-200'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                    <p
                                        className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'
                                            }`}
                                    >
                                        {new Date(message.createdAt).toLocaleTimeString('ar-EG', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value)
                            handleTyping(e.target.value.length > 0)
                        }}
                        onKeyPress={handleKeyPress}
                        onBlur={() => handleTyping(false)}
                        placeholder="اكتب رسالتك..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                        disabled={sending}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
