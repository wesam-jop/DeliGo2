import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, MapPin, Phone, LayoutDashboard, Heart, Package, LogOut, ChevronDown, Users, Truck, Settings, Globe, Tag, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../Contexts/CartContext';
import { useAuth } from '../Contexts/AuthContext';
import Logo from '../assets/images/logo2.png';
import axios from 'axios';
import AdOrchestrator from '../Components/AdOrchestrator';
import Button from '../Components/Button';

const MainLayout = () => {
    const { getCartCount, getCartTotal } = useCart();
    const { token, user, logout } = useAuth();
    const cartCount = getCartCount();
    const cartTotal = getCartTotal();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!token) return;

        const fetchUnreadCount = async () => {
            try {
                const response = await axios.get('/api/v1/chat/unread-count');
                const newCount = response.data.data.count;

                if (newCount > unreadCount) {
                    setToastMessage('لديك رسائل جديدة غير مقروءة');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 5000);
                }

                setUnreadCount(newCount);
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [token, unreadCount]);

    const handleCartClick = (e) => {
        if (!token && cartCount > 0) {
            e.preventDefault();
            if (window.confirm('يجب تسجيل الدخول أولاً لعرض السلة. هل تريد تسجيل الدخول الآن؟')) {
                window.location.href = '/login';
            }
        }
    };

    const handleSearch = (e) => {
        e?.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
            setSearchTerm('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch(e);
        }
    };

    const handleLogout = () => {
        logout();
        setIsProfileOpen(false);
        navigate('/');
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return parts[0].charAt(0) + parts[1].charAt(0);
        }
        return name.charAt(0).toUpperCase();
    };

    const getUserColor = () => {
        if (!user?.name) return 'bg-brand';
        const colors = [
            'bg-brand',
            'bg-orange-600',
            'bg-amber-600',
            'bg-brand-dark',
            'bg-slate-700'
        ];
        const index = user.name.length % colors.length;
        return colors[index];
    };

    const getDashboardLink = () => {
        if (!user) return '/dashboard';
        // Return role-specific dashboard link
        switch (user.role) {
            case 'admin':
                return '/dashboard/admin';
            case 'store_owner':
                return '/dashboard/store';
            case 'driver':
                return '/dashboard/driver';
            case 'customer':
            default:
                return '/dashboard/customer';
        }
    };

    const canAccessDashboard = () => {
        if (!user) return false;
        // All authenticated users can access dashboard
        return true;
    };
    return (
        <div className="min-h-screen flex flex-col font-body bg-white" dir="rtl">
            {/* Navbar */}
            <header className="fixed top-0 w-full z-50 glass-effect border-b border-slate-100 h-20 flex items-center">
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-brand to-rose-500 bg-clip-text text-transparent test flex items-center gap-2">
                        <span><img src={Logo} alt="" className='w-10 h-10 rounded-full' /></span>
                        DeliGo
                    </Link>

                    <nav className="hidden md:flex items-center gap-8 text-slate-600 font-medium">
                        <Link to="/" className="hover:text-brand transition-colors">الرئيسية</Link>
                        <Link to="/stores" className="hover:text-brand transition-colors">المتاجر</Link>
                        <Link to="/products" className="hover:text-brand transition-colors">المنتجات</Link>
                        <Link to="/about" className="hover:text-brand transition-colors">من نحن</Link>
                        {/* <Link to="/contact" className="hover:text-brand transition-colors">تواصل معنا</Link> */}
                    </nav>

                    <div className="flex items-center gap-4">
                        {/* {token && canAccessDashboard() && (
                            <Link
                                to={getDashboardLink()}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-full font-medium hover:bg-brand-dark transition-all shadow-lg shadow-brand/20"
                            >
                                <LayoutDashboard size={18} />
                                <span>لوحة التحكم</span>
                            </Link>
                        )} */}

                        <form onSubmit={handleSearch} className="relative group hidden lg:block">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="ابحث عن أكلة..."
                                className="bg-slate-100 rounded-full pr-10 pl-4 py-2 w-48 focus:w-64 focus:ring-2 focus:ring-brand/20 transition-all outline-none text-sm"
                            />
                        </form>
                        {token && user?.role === 'customer' && (
                            <Link
                                to={token || cartCount === 0 ? "/cart" : "#"}
                                onClick={handleCartClick}
                                className="p-2.5 bg-slate-100 rounded-full relative hover:bg-brand-light hover:text-brand transition-all"
                            >
                                <ShoppingCart size={20} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {token && (
                            <Link
                                to="/dashboard/chat"
                                className="p-2.5 bg-slate-100 rounded-full relative hover:bg-brand-light hover:text-brand transition-all"
                            >
                                <MessageCircle size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {token && user ? (
                            // Profile Dropdown
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 p-1 pr-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"
                                >
                                    <div className={`w-9 h-9 ${getUserColor()} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                                        {getInitials(user?.name)}
                                    </div>
                                    <ChevronDown size={16} className={`text-slate-600 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <>
                                            {/* Backdrop */}
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setIsProfileOpen(false)}
                                            />

                                            {/* Dropdown Menu */}
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                                            >
                                                {/* User Info Header */}
                                                <div className="bg-gradient-to-br from-brand to-brand-dark p-6 text-white text-center">
                                                    <div className={`w-20 h-20 ${getUserColor()} rounded-full flex items-center justify-center text-white font-black text-3xl mb-4 mx-auto border-4 border-white/20 shadow-xl`}>
                                                        {getInitials(user?.name)}
                                                    </div>
                                                    <h3 className="font-bold text-xl">{user?.name}</h3>
                                                    <p className="text-sm text-white/90 mt-1 font-medium bg-white/10 py-1 px-4 rounded-full inline-block backdrop-blur-sm">
                                                        {user?.role === 'customer' && 'زبون'}
                                                        {user?.role === 'store_owner' && 'صاحب متجر'}
                                                        {user?.role === 'driver' && 'سائق'}
                                                        {user?.role === 'admin' && 'مدير النظام'}
                                                    </p>
                                                </div>

                                                {/* Menu Items */}
                                                <div className="py-2">
                                                    <Link
                                                        to={getDashboardLink()}
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                                                    >
                                                        <LayoutDashboard size={20} className="text-slate-400" />
                                                        <span className="font-medium text-slate-700">لوحة التحكم</span>
                                                    </Link>

                                                    {/* Admin Quick Links */}
                                                    {user?.role === 'admin' && (
                                                        <>
                                                            <hr className="my-2 border-slate-100" />
                                                            <p className="px-4 py-2 text-xs font-bold text-slate-400">الإدارة</p>
                                                            <Link
                                                                to="/dashboard/orders"
                                                                onClick={() => setIsProfileOpen(false)}
                                                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                                                            >
                                                                <Package size={20} className="text-slate-400" />
                                                                <span className="font-medium text-slate-700">الطلبات</span>
                                                            </Link>
                                                            <Link
                                                                to="/dashboard/stores"
                                                                onClick={() => setIsProfileOpen(false)}
                                                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                                                            >
                                                                <Users size={20} className="text-slate-400" />
                                                                <span className="font-medium text-slate-700">المتاجر</span>
                                                            </Link>
                                                            <Link
                                                                to="/dashboard/drivers"
                                                                onClick={() => setIsProfileOpen(false)}
                                                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                                                            >
                                                                <Truck size={20} className="text-slate-400" />
                                                                <span className="font-medium text-slate-700">السائقون</span>
                                                            </Link>
                                                            <Link
                                                                to="/dashboard/users"
                                                                onClick={() => setIsProfileOpen(false)}
                                                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                                                            >
                                                                <Users size={20} className="text-slate-400" />
                                                                <span className="font-medium text-slate-700">المستخدمون</span>
                                                            </Link>
                                                            <hr className="my-2 border-slate-100" />
                                                            <p className="px-4 py-2 text-xs font-bold text-slate-400">الإعدادات</p>
                                                            <Link
                                                                to="/dashboard/settings"
                                                                onClick={() => setIsProfileOpen(false)}
                                                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                                                            >
                                                                <Settings size={20} className="text-slate-400" />
                                                                <span className="font-medium text-slate-700">الإعدادات</span>
                                                            </Link>
                                                            <Link
                                                                to="/dashboard/locations"
                                                                onClick={() => setIsProfileOpen(false)}
                                                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                                                            >
                                                                <Globe size={20} className="text-slate-400" />
                                                                <span className="font-medium text-slate-700">المواقع الجغرافية</span>
                                                            </Link>
                                                            <Link
                                                                to="/dashboard/categories"
                                                                onClick={() => setIsProfileOpen(false)}
                                                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                                                            >
                                                                <Tag size={20} className="text-slate-400" />
                                                                <span className="font-medium text-slate-700">التصنيفات</span>
                                                            </Link>
                                                        </>
                                                    )}

                                                    {user?.role !== 'admin' && (
                                                        <>
                                                            <Link
                                                                to={user?.role === 'customer' ? '/dashboard/customer/orders' : user?.role === 'store_owner' ? '/dashboard/store/orders' : '/dashboard/driver/orders'}
                                                                onClick={() => setIsProfileOpen(false)}
                                                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                                                            >
                                                                <Package size={20} className="text-slate-400" />
                                                                <span className="font-medium text-slate-700">طلباتي</span>
                                                            </Link>

                                                            {user?.role === 'customer' && (
                                                                <>
                                                                    <Link
                                                                        to="/dashboard/customer/favorites"
                                                                        onClick={() => setIsProfileOpen(false)}
                                                                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                                                                    >
                                                                        <Heart size={20} className="text-slate-400" />
                                                                        <span className="font-medium text-slate-700">المفضلة</span>
                                                                    </Link>

                                                                    <Link
                                                                        to="/dashboard/customer/addresses"
                                                                        onClick={() => setIsProfileOpen(false)}
                                                                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                                                                    >
                                                                        <MapPin size={20} className="text-slate-400" />
                                                                        <span className="font-medium text-slate-700">عناويني</span>
                                                                    </Link>
                                                                </>
                                                            )}
                                                        </>
                                                    )}

                                                    <hr className="my-2 border-slate-100" />

                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-red-500"
                                                    >
                                                        <LogOut size={20} />
                                                        <span className="font-medium">تسجيل الخروج</span>
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link to="/login" className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-full font-bold hover:bg-brand transition-all shadow-lg shadow-slate-200">
                                <User size={18} />
                                <span>تسجيل الدخول</span>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Global Toast Notification */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, x: '-50%' }}
                        animate={{ opacity: 1, y: -20, x: '-50%' }}
                        exit={{ opacity: 0, y: 100, x: '-50%' }}
                        className="fixed bottom-10 left-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] border border-white/10 backdrop-blur-xl"
                    >
                        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand/20">
                            <MessageCircle size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold">{toastMessage}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">اضغط للعرض</p>
                        </div>
                        <button
                            onClick={() => {
                                navigate('/dashboard/chat');
                                setShowToast(false);
                            }}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors"
                        >
                            فتح
                        </button>
                        <button onClick={() => setShowToast(false)} className="text-slate-500 hover:text-white p-1">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content holder with padding top for fixed navbar */}
            <div className="pt-20 flex-1">
                <Outlet />
            </div>

            {/* Global Floating Cart Button */}
            {cartCount > 0 && user?.role === 'customer' && (
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
                >
                    <Link to="/cart">
                        <Button variant="unstyled" className="bg-slate-900 text-white px-10 py-4 rounded-full flex items-center gap-4 shadow-2xl shadow-slate-400/30 hover:bg-brand transition-all">
                            <div className="w-7 h-7 bg-white text-slate-900 rounded-full flex items-center justify-center font-black text-sm">
                                {cartCount}
                            </div>
                            <span className="font-bold">عرض السلة</span>
                            <span className="font-black">{cartTotal.toLocaleString()} $</span>
                        </Button>
                    </Link>
                </motion.div>
            )}

            {/* Subtle Ad Banner between content and footer */}
            <AdOrchestrator placement="footer" variant="minimal" autoPlayInterval={7000} />

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white test flex gap-2 items-center">
                                <span><img src={Logo} alt="" className='w-10 h-10 rounded-full' /></span>
                                DeliGo
                            </h3>
                            <p className="text-sm leading-relaxed">
                                منصتك الأولى لطلب المنتجات من أفضل المتاجر في منطقتك. سرعة في التوصيل وجودة في الخدمة.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6">روابط سريعة</h4>
                            <ul className="space-y-3 text-sm">
                                <li><Link to="/about" className="hover:text-white transition-colors">من نحن</Link></li>
                                <li><Link to="/stores" className="hover:text-white transition-colors">جميع المتاجر</Link></li>
                                <li><Link to="/products" className="hover:text-white transition-colors">تصفح المنتجات</Link></li>
                                {/* <li><Link to="/contact" className="hover:text-white transition-colors">تواصل معنا</Link></li> */}
                                <li><Link to="/help" className="hover:text-white transition-colors">قسم المساعدة</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6">قانوني</h4>
                            <ul className="space-y-3 text-sm">
                                <li><Link to="/privacy" className="hover:text-white transition-colors">سياسة الخصوصية</Link></li>
                                <li><Link to="/terms" className="hover:text-white transition-colors">شروط الاستخدام</Link></li>
                                <li><Link to="/help" className="hover:text-white transition-colors">مركز المساعدة</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6">اتصل بنا</h4>
                            <div className="space-y-4 text-sm">
                                <div className="flex items-center gap-3">
                                    <Phone size={16} className="text-brand" />
                                    <span>963938964896 +</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin size={16} className="text-brand" />
                                    <span>سوريا</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
                        &copy; {new Date().getFullYear()} DeliGo. جميع الحقوق محفوظة.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
