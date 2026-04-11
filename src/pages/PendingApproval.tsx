import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle, Clock, Mail, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const PendingApproval = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const userEmail = location.state?.email || localStorage.getItem('pendingEmail')
    const userRole = location.state?.role || 'vet'

    useEffect(() => {
        // If no email in state, redirect to home
        if (!userEmail) {
            navigate('/')
        }
    }, [userEmail, navigate])

    const roleLabel = userRole === 'vet' ? 'طبيب بيطري' : 'متجر حيوانات'

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header with animated checkmark */}
                <div className="bg-gradient-to-r from-[var(--color-vet-secondary)] to-[var(--color-vet-secondary)] p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 -translate-y-20"></div>
                        <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20"></div>
                    </div>
                    <div className="relative z-10">
                        <div className="inline-block p-4 bg-white rounded-full mb-4 animate-bounce">
                            <CheckCircle className="w-16 h-16 text-[var(--color-vet-secondary)]" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">تم التسجيل بنجاح!</h1>
                        <p className="text-green-50 text-lg">شكراً لتسجيلك كـ {roleLabel}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Status Card */}
                    <div className="bg-yellow-50 border-r-4 border-[var(--color-vet-accent)] p-6 rounded-lg mb-6">
                        <div className="flex items-start gap-4">
                            <Clock className="w-8 h-8 text-[var(--color-vet-accent)] flex-shrink-0 mt-1" />
                            <div>
                                <h2 className="text-xl font-bold text-yellow-900 mb-2">في انتظار الموافقة</h2>
                                <p className="text-yellow-800 leading-relaxed">
                                    تم إرسال طلبك إلى الإدارة للمراجعة. سيتم التواصل معك عبر البريد الإلكتروني فور الموافقة على حسابك.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Info Cards */}
                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                            <Mail className="w-6 h-6 text-[var(--color-vet-primary)] flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-semibold text-blue-900 mb-1">تحقق من بريدك الإلكتروني</h3>
                                <p className="text-[var(--color-vet-primary)] text-sm">
                                    سنرسل لك إشعار على <span className="font-mono bg-blue-100 px-2 py-1 rounded">{userEmail}</span> عند الموافقة على حسابك
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-semibold text-purple-900 mb-1">ماذا بعد؟</h3>
                                <ul className="text-purple-700 text-sm space-y-1 list-disc list-inside">
                                    <li>ستتم مراجعة المستندات المرفقة من قبل فريقنا</li>
                                    <li>عادة ما تستغرق عملية المراجعة من 24-48 ساعة</li>
                                    <li>بعد الموافقة، يمكنك تسجيل الدخول مباشرة</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h3 className="font-bold text-gray-900 mb-4 text-center">مراحل التفعيل</h3>
                        <div className="flex items-center justify-between relative">
                            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-300 -z-10"></div>
                            <div className="absolute top-5 left-0 w-1/3 h-1 bg-[var(--color-vet-secondary)] -z-10"></div>

                            <div className="flex flex-col items-center flex-1">
                                <div className="w-10 h-10 bg-[var(--color-vet-secondary)] rounded-full flex items-center justify-center text-white font-bold mb-2">✓</div>
                                <span className="text-xs text-center font-medium">التسجيل</span>
                            </div>

                            <div className="flex flex-col items-center flex-1">
                                <div className="w-10 h-10 bg-[var(--color-vet-accent)] rounded-full flex items-center justify-center text-white font-bold mb-2 animate-pulse">⏳</div>
                                <span className="text-xs text-center font-medium">المراجعة</span>
                            </div>

                            <div className="flex flex-col items-center flex-1">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold mb-2">3</div>
                                <span className="text-xs text-center font-medium">التفعيل</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="flex-1 bg-gradient-to-r from-[var(--color-vet-primary)] to-[var(--color-vet-primary)] text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <span>العودة للرئيسية</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="flex-1 border-2 border-[var(--color-vet-primary)] text-[var(--color-vet-primary)] py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300"
                        >
                            تسجيل الدخول
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PendingApproval
