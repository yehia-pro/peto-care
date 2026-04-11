import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, User, Sparkles } from 'lucide-react'
import { aiAPI } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { toast } from 'sonner'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export const MiniAIAssistant = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'مرحباً! أنا مساعدك البيطري الذكي. اسألني أي شيء عن صحة حيوانك الأليف، التغذية، أو السلوك.',
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { user } = useAuthStore()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await aiAPI.ask(userMessage.content)

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.data.answer,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, botMessage])
        } catch (error: any) {
            console.error('AI Error:', error)
            const serverAnswer = error?.response?.data?.answer || error?.response?.data?.reply
            toast.error(serverAnswer || 'تعذر الاتصال بالمساعد الذكي حالياً. إذا كانت الحالة طارئة يُرجى التوجه للطبيب البيطري فوراً.')
            if (serverAnswer) {
              const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: String(serverAnswer),
                timestamp: new Date()
              }
              setMessages(prev => [...prev, botMessage])
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (!user && !isOpen) return null

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${isOpen ? 'bg-red-500 rotate-90' : 'bg-gradient-to-r from-purple-600 to-[var(--color-vet-primary)] animate-bounce-slow'
                    }`}
            >
                {isOpen ? (
                    <X className="w-8 h-8 text-white" />
                ) : (
                    <Bot className="w-8 h-8 text-white" />
                )}
            </button>

            {/* Chat Window */}
            <div
                className={`fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right border border-indigo-100 ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-10 pointer-events-none'
                    }`}
                style={{ height: '500px', maxHeight: '80vh' }}
                dir="rtl"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-[var(--color-vet-primary)] p-4 flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg font-['Cairo']">المساعد البيطري الذكي</h3>
                        <p className="text-indigo-100 text-xs font-['Tajawal']">مدعوم بواسطة Google Gemini</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 text-right">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                        >
                            <div
                                className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm text-sm font-['Tajawal'] ${msg.role === 'user'
                                    ? 'bg-[var(--color-vet-primary)] text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="flex items-center gap-2 mb-1 text-[var(--color-vet-primary)] font-semibold text-xs">
                                        <Bot className="w-3 h-3" /> المساعد الذكي
                                    </div>
                                )}
                                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                                    {msg.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-end">
                            <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                                <Bot className="w-4 h-4 text-[var(--color-vet-primary)] animate-pulse" />
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-[var(--color-vet-primary)] rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-[var(--color-vet-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    <span className="w-1.5 h-1.5 bg-[var(--color-vet-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="اسأل عن صحة حيوانك..."
                            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:bg-white transition-all text-sm font-['Tajawal'] text-right"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="p-2 bg-[var(--color-vet-primary)] text-white rounded-xl hover:bg-[var(--color-vet-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-5 h-5 transform rotate-180" />
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-gray-400 font-['Tajawal']">
                            الذكاء الاصطناعي قد يخطئ. استشر طبيباً بيطرياً دائماً للحالات الطارئة.
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
