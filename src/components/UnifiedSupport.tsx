import { useState } from 'react'
import { X, Mail, HelpCircle, Phone, LifeBuoy } from 'lucide-react'
import { notificationsAPI } from '../services/api'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export const UnifiedSupport = () => {
    const [isOpen, setIsOpen] = useState(false)

    // Support Form State
    const [supportName, setSupportName] = useState('')
    const [supportEmail, setSupportEmail] = useState('')
    const [supportMessage, setSupportMessage] = useState('')
    const [isSendingSupport, setIsSendingSupport] = useState(false)

    const { t } = useTranslation()

    const handleSupportSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!supportName || !supportEmail || !supportMessage) {
            toast.error('يرجى ملء جميع الحقول المطلوبة')
            return
        }

        setIsSendingSupport(true)
        try {
            await notificationsAPI.sendEmail({
                name: supportName,
                email: supportEmail,
                subject: 'طلب دعم فني جديد',
                message: supportMessage
            })
            toast.success('تم إرسال طلبك بنجاح! سنتواصل معك قريباً.')
            setSupportName('')
            setSupportEmail('')
            setSupportMessage('')
            setIsOpen(false)
        } catch (error) {
            console.error('Support Error:', error)
            toast.error('فشل إرسال الطلب. يرجى المحاولة لاحقاً.')
        } finally {
            setIsSendingSupport(false)
        }
    }

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center ${isOpen ? 'bg-red-500 rotate-90' : 'bg-gradient-to-r from-[var(--color-vet-primary)] to-[var(--color-vet-secondary)] animate-bounce-slow text-white'}`}
                title="الدعم الفني"
            >
                {isOpen ? (
                    <X className="w-8 h-8" />
                ) : (
                    <LifeBuoy className="w-8 h-8" />
                )}
            </button>

            {/* Main Window */}
            <div
                className={`fixed bottom-24 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right border border-gray-100 ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-10 pointer-events-none'}`}
                style={{ height: 'auto', maxHeight: '85vh' }}
                dir="rtl"
            >
                {/* Header */}
                <div className="bg-gradient-to-l from-gray-900 to-gray-800 p-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-full">
                            <HelpCircle className="w-6 h-6 text-[var(--color-vet-accent)]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg font-['Cairo']">مركز الدعم الفني</h3>
                            <p className="text-gray-400 text-xs font-['Tajawal']">نحن هنا لمساعدتك في أي وقت</p>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                        <h4 className="font-bold text-blue-800 mb-2 font-['Cairo']">تحتاج مساعدة مباشرة؟</h4>
                        <p className="text-sm text-[var(--color-vet-primary)] mb-3 font-['Tajawal']">يمكنك التواصل معنا عبر الهاتف أو بملء النموذج أدناه.</p>
                        <div className="flex items-center gap-2 text-[var(--color-vet-primary)] font-bold dir-rtl">
                            <Phone className="w-4 h-4" />
                            <span>920033333</span>
                        </div>
                    </div>

                    <form onSubmit={handleSupportSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 font-['Tajawal']">الاسم الكامل</label>
                            <input
                                type="text"
                                value={supportName}
                                onChange={(e) => setSupportName(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-vet-primary)] outline-none transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 font-['Tajawal']">البريد الإلكتروني</label>
                            <input
                                type="email"
                                value={supportEmail}
                                onChange={(e) => setSupportEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-vet-primary)] outline-none transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 font-['Tajawal']">تفاصيل المشكلة</label>
                            <textarea
                                value={supportMessage}
                                onChange={(e) => setSupportMessage(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-vet-primary)] outline-none transition-all resize-none"
                                required
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            disabled={isSendingSupport}
                            className="w-full py-3 bg-gradient-to-r from-[var(--color-vet-primary)] to-[var(--color-vet-secondary)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isSendingSupport ? (
                                <>جاري الإرسال...</>
                            ) : (
                                <>
                                    <Mail className="w-5 h-5" />
                                    إرسال الطلب
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}
