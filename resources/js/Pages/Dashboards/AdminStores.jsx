import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, Store, MapPin, Phone, User, Clock } from 'lucide-react';
import { adminApi } from '../../Services/adminApi';
import StoreDetailsModal from './StoreDetailsModal';
import Button from '../../Components/Button';


const AdminStores = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedStore, setSelectedStore] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const statusOptions = [
        { value: 'all', label: 'الكل', color: 'bg-slate-100 text-slate-600' },
        { value: 'pending', label: 'بانتظار الموافقة', color: 'bg-amber-100 text-amber-600' },
        { value: 'approved', label: 'مفعّلة', color: 'bg-emerald-100 text-emerald-600' },
        { value: 'rejected', label: 'مرفوضة', color: 'bg-red-100 text-red-600' },
    ];

    useEffect(() => {
        fetchStores();
    }, [statusFilter]);

    const fetchStores = async () => {
        try {
            let allStores = [];
            
            if (statusFilter === 'all' || statusFilter === 'pending') {
                const pendingRes = await adminApi.getPendingStores();
                allStores = [...allStores, ...(pendingRes.data.data || []).map(s => ({...s, status: 'pending'}))];
            }
            
            if (statusFilter === 'all' || statusFilter === 'approved') {
                const response = await adminApi.get('/stores', { params: { limit: 100 } });
                const approvedStores = (response.data.data?.data || [])
                    .filter(s => s.is_approved)
                    .map(s => ({...s, status: 'approved'}));
                allStores = [...allStores, ...approvedStores];
            }
            
            setStores(allStores);
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (storeId) => {
        try {
            await adminApi.approveStore(storeId);
            fetchStores();
        } catch (error) {
            console.error('Error approving store:', error);
            alert('حدث خطأ أثناء الموافقة على المتجر');
        }
    };

    const handleReject = async () => {
        if (!selectedStore || !rejectReason.trim()) return;
        
        try {
            await adminApi.rejectStore(selectedStore, rejectReason);
            setShowRejectModal(false);
            setRejectReason('');
            fetchStores();
        } catch (error) {
            console.error('Error rejecting store:', error);
            alert('حدث خطأ أثناء رفض المتجر');
        }
    };

    const handleViewDetails = async (store) => {
        setSelectedStore(store);
        setShowModal(true);
    };

    const filteredStores = stores.filter(store => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            store.name?.toLowerCase().includes(search) ||
            store.owner?.name?.toLowerCase().includes(search) ||
            store.category?.toLowerCase().includes(search) ||
            (typeof store.category === 'object' ? store.category?.name_ar?.toLowerCase().includes(search) : false) ||
            store.address_details?.toLowerCase().includes(search)
        );
    });

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900">إدارة المتاجر</h1>
                <p className="text-slate-500 mt-1 font-medium">عرض والموافقة على المتاجر الجديدة</p>
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
                            placeholder="ابحث عن متجر..."
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border-2 border-amber-100">
                    <p className="text-xs font-bold text-amber-600 mb-1">بانتظار الموافقة</p>
                    <p className="text-2xl font-black text-slate-900">
                        {stores.filter(s => s.status === 'pending').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-emerald-100">
                    <p className="text-xs font-bold text-emerald-600 mb-1">مفعّلة</p>
                    <p className="text-2xl font-black text-slate-900">
                        {stores.filter(s => s.status === 'approved').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-red-100">
                    <p className="text-xs font-bold text-red-600 mb-1">مرفوضة</p>
                    <p className="text-2xl font-black text-slate-900">
                        {stores.filter(s => s.status === 'rejected').length}
                    </p>
                </div>
            </div>

            {/* Stores Grid */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">قائمة المتاجر</h3>
                    <span className="text-sm text-slate-400 font-medium">
                        {filteredStores.length} متجر
                    </span>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="animate-pulse bg-slate-50 rounded-2xl p-6">
                                <div className="h-20 bg-slate-200 rounded-xl mb-4"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredStores.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Store size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="font-medium">لا توجد متاجر</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStores.map((store) => (
                            <div 
                                key={store.id} 
                                className="bg-white border-2 border-slate-100 rounded-2xl p-6 hover:border-pink-200 transition-all cursor-pointer"
                                onClick={() => handleViewDetails(store)}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl ${
                                        store.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                        store.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                        'bg-red-100 text-red-600'
                                    }`}>
                                        {store.name?.charAt(0) || 'S'}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        store.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                        store.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                        'bg-red-100 text-red-600'
                                    }`}>
                                        {store.status === 'pending' ? 'بانتظار الموافقة' :
                                         store.status === 'approved' ? 'مفعّل' : 'مرفوض'}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="space-y-3 mb-4">
                                    <div>
                                        <p className="font-bold text-slate-900">{store.name}</p>
                                        <p className="text-xs text-slate-400">
                                            {typeof store.category === 'string' ? store.category : (store.category?.name_ar || store.category?.name || 'غير محدد')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <User size={14} />
                                        <span>{store.owner?.name || 'صاحب المتجر'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <MapPin size={14} />
                                        <span className="truncate">{store.area?.name_ar || store.address_details}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {store.status === 'pending' && (
                                    <div className="flex gap-2 pt-4 border-t border-slate-100">
                                        <Button variant="unstyled"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleApprove(store.id);
                                            }}
                                            className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={16} /> قبول
                                        </Button>
                                        <Button variant="unstyled"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedStore(store.id);
                                                setShowRejectModal(true);
                                            }}
                                            className="flex-1 py-2.5 bg-red-100 text-red-500 rounded-xl font-bold hover:bg-red-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={16} /> رفض
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <h3 className="font-bold text-lg mb-4">سبب الرفض</h3>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="اكتب سبب رفض المتجر..."
                            className="w-full p-4 border-2 border-slate-100 rounded-xl outline-none focus:border-brand resize-none h-32"
                        />
                        <div className="flex gap-3 mt-6">
                            <Button variant="unstyled"
                                onClick={handleReject}
                                disabled={!rejectReason.trim()}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                تأكيد الرفض
                            </Button>
                            <Button variant="unstyled"
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                    setSelectedStore(null);
                                }}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                            >
                                إلغاء
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Store Details Modal */}
            {showModal && selectedStore && (
                <StoreDetailsModal
                    store={selectedStore}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedStore(null);
                    }}
                />
            )}
        </div>
    );
};

export default AdminStores;
