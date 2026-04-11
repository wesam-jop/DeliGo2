import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Lock, Store, Truck, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PhoneInput from '../../Components/PhoneInput';
import PasswordInput from '../../Components/PasswordInput';
import Button from '../../Components/Button';


const Register = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        phoneData: { value: '', fullNumber: null, countryCode: '+963', isValid: false },
        password: '',
        password_confirmation: '',
        role: 'customer' // Default
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const roles = [
        { id: 'customer', title: 'زبون', icon: User, desc: 'اطلب طعامك المفضل' },
        { id: 'store_owner', title: 'صاحب متجر', icon: Store, desc: 'بع منتجاتك معنا' },
        { id: 'driver', title: 'سائق', icon: Truck, desc: 'انضم لأسطول التوصيل' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!formData.phoneData.isValid || !formData.phoneData.fullNumber) {
            setError('يرجى إدخال رقم هاتف صحيح');
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            setError('كلمتا المرور غير متطابقتين');
            setIsLoading(false);
            return;
        }

        try {
            await axios.post('/api/v1/auth/register', {
                ...formData,
                phone: formData.phoneData.fullNumber
            });
            // Save phone and role to localStorage for OTP page
            localStorage.setItem('temp_phone', formData.phoneData.fullNumber);
            localStorage.setItem('temp_role', formData.role);
            // Redirect to OTP page using hard navigation
            window.location.href = '/verify-otp';
        } catch (err) {
            setError(err.response?.data?.message || 'فشل إنشاء الحساب. يرجى مراجعة البيانات.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">إنشاء حساب جديد</h1>
            <p className="text-slate-500 mb-8 font-medium">انضم إلينا اليوم وابدأ رحلة مميزة.</p>

            {error && (
                <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-sm font-medium mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
                        <label className="block text-sm font-bold text-slate-700">اختر نوع الحساب</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {roles.map((r) => (
                                <Button variant="unstyled"
                                    key={r.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: r.id })}
                                    className={`p-6 rounded-[1.5rem] border-2 text-right transition-all group ${formData.role === r.id
                                            ? 'border-brand bg-pink-50'
                                            : 'border-slate-50 bg-slate-50 hover:border-pink-200'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${formData.role === r.id ? 'bg-brand text-white' : 'bg-white text-slate-400'
                                        }`}>
                                        <r.icon size={24} />
                                    </div>
                                    <h4 className="font-bold text-sm">{r.title}</h4>
                                    <p className="text-[10px] text-slate-400 mt-1">{r.desc}</p>
                                </Button>
                            ))}
                        </div>
                        <Button variant="unstyled"
                            type="button"
                            onClick={() => setStep(2)}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 mt-8"
                        >
                            التالي <ArrowLeft size={18} />
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الكامل</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-brand outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label>
                            <PhoneInput
                                value={formData.phoneData.value}
                                onChange={(data) => setFormData({ ...formData, phoneData: data })}
                                error={error && !formData.phoneData.isValid ? 'رقم الهاتف غير صحيح' : null}
                                placeholder="9XX XXX XXX"
                                defaultCountry="+963"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
                            <PasswordInput
                                value={formData.password}
                                onChange={(value) => setFormData({ ...formData, password: value })}
                                placeholder="••••••••"
                                showStrength={true}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">تأكيد كلمة المرور</label>
                            <PasswordInput
                                value={formData.password_confirmation}
                                onChange={(value) => setFormData({ ...formData, password_confirmation: value })}
                                placeholder="••••••••"
                                error={formData.password !== formData.password_confirmation && formData.password_confirmation ? 'كلمتا المرور غير متطابقتين' : null}
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button variant="unstyled"
                                type="button"
                                onClick={() => setStep(1)}
                                className="py-4 px-6 bg-slate-100 text-slate-600 rounded-2xl font-bold"
                            >
                                <ArrowRight size={20} />
                            </Button>
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                disabled={isLoading}
                                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold"
                            >
                                {isLoading ? 'جاري التحميل...' : 'إنشاء الحساب'}
                            </motion.button>
                        </div>
                    </div>
                )}
            </form>

            <div className="mt-8 text-center text-slate-500 text-sm">
                لديك حساب بالفعل؟ <Link to="/login" className="text-brand font-bold hover:underline">سجل دخولك</Link>
            </div>
        </div>
    );
};

export default Register;
