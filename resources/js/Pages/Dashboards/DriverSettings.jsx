import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Upload, X, User, Phone, MapPin, ChevronRight, AlertCircle, Image as ImageIcon, Bell, Share2, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { driverApi } from '../../Services/driverApi';
import { locationApi } from '../../Services/api';
import { useAuth } from '../../Contexts/AuthContext';
import Button from '../../Components/Button';


const DriverSettings = () => {
    const navigate = useNavigate();
    const { user, fetchUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [governorates, setGovernorates] = useState([]);
    const [areas, setAreas] = useState([]);
    const [driver, setDriver] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        governorate_id: '',
        area_id: '',
        profile_image: null,
        profile_image_preview: null,
    });
    const [ntfyTopic, setNtfyTopic] = useState('');
    const [testLoading, setTestLoading] = useState(false);

    useEffect(() => {
        fetchGovernorates();
        fetchDriverProfile();
        fetchNotificationTopic();
    }, []);

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

    const fetchAreas = async (governorateId) => {
        try {
            const response = await locationApi.getAreas(governorateId);
            setAreas(response.data.data || []);
        } catch (error) {
            console.error('Error fetching areas:', error);
            setAreas([]);
        }
    };

    const fetchDriverProfile = async () => {
        try {
            setLoading(true);
            const response = await driverApi.getProfile();
            const driverData = response.data.data;
            setDriver(driverData);
            
            setFormData({
                name: driverData.name || '',
                phone: driverData.phone || '',
                governorate_id: driverData.governorate_id || '',
                area_id: driverData.area_id || '',
                profile_image: null,
                profile_image_preview: driverData.profile_image || null,
            });

            // Fetch areas for selected governorate
            if (driverData.governorate_id) {
                fetchAreas(driverData.governorate_id);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
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
            area_id: '', // Reset area when governorate changes
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
                    profile_image: file,
                    profile_image_preview: reader.result,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({ 
            ...prev, 
            profile_image: null, 
            profile_image_preview: driver?.profile_image || null 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            
            // Use FormData for image upload
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('phone', formData.phone);
            submitData.append('governorate_id', formData.governorate_id);
            submitData.append('area_id', formData.area_id);
            
            if (formData.profile_image && formData.profile_image instanceof File) {
                submitData.append('profile_image', formData.profile_image);
            }

            // Update profile via API
            const response = await driverApi.updateProfile(submitData);
            
            // Refresh user data in auth context
            await fetchUser();
            
            alert('تم تحديث بياناتك بنجاح!');
            fetchDriverProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
            const message = error.response?.data?.message || error.message || 'حدث خطأ أثناء تحديث البيانات';
            alert(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="unstyled"
                    onClick={() => navigate('/dashboard/driver')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                >
                    <ChevronRight size={24} className="text-slate-400" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">إعدادات السائق</h1>
                    <p className="text-slate-500 mt-1 font-medium">عدّل معلوماتك الشخصية وموقعك</p>
                </div>
            </div>

            {/* Driver Info Card */}
            {driver && (
                <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-8 rounded-3xl text-white shadow-xl">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center overflow-hidden relative">
                            {formData.profile_image_preview ? (
                                <img src={formData.profile_image_preview} alt={driver.name} className="w-full h-full object-cover" />
                            ) : driver.profile_image ? (
                                <img src={driver.profile_image} alt={driver.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-black">{driver.name?.charAt(0) || 'D'}</span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black mb-2">{driver.name}</h2>
                            <div className="flex items-center gap-4 text-white/90 text-sm">
                                <span className="flex items-center gap-1">
                                    <Phone size={14} />
                                    {driver.phone || 'غير محدد'}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    driver.is_approved ? 'bg-white/20' : 'bg-amber-500/50'
                                }`}>
                                    {driver.is_approved ? '✓ معتمد' : 'بانتظار الموافقة'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Approval Alert */}
            {driver && !driver.is_approved && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 flex items-start gap-4">
                    <AlertCircle className="text-amber-500 flex-shrink-0" size={24} />
                    <div>
                        <h3 className="font-bold text-amber-800">حسابك بانتظار الموافقة</h3>
                        <p className="text-amber-600 text-sm mt-1">
                            سيتم مراجعة بياناتك من قبل الإدارة. ستتمكن من استقبال الطلبات بعد الموافقة.
                        </p>
                    </div>
                </div>
            )}

            {/* Settings Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Image */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 premium-shadow">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <ImageIcon className="text-brand" size={20} />
                        الصورة الشخصية
                    </h3>

                    <div className="flex items-center gap-6">
                        {formData.profile_image_preview ? (
                            <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-200 premium-shadow">
                                <img 
                                    src={formData.profile_image_preview} 
                                    alt="Profile Preview"
                                    className="w-full h-full object-cover"
                                />
                                <Button variant="unstyled"
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg"
                                >
                                    <X size={18} />
                                </Button>
                            </div>
                        ) : (
                            <label className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-pink-50 transition-all">
                                <Upload className="text-slate-400 mb-2" size={32} />
                                <span className="text-xs text-slate-500 font-medium text-center px-2">اضغط لرفع صورة</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-900 mb-2">نصائح لصورة أفضل</h4>
                            <ul className="text-sm text-slate-500 space-y-1">
                                <li>• استخدم صورة شخصية واضحة</li>
                                <li>• يفضل أن تكون الصورة مربعة (1:1)</li>
                                <li>• الحد الأقصى للحجم: 2 ميجابايت</li>
                                <li>• الصيغ المقبولة: JPG, PNG, WEBP</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 premium-shadow">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <User className="text-brand" size={20} />
                        المعلومات الشخصية
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                الاسم الكامل *
                            </label>
                            <div className="relative">
                                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="مثال: محمد أحمد"
                                    className="w-full pr-12 pl-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                رقم الهاتف *
                            </label>
                            <div className="relative">
                                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="07xxxxxxxxx"
                                    className="w-full pr-12 pl-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand outline-none transition-all"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                سيتم استخدام هذا الرقم للتواصل معك بشأن الطلبات
                            </p>
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 premium-shadow">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <MapPin className="text-brand" size={20} />
                        موقع العمل
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Governorate */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                المحافظة *
                            </label>
                            <select
                                value={formData.governorate_id}
                                onChange={handleGovernorateChange}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">اختر المحافظة</option>
                                {governorates.map(gov => (
                                    <option key={gov.id} value={gov.id}>
                                        {gov.name_ar}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Area */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                المنطقة *
                            </label>
                            <select
                                value={formData.area_id}
                                onChange={handleInputChange}
                                required
                                disabled={!formData.governorate_id}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">اختر المنطقة</option>
                                {areas.map(area => (
                                    <option key={area.id} value={area.id}>
                                        {area.name_ar}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-sm text-blue-700 font-medium flex items-start gap-2">
                                    <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                                    سيتم عرض الطلبات المتاحة في منطقتك والمناطق القريبة فقط
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 premium-shadow">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Bell className="text-brand" size={20} />
                            إشعارات الجوال والمتصفح
                        </h3>
                        {ntfyTopic && (
                            <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full font-black text-slate-500 uppercase tracking-widest">
                                NTFY.SH INTEGRATED
                            </span>
                        )}
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-900 mb-2">قناتك الخاصة للإشعارات</h4>
                                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                                    نحن نستخدم خدمة <span className="font-bold text-slate-900 underline">ntfy.sh</span> لإرسال إشعارات فورية لهاتفك أو متصفحك. 
                                    قم بالاشتراك في هذه القناة لتلقي إشعارات الطلبات الجديدة في منطقتك فوراً:
                                </p>
                                
                                <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
                                    <code className="text-brand font-black text-xs md:text-sm truncate select-all">{ntfyTopic || 'جاري التحميل...'}</code>
                                    <Button variant="unstyled" 
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(ntfyTopic);
                                            alert('تم نسخ اسم القناة!');
                                        }}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                                        title="Copy Topic"
                                    >
                                        <Share2 size={16} />
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <a 
                                        href={`https://ntfy.sh/${ntfyTopic}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                    >
                                        <ExternalLink size={14} />
                                        فتح القناة في المتصفح
                                    </a>
                                    <Button variant="unstyled"
                                        type="button"
                                        onClick={handleSendTest}
                                        disabled={testLoading || !ntfyTopic}
                                        className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
                                    >
                                        {testLoading ? 'جاري الإرسال...' : 'إرسال إشعار تجريبي'}
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="w-full md:w-32 bg-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center shadow-sm">
                                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-3">
                                    <Bell size={24} />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">الحالة</p>
                                <p className="text-xs font-black text-emerald-500 mt-1">نشط</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-4 justify-end">
                    <Button variant="unstyled"
                        type="button"
                        onClick={() => navigate('/dashboard/driver')}
                        className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                        إلغاء
                    </Button>
                    <Button variant="unstyled"
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-gradient-to-r from-brand to-rose-500 text-white rounded-2xl font-bold flex items-center gap-2 hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={20} />
                        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default DriverSettings;
