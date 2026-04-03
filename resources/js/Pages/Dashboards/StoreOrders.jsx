import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    ShoppingBag,
    Clock,
    CheckCircle,
    XCircle,
    Package,
    User,
    MapPin,
    Phone,
    Calendar,
    DollarSign,
    ChevronLeft,
    Eye,
    AlertCircle,
    FileText
} from 'lucide-react';
import LeafletMapDisplay from '../../Components/LeafletMapDisplay';
import { storeOwnerApi } from '../../Services/storeApi';
import Button from '../../Components/Button';


const StoreOrders = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const statusOptions = [
        { value: 'all', label: 'الكل', color: 'bg-slate-100 text-slate-600' },
        { value: 'pending', label: 'بانتظار القبول', color: 'bg-amber-100 text-amber-600' },
        { value: 'confirmed', label: 'مؤكد', color: 'bg-blue-100 text-blue-600' },
        { value: 'preparing', label: 'قيد التحضير', color: 'bg-purple-100 text-purple-600' },
        { value: 'ready', label: 'جاهز للاستلام', color: 'bg-emerald-100 text-emerald-600' },
        { value: 'picked_up', label: 'تم الاستلام', color: 'bg-indigo-100 text-indigo-600' },
        { value: 'delivered', label: 'تم التسليم', color: 'bg-green-100 text-green-600' },
        { value: 'completed', label: 'مكتمل', color: 'bg-green-100 text-green-600' },
        { value: 'cancelled', label: 'ملغي', color: 'bg-red-100 text-red-600' },
    ];

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        } else {
            fetchOrders();
        }
    }, [orderId, statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await storeOwnerApi.getOrders({ limit: 50 });
            const ordersData = response.data.data?.data || response.data.data || [];
            setOrders(ordersData);
        } catch (error) {
            console.error('Error fetching orders:', error);
            alert('حدث خطأ أثناء تحميل الطلبات');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await storeOwnerApi.getOrder(orderId);
            setSelectedOrder(response.data.data);
        } catch (error) {
            console.error('Error fetching order details:', error);
            alert('حدث خطأ أثناء تحميل تفاصيل الطلب');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptOrder = async (orderId) => {
        if (!confirm('هل أنت متأكد من قبول هذا الطلب؟')) return;

        try {
            await storeOwnerApi.acceptOrder(orderId);
            fetchOrders();
            if (selectedOrder) fetchOrderDetails();
        } catch (error) {
            console.error('Error accepting order:', error);
            alert('حدث خطأ أثناء قبول الطلب');
        }
    };

    const handleMarkPreparing = async (orderId) => {
        try {
            await storeOwnerApi.markAsPreparing(orderId);
            fetchOrders();
            if (selectedOrder) fetchOrderDetails();
        } catch (error) {
            console.error('Error marking order as preparing:', error);
            alert('حدث خطأ أثناء تحديث حالة الطلب');
        }
    };

    const handleMarkReady = async (orderId) => {
        try {
            await storeOwnerApi.markAsReady(orderId);
            fetchOrders();
            if (selectedOrder) fetchOrderDetails();
        } catch (error) {
            console.error('Error marking order as ready:', error);
            alert('حدث خطأ أثناء تحديث حالة الطلب');
        }
    };

    const handleCancelOrder = async () => {
        if (!selectedOrder || !cancelReason.trim()) return;

        try {
            await storeOwnerApi.cancelOrder(selectedOrder.id, { reason: cancelReason });
            setShowCancelModal(false);
            setCancelReason('');
            fetchOrders();
            navigate('/dashboard/store/orders');
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('حدث خطأ أثناء إلغاء الطلب');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: 'بانتظار السائق', color: 'bg-slate-100 text-slate-600' },
            accepted_by_driver: { label: 'تم قبول السائق', color: 'bg-indigo-100 text-indigo-600' },
            confirmed: { label: 'المتجر قبل', color: 'bg-indigo-100 text-indigo-600' },
            preparing: { label: 'قيد التحضير', color: 'bg-purple-100 text-purple-600' },
            ready: { label: 'جاهز للاستلام', color: 'bg-emerald-100 text-emerald-600' },
            picked_up: { label: 'قيد التوصيل', color: 'bg-indigo-100 text-indigo-600' },
            delivered: { label: 'تم التسليم', color: 'bg-green-100 text-green-600' },
            completed: { label: 'مكتمل', color: 'bg-green-100 text-green-600' },
            cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-600' },
        };
        const config = statusConfig[status] || { label: status, color: 'bg-slate-100 text-slate-600' };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const getAvailableActions = (order) => {
        const actions = [];

        switch (order.status) {
            case 'pending':
                actions.push({
                    label: 'بانتظار السائق',
                    action: null,
                    color: 'bg-slate-100 text-slate-400 cursor-not-allowed',
                    icon: Clock
                });
                break;
            case 'accepted_by_driver':
                actions.push({
                    label: 'قبول الطلب',
                    action: () => handleAcceptOrder(order.id),
                    color: 'bg-emerald-500 text-white hover:bg-emerald-600',
                    icon: CheckCircle
                });
                break;
            case 'confirmed':
                actions.push({
                    label: 'ابدأ التحضير',
                    action: () => handleMarkPreparing(order.id),
                    color: 'bg-purple-500 text-white hover:bg-purple-600',
                    icon: Package
                });
                break;
            case 'preparing':
                actions.push({
                    label: 'جاهز للاستلام',
                    action: () => handleMarkReady(order.id),
                    color: 'bg-emerald-500 text-white hover:bg-emerald-600',
                    icon: CheckCircle
                });
                break;
            default:
                break;
        }

        return actions;
    };

    const filteredOrders = orders.filter(order => {
        if (statusFilter !== 'all' && order.status !== statusFilter) return false;
        if (!searchTerm) return true;

        const search = searchTerm.toLowerCase();
        return (
            order.id?.toString().includes(search) ||
            order.customer?.name?.toLowerCase().includes(search) ||
            order.delivery_address?.toLowerCase().includes(search)
        );
    });

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

    // Order Details View
    if (orderId && selectedOrder) {
        const actions = getAvailableActions(selectedOrder);

        return (
            <div className="space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="unstyled"
                        onClick={() => navigate('/dashboard/store/orders')}
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
                        <div className="flex gap-3">
                            {actions.map((action, index) => {
                                const Icon = action.icon;
                                return (
                                    <Button variant="unstyled"
                                        key={index}
                                        onClick={action.action}
                                        className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${action.color}`}
                                    >
                                        <Icon size={18} />
                                        {action.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="border-t border-slate-100 pt-6">
                        <h4 className="font-bold text-lg mb-4">المنتجات</h4>
                        <div className="space-y-3">
                            {selectedOrder.items?.map((item, index) => (
                                <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                    <div className="w-16 h-16 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                                        <Package size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900">{item.product_name || item.name}</p>
                                        <p className="text-sm text-slate-500">
                                            {item.quantity} × {formatPrice(item.price || item.unit_price || 0)}
                                            {item.options?.length > 0 && (
                                                <span className="mr-2">
                                                    ({item.options.map(o => o.option_name).join(', ')})
                                                </span>
                                            )}
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
                                <span>المجموع الجزئي</span>
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

                {/* Customer Info */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <User className="text-brand" size={20} />
                        معلومات الزبون
                    </h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <User className="text-slate-400" size={20} />
                            <div>
                                <p className="text-xs text-slate-400 font-medium">الاسم</p>
                                <p className="font-medium">{selectedOrder.customer?.name}</p>
                            </div>
                        </div>
                        {selectedOrder.customer?.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="text-slate-400" size={20} />
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">رقم الهاتف</p>
                                    <a href={`tel:${selectedOrder.customer.phone}`} className="font-medium text-brand hover:underline">
                                        {selectedOrder.customer.phone}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <MapPin className="text-brand" size={20} />
                        عنوان التوصيل
                    </h4>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <MapPin className="text-slate-400 mt-1" size={20} />
                            <div className="flex-1">
                                <p className="text-xs text-slate-400 font-medium">العنوان التفصيلي</p>
                                <p className="font-medium">{selectedOrder.address?.address_details || selectedOrder.delivery_address || 'غير متوفر'}</p>
                            </div>
                        </div>
                        {selectedOrder.address?.governorate && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">المحافظة</p>
                                    <p className="font-bold text-slate-900">{selectedOrder.address.governorate.name_ar}</p>
                                </div>
                            </div>
                        )}
                        {selectedOrder.address?.area && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">المنطقة</p>
                                    <p className="font-bold text-slate-900">{selectedOrder.address.area.name_ar}</p>
                                </div>
                            </div>
                        )}
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
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                        <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <FileText className="text-brand" size={20} />
                            ملاحظات على الطلب
                        </h4>
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-sm text-amber-800 whitespace-pre-line">{selectedOrder.notes}</p>
                        </div>
                    </div>
                )}

                {/* Order Timeline */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Clock className="text-brand" size={20} />
                        خط زمني للطلب
                    </h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="w-10 h-10 bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium">تاريخ الطلب</p>
                                <p className="font-bold text-slate-900">{formatDate(selectedOrder.created_at)}</p>
                            </div>
                        </div>
                        {selectedOrder.status_history && selectedOrder.status_history.length > 0 && (
                            selectedOrder.status_history.map((history, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-400 font-medium">{getStatusBadge(history.status)}</p>
                                        <p className="font-bold text-slate-900">{formatDate(history.created_at)}</p>
                                        {history.changed_by && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                بواسطة: {history.changedBy?.name || 'النظام'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Cancel Modal */}
                {showCancelModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                            <h3 className="font-bold text-lg mb-4">سبب الإلغاء</h3>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="اكتب سبب إلغاء الطلب..."
                                className="w-full p-4 border-2 border-slate-100 rounded-xl outline-none focus:border-brand resize-none h-32"
                            />
                            <div className="flex gap-3 mt-6">
                                <Button variant="unstyled"
                                    onClick={handleCancelOrder}
                                    disabled={!cancelReason.trim()}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    تأكيد الإلغاء
                                </Button>
                                <Button variant="unstyled"
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setCancelReason('');
                                        setSelectedOrder(null);
                                    }}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    إلغاء
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Orders List View
    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900">إدارة الطلبات</h1>
                <p className="text-slate-500 mt-1 font-medium">متابعة ومعالجة طلبات العملاء</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border-2 border-amber-100">
                    <p className="text-xs font-bold text-amber-600 mb-1">بانتظار القبول</p>
                    <p className="text-2xl font-black text-slate-900">
                        {orders.filter(o => o.status === 'pending').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-purple-100">
                    <p className="text-xs font-bold text-purple-600 mb-1">قيد التحضير</p>
                    <p className="text-2xl font-black text-slate-900">
                        {orders.filter(o => o.status === 'preparing').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-emerald-100">
                    <p className="text-xs font-bold text-emerald-600 mb-1">جاهز للاستلام</p>
                    <p className="text-2xl font-black text-slate-900">
                        {orders.filter(o => o.status === 'ready').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-green-100">
                    <p className="text-xs font-bold text-green-600 mb-1">مكتملة</p>
                    <p className="text-2xl font-black text-slate-900">
                        {orders.filter(o => ['delivered', 'completed'].includes(o.status)).length}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ابحث عن طلب..."
                            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pr-12 pl-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-brand outline-none transition-all appearance-none cursor-pointer min-w-[200px]"
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">قائمة الطلبات</h3>
                    <span className="text-sm text-slate-400 font-medium">
                        {filteredOrders.length} طلب
                    </span>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
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
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <ShoppingBag size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="font-medium">لا توجد طلبات</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => {
                            const actions = getAvailableActions(order);
                            return (
                                <div
                                    key={order.id}
                                    className="flex items-center gap-5 p-5 bg-slate-50 rounded-2xl hover:bg-white transition-all premium-shadow cursor-pointer"
                                    onClick={() => navigate(`/dashboard/store/orders/${order.id}`)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-black text-slate-500 text-sm">#{order.id}</span>
                                            {getStatusBadge(order.status)}
                                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                                <Clock size={14} />
                                                {new Date(order.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="font-bold text-sm text-slate-700">
                                            {order.items?.slice(0, 2).map(item => item.product_name || item.name).join('، ')}
                                            {order.items?.length > 2 && ` +${order.items.length - 2}`}
                                        </p>
                                        <div className="flex items-center gap-4 mt-1">
                                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                                <User size={12} />
                                                {order.customer?.name}
                                            </p>
                                            <p className="text-xs font-bold text-brand flex items-center gap-1">
                                                <DollarSign size={12} />
                                                {formatPrice(order.total || 0)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {actions.slice(0, 2).map((action, index) => {
                                            const Icon = action.icon;
                                            return (
                                                <Button variant="unstyled"
                                                    key={index}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        action.action();
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${action.color}`}
                                                >
                                                    {action.label}
                                                </Button>
                                            );
                                        })}
                                        <Eye className="text-slate-400 mr-2" size={20} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoreOrders;
