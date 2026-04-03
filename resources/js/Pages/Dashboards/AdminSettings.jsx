import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Bell, Shield, Palette, Database, Download, Upload, Trash2, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../Contexts/AuthContext';
import axios from 'axios';
import Button from '../../Components/Button';


const AdminSettings = () => {
    const { user, fetchUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Profile state
    const [profileData, setProfileData] = useState({
        name: '',
        phone: '',
        email: '',
    });

    // Notifications state
    const [notifications, setNotifications] = useState({
        email_notifications: true,
        push_notifications: true,
        new_orders: true,
        new_stores: true,
        new_drivers: true,
    });

    // Security state
    const [securityData, setSecurityData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                phone: user.phone || '',
                email: user.email || '',
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await axios.put('/api/v1/admin/profile', profileData);
            setSuccess('تم تحديث الملف الشخصي بنجاح');
            fetchUser();
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ أثناء التحديث');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (securityData.new_password !== securityData.new_password_confirmation) {
            setError('كلمتا المرور غير متطابقتين');
            setLoading(false);
            return;
        }

        try {
            await axios.post('/api/v1/admin/change-password', {
                current_password: securityData.current_password,
                new_password: securityData.new_password,
                new_password_confirmation: securityData.new_password_confirmation,
            });
            setSuccess('تم تغيير كلمة المرور بنجاح');
            setSecurityData({
                current_password: '',
                new_password: '',
                new_password_confirmation: '',
            });
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ أثناء تغيير كلمة المرور');
        } finally {
            setLoading(false);
        }
    };

    const handleExportData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/admin/export-data', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'admin-data-export.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            setSuccess('تم تصدير البيانات بنجاح');
        } catch (err) {
            setError('حدث خطأ أثناء تصدير البيانات');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'الملف الشخصي', icon: User },
        { id: 'notifications', label: 'الإشعارات', icon: Bell },
        { id: 'security', label: 'الأمان', icon: Shield },
        { id: 'data', label: 'البيانات', icon: Database },
    ];

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900">الإعدادات</h1>
                <p className="text-slate-500 mt-1 font-medium">إعدادات حسابك وتفضيلاتك</p>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center gap-3">
                    <CheckCircle size={20} />
                    <span className="font-medium">{success}</span>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3">
                    <AlertCircle size={20} />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex gap-2 overflow-x-auto">
                    {tabs.map((tab) => (
                        <Button variant="unstyled"
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setError('');
                                setSuccess('');
                            }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-brand text-white'
                                    : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 premium-shadow">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                        <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                            <div className="w-24 h-24 bg-gradient-to-br from-brand to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-slate-900">{user?.name}</h3>
                                <p className="text-sm text-slate-400">مدير النظام</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <User size={16} className="inline ml-1" />
                                    الاسم الكامل
                                </label>
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <Phone size={16} className="inline ml-1" />
                                    رقم الهاتف
                                </label>
                                <input
                                    type="text"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <Mail size={16} className="inline ml-1" />
                                    البريد الإلكتروني
                                </label>
                                <input
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-brand text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={20} />
                            {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </motion.button>
                    </form>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="space-y-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-4">تفضيلات الإشعارات</h3>
                        
                        {[
                            { key: 'email_notifications', label: 'إشعارات البريد الإلكتروني', desc: 'استلام إشعارات عبر البريد الإلكتروني' },
                            { key: 'push_notifications', label: 'إشعارات المتصفح', desc: 'استلام إشعارات منبثقة في المتصفح' },
                            { key: 'new_orders', label: 'طلبات جديدة', desc: 'إشعار عند وجود طلب جديد' },
                            { key: 'new_stores', label: 'متاجر جديدة', desc: 'إشعار عند تسجيل متجر جديد' },
                            { key: 'new_drivers', label: 'سائقون جدد', desc: 'إشعار عند تسجيل سائق جديد' },
                        ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="font-bold text-slate-900">{item.label}</p>
                                    <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifications[item.key]}
                                        onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand"></div>
                                </label>
                            </div>
                        ))}

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full py-4 bg-brand text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-pink-600 transition-all"
                        >
                            <Save size={20} />
                            حفظ التفضيلات
                        </motion.button>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-4">تغيير كلمة المرور</h3>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                كلمة المرور الحالية
                            </label>
                            <input
                                type="password"
                                value={securityData.current_password}
                                onChange={(e) => setSecurityData({...securityData, current_password: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                كلمة المرور الجديدة
                            </label>
                            <input
                                type="password"
                                value={securityData.new_password}
                                onChange={(e) => setSecurityData({...securityData, new_password: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                تأكيد كلمة المرور الجديدة
                            </label>
                            <input
                                type="password"
                                value={securityData.new_password_confirmation}
                                onChange={(e) => setSecurityData({...securityData, new_password_confirmation: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                                required
                                minLength={6}
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-brand text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Shield size={20} />
                            {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                        </motion.button>
                    </form>
                )}

                {/* Data Tab */}
                {activeTab === 'data' && (
                    <div className="space-y-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-4">إدارة البيانات</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 bg-slate-50 rounded-xl">
                                <h4 className="font-bold text-slate-900 mb-2">تصدير البيانات</h4>
                                <p className="text-sm text-slate-400 mb-4">تصدير جميع بيانات المنصة إلى ملف CSV</p>
                                <Button variant="unstyled"
                                    onClick={handleExportData}
                                    disabled={loading}
                                    className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all disabled:opacity-50"
                                >
                                    <Download size={18} />
                                    {loading ? 'جاري التصدير...' : 'تصدير البيانات'}
                                </Button>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-xl">
                                <h4 className="font-bold text-slate-900 mb-2">استيراد البيانات</h4>
                                <p className="text-sm text-slate-400 mb-4">استيراد بيانات من ملف CSV</p>
                                <Button variant="unstyled"
                                    disabled={true}
                                    className="w-full py-3 bg-slate-300 text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                                >
                                    <Upload size={18} />
                                    قريباً
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 bg-red-50 rounded-xl border-2 border-red-100">
                            <h4 className="font-bold text-red-600 mb-2 flex items-center gap-2">
                                <Trash2 size={20} />
                                منطقة الخطر
                            </h4>
                            <p className="text-sm text-red-500 mb-4">هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع البيانات.</p>
                            <Button variant="unstyled"
                                disabled={true}
                                className="w-full py-3 bg-red-100 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                            >
                                <Trash2 size={18} />
                                حذف جميع البيانات (قريباً)
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSettings;
