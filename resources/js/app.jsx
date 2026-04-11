import './bootstrap';
import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './Contexts/AuthContext';
import { CartProvider } from './Contexts/CartContext';

// Layouts
import DashboardLayout from './Layouts/DashboardLayout';
import MainLayout from './Layouts/MainLayout';
import AuthLayout from './Layouts/AuthLayout';

// Pages - Public
import Home from './Pages/Public/Home';
import Stores from './Pages/Public/Stores';
import StoreDetails from './Pages/Public/StoreDetails';
import Products from './Pages/Public/Products';
import ProductDetails from './Pages/Public/ProductDetails';
import About from './Pages/Public/About';
import Privacy from './Pages/Public/Privacy';
import Terms from './Pages/Public/Terms';
import Cart from './Pages/Public/Cart';
import Checkout from './Pages/Public/Checkout';
import Contact from './Pages/Public/Contact';
import Help from './Pages/Public/Help';

// Pages - Auth
import Login from './Pages/Auth/Login';
import RegisterType from './Pages/Auth/RegisterType';
import CustomerRegister from './Pages/Auth/CustomerRegister';
import DriverRegister from './Pages/Auth/DriverRegister';
import StoreRegister from './Pages/Auth/StoreRegister';
import VerifyOtp from './Pages/Auth/VerifyOtp';
import WaitingApproval from './Pages/Auth/WaitingApproval';
import RegistrationSuccess from './Pages/Auth/RegistrationSuccess';
import VerifyEmail from './Pages/Auth/VerifyEmail';
import ForgotPassword from './Pages/Auth/ForgotPassword';
import VerifyOtpReset from './Pages/Auth/VerifyOtpReset';
import ResetPassword from './Pages/Auth/ResetPassword';

// Pages - Dashboard (Smart router picks correct dashboard by role)
import Dashboard from './Pages/Dashboard';
import AdminDashboard from './Pages/Dashboards/AdminDashboard';
import StoreDashboard from './Pages/Dashboards/StoreDashboard';
import StoreProducts from './Pages/Dashboards/StoreProducts';
import StoreHours from './Pages/Dashboards/StoreHours';
import StoreSettings from './Pages/Dashboards/StoreSettings';
import StoreOrders from './Pages/Dashboards/StoreOrders';
import DriverDashboard from './Pages/Dashboards/DriverDashboard';
import DriverOrders from './Pages/Dashboards/DriverOrders';
import DriverEarnings from './Pages/Dashboards/DriverEarnings';
import DriverSettings from './Pages/Dashboards/DriverSettings';
import CustomerDashboard from './Pages/Dashboards/CustomerDashboard';
import CustomerOrders from './Pages/Dashboards/CustomerOrders';
import CustomerAddresses from './Pages/Dashboards/CustomerAddresses';
import CustomerFavorites from './Pages/Dashboards/CustomerFavorites';
import CustomerSettings from './Pages/Dashboards/CustomerSettings';
import OrderTracking from './Pages/Dashboards/OrderTracking';
import Chat from './Pages/Chat/Chat';
import AdminOrders from './Pages/Dashboards/AdminOrders';
import AdminStores from './Pages/Dashboards/AdminStores';
import AdminDrivers from './Pages/Dashboards/AdminDrivers';
import AdminUsers from './Pages/Dashboards/AdminUsers';
import AdminSettings from './Pages/Dashboards/AdminSettings';
import AdminLocations from './Pages/Dashboards/AdminLocations';
import AdminCategories from './Pages/Dashboards/AdminCategories';

