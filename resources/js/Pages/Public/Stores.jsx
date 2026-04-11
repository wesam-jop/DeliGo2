import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import StoreCard from '../../Components/StoreCard';
import { storeApi, locationApi } from '../../Services/api';
import { useAuth } from '../../Contexts/AuthContext';
import Button from '../../Components/Button';
import AdOrchestrator from '../../Components/AdOrchestrator';


const Stores = () => {
    const { user } = useAuth();
    const [stores, setStores] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Filters
    const [governorates, setGovernorates] = useState([]);
    const [areas, setAreas] = useState([]);
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
                setCategories(categoriesRes.data?.data || []);

                // If user is logged in, use their location as default
                if (user?.governorate_id) {
                    setSelectedGovernorate(user.governorate_id);
                    if (user.area_id) {
                        setSelectedArea(user.area_id);
                    }
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };

        fetchInitialData();
    }, [user]);

    // Fetch areas when governorate changes
    useEffect(() => {
        if (selectedGovernorate) {
            locationApi.getGovernorate(selectedGovernorate)
                .then(res => {
                    setAreas(res.data?.data?.areas || []);
                    // Logic: If the selected area doesn't belong to the new governorate, reset it
                    // But if it's the initial load from user data, we want to keep user.area_id
                })
                .catch(err => console.error('Error fetching areas:', err));
        } else {
            setAreas([]);
            setSelectedArea(null);
        }
    }, [selectedGovernorate]);

    // Fetch stores when filters change
    const fetchStores = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                search: search || undefined,
                category_id: selectedCategory || undefined,
                governorate_id: selectedGovernorate || undefined,
                area_id: selectedArea || undefined,
            };

            const response = await storeApi.getAll(params);
            setStores(response.data?.data?.data || []);
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    }, [search, selectedCategory, selectedGovernorate, selectedArea]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStores();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchStores]);

    return (
        <div className="container mx-auto px-4 md:px-6 py-12" dir="rtl">
            {/* Header */}
            <div className="mb-12 text-right space-y-2">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900">
                    اكتشف <span className="text-brand">المتاجر</span>
                </h1>
                <p className="text-slate-500 font-bold text-lg">
                    {selectedGovernorate && selectedArea 
                        ? `نعرض لك المتاجر في ${governorates.find(g => g.id === selectedGovernorate)?.name_ar} - ${areas.find(a => a.id === selectedArea)?.name_ar}`
                        : 'اكتشف أفضل المطاعم والمتاجر في منطقتك'}
                </p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 md:p-6 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 mb-10 border border-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Search */}
                    <div className="md:col-span-5 relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="ابحث عن متجر أو مطعم..."
                            className="w-full pr-12 pl-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-brand/30 outline-none font-bold transition-all"
                        />
                    </div>

                    {/* Governorate Filter */}
                    <div className="md:col-span-3 relative">
                        <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-brand" size={18} />
                        <select
                            value={selectedGovernorate || ''}
                            onChange={e => {
                                const val = e.target.value ? Number(e.target.value) : null;
                                setSelectedGovernorate(val);
                                setSelectedArea(null);
                            }}
                            className="w-full pr-12 pl-10 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-brand/30 outline-none font-bold transition-all appearance-none cursor-pointer"
                        >
                            <option value="">كل المحافظات</option>
                            {governorates.map(gov => (
                                <option key={gov.id} value={gov.id}>{gov.name_ar}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>

                    {/* Area Filter */}
                    <div className="md:col-span-4 relative">
                        <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-brand/60" size={18} />
                        <select
                            value={selectedArea || ''}
                            onChange={e => setSelectedArea(e.target.value ? Number(e.target.value) : null)}
                            disabled={!selectedGovernorate}
                            className="w-full pr-12 pl-10 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-brand/30 outline-none font-bold transition-all appearance-none cursor-pointer disabled:opacity-50"
                        >
                            <option value="">كل المناطق</option>
                            {areas.map(area => (
                                <option key={area.id} value={area.id}>{area.name_ar}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="flex gap-3 overflow-x-auto pb-6 mb-10 scrollbar-hide">
                <Button variant="unstyled"
                    onClick={() => setSelectedCategory(null)}
                    className={`flex-shrink-0 px-8 py-3 rounded-2xl font-black text-sm transition-all ${
                        !selectedCategory
                            ? 'bg-brand text-white shadow-lg shadow-brand/20 translate-y-[-2px]'
                            : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50 font-bold'
                    }`}
                >
                    الكل
                </Button>
                {categories.map(cat => (
                    <Button variant="unstyled"
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${
                            selectedCategory === cat.id
                                ? 'bg-slate-900 text-white shadow-lg translate-y-[-2px]'
                                : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50 font-bold'
                        }`}
                    >
                        {cat.image && <img src={cat.image} className="w-5 h-5 object-contain" alt="" />}
                        {cat.name_ar}
                    </Button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="animate-pulse bg-slate-50 h-80 rounded-[2.5rem]" />
                    ))}
                </div>
            ) : stores.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {stores.map(store => (
                        <motion.div
                            key={store.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <StoreCard store={store} />
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
                    <h3 className="text-2xl font-black text-slate-800 mb-2">لا توجد نتائج</h3>
                    <p className="text-slate-500 font-bold">جرب تغيير الفلاتر أو البحث عن شيء آخر</p>
                </motion.div>
            )}

            {/* Subtle ad at bottom */}
            <AdOrchestrator placement="banner" variant="compact" autoPlayInterval={7000} />
        </div>
    );
};

export default Stores;

