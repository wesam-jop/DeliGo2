import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Button from '../../Components/Button';


const VerifyOtp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState(['', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef([]);

    const phone = location.state?.phone || localStorage.getItem('temp_phone');
    const role = location.state?.role || localStorage.getItem('temp_role') || 'customer';
    const mode = location.state?.mode || 'register'; // 'register' or 'reset'

    useEffect(() => {
        if (!phone) {
            navigate('/register');
            return;
        }

        // Focus first input when component mounts
        const focusTimer = setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 300);

        // Countdown timer
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

        return () => {
            clearTimeout(focusTimer);
            clearInterval(timer);
        };
    }, [phone, navigate]);

    const handleOtpChange = (index, value) => {
        if (value.length > 1) value = value.slice(0, 1);

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input after React updates the DOM
        if (value && index < 3) {
            setTimeout(() => {
                inputRefs.current[index + 1]?.focus();
            }, 10);
        }

        // Auto-submit when all fields are filled
        if (newOtp.every(digit => digit !== '')) {
            handleSubmit(newOtp.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async (otpCode = otp.join('')) => {
        if (otpCode.length !== 4) return;

        setIsLoading(true);
        setError('');

        try {
            let endpoint = '/api/v1/auth/verify-otp';
            let payload = { phone: phone, code: otpCode };

            // For password reset, use different endpoint
            if (mode === 'reset') {
                endpoint = '/api/v1/auth/verify-otp-password';
            }

            const response = await axios.post(endpoint, payload);

            setSuccess('تم التحقق بنجاح!');
            localStorage.removeItem('temp_phone');

            setTimeout(() => {
                if (mode === 'reset') {
                    // Go to password reset page
                    navigate('/reset-password', {
                        state: { phone: phone }
                    });
                } else {
                    // Registration flow
                    const userRole = response.data.data?.user?.role || role;

                    if (userRole === 'customer') {
                        navigate('/dashboard/customer');
                    } else if (userRole === 'driver' || userRole === 'store_owner') {
                        navigate('/waiting-approval', { state: { role: userRole } });
                    } else {
                        navigate('/dashboard');
                    }
                }
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'رمز التحقق غير صحيح');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        setIsLoading(true);
        setError('');

        try {
            await axios.post(`/api/v1/auth/otp/resend/${phone}`);
            setSuccess('تم إعادة إرسال رمز التحقق');
            setTimeLeft(120);
            setCanResend(false);

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
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                <div className="w-20 h-20 bg-brand rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand/20">
                    <Mail size={36} className="text-white" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">
                    {mode === 'reset' ? 'أدخل رمز التحقق' : 'التحقق من رقم الهاتف'}
                </h1>
                <p className="text-slate-500 font-bold">
                    {mode === 'reset'
                        ? `أدخل الرمز المرسل إلى`
                        : `أدخل رمز التحقق المرسل إلى`}{' '}
                    <span className="font-black text-brand italic underline decoration-brand/20 underline-offset-4">
                        {phone}
                    </span>
                </p>
                {role !== 'customer' && (
                    <p className="text-xs text-brand font-black mt-2">
                        تسجيل كـ {getRoleText()}
                    </p>
                )}
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
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            disabled={isLoading || (index > 0 && otp[index - 1] === '')}
                            className="w-16 h-16 text-center text-2xl font-black border-2 border-slate-200 rounded-2xl focus:border-brand outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <Button variant="unstyled"
                        onClick={handleResend}
                        disabled={isLoading}
                        className="text-sm font-black text-brand hover:text-brand-dark transition-all disabled:opacity-50 underline underline-offset-4 decoration-brand/20"
                    >
                        إعادة إرسال رمز التحقق
                    </Button>
                )}
            </div>

            <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                onClick={() => handleSubmit()}
                disabled={isLoading || otp.join('').length !== 4}
                className="w-full py-4 bg-brand text-white rounded-2xl font-black hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
                <CheckCircle size={22} />
                {isLoading ? 'جاري التحقق...' : 'تحقق من الرمز'}
            </motion.button>

            <div className="mt-8 text-center">
                <Link to="/register" className="text-slate-500 text-sm hover:text-brand transition-all flex items-center justify-center gap-2 font-bold">
                    <ArrowLeft size={16} className="rotate-180" />
                    العودة للتسجيل
                </Link>
            </div>
        </div>
    );
};

export default VerifyOtp;
