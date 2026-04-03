import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, LogIn, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Contexts/AuthContext';
import axios from 'axios';
import PhoneInput from '../../Components/PhoneInput';
import PasswordInput from '../../Components/PasswordInput';

const Login = () => {
    const [phoneData, setPhoneData] = useState({ value: '', fullNumber: null, countryCode: '+963', isValid: false });
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
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
            const response = await axios.post('/api/v1/auth/login', {
                phone: phoneData.fullNumber,
                password
            });

            const user = response.data.data.user;

            // Check if phone is verified
            if (!user.phone_verified_at) {
                setError('رقم هاتفك غير مفعل. يرجى تفعيل حسابك أولاً.');
                setTimeout(() => {
                    navigate('/registration-success', {
                        state: { phone: phoneData.fullNumber, role: user.role }
                    });
                }, 2000);
                setIsLoading(false);
                return;
            }

            // Check if driver/store_owner is approved
            if ((user.role === 'driver' || user.role === 'store_owner') && !user.is_approved) {
                login(response.data.data.token, user);
                navigate('/waiting-approval', { state: { role: user.role } });
                return;
            }

            login(response.data.data.token, user);

            // Redirect based on role
            if (user.role === 'customer') {
                navigate('/dashboard/customer');
            } else if (user.role === 'driver') {
                navigate('/dashboard/driver');
            } else if (user.role === 'store_owner') {
                navigate('/dashboard/store');
            } else if (user.role === 'admin') {
                navigate('/dashboard/admin');
            } else {
                navigate('/');
            }

        } catch (err) {
            setError(err.response?.data?.message || 'فشل تسجيل الدخول. يرجى التحقق من بياناتك.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <h1 className="text-4xl font-black text-slate-900 mb-2">تسجيل الدخول</h1>
            <p className="text-slate-500 mb-8 font-bold">أهلاً بك من جديد! يرجى إدخال بياناتك للمتابعة.</p>

            {error && (
                <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-sm font-medium mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label>
                    <PhoneInput
                        value={phoneData.value}
                        onChange={setPhoneData}
                        error={error && !phoneData.isValid ? 'رقم الهاتف غير صحيح' : null}
                        placeholder="9XX XXX XXX"
                        defaultCountry="+963"
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-slate-700">كلمة المرور</label>
                        <Link to="/forgot-password" size="sm" className="text-xs text-brand font-black hover:underline">نسيت كلمة المرور؟</Link>
                    </div>
                    <PasswordInput
                        value={password}
                        onChange={setPassword}
                        placeholder="••••••••"
                    />
                </div>

                <motion.button
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={isLoading}
                    className="w-full py-4 px-4 bg-brand text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                >
                    {isLoading ? 'جاري التحميل...' : (
                        <>
                            تسجيل الدخول <ArrowLeft size={20} className="mr-auto rotate-180" />
                        </>
                    )}
                </motion.button>
            </form>

            <div className="mt-10 text-center text-slate-500 text-sm font-bold">
                ليس لديك حساب؟ <Link to="/register" className="text-brand font-black hover:underline">أنشئ حساباً جديداً</Link>
            </div>
        </div>
    );
};

export default Login;
