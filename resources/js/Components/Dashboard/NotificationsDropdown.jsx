import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Package, Clock, CheckCircle, AlertCircle, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    markAsOpened,
    handleDeepLink
} from '../../Services/NotificationService';
import Button from '../Button';


const NotificationsDropdown = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(() => {
            fetchNotifications();
            fetchUnreadCount();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await getNotifications(1, false, 20);
            const data = response.data?.data || response.data || [];
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const count = await getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        // Extract action URL from notification data
        const data = notification.data || {};
        const actionUrl = data.action_url || data.click || null;

        // Mark as read and opened
        try {
            await Promise.all([
                markAsRead(notification.id),
                markAsOpened(notification.id)
            ]);
        } catch (error) {
            console.error('Error updating notification status:', error);
        }

        if (actionUrl) {
            // Navigate using deep link
            handleDeepLink(actionUrl, navigate);
        } else if (notification.type === 'order.status' || notification.type?.startsWith('order.')) {
            // Fallback: Navigate to order if it's an order notification
            const orderId = data.meta?.order_id || data.order_id;
            if (orderId) {
                navigate(`/orders/${orderId}`);
            } else {
                // If no order ID, go to orders list
                navigate('/orders');
            }
        } else if (notification.type?.startsWith('message.') || notification.type?.startsWith('conversation.')) {
            // Fallback: Navigate to chat
            const conversationId = data.meta?.conversation_id || data.conversation_id;
            if (conversationId) {
                navigate(`/chat/${conversationId}`);
            } else {
                navigate('/chat');
            }
        }

        // Update UI
        setNotifications(prev => prev.map(n =>
            n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
        ));
        
        // Update unread count
        if (!notification.read_at) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const markAsReadLocal = (notificationId) => {
        markAsRead(notificationId);
        setNotifications(prev => prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsReadLocal = async () => {
        await markAllAsRead();
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

    const getNotificationIcon = (notification) => {
        const data = notification.data || {};
        const type = notification.type || '';
        
        if (type.includes('order')) {
            return Package;
        } else if (type.includes('message') || type.includes('chat')) {
            return ShoppingBag;
        } else if (type.includes('broadcast')) {
            return Bell;
        }
        
        // Check priority
        const priority = data.priority;
        if (priority >= 5) return AlertCircle;
        if (priority >= 3) return Bell;
        return Clock;
    };

    const getTypeStyles = (notification) => {
        const data = notification.data || {};
        const type = notification.type || '';
        const priority = data.priority;
        
        if (type.includes('order.cancelled')) {
            return 'bg-red-50 border-red-200 text-red-700';
        }
        if (type.includes('order.delivered') || type.includes('order.completed')) {
            return 'bg-emerald-50 border-emerald-200 text-emerald-700';
        }
        if (priority >= 5) {
            return 'bg-amber-50 border-amber-200 text-amber-700';
        }
        return 'bg-blue-50 border-blue-200 text-blue-700';
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
                    <div className="absolute -left-20 mt-2 w-66 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand to-rose-500 text-white">
                            <div className="flex items-center gap-2">
                                <Bell size={20} />
                                <h3 className="font-bold">الإشعارات</h3>
                            </div>
                            {unreadCount > 0 && (
                                <Button variant="unstyled"
                                    onClick={markAllAsReadLocal}
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
                                        const Icon = getNotificationIcon(notification);
                                        const data = notification.data || {};
                                        const title = data.title || notification.type;
                                        const message = data.message || '';

                                        return (
                                            <div
                                                key={notification.id}
                                                className={`p-4 hover:bg-slate-50 transition-all cursor-pointer ${
                                                    !notification.read_at ? 'bg-slate-50/50' : ''
                                                }`}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getTypeStyles(notification)}`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        {title && (
                                                            <p className="font-bold text-slate-900 text-sm truncate">
                                                                {title}
                                                            </p>
                                                        )}
                                                        <p className={`text-sm ${!notification.read_at ? 'font-medium text-slate-900' : 'text-slate-600'}`}>
                                                            {message}
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            {getTimeAgo(notification.created_at)}
                                                        </p>
                                                    </div>
                                                    {!notification.read_at && (
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
                                <button
                                    onClick={() => {
                                        setShowDropdown(false);
                                        navigate('/notifications');
                                    }}
                                    className="text-xs text-brand hover:underline font-bold"
                                >
                                    عرض كل الإشعارات
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationsDropdown;
