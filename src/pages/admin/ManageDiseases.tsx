import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { uploadAPI } from '@/services/api';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, ArrowRight, Image as ImageIcon } from 'lucide-react';

interface Disease {
    _id: string;
    name: string;
    description: string;
    symptoms: string[];
    imageUrl: string;
    isRare: boolean;
}

export default function ManageDiseases() {
    const [diseases, setDiseases] = useState<Disease[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDisease, setEditingDisease] = useState<Disease | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        symptoms: '',
        isRare: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchDiseases();
    }, []);

    const fetchDiseases = async () => {
        try {
            const { data } = await api.get('/diseases');
            setDiseases(data);
        } catch (error) {
            console.error('Failed to fetch diseases:', error);
            toast.error('فشل في تحميل الموسوعة الطبية');
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
            name: formData.name,
            description: formData.description,
            imageUrl: formData.imageUrl,
            symptoms: formData.symptoms.split('\n').filter(t => t.trim() !== ''),
            isRare: formData.isRare
        };

        try {
            if (editingDisease) {
                await api.put(`/diseases/${editingDisease._id}`, payload);
                toast.success('تم التحديث بنجاح');
            } else {
                await api.post('/diseases', payload);
                toast.success('تم الإضافة بنجاح');
            }
            fetchDiseases();
            closeModal();
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('حدث خطأ أثناء حفظ البيانات');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المرض؟ لا يمكن التراجع عن هذا الإجراء.')) return;

        try {
            await api.delete(`/diseases/${id}`);
            toast.success('تم الحذف بنجاح');
            setDiseases(diseases.filter(d => d._id !== id));
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('حدث خطأ أثناء الحذف');
        }
    };

    const openModal = (disease?: Disease) => {
        if (disease) {
            setEditingDisease(disease);
            setFormData({
                name: disease.name,
                description: disease.description,
                imageUrl: disease.imageUrl,
                symptoms: disease.symptoms.join('\n'),
                isRare: disease.isRare
            });
        } else {
            setEditingDisease(null);
            setFormData({ name: '', description: '', imageUrl: '', symptoms: '', isRare: false });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingDisease(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin-dashboard')} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
                            <ArrowRight className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">إدارة الموسوعة الطبية</h1>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" /> إضافة مرض جديد
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* New Card Placeholder */}
                        <div 
                            onClick={() => openModal()}
                            className="group bg-red-50/50 rounded-2xl shadow-sm border-2 border-dashed border-red-200 overflow-hidden hover:bg-red-50 transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] cursor-pointer"
                        >
                            <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                <Plus className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-red-800">إضافة مرض جديد</h3>
                        </div>

                        {diseases.map(disease => (
                            <div key={disease._id} className="group relative bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                                {/* Admin Controls Overlay */}
                                <div className="absolute top-3 left-3 flex gap-2 z-20">
                                    <button onClick={() => openModal(disease)} className="bg-white/90 p-2 text-[var(--color-vet-primary)] rounded-full shadow-lg hover:bg-blue-50 transition-all transform hover:scale-110">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(disease._id)} className="bg-white/90 p-2 text-red-600 rounded-full shadow-lg hover:bg-red-50 transition-all transform hover:scale-110">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="relative h-48 overflow-hidden bg-neutral-100">
                                    <img 
                                        src={disease.imageUrl || 'https://via.placeholder.com/800x600?text=No+Image'} 
                                        alt={disease.name} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    />
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-3 py-1 text-sm font-bold rounded-full shadow-sm ${disease.isRare ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-[var(--color-vet-primary)] border border-blue-200'}`}>
                                            {disease.isRare ? 'مرض نادر' : 'شائع'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="p-5 flex-grow flex flex-col">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{disease.name}</h3>
                                    <p className="text-gray-600 text-sm line-clamp-2 mb-4 leading-relaxed">{disease.description}</p>
                                    
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
                            <h2 className="text-2xl font-bold mb-6">{editingDisease ? 'تعديل المرض' : 'إضافة مرض جديد'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="flex gap-4 items-center">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">اسم المرض</label>
                                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" placeholder="البارفو..." />
                                    </div>
                                    <div className="flex items-center mt-6">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={formData.isRare} onChange={e => setFormData({ ...formData, isRare: e.target.checked })} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                            <span className="mr-3 text-sm font-medium text-gray-700">مرض نادر؟</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">صورة تعبيرية (URL أو رفع)</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" placeholder="https://..." dir="ltr" />
                                        <label className={`cursor-pointer px-4 py-2 border border-gray-200 rounded-xl flex items-center justify-center gap-2 transition-colors ${isUploading ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-50 text-gray-700'}`}>
                                            <ImageIcon className="w-5 h-5" />
                                            <span>{isUploading ? 'جاري الرفع...' : 'رفع صورة'}</span>
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                                        </label>
                                    </div>
                                    {formData.imageUrl && <div className="mt-2 h-32 w-48 rounded-lg overflow-hidden border"><img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" /></div>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">وصف المرض</label>
                                    <textarea required rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" placeholder="وصف كامل للمرض..."></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">الأعراض (عَرَض في كل سطر)</label>
                                    <textarea required rows={4} value={formData.symptoms} onChange={e => setFormData({ ...formData, symptoms: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" placeholder="قيء&#10;إسهال..."></textarea>
                                </div>
                                <div className="flex gap-3 justify-end pt-4 border-t">
                                    <button type="button" onClick={closeModal} className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors">إلغاء</button>
                                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
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
