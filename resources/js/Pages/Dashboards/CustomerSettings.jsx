import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Upload, X, User, Phone, MapPin, ChevronRight, AlertCircle, Image as ImageIcon, Bell, Share2, ExternalLink } from 'lucide-react';
import { customerApi } from '../../Services/customerApi';
import { locationApi } from '../../Services/api';
import { useAuth } from '../../Contexts/AuthContext';
import Button from '../../Components/Button';


const CustomerSettings = () => {
    const navigate = useNavigate();
    const { user, fetchUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [governorates, setGovernorates] = useState([]);
    const [areas, setAreas] = useState([]);
    const [customer, setCustomer] = useState(null);
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
        fetchCustomerProfile();
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
            console.log('Fetching areas for governorate:', governorateId);
            const response = await locationApi.getAreas(governorateId);
            const areasData = response.data.data || [];
            console.log('Areas loaded:', areasData);
            setAreas(areasData);
        } catch (error) {
            console.error('Error fetching areas:', error);
            setAreas([]);
        }
    };

    const fetchCustomerProfile = async () => {
        try {
            setLoading(true);
            const response = await customerApi.getProfile();
            const customerData = response.data.data;
            setCustomer(customerData);
            
            setFormData({
                name: customerData.name || '',
                phone: customerData.phone || '',
                governorate_id: customerData.governorate_id || '',
                area_id: customerData.area_id || '',
                profile_image: null,
                profile_image_preview: customerData.profile_image || null,
            });

            // Fetch areas for selected governorate
            if (customerData.governorate_id) {
                fetchAreas(customerData.governorate_id);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(`Input changed: ${name} = ${value}`);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGovernorateChange = (e) => {
        const governorateId = e.target.value;
        console.log('Governorate changed to:', governorateId);
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
            profile_image_preview: customer?.profile_image || null 
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
            const response = await customerApi.updateProfile(submitData);
            
            // Refresh user data in auth context
            await fetchUser();
            
            alert('تم تحديث بياناتك بنجاح!');
            fetchCustomerProfile();
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
                    onClick={() => navigate('/dashboard/customer')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                >
                    <ChevronRight size={24} className="text-slate-400" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900">إعدادات الحساب</h1>
                    <p className="text-slate-500 mt-1 font-medium">عدّل معلوماتك الشخصية</p>
                </div>
            </div>

            {/* Customer Info Card */}
            {customer && (
                <div className="bg-gradient-to-br from-brand to-rose-500 p-8 rounded-3xl text-white shadow-xl">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center overflow-hidden relative">
                            {formData.profile_image_preview ? (
                                <img src={formData.profile_image_preview} alt={customer.name} className="w-full h-full object-cover" />
                            ) : customer.profile_image ? (
                                <img src={customer.profile_image} alt={customer.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-black">{customer.name?.charAt(0) || 'C'}</span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black mb-2">{customer.name}</h2>
                            <div className="flex items-center gap-4 text-white/90 text-sm">
                                <span className="flex items-center gap-1">
                                    <Phone size={14} />
                                    {customer.phone || 'غير محدد'}
                                </span>
                            </div>
                        </div>
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
                                سيتم استخدام هذا الرقم للتواصل معك بشأن طلباتك
                            </p>
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 premium-shadow">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <MapPin className="text-brand" size={20} />
                        موقع السكن
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Governorate */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                المحافظة *
                            </label>
                            <select
                                name="governorate_id"
                                value={formData.governorate_id || ''}
                                onChange={(e) => {
                                    const governorateId = e.target.value;
                                    console.log('Governorate changed to:', governorateId);
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
                                }}
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
                            {governorates.length === 0 && (
                                <p className="text-xs text-amber-600 mt-2 font-bold flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    لا توجد محافظات متاحة. يرجى التواصل مع الإدارة.
                                </p>
                            )}
                        </div>

                        {/* Area */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                المنطقة *
                            </label>
                            <select
                                name="area_id"
                                value={formData.area_id || ''}
                                onChange={(e) => {
                                    const areaId = e.target.value;
                                    console.log('Area changed to:', areaId);
                                    setFormData(prev => ({ ...prev, area_id: areaId }));
                                }}
                                required
                                disabled={!formData.governorate_id || areas.length === 0}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">اختر المنطقة</option>
                                {areas.map(area => (
                                    <option key={area.id} value={area.id}>
                                        {area.name_ar}
                                    </option>
                                ))}
                            </select>
                            {formData.governorate_id && areas.length === 0 && (
                                <p className="text-xs text-amber-600 mt-2 font-bold">
                                    لا توجد مناطق في هذه المحافظة
                                </p>
                            )}
                        </div>

                        {/* Info Box */}
                        <div className="md:col-span-2">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-sm text-blue-700 font-medium flex items-start gap-2">
                                    <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                                    سيتم استخدام هذا الموقع لعرض المتاجر المتاحة واقتراح أجرة التوصيل
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
                                    نحن نستخدم خدمة <span className="font-bold text-slate-900 underline">ntfy.sh</span> لإرسال إشعارات فورية لمتصفحك أو هاتفك. 
                                    قم بالاشتراك في القناة التالية لتلقي إشعارات الطلبات والرسائل الجديدة:
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
                                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-3">
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
                        onClick={() => navigate('/dashboard/customer')}
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

export default CustomerSettings;
