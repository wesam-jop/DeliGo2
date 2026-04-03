import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ShoppingBag,
    MapPin,
    Phone,
    User,
    Clock,
    DollarSign,
    ChevronLeft,
    Package,
    AlertCircle,
    CheckCircle,
    Truck,
    XCircle
} from 'lucide-react';
import { customerApi } from '../../Services/customerApi';
import LeafletMapDisplay from '../../Components/LeafletMapDisplay';
import Button from '../../Components/Button';


const CustomerOrders = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filter, setFilter] = useState('all'); // all, active, completed, cancelled
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        } else {
            fetchOrders();
        }
    }, [orderId, filter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await customerApi.getOrders({ status: filter === 'all' ? '' : filter });
            const ordersData = response.data.data?.data || response.data.data || [];
            setOrders(ordersData);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await customerApi.getOrder(orderId);
            setSelectedOrder(response.data.data);
        } catch (error) {
            console.error('Error fetching order details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!selectedOrder || !cancelReason.trim()) return;

        try {
            await customerApi.cancelOrder(selectedOrder.id, { reason: cancelReason });
            setShowCancelModal(false);
            setCancelReason('');
            alert('تم إلغاء الطلب بنجاح');
            fetchOrders();
            navigate('/dashboard/customer/orders');
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert(error.response?.data?.message || 'حدث خطأ أثناء إلغاء الطلب');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: 'بانتظار القبول', color: 'bg-amber-100 text-amber-600', icon: Clock },
            accepted_by_driver: { label: 'تم قبول السائق', color: 'bg-indigo-100 text-indigo-600', icon: Truck },
            confirmed: { label: 'تم التأكيد', color: 'bg-blue-100 text-blue-600', icon: CheckCircle },
            preparing: { label: 'قيد التحضير', color: 'bg-purple-100 text-purple-600', icon: Package },
            ready: { label: 'جاهز للاستلام', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle },
            picked_up: { label: 'قيد التوصيل', color: 'bg-indigo-100 text-indigo-600', icon: Truck },
            delivered: { label: 'تم التسليم', color: 'bg-green-100 text-green-600', icon: CheckCircle },
            completed: { label: 'مكتمل', color: 'bg-green-100 text-green-600', icon: CheckCircle },
            cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-600', icon: XCircle },
        };
        const config = statusConfig[status] || { label: status, color: 'bg-slate-100 text-slate-600', icon: Clock };
        const Icon = config.icon;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${config.color}`}>
                <Icon size={12} />
                {config.label}
            </span>
        );
    };

    const formatPrice = (price) => {
        return `${parseFloat(price).toLocaleString('ar-IQ')} $`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('ar-IQ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const canCancelOrder = (order) => {
        return ['pending', 'confirmed'].includes(order.status);
    };

    // Order Details View
    if (orderId && selectedOrder) {
        return (
            <div className="space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="unstyled"
                        onClick={() => navigate('/dashboard/customer/orders')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                    >
                        <ChevronLeft size={24} className="text-slate-400" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">تفاصيل الطلب #{selectedOrder.id}</h1>
                        <p className="text-slate-500 mt-1 font-medium">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                </div>

                {/* Status & Actions */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg">حالة الطلب</h3>
                            {getStatusBadge(selectedOrder.status)}
                        </div>
                        {canCancelOrder(selectedOrder) && (
                            <Button variant="unstyled"
                                onClick={() => setShowCancelModal(true)}
                                className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold text-sm hover:bg-red-200 transition-all flex items-center gap-2"
                            >
                                <XCircle size={16} />
                                إلغاء الطلب
                            </Button>
                        )}
                    </div>

                    {/* Order Progress */}
                    <div className="mb-6">
                        <h4 className="font-bold text-sm text-slate-700 mb-4">تتبع الطلب</h4>
                        <div className="space-y-3">
                            {[
                                { status: 'pending', label: 'تم استلام الطلب' },
                                { status: 'confirmed', label: 'تم التأكيد' },
                                { status: 'preparing', label: 'قيد التحضير' },
                                { status: 'ready', label: 'جاهز للاستلام' },
                                { status: 'picked_up', label: 'قيد التوصيل' },
                                { status: 'delivered', label: 'تم التسليم' },
                            ].map((step, index, steps) => {
                                const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];
                                const currentStatusIndex = statusOrder.indexOf(selectedOrder.status);
                                const stepIndex = statusOrder.indexOf(step.status);
                                const isDone = stepIndex <= currentStatusIndex;
                                const isLast = index === steps.length - 1;

                                return (
                                    <div key={step.status} className="flex items-center gap-4">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                            isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                                        }`}>
                                            {isDone && <CheckCircle size={14} className="text-white" />}
                                        </div>
                                        <span className={`text-sm font-medium flex-1 ${
                                            isDone ? 'text-slate-900' : 'text-slate-400'
                                        }`}>{step.label}</span>
                                        {!isLast && (
                                            <div className={`flex-1 h-0.5 ${
                                                isDone ? 'bg-emerald-500' : 'bg-slate-200'
                                            }`}></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="border-t border-slate-100 pt-6">
                        <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <User className="text-brand" size={20} />
                            معلومات التوصيل
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <User className="text-slate-400" size={20} />
                                <span className="font-medium">{selectedOrder.customer?.name}</span>
                            </div>
                            {selectedOrder.customer?.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="text-slate-400" size={20} />
                                    <a href={`tel:${selectedOrder.customer.phone}`} className="font-medium text-brand hover:underline">
                                        {selectedOrder.customer.phone}
                                    </a>
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <MapPin className="text-slate-400 mt-1" size={20} />
                                <span className="font-medium">
                                    {selectedOrder.address?.address_details || selectedOrder.address?.label || 'عنوان غير محدد'}
                                    {selectedOrder.address?.area?.name_ar && `، ${selectedOrder.address.area.name_ar}`}
                                    {selectedOrder.address?.governorate?.name_ar && `، ${selectedOrder.address.governorate.name_ar}`}
                                </span>
                            </div>

                            {/* Map Display */}
                            {selectedOrder.latitude && selectedOrder.longitude && (
                                <div className="mt-4">
                                    <LeafletMapDisplay
                                        center={[parseFloat(selectedOrder.latitude), parseFloat(selectedOrder.longitude)]}
                                        zoom={16}
                                        height="200px"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Notes */}
                    {selectedOrder.notes && (
                         <div className="border-t border-slate-100 pt-6 mt-6">
                            <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <AlertCircle className="text-amber-500" size={20} />
                                ملاحظات الطلب
                            </h4>
                            <div className="p-4 bg-amber-50 rounded-xl text-amber-800 text-sm italic">
                                {selectedOrder.notes}
                            </div>
                        </div>
                    )}

                    {/* Order Items */}
                    <div className="border-t border-slate-100 pt-6 mt-6">
                        <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Package className="text-brand" size={20} />
                            المنتجات
                        </h4>
                        <div className="space-y-3">
                            {selectedOrder.items?.map((item, index) => (
                                <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900">{item.product_name || item.name}</p>
                                        <p className="text-sm text-slate-500">
                                            {item.quantity} × {formatPrice(item.price || item.unit_price || 0)}
                                        </p>
                                    </div>
                                    <p className="font-bold text-brand">
                                        {formatPrice((item.price || item.unit_price || 0) * item.quantity)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="border-t border-slate-100 pt-6 mt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-slate-600">
                                <span>المجموع الفرعي</span>
                                <span>{formatPrice(selectedOrder.subtotal || 0)}</span>
                            </div>
                            {selectedOrder.delivery_fee > 0 && (
                                <div className="flex justify-between text-slate-600">
                                    <span>رسوم التوصيل</span>
                                    <span>{formatPrice(selectedOrder.delivery_fee)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-100">
                                <span>الإجمالي</span>
                                <span>{formatPrice(selectedOrder.total || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cancel Modal */}
                {showCancelModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertCircle className="text-amber-500" size={24} />
                                <h3 className="font-bold text-lg">إلغاء الطلب</h3>
                            </div>
                            <p className="text-slate-600 mb-4">هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.</p>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="سبب الإلغاء (اختياري)"
                                className="w-full p-4 border-2 border-slate-100 rounded-xl outline-none focus:border-brand resize-none h-32"
                            />
                            <div className="flex gap-3 mt-6">
                                <Button variant="unstyled"
                                    onClick={handleCancelOrder}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all"
                                >
                                    تأكيد الإلغاء
                                </Button>
                                <Button variant="unstyled"
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setCancelReason('');
                                    }}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    تراجع
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Orders List View
    const filterTabs = [
        { id: 'all', label: 'الكل', icon: ShoppingBag },
        { id: 'active', label: 'النشطة', icon: Clock },
        { id: 'completed', label: 'المكتملة', icon: CheckCircle },
        { id: 'cancelled', label: 'الملغاة', icon: XCircle },
    ];

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900">طلباتي</h1>
                <p className="text-slate-500 mt-1 font-medium">تتبع طلباتك وسجلها</p>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex gap-2 overflow-x-auto">
                    {filterTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <Button variant="unstyled"
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                className={`flex-shrink-0 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                                    filter === tab.id
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">سجل الطلبات</h3>
                    <span className="text-sm text-slate-400 font-medium">
                        {orders.length} طلب
                    </span>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse bg-slate-50 rounded-2xl p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-slate-200 rounded-xl"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <ShoppingBag size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="font-medium">لا توجد طلبات</p>
                        <p className="text-sm mt-2">
                            {filter === 'all' ? 'ابدأ بالتسوق الآن' : `لا توجد طلبات ${filterTabs.find(t => t.id === filter)?.label.toLowerCase()}`}
                        </p>
                        {filter === 'all' && (
                            <Button variant="unstyled"
                                onClick={() => navigate('/stores')}
                                className="mt-4 px-6 py-3 bg-brand text-white rounded-xl font-bold hover:bg-pink-600 transition-all"
                            >
                                تصفح المتاجر
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="p-5 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-lg transition-all border-2 border-transparent hover:border-pink-200 cursor-pointer"
                                onClick={() => navigate(`/dashboard/customer/orders/${order.id}`)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-black text-slate-500 text-sm">#{order.id}</span>
                                            {getStatusBadge(order.status)}
                                        </div>
                                        <p className="font-bold text-slate-400 text-xs mb-1">
                                            {order.store_splits?.[0]?.store?.name || 'طلب مباشر'}
                                        </p>
                                        <p className="font-bold text-slate-900 truncate">
                                            {order.items?.slice(0, 2).map(item => item.product_name || item.name).join('، ')}
                                            {order.items?.length > 2 && ` +${order.items.length - 2}`}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {formatDate(order.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-brand text-lg">
                                            {formatPrice(order.total || 0)}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {order.items?.length || 0} منتجات
                                        </p>
                                        {['pending', 'confirmed', 'preparing', 'ready', 'picked_up'].includes(order.status) && (
                                            <Button variant="unstyled" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/dashboard/customer/orders/${order.id}/track`);
                                                }}
                                                className="mt-3 px-4 py-2 bg-brand text-white rounded-xl text-xs font-black shadow-lg shadow-brand/20 hover:scale-105 transition-all flex items-center gap-2"
                                            >
                                                <Truck size={14} />
                                                تتبع الطلب
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerOrders;
