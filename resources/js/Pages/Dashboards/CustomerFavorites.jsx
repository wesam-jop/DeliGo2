import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Search, ChevronLeft, ArrowRight, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { favoriteApi } from '../../Services/api';
import ProductCard from '../../Components/ProductCard';
import StoreCard from '../../Components/StoreCard';
import Button from '../../Components/Button';


const CustomerFavorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stores'); // stores, products

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        setLoading(true);
        try {
            const response = await favoriteApi.getAll();
            setFavorites(response.data.data || []);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    const storeFavorites = favorites.filter(f => f.favoritable_type.includes('Store'));
    const productFavorites = favorites.filter(f => f.favoritable_type.includes('Product'));

    const displayItems = activeTab === 'stores' ? storeFavorites : productFavorites;

    return (
        <div className="space-y-8 pb-12" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900">مفضلتي</h1>
                <p className="text-slate-500 mt-1 font-bold">كل ما تحبه في مكان واحد للوصول السريع</p>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-md">
                <Button variant="unstyled"
                    onClick={() => setActiveTab('stores')}
                    className={`flex-1 py-3 px-6 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'stores' 
                            ? 'bg-white text-brand shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <ShoppingBag size={18} />
                    المتاجر ({storeFavorites.length})
                </Button>
                <Button variant="unstyled"
                    onClick={() => setActiveTab('products')}
                    className={`flex-1 py-3 px-6 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'products' 
                            ? 'bg-white text-brand shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Heart size={18} />
                    المنتجات ({productFavorites.length})
                </Button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-slate-50 h-64 rounded-[2.5rem]" />
                    ))}
                </div>
            ) : displayItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {displayItems.map((favorite) => (
                        <motion.div
                            key={favorite.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            layout
                        >
                            {activeTab === 'stores' ? (
                                <StoreCard store={{...favorite.favoritable, is_favorite: true}} />
                            ) : (
                                <ProductCard product={{...favorite.favoritable, is_favorite: true}} />
                            )}
                        </motion.div>
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200"
                >
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                        {activeTab === 'stores' ? <ShoppingBag size={40} className="text-slate-300" /> : <Heart size={40} className="text-slate-300" />}
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">لا توجد مفضلات حالياً</h3>
                    <p className="text-slate-500 font-bold mb-8">ابدأ باكتشاف المتاجر والمنتجات وأضف ما يعجبك هنا!</p>
                    <Link 
                        to={activeTab === 'stores' ? "/stores" : "/products"} 
                        className="inline-flex items-center gap-2 px-8 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20"
                    >
                        <span>تصفح الآن</span>
                        <ArrowRight size={18} className="translate-x-1 rotate-180" />
                    </Link>
                </motion.div>
            )}
        </div>
    );
};

export default CustomerFavorites;
