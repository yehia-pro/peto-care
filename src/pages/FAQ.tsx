import { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

const FAQ = () => {
    const faqs = [
        {
            q: "كيف يمكنني حجز موعد مع طبيب بيطري؟",
            a: "يمكنك حجز موعد بسهولة عن طريق الدخول إلى قسم 'الأطباء البيطريين'، اختيار الطبيب المناسب، ثم الضغط على 'حجز موعد' واختيار الوقت المتاح."
        },
        {
            q: "هل الخدمة متوفرة 24 ساعة؟",
            a: "نعم، لدينا قسم للطوارئ يعمل على مدار 24 ساعة لربطك بأقرب عيادة بيطرية مناوبة أو توفير استشارة عاجلة."
        },
        {
            q: "كيف يمكنني الدفع؟",
            a: "نقبل الدفع عبر بطاقات الائتمان (فيزا/ماستركارد) بالإضافة إلى خيار الدفع عند الاستلام لبعض الخدمات والمنتجات."
        },
        {
            q: "هل يمكنني إلغاء الموعد؟",
            a: "نعم، يمكنك إلغاء الموعد قبل 24 ساعة من موعده مجاناً. الإلغاء المتأخر قد يترتب عليه رسوم بسيطة."
        },
        {
            q: "هل المنتجات في المتجر أصلية؟",
            a: "نعم، نضمن أن جميع المنتجات المعروضة في متجرنا وعبر شركائنا أصلية 100% ومخزنة وفق أعلى معايير الجودة."
        }
    ]

    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12" dir="rtl">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 font-['Cairo']">الأسئلة الشائعة</h1>
                    <p className="text-xl text-gray-600 font-['Tajawal']">
                        إجابات على أكثر الأسئلة تكراراً من عملائنا
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-right hover:bg-gray-50 transition-colors"
                            >
                                <span className={`font-bold text-lg font-['Tajawal'] ${openIndex === index ? 'text-[var(--color-vet-primary)]' : 'text-gray-800'}`}>
                                    {faq.q}
                                </span>
                                {openIndex === index ? (
                                    <ChevronUp className="w-5 h-5 text-[var(--color-vet-primary)]" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                            </button>
                            <div
                                className={`transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <div className="p-6 pt-0 text-gray-600 font-['Tajawal'] border-t border-gray-50">
                                    {faq.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center bg-blue-50 rounded-2xl p-8">
                    <HelpCircle className="w-12 h-12 text-[var(--color-vet-primary)] mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2 font-['Cairo']">لم تجد إجابة لسؤالك؟</h3>
                    <p className="text-gray-600 mb-6 font-['Tajawal']">فريق الدعم لدينا جاهز لمساعدتك في أي وقت</p>
                    <a href="/contact" className="inline-block bg-[var(--color-vet-primary)] text-white px-8 py-3 rounded-xl font-bold hover:bg-[var(--color-vet-primary)] transition-colors">
                        تواصل معنا
                    </a>
                </div>
            </div>
        </div>
    )
}

export default FAQ
