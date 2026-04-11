import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Clock, ChevronRight, Plus, ShoppingCart, Heart, MessageCircle } from 'lucide-react';
import { storeApi, favoriteApi } from '../../Services/api';
import { useCart } from '../../Contexts/CartContext';
import { useAuth } from '../../Contexts/AuthContext';
import axios from 'axios';
import Button from '../../Components/Button';
import AdOrchestrator from '../../Components/AdOrchestrator';


const ProductCard = ({ product, storeId, onAdd, isStoreOpen = true }) => {
    const isAvailable = product.is_available && isStoreOpen;

    return (
        <motion.div whileHover={{ y: -4 }} className={`bg-white rounded-[2rem] p-5 premium-shadow border border-slate-100 flex gap-5 items-center group relative ${!isStoreOpen ? 'opacity-75' : ''}`}>
            {!isStoreOpen && (
                <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                    المتجر مغلق
                </div>
            )}
            <Link to={`/products/${storeId}/${product.id}`} className="w-28 h-28 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex-shrink-0 relative overflow-hidden">
                {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : null}
                {!product.is_available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-white text-slate-700 text-[8px] font-bold px-2 py-0.5 rounded-full">غير متاح</span>
                    </div>
                )}
            </Link>
            <div className="flex-1 min-w-0">
                <Link to={`/products/${storeId}/${product.id}`}>
                    <h4 className="font-bold text-slate-900 group-hover:text-brand transition-colors">{product.name}</h4>
                </Link>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{product.description}</p>
            </div>
            <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <p className="font-black text-slate-900 text-sm">
                    {product.price?.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">$</span>
                </p>
                <Button variant="unstyled"
                    onClick={() => isAvailable && onAdd(product, storeId)}
                    disabled={!isAvailable}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                        isAvailable
                            ? 'bg-slate-900 text-white hover:bg-brand'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                    title={!isStoreOpen ? 'المتجر مغلق حالياً' : !product.is_available ? 'المنتج غير متاح' : 'أضف للسلة'}
                >
                    <Plus size={18} />
                </Button>
            </div>
        </motion.div>
    );
};

const StoreDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const { addToCart, getCartCount, getCartTotal } = useCart();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('الكل');
    const [liked, setLiked] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [loading, setLoading] = useState(true);
    const [storeHours, setStoreHours] = useState(null);
    const [isStoreOpen, setIsStoreOpen] = useState(true);

    const handleContactStore = async () => {
        if (!token) {
            alert('يجب تسجيل الدخول أولاً');
            navigate('/login');
            return;
        }

        if (!store || !store.owner_id) {
            alert('لا يمكن التواصل مع هذا المتجر');
            return;
        }

        try {
            // Start conversation with store owner
            const response = await axios.post('/api/v1/chat/conversations/start-with-role', {
                user_id: store.owner_id,
                type: 'direct',
            });

            // Navigate to chat page
            navigate('/dashboard/chat');
        } catch (error) {
            console.error('Error starting conversation:', error);
            const message = error.response?.data?.message || 'فشل بدء المحادثة';
            alert(message);
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
            const response = await favoriteApi.toggleStore(id);
            setLiked(response.data.is_favorite);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setIsToggling(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [storeRes, productsRes, hoursRes] = await Promise.all([
                    storeApi.getById(id),
                    storeApi.getProducts(id),
                    storeApi.getHours(id)
                ]);

                const storeData = storeRes.data.data;
                setStore(storeData);
                setLiked(storeData.is_favorite || false);
                const productsData = productsRes.data.data || [];
                
                // Add store info to each product
                const productsWithStore = productsData.map(product => ({
                    ...product,
                    store: {
                        id: storeRes.data.data.id,
                        governorate_id: storeRes.data.data.governorate_id,
                        governorate: storeRes.data.data.governorate
                    }
                }));
                
                setProducts(productsWithStore);

                // Extract unique categories
                const uniqueCategories = [...new Set(productsData.map(p => p.category).filter(Boolean))];
                setCategories(['الكل', ...uniqueCategories]);
                setStoreHours(hoursRes.data.data);
                setIsStoreOpen(hoursRes.data.data?.is_open_now ?? storeData?.is_open_now ?? true);
            } catch (error) {
                console.error('Error fetching store data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const cartCount = getCartCount();
    const cartTotal = getCartTotal();

    const filtered = products.filter(p => 
        activeCategory === 'الكل' || p.category === activeCategory
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center text-slate-400">
                    <p className="text-2xl font-bold mb-4">😕</p>
                    <p className="font-bold text-xl">المتجر غير موجود</p>
                    <Link to="/stores" className="text-brand hover:underline mt-4 inline-block">العودة للمتاجر</Link>
                </div>
            </div>
        );
    }

    return (
        <div dir="rtl">
            {/* Hero Banner */}
            <div className="h-64 bg-gradient-to-br from-orange-400 to-amber-500 relative">
                <div className="absolute inset-0 bg-black/20"></div>
                {store.image && (
                    <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                )}
                <div className="absolute bottom-0 right-0 left-0 p-8 text-white">
                    <div className="container mx-auto flex items-end justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Link to="/stores" className="text-white/70 text-sm flex items-center gap-1 hover:text-white">
                                    <ChevronRight size={16} /> المتاجر
                                </Link>
                            </div>
                            <h1 className="text-4xl font-black">{store.name}</h1>
                            <div className="flex items-center gap-4 mt-2 text-white/80 text-sm">
                                {store.category && (
                                    <span className="flex items-center gap-1">
                                        {typeof store.category === 'string' ? store.category : (store.category?.name_ar || store.category?.name)}
                                    </span>
                                )}
                                {store.area && (
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} /> {store.area.name}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="unstyled"
                                onClick={handleContactStore}
                                className="p-4 bg-white/20 backdrop-blur hover:bg-white/30 rounded-2xl transition-all flex items-center gap-2 text-white font-bold"
                            >
                                <MessageCircle size={20} />
                                <span className="text-sm">تواصل مع المتجر</span>
                            </Button>
                            <Button variant="unstyled" 
                                onClick={handleToggleFavorite}
                                className={`p-4 rounded-2xl transition-all ${liked ? 'bg-white text-red-500' : 'bg-white/10 backdrop-blur text-white'}`}
                            >
                                <Heart size={24} className={liked ? 'fill-red-500' : ''} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Store Closed Banner */}
                {!isStoreOpen && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
                        <div className="bg-white/95 backdrop-blur-md px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
                            <Clock size={24} className="text-red-500" />
                            <div>
                                <p className="font-black text-slate-900 text-lg">المتجر مغلق حالياً</p>
                                <p className="text-slate-500 text-sm font-medium">يمكنك التصفح لكن لا يمكنك الطلب الآن</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="container mx-auto px-6 py-10">
                {/* Categories */}
                <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
                    {categories.map(cat => (
                        <Button variant="unstyled" 
                            key={cat} 
                            onClick={() => setActiveCategory(cat)}
                            className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${
                                activeCategory === cat 
                                    ? 'bg-slate-900 text-white' 
                                    : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                            }`}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>

                {/* Products */}
                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {filtered.map(p => <ProductCard key={p.id} product={p} storeId={id} onAdd={addToCart} isStoreOpen={isStoreOpen} />)}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400">
                        <p className="font-medium">لا توجد منتجات في هذا التصنيف</p>
                    </div>
                )}
            </div>

            {/* Subtle ad at bottom */}
            <AdOrchestrator placement="banner" variant="compact" autoPlayInterval={8000} />

            {/* Floating Cart Button */}
            {cartCount > 0 && (
                <motion.div initial={{ y: 100 }} animate={{ y: 0 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                    <Link to="/cart">
                        <Button variant="unstyled" className="bg-slate-900 text-white px-10 py-4 rounded-full flex items-center gap-4 shadow-2xl shadow-slate-400/30 hover:bg-brand transition-all">
                            <div className="w-7 h-7 bg-white text-slate-900 rounded-full flex items-center justify-center font-black text-sm">
                                {cartCount}
                            </div>
                            <span className="font-bold">عرض السلة</span>
                            <span className="font-black">{cartTotal.toLocaleString()} $</span>
                        </Button>
                    </Link>
                </motion.div>
            )}
        </div>
    );
};

export default StoreDetails;
