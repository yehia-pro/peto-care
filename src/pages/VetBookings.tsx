import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, User, Check, X, AlertCircle, Mail, Phone, FileText, Plus, Trash2, Video, File, MessageCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { appointmentsAPI, slotsAPI, uploadAPI } from '../services/api'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

interface Appointment {
    _id: string
    userId: string
    vetId: string
    scheduledAt: string
    reason: string
    notes: string
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    createdAt: string
    userName?: string
    userEmail?: string
    userPhone?: string
    entryNumber?: number
    doctorNotes?: string
}

interface Slot {
    _id: string
    date: string
    time: string
    isBooked: boolean
}

interface UploadedFile {
    id: string
    filename: string
    mimetype: string
    size: number
    path: string
    createdAt: string
}

const VetBookings = () => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [slots, setSlots] = useState<Slot[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all')
    const [activeTab, setActiveTab] = useState<'appointments' | 'slots' | 'library'>('appointments')

    // New Slot Form
    const [newSlotDate, setNewSlotDate] = useState('')
    const [newSlotTime, setNewSlotTime] = useState('')

    // Library state
    const [files, setFiles] = useState<UploadedFile[]>([])
    const [uploadingFile, setUploadingFile] = useState(false)

    // Approval Modal State
    const [showApprovalModal, setShowApprovalModal] = useState(false)
    const [selectedAptForApproval, setSelectedAptForApproval] = useState<Appointment | null>(null)
    const [approvalDate, setApprovalDate] = useState('')
    const [approvalTime, setApprovalTime] = useState('')
    const [entryNumber, setEntryNumber] = useState('')
    const [doctorNotes, setDoctorNotes] = useState('')
    const [viewNotesModal, setViewNotesModal] = useState<string | null>(null)

    useEffect(() => {
        if (user?.role === 'vet') {
            fetchData()
        }
    }, [user])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [aptRes, slotRes, filesRes] = await Promise.all([
                appointmentsAPI.getAppointments(),
                slotsAPI.getSlots(),
                uploadAPI.getFiles()
            ])

            setAppointments(aptRes.data.appointments || [])
            setSlots(slotRes.data.slots || [])
            setFiles(filesRes.data.files || [])
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('فشل في تحميل البيانات')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (appointmentId: string, newStatus: 'confirmed' | 'cancelled') => {
        try {
            await appointmentsAPI.updateAppointmentStatus(appointmentId, newStatus)
            toast.success(newStatus === 'confirmed' ? 'تم تأكيد الموعد' : 'تم رفض الموعد')
            fetchData() // Refresh data
        } catch (error) {
            console.error('Error updating appointment:', error)
            toast.error('فشل في تحديث الموعد')
        }
    }

    const openApprovalModal = (appointment: Appointment) => {
        setSelectedAptForApproval(appointment)
        setShowApprovalModal(true)
        setApprovalDate('')
        setApprovalTime('')
        setEntryNumber('')
        setDoctorNotes('')
    }

    const handleApproveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAptForApproval || !approvalDate || !approvalTime || !entryNumber) {
            toast.error('يرجى إكمال جميع الحقول');
            return;
        }
        try {
            const scheduledAt = new Date(`${approvalDate}T${approvalTime}:00`).toISOString();
            await appointmentsAPI.updateAppointmentStatus(selectedAptForApproval._id, 'confirmed', scheduledAt, parseInt(entryNumber), doctorNotes);
            toast.success('تم تأكيد الموعد وإرسال الإشعار للمريض');
            setShowApprovalModal(false);
            fetchData();
        } catch (error) {
            toast.error('فشل في تأكيد الموعد');
        }
    }

    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSlotDate || !newSlotTime) {
            toast.error('يرجى اختيار التاريخ والوقت')
            return
        }

        try {
            await slotsAPI.createSlot({ date: newSlotDate, time: newSlotTime })
            toast.success('تم إضافة الموعد بنجاح')
            setNewSlotDate('')
            setNewSlotTime('')
            fetchData()
        } catch (error) {
            toast.error('فشل إضافة الموعد')
        }
    }

    const handleDeleteSlot = async (slotId: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا الموعد؟')) return

        try {
            await slotsAPI.deleteSlot(slotId)
            toast.success('تم حذف الموعد')
            fetchData()
        } catch (error) {
            toast.error('فشل حذف الموعد')
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'document') => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploadingFile(true)
            if (type === 'video') {
                await uploadAPI.uploadVideo(file)
                toast.success('تم رفع الفيديو بنجاح')
            } else {
                await uploadAPI.uploadDocument(file, 'general')
                toast.success('تم رفع الملف بنجاح')
            }
            fetchData()
        } catch (error) {
            toast.error('فشل رفع الملف')
        } finally {
            setUploadingFile(false)
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' بايت'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' كيلوبايت'
        return (bytes / (1024 * 1024)).toFixed(1) + ' ميجابايت'
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'قيد الانتظار'
            case 'confirmed': return 'مؤكد'
            case 'completed': return 'مكتمل'
            case 'cancelled': return 'ملغي'
            default: return status
        }
    }

    const filteredAppointments = appointments.filter(apt => {
        if (filter === 'all') return true
        return apt.status === filter
    })

    if (!user || user.role !== 'vet') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">غير مصرح</h2>
                    <p className="text-gray-600">هذه الصفحة متاحة للأطباء البيطريين فقط</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة العيادة</h1>
                        <p className="text-gray-600">إدارة الحجوزات والمواعيد المتاحة</p>
                    </div>
                    <div className="flex bg-white rounded-lg p-1 shadow-sm mt-4 md:mt-0">
                        <button
                            onClick={() => setActiveTab('appointments')}
                            className={`px-4 py-2 rounded-md transition-all ${activeTab === 'appointments' ? 'bg-[var(--color-vet-primary)] text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            الحجوزات
                        </button>
                        <button
                            onClick={() => setActiveTab('slots')}
                            className={`px-4 py-2 rounded-md transition-all ${activeTab === 'slots' ? 'bg-[var(--color-vet-primary)] text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            المواعيد المتاحة
                        </button>
                        <button
                            onClick={() => setActiveTab('library')}
                            className={`px-4 py-2 rounded-md transition-all ${activeTab === 'library' ? 'bg-[var(--color-vet-primary)] text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            المكتبة
                        </button>
                    </div>
                </div>

                {activeTab === 'appointments' ? (
                    <>
                        {/* Filter Tabs */}
                        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { key: 'all', label: 'الكل', count: appointments.length },
                                    { key: 'pending', label: 'قيد الانتظار', count: appointments.filter(a => a.status === 'pending').length },
                                    { key: 'confirmed', label: 'مؤكد', count: appointments.filter(a => a.status === 'confirmed').length },
                                    { key: 'completed', label: 'مكتمل', count: appointments.filter(a => a.status === 'completed').length }
                                ].map(({ key, label, count }) => (
                                    <button
                                        key={key}
                                        onClick={() => setFilter(key as any)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === key
                                            ? 'bg-[var(--color-vet-primary)] text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {label} ({count})
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Appointments List */}
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                                <p className="text-gray-600">جاري التحميل...</p>
                            </div>
                        ) : filteredAppointments.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-md p-12 text-center">
                                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد حجوزات</h3>
                                <p className="text-gray-600">لا توجد حجوزات {filter !== 'all' ? `بحالة "${getStatusText(filter)}"` : ''}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredAppointments.map((appointment) => (
                                    <div key={appointment._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            {/* Appointment Info */}
                                            <div className="flex-1 space-y-3">
                                                {/* Patient Info */}
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <User className="w-6 h-6 text-[var(--color-vet-primary)]" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{appointment.userName || 'مريض'}</h3>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            {appointment.userEmail && (
                                                                <div className="flex items-center gap-1">
                                                                    <Mail className="w-4 h-4" />
                                                                    <span>{appointment.userEmail}</span>
                                                                </div>
                                                            )}
                                                            {appointment.userPhone && (
                                                                <div className="flex items-center gap-1">
                                                                    <Phone className="w-4 h-4" />
                                                                    <span>{appointment.userPhone}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Date & Time */}
                                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Calendar className="w-4 h-4 text-[var(--color-vet-primary)]" />
                                                        <span>{format(new Date(appointment.scheduledAt), 'EEEE, d MMMM yyyy', { locale: ar })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Clock className="w-4 h-4 text-[var(--color-vet-primary)]" />
                                                        <span>{format(new Date(appointment.scheduledAt), 'h:mm a', { locale: ar })}</span>
                                                    </div>
                                                </div>

                                                {/* Reason & Notes */}
                                                <div className="space-y-2">
                                                    <div className="flex items-start gap-2">
                                                        <FileText className="w-4 h-4 text-gray-500 mt-1" />
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700">السبب: {appointment.reason}</p>
                                                            {appointment.notes && (
                                                                <button
                                                                    onClick={() => setViewNotesModal(appointment.notes)}
                                                                    className="mt-2 text-sm text-[var(--color-vet-primary)] hover:text-blue-800 font-medium flex items-center gap-1"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                    أنقر لعرض تفاصيل الاستمارة
                                                                </button>
                                                            )}
                                                            {appointment.doctorNotes && (
                                                                <div className="text-sm text-blue-800 bg-blue-50 mt-2 p-3 rounded-lg border border-blue-100 whitespace-pre-wrap">
                                                                    <span className="font-semibold block mb-1">ملاحظاتي التعقيبية:</span>
                                                                    {appointment.doctorNotes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status Badge */}
                                                <div>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                                                        {getStatusText(appointment.status)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {appointment.status === 'pending' && (
                                                <div className="flex gap-3 lg:flex-col">
                                                    <button
                                                        onClick={() => openApprovalModal(appointment)}
                                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-vet-secondary)] text-white rounded-xl hover:bg-[var(--color-vet-secondary)] transition-colors font-medium shadow-lg hover:shadow-xl"
                                                    >
                                                        <Check className="w-5 h-5" />
                                                        <span>موافقة وتحديد موعد</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(appointment._id, 'cancelled')}
                                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                                                    >
                                                        <X className="w-5 h-5" />
                                                        <span>رفض</span>
                                                    </button>
                                                </div>
                                            )}
                                            {appointment.status === 'confirmed' && (
                                                <div className="flex gap-3 lg:flex-col">
                                                    <button
                                                        onClick={() => navigate('/chat', { state: { recipientId: appointment.userId, recipientName: appointment.userName } })}
                                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-vet-primary)] text-white rounded-xl hover:bg-[var(--color-vet-primary)] transition-colors font-medium shadow-lg hover:shadow-xl"
                                                    >
                                                        <MessageCircle className="w-5 h-5" />
                                                        <span>مراسلة</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : activeTab === 'slots' ? (
                    <div className="space-y-6">
                        {/* Add Slot Form */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">إضافة موعد جديد</h3>
                            <form onSubmit={handleAddSlot} className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="w-full md:w-1/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                                    <input
                                        type="date"
                                        value={newSlotDate}
                                        onChange={(e) => setNewSlotDate(e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="w-full md:w-1/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">الوقت</label>
                                    <input
                                        type="time"
                                        value={newSlotTime}
                                        onChange={(e) => setNewSlotTime(e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full md:w-1/3 bg-[var(--color-vet-primary)] text-white p-2 rounded-lg hover:bg-[var(--color-vet-primary)] flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    إضافة
                                </button>
                            </form>
                        </div>

                        {/* Slots List */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">المواعيد المتاحة ({slots.length})</h3>
                            {slots.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">لا توجد مواعيد متاحة حالياً</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {slots.map((slot) => (
                                        <div key={slot._id} className="border p-4 rounded-lg flex justify-between items-center hover:bg-gray-50">
                                            <div>
                                                <div className="flex items-center gap-2 text-gray-900 font-medium">
                                                    <Calendar className="w-4 h-4 text-[var(--color-vet-primary)]" />
                                                    {format(new Date(slot.date), 'PP', { locale: ar })}
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                                                    <Clock className="w-4 h-4 text-[var(--color-vet-primary)]" />
                                                    {slot.time}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSlot(slot._id)}
                                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                title="حذف الموعد"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Upload Section */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">رفع ملفات جديدة</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[var(--color-vet-primary)] transition-colors">
                                    <label className="cursor-pointer flex flex-col items-center gap-3">
                                        <Video className="w-12 h-12 text-[var(--color-vet-primary)]" />
                                        <span className="text-sm font-medium text-gray-700">رفع فيديو</span>
                                        <span className="text-xs text-gray-500">MP4, WebM (حتى 50 MB)</span>
                                        <input
                                            type="file"
                                            accept="video/mp4,video/webm"
                                            onChange={(e) => handleFileUpload(e, 'video')}
                                            disabled={uploadingFile}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[var(--color-vet-secondary)] transition-colors">
                                    <label className="cursor-pointer flex flex-col items-center gap-3">
                                        <File className="w-12 h-12 text-[var(--color-vet-secondary)]" />
                                        <span className="text-sm font-medium text-gray-700">رفع مستند</span>
                                        <span className="text-xs text-gray-500">PDF, JPG, PNG (حتى 10 MB)</span>
                                        <input
                                            type="file"
                                            accept="application/pdf,image/jpeg,image/png"
                                            onChange={(e) => handleFileUpload(e, 'document')}
                                            disabled={uploadingFile}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Files List */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">ملفاتي ({files.length})</h3>
                            {files.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">لا توجد ملفات محملة حالياً</p>
                            ) : (
                                <div className="space-y-3">
                                    {files.map((file) => (
                                        <div key={file.id} className="border p-4 rounded-lg flex items-center justify-between hover:bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                {file.mimetype.startsWith('video/') ? (
                                                    <Video className="w-8 h-8 text-[var(--color-vet-primary)]" />
                                                ) : (
                                                    <File className="w-8 h-8 text-[var(--color-vet-secondary)]" />
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900">{file.filename}</p>
                                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                                        <span>{formatFileSize(file.size)}</span>
                                                        <span>•</span>
                                                        <span>{format(new Date(file.createdAt), 'PP', { locale: ar })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <a
                                                href={`/api${file.path.replace(/\\/g, '/')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[var(--color-vet-primary)] hover:text-[var(--color-vet-primary)] font-medium text-sm"
                                            >
                                                عرض
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Approval Modal */}
                {showApprovalModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">تأكيد وتحديد الموعد</h3>
                                <button onClick={() => setShowApprovalModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleApproveSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الكشف</label>
                                    <input type="date" required value={approvalDate} onChange={e => setApprovalDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-vet-primary)]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">وقت الكشف</label>
                                    <input type="time" required value={approvalTime} onChange={e => setApprovalTime(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-vet-primary)]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم الدخول (طابور)</label>
                                    <input type="number" required min="1" value={entryNumber} onChange={e => setEntryNumber(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-vet-primary)]" placeholder="مثال: 5" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات للطبيب (اختياري)</label>
                                    <textarea
                                        value={doctorNotes}
                                        onChange={e => setDoctorNotes(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-vet-primary)] placeholder-gray-400"
                                        placeholder="أضف أي ملاحظات إضافية ترغب بظهورها مع الموعد..."
                                    />
                                </div>
                                <div className="flex gap-3 pt-4 border-t">
                                    <button type="button" onClick={() => setShowApprovalModal(false)} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg font-medium hover:bg-gray-200">إلغاء</button>
                                    <button type="submit" className="flex-1 py-2 text-white bg-[var(--color-vet-secondary)] rounded-lg font-bold hover:bg-[var(--color-vet-secondary)]">تأكيد الموعد</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* View Notes Modal */}
                {viewNotesModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-4 border-b pb-4 border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <FileText className="w-6 h-6 text-[var(--color-vet-primary)]" />
                                    <span>تفاصيل استمارة المريض</span>
                                </h3>
                                <button onClick={() => setViewNotesModal(null)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full hover:bg-gray-100 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    {viewNotesModal.replace('بيانات الاستمارة:', '').trim()}
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                                <button onClick={() => setViewNotesModal(null)} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition-colors">
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default VetBookings
