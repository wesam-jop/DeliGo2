import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, CheckCircle, ArrowLeft, Truck, Home, Plus, Map, X, Navigation, ExternalLink, ArrowRight } from 'lucide-react';
import { useCart } from '../../Contexts/CartContext';
import { useAuth } from '../../Contexts/AuthContext';
import axios from 'axios';
import LeafletMap from '../../Components/LeafletMap';
import Button from '../../Components/Button';


const Checkout = () => {
    const { cartItems, getCartTotal, clearCart, getDeliveryFee } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Confirmation
    const [loading, setLoading] = useState(false);
    const [checkingDriver, setCheckingDriver] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: '',
        address_details: '',
        governorate_id: '',
        area_id: '',
        latitude: '',
        longitude: '',
        is_default: false,
    });
    const [governorates, setGovernorates] = useState([]);
    const [areas, setAreas] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('cash'); // cash only
    const [orderNotes, setOrderNotes] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [mapCenter, setMapCenter] = useState([33.3152, 44.3661]); // Baghdad default
    const [markerPosition, setMarkerPosition] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (cartItems.length === 0 && step !== 3) {
            navigate('/cart');
            return;
        }
        fetchUserProfile();
        fetchAddresses();
        fetchGovernorates();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await axios.get('/api/v1/auth/me');
            const userData = response.data.data?.user || response.data.data;
            setUserProfile(userData);

            if (userData.governorate_id || userData.area_id) {
                setNewAddress(prev => ({
                    ...prev,
                    governorate_id: userData.governorate_id || '',
                    area_id: userData.area_id || '',
                }));

                if (userData.governorate_id) {
                    fetchAreas(userData.governorate_id);
                }
            }

            if (userData.latitude && userData.longitude) {
                const lat = parseFloat(userData.latitude);
                const lng = parseFloat(userData.longitude);
                setMapCenter([lat, lng]);
                setMarkerPosition([lat, lng]);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    const fetchAddresses = async () => {
        try {
            const response = await axios.get('/api/v1/customer/addresses');
            setAddresses(response.data.data || []);
            const defaultAddr = response.data.data?.find(a => a.is_default);
            if (defaultAddr) {
                setSelectedAddress(defaultAddr);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
        }
    };

    const fetchGovernorates = async () => {
        try {
            const response = await axios.get('/api/v1/locations/governorates');
            setGovernorates(response.data.data || []);
        } catch (error) {
            console.error('Error fetching governorates:', error);
        }
    };

    const handleLocationSelect = (lat, lng) => {
        const latitude = lat.toFixed(6);
        const longitude = lng.toFixed(6);

        setNewAddress(prev => ({
            ...prev,
            latitude,
            longitude,
        }));

        setMarkerPosition([lat, lng]);
        setMapCenter([lat, lng]);
    };

    const fetchAreas = async (governorateId) => {
        try {
            const response = await axios.get(`/api/v1/locations/governorates/${governorateId}`);
            setAreas(response.data.data?.areas || []);
        } catch (error) {
            console.error('Error fetching areas:', error);
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('ميزة تحديد الموقع غير مدعومة في متصفحك');
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                handleLocationSelect(latitude, longitude);
                setShowMap(true);
                setLoading(false);
            },
            (err) => {
                setError('تعذر الحصول على موقعك. الرجاء التأكد من تفعيل خدمات الموقع.');
                setLoading(false);
                setShowMap(true); // Still show map so they can pick manually
            },
            { enableHighAccuracy: true }
        );
    };

    const handleAddAddress = async () => {
        if (!newAddress.label || !newAddress.address_details || !newAddress.governorate_id || !newAddress.area_id) {
            setError('يرجى ملء جميع الحقول');
            return;
        }

        try {
            const response = await axios.post('/api/v1/customer/addresses', newAddress);
            const addedAddress = response.data.data;
            setAddresses([...addresses, addedAddress]);
            setSelectedAddress(addedAddress);
            setShowAddAddress(false);
            setNewAddress({
                label: '',
                address_details: '',
                governorate_id: '',
                area_id: '',
                latitude: '',
                longitude: '',
                is_default: false,
            });
            setError('');
        } catch (error) {
            setError(error.response?.data?.message || 'حدث خطأ أثناء إضافة العنوان');
        }
    };

    const handleProceedToPayment = async () => {
        if (!selectedAddress) {
            setError('يرجى اختيار عنوان للتوصيل');
            return;
        }

        setCheckingDriver(true);
        setError('');
        try {
            const response = await axios.post('/api/v1/orders/check-driver-availability', {
                address_id: selectedAddress.id
            });
            
            if (response.data.data.available) {
                setStep(2);
            } else {
                setError('عذراً، لا يوجد مندوب توصيل متاح في منطقتك حالياً. يرجى المحاولة لاحقاً.');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'حدث خطأ أثناء التحقق من توفر المندوبين. يرجى المحاولة لاحقاً.');
        } finally {
            setCheckingDriver(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            setError('يرجى اختيار عنوان للتوصيل');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const orderData = {
                customer_id: user.id,
                address_id: selectedAddress.id,
                payment_method: 'cash',
                notes: orderNotes,
                items: cartItems.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    store_id: item.storeId,
                })),
                delivery_fee: deliveryFee,
            };

            const response = await axios.post('/api/v1/orders', orderData);
            setSuccess('تم تقديم طلبك بنجاح!');
            clearCart();
            setStep(3);
        } catch (error) {
            setError(error.response?.data?.message || 'حدث خطأ أثناء تقديم الطلب');
        } finally {
            setLoading(false);
        }
    };

    const deliveryFee = getDeliveryFee();
    const total = getCartTotal() + deliveryFee;

    if (cartItems.length === 0 && step !== 3) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="text-8xl">🛒</div>
                    <h2 className="text-2xl font-bold text-slate-900">سلتك فارغة</h2>
                    <Link to="/stores" className="inline-block px-8 py-3 bg-brand text-white rounded-full font-bold hover:bg-brand-dark transition-all">
                        تصفح المتاجر
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 sm:py-12" dir="rtl">
            <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
                {/* Header */}
                <div className="mb-6 sm:mb-10">
                    <Link to="/cart" className="inline-flex items-center gap-2 text-slate-400 hover:text-brand transition-all mb-4 group">
                        <ArrowLeft size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold">العودة لسلة التسوق</span>
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">إتمام الطلب</h1>
                </div>

                {/* Progress Steps */}
                <div className="mb-8 overflow-x-auto pb-4 scrollbar-hide">
                    <div className="flex items-center justify-start sm:justify-center gap-3 sm:gap-6 min-w-max">
                        {[
                            { num: 1, label: 'العنوان', icon: MapPin },
                            { num: 2, label: 'الدفع', icon: CreditCard },
                            { num: 3, label: 'تأكيد', icon: CheckCircle },
                        ].map((s, i) => (
                            <React.Fragment key={s.num}>
                                <div className={`flex items-center gap-2 sm:gap-3 px-4 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-[1.25rem] transition-all ${step >= s.num
                                        ? 'bg-brand text-white shadow-xl shadow-brand/20'
                                        : 'bg-white border border-slate-100 text-slate-400'
                                    }`}>
                                    <s.icon size={20} className={step >= s.num ? 'text-white' : 'text-slate-400'} />
                                    <span className="font-black text-xs uppercase tracking-widest">{s.label}</span>
                                </div>
                                {i < 2 && <div className={`w-8 sm:w-16 h-1 rounded-full transition-all ${step > s.num ? 'bg-brand' : 'bg-slate-200'}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="address"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-white p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] premium-shadow border border-slate-50"
                                >
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 sm:mb-8 flex items-center gap-3">
                                        <div className="p-2 sm:p-3 bg-brand/10 text-brand rounded-xl sm:rounded-2xl">
                                            <MapPin size={24} />
                                        </div>
                                        عنوان التوصيل
                                    </h2>

                                    {error && (
                                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl font-bold flex items-center gap-2">
                                            <X size={20} />
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-4 mb-6">
                                        {addresses.map((addr) => (
                                            <div
                                                key={addr.id}
                                                onClick={() => setSelectedAddress(addr)}
                                                className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 cursor-pointer transition-all ${selectedAddress?.id === addr.id
                                                        ? 'border-brand bg-brand/5'
                                                        : 'border-slate-50 hover:border-brand/20 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${selectedAddress?.id === addr.id ? 'border-brand bg-brand' : 'border-slate-300'
                                                            }`}>
                                                            {selectedAddress?.id === addr.id && (
                                                                <CheckCircle size={14} className="text-white" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center flex-wrap gap-2 mb-1">
                                                                <Home size={16} className="text-slate-400" />
                                                                <span className="font-bold text-sm sm:text-base text-slate-900">{addr.label}</span>
                                                                {addr.is_default && (
                                                                    <span className="text-[10px] sm:text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold">افتراضي</span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{addr.address_details}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Button variant="unstyled"
                                        onClick={() => setShowAddAddress(true)}
                                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-medium hover:border-pink-300 hover:text-brand transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={18} />
                                        إضافة عنوان جديد
                                    </Button>

                                    {showAddAddress && (
                                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8"
                                            >
                                                <div className="flex justify-between items-center mb-6">
                                                    <h3 className="font-bold text-lg">إضافة عنوان جديد</h3>
                                                    <Button variant="unstyled" onClick={() => setShowAddAddress(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={24} className="text-slate-400" /></Button>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-2">التسمية</label>
                                                        <input type="text" value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} placeholder="مثلاً: المنزل، العمل" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none" />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-bold text-slate-700 mb-2">المحافظة</label>
                                                            <select value={newAddress.governorate_id} onChange={(e) => { const govId = e.target.value; setNewAddress({ ...newAddress, governorate_id: govId }); if (govId) fetchAreas(govId); }} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none">
                                                                <option value="">اختر المحافظة</option>
                                                                {governorates.map(gov => <option key={gov.id} value={gov.id}>{gov.name_ar}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-bold text-slate-700 mb-2">المنطقة</label>
                                                            <select value={newAddress.area_id} onChange={(e) => setNewAddress({ ...newAddress, area_id: e.target.value })} disabled={!newAddress.governorate_id} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none">
                                                                <option value="">اختر المنطقة</option>
                                                                {areas.map(area => <option key={area.id} value={area.id}>{area.name_ar}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 mb-2">العنوان التفصيلي</label>
                                                        <textarea value={newAddress.address_details} onChange={(e) => setNewAddress({ ...newAddress, address_details: e.target.value })} placeholder="اسم الشارع، رقم المبنى، الشقة" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none resize-none h-24" />
                                                    </div>

                                                    <div className="border-t border-slate-200 pt-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <label className="block text-sm font-bold text-slate-700">موقع العنوان على الخريطة</label>
                                                            <div className="flex items-center gap-2">
                                                                <Button variant="unstyled" type="button" disabled={loading} onClick={handleGetCurrentLocation} className={`text-xs text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${loading ? 'bg-slate-400 cursor-wait' : 'bg-brand hover:bg-brand-dark'}`}>
                                                                    <Navigation size={14} className={loading ? 'animate-pulse' : ''} />
                                                                    {loading ? 'جاري التحديد...' : 'موقعي الحالي'}
                                                                </Button>
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
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 mb-1">خط العرض</label>
                                                                <input type="text" value={newAddress.latitude} onChange={(e) => setNewAddress({ ...newAddress, latitude: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 mb-1">خط الطول</label>
                                                                <input type="text" value={newAddress.longitude} onChange={(e) => setNewAddress({ ...newAddress, longitude: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 mt-6">
                                                    <Button variant="unstyled" onClick={handleAddAddress} className="flex-1 py-3 bg-brand text-white rounded-xl font-bold">حفظ</Button>
                                                    <Button variant="unstyled" onClick={() => setShowAddAddress(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">إلغاء</Button>
                                                </div>
                                            </motion.div>
                                        </div>
                                    )}

                                    <Button variant="unstyled"
                                        onClick={handleProceedToPayment}
                                        disabled={!selectedAddress || checkingDriver}
                                        className="w-full py-4 bg-brand text-white rounded-xl font-bold mt-6 hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <span>{checkingDriver ? 'جاري التحقق من التوفر...' : 'متابعة للدفع'}</span>
                                        {!checkingDriver && <ArrowRight size={18} className="rotate-180" />}
                                    </Button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="payment"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow"
                                >
                                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><CreditCard size={20} className="text-brand" /> طريقة الدفع</h2>
                                    
                                    {error && (
                                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl font-bold flex items-center gap-2">
                                            <X size={20} className="flex-shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <div className="p-4 rounded-xl border-2 border-brand bg-pink-50 mb-6 flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full border-2 border-brand bg-brand flex items-center justify-center"><CheckCircle size={14} className="text-white" /></div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-900">الدفع عند الاستلام 💵</h4>
                                            <p className="text-sm text-slate-500">ادفع نقدًا عند استلام طلبك</p>
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات على الطلب</label>
                                        <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="مثلاً: بدون بصل..." className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none h-24" />
                                    </div>
                                    <div className="flex gap-4">
                                        <Button variant="unstyled" onClick={() => { setStep(1); setError(''); }} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold">رجوع للعنوان</Button>
                                        <Button variant="unstyled" 
                                            onClick={handlePlaceOrder} 
                                            disabled={loading || (error && error.includes('متصل'))} 
                                            className={`flex-1 py-4 rounded-xl font-bold text-white transition-all ${loading || (error && error.includes('متصل')) ? 'bg-slate-300 cursor-not-allowed' : 'bg-brand'}`}
                                        >
                                            {loading ? 'جاري التقديم...' : (error && error.includes('متصل') ? 'غير متاح حالياً' : 'تأكيد الطلب')}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="confirmation"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white p-6 sm:p-12 rounded-2xl border border-slate-100 premium-shadow text-center"
                                >
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} className="text-emerald-500 sm:w-12 sm:h-12" /></div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">تم تقديم طلبك بنجاح!</h2>
                                    <p className="text-sm sm:text-base text-slate-500 mb-8">شكراً لطلبك. سيتم تجهيزه قريباً.</p>
                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                                        <Link to="/dashboard/customer/orders" className="w-full sm:w-auto px-8 py-3.5 sm:py-3 bg-brand text-white rounded-full font-bold">تتبع طلبك</Link>
                                        <Link to="/stores" className="w-full sm:w-auto px-8 py-3.5 sm:py-3 bg-slate-100 text-slate-600 rounded-full font-bold">تسوق المزيد</Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow sticky top-6">
                            <h3 className="font-bold text-lg mb-4">ملخص الطلب</h3>
                            <div className="space-y-3 mb-6">
                                {cartItems.map((item) => (
                                    <div key={item.product.id} className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl min-w-[48px]">
                                            {item.product.image ? <img src={item.product.image} className="w-full h-full object-cover rounded-xl" /> : '🍽️'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-slate-900 truncate">{item.product.name}</p>
                                            <p className="text-xs text-slate-400">الكمية: {item.quantity}</p>
                                        </div>
                                        <p className="font-black text-sm text-slate-900">{(item.product.price * item.quantity).toLocaleString()} $</p>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-slate-100 pt-4 space-y-2">
                                <div className="flex justify-between text-sm text-slate-500"><span>المجموع الفرعي</span><span className="font-bold text-slate-900">{getCartTotal().toLocaleString()} $</span></div>
                                <div className="flex justify-between text-sm text-slate-500"><span>رسوم التوصيل</span><span className="font-bold text-slate-900">{deliveryFee.toLocaleString()} $</span></div>
                                <div className="border-t border-slate-100 pt-5 flex justify-between font-black text-2xl">
                                    <span className="text-slate-900">الإجمالي الكلي</span>
                                    <span className="text-brand underline decoration-brand/10 underline-offset-8">{total.toLocaleString()} $</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
