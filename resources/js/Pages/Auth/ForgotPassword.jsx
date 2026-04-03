import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, ArrowRight, CheckCircle, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PhoneInput from '../../Components/PhoneInput';

const ForgotPassword = () => {
    const [phoneData, setPhoneData] = useState({ value: '', fullNumber: null, countryCode: '+963', isValid: false });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resetLink, setResetLink] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!phoneData.isValid || !phoneData.fullNumber) {
            setError('يرجى إدخال رقم هاتف صحيح');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post('/api/v1/auth/forgot-password', {
                phone: phoneData.fullNumber
            });

            setSuccess(true);
            // In development, we show the link since SMS isn't configured
            if (response.data.data?.link) {
                setResetLink(response.data.data.link);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'عذراً، حدث خطأ ما. يرجى المحاولة لاحقاً.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-8">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <CheckCircle size={40} />
                </motion.div>

                <h2 className="text-3xl font-black text-slate-900 mb-4">تم إرسال الرابط!</h2>
                <p className="text-slate-500 font-bold mb-8 leading-relaxed">
                    لقد قمنا بإرسال رابط استعادة كلمة المرور إلى رقم هاتفك {phoneData.fullNumber}. يرجى التحقق من الرسائل لديك.
                </p>

                {/* {resetLink && (
                    <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 mb-8">
                        <p className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">رابط التجربة (تطوير فقط):</p>
                        <a href={resetLink} className="text-brand font-black break-all text-sm hover:underline">
                            {resetLink}
                        </a>
                    </div>
                )} */}

                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-brand font-black hover:gap-3 transition-all"
                >
                    <ArrowRight size={20} /> العودة لتسجيل الدخول
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full">
            <Link
                to="/login"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-brand transition-colors mb-8 font-bold text-sm"
            >
                <ArrowRight size={18} className="rotate-180" /> العودة للخلف
            </Link>

            <div className="mb-10 text-center">
                <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Key size={32} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-2">نسيت كلمة المرور؟</h1>
                <p className="text-slate-500 font-bold max-w-sm mx-auto">لا تقلق! أدخل رقم هاتفك وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.</p>
            </div>

            {error && (
                <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="p-4 bg-red-50 text-red-500 rounded-2xl text-sm font-medium mb-6"
                >
                    {error}
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <Smartphone size={16} className="text-slate-400" /> رقم الهاتف
                    </label>
                    <PhoneInput
                        value={phoneData.value}
                        onChange={setPhoneData}
                        error={error && !phoneData.isValid ? 'رقم الهاتف غير صحيح' : null}
                        placeholder="9XX XXX XXX"
                        defaultCountry="+963"
                    />
                </div>

                <motion.button
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={isLoading}
                    className="w-full py-4 bg-brand text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                >
                    {isLoading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
                </motion.button>
            </form>

            <div className="mt-10 text-center text-slate-500 text-sm font-bold">
                تذكرت كلمة المرور؟ <Link to="/login" className="text-brand font-black hover:underline">سجل دخولك الآن</Link>
            </div>
        </div>
    );
};

export default ForgotPassword;
