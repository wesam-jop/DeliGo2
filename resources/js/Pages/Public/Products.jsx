import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Tag, ChevronDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../../Components/ProductCard';
import { storeApi, locationApi } from '../../Services/api';
import { useAuth } from '../../Contexts/AuthContext';

const Products = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Filters
    const [governorates, setGovernorates] = useState([]);
    const [areas, setAreas] = useState([]);
    const [storeCategories, setStoreCategories] = useState([]);
    const [selectedGovernorate, setSelectedGovernorate] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Initial setup
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [govRes, categoriesRes] = await Promise.all([
                    locationApi.getGovernorates(),
                    storeApi.getCategories()
                ]);

                setGovernorates(govRes.data?.data || []);
                setStoreCategories(categoriesRes.data?.data || []);

                // Set search from URL if present
                const urlSearch = searchParams.get('search');
                if (urlSearch) setSearch(urlSearch);

                // If user is logged in, use their location
                if (user?.governorate_id) {
                    setSelectedGovernorate(user.governorate_id);
                    if (user.area_id) setSelectedArea(user.area_id);
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };

        fetchInitialData();
    }, [user, searchParams]);

    // Fetch areas when governorate changes
    useEffect(() => {
        if (selectedGovernorate) {
            locationApi.getGovernorate(selectedGovernorate)
                .then(res => {
                    setAreas(res.data?.data?.areas || []);
                })
                .catch(err => console.error('Error fetching areas:', err));
        } else {
            setAreas([]);
            setSelectedArea(null);
        }
    }, [selectedGovernorate]);

    // Fetch Products (Note: API doesn't have a direct products endpoint with filters, so we fetch via stores)
    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                governorate_id: selectedGovernorate || undefined,
                area_id: selectedArea || undefined,
                category_id: selectedCategory || undefined,
                search: search || undefined,
            };

            // Get stores matching location filters
            const storesRes = await storeApi.getAll(params);
            const storesData = storesRes.data?.data?.data || [];

            // Fetch products for these stores
            const productPromises = storesData.map(store => 
                storeApi.getProducts(store.id).then(res => {
                    const products = res.data?.data || [];
                    return products.map(p => ({ ...p, store }));
                }).catch(() => [])
            );

            const productsResults = await Promise.all(productPromises);
            const allProducts = productsResults.flat();
            
            setProducts(allProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }, [search, selectedCategory, selectedGovernorate, selectedArea]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAllData();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchAllData]);

    return (
        <div className="container mx-auto px-4 md:px-6 py-12" dir="rtl">
            {/* Header */}
            <div className="mb-12 text-right space-y-2">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900">
                    أشهى <span className="text-brand">الأطباق</span>
                </h1>
                <p className="text-slate-500 font-bold text-lg">
                    {selectedGovernorate && selectedArea 
                        ? `نعرض لك الوجبات المتاحة في ${governorates.find(g => g.id === selectedGovernorate)?.name_ar} - ${areas.find(a => a.id === selectedArea)?.name_ar}`
                        : 'اختر من تشكيلة واسعة من الأطعمة الشهية'}
                </p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 md:p-6 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 mb-10 border border-slate-50">
                <div className="flex flex-col gap-4">
                    {/* Compact Top Row */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Search */}
                        <div className="md:col-span-12 relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="ابحث عن وجبة أو مطعم..."
                                className="w-full pr-12 pl-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-brand/30 outline-none font-bold transition-all"
                            />
                        </div>
                    </div>

                    {/* Secondary Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Governorate */}
                        <div className="relative">
                            <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-brand" size={18} />
                            <select
                                value={selectedGovernorate || ''}
                                onChange={e => {
                                    setSelectedGovernorate(e.target.value ? Number(e.target.value) : null);
                                    setSelectedArea(null);
                                }}
                                className="w-full pr-12 pl-10 py-3.5 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand/30 outline-none font-bold transition-all appearance-none cursor-pointer"
                            >
                                <option value="">كل المحافظات</option>
                                {governorates.map(gov => (
                                    <option key={gov.id} value={gov.id}>{gov.name_ar}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>

                        {/* Area */}
                        <div className="relative">
                            <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-brand/60" size={18} />
                            <select
                                value={selectedArea || ''}
                                onChange={e => setSelectedArea(e.target.value ? Number(e.target.value) : null)}
                                disabled={!selectedGovernorate}
                                className="w-full pr-12 pl-10 py-3.5 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand/30 outline-none font-bold transition-all appearance-none cursor-pointer disabled:opacity-50"
                            >
                                <option value="">كل المناطق</option>
                                {areas.map(area => (
                                    <option key={area.id} value={area.id}>{area.name_ar}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>

                        {/* Store Category */}
                        <div className="relative">
                            <Tag className="absolute right-4 top-1/2 -translate-y-1/2 text-brand" size={18} />
                            <select
                                value={selectedCategory || ''}
                                onChange={e => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                                className="w-full pr-12 pl-10 py-3.5 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand/30 outline-none font-bold transition-all appearance-none cursor-pointer"
                            >
                                <option value="">كل التصنيفات</option>
                                {storeCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="animate-pulse bg-slate-50 h-72 rounded-[2rem]" />
                    ))}
                </div>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map(product => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ProductCard product={product} />
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
                        <Search size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">لا توجد وجبات</h3>
                    <p className="text-slate-500 font-bold">جرب تغيير الفلاتر أو البحث عن شيء آخر</p>
                </motion.div>
            )}
        </div>
    );
};

export default Products;

