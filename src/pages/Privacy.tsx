import { Lock } from 'lucide-react'

const Privacy = () => {
    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12" dir="rtl">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-8 border-b pb-6">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-[var(--color-vet-secondary)]">
                            <Lock className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 font-['Cairo']">سياسة الخصوصية</h1>
                    </div>

                    <div className="space-y-8 font-['Tajawal'] text-gray-600 leading-relaxed">
                        <section>
                            <p className="text-lg">
                                نحن في بيتو كير نولي أهمية قصوى لخصوصية بياناتك. توضح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك الشخصية.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">1. المعلومات التي نجمعها</h2>
                            <p className="mb-2">قد نجمع المعلومات التالية:</p>
                            <ul className="list-disc pr-5 space-y-2">
                                <li>البيانات الشخصية (الاسم، البريد الإلكتروني، رقم الهاتف).</li>
                                <li>بيانات الحيوانات الأليفة (النوع، العمر، التاريخ الطبي).</li>
                                <li>بيانات الموقع الجغرافي (لتوصيل الطلبات وتحديد أقرب عيادة).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">2. كيف نستخدم معلوماتك</h2>
                            <p>
                                نستخدم المعلومات لتقديم خدماتنا، بما في ذلك: إدارة المواعيد، معالجة الطلبات، تحسين تجربة المستخدم، وإرسال إشعارات هامة.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">3. مشاركة المعلومات</h2>
                            <p>
                                لا نقوم ببيع بياناتك لأطراف ثالثة. قد نشارك بياناتك فقط مع مقدمي الخدمات (مثل الأطباء أو شركات الشحن) بالقدر اللازم لتقديم الخدمة المطلوبة.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">4. أمن البيانات</h2>
                            <p>
                                نطبق إجراءات أمان تقنية وإدارية صارمة لحماية بياناتك من الوصول غير المصرح به أو التغيير أو الإفشاء.
                            </p>
                        </section>

                        <div className="bg-green-50 p-4 rounded-xl text-sm border border-green-200 mt-8">
                            لأي استفسارات حول الخصوصية، يرجى التواصل معنا على privacy@petocare.com
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Privacy
