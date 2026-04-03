import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Calendar, Clock, Truck, CheckCircle, Download, MapPin } from 'lucide-react';
import { driverApi } from '../../Services/driverApi';
import { useAuth } from '../../Contexts/AuthContext';
import Button from '../../Components/Button';


const DriverEarnings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState({
        today: 0,
        week: 0,
        month: 0,
        total: 0,
    });
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('today'); // today, week, month, all

    useEffect(() => {
        fetchEarnings();
    }, [filter]);

    const fetchEarnings = async () => {
        try {
            setLoading(true);

            // Fetch order history
            const response = await driverApi.getOrderHistory();
            const allOrders = response.data.data || [];

            // Filter orders by status (completed/delivered only)
            const completedOrders = allOrders.filter(order =>
                ['delivered', 'completed'].includes(order.status)
            );

            // Calculate earnings based on delivery fee
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(todayStart);
            weekStart.setDate(weekStart.getDate() - 7);
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            const todayOrders = completedOrders.filter(o => new Date(o.delivered_at || o.updated_at) >= todayStart);
            const weekOrders = completedOrders.filter(o => new Date(o.delivered_at || o.updated_at) >= weekStart);
            const monthOrders = completedOrders.filter(o => new Date(o.delivered_at || o.updated_at) >= monthStart);

            const calculateEarnings = (orders) => {
                return orders.reduce((sum, order) => sum + (order.delivery_fee || 0), 0);
            };

            setEarnings({
                today: calculateEarnings(todayOrders),
                week: calculateEarnings(weekOrders),
                month: calculateEarnings(monthOrders),
                total: calculateEarnings(completedOrders),
            });

            // Set orders based on filter
            let filteredOrders = [];
            switch (filter) {
                case 'today':
                    filteredOrders = todayOrders;
                    break;
                case 'week':
                    filteredOrders = weekOrders;
                    break;
                case 'month':
                    filteredOrders = monthOrders;
                    break;
                default:
                    filteredOrders = completedOrders;
            }

            setOrders(filteredOrders);
        } catch (error) {
            console.error('Error fetching earnings:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'USD' }).format(price);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('ar-IQ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filterTabs = [
        { id: 'today', label: 'اليوم', icon: Calendar },
        { id: 'week', label: 'الأسبوع', icon: Clock },
        { id: 'month', label: 'الشهر', icon: TrendingUp },
        { id: 'all', label: 'الكل', icon: ShoppingBag },
    ];

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900">أرباحي</h1>
                <p className="text-slate-500 mt-1 font-medium">تتبع أرباحك من التوصيلات</p>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-emerald-500 to-green-500 p-6 rounded-3xl text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">اليوم</span>
                    </div>
                    <p className="text-3xl font-black">{formatPrice(earnings.today)}</p>
                    <p className="text-sm text-white/80 mt-1">من {orders.filter(o => new Date(o.delivered_at || o.updated_at) >= new Date(new Date().setHours(0, 0, 0, 0))).length} طلبات</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-6 rounded-3xl text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <Calendar size={24} />
                        </div>
                        <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">الأسبوع</span>
                    </div>
                    <p className="text-3xl font-black">{formatPrice(earnings.week)}</p>
                    <p className="text-sm text-white/80 mt-1">من {orders.filter(o => new Date(o.delivered_at || o.updated_at) >= new Date(new Date().setDate(new Date().getDate() - 7))).length} طلبات</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-brand p-6 rounded-3xl text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">الشهر</span>
                    </div>
                    <p className="text-3xl font-black">{formatPrice(earnings.month)}</p>
                    <p className="text-sm text-white/80 mt-1">من {orders.filter(o => new Date(o.delivered_at || o.updated_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length} طلبات</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 rounded-3xl text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <Truck size={24} />
                        </div>
                        <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">الإجمالي</span>
                    </div>
                    <p className="text-3xl font-black">{formatPrice(earnings.total)}</p>
                    <p className="text-sm text-white/80 mt-1">من جميع التوصيلات</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex gap-2">
                    {filterTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <Button variant="unstyled"
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${filter === tab.id
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">سجل التوصيلات</h3>
                    <span className="text-sm text-slate-400 font-medium">
                        {orders.length} توصيلة
                    </span>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse bg-slate-50 rounded-2xl p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-slate-200 rounded-xl"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <DollarSign size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="font-medium">لا توجد أرباح بعد</p>
                        <p className="text-sm mt-2">ابدأ بتوصيل الطلبات لكسب الأرباح</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                            <CheckCircle size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">طلب #{order.id}</p>
                                            <p className="text-sm text-slate-500 mt-0.5">
                                                {formatDate(order.delivered_at || order.updated_at)}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                <MapPin size={12} />
                                                {order.customer?.name || 'زبون'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xl font-black text-emerald-600">
                                            +{formatPrice(order.delivery_fee || 0)}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">أجرة التوصيل</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverEarnings;
