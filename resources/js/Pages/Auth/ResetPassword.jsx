import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const phone = location.state?.phone;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!password.trim()) {
            setError('يرجى إدخال كلمة المرور الجديدة');
            return;
        }
        if (password.length < 8) {
            setError('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
            return;
        }
        if (!passwordConfirmation.trim()) {
            setError('يرجى تأكيد كلمة المرور');
            return;
        }
        if (password !== passwordConfirmation) {
            setError('كلمتا المرور غير متطابقتين');
            return;
        }

        setIsLoading(true);

        try {
            await axios.post('/api/v1/auth/reset-password-after-otp', {
                phone: phone,
                password: password,
                password_confirmation: passwordConfirmation,
            });

            // Redirect to login with success message
            navigate('/login', {
                state: {
                    success: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.'
                }
            });
        } catch (err) {
            setError(err.response?.data?.message || 'فشل تغيير كلمة المرور. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <Link
                to="/login"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-brand transition-colors mb-8 font-bold text-sm"
            >
                <ArrowRight size={18} className="rotate-180" /> العودة للخلف
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <div className="w-20 h-20 bg-brand/10 text-brand rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Key size={36} />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">كلمة المرور الجديدة</h1>
                <p className="text-slate-500 font-bold">
                    أدخل كلمة المرور الجديدة وتأكيدها
                </p>
                {phone && (
                    <p className="text-xs text-slate-400 mt-2 font-bold">{phone}</p>
                )}
            </motion.div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور الجديدة</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="أدخل 8 أحرف على الأقل"
                            className="w-full py-4 pr-4 pl-12 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-brand outline-none transition-all text-sm font-medium"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand transition-colors"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">تأكيد كلمة المرور</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            placeholder="أعد إدخال كلمة المرور"
                            className="w-full py-4 pr-4 pl-12 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-brand outline-none transition-all text-sm font-medium"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={isLoading}
                    className="w-full py-4 bg-brand text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                >
                    <CheckCircle size={20} />
                    {isLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                </motion.button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-xs text-slate-400">
                    يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;
