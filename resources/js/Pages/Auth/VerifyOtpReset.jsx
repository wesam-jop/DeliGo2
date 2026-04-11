import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Button from '../../Components/Button';

const VerifyOtpReset = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState(['', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const phone = location.state?.phone;

    useEffect(() => {
        if (!phone) {
            navigate('/forgot-password');
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phone, navigate]);

    const handleOtpChange = (index, value) => {
        if (value.length > 1) value = value.slice(0, 1);
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 3) {
            document.getElementById(`otp-reset-${index + 1}`)?.focus();
        }

        if (newOtp.every(digit => digit !== '')) {
            handleSubmit(newOtp.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-reset-${index - 1}`)?.focus();
        }
    };

    const handleSubmit = async (otpCode = otp.join('')) => {
        if (otpCode.length !== 4) {
            setError('يرجى إدخال الرمز كاملاً');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await axios.post('/api/v1/auth/verify-otp-password', {
                phone: phone,
                code: otpCode,
            });

            setSuccess('تم التحقق بنجاح!');

            setTimeout(() => {
                navigate('/reset-password', {
                    state: { phone: phone }
                });
            }, 800);
        } catch (err) {
            setError(err.response?.data?.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            await axios.post('/api/v1/auth/forgot-password', { phone: phone });
            setSuccess('تم إعادة إرسال رمز التحقق');
            setTimeLeft(60);
            setCanResend(false);
            setOtp(['', '', '', '']);
            document.getElementById('otp-reset-0')?.focus();

            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setCanResend(true);
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'فشل إعادة الإرسال');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds) => {
        return `${seconds} ثانية`;
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
                    <Mail size={36} />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">أدخل رمز التحقق</h1>
                <p className="text-slate-500 font-bold">
                    أدخل الرمز المكون من 4 أرقام المرسل إلى{' '}
                    <span className="font-black text-brand">{phone}</span>
                </p>
            </motion.div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium mb-6">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-medium mb-6">
                    {success}
                </div>
            )}

            <div className="mb-8">
                <div className="flex gap-3 justify-center" dir="ltr">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            id={`otp-reset-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            disabled={isLoading}
                            autoFocus={index === 0}
                            className="w-16 h-16 text-center text-2xl font-black border-2 border-slate-200 rounded-2xl focus:border-brand outline-none transition-all disabled:opacity-50"
                        />
                    ))}
                </div>
            </div>

            <div className="text-center mb-6">
                {!canResend ? (
                    <p className="text-sm text-slate-500 font-bold">
                        إعادة الإرسال خلال <span className="font-black text-brand">{formatTime(timeLeft)}</span>
                    </p>
                ) : (
                    <button
                        onClick={handleResend}
                        disabled={isLoading}
                        className="text-sm font-black text-brand hover:text-brand-dark transition-all disabled:opacity-50 underline underline-offset-4 decoration-brand/20"
                    >
                        إعادة إرسال الرمز
                    </button>
                )}
            </div>

            <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSubmit()}
                disabled={isLoading || otp.join('').length !== 4}
                className="w-full py-4 bg-brand text-white rounded-2xl font-black hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
                <CheckCircle size={22} />
                {isLoading ? 'جاري التحقق...' : 'تأكيد الرمز'}
            </motion.button>

            <div className="mt-8 text-center">
                <Link to="/forgot-password" className="text-slate-500 text-sm hover:text-brand transition-all flex items-center justify-center gap-2 font-bold">
                    <ArrowLeft size={16} className="rotate-180" />
                    العودة لصفحة نسيت كلمة المرور
                </Link>
            </div>
        </div>
    );
};

export default VerifyOtpReset;
