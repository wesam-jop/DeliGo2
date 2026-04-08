import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Megaphone, Send, AlertCircle, CheckCircle, Info } from 'lucide-react';
import axios from 'axios';
import Button from '../../Components/Button';
import { useAuth } from '../../Contexts/AuthContext';

const AdminNotifications = () => {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        title: '',
        message: '',
        role: 'customer',
        send_ntfy: true,
        send_whatsapp: false,
        exclude_admin: true,
    });

    if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]" dir="rtl">
                <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (user?.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess('');
        setError('');

        const payload = {
            title: form.title.trim(),
            message: form.message.trim(),
            role: form.role === 'all' ? 'all' : form.role,
            send_ntfy: form.send_ntfy,
            send_whatsapp: form.send_whatsapp,
            exclude_admin: form.exclude_admin,
        };

        try {
            const { data } = await axios.post('/api/v1/admin/notifications/broadcast', payload);
            const chunks = data?.data?.queued_chunks ?? 0;
            setSuccess(
                chunks > 0
                    ? `تم جدولة الإرسال (${chunks} دفعة في الطابور). تأكد أن queue worker شغال.`
                    : (data?.message || 'تم تنفيذ الطلب.')
            );
            setForm((f) => ({ ...f, title: '', message: '' }));
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر إرسال الإشعار');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 lg:p-10 max-w-3xl mx-auto space-y-8" dir="rtl">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4"
            >
                <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                    <Megaphone size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">الإشعارات الجماعية</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        إرسال تنبيه لجميع المستخدمين أو لفئة محددة (داخل التطبيق + ntfy اختياريًا)
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 flex gap-3 text-amber-900"
            >
                <Info className="shrink-0 mt-0.5" size={20} />
                <div className="text-sm leading-relaxed">
                    <p className="font-bold mb-1">قبل الإرسال</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-900/90">
                        <li>شغّل <code className="bg-white/80 px-1 rounded text-xs">php artisan queue:work</code> على السيرفر.</li>
                        <li>الإشعار المجدول يوميًا يُضبط من ملف <code className="bg-white/80 px-1 rounded text-xs">.env</code> (مثل <code className="bg-white/80 px-1 rounded text-xs">SCHEDULED_BROADCAST_*</code>) و<code className="bg-white/80 px-1 rounded text-xs">schedule:run</code>.</li>
                        <li>واتساب للجميع قد يسبب تكلفة/حدود؛ استخدمه بحذر.</li>
                    </ul>
                </div>
            </motion.div>

            {success && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-4"
                >
                    <CheckCircle size={20} />
                    <span className="text-sm font-medium">{success}</span>
                </motion.div>
            )}

            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl p-4"
                >
                    <AlertCircle size={20} />
                    <span className="text-sm font-medium">{error}</span>
                </motion.div>
            )}

            <motion.form
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6"
            >
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">عنوان الإشعار</label>
                    <input
                        type="text"
                        maxLength={120}
                        required
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
                        placeholder="مثال: 🍽️ وقت الغداء"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">نص الرسالة</label>
                    <textarea
                        required
                        maxLength={2000}
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none resize-y min-h-[120px]"
                        placeholder="اطلب طعامك الآن..."
                    />
                    <p className="text-xs text-slate-400 mt-1">{form.message.length} / 2000</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">الفئة المستهدفة</label>
                    <select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none bg-white"
                    >
                        <option value="customer">الزبائن فقط</option>
                        <option value="driver">السائقون فقط</option>
                        <option value="store_owner">أصحاب المتاجر فقط</option>
                        <option value="all">الجميع (ما عدا المشرفين إن وُجد خيار الاستثناء)</option>
                    </select>
                </div>

                <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.send_ntfy}
                            onChange={(e) => setForm({ ...form, send_ntfy: e.target.checked })}
                            className="rounded border-slate-300 text-brand focus:ring-brand"
                        />
                        <span className="text-sm text-slate-700">إرسال عبر ntfy (للمستخدمين المفعّل عندهم)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.send_whatsapp}
                            onChange={(e) => setForm({ ...form, send_whatsapp: e.target.checked })}
                            className="rounded border-slate-300 text-brand focus:ring-brand"
                        />
                        <span className="text-sm text-slate-700">إرسال عبر واتساب (للمستخدمين الذين لديهم رقم)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.exclude_admin}
                            onChange={(e) => setForm({ ...form, exclude_admin: e.target.checked })}
                            className="rounded border-slate-300 text-brand focus:ring-brand"
                        />
                        <span className="text-sm text-slate-700">استثناء حسابات المشرفين</span>
                    </label>
                </div>

                <div className="pt-4">
                    <Button type="submit" disabled={loading} className="w-full sm:w-auto gap-2">
                        <Send size={18} />
                        {loading ? 'جاري الجدولة...' : 'إرسال / جدولة الإشعار'}
                    </Button>
                </div>
            </motion.form>
        </div>
    );
};

export default AdminNotifications;
