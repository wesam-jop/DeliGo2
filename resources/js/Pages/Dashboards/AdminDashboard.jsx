import React, { useState, useEffect } from 'react';
import { Users, ShoppingBag, Store, Truck, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { adminApi } from '../../Services/adminApi';
import StatCard from '../../Components/Dashboard/StatCard';
import PendingStores from './PendingStores';
import PendingDrivers from './PendingDrivers';
import RecentOrders from './RecentOrders';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await adminApi.getStats();
                setStats(response.data.data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center" dir="rtl">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-black">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10" dir="rtl">
            <div>
                <h1 className="text-3xl font-black text-slate-900">لوحة تحكم المشرف</h1>
                <p className="text-slate-500 mt-1 font-bold text-sm">نظرة شاملة على أداء المنصة في الوقت الفعلي.</p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="إجمالي المستخدمين"
                        value={stats.total_users?.toLocaleString() || '0'}
                        icon={Users}
                        color="bg-slate-900 text-white"
                    />
                    <StatCard
                        title="الطلبات النشطة"
                        value={stats.active_orders?.toLocaleString() || '0'}
                        icon={ShoppingBag}
                        color="bg-brand text-white"
                    />
                    <StatCard
                        title="المتاجر المفعّلة"
                        value={stats.total_stores?.toLocaleString() || '0'}
                        icon={Store}
                        color="bg-brand-dark text-white"
                    />
                    <StatCard
                        title="السائقون المتاحون"
                        value={stats.total_drivers?.toLocaleString() || '0'}
                        icon={Truck}
                        color="bg-emerald-600 text-white"
                    />
                </div>
            )}

            {/* Pending Approvals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <PendingStores />
                <PendingDrivers />
            </div>

            {/* Recent Orders */}
            <RecentOrders />
        </div>
    );
};

export default AdminDashboard;