// ============================
// Route Guards
// ============================
const ProtectedRoute = ({ children, roles = [] }) => {
    const { user, token, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (!token) return <Navigate to="/login" replace />;

    // Redirect unapproved stores/drivers to waiting page
    if (
        user &&
        !user.is_approved &&
        (user.role === 'store_owner' || user.role === 'driver')
    ) {
        return <Navigate to="/waiting-approval" replace />;
    }

    if (roles.length > 0 && !roles.includes(user?.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

const GuestRoute = ({ children }) => {
    const { token, loading } = useAuth();
    if (loading) return null;
    if (token) return <Navigate to="/" replace />;
    return children;
};

// Cart Route Guard - requires authentication
const CartRoute = ({ children }) => {
    const { token, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-6 max-w-md p-8">
                    <div className="text-8xl">🔐</div>
                    <h2 className="text-2xl font-bold text-slate-900">يجب تسجيل الدخول أولاً</h2>
                    <p className="text-slate-500">يرجى تسجيل الدخول لعرض سلة التسوق الخاصة بك</p>
                    <div className="flex gap-4 justify-center">
                        <Link to="/login" className="px-8 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-brand transition-all">
                            تسجيل الدخول
                        </Link>
                        <Link to="/register" className="px-8 py-3 bg-white border-2 border-slate-100 text-slate-900 rounded-full font-bold hover:bg-slate-50 transition-all">
                            إنشاء حساب
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return children;
};

// ============================
// App Routes
// ============================
const AppRoutes = () => (
    <Routes>
        {/* ─── Public Routes ─── */}
        <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/stores" element={<Stores />} />
            <Route path="/stores/:id" element={<StoreDetails />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:storeId/:id" element={<ProductDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cart" element={<CartRoute><Cart /></CartRoute>} />
            <Route path="/checkout" element={<CartRoute><Checkout /></CartRoute>} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<Help />} />
        </Route>

        {/* ─── Auth Routes (guest only) ─── */}
        <Route element={<AuthLayout />}>
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterType /></GuestRoute>} />
            <Route path="/register/customer" element={<GuestRoute><CustomerRegister /></GuestRoute>} />
            <Route path="/register/driver" element={<GuestRoute><DriverRegister /></GuestRoute>} />
            <Route path="/register/store" element={<GuestRoute><StoreRegister /></GuestRoute>} />
            <Route path="/registration-success" element={<RegistrationSuccess />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/waiting-approval" element={<WaitingApproval />} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
            <Route path="/verify-otp-reset" element={<GuestRoute><VerifyOtpReset /></GuestRoute>} />
            <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
        </Route>

        {/* ─── Dashboard Routes (protected) ─── */}
        <Route
            path="/dashboard"
            element={
                <ProtectedRoute>
                    <DashboardLayout />
                </ProtectedRoute>
            }
        >
            {/* Smart dashboard – redirects to role-specific dashboard */}
            <Route index element={<Dashboard key="dashboard" />} />
            
            {/* Admin Dashboard Routes */}
            <Route path="admin" element={<AdminDashboard key="admin-dashboard" />} />
            <Route path="admin/users" element={<div className="p-8">User Management</div>} />
            <Route path="admin/stores" element={<div className="p-8">Store Management</div>} />
            <Route path="admin/drivers" element={<div className="p-8">Driver Management</div>} />
            
            {/* Store Owner Dashboard Routes */}
            <Route path="store" element={<StoreDashboard key="store-dashboard" />} />
            <Route path="store/products" element={<StoreProducts key="store-products" />} />
            <Route path="store/hours" element={<StoreHours key="store-hours" />} />
            <Route path="store/settings" element={<StoreSettings key="store-settings" />} />
            <Route path="store/orders" element={<StoreOrders key="store-orders" />} />
            <Route path="store/orders/:orderId" element={<StoreOrders key="store-order-details" />} />
            
            {/* Driver Dashboard Routes */}
            <Route path="driver" element={<DriverDashboard key="driver-dashboard" />} />
            <Route path="driver/orders" element={<DriverOrders key="driver-orders" />} />
            <Route path="driver/orders/:orderId" element={<DriverOrders key="driver-order-details" />} />
            <Route path="driver/earnings" element={<DriverEarnings key="driver-earnings" />} />
            <Route path="driver/settings" element={<DriverSettings key="driver-settings" />} />
            
            {/* Customer Dashboard Routes */}
            <Route path="customer" element={<CustomerDashboard key="customer-dashboard" />} />
            <Route path="customer/orders" element={<CustomerOrders key="customer-orders" />} />
            <Route path="customer/orders/:orderId" element={<CustomerOrders key="customer-order-details" />} />
            <Route path="customer/addresses" element={<CustomerAddresses key="customer-addresses" />} />
            <Route path="customer/favorites" element={<CustomerFavorites key="customer-favorites" />} />
            <Route path="customer/orders/:orderId/track" element={<OrderTracking key="order-tracking" />} />
            <Route path="customer/settings" element={<CustomerSettings key="customer-settings" />} />
            <Route path="chat" element={<Chat key="chat" />} />
            
            {/* Legacy Routes - Redirect to role-specific dashboards */}
            <Route path="orders" element={<AdminOrders key="admin-orders" />} />
            <Route path="stores" element={<AdminStores key="admin-stores" />} />
            <Route path="drivers" element={<AdminDrivers key="admin-drivers-page" />} />
            <Route path="users" element={<AdminUsers key="admin-users" />} />
            <Route path="settings" element={<AdminSettings key="admin-settings" />} />
            <Route path="locations" element={<AdminLocations key="admin-locations" />} />
            <Route path="categories" element={<AdminCategories key="admin-categories" />} />
            <Route path="addresses" element={<div className="p-8 text-slate-400 font-medium test text-center py-32">صفحة العناوين — قريباً</div>} />
            <Route path="products" element={<div className="p-8 text-slate-400 font-medium test text-center py-32">صفحة المنتجات — قريباً</div>} />
            <Route path="map" element={<div className="p-8 text-slate-400 font-medium test text-center py-32">الخريطة — قريباً</div>} />
        </Route>

        {/* ─── Fallback ─── */}
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
);

// ============================
// Root App
// ============================
const App = () => (
    <AuthProvider>
        <CartProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </CartProvider>
    </AuthProvider>
);

const container = document.getElementById('app');
if (container) {
    if (!window.__reactRoot) {
        window.__reactRoot = createRoot(container);
    }
    window.__reactRoot.render(<App />);
}
