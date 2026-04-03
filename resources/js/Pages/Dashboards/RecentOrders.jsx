import React, { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { adminApi } from '../../Services/adminApi';

const RecentOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await adminApi.getOrders({ limit: 5 });
                setOrders(response.data.data?.data || []);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-amber-100 text-amber-600',
            'confirmed': 'bg-blue-100 text-blue-600',
            'preparing': 'bg-purple-100 text-purple-600',
            'ready': 'bg-indigo-100 text-indigo-600',
            'picked_up': 'bg-blue-100 text-blue-600',
            'delivered': 'bg-emerald-100 text-emerald-600',
            'accepted_by_driver': 'bg-indigo-100 text-indigo-600',
            'cancelled': 'bg-red-100 text-red-600',
        };
        return colors[status] || 'bg-slate-100 text-slate-600';
    };

    const getStatusText = (status) => {
        const texts = {
            'pending': 'قيد الانتظار',
            'confirmed': 'تم التأكيد',
            'preparing': 'قيد التحضير',
            'ready': 'جاهز للاستلام',
            'picked_up': 'تم الاستلام',
            'delivered': 'مكتمل',
            'accepted_by_driver': 'تم قبول السائق',
            'cancelled': 'ملغي',
        };
        return texts[status] || status;
    };

    if (loading) {
        return (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 premium-shadow">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-100 rounded w-1/4"></div>
                    <div className="h-20 bg-slate-100 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 premium-shadow">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">آخر الطلبات</h3>
                <a href="/dashboard/orders" className="text-sm text-brand font-bold hover:underline flex items-center gap-1">
                    عرض الكل <ArrowUpRight size={16} />
                </a>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <p className="font-medium">لا توجد طلبات حديثة</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="text-slate-400 text-xs font-bold border-b border-slate-100">
                                <th className="pb-4 font-bold">رقم الطلب</th>
                                <th className="pb-4 font-bold">الزبون</th>
                                <th className="pb-4 font-bold">المبلغ</th>
                                <th className="pb-4 font-bold">الحالة</th>
                                <th className="pb-4 font-bold">التاريخ</th>
                            </tr>
                        </thead>
                        <tbody className="space-y-4">
                            {orders.map((order) => (
                                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50 transition-all">
                                    <td className="py-4 font-black text-slate-500 text-sm">#{order.id}</td>
                                    <td className="py-4 font-bold text-sm">{order.customer?.name || 'زبون'}</td>
                                    <td className="py-4 font-black text-sm">{order.total_amount?.toLocaleString() || '0'} $</td>
                                    <td className="py-4">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                            {getStatusText(order.status)}
                                        </span>
                                    </td>
                                    <td className="py-4 text-sm text-slate-500">
                                        {new Date(order.created_at).toLocaleDateString('ar-SY')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RecentOrders;
