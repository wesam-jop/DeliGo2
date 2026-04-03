import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ShoppingBag,
    MapPin,
    Phone,
    User,
    Clock,
    DollarSign,
    CheckCircle,
    Navigation,
    ChevronLeft,
    Package,
    AlertCircle,
    Truck,
    FileText
} from 'lucide-react';
import { driverApi } from '../../Services/driverApi';
import LeafletMapDisplay from '../../Components/LeafletMapDisplay';
import Button from '../../Components/Button';


const DriverOrders = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filter, setFilter] = useState('current'); // current, history, available

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
            let response;

            if (filter === 'current') {
                response = await driverApi.getCurrentOrders();
            } else if (filter === 'history') {
                response = await driverApi.getOrderHistory();
            } else {
                response = await driverApi.getAvailableOrders();
            }

            const ordersData = response.data.data || [];
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
            // For now, use current orders and find the order
            const response = await driverApi.getCurrentOrders();
            const ordersData = response.data.data || [];
            const order = ordersData.find(o => o.id === parseInt(orderId));
            setSelectedOrder(order);
        } catch (error) {
            console.error('Error fetching order details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptOrder = async (orderId) => {
        if (!confirm('هل أنت متأكد من قبول هذا الطلب؟')) return;

        try {
            await driverApi.acceptOrder(orderId);
            alert('تم قبول الطلب بنجاح!');
            fetchOrders();
            if (selectedOrder) navigate('/dashboard/driver/orders');
        } catch (error) {
            console.error('Error accepting order:', error);
            alert('حدث خطأ أثناء قبول الطلب');
        }
    };

    const handleMarkPickedUp = async (orderId) => {
        try {
            await driverApi.markAsPickedUp(orderId);
            alert('تم تأكيد استلام الطلب من المتجر');
            fetchOrders();
            if (selectedOrder) fetchOrderDetails();
        } catch (error) {
            console.error('Error marking as picked up:', error);
            alert('حدث خطأ أثناء تأكيد الاستلام');
        }
    };

    const handleMarkDelivered = async (orderId) => {
        try {
            await driverApi.markAsDelivered(orderId);
            alert('تم تسليم الطلب بنجاح!');
            fetchOrders();
            if (selectedOrder) navigate('/dashboard/driver/orders');
        } catch (error) {
            console.error('Error marking as delivered:', error);
            alert('حدث خطأ أثناء تأكيد التسليم');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: 'بانتظار القبول', color: 'bg-amber-100 text-amber-600' },
            accepted_by_driver: { label: 'تم القبول', color: 'bg-blue-100 text-blue-600' },
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
        return (
            <div className="space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="unstyled"
                        onClick={() => navigate('/dashboard/driver/orders')}
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
                    </div>

                    {/* Order Notes */}
                    {selectedOrder.notes && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-sm italic flex gap-3 items-start">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <span>{selectedOrder.notes}</span>
                        </div>
                    )}

                    {/* Customer Info */}
                    <div className="border-t border-slate-100 pt-6">
                        <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <User className="text-brand" size={20} />
                            معلومات الزبون
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
                        </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="border-t border-slate-100 pt-6 mt-6">
                        <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <MapPin className="text-brand" size={20} />
                            عنوان التوصيل
                        </h4>
                        <p className="text-slate-600 font-medium">
                            {selectedOrder.delivery_address || selectedOrder.address?.address_details || 'غير متوفر'}
                        </p>

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
                                <span>المجموع</span>
                                <span>{formatPrice(selectedOrder.total || 0)}</span>
                            </div>
                            {selectedOrder.delivery_fee > 0 && (
                                <div className="flex justify-between text-emerald-600 font-bold">
                                    <span>ربح التوصيل</span>
                                    <span>{formatPrice(selectedOrder.delivery_fee)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-slate-100">
                        {selectedOrder.status === 'pending' && (
                            <Button variant="unstyled"
                                onClick={() => handleAcceptOrder(selectedOrder.id)}
                                className="flex-1 py-4 bg-gradient-to-r from-brand to-rose-500 text-white rounded-2xl font-bold hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg"
                            >
                                قبول الطلب
                            </Button>
                        )}
                        {selectedOrder.status === 'accepted_by_driver' && (
                            <div className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-bold flex items-center justify-center gap-2">
                                <Clock size={20} />
                                بانتظار قبول المتجر
                            </div>
                        )}
                        {selectedOrder.status === 'confirmed' && (
                            <div className="flex-1 py-4 bg-amber-50 text-amber-600 rounded-2xl font-bold flex items-center justify-center gap-2">
                                <Clock size={20} />
                                المتجر يجهّز الطلب
                            </div>
                        )}
                        {selectedOrder.status === 'preparing' && (
                            <div className="flex-1 py-4 bg-purple-50 text-purple-600 rounded-2xl font-bold flex items-center justify-center gap-2">
                                <Package size={20} />
                                الطلب قيد التحضير
                            </div>
                        )}
                        {selectedOrder.status === 'ready' && (
                            <Button variant="unstyled"
                                onClick={() => handleMarkPickedUp(selectedOrder.id)}
                                className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl font-bold hover:from-emerald-600 hover:to-green-600 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <Truck size={20} />
                                استلام الطلب
                            </Button>
                        )}
                        {selectedOrder.status === 'picked_up' && (
                            <Button variant="unstyled"
                                onClick={() => handleMarkDelivered(selectedOrder.id)}
                                className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-bold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={20} />
                                تأكيد التسليم
                            </Button>
                        )}
                        {selectedOrder.status === 'delivered' && (
                            <div className="flex-1 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold flex items-center justify-center gap-2">
                                <CheckCircle size={20} />
                                تم تسليم الطلب بنجاح
                            </div>
                        )}
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedOrder.address?.latitude || ''},${selectedOrder.address?.longitude || ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                        >
                            <Navigation size={20} />
                            خريطة
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // Orders List View
    const filterTabs = [
        { id: 'available', label: 'الطلبات المتاحة', icon: ShoppingBag, color: 'text-amber-600' },
        { id: 'current', label: 'الطلبات الحالية', icon: Package, color: 'text-blue-600' },
        { id: 'history', label: 'سجل الطلبات', icon: Clock, color: 'text-slate-600' },
    ];

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900">إدارة الطلبات</h1>
                <p className="text-slate-500 mt-1 font-medium">تصفح وقبول وإدارة طلبات التوصيل</p>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white p-2 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex gap-2">
                    {filterTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <Button variant="unstyled"
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${filter === tab.id
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
                    <h3 className="font-bold text-lg">قائمة الطلبات</h3>
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
                            {filter === 'available' ? 'لا توجد طلبات متاحة حالياً' :
                                filter === 'current' ? 'لا توجد طلبات حالية' :
                                    'لا يوجد سجل طلبات'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="p-5 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-lg transition-all border-2 border-transparent hover:border-pink-200 cursor-pointer"
                                onClick={() => navigate(`/dashboard/driver/orders/${order.id}`)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-black text-slate-500 text-sm">#{order.id}</span>
                                            {getStatusBadge(order.status)}
                                        </div>
                                        <p className="font-bold text-slate-900">
                                            {order.customer?.name || 'زبون'}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                            <MapPin size={14} />
                                            <span className="truncate max-w-[200px]">
                                                {order.delivery_address || order.address?.address_details}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-brand text-lg">
                                            {formatPrice(order.total || 0)}
                                        </p>
                                        {order.delivery_fee > 0 && (
                                            <p className="text-xs text-emerald-600 font-bold mt-1">
                                                +{formatPrice(order.delivery_fee)} ربح
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                                    <Clock size={14} />
                                    <span>{formatDate(order.created_at)}</span>
                                </div>

                                {filter === 'available' && (
                                    <Button variant="unstyled"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAcceptOrder(order.id);
                                        }}
                                        className="w-full py-3 bg-gradient-to-r from-brand to-rose-500 text-white rounded-xl font-bold hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg"
                                    >
                                        قبول الطلب
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverOrders;
