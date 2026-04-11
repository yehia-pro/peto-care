import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { favoritesAPI } from '@/services/api';
import { toast } from 'sonner';
import { Heart, ShoppingCart, Store, Package, User, X, ZoomIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import SafeImage from '@/components/SafeImage';

const Favorites = () => {
  const { t, i18n } = useTranslation();
  const { user, toggleFavorite } = useAuthStore();
  const { addItem } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<{ src: string; name: string } | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setFavoriteProducts([]);
      return;
    }

    const hasFavorites = user.favorites && user.favorites.length > 0;
    if (!hasFavorites) {
      setLoading(false);
      setFavoriteProducts([]);
      return;
    }

    setLoading(true);
    favoritesAPI.getFavoritesDetails()
      .then(res => {
        setFavoriteProducts(res.data.products || []);
      })
      .catch(e => {
        console.error('Failed to fetch favorites', e);
        toast.error(t('common.error') || 'حدث خطأ في تحميل المفضلة');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.favorites?.length]);

  const handleToggleFavorite = async (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleFavorite(product.id, 'product');
      toast.success(t('favorites.removed') || 'تم الإزالة من المفضلة');
      setFavoriteProducts(prev => prev.filter(p => p.id !== product.id));
    } catch (error) {
      toast.error(t('common.error') || 'حدث خطأ');
    }
  };

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.priceEGP,
      imageUrl: product.imageUrl,
      storeId: product.storeId,
      storeName: product.storeName
    });
    toast.success(t('cart.added') || 'تم الإضافة للسلة');
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center bg-white p-10 rounded-2xl shadow-lg">
          <User className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">يجب تسجيل الدخول أولاً</h3>
          <Link to="/login" className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-bold hover:opacity-90 transition">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
              {t('favorites.title')}
            </h1>
            <p className="text-xl text-neutral-700">{t('favorites.subtitle')}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : favoriteProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">{t('favorites.empty')}</h3>
              <p className="text-gray-500 mb-6">{t('favorites.emptyDesc')}</p>
              <Link
                to="/products"
                className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-bold hover:opacity-90 transition"
              >
                {t('products.title')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteProducts.map((p) => {
                const isInStock = p.inStock !== false;
                return (
                  <div key={p.id} className={`bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col relative group/card ${!isInStock ? 'opacity-80' : ''}`}>

                    {/* Remove from favorites button */}
                    <button
                      onClick={(e) => handleToggleFavorite(p, e)}
                      className="absolute top-4 left-4 z-20 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white hover:scale-110 transition-all border border-red-100"
                      title="إزالة من المفضلة"
                    >
                      <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                    </button>

                    {/* Product Image */}
                    {p.imageUrl ? (
                      <div
                        className={`relative overflow-hidden group/img ${isInStock ? 'cursor-pointer' : ''}`}
                        onClick={() => isInStock && setPreviewImage({ src: p.imageUrl, name: p.name })}
                        title={isInStock ? 'اضغط لعرض الصورة كاملة' : undefined}
                      >
                        <SafeImage
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-52 object-cover transition-transform duration-300 group-hover/img:scale-105"
                        />
                        {/* Out of stock overlay */}
                        {!isInStock && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-none">
                            <img
                              src="/images/out-of-stock.png"
                              alt="نفذ المنتج"
                              className="w-full h-full object-contain p-2 drop-shadow-xl mix-blend-darken filter contrast-105"
                            />
                          </div>
                        )}
                        {/* Zoom hint */}
                        {isInStock && (
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-all duration-300 flex items-center justify-center">
                            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                      </div>
                    ) : (
                      <div className="w-full h-52 bg-neutral-100 flex items-center justify-center relative">
                        <Package className="w-12 h-12 text-neutral-300" />
                        {!isInStock && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-none">
                            <img
                              src="/images/out-of-stock.png"
                              alt="نفذ المنتج"
                              className="w-full h-full object-contain p-2 drop-shadow-xl mix-blend-darken filter contrast-105"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Info header */}
                    <div className="bg-gradient-to-r from-primary-100 to-secondary-100 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary-600 shrink-0" />
                        <div>
                          <h3 className="font-bold text-neutral-900">{p.name}</h3>
                          {p.storeName && (
                            <div className="flex items-center text-xs text-neutral-600 mt-1">
                              <Store className="w-3 h-3 mr-1 shrink-0" />
                              <span>{p.storeName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs bg-white px-2 py-1 rounded-full text-neutral-600 font-medium whitespace-nowrap ml-2">
                        {p.category}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="p-6 flex flex-col flex-grow">
                      <p className="text-gray-700 text-sm flex-grow line-clamp-3 mb-4">{p.description}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="text-2xl font-bold text-[var(--color-vet-secondary)]">
                          {formatCurrency(p.priceEGP, 'EGP')}
                        </div>
                        {isInStock ? (
                          <button
                            onClick={() => handleAddToCart(p)}
                            className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-xl hover:opacity-90 transition transform hover:scale-105 shadow-lg flex items-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4 shrink-0" />
                            <span className="whitespace-nowrap text-sm">{t('cart.addToCart')}</span>
                          </button>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 px-3 py-2 rounded-xl font-bold">نفذ من المخزون</span>
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

      {/* Fullscreen Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>
            <SafeImage
              src={previewImage!.src}
              alt={previewImage!.name}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
            <div className="mt-4 text-white text-center">
              <p className="text-lg font-semibold drop-shadow-lg">{previewImage!.name}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Favorites;
