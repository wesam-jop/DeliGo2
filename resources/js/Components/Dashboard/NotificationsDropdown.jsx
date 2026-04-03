import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Package, Clock, CheckCircle, AlertCircle, ShoppingBag } from 'lucide-react';
import { storeOwnerApi } from '../../Services/storeApi';
import Button from '../Button';


const NotificationsDropdown = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            // Fetch recent orders to use as notifications
            const response = await storeOwnerApi.getOrders({ limit: 20 });
            const orders = response.data.data?.data || response.data.data || [];
            
            // Convert orders to notifications
            const orderNotifications = orders.map(order => {
                let type = 'info';
                let icon = Bell;
                let message = '';

                switch (order.status) {
                    case 'pending':
                        type = 'warning';
                        icon = Clock;
                        message = `طلب جديد #${order.id} بانتظار القبول`;
                        break;
                    case 'confirmed':
                        type = 'info';
                        icon = CheckCircle;
                        message = `تم قبول طلب #${order.id}`;
                        break;
                    case 'preparing':
                        type = 'info';
                        icon = Package;
                        message = `طلب #${order.id} قيد التحضير`;
                        break;
                    case 'ready':
                        type = 'success';
                        icon = CheckCircle;
                        message = `طلب #${order.id} جاهز للاستلام`;
                        break;
                    case 'delivered':
                    case 'completed':
                        type = 'success';
                        icon = CheckCircle;
                        message = `تم تسليم طلب #${order.id} بنجاح`;
                        break;
                    case 'cancelled':
                        type = 'error';
                        icon = AlertCircle;
                        message = `تم إلغاء طلب #${order.id}`;
                        break;
                    default:
                        message = `تحديث على طلب #${order.id}`;
                }

                return {
                    id: order.id,
                    type,
                    icon,
                    message,
                    order,
                    created_at: order.created_at,
                    read: order.status !== 'pending', // Pending orders are unread
                };
            });

            setNotifications(orderNotifications);
            setUnreadCount(orderNotifications.filter(n => !n.read).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = (notificationId) => {
        setNotifications(prev => prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'الآن';
        if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
        if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
        return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
    };

    const getTypeStyles = (type) => {
        const styles = {
            warning: 'bg-amber-50 border-amber-200 text-amber-700',
            info: 'bg-blue-50 border-blue-200 text-blue-700',
            success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
            error: 'bg-red-50 border-red-200 text-red-700',
        };
        return styles[type] || styles.info;
    };

    return (
        <div className="relative">
            {/* Notification Bell */}
            <Button variant="unstyled"
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2.5 bg-slate-50 rounded-xl relative hover:bg-slate-100 transition-all border border-slate-100"
            >
                <Bell size={18} className="text-slate-500" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>

            {/* Dropdown */}
            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowDropdown(false)}
                    />
                    
                    {/* Dropdown Content */}
                    <div className="absolute left-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand to-rose-500 text-white">
                            <div className="flex items-center gap-2">
                                <Bell size={20} />
                                <h3 className="font-bold">الإشعارات</h3>
                            </div>
                            {unreadCount > 0 && (
                                <Button variant="unstyled"
                                    onClick={markAllAsRead}
                                    className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                                >
                                    <Check size={14} />
                                    تحديد الكل كمقروء
                                </Button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400">
                                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-sm">جاري تحميل الإشعارات...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    <Bell size={48} className="mx-auto mb-4 text-slate-300" />
                                    <p className="font-medium">لا توجد إشعارات</p>
                                    <p className="text-sm mt-1">ستظهر الإشعارات هنا عند وجود طلبات جديدة</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {notifications.map((notification) => {
                                        const Icon = notification.icon;
                                        return (
                                            <div
                                                key={notification.id}
                                                className={`p-4 hover:bg-slate-50 transition-all cursor-pointer ${
                                                    !notification.read ? 'bg-slate-50/50' : ''
                                                }`}
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getTypeStyles(notification.type)}`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm ${!notification.read ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            {getTimeAgo(notification.created_at)}
                                                        </p>
                                                    </div>
                                                    {!notification.read && (
                                                        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1"></div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                                <p className="text-xs text-slate-500">
                                    {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationsDropdown;
