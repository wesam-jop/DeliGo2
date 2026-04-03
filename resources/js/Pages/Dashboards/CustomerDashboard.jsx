import React, { useState, useEffect } from 'react';
import { ShoppingBag, MapPin, CheckCircle, Clock, ArrowLeft, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../../Components/Dashboard/StatCard';
import axios from 'axios';

const CustomerDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_orders: 0,
        active_orders: 0,
        completed_orders: 0,
        cancelled_orders: 0,
        total_spent: 0,
        addresses_count: 0,
    });
    const [currentOrder, setCurrentOrder] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/customer/dashboard');
            const { statistics, current_order } = response.data.data;
            setStats(statistics);
            setCurrentOrder(current_order);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
        );
    }
    return (
        <div className="space-y-10" dir="rtl">
            <div>
                <h1 className="text-3xl font-black text-slate-900">مرحباً بك في حسابك 👋</h1>
                <p className="text-slate-500 mt-1 font-bold text-sm">تابع طلباتك ومفضلتك من هنا بكل سهولة.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="إجمالي طلباتي" value={stats.total_orders} icon={ShoppingBag} color="bg-brand text-white" />
                <StatCard title="طلب نشط" value={stats.active_orders} icon={Clock} color="bg-brand-dark text-white" />
                <StatCard title="مكتملة" value={stats.completed_orders} icon={CheckCircle} color="bg-emerald-500 text-white" />
                <StatCard title="عناوين مسجلة" value={stats.addresses_count} icon={MapPin} color="bg-slate-900 text-white" />
            </div>

            {/* Active Order */}
            {currentOrder ? (
                <div className="bg-white p-8 rounded-3xl border border-slate-100 premium-shadow">
                    <h3 className="font-black text-slate-900 text-xl border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                        <ShoppingBag className="text-brand" size={24} />
                        طلبي الحالي
                    </h3>
                    <div className="p-8 bg-slate-50 rounded-3xl space-y-8 border border-slate-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-black text-brand text-sm tracking-widest uppercase">#{currentOrder.order_number}</p>
                                <p className="font-black text-xl mt-2 text-slate-900">
                                    {currentOrder.items?.[0]?.product?.name || 'طلب'}
                                    {currentOrder.items?.length > 1 && ` +${currentOrder.items.length - 1} أخرى`}
                                </p>
                                <p className="text-sm text-slate-500 mt-1 font-bold">
                                    {currentOrder.store?.name_ar || currentOrder.store?.name_en || 'متجر'}
                                </p>
                            </div>
                            <span className="px-5 py-2 bg-brand text-white rounded-2xl text-[10px] font-black shadow-lg shadow-brand/20">
                                {currentOrder.status === 'pending' && 'قيد الانتظار'}
                                {currentOrder.status === 'confirmed' && 'تم التأكيد'}
                                {currentOrder.status === 'preparing' && 'قيد التحضير'}
                                {currentOrder.status === 'ready' && 'جاهز للاستلام'}
                                {currentOrder.status === 'picked_up' && 'قيد التوصيل'}
                            </span>
                        </div>
                        {/* Progress */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'تم استلام الطلب', status: 'pending', done: ['confirmed', 'preparing', 'ready', 'picked_up'].includes(currentOrder.status) },
                                { label: 'قيد التحضير', status: 'preparing', done: ['preparing', 'ready', 'picked_up'].includes(currentOrder.status) },
                                { label: 'قيد التوصيل', status: 'picked_up', done: ['picked_up'].includes(currentOrder.status) },
                                { label: 'تم التوصيل', status: 'delivered', done: ['delivered'].includes(currentOrder.status) },
                            ].map((step, i) => (
                                <div key={i} className="flex flex-col items-center gap-3 text-center">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${step.done ? 'bg-brand text-white shadow-lg shadow-brand/30' : 'bg-white border-2 border-slate-200 text-slate-300'}`}>
                                        {step.done ? <CheckCircle size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-200"></div>}
                                    </div>
                                    <span className={`text-[10px] font-black ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-3xl border border-slate-100 premium-shadow text-center">
                    <ShoppingBag className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="font-black text-slate-900 text-xl mb-2">ما في طلبات حالية</h3>
                    <p className="text-slate-500 font-bold mb-6">ابدأ التسوق الآن من متاجرنا المميزة!</p>
                    <Link to="/stores" className="inline-block px-8 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-dark transition-all">
                        تصفح المتاجر
                    </Link>
                </div>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Link to="/stores" className="block p-10 bg-slate-900 text-white rounded-[2rem] hover:bg-brand transition-all group relative overflow-hidden">
                    <div className="relative z-10">
                        <ShoppingBag size={40} className="mb-6 text-brand group-hover:text-white transition-colors" />
                        <h3 className="font-black text-2xl mb-2">اطلب الآن</h3>
                        <p className="text-slate-400 group-hover:text-slate-100 font-bold">تصفح مئات المتاجر والوجبات المميزة</p>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full -mr-16 -mt-16 group-hover:bg-white/10 transition-all"></div>
                </Link>
                <div className="p-10 bg-white border border-slate-100 rounded-[2rem] premium-shadow space-y-6 flex flex-col items-start">
                    <Heart size={40} className="text-red-500" />
                    <h3 className="font-black text-2xl text-slate-900">مفضلتي</h3>
                    <p className="text-slate-500 font-bold">لديك 12 منتج محفوظ في قائمة مفضلتك للوصول السريع.</p>
                    <Link to="/products" className="text-sm text-brand font-black hover:underline underline-offset-8 flex items-center gap-2">
                        عرض جميع المفضلات
                        <ArrowLeft size={16} className="rotate-180" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CustomerDashboard;
