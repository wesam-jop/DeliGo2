import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ShoppingBag,
    TrendingUp,
    Clock,
    CheckCircle,
    Plus,
    Package,
    AlertCircle,
    Store,
    Edit,
    Eye,
    XCircle,
    ArrowLeft
} from 'lucide-react';
import StatCard from '../../Components/Dashboard/StatCard';
import { storeOwnerApi } from '../../Services/storeApi';
import { useAuth } from '../../Contexts/AuthContext';
import Button from '../../Components/Button';


const StoreDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [store, setStore] = useState(null);
    const [stats, setStats] = useState({
        today_orders: 0,
        today_revenue: 0,
        preparing_orders: 0,
        completed_orders: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // Fetch store info
            try {
                const storeRes = await storeOwnerApi.getMyStore();
                setStore(storeRes.data.data);
            } catch (error) {
                console.error('Error fetching store:', error);
            }

            // Fetch orders
            try {
                const ordersRes = await storeOwnerApi.getOrders({ limit: 10 });
                const orders = ordersRes.data.data?.data || ordersRes.data.data || [];
                setRecentOrders(orders);

                // Calculate stats from orders
                const today = new Date().toISOString().split('T')[0];
                const todayOrders = orders.filter(o => o.created_at?.startsWith(today));
                const preparingOrders = orders.filter(o =>
                    o.status === 'preparing' || o.status === 'confirmed'
                );
                const completedOrders = orders.filter(o =>
                    o.status === 'delivered' || o.status === 'completed'
                );

                setStats({
                    today_orders: todayOrders.length,
                    today_revenue: todayOrders.reduce((sum, o) => sum + (o.total_price || o.price || 0), 0),
                    preparing_orders: preparingOrders.length,
                    completed_orders: completedOrders.length,
                });
            } catch (error) {
                console.error('Error fetching orders:', error);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptOrder = async (orderId) => {
        try {
            await storeOwnerApi.acceptOrder(orderId);
            fetchDashboardData();
        } catch (error) {
            console.error('Error accepting order:', error);
            alert('حدث خطأ أثناء قبول الطلب');
        }
    };

    const handleMarkPreparing = async (orderId) => {
        try {
            await storeOwnerApi.markAsPreparing(orderId);
            fetchDashboardData();
        } catch (error) {
            console.error('Error marking order as preparing:', error);
            alert('حدث خطأ أثناء تحديث حالة الطلب');
        }
    };

    const handleMarkReady = async (orderId) => {
        try {
            await storeOwnerApi.markAsReady(orderId);
            fetchDashboardData();
        } catch (error) {
            console.error('Error marking order as ready:', error);
            alert('حدث خطأ أثناء تحديث حالة الطلب');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: 'بانتظار السائق', color: 'bg-slate-100 text-slate-600' },
            accepted_by_driver: { label: 'قبله السائق', color: 'bg-brand/10 text-brand' },
            confirmed: { label: 'المتجر قبل', color: 'bg-brand/10 text-brand' },
            preparing: { label: 'قيد التحضير', color: 'bg-amber-100 text-amber-600' },
            ready: { label: 'جاهز للاستلام', color: 'bg-emerald-100 text-emerald-600' },
            picked_up: { label: 'قيد التوصيل', color: 'bg-brand/10 text-brand' },
            delivered: { label: 'تم التسليم', color: 'bg-emerald-100 text-emerald-600' },
            completed: { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-600' },
            cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-600' },
        };
        const config = statusConfig[status] || { label: status, color: 'bg-slate-100 text-slate-600' };
        return (
            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const getActionForOrder = (order) => {
        switch (order.status) {
            case 'pending':
                return {
                    label: 'بانتظار السائق',
                    action: null,
                    color: 'bg-slate-100 text-slate-400 cursor-not-allowed'
                };
            case 'accepted_by_driver':
                return {
                    label: 'قبول الطلب',
                    action: () => handleAcceptOrder(order.id),
                    color: 'bg-brand text-white hover:bg-brand-dark shadow-lg shadow-brand/20'
                };
            case 'confirmed':
                return {
                    label: 'بدء التحضير',
                    action: () => handleMarkPreparing(order.id),
                    color: 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20'
                };
            case 'preparing':
                return {
                    label: 'جاهز للاستلام',
                    action: () => handleMarkReady(order.id),
                    color: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
                };
            default:
                return null;
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'USD' }).format(price);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-black">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10" dir="rtl">
            {/* Header */}
            <div className="flex justify-between items-end flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">لوحة تحكم المتجر</h1>
                    <p className="text-slate-500 mt-1 font-bold text-sm">إدارة مبيعاتك ومنتجاتك وطلباتك بكل سهولة.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="unstyled"
                        onClick={() => navigate('/dashboard/store/products')}
                        className="px-6 py-3 bg-brand text-white rounded-2xl font-black flex items-center gap-2 hover:bg-brand-dark transition-all shadow-xl shadow-brand/20"
                    >
                        <Plus size={18} /> إضافة منتج
                    </Button>
                    {store && (
                        <Button variant="unstyled"
                            onClick={() => navigate('/dashboard/store/settings')}
                            className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black flex items-center gap-2 hover:border-brand transition-all"
                        >
                            <Edit size={18} /> إعدادات المتجر
                        </Button>
                    )}
                </div>
            </div>

            {/* Store Status Alert */}
            {store && !store.is_approved && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-brand/5 border border-brand/10 rounded-3xl p-6 flex items-start gap-4"
                >
                    <AlertCircle className="text-brand flex-shrink-0" size={24} />
                    <div>
                        <h3 className="font-black text-brand">متجرك بانتظار الموافقة</h3>
                        <p className="text-brand-dark text-xs mt-1 font-bold">
                            سيتم مراجعة متجرك من قبل الإدارة. ستتمكن من استقبال الطلبات فور الموافقة.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="طلبات اليوم"
                    value={stats.today_orders}
                    icon={ShoppingBag}
                    trend={stats.today_orders > 0 ? 15 : 0}
                    color="bg-brand text-white"
                />
                <StatCard
                    title="إيرادات اليوم"
                    value={formatPrice(stats.today_revenue)}
                    icon={TrendingUp}
                    trend={stats.today_revenue > 0 ? 10 : 0}
                    color="bg-emerald-600 text-white"
                />
                <StatCard
                    title="قيد التحضير"
                    value={stats.preparing_orders}
                    icon={Clock}
                    color="bg-amber-500 text-white"
                />
                <StatCard
                    title="طلبات مكتملة"
                    value={stats.completed_orders}
                    icon={CheckCircle}
                    color="bg-slate-900 text-white"
                />
            </div>

            {/* Store Info Card */}
            {store && (
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 premium-shadow">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 bg-brand text-white rounded-3xl flex items-center justify-center font-black text-3xl shadow-xl shadow-brand/20">
                                {store.name?.charAt(0) || 'S'}
                            </div>
                            <div>
                                <h3 className="font-black text-2xl text-slate-900">{store.name}</h3>
                                <p className="text-slate-500 font-bold text-sm">
                                    {typeof store.category === 'string' ? store.category : (store.category?.name_ar || store.category?.name || 'متجر')}
                                </p>
                                <div className="flex items-center gap-4 mt-3">
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black ${store.is_approved ? 'bg-emerald-100 text-emerald-600' : 'bg-brand/10 text-brand'
                                        }`}>
                                        {store.is_approved ? 'متجر معتمد' : 'بانتظار الموافقة'}
                                    </span>
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black ${store.is_active ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                                        }`}>
                                        {store.is_active ? 'نشط الآن' : 'مغلق مؤقتاً'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button variant="unstyled"
                            onClick={() => navigate(`/stores/${store.id}`)}
                            className="px-6 py-3 bg-slate-50 text-slate-700 rounded-2xl font-black hover:bg-white border border-transparent hover:border-slate-200 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Eye size={20} className="text-brand" /> عرض المتجر للجمهور
                        </Button>
                    </div>
                </div>
            )}

            {/* Active Orders */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 premium-shadow">
                <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-5">
                    <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
                        <Clock className="text-brand" size={24} />
                        الطلبات الأخيرة
                    </h3>
                    <Button variant="unstyled"
                        onClick={() => navigate('/dashboard/store/orders')}
                        className="text-brand font-black text-sm hover:underline underline-offset-4 flex items-center gap-1"
                    >
                        مشاهدة جميع الطلبات
                        <ArrowLeft className="rotate-180" size={16} />
                    </Button>
                </div>

                {recentOrders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Package size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="font-medium">لا توجد طلبات حديثة</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentOrders.slice(0, 5).map((order) => {
                            const action = getActionForOrder(order);
                            return (
                                <div
                                    key={order.id}
                                    className="flex items-center gap-5 p-5 bg-slate-50 rounded-2xl hover:bg-white transition-all premium-shadow cursor-pointer"
                                    onClick={() => navigate(`/dashboard/store/orders/${order.id}`)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-black text-slate-500 text-sm">#{order.id}</span>
                                            {getStatusBadge(order.status)}
                                            <span className="text-xs text-slate-400 font-medium">
                                                {new Date(order.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="font-bold text-sm text-slate-700 mt-1">
                                            {order.items?.slice(0, 3).map(item => item.product_name || item.name).join('، ') || 'طلب'}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <p className="text-[11px] text-slate-500 font-bold">الزبون: {order.customer?.name || 'غير معروف'}</p>
                                            <p className="text-sm font-black text-brand italic underline decoration-brand/10">{formatPrice(order.total_price || order.price || 0)}</p>
                                        </div>
                                    </div>
                                    {action && (
                                        <Button variant="unstyled"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                action.action();
                                            }}
                                            className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${action.color}`}
                                        >
                                            {action.label}
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Button variant="unstyled"
                    onClick={() => navigate('/dashboard/store/products')}
                    className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-brand/30 transition-all text-center group premium-shadow"
                >
                    <Package className="mx-auto mb-4 text-slate-400 group-hover:text-brand group-hover:scale-110 transition-all" size={40} />
                    <p className="font-black text-slate-900">المنتجات</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">إدارة القائمة</p>
                </Button>
                <Button variant="unstyled"
                    onClick={() => navigate('/dashboard/store/orders')}
                    className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-brand/30 transition-all text-center group premium-shadow"
                >
                    <ShoppingBag className="mx-auto mb-4 text-slate-400 group-hover:text-brand group-hover:scale-110 transition-all" size={40} />
                    <p className="font-black text-slate-900">الطلبات</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">سجل المبيعات</p>
                </Button>
                <Button variant="unstyled"
                    onClick={() => navigate('/dashboard/store/hours')}
                    className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-brand/30 transition-all text-center group premium-shadow"
                >
                    <Clock className="mx-auto mb-4 text-slate-400 group-hover:text-brand group-hover:scale-110 transition-all" size={40} />
                    <p className="font-black text-slate-900">أوقات الدوام</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">تعديل المواعيد</p>
                </Button>
                <Button variant="unstyled"
                    onClick={() => navigate('/dashboard/store/settings')}
                    className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-brand/30 transition-all text-center group premium-shadow"
                >
                    <Store className="mx-auto mb-4 text-slate-400 group-hover:text-brand group-hover:scale-110 transition-all" size={40} />
                    <p className="font-black text-slate-900">الإعدادات</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">تخصيص المتجر</p>
                </Button>
            </div>
        </div>
    );
};

export default StoreDashboard;
