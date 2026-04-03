import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, ArrowLeft, Truck, Store } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Contexts/AuthContext';
import axios from 'axios';
import Button from '../../Components/Button';


const WaitingApproval = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [approvalStatus, setApprovalStatus] = useState('pending');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const role = location.state?.role || user?.role;

    useEffect(() => {
        if (!user || !role) {
            navigate('/login');
            return;
        }

        if (user.is_approved) {
            if (role === 'driver') {
                navigate('/dashboard/driver');
            } else if (role === 'store_owner') {
                navigate('/dashboard/store');
            }
            return;
        }

        checkApprovalStatus();
        const interval = setInterval(checkApprovalStatus, 5000); // Check every 5 seconds
        return () => clearInterval(interval);
    }, [user, role, navigate]);

    const checkApprovalStatus = async () => {
        try {
            const response = await axios.get('/api/v1/auth/me');
            const userData = response.data.data?.user || response.data.data;
            
            if (userData.is_approved) {
                setApprovalStatus('approved');
                setTimeout(() => {
                    if (userData.role === 'driver') {
                        navigate('/dashboard/driver');
                    } else if (userData.role === 'store_owner') {
                        navigate('/dashboard/store');
                    }
                }, 2000);
            } else if (userData.rejection_reason) {
                setApprovalStatus('rejected');
                setRejectionReason(userData.rejection_reason);
            }
        } catch (error) {
            console.error('Error checking approval status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            {approvalStatus === 'approved' ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <CheckCircle size={48} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">تمت الموافقة على حسابك!</h1>
                    <p className="text-slate-500 font-bold mb-6 italic">
                        جاري تحويلك للوحة التحكم الآن...
                    </p>
                </motion.div>
            ) : approvalStatus === 'rejected' ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-3xl border border-red-100 premium-shadow"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <AlertCircle size={48} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-4 text-center">تم رفض الطلب</h1>
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
                        <p className="text-sm font-bold text-red-800 mb-2">سبب الرفض:</p>
                        <p className="text-red-600">{rejectionReason}</p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="unstyled"
                            onClick={handleLogout}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                        >
                            تسجيل الخروج
                        </Button>
                        <Link
                            to="/register"
                            className="flex-1 py-4 bg-brand text-white rounded-2xl font-black hover:bg-brand-dark transition-all text-center shadow-lg shadow-brand/20"
                        >
                            تسجيل جديد
                        </Link>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-3xl border border-slate-100 premium-shadow"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <Clock size={48} className="text-white" />
                    </div>
                    
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black text-slate-900 mb-2">
                            طلبك قيد المراجعة
                        </h1>
                        <p className="text-slate-500 font-bold">
                            {role === 'driver' ? (
                                <>
                                    تم إرسال طلبك للانضمام كـ <span className="font-black text-brand italic underline decoration-brand/20 underline-offset-4">سائق توصيل</span>
                                </>
                            ) : (
                                <>
                                    تم إرسال طلب متجرك كـ <span className="font-black text-brand italic underline decoration-brand/20 underline-offset-4">صاحب متجر</span>
                                </>
                            )}
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                {role === 'driver' ? (
                                    <Truck size={24} className="text-brand" />
                                ) : (
                                    <Store size={24} className="text-brand" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">
                                    {role === 'driver' ? 'سائق التوصيل' : 'صاحب المتجر'}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    {user?.name}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {user?.phone}
                                </p>
                            </div>
                        </div>
                        
                        <div className="border-t border-slate-200 pt-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Clock size={16} className="text-amber-500" />
                                <span className="font-black">حالة الطلب:</span>
                                <span className="font-black text-white bg-brand px-4 py-1.5 rounded-full text-[10px] shadow-sm shadow-brand/20">
                                    بانتظار موافقة الإدارة
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand/5 border border-brand/10 rounded-2xl p-5 mb-8">
                        <p className="text-sm font-black text-brand mb-2">💡 ماذا يحدث الآن؟</p>
                        <ul className="text-xs text-brand-dark space-y-2 font-bold">
                            <li>• سيقوم فريق المراجعة بفحص طلبك خلال 24-48 ساعة</li>
                            <li>• ستحصل على إشعار فوري عند الموافقة على حسابك</li>
                            <li>• يمكنك العودة لهذه الصفحة في أي وقت للتحقق من الحالة</li>
                        </ul>
                    </div>

                    <div className="flex gap-4">
                        <Button variant="unstyled"
                            onClick={handleLogout}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={18} className="rotate-180" />
                            تسجيل الخروج
                        </Button>
                        <Button variant="unstyled"
                            onClick={checkApprovalStatus}
                            className="flex-1 py-4 bg-brand text-white rounded-2xl font-black hover:bg-brand-dark transition-all shadow-xl shadow-brand/20"
                        >
                            تحديث الحالة
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default WaitingApproval;
