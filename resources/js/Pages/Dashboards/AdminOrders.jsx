import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, X, Package, Clock, CheckCircle, Truck, AlertCircle } from 'lucide-react';
import { adminApi } from '../../Services/adminApi';
import OrderDetailsModal from './OrderDetailsModal';
import Button from '../../Components/Button';


const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const statusOptions = [
        { value: 'all', label: 'الكل', color: 'bg-slate-100 text-slate-600' },
        { value: 'pending', label: 'قيد الانتظار', color: 'bg-amber-100 text-amber-600' },
        { value: 'accepted_by_driver', label: 'تم قبول السائق', color: 'bg-indigo-100 text-indigo-600' },
        { value: 'confirmed', label: 'تم التأكيد', color: 'bg-blue-100 text-blue-600' },
        { value: 'preparing', label: 'قيد التحضير', color: 'bg-purple-100 text-purple-600' },
        { value: 'ready', label: 'جاهز للاستلام', color: 'bg-indigo-100 text-indigo-600' },
        { value: 'picked_up', label: 'تم الاستلام', color: 'bg-cyan-100 text-cyan-600' },
        { value: 'delivered', label: 'مكتمل', color: 'bg-emerald-100 text-emerald-600' },
        { value: 'cancelled', label: 'ملغي', color: 'bg-red-100 text-red-600' },
    ];

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const fetchOrders = async () => {
        try {
            const params = statusFilter !== 'all' ? { status: statusFilter } : {};
            const response = await adminApi.getOrders(params);
            setOrders(response.data.data?.data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (orderId) => {
        try {
            const response = await adminApi.getOrder(orderId);
            setSelectedOrder(response.data.data);
            setShowModal(true);
        } catch (error) {
            console.error('Error fetching order details:', error);
            alert('حدث خطأ أثناء تحميل تفاصيل الطلب');
        }
    };

    const formatPrice = (price) => {
        return `${parseFloat(price).toLocaleString('ar-IQ')} $`;
    };

    const filteredOrders = orders.filter(order => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            order.customer?.name?.toLowerCase().includes(search) ||
            order.id.toString().includes(search) ||
            order.address?.address_details?.toLowerCase().includes(search)
        );
    });

    const getStatusColor = (status) => {
        const option = statusOptions.find(opt => opt.value === status);
        return option?.color || 'bg-slate-100 text-slate-600';
    };

    const getStatusText = (status) => {
        const option = statusOptions.find(opt => opt.value === status);
        return option?.label || status;
    };

    const getStatusIcon = (status) => {
        const icons = {
            'pending': Clock,
            'accepted_by_driver': Truck,
            'confirmed': CheckCircle,
            'preparing': Package,
            'ready': CheckCircle,
            'picked_up': Truck,
            'delivered': CheckCircle,
            'cancelled': AlertCircle,
        };
        const Icon = icons[status] || Clock;
        return <Icon size={14} />;
    };

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900">إدارة الطلبات</h1>
                <p className="text-slate-500 mt-1 font-medium">عرض وإدارة جميع طلبات المنصة</p>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statusOptions.slice(1).map(option => {
                    const count = orders.filter(o => o.status === option.value).length;
                    return (
                        <Button variant="unstyled"
                            key={option.value}
                            onClick={() => setStatusFilter(option.value)}
                            className={`p-4 rounded-2xl border-2 transition-all ${statusFilter === option.value
                                    ? 'border-brand bg-pink-50'
                                    : 'border-slate-100 bg-white hover:border-slate-200'
                                }`}
                        >
                            <p className={`text-xs font-bold mb-1 ${option.color}`}>{option.label}</p>
                            <p className="text-2xl font-black text-slate-900">{count}</p>
                        </Button>
                    );
                })}
            </div>

            {/* Orders Table */}
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
                            <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Package size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="font-medium">لا توجد طلبات</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="text-slate-400 text-xs font-bold border-b border-slate-100">
                                    <th className="pb-4 font-bold">رقم الطلب</th>
                                    <th className="pb-4 font-bold">الزبون</th>
                                    <th className="pb-4 font-bold">العنوان</th>
                                    <th className="pb-4 font-bold">المبلغ</th>
                                    <th className="pb-4 font-bold">الحالة</th>
                                    <th className="pb-4 font-bold">التاريخ</th>
                                    <th className="pb-4 font-bold">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer"
                                        onClick={() => handleViewDetails(order.id)}
                                    >
                                        <td className="py-4 font-black text-slate-500 text-sm">#{order.id}</td>
                                        <td className="py-4 font-bold text-sm">
                                            <div>
                                                <p className="text-slate-900">{order.customer?.name || 'زبون'}</p>
                                                <p className="text-xs text-slate-400">{order.customer?.phone}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm text-slate-500 max-w-[200px] truncate">
                                            {order.address?.address_details || 'لا يوجد عنوان'}
                                        </td>
                                        <td className="py-4 font-black text-sm">
                                            {formatPrice(order.total || 0)}
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {getStatusText(order.status)}
                                            </span>
                                        </td>
                                        <td className="py-4 text-sm text-slate-500">
                                            {new Date(order.created_at).toLocaleDateString('ar-SY')}
                                        </td>
                                        <td className="py-4">
                                            <Button variant="unstyled"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewDetails(order.id);
                                                }}
                                                className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-pink-100 hover:text-pink-600 transition-all"
                                            >
                                                <Eye size={18} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {showModal && selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedOrder(null);
                        fetchOrders();
                    }}
                />
            )}
        </div>
    );
};

export default AdminOrders;
