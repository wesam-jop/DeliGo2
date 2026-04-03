import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../Contexts/AuthContext';
import Button from '../../Components/Button';


const VerifyEmail = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        
        if (!token) {
            setStatus('error');
            setMessage('رابط التحقق غير صحيح');
            return;
        }

        verifyToken(token);
    }, [searchParams]);

    const verifyToken = async (token) => {
        try {
            const response = await axios.get('/api/v1/auth/verify-email', {
                params: { token },
            });

            setStatus('success');
            setMessage('تم تفعيل حسابك بنجاح! جاري تحويلك...');
            
            const { user, token: authToken } = response.data.data;
            
            if (user && authToken) {
                // Auto login
                localStorage.setItem('token', authToken);
                axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
                
                setTimeout(() => {
                    if (user.role === 'customer') {
                        navigate('/dashboard/customer');
                    } else if (user.role === 'driver') {
                        if (user.is_approved) {
                            navigate('/dashboard/driver');
                        } else {
                            navigate('/waiting-approval', { state: { role: user.role } });
                        }
                    } else if (user.role === 'store_owner') {
                        if (user.is_approved) {
                            navigate('/dashboard/store');
                        } else {
                            navigate('/waiting-approval', { state: { role: user.role } });
                        }
                    } else {
                        navigate('/dashboard');
                    }
                }, 2000);
            }
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'رابط التحقق غير صحيح أو منتهي الصلاحية');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto min-h-[60vh] flex items-center justify-center">
            {status === 'verifying' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <Loader size={64} className="mx-auto mb-4 text-brand animate-spin" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">جاري التحقق...</h2>
                    <p className="text-slate-500">يرجى الانتظار</p>
                </motion.div>
            )}

            {status === 'success' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <CheckCircle size={48} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">تم التفعيل بنجاح!</h2>
                    <p className="text-slate-500 font-medium">{message}</p>
                </motion.div>
            )}

            {status === 'error' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <XCircle size={48} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">فشل التفعيل</h2>
                    <p className="text-slate-500 font-medium mb-6">{message}</p>
                    <Button variant="unstyled"
                        onClick={() => navigate('/register')}
                        className="px-8 py-3 bg-brand text-white rounded-2xl font-bold hover:bg-pink-600 transition-all"
                    >
                        العودة للتسجيل
                    </Button>
                </motion.div>
            )}
        </div>
    );
};

export default VerifyEmail;
