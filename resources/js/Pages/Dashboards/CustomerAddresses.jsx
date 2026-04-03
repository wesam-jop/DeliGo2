import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Home, Check, X, Phone, Navigation, Map } from 'lucide-react';
import { customerApi } from '../../Services/customerApi';
import { locationApi } from '../../Services/api';
import LeafletMap from '../../Components/LeafletMap';
import Button from '../../Components/Button';

const CustomerAddresses = () => {
    const [loading, setLoading] = useState(true);
    const [addresses, setAddresses] = useState([]);
    const [governorates, setGovernorates] = useState([]);
    const [areas, setAreas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [mapCenter, setMapCenter] = useState([33.3152, 44.3661]);
    const [markerPosition, setMarkerPosition] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [formData, setFormData] = useState({
        label: '',
        governorate_id: '',
        area_id: '',
        address_details: '',
        is_default: false,
        latitude: '',
        longitude: '',
    });

    useEffect(() => {
        fetchAddresses();
        fetchGovernorates();
    }, []);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const response = await customerApi.getAddresses();
            setAddresses(response.data.data || []);
        } catch (error) {
            console.error('Error fetching addresses:', error);
        } finally {
            setLoading(false);
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

    const handleOpenModal = (address = null) => {
        if (address) {
            setEditingAddress(address);
            setFormData({
                label: address.label || '',
                governorate_id: address.governorate_id || '',
                area_id: address.area_id || '',
                address_details: address.address_details || '',
                is_default: address.is_default || false,
                latitude: address.latitude || '',
                longitude: address.longitude || '',
            });
            if (address.governorate_id) {
                fetchAreas(address.governorate_id);
            }
            if (address.latitude && address.longitude) {
                setMarkerPosition([parseFloat(address.latitude), parseFloat(address.longitude)]);
                setMapCenter([parseFloat(address.latitude), parseFloat(address.longitude)]);
                setShowMap(true);
            } else {
                setMarkerPosition(null);
                setShowMap(false);
            }
        } else {
            setEditingAddress(null);
            setFormData({
                label: '',
                governorate_id: '',
                area_id: '',
                address_details: '',
                is_default: false,
                latitude: '',
                longitude: '',
            });
            setMarkerPosition(null);
            setShowMap(false);
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingAddress(null);
        setFormData({
            label: '',
            governorate_id: '',
            area_id: '',
            address_details: '',
            is_default: false,
            latitude: '',
            longitude: '',
        });
        setMarkerPosition(null);
        setShowMap(false);
    };

    const handleLocationSelect = (lat, lng) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
        }));
        setMarkerPosition([lat, lng]);
        setMapCenter([lat, lng]);
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('ميزة تحديد الموقع غير مدعومة في متصفحك');
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
                alert('تعذر الحصول على موقعك. الرجاء التأكد من تفعيل خدمات الموقع.');
                setIsLocating(false);
                setShowMap(true);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setIsSubmitting(true);
        try {
            if (editingAddress) {
                await customerApi.updateAddress(editingAddress.id, formData);
                alert('تم تحديث العنوان بنجاح');
            } else {
                await customerApi.addAddress(formData);
                alert('تم إضافة العنوان بنجاح');
            }
            handleCloseModal();
            fetchAddresses();
        } catch (error) {
            console.error('Error saving address:', error);
            alert(error.response?.data?.message || 'حدث خطأ أثناء حفظ العنوان');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetDefault = async (addressId) => {
        setActionLoading(`default-${addressId}`);
        try {
            await customerApi.setDefaultAddress(addressId);
            alert('تم تعيين العنوان كافتراضي');
            fetchAddresses();
        } catch (error) {
            console.error('Error setting default address:', error);
            alert('حدث خطأ أثناء تعيين العنوان الافتراضي');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (addressId) => {
        if (!confirm('هل أنت متأكد من حذف هذا العنوان؟')) return;

        setActionLoading(`delete-${addressId}`);
        try {
            await customerApi.deleteAddress(addressId);
            alert('تم حذف العنوان بنجاح');
            fetchAddresses();
        } catch (error) {
            console.error('Error deleting address:', error);
            alert('حدث خطأ أثناء حذف العنوان');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">عناويني</h1>
                    <p className="text-slate-500 mt-1 font-medium">أدر عناوين التوصيل الخاصة بك</p>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    variant="primary"
                    icon={Plus}
                >
                    إضافة عنوان
                </Button>
            </div>

            {/* Addresses Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-white rounded-2xl p-6 border border-slate-100">
                            <div className="h-12 w-12 bg-slate-200 rounded-xl mb-4"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : addresses.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center">
                    <MapPin size={64} className="mx-auto mb-4 text-slate-300" />
                    <h3 className="font-bold text-lg text-slate-900 mb-2">لا توجد عناوين مسجلة</h3>
                    <p className="text-slate-500 mb-6">أضف عنوانك الأول لتبدأ بطلب الطعام</p>
                    <Button
                        onClick={() => handleOpenModal()}
                        variant="primary"
                    >
                        إضافة عنوان جديد
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            className={`bg-white p-6 rounded-2xl border-2 transition-all premium-shadow ${address.is_default ? 'border-pink-200 bg-pink-50/50' : 'border-slate-100 hover:border-pink-200'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${address.is_default ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    <Home size={24} />
                                </div>
                                {address.is_default && (
                                    <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-bold flex items-center gap-1">
                                        <Check size={12} />
                                        افتراضي
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-start gap-2">
                                    <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-lg text-slate-900 flex items-center gap-2">
                                            {address.label}
                                        </p>
                                        <p className="font-bold text-sm text-slate-600 mt-1">
                                            {address.governorate?.name_ar} - {address.area?.name_ar}
                                        </p>
                                        <p className="text-sm text-slate-500">{address.address_details}</p>
                                    </div>
                                </div>
                                {address.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} className="text-slate-400 flex-shrink-0" />
                                        <a href={`tel:${address.phone}`} className="text-sm text-brand hover:underline">
                                            {address.phone}
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-slate-100">
                                {!address.is_default && (
                                    <Button
                                        onClick={() => handleSetDefault(address.id)}
                                        isLoading={actionLoading === `default-${address.id}`}
                                        variant="success"
                                        size="sm"
                                        icon={Check}
                                        className="flex-1"
                                    >
                                        تعيين كافتراضي
                                    </Button>
                                )}
                                <Button
                                    onClick={() => handleOpenModal(address)}
                                    disabled={actionLoading !== null}
                                    variant="brandGhost"
                                    size="icon"
                                    icon={Edit}
                                />
                                <Button
                                    onClick={() => handleDelete(address.id)}
                                    isLoading={actionLoading === `delete-${address.id}`}
                                    variant="danger"
                                    size="icon"
                                    icon={Trash2}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col premium-shadow">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 flex-shrink-0">
                            <h3 className="font-bold text-xl">
                                {editingAddress ? 'تعديل العنوان' : 'إضافة عنوان جديد'}
                            </h3>
                            <Button variant="unstyled"
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                            >
                                <X size={24} className="text-slate-400" />
                            </Button>
                        </div>

                        <div className="p-6 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Label */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                        تسمية العنوان (المنزل، العمل...) *
                                    </label>
                                    <input
                                        type="text"
                                        name="label"
                                        value={formData.label}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="مثلاً: المنزل، العمل"
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand outline-none transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Governorate */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                            المحافظة *
                                        </label>
                                        <select
                                            name="governorate_id"
                                            value={formData.governorate_id}
                                            onChange={handleGovernorateChange}
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand outline-none transition-all"
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
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                            المنطقة *
                                        </label>
                                        <select
                                            name="area_id"
                                            value={formData.area_id}
                                            onChange={handleInputChange}
                                            required
                                            disabled={!formData.governorate_id}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="">اختر المنطقة</option>
                                            {areas.map(area => (
                                                <option key={area.id} value={area.id}>
                                                    {area.name_ar}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Address Details */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                        العنوان التفصيلي *
                                    </label>
                                    <textarea
                                        name="address_details"
                                        value={formData.address_details}
                                        onChange={handleInputChange}
                                        required
                                        rows={2}
                                        placeholder="اسم الشارع، رقم البناية، طابق، إلخ..."
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="border-t border-slate-100 pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-bold text-slate-700">حدد الموقع على الخريطة</label>
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                type="button" 
                                                isLoading={isLocating}
                                                onClick={handleGetCurrentLocation} 
                                                variant="primary"
                                                size="xs"
                                                icon={Navigation}
                                            >
                                                موقعي الحالي
                                            </Button>
                                            <Button 
                                                type="button" 
                                                onClick={() => setShowMap(!showMap)} 
                                                variant="brandGhost"
                                                size="xs"
                                                icon={Map}
                                            >
                                                {showMap ? 'إخفاء الخريطة' : 'عرض الخريطة'}
                                            </Button>
                                        </div>
                                    </div>

                                    {showMap && (
                                        <div className="mb-3">
                                            <LeafletMap
                                                center={mapCenter}
                                                markerPosition={markerPosition}
                                                onLocationSelect={handleLocationSelect}
                                                height="200px"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">خط العرض</label>
                                            <input type="text" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">خط الطول</label>
                                            <input type="text" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex-shrink-0 bg-slate-50 rounded-b-2xl">
                            {/* Default Address Checkbox */}
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <input
                                    type="checkbox"
                                    id="is_default"
                                    name="is_default"
                                    checked={formData.is_default}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 text-brand rounded focus:ring-brand"
                                />
                                <label htmlFor="is_default" className="text-sm font-bold text-slate-700 cursor-pointer">
                                    تعيين كعنوان افتراضي
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    type="submit"
                                    onClick={handleSubmit}
                                    isLoading={isSubmitting}
                                    fullWidth
                                    className="flex-1"
                                >
                                    {editingAddress ? 'حفظ التعديلات' : 'إضافة العنوان'}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleCloseModal}
                                    variant="secondary"
                                    className="px-6"
                                >
                                    إلغاء
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerAddresses;
