import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Phone, User, CheckCircle, MapPin, Upload, X, Navigation, AlertCircle, Image as ImageIcon, ArrowRight, Lock, Map } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PhoneInput from '../../Components/PhoneInput';
import PasswordInput from '../../Components/PasswordInput';
import LeafletMap from '../../Components/LeafletMap';
import Button from '../../Components/Button';


const StoreRegister = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [governorates, setGovernorates] = useState([]);
    const [areas, setAreas] = useState([]);
    const [showMap, setShowMap] = useState(false);
    const [mapCenter, setMapCenter] = useState([33.3152, 44.3661]); // Baghdad default
    const [markerPosition, setMarkerPosition] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        phoneData: { value: '', fullNumber: null, countryCode: '+963', isValid: false },
        store_name: '',
        store_description: '',
        store_image: null,
        store_image_preview: null,
        category_id: '',
        governorate_id: '',
        area_id: '',
        address_details: '',
        latitude: '',
        longitude: '',
        password: '',
        password_confirmation: '',
    });
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchGovernorates();
        fetchCategories();
    }, []);

    const handleLocationSelect = (lat, lng) => {
        const latitude = lat.toFixed(6);
        const longitude = lng.toFixed(6);

        setFormData(prev => ({
            ...prev,
            latitude,
            longitude,
        }));
        setMarkerPosition([lat, lng]);
        setMapCenter([lat, lng]);
    };

    const fetchGovernorates = async () => {
        try {
            const response = await axios.get('/api/v1/locations/governorates');
            setGovernorates(response.data.data || []);
        } catch (error) {
            console.error('Error fetching governorates:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/v1/stores/categories');
            setCategories(response.data.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
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
        setFormData(prev => ({ ...prev, governorate_id: governorateId, area_id: '' }));
        if (governorateId) {
            fetchAreas(governorateId);
        } else {
            setAreas([]);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && file instanceof Blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    store_image: file,
                    store_image_preview: reader.result,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, store_image: null, store_image_preview: null }));
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('ميزة تحديد الموقع غير مدعومة في متصفحك');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                handleLocationSelect(latitude, longitude);
                setShowMap(true);
                setIsLocating(false);
            },
            (err) => {
                setError('تعذر الحصول على موقعك. الرجاء التأكد من تفعيل خدمات الموقع.');
                setIsLocating(false);
                setShowMap(true);
            },
            { enableHighAccuracy: true }
        );
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

        if (!formData.store_image) {
            setError('يرجى رفع صورة للمتجر');
            setIsLoading(false);
            return;
        }

        if (!formData.governorate_id || !formData.area_id || !formData.category_id) {
            setError('يرجى اختيار المحافظة والمنطقة والفئة');
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            setError('كلمتا المرور غير متطابقتين');
            setIsLoading(false);
            return;
        }

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('phone', formData.phoneData.fullNumber);
            submitData.append('store_name', formData.store_name);
            submitData.append('store_description', formData.store_description);
            submitData.append('store_image', formData.store_image);
            submitData.append('category_id', formData.category_id);
            submitData.append('role', 'store_owner');
            submitData.append('governorate_id', formData.governorate_id);
            submitData.append('area_id', formData.area_id);
            submitData.append('address_details', formData.address_details);
            submitData.append('password', formData.password);
            submitData.append('password_confirmation', formData.password_confirmation);
            if (formData.latitude) submitData.append('latitude', formData.latitude);
            if (formData.longitude) submitData.append('longitude', formData.longitude);

            await axios.post('/api/v1/auth/register', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Save phone and role to localStorage for OTP page
            localStorage.setItem('temp_phone', formData.phoneData.fullNumber);
            localStorage.setItem('temp_role', 'store_owner');

            // Redirect to OTP page using hard navigation
            window.location.href = '/verify-otp';
        } catch (err) {
            setError(err.response?.data?.message || 'فشل إرسال الطلب. يرجى مراجعة البيانات.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full" dir="rtl">
            {/* Info Banner */}
            <div className="p-5 bg-brand/5 border border-brand/10 rounded-3xl mb-8">
                <div className="flex items-start gap-3">
                    <AlertCircle className="text-brand flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-sm font-black text-brand">ملاحظة هامة</p>
                        <p className="text-[11px] text-brand-dark mt-1 font-bold leading-relaxed">
                            بعد إكمال التسجيل، سيتم مراجعة طلبك ومتجرك من قبل الإدارة. ستحصل على إشعار عند الموافقة.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium mb-6 flex items-center gap-2">
                    <AlertCircle size={18} />
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
                {/* Owner Info */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-lg">
                        <User size={18} className="text-brand" />
                        معلومات صاحب المتجر
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الكامل</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-6 py-4 bg-white border-2 border-transparent rounded-2xl focus:border-brand outline-none transition-all font-bold" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label>
                            <PhoneInput className={`bg-white`} value={formData.phoneData.value} onChange={(data) => setFormData({ ...formData, phoneData: data })} error={error && !formData.phoneData.isValid ? 'رقم الهاتف غير صحيح' : null} defaultCountry="+963" />
                        </div>
                    </div>
                </div>

                {/* Store Info */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-lg">
                        <Store size={18} className="text-brand" />
                        معلومات المتجر
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">اسم المتجر</label>
                            <input type="text" value={formData.store_name} onChange={(e) => setFormData({ ...formData, store_name: e.target.value })} required className="w-full px-6 py-4 bg-white border-2 border-transparent rounded-2xl focus:border-brand outline-none transition-all font-bold" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">وصف المتجر</label>
                            <textarea value={formData.store_description} onChange={(e) => setFormData({ ...formData, store_description: e.target.value })} required rows={3} className="w-full px-6 py-4 bg-white border-2 border-transparent rounded-2xl focus:border-brand outline-none transition-all resize-none font-bold" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">فئة المتجر</label>
                            <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} required className="w-full px-6 py-4 bg-white border-2 border-transparent rounded-2xl focus:border-brand outline-none font-bold cursor-pointer">
                                <option value="">اختر الفئة</option>
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name_ar}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">صورة المتجر</label>
                            <div className="flex items-center gap-4">
                                {formData.store_image_preview ? (
                                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200">
                                        <img src={formData.store_image_preview} className="w-full h-full object-cover" />
                                        <Button variant="unstyled" type="button" onClick={handleRemoveImage} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"><X size={14} /></Button>
                                    </div>
                                ) : (
                                    <label className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-brand/5">
                                        <Upload className="text-slate-400 mb-1" size={24} />
                                        <span className="text-[10px] text-slate-500 font-bold">رفع صورة</span>
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-lg">
                        <MapPin size={18} className="text-brand" />
                        موقع المتجر
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">المحافظة</label>
                                <select value={formData.governorate_id} onChange={handleGovernorateChange} required className="w-full px-4 py-3 bg-white border-2 border-transparent rounded-xl focus:border-brand outline-none font-bold">
                                    <option value="">اختر المحافظة</option>
                                    {governorates.map(gov => <option key={gov.id} value={gov.id}>{gov.name_ar}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">المنطقة</label>
                                <select value={formData.area_id} onChange={(e) => setFormData({ ...formData, area_id: e.target.value })} required disabled={!formData.governorate_id} className="w-full px-4 py-3 bg-white border-2 border-transparent rounded-xl focus:border-brand outline-none disabled:opacity-50 font-bold">
                                    <option value="">اختر المنطقة</option>
                                    {areas.map(area => <option key={area.id} value={area.id}>{area.name_ar}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">العنوان التفصيلي</label>
                            <textarea value={formData.address_details} onChange={(e) => setFormData({ ...formData, address_details: e.target.value })} required rows={3} className="w-full px-6 py-4 bg-white border-2 border-transparent rounded-2xl focus:border-brand outline-none resize-none font-bold" />
                        </div>

                        <div className="border-t border-slate-200 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-bold text-slate-700">حدد الموقع على الخريطة</label>
                                <div className="flex items-center gap-2">
                                    <Button variant="unstyled" type="button" disabled={isLocating} onClick={handleGetCurrentLocation} className={`text-xs text-white font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand/20 transition-all ${isLocating ? 'bg-slate-400 cursor-wait' : 'bg-brand hover:bg-brand-dark'}`}><Navigation size={14} className={isLocating ? 'animate-pulse' : ''} /> {isLocating ? 'جاري التحديد...' : 'موقعي الحالي'}</Button>
                                    <Button variant="unstyled" type="button" onClick={() => setShowMap(!showMap)} className="text-xs text-brand font-bold flex items-center gap-1"><Map size={14} /> {showMap ? 'إخفاء الخريطة' : 'عرض الخريطة'}</Button>
                                </div>
                            </div>

                            {showMap && (
                                <div className="mb-3">
                                    <LeafletMap
                                        center={mapCenter}
                                        markerPosition={markerPosition}
                                        onLocationSelect={handleLocationSelect}
                                        height="300px"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">خط العرض</label><input type="text" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold" /></div>
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">خط الطول</label><input type="text" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold" /></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <h3 className="font-black text-slate-900 flex items-center gap-2 text-lg"><Lock size={18} className="text-brand" /> كلمة المرور</h3>
                    <PasswordInput className="bg-white" value={formData.password} onChange={(value) => setFormData({ ...formData, password: value })} placeholder="كلمة المرور" showStrength={true} />
                    <PasswordInput className="bg-white" value={formData.password_confirmation} onChange={(value) => setFormData({ ...formData, password_confirmation: value })} placeholder="تأكيد كلمة المرور" />
                </div>

                <motion.button whileHover={{ scale: 1.01 }} type="submit" disabled={isLoading} className="w-full py-4 bg-brand text-white rounded-2xl font-black shadow-xl shadow-brand/20 disabled:opacity-50 text-lg flex items-center justify-center gap-3">
                    <Store size={22} /> {isLoading ? 'جاري الإرسال...' : 'إرسال طلب التسجيل'}
                </motion.button>
            </form>

            <div className="mt-8 text-center space-y-3">
                <p className="text-slate-500 text-sm font-bold">لديك حساب بالفعل؟ <Link to="/login" className="text-brand font-black hover:underline">سجل دخولك</Link></p>
                <p className="text-slate-400 text-xs font-bold"><Link to="/register" className="hover:text-brand transition-all">← العودة لاختيار نوع الحساب</Link></p>
            </div>
        </div>
    );
};

export default StoreRegister;
