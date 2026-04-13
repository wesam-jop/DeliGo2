import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    ShoppingBag,
    Store as StoreIcon,
    ChefHat,
    Truck,
    ArrowRight,
    Star,
    Heart,
    Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StoreCard from '../../Components/StoreCard';
import ProductCard from '../../Components/ProductCard';
import { storeApi } from '../../Services/api';
import Hero from '../../assets/images/hero-background-ar-7.png';
import Logo from '../../assets/images/logo2.png';
import AdOrchestrator from '../../Components/AdOrchestrator';
const FeatureCard = ({ icon: Icon, title, desc, color }) => (
    <motion.div
        whileHover={{ y: -10 }}
        className="p-8 bg-white rounded-[2.5rem] border border-slate-100 premium-shadow group hover:bg-brand hover:text-white transition-all duration-500"
    >
        <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mb-6 transition-colors group-hover:bg-white/20 group-hover:text-white`}>
            <Icon size={32} />
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-slate-500 group-hover:text-white/80 leading-relaxed font-medium">
            {desc}
        </p>
    </motion.div>
);

const Home = () => {
    const [stores, setStores] = useState([]);
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState({
        stores_count: 0,
        customers_count: 0,
        drivers_count: 0,
        fastest_time: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch stats concurrently if it takes no time
                const [storesRes, statsRes] = await Promise.all([
                    storeApi.getAll({ limit: 6 }),
                    storeApi.getStatistics().catch(() => null)
                ]);

                if (statsRes?.data?.data) {
                    setStats(statsRes.data.data);
                }

                // API returns: { success, message, data: { current_page, data: [], ... } }
                const paginationData = storesRes.data.data;
                const storesData = paginationData?.data || [];
                console.log('Stores fetched:', storesData);
                setStores(storesData);

                // Fetch products from all stores
                const productPromises = storesData.map(store =>
                    storeApi.getProducts(store.id).catch(() => null)
                );

                const productsResults = await Promise.all(productPromises);
                const allProducts = productsResults
                    .filter(res => res !== null)
                    .flatMap((res, index) => {
                        const store = storesData[index];
                        const productsData = res.data.data || [];
                        return productsData.map(p => ({
                            ...p,
                            store: store
                        }));
                    })
                    .slice(0, 4);

                console.log('Products fetched with store info:', allProducts);
                setProducts(allProducts);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="space-y-32 pb-32 overflow-hidden">
            {/* Hero Section */}
            <section className="relative px-6 pt-12">
                <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-light text-brand rounded-full text-sm font-bold animate-bounce-slow">
                            <Zap size={16} fill="currentColor" />
                            <span>أبحث عن راحتك واطلب من أفضل المطاعم والمتاجر في منطقتك</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1]">
                            <p className="mb-8">كل ما تشتهيه</p>
                            <span className="text-brand test">بين يديك</span>
                        </h1>
                        <p className="text-lg text-slate-500 max-w-lg leading-relaxed font-bold">
                            اطلب الآن من أفضل المطاعم والمتاجر في منطقتك، واستمتع بتجربة توصيل لا مثيل لها وبأمان كامل.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link to="/stores" className="px-10 py-4 bg-brand text-white rounded-full font-black shadow-2xl shadow-brand/30 hover:bg-brand-dark transition-all flex items-center gap-3">
                                ابدأ الطلب الآن <ArrowRight size={20} className="rotate-180" />
                            </Link>
                            <Link to="/register" className="px-10 py-4 bg-white text-slate-900 border-2 border-slate-100 rounded-full font-black hover:bg-slate-50 transition-all">
                                انضم كشريك
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-brand/10 rounded-full blur-[120px]"></div>
                        <div className="relative bg-orange-500 p-6 rounded-[3rem] premium-shadow border border-slate-50">
                            {/* Visual Placeholder for Premium Image */}
                            <div className="aspect-square bg-orange-500 rounded-[2.5rem] flex items-center justify-center overflow-hidden">
                                <ChefHat size={120} className="text-slate-300" />
                                <img src={Hero} alt="" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Header */}
            <section className="container mx-auto px-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-16 border-y border-slate-100 test">
                    <div className="text-center space-y-2">
                        <p className="text-4xl font-black text-slate-900">{stats.stores_count}</p>
                        <p className="text-slate-500 font-bold">متجر شريك</p>
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-4xl font-black text-brand">{stats.customers_count}</p>
                        <p className="text-slate-500 font-bold">زبون سعيد</p>
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-4xl font-black text-slate-900">{stats.drivers_count}</p>
                        <p className="text-slate-500 font-bold">عامل توصيل</p>
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-4xl font-black text-brand-dark">{stats.fastest_time}min</p>
                        <p className="text-slate-500 font-bold">أسرع وقت تحضير</p>
                    </div>
                </div>
            </section>

            {/* Ad Banner - Full width between sections */}
            <AdOrchestrator placement="banner" variant="full" autoPlayInterval={6000} />

            {/* Products Section */}
            <section className="container mx-auto px-6">
                <div className="flex justify-between items-end mb-16">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 text-right">أكثر الأكلات <span className="text-brand test">طلباً</span></h2>
                        <p className="text-slate-500 mt-2 font-bold text-right">اخترنا لك الأفضل بناءً على تقييمات العملاء.</p>
                    </div>
                    <Link to="/products" className="text-brand font-black hover:underline flex items-center gap-2">عرض الكل <ArrowRight size={18} className="rotate-180" /></Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-[4/3] bg-slate-100 rounded-[2.5rem] mb-6"></div>
                                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-right">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={{
                                    ...product,
                                    store: product.store,
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400">
                        <p className="font-medium">لا توجد منتجات متاحة حالياً</p>
                    </div>
                )}
            </section>

            {/* Stores Section */}
            <section className="bg-slate-50 py-32">
                <div className="container mx-auto px-6">
                    <div className="flex justify-between items-end mb-16 px-4">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 test text-right">المتاجر <span className="text-brand">المميزة</span></h2>
                            <p className="text-slate-500 mt-2 font-bold text-right">نخبة من المطاعم والمتاجر التي تضمن لك الجودة والسرعة.</p>
                        </div>
                        <Link to="/stores" className="text-brand font-black hover:underline flex items-center gap-2">عرض الكل <ArrowRight size={18} className="rotate-180" /></Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse">
                                    <div className="h-64 bg-slate-100 rounded-[2.5rem]"></div>
                                </div>
                            ))}
                        </div>
                    ) : stores.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {stores.slice(0, 6).map((store) => (
                                <StoreCard key={store.id} store={store} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            <p className="font-medium">لا توجد متاجر متاحة حالياً</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Features/Why Us */}
            <section className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
                    <h2 className="text-4xl font-black flex gap-2 justify-center">
                        <span>لماذا تختار </span>
                        <span className="test text-brand ">DeliGo</span>
                        <span><img src={Logo} alt="" className='w-10 h-10 rounded-full'/></span> ؟
                    </h2>
                    <p className="text-slate-500 font-bold">نحن لسنا مجرد تطبيق توصيل، نحن رفيقك الموثوق لتلبية جميع احتياجاتك اليومية بسلاسة تامة.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={Truck}
                        title="توصيل صاروخي"
                        desc="لدينا فريق توصيل مدرب ومنتشر في كافة المناطق لضمان وصول طلبك وهو ساخن."
                        color="bg-emerald-100 text-emerald-600"
                    />
                    <FeatureCard
                        icon={ShoppingBag}
                        title="خيارات لا محدودة"
                        desc="أكثر من 1000 صنف من الأطعمة والمشروبات والمنتجات الاستهلاكية بين يديك."
                        color="bg-brand/10 text-brand"
                    />
                    <FeatureCard
                        icon={Users}
                        title="دعم فني 24/7"
                        desc="فريقنا جاهز للرد على استفساراتك وحل مشاكلك في أي وقت على مدار الساعة."
                        color="bg-orange-100 text-orange-600"
                    />
                </div>
            </section>

            {/* CTA Section */}
            {/* <section className="container mx-auto px-6">
                <div className="bg-gradient-to-br from-brand to-brand-dark rounded-[4rem] p-12 lg:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-brand/20">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32 uppercase tracking-tighter test font-black text-4xl p-20 select-none pointer-events-none opacity-20">DeliGo توصيل</div>

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-4xl lg:text-5xl font-black mb-8 leading-tight test">هل أنت مستعد لبدء الطلب؟</h2>
                        <p className="text-white/80 text-xl font-bold mb-12">انضم إلى آلاف العملاء السعداء الآن واستمتع بوجبتك المفضلة بضغطة زر واحدة.</p>
                        <div className="flex flex-wrap justify-center gap-6">
                            <Link to="/register" className="px-12 py-5 bg-white text-brand rounded-full font-black text-xl hover:bg-slate-50 transition-all shadow-xl">سجل الآن</Link>
                            <Link to="/login" className="px-12 py-5 bg-slate-900 text-white rounded-full font-black text-xl hover:bg-slate-800 transition-all border border-white/10">تواصل معنا</Link>
                        </div>
                    </div>
                </div>
            </section> */}
        </div>
    );
};

export default Home;
