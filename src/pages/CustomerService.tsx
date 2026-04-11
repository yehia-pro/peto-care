import { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp, Phone, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { UnifiedSupport } from '../components/UnifiedSupport'

const CustomerService = () => {
  const { t } = useTranslation()
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)

  const faqs = [
    {
      id: '1',
      question: 'كيف أحجز موعد؟',
      answer: 'يمكنك حجز موعد من خلال صفحة "المواعيد". اختر الطبيب، ثم التاريخ والوقت المناسبين. ستصلك رسالة تأكيد على بريدك الإلكتروني وهاتفك.'
    },
    {
      id: '2',
      question: 'ما هي طرق الدفع المتاحة؟',
      answer: 'نقبل البطاقات الائتمانية (Visa, MasterCard)، مدى، والدفع عند الوصول في بعض العيادات المعتمدة.'
    },
    {
      id: '3',
      question: 'نسيت كلمة المرور، ماذا أفعل؟',
      answer: 'يمكنك استعادة كلمة المرور من صفحة تسجيل الدخول بالضغط على "نسيت كلمة المرور". سيتم إرسال رابط إعادة التعيين إلى بريدك المسجل.'
    },
    {
      id: '4',
      question: 'كيف يمكنني إلغاء الموعد؟',
      answer: 'يمكنك إلغاء الموعد من صفحة "مواعيدي" قبل 24 ساعة من الموعد المحدد دون أي رسوم إضافية.'
    },
    {
      id: '5',
      question: 'ما هي ساعات العمل؟',
      answer: 'خدماتنا الإلكترونية متاحة 24/7. ساعات عمل العيادات والمتاجر تختلف حسب كل مقدم خدمة، ويمكنك رؤية الأوقات المتاحة في صفحتهم.'
    },
    {
      id: '6',
      question: 'كيف يمكنني التواصل مع خدمة العملاء؟',
      answer: 'يمكنك الاتصال بنا على الرقم الموحد 920033333 أو استخدام نموذج الدعم الفني الموجود أسفل يمين الشاشة.'
    }
  ]

  const toggleQuestion = (id: string) => {
    setOpenQuestion(openQuestion === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="bg-primary-100 text-primary-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4 font-['Cairo']">مركز المساعدة والأسئلة الشائعة</h1>
          <p className="text-gray-600 font-['Tajawal']">
            اعثر على إجابات سريعة لأهم تساؤلاتك حول خدمات بيتو كير
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
            >
              <button
                onClick={() => toggleQuestion(faq.id)}
                className="w-full flex items-center justify-between p-6 text-right focus:outline-none"
              >
                <span className="font-bold text-gray-800 font-['Cairo']">{faq.question}</span>
                {openQuestion === faq.id ? (
                  <ChevronUp className="w-5 h-5 text-primary-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${openQuestion === faq.id ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                  }`}
              >
                <div className="px-6 pb-6 pt-0 text-gray-600 text-sm leading-relaxed font-['Tajawal'] border-t border-gray-50 mt-2">
                  <div className="pt-4">{faq.answer}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-4 font-['Cairo']">لم تجد إجابة لسؤالك؟</h3>
          <p className="text-gray-600 mb-8 font-['Tajawal']">
            فريق الدعم الفني لدينا جاهز لمساعدتك على مدار الساعة
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:920033333"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors font-bold"
            >
              <Phone className="w-5 h-5" />
              <span>920033333</span>
            </a>
            <button
              onClick={() => (document.querySelector('button[title="الدعم الفني"]') as HTMLElement)?.click()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors font-bold shadow-lg shadow-primary-500/30"
            >
              <MessageCircle className="w-5 h-5" />
              <span>تواصل معنا الآن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerService