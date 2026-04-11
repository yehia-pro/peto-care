import React, { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ar } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { appointmentsAPI } from '../services/api'
import { toast } from 'sonner'
import { Calendar as CalendarIcon, Clock, User } from 'lucide-react'

const locales = {
    'ar': ar,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

interface AppointmentEvent {
    id: string
    title: string
    start: Date
    end: Date
    resource: any
}

interface AppointmentCalendarProps {
    vetId?: string
    userId?: string
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ vetId, userId }) => {
    const [events, setEvents] = useState<AppointmentEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedEvent, setSelectedEvent] = useState<AppointmentEvent | null>(null)
    const [showEventModal, setShowEventModal] = useState(false)

    useEffect(() => {
        fetchAppointments()
    }, [vetId, userId])

    const fetchAppointments = async () => {
        try {
            setLoading(true)
            const params: any = {}
            if (vetId) params.vetId = vetId
            if (userId) params.userId = userId

            const response = await appointmentsAPI.getAppointments(params)
            const appointments = response.data.appointments || []

            const calendarEvents: AppointmentEvent[] = appointments.map((apt: any) => {
                const start = new Date(apt.scheduledAt)
                const end = new Date(start.getTime() + 60 * 60 * 1000) // 1 hour duration

                return {
                    id: apt._id,
                    title: apt.reason || 'موعد',
                    start,
                    end,
                    resource: apt
                }
            })

            setEvents(calendarEvents)
        } catch (error) {
            console.error('Error fetching appointments:', error)
            toast.error('فشل في تحميل المواعيد')
        } finally {
            setLoading(false)
        }
    }

    const handleSelectEvent = (event: AppointmentEvent) => {
        setSelectedEvent(event)
        setShowEventModal(true)
    }

    // Accept full slotInfo object (matches react-big-calendar signatures)
    const handleSelectSlot = (slotInfo: { start: Date; end?: Date; slots?: Date[] }) => {
        // Could open booking modal here
        toast.info(`اختر موعد في ${format(slotInfo.start, 'PPpp', { locale: ar })}`)
    }

    // Loosen event typing to avoid mismatches with library-provided event shape
    const eventStyleGetter: any = (event: any) => {
        const status = event?.resource?.status
        let backgroundColor = '#3b82f6' // blue for pending

        if (status === 'confirmed') backgroundColor = '#10b981' // green
        else if (status === 'cancelled') backgroundColor = '#ef4444' // red
        else if (status === 'completed') backgroundColor = '#6b7280' // gray

        return {
            style: {
                backgroundColor,
                borderRadius: '8px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block',
                fontSize: '13px',
                padding: '4px 8px'
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-vet-primary)]"></div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6" />
                    تقويم المواعيد
                </h2>
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[var(--color-vet-primary)] rounded"></div>
                        <span>قيد الانتظار</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[var(--color-vet-secondary)] rounded"></div>
                        <span>مؤكد</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span>ملغي</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-500 rounded"></div>
                        <span>مكتمل</span>
                    </div>
                </div>
            </div>

            <div style={{ height: '600px' }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    selectable
                    eventPropGetter={eventStyleGetter}
                    messages={{
                        next: 'التالي',
                        previous: 'السابق',
                        today: 'اليوم',
                        month: 'شهر',
                        week: 'أسبوع',
                        day: 'يوم',
                        agenda: 'جدول الأعمال',
                        date: 'التاريخ',
                        time: 'الوقت',
                        event: 'موعد',
                        noEventsInRange: 'لا توجد مواعيد في هذا النطاق',
                        showMore: (total: number) => `+${total} المزيد`
                    }}
                />
            </div>

            {/* Event Details Modal */}
            {showEventModal && selectedEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">تفاصيل الموعد</h3>
                            <button
                                onClick={() => setShowEventModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-gray-700">
                                <User className="w-5 h-5" />
                                <span className="font-medium">السبب:</span>
                                <span>{selectedEvent.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <Clock className="w-5 h-5" />
                                <span className="font-medium">الوقت:</span>
                                <span>{format(selectedEvent.start, 'PPpp', { locale: ar })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <span className="font-medium">الحالة:</span>
                                <span className={`px-3 py-1 rounded-full text-sm ${selectedEvent.resource.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        selectedEvent.resource.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                            selectedEvent.resource.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                'bg-blue-100 text-blue-800'
                                    }`}>
                                    {selectedEvent.resource.status === 'confirmed' ? 'مؤكد' :
                                        selectedEvent.resource.status === 'cancelled' ? 'ملغي' :
                                            selectedEvent.resource.status === 'completed' ? 'مكتمل' :
                                                'قيد الانتظار'}
                                </span>
                            </div>
                            {selectedEvent.resource.notes && (
                                <div className="text-gray-700">
                                    <span className="font-medium">ملاحظات:</span>
                                    <p className="mt-1 text-sm">{selectedEvent.resource.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowEventModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AppointmentCalendar
