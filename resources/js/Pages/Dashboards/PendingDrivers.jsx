import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { adminApi } from '../../Services/adminApi';
import Button from '../../Components/Button';


const PendingDrivers = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchPendingDrivers();
    }, []);

    const fetchPendingDrivers = async () => {
        try {
            const response = await adminApi.getPendingDrivers();
            setDrivers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching pending drivers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (driverId) => {
        try {
            await adminApi.approveDriver(driverId);
            fetchPendingDrivers();
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
            fetchPendingDrivers();
        } catch (error) {
            console.error('Error rejecting driver:', error);
            alert('حدث خطأ أثناء رفض السائق');
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 premium-shadow">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-100 rounded w-1/3"></div>
                    <div className="h-20 bg-slate-100 rounded"></div>
                    <div className="h-20 bg-slate-100 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 premium-shadow">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">سائقون بانتظار الموافقة</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                    {drivers.length} طلبات
                </span>
            </div>
            
            {drivers.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500" />
                    <p className="font-medium">لا توجد سائقون بانتظار الموافقة</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {drivers.map((driver) => (
                        <div key={driver.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-blue-50 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-slate-400 premium-shadow">
                                    {driver.name?.charAt(0) || 'D'}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{driver.name}</p>
                                    <p className="text-xs text-slate-400">{driver.phone}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="unstyled" 
                                    onClick={() => handleApprove(driver.id)}
                                    className="px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all flex items-center gap-1"
                                >
                                    <CheckCircle size={14} /> قبول
                                </Button>
                                <Button variant="unstyled" 
                                    onClick={() => {
                                        setSelectedDriver(driver.id);
                                        setShowRejectModal(true);
                                    }}
                                    className="px-3 py-1.5 bg-red-100 text-red-500 rounded-xl text-xs font-bold hover:bg-red-200 transition-all flex items-center gap-1"
                                >
                                    <XCircle size={14} /> رفض
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
        </div>
    );
};

export default PendingDrivers;
