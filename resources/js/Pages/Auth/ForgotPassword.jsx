import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, ArrowRight, Smartphone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PhoneInput from '../../Components/PhoneInput';

const ForgotPassword = () => {
    const [phoneData, setPhoneData] = useState({ value: '', fullNumber: null, countryCode: '+963', isValid: false });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
            await axios.post('/api/v1/auth/forgot-password', {
                phone: phoneData.fullNumber
            });

            // Redirect to OTP page
            navigate('/verify-otp-reset', {
                state: { phone: phoneData.fullNumber, mode: 'reset' }
            });
        } catch (err) {
            setError(err.response?.data?.message || 'عذراً، حدث خطأ ما. يرجى المحاولة لاحقاً.');
        } finally {
            setIsLoading(false);
        }
    };

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
                <p className="text-slate-500 font-bold max-w-sm mx-auto">لا تقلق! أدخل رقم هاتفك وسنرسل لك رمز التحقق لتعيين كلمة مرور جديدة.</p>
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
                    {isLoading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                </motion.button>
            </form>

            <div className="mt-10 text-center text-slate-500 text-sm font-bold">
                تذكرت كلمة المرور؟ <Link to="/login" className="text-brand font-black hover:underline">سجل دخولك الآن</Link>
            </div>
        </div>
    );
};

export default ForgotPassword;
