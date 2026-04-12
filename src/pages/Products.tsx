import React, { useMemo, useState, useEffect } from 'react';
import { ShoppingCart, Package, Heart, BadgeCheck, Filter, Search, Store, X, ZoomIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { toast } from 'sonner';
import SafeImage from '@/components/SafeImage';

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  priceEGP: number;
  accessories: string[];
  essentials: string[];
  imageUrl?: string;
  imageAlt?: string;
  storeId?: string;
  storeName?: string;
  inStock?: boolean;
  stock?: number;  // كمية المخزن
  salePrice?: number;
  saleExpiresAt?: string | null;
  price?: number;
};

const Products = () => {
  const { t, i18n } = useTranslation();
  const { addItem } = useCartStore();
  const { user, toggleFavorite } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(t('products.categories.all'));
  const [previewImage, setPreviewImage] = useState<{ src: string; name: string } | null>(null);
  const [rates, setRates] = useState<Record<string, number>>({ EGP: 1, USD: 0, EUR: 0, SAR: 0, AED: 0, GBP: 0 });
  const supported = ['EGP', 'USD', 'EUR', 'SAR', 'AED', 'GBP'] as const;

  // Fetch products from registered stores
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const storesRes = await api.get('/petstores', { params: { verified: true, isActive: true } });
        const stores = storesRes.data.petStores || [];

        const productsList: Product[] = [];

        stores.forEach((store: any) => {
          if (store.products && Array.isArray(store.products)) {
            store.products.forEach((p: any) => {
              productsList.push({
                id: p._id || p.id,
                name: p.name,
                category: p.category || t('products.categories.food'),
                description: p.description || '',
                priceEGP: p.price || 0,
                accessories: [],
                essentials: [],
                storeId: store._id || store.id,
                storeName: store.storeName,
                imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1604881982803-67c6799bb161?w=800&h=600&fit=crop&q=80',
                inStock: p.inStock !== false,
                stock: typeof p.stock === 'number' ? p.stock : undefined
              });
            });
          }
        });

        setProducts(productsList);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [t]);

  // Fetch exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://api.exchangerate.host/latest?base=EGP&symbols=USD,EUR,SAR,AED,GBP');
        const data = await res.json();
        if (data && data.rates) {
          setRates({ EGP: 1, USD: data.rates.USD || 0, EUR: data.rates.EUR || 0, SAR: data.rates.SAR || 0, AED: data.rates.AED || 0, GBP: data.rates.GBP || 0 });
        }
      } catch (e) { console.error(e) }
    };
    fetchRates();
    const timer = setInterval(fetchRates, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const filtered = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter(p => {
      const okCategory = category === t('products.categories.all') ? true : p.category === category;
      const okSearch = query ? (p.name + p.description).toLowerCase().includes(query.toLowerCase()) : true;
      return okCategory && okSearch;
    });
  }, [query, category, products, t]);

  const handleAddToCart = (product: Product) => {
    if (product.inStock === false) {
      toast.error('عذراً — هذا المنتج نفذ من المخزن حالياً');
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.priceEGP,
      imageUrl: product.imageUrl,
      storeId: product.storeId,
      storeName: product.storeName,
      maxStock: product.stock  // 👈 نمرر الحد الأقصى للسلة
    });
    toast.success(t('cart.added'));
  };

  const checkIsFavorited = (productId: string) => {
    return user?.favorites?.some(f => f.itemId === productId && f.itemType === 'product');
  };

  const handleToggleFavorite = async (product: Product) => {
    if (!user) {
      toast.error(t('auth.loginRequired') || 'يجب تسجيل الدخول أولاً');
      return;
    }
    try {
      await toggleFavorite(product.id, 'product');
      toast.success(
        checkIsFavorited(product.id)
          ? (t('favorites.removed') || 'تم الإزالة من المفضلة')
          : (t('favorites.added') || 'تمت الإضافة للمفضلة')
      );
    } catch (e) {
      toast.error(t('common.error') || 'حدث خطأ');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
          <p className="text-neutral-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent mb-4">
            {t('products.title')}
          </h1>
          <p className="text-xl text-neutral-700">{t('products.subtitle')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center border rounded-md px-3 py-2">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                className="flex-1 outline-none"
                placeholder={t('products.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center border rounded-md px-3 py-2">
              <Filter className="w-4 h-4 text-gray-400 mr-2" />
              <select
                className="flex-1 outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>{t('products.categories.all')}</option>
                <option>{t('products.categories.food')}</option>
                <option>{t('products.categories.medicine')}</option>
                <option>{t('products.categories.hygiene')}</option>
                <option>{t('products.categories.accessories')}</option>
              </select>
            </div>
            <div className="hidden md:flex items-center justify-end text-sm text-gray-600">
              <Heart className="w-4 h-4 text-[var(--color-vet-secondary)] mr-1" />
              <span>{t('home.premiumCare') || 'رعاية بيطرية متميزة'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => {
            const isFav = checkIsFavorited(p.id);
            const isInStock = p.inStock !== false;
            return (
              <div key={p.id} className={`bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col relative group/card ${!isInStock ? 'opacity-80' : ''}`}>
                
                {/* Favorite Button Overlay */}
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFavorite(p); }}
                  className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white hover:scale-110 transition-all border border-gray-100"
                  aria-label="المفضلة"
                >
                  <Heart className={`w-5 h-5 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                </button>

                {p.imageUrl ? (
                <div
                  className="relative cursor-pointer overflow-hidden group/img"
                  onClick={() => setPreviewImage({ src: p.imageUrl!, name: p.name })}
                  title="اضغط لعرض الصورة كاملة"
                >
                  <SafeImage
                    src={p.imageUrl}
                    alt={p.imageAlt || p.name}
                    className="w-full h-52 object-cover transition-transform duration-300 group-hover/img:scale-105"
                    style={{ filter: 'saturate(1.12) brightness(1.05) contrast(1.08)' } as React.CSSProperties}
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
                  {/* Zoom hint overlay — only when in stock */}
                  {isInStock && (
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                    </div>
                  )}
                  {/* Sale badge overlay */}
                  {p.salePrice && (!p.saleExpiresAt || new Date(p.saleExpiresAt) > new Date()) && (
                    <span className="absolute top-4 right-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md animate-pulse">
                      خصم خاص!
                    </span>
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
              <div className="bg-gradient-to-r from-primary-100 to-secondary-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-primary-600" />
                  <div>
                    <h3 className="font-bold text-neutral-900">{p.name}</h3>
                    {p.storeName && (
                      <div className="flex items-center text-xs text-neutral-600 mt-1">
                        <Store className="w-3 h-3 mr-1" />
                        <span>{p.storeName}</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs bg-white px-2 py-1 rounded-full text-neutral-600 font-medium">
                  {p.category}
                </span>
              </div>
              <div className="p-6 space-y-4 flex-grow flex flex-col">
                <p className="text-gray-700 text-sm flex-grow">{p.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    {p.salePrice && (!p.saleExpiresAt || new Date(p.saleExpiresAt) > new Date()) ? (
                      <>
                        <span className="text-xl font-bold text-red-600">
                          {formatCurrency(p.salePrice, 'EGP')}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          {formatCurrency(p.priceEGP || p.price, 'EGP')}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-[var(--color-vet-secondary)]">
                        {formatCurrency(p.priceEGP || p.price, 'EGP')}
                      </span>
                    )}
                  </div>
                  {isInStock ? (
                    <button
                      onClick={() => handleAddToCart(p)}
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {t('cart.addToCart')}
                    </button>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-700 px-3 py-2 rounded-xl font-bold">نفذ من المخزون</span>
                  )}
                </div>
                <div className="mt-3">
                  <div className="text-sm text-gray-600 mb-1">{t('products.labels.supportedCurrencies')}</div>
                  <div className="flex flex-wrap gap-2">
                    {supported.map((c) => (
                      <span key={c} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-50 border">
                        <span className="mr-1 text-gray-500">{c}</span>
                        <span className="font-medium text-gray-800">
                          {formatCurrency(p.priceEGP * (rates[c] || 0), c)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {(p.accessories.length > 0 || p.essentials.length > 0) && (
                  <div className="grid grid-cols-1 gap-4 pt-4 border-t">
                    {p.accessories.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <BadgeCheck className="w-4 h-4 text-[var(--color-vet-primary)] mr-2" />
                          <span className="font-medium text-gray-900 text-xs">{t('products.labels.includesAccessories')}</span>
                        </div>
                        <ul className="text-xs text-gray-700 space-y-1">
                          {p.accessories.map((a, i) => (
                            <li key={i}>• {a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {p.essentials.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <BadgeCheck className="w-4 h-4 text-[var(--color-vet-secondary)] mr-2" />
                          <span className="font-medium text-gray-900 text-xs">{t('products.labels.essentials')}</span>
                        </div>
                        <ul className="text-xs text-gray-700 space-y-1">
                          {p.essentials.map((e, i) => (
                            <li key={i}>• {e}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
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
            {/* Close button */}
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image */}
            <SafeImage
              src={previewImage!.src}
              alt={previewImage!.name}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />

            {/* Product name caption */}
            <div className="mt-4 text-white text-center">
              <p className="text-lg font-semibold drop-shadow-lg">{previewImage!.name}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Products;
