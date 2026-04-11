import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Smartphone, Mail, MessageCircle, Clock, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import {
    getNotificationPreferences,
    updateNotificationPreferences,
    resetNotificationPreferences
} from '../../Services/NotificationService';
import Button from '../../Components/Button';

const NotificationPreferences = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [preferences, setPreferences] = useState({
        channels: {
            in_app: true,
            push: true,
            whatsapp: true,
        },
        types: {
            order_updates: true,
            message_updates: true,
            marketing_messages: false,
        },
        quiet_hours: {
            start: '22:00',
            end: '08:00',
            enabled: false,
        },
    });

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            setLoading(true);
            const data = await getNotificationPreferences();
            setPreferences(data);
        } catch (err) {
            console.error('Failed to load preferences:', err);
            setError('فشل في تحميل تفضيلات الإشعارات');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setSuccess('');
            setError('');

            await updateNotificationPreferences(preferences);
            setSuccess('تم حفظ تفضيلات الإشعارات بنجاح');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Failed to save preferences:', err);
            setError('فشل في حفظ تفضيلات الإشعارات');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('هل أنت متأكد من إعادة تعيين جميع تفضيلات الإشعارات؟')) {
            return;
        }

        try {
            setSaving(true);
            setSuccess('');
            setError('');

            await resetNotificationPreferences();
            await loadPreferences();
            setSuccess('تم إعادة تعيين تفضيلات الإشعارات');

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Failed to reset preferences:', err);
            setError('فشل في إعادة تعيين تفضيلات الإشعارات');
        } finally {
            setSaving(false);
        }
    };

    const updateChannel = (channel, value) => {
        setPreferences(prev => ({
            ...prev,
            channels: {
                ...prev.channels,
                [channel]: value,
            },
        }));
    };

    const updateType = (type, value) => {
        setPreferences(prev => ({
            ...prev,
            types: {
                ...prev.types,
                [type]: value,
            },
        }));
    };

    const updateQuietHours = (field, value) => {
        setPreferences(prev => ({
            ...prev,
            quiet_hours: {
                ...prev.quiet_hours,
                [field]: value,
            },
        }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                <span className="mr-3 text-slate-600">جاري تحميل تفضيلات الإشعارات...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4"
            >
                <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                    <Bell size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">تفضيلات الإشعارات</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        تحكم في الإشعارات التي تتلقاها وكيفية استلامها
                    </p>
                </div>
            </motion.div>

            {/* Success Message */}
            {success && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-4"
                >
                    <CheckCircle size={20} />
                    <span className="text-sm font-medium">{success}</span>
                </motion.div>
            )}

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl p-4"
                >
                    <AlertCircle size={20} />
                    <span className="text-sm font-medium">{error}</span>
                </motion.div>
            )}

            {/* Channels Section */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Smartphone size={20} className="text-brand" />
                    قنوات الإشعارات
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                    اختر كيف تريد استلام الإشعارات
                </p>

                <div className="space-y-4">
                    {/* In-App */}
                    <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                <Bell size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">إشعارات داخل التطبيق</p>
                                <p className="text-xs text-slate-500">ظهور الإشعارات في صندوق الإشعارات</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={preferences.channels.in_app}
                            onChange={(e) => updateChannel('in_app', e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-brand focus:ring-brand"
                        />
                    </label>

                    {/* Push */}
                    <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                <Smartphone size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">إشعارات Push</p>
                                <p className="text-xs text-slate-500">إشعارات على الهاتف حتى عند إغلاق التطبيق</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={preferences.channels.push}
                            onChange={(e) => updateChannel('push', e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-brand focus:ring-brand"
                        />
                    </label>

                    {/* WhatsApp */}
                    <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                                <MessageCircle size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">واتساب</p>
                                <p className="text-xs text-slate-500">استلام الإشعارات عبر واتساب</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={preferences.channels.whatsapp}
                            onChange={(e) => updateChannel('whatsapp', e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-brand focus:ring-brand"
                        />
                    </label>
                </div>
            </motion.div>

            {/* Notification Types Section */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Mail size={20} className="text-brand" />
                    أنواع الإشعارات
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                    اختر أنواع الإشعارات التي تريد استلامها
                </p>

                <div className="space-y-4">
                    {/* Order Updates */}
                    <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                                <Bell size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">تحديثات الطلبات</p>
                                <p className="text-xs text-slate-500">حالة الطلب (جديد، مقبول، في الطريق، إلخ)</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={preferences.types.order_updates}
                            onChange={(e) => updateType('order_updates', e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-brand focus:ring-brand"
                        />
                    </label>

                    {/* Message Updates */}
                    <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                <MessageCircle size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">الرسائل</p>
                                <p className="text-xs text-slate-500">رسائل جديدة من المتاجر أو السائقين</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={preferences.types.message_updates}
                            onChange={(e) => updateType('message_updates', e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-brand focus:ring-brand"
                        />
                    </label>

                    {/* Marketing Messages */}
                    <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600">
                                <Bell size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">العروض والتسويق</p>
                                <p className="text-xs text-slate-500">عروض خاصة وإعلانات (معطل افتراضياً)</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={preferences.types.marketing_messages}
                            onChange={(e) => updateType('marketing_messages', e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-brand focus:ring-brand"
                        />
                    </label>
                </div>
            </motion.div>

            {/* Quiet Hours Section */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-brand" />
                    ساعات الهدوء
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                    تفعيل ساعات الهدوء لعدم استلام إشعارات خلال وقت محدد
                </p>

                <div className="space-y-4">
                    {/* Enable Quiet Hours */}
                    <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">تفعيل ساعات الهدوء</p>
                                <p className="text-xs text-slate-500">عدم استلام إشعارات خلال الفترة المحددة</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={preferences.quiet_hours.enabled}
                            onChange={(e) => updateQuietHours('enabled', e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-brand focus:ring-brand"
                        />
                    </label>

                    {/* Time Range */}
                    {preferences.quiet_hours.enabled && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        من
                                    </label>
                                    <input
                                        type="time"
                                        value={preferences.quiet_hours.start}
                                        onChange={(e) => updateQuietHours('start', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                                    />
                                </div>
                                <div className="text-slate-400 text-2xl">→</div>
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        إلى
                                    </label>
                                    <input
                                        type="time"
                                        value={preferences.quiet_hours.end}
                                        onChange={(e) => updateQuietHours('end', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex gap-4"
            >
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 gap-2"
                >
                    {saving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            جاري الحفظ...
                        </>
                    ) : (
                        <>
                            <CheckCircle size={18} />
                            حفظ التفضيلات
                        </>
                    )}
                </Button>

                <Button
                    onClick={handleReset}
                    disabled={saving}
                    variant="outline"
                    className="gap-2"
                >
                    <RotateCcw size={18} />
                    إعادة تعيين
                </Button>
            </motion.div>
        </div>
    );
};

export default NotificationPreferences;
