import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Clock, 
    CheckCircle, 
    ShoppingBag, 
    Truck, 
    MapPin, 
    Phone, 
    MessageSquare, 
    ChevronRight,
    Search,
    User
} from 'lucide-react';
import { orderApi } from '../../Services/api';
import LeafletMapDisplay from '../../Components/LeafletMapDisplay';
import Button from '../../Components/Button';


const OrderTracking = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await orderApi.get(orderId);
                setOrder(res.data?.data);
            } catch (err) {
                console.error('Error fetching order:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
        // Poll for updates every 15 seconds
        const interval = setInterval(fetchOrder, 15000);
        return () => clearInterval(interval);
    }, [orderId]);

    const statusSteps = [
        { label: 'تم الاستلام', status: 'pending', icon: ShoppingBag },
        { label: 'قيد التحضير', status: 'preparing', icon: Clock },
        { label: 'قيد التوصيل', status: 'picked_up', icon: Truck },
        { label: 'تم التوصيل', status: 'delivered', icon: CheckCircle },
    ];

    const getStatusIndex = (status) => {
        if (status === 'pending' || status === 'accepted_by_driver') return 0;
        if (status === 'preparing' || status === 'ready') return 1;
        if (status === 'picked_up') return 2;
        if (status === 'delivered') return 3;
        return -1;
    };

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!order) return (
        <div className="text-center py-32 bg-white rounded-3xl premium-shadow border border-slate-100">
            <Search size={64} className="mx-auto mb-4 text-slate-200" />
            <h2 className="text-2xl font-black text-slate-800">الطلب غير موجود</h2>
            <Link to="/dashboard/customer/orders" className="text-brand font-bold hover:underline mt-4 block">العودة لطلباتي</Link>
        </div>
    );

    const currentIndex = getStatusIndex(order.status);

    return (
        <div className="space-y-8 pb-12" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Link to="/dashboard/customer/orders" className="hover:text-brand transition-colors font-bold">طلباتي</Link>
                        <ChevronRight size={16} className="rotate-180" />
                        <span className="font-black text-slate-900">تتبع الطلب #{order.order_number}</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900">حالة الطلب الآن</h1>
                </div>
                <div className="flex gap-4">
                     <Button variant="unstyled" className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2">
                        <MessageSquare size={18} className="text-brand" />
                        مساعدة
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Progress & Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Progress Bar Container */}
                    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 premium-shadow">
                        <div className="relative flex justify-between">
                            {/* Connector Line */}
                            <div className="absolute top-7 left-0 right-0 h-1 bg-slate-100">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(currentIndex / (statusSteps.length - 1)) * 100}%` }}
                                    className="h-full bg-brand"
                                />
                            </div>

                            {statusSteps.map((step, i) => (
                                <div key={i} className="relative z-10 flex flex-col items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                        i <= currentIndex 
                                            ? 'bg-brand text-white shadow-xl shadow-brand/30' 
                                            : 'bg-white border-2 border-slate-100 text-slate-300'
                                    }`}>
                                        <step.icon size={26} />
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-sm font-black transition-colors ${i <= currentIndex ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {step.label}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Status Message */}
                        <div className="mt-12 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                <Clock className="text-brand" size={32} />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-slate-900">
                                    {order.status === 'pending' && 'الطلب في انتظار قبول السائق'}
                                    {order.status === 'preparing' && 'المطعم يقوم بتحضير وجبتك الآن'}
                                    {order.status === 'ready' && 'الطلب جاهز وبانتظار السائق للاستلام'}
                                    {order.status === 'picked_up' && 'السائق في طريقه إليك الآن!'}
                                    {order.status === 'delivered' && 'تم توصيل الطلب بالهناء والشفاء!'}
                                </h3>
                                <p className="text-slate-500 font-bold mt-1">
                                    {order.status === 'picked_up' ? 'الوقت المتوقع: 10-15 دقيقة' : 'نعمل على معالجة طلبك بأسرع وقت'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Order Items Summary */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 premium-shadow">
                        <h3 className="font-black text-xl mb-6">تفاصيل الطلب</h3>
                        <div className="space-y-4">
                            {order.items?.map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-4 border-b border-dashed border-slate-100 last:border-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-black text-brand">
                                            {item.quantity}x
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 tracking-wide">{item.product?.name_ar || item.product?.name}</p>
                                            <p className="text-xs text-slate-400 font-medium">{item.selected_options || 'بدون إضافات'}</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-slate-800">{item.price * item.quantity} ل.س</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Map & Delivery Info */}
                <div className="space-y-8">
                    {/* Map */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 premium-shadow overflow-hidden h-[400px]">
                        <LeafletMapDisplay 
                            marker={{
                                lat: parseFloat(order.latitude),
                                lng: parseFloat(order.longitude)
                            }}
                        />
                    </div>

                    {/* Store & Driver Info */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 premium-shadow space-y-8">
                        {/* Driver */}
                        {order.driver ? (
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                                    <User size={32} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-400 font-bold">السائق</p>
                                    <p className="font-black text-slate-900">{order.driver.name}</p>
                                </div>
                                <a href={`tel:${order.driver.phone}`} className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand shadow-sm hover:scale-105 transition-all">
                                    <Phone size={18} />
                                </a>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 text-center text-slate-400 font-medium">
                                بانتظار تعيين سائق...
                            </div>
                        )}

                        {/* Delivery Address */}
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold mb-1">عنوان التوصيل</p>
                                <p className="font-black text-slate-900 leading-relaxed">
                                    {order.address?.governorate?.name_ar}، {order.address?.area?.name_ar}<br />
                                    <span className="text-sm font-medium text-slate-500">{order.address?.address_details}</span>
                                </p>
                            </div>
                        </div>

                        {/* Order Summary Total */}
                        <div className="pt-6 border-t border-slate-100">
                             <div className="flex justify-between items-center mb-4">
                                <span className="text-slate-500 font-bold">المجموع الفرعي</span>
                                <span className="font-bold">{order.subtotal} ل.س</span>
                             </div>
                             <div className="flex justify-between items-center mb-4">
                                <span className="text-slate-500 font-bold">رسوم التوصيل</span>
                                <span className="font-bold">{order.delivery_fee} ل.س</span>
                             </div>
                             <div className="flex justify-between items-center pt-4 border-t border-dashed border-slate-200">
                                <span className="text-lg font-black text-slate-900">الإجمالي</span>
                                <span className="text-xl font-black text-brand">{order.total} ل.س</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;
