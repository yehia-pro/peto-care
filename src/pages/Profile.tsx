import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogOut, User as UserIcon, Save, Pencil, Stethoscope, FileText, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { authAPI, uploadAPI } from '@/services/api';
import { getImageUrl } from '@/utils/imageHelper';
import { API_BASE_URL } from '@/services/api';

interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  avatarUrl: string;
  // Vet specific
  specialization?: string;
  experienceYears?: string | number;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  qualification?: string;
  consultationFee?: string | number;
  // PetStore specific
  storeName?: string;
  description?: string;
  address?: string;
  city?: string;
  brands?: string;
  phoneNumbers?: { number: string; label: string }[];
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'appointments' | 'records'>('profile');

  // Data states
  const [appointments, setAppointments] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);

  const [form, setForm] = useState<UserProfile>({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    avatarUrl: '',
    specialization: '',
    experienceYears: '',
    clinicName: '',
    clinicAddress: '',
    clinicPhone: '',
    qualification: '',
    consultationFee: '',
    storeName: '',
    description: '',
    address: '',
    city: '',
    brands: '',
    phoneNumbers: []
  });

  useEffect(() => {
    if (user) {
      let contact: any = {};
      try { contact = user.contact ? JSON.parse(user.contact) : {}; } catch (e) { console.warn('JSON parse error', e) }

      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        birthDate: user.birthDate || '',
        avatarUrl: user.avatarUrl || '',
        specialization: contact.specialization || '',
        experienceYears: contact.experienceYears || '',
        clinicName: user.clinicName || '',
        clinicAddress: contact.clinicAddress || '',
        clinicPhone: user.clinicPhone || '',
        qualification: contact.qualification || '',
        consultationFee: contact.consultationFee || '',
        storeName: user.storeName || '',
        description: user.description || '',
        address: user.address || '',
        city: user.city || '',
        brands: user.brands || '',
        phoneNumbers: contact.phoneNumbers || []
      });

      if (user.role === 'user') {
        fetchCustomerData();
      }
    }
  }, [user]);

  const fetchCustomerData = async () => {
    try {
      // Fetch appointments and records for customer
      // This assumes endpoints exist
      const [aptRes, recRes] = await Promise.all([
        fetch(API_BASE_URL + '/appointments/my-appointments', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch(API_BASE_URL + '/records', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);

      if (aptRes.ok) {
        const data = await aptRes.json();
        setAppointments(data.appointments || []);
      }
      if (recRes.ok) {
        const data = await recRes.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'phone') value = value.replace(/\D/g, '').slice(0, 11);
    setForm({ ...form, [name]: value });
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);

      // Basic fields for everyone
      const payload: any = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        birthDate: form.birthDate,
        avatarUrl: form.avatarUrl,
      };

      // Add role-specific fields only if they have values
      if (user?.role === 'vet') {
        if (form.specialization) payload.specialization = form.specialization;
        if (form.experienceYears) payload.experienceYears = Number(form.experienceYears);
        if (form.clinicAddress) payload.clinicAddress = form.clinicAddress;
        if (form.consultationFee) payload.consultationFee = Number(form.consultationFee);
        if (form.phoneNumbers) payload.phoneNumbers = form.phoneNumbers;
      } else if (user?.role === 'petstore') {
        if (form.storeName) payload.storeName = form.storeName;
        if (form.description) payload.description = form.description;
        if (form.address) payload.address = form.address;
        if (form.city) payload.city = form.city;
      }

      const response = await authAPI.updateProfile(payload);
      if (user) {
        setUser({ ...user, ...response.data });
      }
      toast.success('تم تحديث الملف الشخصي بنجاح');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      let errorMsg = 'فشل تحديث الملف الشخصي';

      if (error.response?.data?.details) {
        const details = error.response.data.details;
        const fieldErrors = details.fieldErrors || {};
        const firstField = Object.keys(fieldErrors)[0];
        if (firstField) {
          errorMsg = `خطأ في ${firstField}: ${fieldErrors[firstField][0]}`;
        }
      } else {
        errorMsg = error.response?.data?.message || error.response?.data?.error || errorMsg;
      }

      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const response = await uploadAPI.uploadImage(file);
      const data = response.data;
      setForm(prev => ({ ...prev, avatarUrl: data.url }));
      toast.success('تم رفع الصورة بنجاح');
    } catch (error) {
      toast.error('فشل رفع الصورة');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">يجب تسجيل الدخول أولاً</h2>
          <button onClick={() => navigate('/login')} className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg">
            الذهاب إلى صفحة تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  // Admin view (can also view profile)
  // We'll use the common layout for all roles now.

  // Vet & Customer View
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">الملف الشخصي</h2>
        <div className="flex gap-3 mt-4 md:mt-0">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <Pencil size={16} className="ml-2" />
              تعديل الملف
            </button>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50"
          >
            <LogOut size={16} className="ml-2" />
            خروج
          </button>
        </div>
      </div>

      {/* Tabs for Customer only */}
      {user.role === 'user' && (
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8 space-x-reverse" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              البيانات الشخصية
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'appointments'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              مواعيدي
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'records'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              سجلاتي
            </button>
          </nav>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden p-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <img
                  src={getImageUrl(form.avatarUrl, '/default-avatar.png')}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full cursor-pointer hover:bg-primary-600 transition-colors">
                    <Pencil size={16} />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                  </label>
                )}
              </div>
              <h2 className="text-2xl font-bold mt-4">{form.fullName}</h2>
              <p className="text-gray-500">
                {user.role === 'vet' ? 'طبيب بيطري' :
                  user.role === 'petstore' ? 'صاحب متجر' :
                    user.role === 'admin' ? 'مدير النظام' : 'عميل'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded-md disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded-md disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  name="phone"
                  maxLength={11}
                  value={form.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded-md disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الميلاد</label>
                <input
                  type="date"
                  name="birthDate"
                  value={form.birthDate}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded-md disabled:bg-gray-100"
                />
              </div>

              {user.role === 'vet' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التخصص</label>
                    <input
                      type="text"
                      name="specialization"
                      value={form.specialization}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full p-2 border rounded-md disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">سنوات الخبرة</label>
                    <input
                      type="number"
                      name="experienceYears"
                      value={form.experienceYears}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full p-2 border rounded-md disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                    <input
                      type="text"
                      name="clinicAddress"
                      value={form.clinicAddress}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full p-2 border rounded-md disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">سعر الكشف</label>
                    <input
                      type="number"
                      name="consultationFee"
                      value={form.consultationFee}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full p-2 border rounded-md disabled:bg-gray-100"
                    />
                  </div>
                  
                  <div className="md:col-span-2 pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">أرقام التواصل الإضافية (العيادة، الطوارئ، الخ)</label>
                    <div className="space-y-3">
                      {form.phoneNumbers?.map((phone, index) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="tel"
                            placeholder="رقم الهاتف"
                            maxLength={11}
                            value={phone.number}
                            onChange={(e) => {
                              const newPhones = [...(form.phoneNumbers || [])]
                              newPhones[index].number = e.target.value.replace(/\D/g, '').slice(0, 11)
                              setForm({ ...form, phoneNumbers: newPhones })
                            }}
                            disabled={!isEditing}
                            className="flex-1 p-2 border rounded-md disabled:bg-gray-100"
                          />
                          <input
                            type="text"
                            placeholder="ملاحظة (مثال: رقم العيادة)"
                            value={phone.label}
                            onChange={(e) => {
                              const newPhones = [...(form.phoneNumbers || [])]
                              newPhones[index].label = e.target.value
                              setForm({ ...form, phoneNumbers: newPhones })
                            }}
                            disabled={!isEditing}
                            className="w-full sm:w-1/3 p-2 border rounded-md disabled:bg-gray-100"
                          />
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                const newPhones = form.phoneNumbers?.filter((_, i) => i !== index)
                                setForm({ ...form, phoneNumbers: newPhones })
                              }}
                              className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm font-medium"
                            >
                              حذف
                            </button>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            const newPhones = [...(form.phoneNumbers || []), { number: '', label: 'رقم إضافي' }]
                            setForm({ ...form, phoneNumbers: newPhones })
                          }}
                          className="w-full py-2 bg-gray-50 text-primary-600 border border-dashed border-gray-300 rounded-md hover:bg-primary-50 hover:border-primary-300 transition-colors text-sm font-medium"
                        >
                          + إضافة رقم
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {user.role === 'petstore' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المتجر</label>
                    <input
                      type="text"
                      name="storeName"
                      value={form.storeName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full p-2 border rounded-md disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full p-2 border rounded-md disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full p-2 border rounded-md disabled:bg-gray-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">وصف المتجر</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={(e: any) => setForm({ ...form, description: e.target.value })}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full p-2 border rounded-md disabled:bg-gray-100"
                    />
                  </div>
                </>
              )}
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
                >
                  {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'appointments' && user.role === 'user' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">مواعيدي</h3>
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا توجد مواعيد محجوزة</p>
            ) : (
              appointments.map((apt: any) => (
                <div key={apt._id} className="border p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-bold">{apt.vetName}</p>
                    <p className="text-sm text-gray-500">{format(new Date(apt.scheduledAt), 'PPpp', { locale: ar })}</p>
                    <p className="text-sm">{apt.reason}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    {apt.status === 'confirmed' ? 'مؤكد' : apt.status === 'cancelled' ? 'ملغي' : 'قيد الانتظار'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'records' && user.role === 'user' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">سجلاتي الطبية</h3>
            {records.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا توجد سجلات طبية</p>
            ) : (
              records.map((rec: any) => (
                <div key={rec._id} className="border p-4 rounded-lg">
                  <p className="font-bold">{rec.petName} ({rec.petType})</p>
                  <p className="text-sm text-gray-600 mt-1">{rec.summary}</p>
                  <p className="text-xs text-gray-400 mt-2">{format(new Date(rec.createdAt), 'PP', { locale: ar })}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
