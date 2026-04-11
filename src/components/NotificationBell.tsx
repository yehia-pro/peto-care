import React, { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

interface Reminder {
    _id: string
    title: string
    description: string
    dueDate: string
    type: string
}

const NotificationBell: React.FC = () => {
    const [reminders, setReminders] = useState<Reminder[]>([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        fetchReminders()
        // Poll for new reminders every 5 minutes
        const interval = setInterval(fetchReminders, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    const fetchReminders = async () => {
        try {
            const response = await fetch('/api/reminders?upcoming=true', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setReminders(data.reminders || [])
                setUnreadCount(data.reminders?.length || 0)
            }
        } catch (error) {
            console.error('Error fetching reminders:', error)
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'vaccination': return 'bg-blue-100 text-blue-800'
            case 'medication': return 'bg-green-100 text-green-800'
            case 'appointment': return 'bg-purple-100 text-purple-800'
            case 'checkup': return 'bg-yellow-100 text-yellow-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'vaccination': return 'تطعيم'
            case 'medication': return 'دواء'
            case 'appointment': return 'موعد'
            case 'checkup': return 'فحص'
            default: return type
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">التذكيرات</h3>
                        <button
                            onClick={() => setShowDropdown(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {reminders.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>لا توجد تذكيرات</p>
                            </div>
                        ) : (
                            reminders.map((reminder) => (
                                <div
                                    key={reminder._id}
                                    className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-semibold text-gray-900">{reminder.title}</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(reminder.type)}`}>
                                            {getTypeLabel(reminder.type)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{reminder.description}</p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(reminder.dueDate), 'PPp', { locale: ar })}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    {reminders.length > 0 && (
                        <div className="p-3 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setShowDropdown(false)
                                    // Navigate to reminders page
                                }}
                                className="w-full text-center text-sm text-[var(--color-vet-primary)] hover:text-[var(--color-vet-primary)] font-medium"
                            >
                                عرض جميع التذكيرات
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default NotificationBell
