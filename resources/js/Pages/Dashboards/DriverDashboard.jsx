import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Truck,
    MapPin,
    DollarSign,
    ToggleLeft,
    ToggleRight,
    Clock,
    Star,
    ShoppingBag,
    CheckCircle,
    AlertCircle,
    Navigation,
    Store,
    ArrowLeft
} from 'lucide-react';
import StatCard from '../../Components/Dashboard/StatCard';
import { driverApi } from '../../Services/driverApi';
import { useAuth } from '../../Contexts/AuthContext';
import Button from '../../Components/Button';


const DriverDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);
    const [driver, setDriver] = useState(null);
    const [stats, setStats] = useState({
        today_orders: 0,
        today_earnings: 0,
        completed_orders: 0,
        rating: 0,
    });
    const [currentOrder, setCurrentOrder] = useState(null);
    const [availableOrders, setAvailableOrders] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch driver profile
            try {
                const profileRes = await driverApi.getProfile();
                const driverData = profileRes.data.data;
                setDriver(driverData);
                setIsOnline(driverData.is_online || false);
            } catch (error) {
                console.error('Error fetching profile:', error);
            }

            // Fetch current orders
            try {
                const ordersRes = await driverApi.getCurrentOrders();
                const orders = ordersRes.data.data || [];
                if (orders.length > 0) {
                    setCurrentOrder(orders[0]);
                }
            } catch (error) {
                console.error('Error fetching current orders:', error);
            }

            // Fetch available orders
            try {
                const availableRes = await driverApi.getAvailableOrders();
                const available = availableRes.data.data || [];
                setAvailableOrders(available.slice(0, 3)); // Show first 3
            } catch (error) {
                console.error('Error fetching available orders:', error);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleOnline = async () => {
        try {
            const response = await driverApi.toggleOnline();
            const newStatus = response.data.data?.is_online || !isOnline;
            setIsOnline(newStatus);

            // Refresh data
            fetchDashboardData();
        } catch (error) {
            console.error('Error toggling online status:', error);
            alert('حدث خطأ أثناء تغيير الحالة');
        }
    };

    const handleAcceptOrder = async (orderId) => {
        try {
            await driverApi.acceptOrder(orderId);
            alert('تم قبول الطلب بنجاح! سينتقل للمتجر للموافقة.');
            fetchDashboardData();
        } catch (error) {
            console.error('Error accepting order:', error);
            const message = error.response?.data?.message || 'حدث خطأ أثناء قبول الطلب';
            alert(message);
        }
    };

    const handleMarkPickedUp = async (orderId) => {
        try {
            await driverApi.markAsPickedUp(orderId);
            alert('تم تأكيد استلام الطلب');
            fetchDashboardData();
        } catch (error) {
            console.error('Error marking as picked up:', error);
            alert('حدث خطأ أثناء تأكيد الاستلام');
        }
    };

    const handleMarkDelivered = async (orderId) => {
        try {
            await driverApi.markAsDelivered(orderId);
            alert('تم تسليم الطلب بنجاح!');
            fetchDashboardData();
        } catch (error) {
            console.error('Error marking as delivered:', error);
            alert('حدث خطأ أثناء تأكيد التسليم');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'USD' }).format(price);
    };

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
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">لوحة تحكم السائق</h1>
                    <p className="text-slate-500 mt-1 font-bold text-sm">تتبع طلباتك وإيراداتك وجدولك في الوقت الفعلي.</p>
                </div>
                <Button variant="unstyled"
                    onClick={handleToggleOnline}
                    className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-xl ${isOnline
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                        : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-brand/30'
                        }`}
                >
                    {isOnline ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    {isOnline ? 'أنت متصل الآن' : 'غير متصل (أوفلاين)'}
                </Button>
            </div>

            {/* Offline Alert */}
            {!isOnline && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 bg-brand/5 border border-brand/10 rounded-[2rem] flex items-center gap-5"
                >
                    <div className="p-4 bg-brand text-white rounded-2xl shadow-lg shadow-brand/20">
                        <Truck size={32} />
                    </div>
                    <div>
                        <p className="font-black text-xl text-brand">أنت غير متصل حالياً</p>
                        <p className="text-sm text-brand-dark font-bold mt-1">اضغط على زر الاتصال أعلاه لبدء استقبال طلبات التوصيل الجديدة.</p>
                    </div>
                </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="طلبات اليوم"
                    value={stats.today_orders}
                    icon={ShoppingBag}
                    trend={stats.today_orders > 0 ? 20 : 0}
                    color="bg-brand text-white"
                />
                <StatCard
                    title="أرباح اليوم"
                    value={formatPrice(stats.today_earnings)}
                    icon={DollarSign}
                    trend={stats.today_earnings > 0 ? 8 : 0}
                    color="bg-emerald-600 text-white"
                />
                <StatCard
                    title="مكتملة"
                    value={stats.completed_orders}
                    icon={CheckCircle}
                    color="bg-slate-900 text-white"
                />
                <StatCard
                    title="تقييمك"
                    value={`${stats.rating || '5.0'} ⭐`}
                    icon={Star}
                    color="bg-brand-dark text-white"
                />
            </div>

            {/* Current Order */}
            {isOnline && currentOrder && (
                <div className="bg-white p-8 rounded-3xl border border-slate-100 premium-shadow">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
                            <Clock className="text-brand" size={24} />
                            الطلب الحالي
                        </h3>
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black shadow-sm ${currentOrder.status === 'ready' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                            'bg-brand text-white shadow-brand/20'
                            }`}>
                            {currentOrder.status === 'ready' ? 'جاهز للاستلام' : 'قيد التوصيل الآن'}
                        </span>
                    </div>

                    <div className="p-8 bg-slate-50 rounded-3xl space-y-6 border border-slate-100">
                        <div className="flex justify-between items-center border-b border-white pb-6">
                            <span className="font-black text-brand text-sm tracking-widest italic uppercase">#ORD-{currentOrder.id}</span>
                            <span className="text-xl font-black text-slate-900 underline decoration-brand/20 underline-offset-8">
                                {formatPrice(currentOrder.total_price || currentOrder.price || 0)}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-100">
                                    <Store size={22} className="text-brand" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">الاستلام من المتجر</p>
                                    <p className="font-black text-slate-900 text-lg">
                                        {currentOrder.store_splits?.[0]?.store?.name || 'المتجر'}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1 font-bold">
                                        {currentOrder.store_splits?.[0]?.store?.address_details || ''}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-100">
                                    <MapPin size={22} className="text-brand-dark" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">التوصيل للزبون</p>
                                    <p className="font-black text-slate-900 text-lg">{currentOrder.customer?.name}</p>
                                    <p className="text-sm text-slate-500 mt-1 font-bold">
                                        {currentOrder.delivery_address || currentOrder.address?.address_details || 'عنوان غير محدد'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            {currentOrder.status === 'ready' && (
                                <Button variant="unstyled"
                                    onClick={() => handleMarkPickedUp(currentOrder.id)}
                                    className="flex-1 py-5 bg-emerald-500 text-white rounded-[1.5rem] font-black hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                                >
                                    <Truck size={24} />
                                    تأكيد الاستلام من المتجر
                                </Button>
                            )}
                            {currentOrder.status === 'picked_up' && (
                                <Button variant="unstyled"
                                    onClick={() => handleMarkDelivered(currentOrder.id)}
                                    className="flex-1 py-5 bg-brand text-white rounded-[1.5rem] font-black hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-3"
                                >
                                    <CheckCircle size={24} />
                                    تم التوصيل للزبون ✓
                                </Button>
                            )}
                            <Button variant="unstyled"
                                onClick={() => navigate(`/dashboard/driver/orders/${currentOrder.id}`)}
                                className="w-20 py-5 bg-white border border-slate-100 text-brand rounded-[1.5rem] font-black hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
                            >
                                <Navigation size={24} />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Available Orders */}
            {isOnline && availableOrders.length > 0 && (
                <div className="bg-white p-8 rounded-3xl border border-slate-100 premium-shadow">
                    <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-5">
                        <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
                            <Navigation className="text-brand" size={24} />
                            طلبات متاحة لاستلامها
                        </h3>
                        <Button variant="unstyled"
                            onClick={() => navigate('/dashboard/driver/orders')}
                            className="text-brand font-black text-sm hover:underline underline-offset-4 flex items-center gap-1"
                        >
                            سجل الطلبات
                            <ArrowLeft className="rotate-180" size={16} />
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {availableOrders.map((order) => (
                            <div
                                key={order.id}
                                className="p-5 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-lg transition-all border-2 border-transparent hover:border-pink-200"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-bold text-slate-900">طلب #{order.id}</p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {order.customer?.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                                            <MapPin size={14} />
                                            <span className="truncate">{order.address?.address_details || 'عنوان غير محدد'}</span>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-pink-500 text-lg">
                                            {formatPrice(order.total_price || 0)}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {order.items?.length || 0} منتجات
                                        </p>
                                    </div>
                                </div>

                                <Button variant="unstyled"
                                    onClick={() => handleAcceptOrder(order.id)}
                                    className="w-full py-4 bg-slate-900 text-white rounded-[1.25rem] font-black hover:bg-brand transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={20} className="text-brand group-hover:text-white transition-colors" />
                                    قبول وتوصيل الطلب
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <Button variant="unstyled"
                    onClick={() => navigate('/dashboard/driver/orders')}
                    className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-brand/30 transition-all text-center group premium-shadow"
                >
                    <ShoppingBag className="mx-auto mb-4 text-slate-400 group-hover:text-brand group-hover:scale-110 transition-all" size={40} />
                    <p className="font-black text-slate-900">سجل الطلبات</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">تاريخ التوصيل</p>
                </Button>
                <Button variant="unstyled"
                    onClick={() => navigate('/dashboard/driver/earnings')}
                    className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-brand/30 transition-all text-center group premium-shadow"
                >
                    <DollarSign className="mx-auto mb-4 text-slate-400 group-hover:text-emerald-500 group-hover:scale-110 transition-all" size={40} />
                    <p className="font-black text-slate-900">الأرباح</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">المحفظة المالية</p>
                </Button>
                <Button variant="unstyled"
                    onClick={() => navigate('/dashboard/driver/settings')}
                    className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-brand/30 transition-all text-center group premium-shadow"
                >
                    <Truck className="mx-auto mb-4 text-slate-400 group-hover:text-brand group-hover:scale-110 transition-all" size={40} />
                    <p className="font-black text-slate-900">الإعدادات</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">الملف الشخصي</p>
                </Button>
            </div>
        </div>
    );
};

export default DriverDashboard;
