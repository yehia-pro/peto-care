import { FileText } from 'lucide-react'

const Terms = () => {
    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12" dir="rtl">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-8 border-b pb-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-[var(--color-vet-primary)]">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 font-['Cairo']">الشروط والأحكام</h1>
                    </div>

                    <div className="space-y-8 font-['Tajawal'] text-gray-600 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">1. مقدمة</h2>
                            <p>
                                مرحباً بكم في منصة بيتو كير. باستعمالك لهذا الموقع، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، فلا يحق لك استخدام الموقع.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">2. الحسابات والتسجيل</h2>
                            <ul className="list-disc pr-5 space-y-2">
                                <li>يجب عليك تقديم معلومات دقيقة وكاملة عند إنشاء حساب.</li>
                                <li>أنت مسؤول عن الحفاظ على سرية كلمة المرور الخاصة بك.</li>
                                <li>يجب إبلاغنا فوراً عن أي استخدام غير مصرح به لحسابك.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">3. الخدمات الطبية</h2>
                            <p>
                                المنصة تعمل كوسيط لربطك بالأطباء البيطريين. الاستشارات الطبية المقدمة عبر المنصة هي مسؤولية الطبيب المعالج، ولا تتحمل المنصة مسؤولية الأخطاء الطبية المباشرة، ولكننا نلتزم بالتحقق من هوية وكفاءة الأطباء المسجلين لدينا.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">4. المتجر والمشتريات</h2>
                            <p>
                                جميع المنتجات المعروضة خاضعة للتوفر. نحتفظ بالحق في تعديل الأسعار في أي وقت. سياسة الاسترجاع تخضع للشروط الموضحة في صفحة كل منتج أو متجر.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">5. حقوق الملكية الفكرية</h2>
                            <p>
                                جميع المحتويات والعلامات التجارية الموجودة على الموقع هي ملك لمنصة بيتو كير ومحمية بموجب حقوق النشر.
                            </p>
                        </section>

                        <div className="bg-gray-50 p-4 rounded-xl text-sm border border-gray-200 mt-8">
                            آخر تحديث: 20 ديسمبر 2025
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Terms
