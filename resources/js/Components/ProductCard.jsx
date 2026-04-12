import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Plus, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../Contexts/CartContext';
import { useAuth } from '../Contexts/AuthContext';
import { favoriteApi, storeApi } from '../Services/api';
import Button from './Button';


const gradientMap = {
    'وجبات رئيسية': 'from-orange-300 to-amber-400',
    'وجبات سريعة': 'from-red-300 to-pink-400',
    'مشروبات': 'from-yellow-300 to-orange-400',
    'حلويات': 'from-purple-300 to-indigo-400',
    'صحي': 'from-lime-300 to-green-400',
    'مأكولات شرقية': 'from-orange-300 to-amber-400',
    'إيطالي': 'from-green-300 to-teal-400',
    'default': 'from-slate-300 to-slate-400',
};

const ProductCard = ({ product, showStore = true }) => {
    const { addToCart } = useCart();
    const { user } = useAuth();
    const [isFavorite, setIsFavorite] = React.useState(product?.is_favorite || false);
    const [isToggling, setIsToggling] = React.useState(false);
    const [isStoreOpen, setIsStoreOpen] = React.useState(true);

    React.useEffect(() => {
        const checkStoreHours = async () => {
            try {
                const res = await storeApi.getHours(product.store_id);
                setIsStoreOpen(res.data.data?.is_open_now ?? true);
            } catch (e) {
                // fallback: assume open
            }
        };
        if (product?.store_id) checkStoreHours();
    }, [product?.store_id]);
    
    // Determine category from product data or infer from name
    const category = product?.category || inferCategory(product);
    const gradient = gradientMap[category] || gradientMap.default;

    function inferCategory(prod) {
        const name = (prod?.name || '').toLowerCase();
        const storeName = (prod?.store?.name || '').toLowerCase();
        
        if (name.includes('شاورما') || name.includes('كباب') || storeName.includes('شامي')) return 'مأكولات شرقية';
        if (name.includes('برغر') || name.includes('بطاطا')) return 'وجبات سريعة';
        if (name.includes('بيتزا') || name.includes('باستا')) return 'إيطالي';
        if (name.includes('آيس') || name.includes('فطيرة')) return 'حلويات';
        if (name.includes('سلطة') || name.includes('أفوكادو')) return 'صحي';
        if (name.includes('قهوة') || name.includes('لاتيه') || name.includes('عصير')) return 'مشروبات';
        
        return 'وجبات رئيسية';
    }

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isStoreOpen) return;
        addToCart(product, product.store_id);
    };

    const handleFavoriteClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            alert('يرجى تسجيل الدخول أولاً لإضافة المنتج للمفضلة');
            return;
        }

        if (isToggling) return;

        setIsToggling(true);
        try {
            const response = await favoriteApi.toggleProduct(product.id);
            setIsFavorite(response.data.is_favorite);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <motion.div whileHover={{ y: -8 }} className="group cursor-pointer">
            <Link to={`/products/${product.store_id}/${product.id}`}>
                <div className="bg-white rounded-[2rem] overflow-hidden premium-shadow border border-slate-100">
                    {/* Image */}
                    <div className={`h-40 bg-gradient-to-br ${gradient} relative`}>
                        {product?.image ? (
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : null}
                        {user?.role === 'customer' && (
                            <Button variant="unstyled"
                                onClick={handleFavoriteClick}
                                className="absolute top-3 left-3 p-2.5 bg-white/80 backdrop-blur rounded-xl hover:bg-white transition-all"
                            >
                                <Heart
                                    size={16}
                                    className={isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'}
                                />
                            </Button>
                        )}
                        {!isStoreOpen && (
                            <div className="absolute bottom-3 right-3 bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                <Clock size={10} />
                                مغلق
                            </div>
                        )}
                    </div>
                    {/* Info */}
                    <div className="p-4 space-y-2">
                        {showStore && product?.store && (
                            <p className="text-[10px] text-slate-400 font-bold">{product.store.name}</p>
                        )}
                        <h3 className="font-black text-sm group-hover:text-brand transition-colors leading-tight line-clamp-2">
                            {product?.name}
                        </h3>
                        {product?.description && (
                            <p className="text-[10px] text-slate-400 line-clamp-2">{product.description}</p>
                        )}
                        <div className="flex items-center justify-between pt-1">
                            <div>
                                <p className="font-black text-slate-900 text-sm">
                                    {product?.price?.toLocaleString()}
                                </p>
                                <p className="text-[9px] text-slate-400">$</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-amber-500 flex items-center gap-1 text-xs font-bold">
                                    <Star size={11} fill="currentColor" />
                                    {product?.rating || '5.0'}
                                </span>
                                {user?.role === 'customer' && (
                                    <Button variant="unstyled"
                                        onClick={handleAddToCart}
                                        disabled={!isStoreOpen}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                                            isStoreOpen
                                                ? 'bg-brand text-white hover:bg-brand-dark shadow-brand/20'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                        title={!isStoreOpen ? 'المتجر مغلق' : 'أضف للسلة'}
                                    >
                                        <Plus size={18} />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default ProductCard;
