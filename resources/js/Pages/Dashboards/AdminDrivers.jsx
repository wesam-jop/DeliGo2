import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Truck, Phone, MapPin, User, Clock } from 'lucide-react';
import { adminApi } from '../../Services/adminApi';
import DriverDetailsModal from './DriverDetailsModal';
import Button from '../../Components/Button';


const AdminDrivers = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const statusOptions = [
        { value: 'all', label: 'الكل', color: 'bg-slate-100 text-slate-600' },
        { value: 'pending', label: 'بانتظار الموافقة', color: 'bg-amber-100 text-amber-600' },
        { value: 'approved', label: 'مفعّلون', color: 'bg-emerald-100 text-emerald-600' },
        { value: 'rejected', label: 'مرفوضون', color: 'bg-red-100 text-red-600' },
    ];

    useEffect(() => {
        // Only fetch on mount or when statusFilter changes
        let isMounted = true;
        
        const fetchData = async () => {
            try {
                let allDrivers = [];
                
                console.log('Fetching drivers with filter:', statusFilter);
                
                // Fetch pending drivers
                const pendingRes = await adminApi.getPendingDrivers();
                console.log('Pending drivers response:', pendingRes);
                console.log('Pending drivers:', pendingRes.data?.data);
                if (isMounted) allDrivers = [...allDrivers, ...(pendingRes.data?.data || []).map(d => ({...d, status: 'pending'}))];
                
                // Fetch approved drivers
                const approvedRes = await adminApi.getUsers({ role: 'driver', is_approved: true });
                console.log('Approved drivers response:', approvedRes);
                console.log('Approved drivers:', approvedRes.data?.data?.data);
                if (isMounted) {
                    const approvedDrivers = (approvedRes.data?.data?.data || [])
                        .map(d => ({...d, status: 'approved'}));
                    allDrivers = [...allDrivers, ...approvedDrivers];
                }
                
                // Fetch rejected drivers (only if filter is rejected)
                if (isMounted && statusFilter === 'rejected') {
                    const rejectedRes = await adminApi.getUsers({ role: 'driver', is_approved: false });
                    console.log('Rejected drivers response:', rejectedRes);
                    console.log('Rejected drivers:', rejectedRes.data?.data?.data);
                    const rejectedDrivers = (rejectedRes.data?.data?.data || [])
                        .filter(d => d.rejection_reason)
                        .map(d => ({...d, status: 'rejected'}));
                    allDrivers = [...allDrivers, ...rejectedDrivers];
                }
                
                console.log('Total drivers:', allDrivers);
                if (isMounted) {
                    setDrivers(allDrivers);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching drivers:', error);
                if (isMounted) setLoading(false);
            }
        };
        
        fetchData();
        
        return () => {
            isMounted = false;
        };
    }, [statusFilter]);

    const handleApprove = async (driverId) => {
        try {
            await adminApi.approveDriver(driverId);
            // Refetch after approval
            setStatusFilter('all');
        } catch (error) {
            console.error('Error approving driver:', error);
            alert('حدث خطأ أثناء الموافقة على السائق');
        }
    };

    const handleReject = async () => {
        if (!selectedDriver || !rejectReason.trim()) return;
        
        try {
            await adminApi.rejectDriver(selectedDriver, rejectReason);
            setShowRejectModal(false);
            setRejectReason('');
            setStatusFilter('all');
        } catch (error) {
            console.error('Error rejecting driver:', error);
            alert('حدث خطأ أثناء رفض السائق');
        }
    };

    const handleViewDetails = (driver) => {
        setSelectedDriver(driver);
        setShowModal(true);
    };

    const filteredDrivers = drivers.filter(driver => {
        // Filter by status
        if (statusFilter !== 'all' && driver.status !== statusFilter) {
            return false;
        }
        
        // Filter by search term
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            driver.name?.toLowerCase().includes(search) ||
            driver.phone?.toLowerCase().includes(search) ||
            driver.area?.name_ar?.toLowerCase().includes(search)
        );
    });

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900">إدارة السائقين</h1>
                <p className="text-slate-500 mt-1 font-medium">عرض والموافقة على السائقين الجدد</p>
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
                            placeholder="ابحث عن سائق..."
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
                <Button variant="unstyled"
                    key="all-stats"
                    onClick={() => setStatusFilter('all')}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                        statusFilter === 'all'
                            ? 'border-brand bg-pink-50'
                            : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                >
                    <p className="text-xs font-bold text-slate-500 mb-1">الإجمالي</p>
                    <p className="text-2xl font-black text-slate-900">
                        {drivers.length}
                    </p>
                </Button>
                <Button variant="unstyled"
                    key="pending-stats"
                    onClick={() => setStatusFilter('pending')}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                        statusFilter === 'pending'
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-amber-100 bg-white hover:border-amber-200'
                    }`}
                >
                    <p className="text-xs font-bold text-amber-600 mb-1">بانتظار الموافقة</p>
                    <p className="text-2xl font-black text-slate-900">
                        {drivers.filter(d => d.status === 'pending').length}
                    </p>
                </Button>
                <Button variant="unstyled"
                    key="approved-stats"
                    onClick={() => setStatusFilter('approved')}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                        statusFilter === 'approved'
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-emerald-100 bg-white hover:border-emerald-200'
                    }`}
                >
                    <p className="text-xs font-bold text-emerald-600 mb-1">مفعّلون</p>
                    <p className="text-2xl font-black text-slate-900">
                        {drivers.filter(d => d.status === 'approved').length}
                    </p>
                </Button>
                <Button variant="unstyled"
                    key="rejected-stats"
                    onClick={() => setStatusFilter('rejected')}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                        statusFilter === 'rejected'
                            ? 'border-red-500 bg-red-50'
                            : 'border-red-100 bg-white hover:border-red-200'
                    }`}
                >
                    <p className="text-xs font-bold text-red-600 mb-1">مرفوضون</p>
                    <p className="text-2xl font-black text-slate-900">
                        {drivers.filter(d => d.status === 'rejected').length}
                    </p>
                </Button>
            </div>

            {/* Drivers Grid */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">قائمة السائقين</h3>
                    <span className="text-sm text-slate-400 font-medium">
                        {filteredDrivers.length} سائق
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
                ) : filteredDrivers.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Truck size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="font-medium">لا توجد سائقون</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDrivers.map((driver) => (
                            <div 
                                key={`${driver.id}-${driver.status}`} 
                                className="bg-white border-2 border-slate-100 rounded-2xl p-6 hover:border-blue-200 transition-all cursor-pointer"
                                onClick={() => handleViewDetails(driver)}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl ${
                                        driver.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                        driver.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                        'bg-red-100 text-red-600'
                                    }`}>
                                        {driver.name?.charAt(0) || 'D'}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        driver.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                        driver.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                        'bg-red-100 text-red-600'
                                    }`}>
                                        {driver.status === 'pending' ? 'بانتظار الموافقة' :
                                         driver.status === 'approved' ? 'مفعّل' : 'مرفوض'}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="space-y-3 mb-4">
                                    <div>
                                        <p className="font-bold text-slate-900">{driver.name}</p>
                                        <p className="text-xs text-slate-400">{driver.phone}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <MapPin size={14} />
                                        <span className="truncate">{driver.area?.name_ar || driver.governorate?.name_ar || 'غير محدد'}</span>
                                    </div>
                                    {driver.is_online !== undefined && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <div className={`w-2 h-2 rounded-full ${driver.is_online ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                            <span className={driver.is_online ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                                                {driver.is_online ? 'متاح الآن' : 'غير متاح'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                {driver.status === 'pending' && (
                                    <div className="flex gap-2 pt-4 border-t border-slate-100">
                                        <Button variant="unstyled"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleApprove(driver.id);
                                            }}
                                            className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={16} /> قبول
                                        </Button>
                                        <Button variant="unstyled"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedDriver(driver.id);
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
                            placeholder="اكتب سبب رفض السائق..."
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
                                    setSelectedDriver(null);
                                }}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                            >
                                إلغاء
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Driver Details Modal */}
            {showModal && selectedDriver && (
                <DriverDetailsModal
                    driver={selectedDriver}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedDriver(null);
                    }}
                />
            )}
        </div>
    );
};

export default AdminDrivers;
