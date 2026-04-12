import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Star, ChevronRight, Plus, Minus, ShoppingCart, Heart, Share2, Clock, ShieldCheck, Check } from 'lucide-react';
import { storeApi, favoriteApi } from '../../Services/api';
import { useCart } from '../../Contexts/CartContext';
import { useAuth } from '../../Contexts/AuthContext';
import ProductCard from '../../Components/ProductCard';
import Button from '../../Components/Button';
import AdOrchestrator from '../../Components/AdOrchestrator';


const ProductDetails = () => {
    const { storeId, id: productId } = useParams();
    const { addToCart } = useCart();
    const { token, user } = useAuth();
    const [product, setProduct] = useState(null);
    const [store, setStore] = useState(null);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [qty, setQty] = useState(1);
    const [liked, setLiked] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [showShareToast, setShowShareToast] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isStoreOpen, setIsStoreOpen] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProductData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch store products to find the current one and get similar ones
                const productsRes = await storeApi.getProducts(storeId);
                const productsData = productsRes.data?.data || [];

                let foundProduct = productsData.find(p => p.id === parseInt(productId));

                if (!foundProduct) {
                    // Try to fetch specifically if not in available list
                    try {
                        const productRes = await storeApi.getProduct(storeId, productId);
                        foundProduct = productRes.data?.data;
                    } catch (err) {
                        setError('المنتج غير موجود');
                        return;
                    }
                }

                if (foundProduct) {
                    setProduct(foundProduct);
                    setLiked(foundProduct.is_favorite);
                    setSimilarProducts(productsData.filter(p => p.id !== foundProduct.id).slice(0, 4));

                    const storeRes = await storeApi.getById(storeId);
                    const storeData = storeRes.data?.data;
                    setStore(storeData);

                    // Check if store is open
                    try {
                        const hoursRes = await storeApi.getHours(storeId);
                        setIsStoreOpen(hoursRes.data.data?.is_open_now ?? storeData?.is_open_now ?? true);
                    } catch (e) {
                        setIsStoreOpen(storeData?.is_open_now ?? true);
                    }
                    
                    // Update liked state if store level favorite info is returned
                    if (foundProduct.is_favorite === undefined) {
                         // Some APIs might need a separate check or it's nested
                    }
                } else {
                    setError('المنتج غير موجود');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                setError('حدث خطأ أثناء تحميل المنتج');
            } finally {
                setLoading(false);
            }
        };

        if (storeId && productId) {
            fetchProductData();
            // Reset qty when product changes
            setQty(1);
            window.scrollTo(0, 0);
        }
    }, [storeId, productId]);

    const handleAddToCart = () => {
        if (!token) {
            alert('يجب تسجيل الدخول أولاً');
            navigate('/login');
            return;
        }

        if (!isStoreOpen) {
            alert('المتجر مغلق حالياً، لا يمكن إضافة منتجات للسلة');
            return;
        }

        if (product && store) {
            addToCart({ ...product, store }, store.id, qty);
        }
    };
    const handleToggleFavorite = async () => {
        if (!token) {
            alert('يرجى تسجيل الدخول أولاً');
            navigate('/login');
            return;
        }

        if (isToggling) return;

        setIsToggling(true);
        try {
            const response = await favoriteApi.toggleProduct(productId);
            setLiked(response.data.is_favorite);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setIsToggling(false);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: product?.name,
            text: product?.description || `اطلب ${product?.name} من تطبيق mishwari!`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share cancelled or failed');
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            setShowShareToast(true);
            setTimeout(() => setShowShareToast(false), 3000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-slate-100 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-slate-400 font-black animate-pulse tracking-widest text-xs uppercase">جاري تجهيز المنتج...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                    <div className="text-8xl mb-8">🍲</div>
                    <h2 className="text-2xl font-black text-slate-900 mb-4">{error || 'المنتج غير موجود'}</h2>
                    <p className="text-slate-500 mb-8 font-medium">يبدو أن المنتج الذي تبحث عنه غير متاح حالياً أو تم نقله.</p>
                    <Link to="/stores" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold inline-block hover:bg-brand transition-all shadow-xl">
                        العودة للمتاجر
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div dir="rtl" className="min-h-screen bg-slate-50/50 pb-20 md:pb-32">
            {/* Header Navigation */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
                <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <Link to={store ? `/stores/${store.id}` : '/products'} className="flex items-center gap-2 text-slate-900 font-bold hover:text-brand transition-colors text-sm md:text-base truncate max-w-[70%]">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                            <ChevronRight size={18} />
                        </div>
                        <span className="truncate">العودة لـ {store?.name || 'المتجر'}</span>
                    </Link>
                    <div className="flex items-center gap-2 md:gap-3">
                        <Button variant="unstyled"
                            onClick={handleShare}
                            className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-lg md:rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all relative"
                        >
                            <Share2 size={16} />
                            {showShareToast && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute top-12 left-0 bg-slate-900 text-white text-[10px] py-2 px-3 rounded-lg whitespace-nowrap z-50 flex items-center gap-2"
                                >
                                    <Check size={12} className="text-emerald-400" />
                                    تم نسخ الرابط!
                                </motion.div>
                            )}
                        </Button>
                        {user?.role === 'customer' && (
                            <Button variant="unstyled"
                                onClick={handleToggleFavorite}
                                className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center transition-all ${liked ? 'bg-red-50 text-red-500 shadow-sm shadow-red-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <Heart size={16} fill={liked ? "currentColor" : "none"} className={isToggling ? 'animate-pulse' : ''} />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 py-6 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-start">
                    {/* Left: Product Image */}
                    <div className="space-y-4 md:space-y-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="aspect-square bg-white rounded-[2rem] md:rounded-[3rem] premium-shadow border border-slate-100 overflow-hidden relative group"
                        >
                            {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-7xl md:text-9xl">🍽️</div>
                            )}

                            {!product.is_available && (
                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                                    <div className="bg-white px-6 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-rose-600 shadow-2xl text-sm md:text-base">
                                        غير متوفر حالياً
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                            <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 flex flex-col items-center gap-1 md:gap-2 text-center">
                                <Clock className="text-amber-500 w-4 h-4 md:w-5 md:h-5" />
                                <span className="text-[10px] md:text-xs font-bold text-slate-400">وقت التحضير</span>
                                <span className="text-xs md:text-sm font-black text-slate-900">20-30 دقيقة</span>
                            </div>
                            <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 flex flex-col items-center gap-1 md:gap-2 text-center">
                                <Star className="text-amber-500 w-4 h-4 md:w-5 md:h-5" fill="currentColor" />
                                <span className="text-[10px] md:text-xs font-bold text-slate-400">التقييم</span>
                                <span className="text-xs md:text-sm font-black text-slate-900">{product.rating || '4.8'}</span>
                            </div>
                            <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 flex flex-col items-center gap-1 md:gap-2 text-center col-span-2 md:col-span-1">
                                <ShieldCheck className="text-emerald-500 w-4 h-4 md:w-5 md:h-5" />
                                <span className="text-[10px] md:text-xs font-bold text-slate-400">الجودة</span>
                                <span className="text-xs md:text-sm font-black text-slate-900">مضمونة 100%</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Product Info */}
                    <div className="space-y-6 md:space-y-10">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-3 md:space-y-4"
                        >
                            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                <span className="px-2 md:px-3 py-1 bg-brand/10 text-brand text-[9px] md:text-[10px] font-black rounded-full uppercase tracking-widest">
                                    {product.category || 'عرض خاص'}
                                </span>
                                {product.is_available && (
                                    <span className="flex items-center gap-1.5 text-emerald-600 text-[9px] md:text-[10px] font-black">
                                        <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-emerald-500 rounded-full"></div>
                                        جاهز للطلب الفوري
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                                {product.name}
                            </h1>
                            <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium">
                                {product.description || 'استمتع بأشهى المأكولات المحضرة بعناية فائقة وبأجود المكونات الطازجة لضمان مذاق لا ينسى.'}
                            </p>
                        </motion.div>

                        <div className="p-6 md:p-8 bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 premium-shadow space-y-6 md:space-y-8">
                            {user?.role === 'customer' && (
                                <>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="text-center md:text-right">
                                            <p className="text-slate-400 text-xs md:text-sm font-bold mb-1">السعر</p>
                                            <div className="flex items-center justify-center md:justify-start gap-2">
                                                <span className="text-xl md:text-2xl font-black text-brand">$</span>
                                                <h2 className="text-3xl md:text-4xl font-black text-slate-900">
                                                    {(product.price * qty).toLocaleString()}
                                                </h2>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center gap-4 md:gap-6 bg-slate-50 p-2 md:p-3 rounded-xl md:rounded-2xl border border-slate-100">
                                            <Button variant="unstyled"
                                                onClick={() => setQty(q => Math.max(1, q - 1))}
                                                className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg md:rounded-xl flex items-center justify-center text-slate-900 hover:text-brand transition-all premium-shadow flex-shrink-0"
                                            >
                                                <Minus size={18} />
                                            </Button>
                                            <span className="font-black text-xl md:text-2xl w-8 text-center text-slate-900">{qty}</span>
                                            <Button variant="unstyled"
                                                onClick={() => setQty(q => q + 1)}
                                                className="w-10 h-10 md:w-12 md:h-12 bg-brand text-white rounded-lg md:rounded-xl flex items-center justify-center hover:bg-brand-dark transition-all shadow-lg flex-shrink-0"
                                            >
                                                <Plus size={18} />
                                            </Button>
                                        </div>
                                    </div>

                                    <Button variant="unstyled"
                                        onClick={handleAddToCart}
                                        disabled={!product.is_available || !isStoreOpen}
                                        className={`w-full py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-lg md:text-xl flex items-center justify-center gap-3 transition-all ${product.is_available && isStoreOpen
                                            ? 'bg-brand text-white hover:bg-brand-dark shadow-xl md:shadow-2xl shadow-brand/30'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <ShoppingCart size={20} className="md:w-6 md:h-6" />
                                        {!isStoreOpen ? 'المتجر مغلق حالياً' : product.is_available ? 'إضافة إلى السلة' : 'غير متاح حالياً'}
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Store Info Mini Card */}
                        <Link to={`/stores/${store?.id}`} className="block">
                            <div className="p-4 md:p-6 bg-slate-900 rounded-2xl md:rounded-3xl flex items-center justify-between group hover:bg-slate-800 transition-all">
                                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                    <div className="w-10 h-10 md:w-14 md:h-14 bg-white/10 rounded-lg md:rounded-2xl flex items-center justify-center text-xl md:text-2xl flex-shrink-0">
                                        🏢
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-white/60 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-0.5 md:mb-1">متجر الشريك</p>
                                        <h4 className="text-white font-black text-base md:text-lg truncate">{store?.name}</h4>
                                    </div>
                                </div>
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-full flex items-center justify-center text-white group-hover:bg-brand transition-all flex-shrink-0">
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Similar Products */}
                {similarProducts.length > 0 && (
                    <div className="mt-20 md:mt-32 space-y-8 md:space-y-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-right md:text-left">منتجات <span className="text-brand italic">مشابهة</span></h2>
                                <p className="text-slate-500 mt-1 md:mt-2 font-bold text-right md:text-left">أطباق أخرى قد تعجبك من نفس المتجر</p>
                            </div>
                            <Link to={`/stores/${storeId}`} className="text-brand font-black hover:underline self-end md:self-auto">عرض المزيد</Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                            {similarProducts.map(p => (
                                <ProductCard key={p.id} product={{ ...p, store }} showStore={false} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Subtle ad at bottom */}
                <AdOrchestrator placement="banner" variant="compact" autoPlayInterval={8000} />
            </div>
        </div>
    );
};

export default ProductDetails;
