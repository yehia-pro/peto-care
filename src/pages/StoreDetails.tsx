import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import { useTranslation } from 'react-i18next';
import { Store, MapPin, Star, Package, ShoppingCart, Heart, ShieldCheck, Clock, Award, ZoomIn, X } from 'lucide-react';
import SafeImage from '@/components/SafeImage';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

type Product = {
  _id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl?: string;
  inStock?: boolean;
  stock?: number;
  salePrice?: number;
  saleExpiresAt?: string | null;
};

type PetStore = {
  id: string;
  storeName: string;
  description?: string;
  brands?: string;
  city?: string;
  address?: string;
  rating?: number;
  products?: Product[];
};

const StoreDetails = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { addItem } = useCartStore();
  const { user, toggleFavorite } = useAuthStore();
  
  const [store, setStore] = useState<PetStore | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/petstores/${id}`);
        const s = res.data?.petStore || {};
        setStore({
          id: s._id || s.id,
          storeName: s.storeName,
          description: s.description,
          brands: s.brands,
          city: s.city,
          address: s.address,
          rating: s.rating,
        products: s.products?.map((p: any) => ({
            ...p,
            _id: p._id || p.id,
            inStock: p.inStock !== false,
            stock: p.stock ?? 0
          })) || []
        });
      } catch {
        setStore(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleToggleFavorite = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error(t('auth.pleaseLogin') || 'الرجاء تسجيل الدخول أولاً');
      return;
    }

    try {
      await toggleFavorite(productId, 'product');
      // Optimistic UI handled by the global store.
    } catch (error) {
      toast.error(t('common.error') || 'خطأ في العملية');
    }
  };

  const handleAddToCart = (product: Product) => {
    if (!store) return;
    if (product.inStock === false) {
      toast.error('عذراً — هذا المنتج نفذ من المخزن حالياً')
      return
    }
    addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1604881982803-67c6799bb161?w=800&q=80',
      storeId: store.id,
      storeName: store.storeName,
      maxStock: product.stock  // 👈 الحد الأقصى من المخزن
    });
    toast.success(t('cart.added') || 'تمت الإضافة للسلة');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center">
        <Store className="w-20 h-20 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700">لم يتم العثور على المتجر</h2>
        <p className="text-gray-500 mt-2">قد يكون الرابط غير صحيح أو تم إغلاق المتجر</p>
        <Link to="/products" className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
          العودة للمتاجر
        </Link>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Premium Hero Section */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-secondary-900 text-white pt-16 pb-24 relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute inset-0 overflow-hidden mix-blend-overlay opacity-20">
          <svg className="absolute left-[10%] top-[20%] w-96 h-96 text-white" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18,97,-2.4C97.1,13.2,91.3,28.8,81.8,41.5C72.3,54.2,59.1,64,45.2,71.6C31.3,79.2,16.7,84.7,2.3,80.7C-12.1,76.6,-26.3,63.1,-40.4,53.4C-54.5,43.7,-68.5,37.8,-76.6,26.9C-84.7,16,-86.9,0.2,-83.4,-13.8C-79.9,-27.8,-70.7,-40,-58.8,-48.3C-46.9,-56.6,-32.3,-61,-19.1,-64.7C-5.9,-68.4,5.9,-71.4,19.2,-74.6C32.5,-77.8,47.3,-81.1,44.7,-76.4Z" transform="translate(100 100) scale(1.1)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-3xl shadow-xl flex items-center justify-center p-4 transform rotate-3 hover:rotate-0 transition-transform duration-500 border-4 border-white/20">
              <Store className="w-20 h-20 text-primary-600" />
            </div>
            
            <div className="flex-1 text-center md:text-right">
              <div className="inline-flex items-center space-x-reverse space-x-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium mb-4 text-primary-100 border border-white/10">
                <ShieldCheck className="w-4 h-4" />
                <span>متجر موثوق ومعتمد</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-md">
                {store.storeName}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-primary-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-secondary-400" />
                  <span className="text-lg">{store.city}{store.address ? `، ${store.address}` : ''}</span>
                </div>
                {store.rating !== undefined && (
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-lg">{store.rating}</span>
                  </div>
                )}
                {store.products && store.products.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-secondary-400" />
                    <span className="font-medium">{store.products.length} منتج</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area: Products */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Package className="w-6 h-6 text-primary-600" />
                  منتجات المتجر
                </h2>
                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                  {store.products?.length || 0} متوفر
                </div>
              </div>

              {!store.products || store.products.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-600">لا توجد منتجات حتى الآن</h3>
                  <p className="text-gray-500 mt-2">يقوم المتجر بتحديث قائمة منتجاته، يرجى العودة لاحقاً.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {store.products.map(product => {
                    const isFavorite = user?.favorites?.some(f => f.itemId === product._id && f.itemType === 'product');
                    
                    return (
                      <div key={product._id} className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col relative">
                        <button
                          onClick={(e) => handleToggleFavorite(product._id, e)}
                          className="absolute top-3 left-3 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                        >
                          <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                        </button>
                        
                        <div
                          className="relative h-48 overflow-hidden bg-gray-100 cursor-pointer group/img"
                          onClick={() => setPreviewImage({ src: product.imageUrl || '', name: product.name })}
                          title="اضغط لعرض الصورة كاملة"
                        >
                          <SafeImage
                            src={product.imageUrl || ''}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* Zoom overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/25 transition-all duration-300 flex items-center justify-center">
                            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                          </div>
                          {/* Out of stock overlay */}
                          {product.inStock === false && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-none">
                              <img src="/images/out-of-stock.png" alt="نفذ المنتج" className="w-full h-full object-contain p-2" />
                            </div>
                          )}
                          <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary-700 shadow-sm">
                            {product.category || 'عام'}
                          </span>
                          {product.salePrice && (!product.saleExpiresAt || new Date(product.saleExpiresAt) > new Date()) && (
                            <span className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md animate-pulse">
                              خصم خاص!
                            </span>
                          )}
                        </div>
                        
                        <div className="p-5 flex flex-col flex-grow">
                          <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">{product.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">{product.description}</p>
                          
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex flex-col">
                              {product.salePrice && (!product.saleExpiresAt || new Date(product.saleExpiresAt) > new Date()) ? (
                                <>
                                  <span className="text-xl font-extrabold text-red-600">
                                    {formatCurrency(product.salePrice)}
                                  </span>
                                  <span className="text-sm text-gray-400 line-through">
                                    {formatCurrency(product.price)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xl font-extrabold text-secondary-600">
                                  {formatCurrency(product.price)}
                                </span>
                              )}
                            </div>
                            {product.inStock === false ? (
                              <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-2 rounded-lg">
                                ❌ نفذ المخزن
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleAddToCart(product)}
                                className="bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white p-2.5 rounded-lg transition-colors group-hover:shadow-md"
                                title="إضافة للسلة"
                              >
                                <ShoppingCart className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Store Info Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 xl:p-8">
              <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
                <Store className="w-5 h-5 text-primary-500" />
                عن المتجر
              </h3>
              
              <p className="text-gray-600 leading-relaxed whitespace-pre-line mb-8">
                {store.description || 'لم يتم إضافة وصف لهذا المتجر بعد.'}
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Award className="w-6 h-6 text-secondary-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">العلامات التجارية والموديلات</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {store.brands || 'تتوفر مجموعة متنوعة من أفضل الماركات العالمية والمحلية.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Clock className="w-6 h-6 text-primary-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">سرعة التجهيز للتوصيل</h4>
                    <p className="text-sm text-gray-600">هذا المتجر يوفر تجهيز سريع للطلبات وتسليمها لمندوبي التوصيل بشكل عاجل.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition z-10"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
            <SafeImage
              src={previewImage?.src || ''}
              alt={previewImage?.name || ''}
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
            <p className="text-center text-white mt-3 font-bold text-lg">{previewImage?.name}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default StoreDetails;

