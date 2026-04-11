import { Users, Target, Shield, Award } from 'lucide-react'

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12" dir="rtl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 font-['Cairo']">من نحن</h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto font-['Tajawal']">
                        نحن المنصة الأولى في الشرق الأوسط التي تجمع بين الرعاية البيطرية المتكاملة والتجارة الإلكترونية لتوفير حياة أفضل لحيوانك الأليف.
                    </p>
                </div>

                {/* Mission & Vision */}
                <div className="grid md:grid-cols-2 gap-12 mb-20">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-[var(--color-vet-primary)]">
                            <Target className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4 font-['Cairo']">رؤيتنا</h2>
                        <p className="text-gray-600 leading-relaxed font-['Tajawal']">
                            أن نكون المرجع الأول والوجهة الموثوقة لكل مربي الحيوانات الأليفة، من خلال تقديم خدمات مبتكرة وحلول ذكية تسهل رحلة الرعاية وتقلل من القلق وتضمن صحة وسعادة الحيوانات.
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4 font-['Cairo']">رسالتنا</h2>
                        <p className="text-gray-600 leading-relaxed font-['Tajawal']">
                            تمكين أصحاب الحيوانات الأليفة من الوصول إلى أفضل الأطباء البيطريين والمنتجات الموثوقة بسهولة، مع توفير محتوى تعليمي ودعم فوري لرفع مستوى الوعي والرعاية في مجتمعنا.
                        </p>
                    </div>
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--color-vet-secondary)]">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 font-['Cairo']">مجتمع متكامل</h3>
                        <p className="text-gray-600 font-['Tajawal']">نجمع بين الأطباء وأصحاب المتاجر والمربين في مكان واحد.</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--color-vet-accent)]">
                            <Award className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 font-['Cairo']">جودة موثوقة</h3>
                        <p className="text-gray-600 font-['Tajawal']">جميع الأطباء والمتاجر لدينا تم التحقق من هويتهم وكفاءتهم.</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 font-['Cairo']">أمان وخصوصية</h3>
                        <p className="text-gray-600 font-['Tajawal']">نستخدم أحدث التقنيات لحماية بياناتكم ومعلومات حيواناتكم.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AboutUs
