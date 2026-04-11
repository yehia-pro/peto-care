import { Mail, Phone, MapPin, Send } from 'lucide-react'

const ContactUs = () => {
    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12" dir="rtl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 font-['Cairo']">اتصل بنا</h1>
                    <p className="text-xl text-gray-600 font-['Tajawal']">
                        نحن هنا لسماعك. لا تتردد في التواصل معنا لأي استفسار أو اقتراح.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                            <div className="bg-blue-100 p-3 rounded-xl text-[var(--color-vet-primary)]">
                                <Phone className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1 font-['Cairo']">الهاتف</h3>
                                <p className="text-gray-600 mb-2 font-['Tajawal']">نحن متاحون يومياً من 9 صباحاً حتى 9 مساءً</p>
                                <a href="tel:19999" className="text-[var(--color-vet-primary)] font-bold hover:underline dir-ltr">+20 123 456 7890</a>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                            <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1 font-['Cairo']">البريد الإلكتروني</h3>
                                <p className="text-gray-600 mb-2 font-['Tajawal']">للاستفسارات العامة والدعم الفني</p>
                                <a href="mailto:info@petocare.com" className="text-purple-600 font-bold hover:underline">info@petocare.com</a>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                            <div className="bg-green-100 p-3 rounded-xl text-[var(--color-vet-secondary)]">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1 font-['Cairo']">المقر الرئيسي</h3>
                                <p className="text-gray-600 font-['Tajawal']">
                                    مبنى بيتو، شارع التسعين الشمالي<br />
                                    القاهرة الجديدة، مصر
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg">
                        <h2 className="text-2xl font-bold mb-6 font-['Cairo']">أرسل لنا رسالة</h2>
                        <form className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-['Tajawal']">الاسم الكامل</label>
                                <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-[var(--color-vet-primary)] transition-all font-['Tajawal']" placeholder="ادخل اسمك" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-['Tajawal']">البريد الإلكتروني</label>
                                <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-[var(--color-vet-primary)] transition-all font-['Tajawal']" placeholder="example@mail.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-['Tajawal']">الموضوع</label>
                                <select className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-[var(--color-vet-primary)] transition-all font-['Tajawal']">
                                    <option>استفسار عام</option>
                                    <option>دعم فني</option>
                                    <option>شكوى</option>
                                    <option>اقتراح</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-['Tajawal']">الرسالة</label>
                                <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-[var(--color-vet-primary)] transition-all font-['Tajawal']" placeholder="اطرح استفسارك هنا..."></textarea>
                            </div>
                            <button type="submit" className="w-full bg-[var(--color-vet-primary)] text-white py-3 rounded-xl font-bold hover:bg-[var(--color-vet-primary)] transition-all flex items-center justify-center gap-2 font-['Tajawal']">
                                <Send className="w-5 h-5" />
                                إرسال الرسالة
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ContactUs
