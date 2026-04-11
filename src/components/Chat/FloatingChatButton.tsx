import React, { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { ChatWindow } from './ChatWindow'

interface FloatingChatButtonProps {
    otherUserId: string
    otherUserName: string
    otherUserAvatar?: string
    appointmentId?: string
    position?: 'bottom-right' | 'bottom-left'
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
    otherUserId,
    otherUserName,
    otherUserAvatar,
    appointmentId,
    position = 'bottom-right'
}) => {
    const [isOpen, setIsOpen] = useState(false)

    const positionClasses = position === 'bottom-right'
        ? 'bottom-4 right-4'
        : 'bottom-4 left-4'

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className={`fixed ${positionClasses} bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-all hover:scale-110 z-40 group`}
                    title="فتح الدردشة"
                >
                    <MessageCircle className="w-6 h-6" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        💬
                    </span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <ChatWindow
                    otherUserId={otherUserId}
                    otherUserName={otherUserName}
                    otherUserAvatar={otherUserAvatar}
                    appointmentId={appointmentId}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </>
    )
}
