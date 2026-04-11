import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, ShoppingBag, Store, Truck, DollarSign,
    Settings, Bell, Search, Menu, X, User, LogOut,
    Users, MapPin, Heart, ChevronLeft, Globe, Tag, Clock, MessageCircle, Megaphone, Speaker
} from 'lucide-react';
import { useAuth } from '../Contexts/AuthContext';
import NotificationsDropdown from '../Components/Dashboard/NotificationsDropdown';
import axios from 'axios';
import AdOrchestrator from '../Components/AdOrchestrator';

// Role-based Sidebar config
const sidebarConfig = {
    admin: [
        { icon: LayoutDashboard, label: 'الرئيسية', path: '/dashboard' },
        { icon: ShoppingBag, label: 'الطلبات', path: '/dashboard/orders' },
        { icon: Store, label: 'المتاجر', path: '/dashboard/stores' },
        { icon: Truck, label: 'السائقون', path: '/dashboard/drivers' },
        { icon: Users, label: 'المستخدمون', path: '/dashboard/users' },
        { icon: Globe, label: 'المواقع', path: '/dashboard/locations' },
        { icon: Tag, label: 'التصنيفات', path: '/dashboard/categories' },
        { icon: Megaphone, label: 'الإشعارات', path: '/dashboard/notifications' },
        { icon: Speaker, label: 'الإعلانات', path: '/dashboard/ads' },
        { icon: MessageCircle, label: 'الرسائل', path: '/dashboard/chat' },
        { icon: Settings, label: 'الإعدادات', path: '/dashboard/settings' },
    ],
    store_owner: [
        { icon: LayoutDashboard, label: 'الرئيسية', path: '/dashboard/store' },
        { icon: ShoppingBag, label: 'الطلبات', path: '/dashboard/store/orders' },
        { icon: Store, label: 'منتجاتي', path: '/dashboard/store/products' },
        { icon: Clock, label: 'أوقات الدوام', path: '/dashboard/store/hours' },
        { icon: MessageCircle, label: 'الرسائل', path: '/dashboard/chat' },
        { icon: Settings, label: 'إعدادات المتجر', path: '/dashboard/store/settings' },
    ],
    driver: [
        { icon: LayoutDashboard, label: 'الرئيسية', path: '/dashboard/driver' },
        { icon: ShoppingBag, label: 'الطلبات', path: '/dashboard/driver/orders' },
        { icon: DollarSign, label: 'أرباحي', path: '/dashboard/driver/earnings' },
        { icon: MessageCircle, label: 'الرسائل', path: '/dashboard/chat' },
        { icon: Settings, label: 'الإعدادات', path: '/dashboard/driver/settings' },
    ],
    customer: [
        { icon: LayoutDashboard, label: 'حسابي', path: '/dashboard/customer' },
        { icon: ShoppingBag, label: 'طلباتي', path: '/dashboard/customer/orders' },
        { icon: MapPin, label: 'عناويني', path: '/dashboard/customer/addresses' },
        { icon: Heart, label: 'مفضلتي', path: '/dashboard/customer/favorites' },
        { icon: MessageCircle, label: 'الرسائل', path: '/dashboard/chat' },
        { icon: Settings, label: 'الإعدادات', path: '/dashboard/customer/settings' },
    ],
};

const roleBadge = {
    admin: { label: 'مشرف النظام', color: 'bg-brand text-white shadow-brand/20' },
    store_owner: { label: 'صاحب متجر', color: 'bg-amber-500 text-white shadow-amber-200' },
    driver: { label: 'سائق توصيل', color: 'bg-blue-600 text-white shadow-blue-200' },
    customer: { label: 'زبون', color: 'bg-emerald-600 text-white shadow-emerald-200' },
};

const SidebarItem = ({ icon: Icon, label, path, active }) => (
    <Link to={path}>
        <motion.div
            whileHover={{ x: 4 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${active
                ? 'bg-brand text-white font-black shadow-lg shadow-brand/20'
                : 'text-slate-500 hover:bg-brand-light hover:text-brand'
                }`}
        >
            <Icon size={19} />
            <span className="text-sm">{label}</span>
        </motion.div>
    </Link>
);

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { user, token, logout } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!token) return;

        const fetchUnreadCount = async () => {
            try {
                const response = await axios.get('/api/v1/chat/unread-count');
                setUnreadCount(response.data.data.count);
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [token]);

    const role = user?.role || 'customer';
    const menuItems = sidebarConfig[role] || sidebarConfig.customer;
    const badge = roleBadge[role] || roleBadge.customer;

    const handleLogout = async () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-body" dir="rtl">
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.aside
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-72 bg-white z-40 fixed lg:relative h-full flex flex-col border-l border-slate-100 premium-shadow"
                    >
                        {/* Logo */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <Link to="/" className="text-3xl font-black italic test text-brand">
                                DeliGo
                            </Link>
                            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                                <X size={18} />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="p-4 mx-4 mt-4 rounded-2xl bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center font-black text-slate-500 text-lg">
                                    {user?.name?.[0] || 'U'}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-900 text-sm truncate">{user?.name || 'مستخدم'}</p>
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full shadow-sm ${badge.color}`}>
                                        {badge.label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-3">القائمة الرئيسية</p>
                            {menuItems.map((item) => (
                                <SidebarItem
                                    key={item.path}
                                    {...item}
                                    active={location.pathname === item.path}
                                />
                            ))}
                        </nav>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 space-y-2">
                            <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 transition-all text-sm">
                                <ChevronLeft size={18} className="rotate-180" />
                                <span>العودة للموقع</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-50 transition-all text-sm"
                            >
                                <LogOut size={18} />
                                <span>تسجيل الخروج</span>
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="relative hidden md:block">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="بحث..."
                                className="bg-slate-50 rounded-xl pr-9 pl-4 py-2 w-56 focus:ring-2 focus:ring-brand-light focus:border-brand outline-none text-sm border border-slate-100 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notification Bell */}
                        <NotificationsDropdown />
                        {/* Messages */}
                        <button
                            onClick={() => navigate('/dashboard/chat')}
                            className="p-2.5 bg-slate-50 rounded-xl relative hover:bg-slate-100 transition-all border border-slate-100"
                        >
                            <MessageCircle size={18} className="text-slate-500" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold animate-pulse">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center font-black text-slate-500">
                            {user?.name?.[0] || 'U'}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <div className="flex-1 overflow-y-auto bg-slate-50">
                    <div className="p-6 md:p-8">
                        <Outlet />
                    </div>
                    {/* Subtle ad at bottom of dashboard pages */}
                    <AdOrchestrator placement="footer" variant="minimal" autoPlayInterval={10000} />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
