import React from 'react';
import { X, Package, MapPin, Phone, User, Clock, DollarSign, MessageSquare, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LeafletMapDisplay from '../../Components/LeafletMapDisplay';
import Button from '../../Components/Button';


const OrderDetailsModal = ({ order, onClose }) => {
    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-amber-100 text-amber-600',
            'accepted_by_driver': 'bg-indigo-100 text-indigo-600',
            'confirmed': 'bg-blue-100 text-blue-600',
            'preparing': 'bg-purple-100 text-purple-600',
            'ready': 'bg-indigo-100 text-indigo-600',
            'picked_up': 'bg-cyan-100 text-cyan-600',
            'delivered': 'bg-emerald-100 text-emerald-600',
            'cancelled': 'bg-red-100 text-red-600',
        };
        return colors[status] || 'bg-slate-100 text-slate-600';
    };

    const getStatusText = (status) => {
        const texts = {
            'pending': 'قيد الانتظار',
            'accepted_by_driver': 'تم قبول السائق',
            'confirmed': 'تم التأكيد',
            'preparing': 'قيد التحضير',
            'ready': 'جاهز للاستلام',
            'picked_up': 'تم الاستلام',
            'delivered': 'مكتمل',
            'cancelled': 'ملغي',
        };
        return texts[status] || status;
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between rounded-t-3xl">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">تفاصيل الطلب #{order.id}</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {new Date(order.created_at).toLocaleString('ar-SY')}
                            </p>
                        </div>
                        <Button variant="unstyled"
                            onClick={onClose}
                            className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                        >
                            <X size={20} />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Order Notes */}
                        {order.notes && (
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-sm italic flex gap-3 items-start">
                                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                <span>{order.notes}</span>
                            </div>
                        )}
                        {/* Status & Price Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                <div className={`p-3 rounded-xl ${getStatusColor(order.status)}`}>
                                    <Package size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">حالة الطلب</p>
                                    <p className={`font-bold ${getStatusColor(order.status).replace('bg-', 'text-')}`}>
                                        {getStatusText(order.status)}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-brand/5 border border-brand/10 rounded-2xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">سعر المنتجات:</span>
                                    <span className="font-bold text-slate-900">{parseFloat(order.subtotal || 0).toLocaleString('ar-IQ')} $</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">أجور التوصيل:</span>
                                    <span className="font-bold text-brand">{parseFloat(order.delivery_fee || 0).toLocaleString('ar-IQ')} $</span>
                                </div>
                                <div className="pt-2 border-t border-brand/20 flex justify-between items-center text-brand">
                                    <span className="font-black text-sm">الإجمالي الحقيقي:</span>
                                    <span className="text-xl font-black">{parseFloat(order.total || 0).toLocaleString('ar-IQ')} $</span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <User size={20} className="text-brand" />
                                معلومات الزبون
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">الاسم</p>
                                    <p className="font-bold text-slate-900">{order.customer?.name || 'غير متوفر'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">رقم الهاتف</p>
                                    <p className="font-bold text-slate-900 flex items-center gap-2">
                                        <Phone size={16} className="text-slate-400" />
                                        {order.customer?.phone || 'غير متوفر'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <MapPin size={20} className="text-brand" />
                                عنوان التوصيل
                            </h3>
                            <div className="space-y-3">
                                <p className="font-bold text-slate-900">
                                    {order.address?.address_details || 'لا يوجد عنوان'}
                                </p>
                                {order.address?.area && (
                                    <p className="text-sm text-slate-500">
                                        {order.address.area.name_ar}، {order.address.governorate?.name_ar}
                                    </p>
                                )}

                                {/* Map Display */}
                                {order.latitude && order.longitude && (
                                    <div className="mt-4">
                                        <LeafletMapDisplay
                                            center={[parseFloat(order.latitude), parseFloat(order.longitude)]}
                                            zoom={16}
                                            height="200px"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Package size={20} className="text-brand" />
                                محتويات الطلب
                            </h3>
                            <div className="space-y-3">
                                {order.items?.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-bold text-slate-400 premium-shadow">
                                                {item.product?.name?.charAt(0) || 'P'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{item.product?.name || 'منتج'}</p>
                                                <p className="text-xs text-slate-400">الكمية: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="font-black text-slate-900">
                                            {parseFloat(item.unit_price * item.quantity).toLocaleString('ar-IQ')} $
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Driver Info (if assigned) */}
                        {order.driver && (
                            <div className="bg-white p-6 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <User size={20} className="text-brand" />
                                    معلومات السائق
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-400 mb-1">الاسم</p>
                                        <p className="font-bold text-slate-900">{order.driver.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400 mb-1">رقم الهاتف</p>
                                        <p className="font-bold text-slate-900 flex items-center gap-2">
                                            <Phone size={16} className="text-slate-400" />
                                            {order.driver.phone}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Timeline */}
                        {order.status_history && order.status_history.length > 0 && (
                            <div className="bg-white p-6 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Clock size={20} className="text-brand" />
                                    سجل الحالة
                                </h3>
                                <div className="space-y-3">
                                    {order.status_history.map((history, index) => (
                                        <div key={index} className="flex items-center gap-4">
                                            <div className="w-3 h-3 bg-brand rounded-full"></div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm">{getStatusText(history.status)}</p>
                                                <p className="text-xs text-slate-400">
                                                    {new Date(history.created_at).toLocaleString('ar-SY')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default OrderDetailsModal;
