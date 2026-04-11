import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { uploadAPI } from '@/services/api';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, ArrowRight, Image as ImageIcon } from 'lucide-react';

interface PetGuide {
    _id: string;
    title: string;
    description: string;
    imageUrl: string;
    careTips: string[];
}

export default function ManagePetGuides() {
    const [guides, setGuides] = useState<PetGuide[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGuide, setEditingGuide] = useState<PetGuide | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        careTips: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchGuides();
    }, []);

    const fetchGuides = async () => {
        try {
            const { data } = await api.get('/pet-guides');
            setGuides(data);
        } catch (error) {
            console.error('Failed to fetch pet guides:', error);
            toast.error('فشل في تحميل دليل الحيوانات');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const response = await uploadAPI.uploadImage(file);
            setFormData({ ...formData, imageUrl: response.data.url });
            toast.success('تم رفع الصورة بنجاح');
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('فشل رفع الصورة');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            title: formData.title,
            description: formData.description,
            imageUrl: formData.imageUrl,
            careTips: formData.careTips.split('\n').filter(t => t.trim() !== '')
        };

        try {
            if (editingGuide) {
                await api.put(`/pet-guides/${editingGuide._id}`, payload);
                toast.success('تم التحديث بنجاح');
            } else {
                await api.post('/pet-guides', payload);
                toast.success('تم الإضافة بنجاح');
            }
            fetchGuides();
            closeModal();
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('حدث خطأ أثناء حفظ البيانات');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الحيوان؟ لا يمكن التراجع عن هذا الإجراء.')) return;

        try {
            await api.delete(`/pet-guides/${id}`);
            toast.success('تم الحذف بنجاح');
            setGuides(guides.filter(g => g._id !== id));
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('حدث خطأ أثناء الحذف');
        }
    };

    const openModal = (guide?: PetGuide) => {
        if (guide) {
            setEditingGuide(guide);
            setFormData({
                title: guide.title,
                description: guide.description,
                imageUrl: guide.imageUrl,
                careTips: guide.careTips.join('\n')
            });
        } else {
            setEditingGuide(null);
            setFormData({ title: '', description: '', imageUrl: '', careTips: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingGuide(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin-dashboard')} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
                            <ArrowRight className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">إدارة دليل الحيوانات (لا يوجد حيوان)</h1>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-[var(--color-vet-primary)] hover:bg-[var(--color-vet-primary)] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" /> إضافة حيوان جديد
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-vet-primary)]"></div></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* New Card Placeholder */}
                        <div 
                            onClick={() => openModal()}
                            className="group bg-blue-50/50 rounded-2xl shadow-sm border-2 border-dashed border-blue-200 overflow-hidden hover:bg-blue-50 transition-all duration-300 flex flex-col items-center justify-center min-h-[400px] cursor-pointer"
                        >
                            <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                <Plus className="w-8 h-8 text-[var(--color-vet-primary)]" />
                            </div>
                            <h3 className="text-lg font-semibold text-blue-800">إضافة حيوان جديد</h3>
                        </div>

                        {guides.map(pet => (
                            <div
                                key={pet._id}
                                className="group relative bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                            >
                                {/* Admin Controls Overlay */}
                                <div className="absolute top-3 left-3 flex gap-2 z-20">
                                    <button onClick={() => openModal(pet)} className="bg-white/90 p-2 text-[var(--color-vet-primary)] rounded-full shadow-lg hover:bg-blue-50 transition-all transform hover:scale-110">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(pet._id)} className="bg-white/90 p-2 text-red-600 rounded-full shadow-lg hover:bg-red-50 transition-all transform hover:scale-110">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="relative h-48 overflow-hidden bg-neutral-100">
                                    <img
                                        src={pet.imageUrl || 'https://via.placeholder.com/800x600?text=No+Image'}
                                        alt={pet.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                    <div className="absolute bottom-0 right-0 left-0 p-4 text-white">
                                        <h3 className="text-xl font-bold truncate drop-shadow-md">{pet.title}</h3>
                                        <p className="text-sm text-white/90 font-medium drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                            {pet.title || 'حيوان'}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col flex-grow">
                                    <p className="text-neutral-600 text-sm line-clamp-2 mb-4 leading-relaxed h-10">
                                        {pet.description}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-neutral-100 text-center">
                                         <span className="text-gray-400 text-sm">تمثيل لكيفية ظهور الكرت</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create / Edit Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                            <h2 className="text-2xl font-bold mb-6">{editingGuide ? 'تعديل حيوان' : 'إضافة حيوان جديد'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم الحيوان أو الفصيلة</label>
                                    <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-vet-primary)] outline-none" placeholder="القطط الشيرازي..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">صورة الحيوان (URL أو رفع)</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-vet-primary)] outline-none" placeholder="https://..." dir="ltr" />
                                        <label className={`cursor-pointer px-4 py-2 border border-gray-200 rounded-xl flex items-center justify-center gap-2 transition-colors ${isUploading ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-50 text-gray-700'}`}>
                                            <ImageIcon className="w-5 h-5" />
                                            <span>{isUploading ? 'جاري الرفع...' : 'رفع صورة'}</span>
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                                        </label>
                                    </div>
                                    {formData.imageUrl && <div className="mt-2 h-32 w-48 rounded-lg overflow-hidden border"><img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" /></div>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                                    <textarea required rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-vet-primary)] outline-none" placeholder="نبذة عن الحيوان..."></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">نصائح الرعاية (نصيحة في كل سطر)</label>
                                    <textarea required rows={4} value={formData.careTips} onChange={e => setFormData({ ...formData, careTips: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-vet-primary)] outline-none" placeholder="تنظيف صندوق الرمل يومياً&#10;توفير مقياس حرارة..."></textarea>
                                </div>
                                <div className="flex gap-3 justify-end pt-4 border-t">
                                    <button type="button" onClick={closeModal} className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors">إلغاء</button>
                                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg font-medium bg-[var(--color-vet-primary)] text-white hover:bg-[var(--color-vet-primary)] transition-colors disabled:opacity-50">
                                        {isSubmitting ? 'جاري الحفظ...' : 'حفظ البيانات'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
