import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../Contexts/AuthContext';
import { favoriteApi } from '../Services/api';
import Button from './Button';


const gradientMap = {
    'مأكولات شرقية': 'from-orange-400 to-amber-500',
    'وجبات سريعة': 'from-red-400 to-brand',
    'إيطالي': 'from-green-400 to-teal-500',
    'حلويات': 'from-purple-400 to-indigo-500',
    'مشروبات': 'from-yellow-400 to-orange-500',
    'صحي': 'from-lime-400 to-green-500',
    'default': 'from-slate-400 to-slate-600',
};

const StoreCard = ({ store }) => {
    const { user } = useAuth();
    const [isFavorite, setIsFavorite] = React.useState(store?.is_favorite || false);
    const [isToggling, setIsToggling] = React.useState(false);

    const gradient = store?.category?.color || gradientMap[store?.category] || gradientMap.default;
    const isOpen = store?.is_open_now !== undefined ? store.is_open_now : store?.is_active;
    const categoryIcon = store?.category?.icon || null;

    const handleToggleFavorite = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user) {
            alert('يرجى تسجيل الدخول أولاً لإضافة المتجر للمفضلة');
            return;
        }

        if (isToggling) return;

        setIsToggling(true);
        try {
            const response = await favoriteApi.toggleStore(store.id);
            setIsFavorite(response.data.is_favorite);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <motion.div whileHover={{ y: -8 }} className="group cursor-pointer relative">
            <Button variant="unstyled" 
                onClick={handleToggleFavorite}
                className={`absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                    isFavorite 
                        ? 'bg-brand text-white shadow-lg shadow-brand/30 scale-110' 
                        : 'bg-white/20 text-white hover:bg-white hover:text-brand'
                }`}
            >
                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2.5} />
            </Button>

            <Link to={`/stores/${store.id}`}>
                <div className="bg-white rounded-[2.5rem] overflow-hidden premium-shadow border border-slate-100 h-full">
                    {/* Hero */}
                    <div className={`h-44 bg-gradient-to-br ${gradient} relative`}>
                        {!isOpen && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="bg-white text-slate-700 font-bold px-4 py-2 rounded-full text-sm">مغلق حاليًا</span>
                            </div>
                        )}
                        {store?.image ? (
                            <img
                                src={store.image}
                                alt={store.name}
                                className="w-full h-full object-cover"
                            />
                        ) : null}
                        <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1">
                            {categoryIcon && <span>{categoryIcon}</span>}
                            {store?.category?.name_ar || store?.category}
                        </div>
                    </div>
                    {/* Info */}
                    <div className="p-6 space-y-3">
                        <h3 className="font-black text-lg group-hover:text-brand transition-colors line-clamp-1">{store?.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-500 font-bold">
                            {store?.area?.name_ar && (
                                <span className="flex items-center gap-1">
                                    <MapPin size={14} className="text-brand" /> {store.area.name_ar}
                                </span>
                            )}
                        </div>
                        {store?.address_details && (
                            <p className="text-xs text-slate-400 font-bold line-clamp-1 h-4">{store.address_details}</p>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default StoreCard;
