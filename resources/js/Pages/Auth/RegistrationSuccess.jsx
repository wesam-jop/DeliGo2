import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../Contexts/AuthContext';
import Button from '../../Components/Button';


const RegistrationSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const phone = location.state?.phone || localStorage.getItem('temp_phone');
    const role = location.state?.role || 'customer';

    useEffect(() => {
        // If user is already verified, redirect to dashboard
        if (user && user.phone_verified_at) {
            if (user.role === 'customer') {
                navigate('/dashboard/customer');
            } else if (user.role === 'driver') {
                navigate('/dashboard/driver');
            } else if (user.role === 'store_owner') {
                navigate('/dashboard/store');
            }
            return;
        }

        if (!phone) {
            navigate('/register');
        }
    }, [phone, navigate, user]);

    const handleResend = async () => {
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            await axios.post('/api/v1/auth/resend-verification', {
                phone: phone,
            });
            setMessage('تم إعادة إرسال رابط التفعيل بنجاح!');
        } catch (err) {
            setError(err.response?.data?.message || 'فشل إعادة الإرسال');
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleText = () => {
        if (role === 'driver') return 'سائق توصيل';
        if (role === 'store_owner') return 'صاحب متجر';
        return 'زبون';
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <CheckCircle size={48} className="text-white" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">تم إنشاء الحساب بنجاح!</h1>
                <p className="text-slate-500 font-bold">
                    تسجيل كـ <span className="font-black text-brand italic underline underline-offset-4 decoration-brand/20">{getRoleText()}</span>
                </p>
            </motion.div>

            <div className="bg-brand/5 border border-brand/10 rounded-[2rem] p-8 mb-8 shadow-sm">
                <div className="flex items-start gap-3 mb-6">
                    <Mail className="text-brand flex-shrink-0 mt-0.5" size={24} />
                    <div>
                        <h3 className="text-base font-black text-brand mb-1">تحقق من هاتفك</h3>
                        <p className="text-xs text-brand-dark font-bold">
                            تم إرسال رابط التفعيل إلى رقم هاتفك <span className="font-black text-slate-900">{phone}</span>
                        </p>
                    </div>
                </div>

                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-brand/5">
                    <p className="text-xs font-black text-slate-900 mb-3">ماذا تفعل الآن؟</p>
                    <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside font-bold">
                        <li>افتح رسالة SMS على هاتفك</li>
                        <li>انقر على رابط التفعيل المرسل</li>
                        <li>سيتم تفعيل حسابك تلقائياً</li>
                        <li>ستنتقل مباشرة إلى لوحة التحكم</li>
                    </ol>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium mb-3">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-medium mb-3">
                        {message}
                    </div>
                )}

                <Button variant="unstyled"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="w-full py-4 bg-brand text-white rounded-2xl font-black hover:bg-brand-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-brand/20"
                >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    {isLoading ? 'جاري الإرسال...' : 'إعادة إرسال الرابط'}
                </Button>
            </div>

            <div className="text-center">
                <Link
                    to="/login"
                    className="text-slate-500 text-sm hover:text-brand transition-all flex items-center justify-center gap-2 font-bold"
                >
                    <ArrowLeft size={16} className="rotate-180" />
                    العودة لتسجيل الدخول
                </Link>
            </div>
        </div>
    );
};

export default RegistrationSuccess;
