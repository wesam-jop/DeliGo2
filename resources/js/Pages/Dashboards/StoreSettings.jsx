import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Save, Upload, X, MapPin, Phone, Tag, FileText, Image as ImageIcon, ChevronRight, Map, ExternalLink, CheckCircle, Bell, Share2 } from 'lucide-react';
import axios from 'axios';
import { storeOwnerApi } from '../../Services/storeApi';
import { locationApi, storeApi } from '../../Services/api';
import LeafletMap from '../../Components/LeafletMap';
import Button from '../../Components/Button';


const StoreSettings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [governorates, setGovernorates] = useState([]);
    const [areas, setAreas] = useState([]);
    const [categories, setCategories] = useState([]);
    const [store, setStore] = useState(null);
    const [imageKey, setImageKey] = useState(0); // Key to reset file input
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        category_id: '',
        description: '',
        governorate_id: '',
        area_id: '',
        address_details: '',
        latitude: '',
        longitude: '',
        image: null,
        image_preview: null,
    });
    const [ntfyTopic, setNtfyTopic] = useState('');
    const [testLoading, setTestLoading] = useState(false);
    
    const [mapCenter, setMapCenter] = useState([33.3152, 44.3661]); // Baghdad default
    const [markerPosition, setMarkerPosition] = useState(null);
    const [showMap, setShowMap] = useState(false);

    useEffect(() => {
        fetchGovernorates();
        fetchCategories();
        fetchStore();
        fetchNotificationTopic();
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

    const fetchNotificationTopic = async () => {
        try {
            const response = await axios.get('/api/v1/notifications/topic');
            setNtfyTopic(response.data.data.topic);
        } catch (error) {
            console.error('Error fetching ntfy topic:', error);
        }
    };

    const handleSendTest = async () => {
        try {
            setTestLoading(true);
            await axios.post('/api/v1/notifications/test');
            alert('تم إرسال إشعار تجريبي بنجاح! تحقق من جهازك.');
        } catch (error) {
            console.error('Error sending test notification:', error);
            alert('فشل إرسال الإشعار التجريبي. تأكد من أنك مشترك في القناة.');
        } finally {
            setTestLoading(false);
        }
    };

    const fetchGovernorates = async () => {
        try {
            const response = await locationApi.getGovernorates();
            setGovernorates(response.data.data || []);
        } catch (error) {
            console.error('Error fetching governorates:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await storeApi.getCategories();
            const categoriesData = response.data.data || response.data || [];
            const validCategories = Array.isArray(categoriesData) 
                ? categoriesData.map(cat => ({
                    id: cat.id,
                    name_ar: cat.name_ar || cat.name || 'Unknown',
                }))
                : [];
            setCategories(validCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchAreas = async (governorateId) => {
        try {
            const response = await locationApi.getAreas(governorateId);
            setAreas(response.data.data || []);
        } catch (error) {
            console.error('Error fetching areas:', error);
            setAreas([]);
        }
    };

    const fetchStore = async () => {
        try {
            setLoading(true);
            const response = await storeOwnerApi.getMyStore();
            const storeData = response.data.data;
            setStore(storeData);
            
            if (storeData) {
                const lat = storeData.latitude ? parseFloat(storeData.latitude) : null;
                const lng = storeData.longitude ? parseFloat(storeData.longitude) : null;
                
                setFormData({
                    name: storeData.name || '',
                    phone: storeData.phone || '',
                    category_id: storeData.category_id || '',
                    description: storeData.description || '',
                    governorate_id: storeData.governorate_id || '',
                    area_id: storeData.area_id || '',
                    address_details: storeData.address_details || '',
                    latitude: storeData.latitude || '',
                    longitude: storeData.longitude || '',
                    image: null,
                    image_preview: storeData.image || null,
                });
                
                if (lat && lng) {
                    setMapCenter([lat, lng]);
                    setMarkerPosition([lat, lng]);
                    setShowMap(true);
                }

                if (storeData.governorate_id) {
                    fetchAreas(storeData.governorate_id);
                }
            }
        } catch (error) {
            console.error('Error fetching store:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGovernorateChange = (e) => {
        const governorateId = e.target.value;
        setFormData(prev => ({ 
            ...prev, 
            governorate_id: governorateId,
            area_id: '', 
        }));
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
                    image: file,
                    image_preview: reader.result,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({
            ...prev,
            image: null,
            image_preview: null 
        }));
        setImageKey(prev => prev + 1);
    };

    const handleManualCoordinateChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        const lat = field === 'latitude' ? parseFloat(value) : (formData.latitude ? parseFloat(formData.latitude) : null);
        const lng = field === 'longitude' ? parseFloat(value) : (formData.longitude ? parseFloat(formData.longitude) : null);
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            setMarkerPosition([lat, lng]);
            setMapCenter([lat, lng]);
        }
    };

    const handleGetCurrentLocation = () => {
        // LeafletMap handles geolocation internally
        setShowMap(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('phone', formData.phone);
            submitData.append('category_id', formData.category_id);
            submitData.append('description', formData.description);
            submitData.append('governorate_id', formData.governorate_id);
            submitData.append('area_id', formData.area_id);
            submitData.append('address_details', formData.address_details);
            if (formData.latitude) submitData.append('latitude', formData.latitude);
            if (formData.longitude) submitData.append('longitude', formData.longitude);
            if (formData.image && formData.image instanceof File) {
                submitData.append('image', formData.image);
            }
            await storeOwnerApi.updateStore(store.id, submitData);
            alert('تم تحديث معلومات المتجر بنجاح!');
            fetchStore();
        } catch (error) {
            alert(error.response?.data?.message || 'حدث خطأ أثناء تحديث المتجر');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8" dir="rtl">
            <div className="flex items-center gap-4">
                <Button variant="unstyled" onClick={() => navigate('/dashboard/store')} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight size={24} /></Button>
                <div>
                    <h1 className="text-2xl font-black">إعدادات المتجر</h1>
                    <p className="text-slate-500">عدّل معلومات متجرك وصورة المتجر</p>
                </div>
            </div>

            {store && (
                <div className="bg-gradient-to-br from-brand to-rose-500 p-8 rounded-3xl text-white shadow-xl flex items-center gap-6">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center overflow-hidden">
                        {formData.image_preview ? <img src={formData.image_preview} className="w-full h-full object-cover" /> : store.image ? <img src={store.image} className="w-full h-full object-cover" /> : <span className="text-4xl font-black">{store.name?.charAt(0)}</span>}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black mb-2">{store.name}</h2>
                        <div className="flex items-center gap-4 text-white/90 text-sm">
                            <span className="flex items-center gap-1"><Tag size={14} /> {typeof store.category === 'string' ? store.category : (store.category?.name_ar || 'غير محدد')}</span>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">{store.is_approved ? '✓ معتمد' : 'بانتظار الموافقة'}</span>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-8 rounded-2xl border border-slate-100 premium-shadow">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><FileText className="text-brand" size={20} /> المعلومات الأساسية</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">اسم المتجر *</label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">التصنيف *</label>
                            <select name="category_id" value={formData.category_id} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none">
                                <option value="">اختر التصنيف</option>
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name_ar}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف *</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">وصف المتجر</label>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none resize-none" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-100 premium-shadow">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><MapPin className="text-brand" size={20} /> موقع المتجر</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">المحافظة *</label>
                            <select value={formData.governorate_id} onChange={handleGovernorateChange} required className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none">
                                <option value="">اختر المحافظة</option>
                                {governorates.map(gov => <option key={gov.id} value={gov.id}>{gov.name_ar}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">المنطقة *</label>
                            <select value={formData.area_id} onChange={handleInputChange} name="area_id" required disabled={!formData.governorate_id} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none disabled:opacity-50">
                                <option value="">اختر المنطقة</option>
                                {areas.map(area => <option key={area.id} value={area.id}>{area.name_ar}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">العنوان التفصيلي</label>
                            <textarea name="address_details" value={formData.address_details} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none resize-none" />
                        </div>

                        <div className="md:col-span-2">
                             <div className="flex items-center justify-between mb-4">
                                <label className="block text-sm font-bold text-slate-700">حدد الموقع على الخريطة</label>
                                <div className="flex items-center gap-2">
                                    <Button variant="unstyled" type="button" onClick={handleGetCurrentLocation} className="text-xs bg-brand text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><Navigation size={14} /> موقعي الحالي</Button>
                                    <Button variant="unstyled" type="button" onClick={() => setShowMap(!showMap)} className="text-xs text-brand font-bold flex items-center gap-1"><Map size={14} /> {showMap ? 'إخفاء الخريطة' : 'عرض الخريطة'}</Button>
                                </div>
                            </div>
                            
                            {showMap && (
                                <div className="mb-6">
                                    <LeafletMap
                                        center={mapCenter}
                                        markerPosition={markerPosition}
                                        onLocationSelect={handleLocationSelect}
                                        height="400px"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">خط العرض</label><input type="text" value={formData.latitude} onChange={(e) => handleManualCoordinateChange('latitude', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">خط الطول</label><input type="text" value={formData.longitude} onChange={(e) => handleManualCoordinateChange('longitude', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-100 premium-shadow">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><ImageIcon className="text-brand" size={20} /> صورة المتجر</h3>
                    <div className="flex items-center gap-6">
                        {formData.image_preview ? (
                            <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-2 border-slate-200">
                                <img src={formData.image_preview} className="w-full h-full object-cover" />
                                <Button variant="unstyled" type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"><X size={18} /></Button>
                            </div>
                        ) : (
                            <label className="w-40 h-40 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-brand/5">
                                <Upload className="text-slate-400 mb-2" size={32} />
                                <span className="text-xs text-slate-500 font-medium">اضغط لرفع صورة</span>
                                <input key={imageKey} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                        )}
                        <div className="flex-1 text-sm text-slate-500 space-y-1">
                            <h4 className="font-bold text-slate-900 mb-2">نصائح لصورة أفضل</h4>
                            <li>• استخدم صورة واضحة وعالية الجودة</li>
                            <li>• يفضل أن تكون الصورة مربعة (1:1)</li>
                            <li>• الحد الأقصى للحجم: 2 ميجابايت</li>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 justify-end">
                    <Button variant="unstyled" type="button" onClick={() => navigate('/dashboard/store')} className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold">إلغاء</Button>
                    <Button variant="unstyled" type="submit" disabled={saving} className="px-8 py-3 bg-brand text-white rounded-2xl font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg"><Save size={20} /> {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</Button>
                </div>
            </form>
        </div>
    );
};

export default StoreSettings;
