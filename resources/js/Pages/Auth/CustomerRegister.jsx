import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Lock, CheckCircle, ArrowLeft, MapPin, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PhoneInput from '../../Components/PhoneInput';
import PasswordInput from '../../Components/PasswordInput';
import Button from '../../Components/Button';


const CustomerRegister = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [governorates, setGovernorates] = useState([]);
    const [areas, setAreas] = useState([]);
    
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        phoneData: { value: '', fullNumber: null, countryCode: '+963', isValid: false },
        password: '',
        password_confirmation: '',
        governorate_id: '',
        area_id: '',
    });

    useEffect(() => {
        fetchGovernorates();
    }, []);

    const fetchGovernorates = async () => {
        try {
            const response = await axios.get('/api/v1/locations/governorates');
            setGovernorates(response.data.data || []);
        } catch (error) {
            console.error('Error fetching governorates:', error);
        }
    };

    const fetchAreas = async (governorateId) => {
        try {
            const response = await axios.get(`/api/v1/locations/governorates/${governorateId}`);
            setAreas(response.data.data?.areas || []);
        } catch (error) {
            console.error('Error fetching areas:', error);
            setAreas([]);
        }
    };

    const handleGovernorateChange = (e) => {
        const governorateId = e.target.value;
        setFormData(prev => ({ ...prev, governorate_id: governorateId }));
        if (governorateId) {
            fetchAreas(governorateId);
        } else {
            setAreas([]);
        }
    };

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

        if (!formData.governorate_id || !formData.area_id) {
            setError('يرجى اختيار المحافظة والمنطقة');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post('/api/v1/auth/register', {
                name: formData.name,
                phone: formData.phoneData.fullNumber,
                password: formData.password,
                password_confirmation: formData.password_confirmation,
                role: 'customer',
                governorate_id: formData.governorate_id,
                area_id: formData.area_id,
            });

            // Redirect to OTP page
            navigate('/verify-otp', {
                state: {
                    phone: formData.phoneData.fullNumber,
                    role: 'customer'
                }
            });
        } catch (err) {
            setError(err.response?.data?.message || 'فشل إنشاء الحساب. يرجى مراجعة البيانات.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-center gap-2">
                    {[1, 2].map((s) => (
                        <React.Fragment key={s}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
                                step >= s ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-slate-200 text-slate-500'
                            }`}>
                                {s}
                            </div>
                            {s < 2 && <div className={`w-12 h-1.5 rounded-full ${step > s ? 'bg-brand' : 'bg-slate-200'}`} />}
                        </React.Fragment>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-xs font-bold text-slate-500">
                    <span>المعلومات الأساسية</span>
                    <span>موقعك</span>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium mb-6 flex items-center gap-2">
                    <CheckCircle size={18} />
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-medium mb-6 flex items-center gap-2">
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 ? (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                <User size={16} className="inline ml-1" />
                                الاسم الكامل
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                                placeholder="مثال: محمد أحمد"
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-brand outline-none transition-all font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                <Phone size={16} className="inline ml-1" />
                                رقم الهاتف
                            </label>
                            <PhoneInput
                                value={formData.phoneData.value}
                                onChange={(data) => setFormData({...formData, phoneData: data})}
                                error={error && !formData.phoneData.isValid ? 'رقم الهاتف غير صحيح' : null}
                                placeholder="7XX XXX XXXX"
                                defaultCountry="+963"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                <Lock size={16} className="inline ml-1" />
                                كلمة المرور
                            </label>
                            <PasswordInput
                                value={formData.password}
                                onChange={(value) => setFormData({...formData, password: value})}
                                placeholder="••••••••"
                                showStrength={true}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                <Lock size={16} className="inline ml-1" />
                                تأكيد كلمة المرور
                            </label>
                            <PasswordInput
                                value={formData.password_confirmation}
                                onChange={(value) => setFormData({...formData, password_confirmation: value})}
                                placeholder="••••••••"
                                error={formData.password !== formData.password_confirmation && formData.password_confirmation ? 'كلمتا المرور غير متطابقتين' : null}
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01, y: -2 }}
                            type="button"
                            onClick={() => setStep(2)}
                            className="w-full py-4 bg-brand text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-brand/20 text-lg"
                        >
                            التالي <ArrowLeft size={18} />
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <div className="p-5 bg-brand/5 border border-brand/10 rounded-2xl">
                            <p className="text-sm font-black text-brand mb-1">📍 موقعك مهم!</p>
                            <p className="text-xs text-brand-dark font-bold leading-relaxed">نستخدم موقعك لعرض المتاجر المتاحة واقتراح أجرة التوصيل الصحيحة</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                <MapPin size={16} className="inline ml-1" />
                                المحافظة
                            </label>
                            <select
                                value={formData.governorate_id}
                                onChange={handleGovernorateChange}
                                required
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-brand outline-none transition-all appearance-none cursor-pointer font-bold"
                            >
                                <option value="">اختر المحافظة</option>
                                {governorates.map(gov => (
                                    <option key={gov.id} value={gov.id}>{gov.name_ar}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                <MapPin size={16} className="inline ml-1" />
                                المنطقة
                            </label>
                            <select
                                value={formData.area_id}
                                onChange={(e) => setFormData({...formData, area_id: e.target.value})}
                                required
                                disabled={!formData.governorate_id}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-brand outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                            >
                                <option value="">اختر المنطقة</option>
                                {areas.map(area => (
                                    <option key={area.id} value={area.id}>{area.name_ar}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-4">
                            <Button variant="unstyled"
                                type="button"
                                onClick={() => setStep(1)}
                                className="py-4 px-6 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                            >
                                <ArrowRight size={20} />
                            </Button>
                            <motion.button
                                whileHover={{ scale: 1.01, y: -2 }}
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 py-4 bg-brand text-white rounded-2xl font-black hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                            >
                                {isLoading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </form>

            <div className="mt-8 text-center">
                <p className="text-slate-500 text-sm font-bold">
                    لديك حساب بالفعل؟{' '}
                    <Link to="/login" className="text-brand font-black hover:underline">سجل دخولك</Link>
                </p>
                <p className="text-slate-400 text-xs mt-3 font-bold">
                    <Link to="/register" className="hover:text-brand transition-all">← العودة لاختيار نوع الحساب</Link>
                </p>
            </div>
        </div>
    );
};

export default CustomerRegister;
